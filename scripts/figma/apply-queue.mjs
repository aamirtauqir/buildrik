/**
 * Spend the Figma MCP daily allowance on writes, not on looking around.
 *
 * The budget is 200 tool calls per DAY and 15 per minute (Professional plan,
 * Full seat). It is shared across every agent and every session on the account,
 * and a read costs exactly what a write costs. On 2026-09-07 fifteen parallel
 * agents spent the whole day's 200 on reconnaissance and applied nothing — the
 * plans were all written, the file was untouched, and the allowance was gone.
 * This exists so that never happens twice.
 *
 * Three things it does that hand-rolled appliers here have not:
 *
 *  1. BATCHES. One call carries as many rows as fit under the payload cap
 *     instead of one row per call. Six text rows per call turns 294 rows from
 *     294 calls (impossible in a day) into ~49 (a quarter of the allowance).
 *  2. READS BACK IN THE SAME CALL. A separate verify pass doubles the cost of
 *     everything. The write and its proof are one call, and the proof is the
 *     node's own post-write value, not the fact that the call returned.
 *  3. STOPS ON BUDGET AND RESUMES. Every row's outcome is persisted as it
 *     lands. Re-running skips what is done and continues from the first row
 *     that is not, so an exhausted window costs a pause and not a redo.
 *
 * It refuses to guess. A row whose node does not currently hold its `expect`
 * string is REFUSED, not applied — that guard is what stops a stale plan from
 * overwriting somebody else's newer copy, the one failure a rename cannot undo.
 *
 * Usage:
 *   node scripts/figma/apply-queue.mjs                      # dry run, costs 0 calls
 *   node scripts/figma/apply-queue.mjs --apply
 *   node scripts/figma/apply-queue.mjs --apply --budget=120
 *   node scripts/figma/apply-queue.mjs --apply --only=insert,pages
 *   node scripts/figma/apply-queue.mjs --status             # what is left, costs 0 calls
 *
 * Plan rows (any plan file under docs/design-jobs/V2-TO-V1/plans/):
 *   { "op":"text",    "id":"172:3", "text":"...", "expect":"prefix", "width":248, "why":"UX-A-05" }
 *   { "op":"rename",  "id":"137:2", "name":"... [not-implemented]", "expect":"..." }
 *   { "op":"resize",  "id":"163:167", "h":60 }
 *   { "op":"fill",    "id":"2429:11904", "hex":"#111827" }
 *   { "op":"hotspot", "over":"2430:11955", "to":"2430:11959", "name":"hotspot/add", "pad":8 }
 * Optional per row: "page":"1:6" (defaults to 1:3 — the client-review family is
 * canonical on 1:6, and a node id alone does not say which page it lives on).
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const QUEUE = (process.argv.find((a) => a.startsWith("--queue=")) || "--queue=docs/design-jobs/V2-TO-V1/queue.json").split("=")[1];
const STATE = (process.argv.find((a) => a.startsWith("--state=")) || "--state=docs/design-jobs/V2-TO-V1/queue-state.json").split("=")[1];
const DEFAULT_PAGE = "1:3";

/* 15/min is the ceiling; 4.5s spacing sits under it with room for the round
   trip itself, which is not free. Going closer buys nothing — the daily cap
   binds long before the per-minute one does. */
const SPACING_MS = 4500;
/* The response cap is near 20,000 chars and a rejected payload has been
   reported as a success in this repo. Stay well under it and check. */
const MAX_PAYLOAD = 11000;

const APPLY = process.argv.includes("--apply");
const STATUS_ONLY = process.argv.includes("--status");
const BUDGET = Number((process.argv.find((a) => a.startsWith("--budget=")) || "--budget=180").split("=")[1]);
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "--only=").split("=")[1]
  .split(",").map((s) => s.trim()).filter(Boolean);

const OPS = new Set(["text", "rename", "resize", "fill", "hotspot", "move", "delete",
                     "add-text", "add-rect", "add-caption", "append-text", "rewire", "clone-node",
                     /* added 2026-09-07: each unblocks a repair row that was held
                        for want of the op, not for want of a decision. */
                     "font-size", "insert-text", "hug-width", "fill-gradient", "opacity", "set-prop"]);

/* ---------- load plans ---------- */

/* Reads the NORMALIZED queue, not the raw plans. normalize-plans.mjs is what
   turns thirteen agents' six schemas into one, and running this against the raw
   directory reads four rows out of four hundred while reporting a clean five-call
   dry run — which is exactly the shape of a null result being mistaken for an
   answer. Run the normalizer first; this refuses to guess. */
function loadRows() {
  if (!fs.existsSync(QUEUE)) {
    console.error(`no ${QUEUE} — run: node scripts/figma/normalize-plans.mjs`);
    process.exit(1);
  }
  const doc = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
  const out = [];
  for (const r of doc.rows || []) {
    const slug = r.slug || "?";
    if (ONLY.length && !ONLY.some((o) => slug.startsWith(o))) continue;
    const rec = { key: r.key, slug, page: r.page || DEFAULT_PAGE, row: r };
    /* A row an author deliberately withheld must not execute because it happens
       to carry a real op. Two independent plans this arc marked rows `hold` and
       then had to smuggle them past the queue — one renamed the op, one moved
       them to a sibling key — because nothing here honoured the flag. Honour it. */
    if (r.hold) { out.push({ ...rec, bad: `held by its author: ${r.holdWhy || r.why || "no reason given"}` }); continue; }
    if (!OPS.has(r.op)) { out.push({ ...rec, bad: `op "${r.op}" is not executable here — it has its own script` }); continue; }
    if (r.unresolved) { out.push({ ...rec, bad: "unresolved node id — run resolve-selectors first" }); continue; }
    const anchor = r.id || r.over || r.parent || r.board;
    if (!anchor) { out.push({ ...rec, bad: "no node id" }); continue; }
    out.push(rec);
  }
  return out;
}

/* ---------- state ---------- */

const today = new Date().toISOString().slice(0, 10);
let state = fs.existsSync(STATE)
  ? JSON.parse(fs.readFileSync(STATE, "utf8"))
  : { rows: {}, spend: {} };
state.rows ||= {};
state.spend ||= {};
state.spend[today] ||= 0;
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1));

/* ---------- the per-op scripts, written once and reused ---------- */

const hexToRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
});

/* Each builder returns JS that mutates, then READS THE NODE BACK and pushes a
   tab-separated outcome line. The read-back is the point: a call that returned
   is not a change that landed. */
const BUILD = {
  text: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, String(x.row.text), x.row.expect ?? null, x.row.width ?? 0]))};
for(const [key,id,want,expect,width] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(n.type!=="TEXT"){ out.push(key+"\\tNOTTEXT\\t"+n.type); continue; }
  const had=n.characters;
  if(had===want){ out.push(key+"\\tSAME\\t"+had.slice(0,80)); continue; }
  if(expect && had.indexOf(expect)!==0){ out.push(key+"\\tREFUSED\\thas: "+had.slice(0,80)); continue; }
  ${APPLY ? `
  for(const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
  if(typeof n.fontName==="object") await figma.loadFontAsync(n.fontName);
  if(width){ n.textAutoResize="HEIGHT"; n.resize(width, n.height); }
  n.characters=want;
  const back=(await figma.getNodeByIdAsync(id)).characters;
  out.push(key+(back===want?"\\tOK\\t":"\\tDRIFT\\t")+back.slice(0,120));` : `
  out.push(key+"\\tDRY\\twould set: "+want.slice(0,80));`}
}`,

  rename: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, String(x.row.name), x.row.expect ?? null]))};
for(const [key,id,want,expect] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  const had=n.name;
  if(had===want){ out.push(key+"\\tSAME\\t"+had.slice(0,80)); continue; }
  if(expect && had.indexOf(expect)!==0){ out.push(key+"\\tREFUSED\\thas: "+had.slice(0,80)); continue; }
  ${APPLY ? `
  n.name=want;
  const back=(await figma.getNodeByIdAsync(id)).name;
  out.push(key+(back===want?"\\tOK\\t":"\\tDRIFT\\t")+back.slice(0,120));` : `
  out.push(key+"\\tDRY\\twould name: "+want.slice(0,80));`}
}`,

  resize: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, x.row.w ?? 0, x.row.h ?? 0]))};
for(const [key,id,w,h] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(typeof n.resize!=="function"){ out.push(key+"\\tNORESIZE\\t"+n.type); continue; }
  const tw=w||n.width, th=h||n.height;
  if(Math.round(n.width)===Math.round(tw) && Math.round(n.height)===Math.round(th)){
    out.push(key+"\\tSAME\\t"+Math.round(n.width)+"x"+Math.round(n.height)); continue; }
  ${APPLY ? `
  /* A TEXT node in the default WIDTH_AND_HEIGHT mode sizes itself from its
     content and IGNORES resize(), so the call returns and nothing moves. Switch
     to HEIGHT first: width becomes ours, height stays the content's. */
  if(n.type==="TEXT" && n.textAutoResize==="WIDTH_AND_HEIGHT") n.textAutoResize="HEIGHT";
  n.resize(tw, n.type==="TEXT" ? n.height : th);
  const b=await figma.getNodeByIdAsync(id);
  const ok=Math.round(b.width)===Math.round(tw) && (n.type==="TEXT" || Math.round(b.height)===Math.round(th));
  out.push(key+(ok?"\\tOK\\t":"\\tDRIFT\\t")+Math.round(b.width)+"x"+Math.round(b.height));` : `
  out.push(key+"\\tDRY\\t"+Math.round(n.width)+"x"+Math.round(n.height)+" -> "+Math.round(tw)+"x"+Math.round(th));`}
}`,

  fill: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, hexToRgb(x.row.hex), x.row.hex]))};
const near=(a,b)=>Math.abs(a-b)<0.004;
for(const [key,id,rgb,hex] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  const f=n.fills;
  if(!Array.isArray(f)||!f.length||f[0].type!=="SOLID"){ out.push(key+"\\tNOSOLID\\t"+n.type); continue; }
  const c=f[0].color;
  if(near(c.r,rgb.r)&&near(c.g,rgb.g)&&near(c.b,rgb.b)){ out.push(key+"\\tSAME\\t"+hex); continue; }
  ${APPLY ? `
  const next=JSON.parse(JSON.stringify(f)); next[0]={...next[0],color:rgb}; n.fills=next;
  const b=(await figma.getNodeByIdAsync(id)).fills[0].color;
  const ok=near(b.r,rgb.r)&&near(b.g,rgb.g)&&near(b.b,rgb.b);
  out.push(key+(ok?"\\tOK\\t":"\\tDRIFT\\t")+hex+" got "+[b.r,b.g,b.b].map(v=>Math.round(v*255)).join(","));` : `
  out.push(key+"\\tDRY\\t"+[c.r,c.g,c.b].map(v=>Math.round(v*255)).join(",")+" -> "+hex);`}
}`,


  /* ---- ops added 2026-09-07 so held repair rows could execute ----
     Four findings on the audit arc were held not because the repair was unknown
     but because this file had no op for it. Each held row named the op it
     needed; these are those ops. Every one mutates, reads the node back, and
     reports the node's own value — never the fact that the call returned. */

  /* M19 — the modal family's type scale. `resize` on a TEXT sets WIDTH; nothing
     here could set fontSize, so seven measured rows sat held. */
  "font-size": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, Number(x.row.size), x.row.expect ?? null]))};
for(const [key,id,size,expect] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(n.type!=="TEXT"){ out.push(key+"\\tNOTTEXT\\t"+n.type); continue; }
  if(expect!=null && String(n.characters).indexOf(expect)!==0){ out.push(key+"\\tREFUSED\\thas: "+String(n.characters).slice(0,60)); continue; }
  const had=(typeof n.fontSize==="number")?n.fontSize:null;
  if(had===size){ out.push(key+"\\tSAME\\t"+size); continue; }
  if(had===null){ out.push(key+"\\tMIXED\\tmixed fontSize - not written blind"); continue; }
  ${APPLY ? `
  for(const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
  if(typeof n.fontName==="object") await figma.loadFontAsync(n.fontName);
  n.fontSize=size;
  const b=(await figma.getNodeByIdAsync(id)).fontSize;
  out.push(key+(b===size?"\\tOK\\t":"\\tDRIFT\\t")+had+" -> "+b);` : `
  out.push(key+"\\tDRY\\t"+had+" -> "+size);`}
}`,

  /* M01's screenshot — a destructive button still wearing the disabled
     treatment its typed-confirmation gate used to justify. Node opacity, not
     fill opacity: the fill reads #E02424 at full strength while the button
     renders washed out. Nothing here could set it. */
  opacity: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, Number(x.row.value)]))};
const near=(a,b)=>Math.abs(a-b)<0.01;
for(const [key,id,v] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\tMISSING\t"+id); continue; }
  if(!("opacity" in n)){ out.push(key+"\tNOOPACITY\t"+n.type); continue; }
  if(near(n.opacity,v)){ out.push(key+"\tSAME\t"+n.opacity); continue; }
  ${APPLY ? `
  const had=n.opacity; n.opacity=v;
  const b=(await figma.getNodeByIdAsync(id)).opacity;
  out.push(key+(near(b,v)?"\tOK\t":"\tDRIFT\t")+had+" -> "+b);` : `
  out.push(key+"\tDRY\t"+n.opacity+" -> "+v);`}
}`,

  /* F01 — the audit's first finding. The Layers rows are INSTANCES whose
     highlight is a VARIANT (State=selected), not a fill they own, so neither
     `fill` nor `text` can move it. Nothing here set instance properties, which
     is why F01 sat recorded-only through the whole arc. */
  "set-prop": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, x.row.prop, String(x.row.value)]))};
for(const [key,id,prop,value] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\tMISSING\t"+id); continue; }
  if(n.type!=="INSTANCE"){ out.push(key+"\tNOTINSTANCE\t"+n.type); continue; }
  const cp=n.componentProperties||{};
  const key2=Object.keys(cp).find(k=>k===prop||k.split("#")[0]===prop);
  if(!key2){ out.push(key+"\tNOPROP\t"+Object.keys(cp).join(",")); continue; }
  if(String(cp[key2].value)===value){ out.push(key+"\tSAME\t"+prop+"="+value); continue; }
  ${APPLY ? `
  const had=String(cp[key2].value);
  n.setProperties({[key2]:value});
  const b=(await figma.getNodeByIdAsync(id)).componentProperties[key2];
  const now=b?String(b.value):"?";
  out.push(key+(now===value?"\tOK\t":"\tDRIFT\t")+prop+" "+had+" -> "+now);` : `
  out.push(key+"\tDRY\t"+prop+" "+String(cp[key2].value)+" -> "+value);`}
}`,

  /* M17 — a label belongs ABOVE its field. add-text appends, and in a VERTICAL
     auto-layout parent an appended child lands last with its x/y ignored, so the
     label rendered under the footer. This inserts at an index instead. */
  "insert-text": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.parent, String(x.row.text), Number(x.row.index ?? 0), Number(x.row.size ?? 11), x.row.style || "Regular", hexToRgb(x.row.hex || "#6B7280"), Number(x.row.w ?? 0)]))};
for(const [key,parent,text,index,size,style,rgb,w] of rows){
  const p=await figma.getNodeByIdAsync(parent);
  if(!p){ out.push(key+"\\tMISSING\\t"+parent); continue; }
  if(!p.children){ out.push(key+"\\tNOCHILDREN\\t"+p.type); continue; }
  const dupe=p.children.find(c=>c.type==="TEXT"&&String(c.characters)===text);
  if(dupe){ out.push(key+"\\tSAME\\talready present "+dupe.id); continue; }
  ${APPLY ? `
  const font={family:"Inter",style:style};
  await figma.loadFontAsync(font);
  const t=figma.createText(); t.fontName=font; t.fontSize=size; t.characters=text;
  t.fills=[{type:"SOLID",color:rgb}];
  if(w){ t.textAutoResize="HEIGHT"; t.resize(w,t.height); }
  p.insertChild(Math.min(index,p.children.length), t);
  const back=await figma.getNodeByIdAsync(t.id);
  const at=p.children.indexOf(back);
  out.push(key+(back&&at===Math.min(index,p.children.length)?"\\tOK\\t":"\\tDRIFT\\t")+t.id+" at index "+at+" of "+p.children.length);` : `
  out.push(key+"\\tDRY\\twould insert "+JSON.stringify(text.slice(0,40))+" at index "+index);`}
}`,

  /* F10 — a 127px label in a 119px button, on seven instances. The durable fix
     is the button hugging its content, which needs layoutSizingHorizontal. */
  "hug-width": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, Number(x.row.padH ?? 0)]))};
for(const [key,id,padH] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(!("layoutMode" in n)||n.layoutMode==="NONE"){ out.push(key+"\\tNOAUTOLAYOUT\\t"+n.type+" - hug needs an auto-layout frame"); continue; }
  if(n.layoutSizingHorizontal==="HUG"&&(!padH||n.paddingLeft===padH)){ out.push(key+"\\tSAME\\tHUG "+n.width); continue; }
  ${APPLY ? `
  if(padH){ n.paddingLeft=padH; n.paddingRight=padH; }
  n.layoutSizingHorizontal="HUG";
  const b=await figma.getNodeByIdAsync(id);
  out.push(key+(b.layoutSizingHorizontal==="HUG"?"\\tOK\\t":"\\tDRIFT\\t")+b.layoutSizingHorizontal+" w="+Math.round(b.width));` : `
  out.push(key+"\\tDRY\\t"+n.layoutSizingHorizontal+" w="+Math.round(n.width)+" -> HUG");`}
}`,

  /* F17 — the product paints the template tile with a linear gradient and a
     glyph; `fill` writes a solid, which would swap one misrepresentation for a
     harder-to-spot one. This writes the gradient the code actually uses. */
  "fill-gradient": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, hexToRgb(x.row.from), hexToRgb(x.row.to), x.row.from + " -> " + x.row.to]))};
for(const [key,id,a,b,label] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(!("fills" in n)){ out.push(key+"\\tNOFILLS\\t"+n.type); continue; }
  const cur=n.fills;
  if(Array.isArray(cur)&&cur.length&&cur[0].type==="GRADIENT_LINEAR"){ out.push(key+"\\tSAME\\talready a gradient"); continue; }
  ${APPLY ? `
  /* 145deg, matching TemplateCard's own linear-gradient(145deg, ...). */
  n.fills=[{type:"GRADIENT_LINEAR",
    gradientTransform:[[0.574,0.819,-0.196],[-0.819,0.574,0.622]],
    gradientStops:[{position:0,color:{...a,a:1}},{position:1,color:{...b,a:1}}]}];
  const back=(await figma.getNodeByIdAsync(id)).fills[0];
  out.push(key+(back&&back.type==="GRADIENT_LINEAR"?"\\tOK\\t":"\\tDRIFT\\t")+label);` : `
  out.push(key+"\\tDRY\\tsolid -> gradient "+label);`}
}`,
  /* Append to what a node already says. Load the node's OWN fonts, not a
     default: `getStyledTextSegments` because a mixed-style node has no single
     fontName, and writing one throws "Cannot write to node with unloaded font".
     `maxHeight` is the author's overflow guard and is enforced, not trusted —
     the node is measured after the write and reverted if it grew past it. */
  "append-text": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, String(x.row.add), x.row.maxHeight ?? 0]))};
for(const [key,id,add,maxH] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(n.type!=="TEXT"){ out.push(key+"\\tNOTTEXT\\t"+n.type); continue; }
  const had=n.characters;
  if(had.indexOf(add)>=0){ out.push(key+"\\tSAME\\talready contains it"); continue; }
  ${APPLY ? `
  for(const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
  const before=n.height;
  n.characters = had + (had.endsWith(" ")||had.endsWith("\\n") ? "" : " ") + add;
  const b=await figma.getNodeByIdAsync(id);
  if(maxH && b.height>maxH){ n.characters=had; out.push(key+"\\tREFUSED\\twould grow "+Math.round(before)+"->"+Math.round(b.height)+" past maxHeight "+maxH); continue; }
  out.push(key+"\\tOK\\th="+Math.round(b.height)+" "+b.characters.slice(-70));` : `
  out.push(key+"\\tDRY\\twould append "+add.slice(0,60));`}
}`,

  move: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, x.row.x, x.row.y]))};
for(const [key,id,nx,ny] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  const tx = nx===null||nx===undefined ? n.x : nx, ty = ny===null||ny===undefined ? n.y : ny;
  if(Math.round(n.x)===Math.round(tx) && Math.round(n.y)===Math.round(ty)){ out.push(key+"\\tSAME\\t"+Math.round(n.x)+","+Math.round(n.y)); continue; }
  const par=n.parent;
  if(par && par.layoutMode && par.layoutMode!=="NONE" && n.layoutPositioning!=="ABSOLUTE"){
    out.push(key+"\\tAUTOLAYOUT\\tparent "+par.id+" is "+par.layoutMode+" - x/y are the parent's; setting them is a no-op");
    continue;
  }
  ${APPLY ? `
  n.x=tx; n.y=ty;
  const b=await figma.getNodeByIdAsync(id);
  const ok=Math.round(b.x)===Math.round(tx)&&Math.round(b.y)===Math.round(ty);
  out.push(key+(ok?"\\tOK\\t":"\\tDRIFT\\t")+Math.round(b.x)+","+Math.round(b.y));` : `
  out.push(key+"\\tDRY\\t"+Math.round(n.x)+","+Math.round(n.y)+" -> "+Math.round(tx)+","+Math.round(ty));`}
}`,

  /* Hide, never remove. A drawing is not deleted because the code cannot
     produce it yet — that call was made once in this arc and recorded as a
     mistake (SH-CO-01). visible=false is reversible; remove() is not. */
  delete: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, x.row.note || ""]))};
for(const [key,id,note] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  if(n.visible===false){ out.push(key+"\\tSAME\\talready hidden: "+String(n.name).slice(0,60)); continue; }
  ${APPLY ? `
  n.visible=false;
  const b=await figma.getNodeByIdAsync(id);
  out.push(key+(b.visible===false?"\\tOK\\t":"\\tDRIFT\\t")+String(b.name).slice(0,60)+" "+note);` : `
  out.push(key+"\\tDRY\\twould hide "+String(n.name).slice(0,60)+" "+note);`}
}`,

  "add-text": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.parent, x.row.name, String(x.row.text), x.row.x, x.row.y, x.row.w,
  x.row.size ?? 12, x.row.leading ?? 0, x.row.style || "Regular", hexToRgb(x.row.color || "#111827"), x.row.align || "LEFT"]))};
for(const [key,parentId,name,text,x,y,w,size,leading,style,rgb,align] of rows){
  const p=await figma.getNodeByIdAsync(parentId);
  if(!p){ out.push(key+"\\tMISSING\\t"+parentId); continue; }
  const dup=(p.children||[]).find(c=>c.name===name);
  if(dup){ out.push(key+"\\tSAME\\t"+dup.id+" already named "+name); continue; }
  ${APPLY ? `
  await figma.loadFontAsync({family:"Inter", style:style});
  const t=figma.createText();
  t.fontName={family:"Inter", style:style};
  t.characters=text; t.fontSize=size; t.fills=[{type:"SOLID",color:rgb}];
  if(leading) t.lineHeight={unit:"PIXELS", value:leading};
  t.textAlignHorizontal=align;
  /* HEIGHT + explicit width, never FILL alone: the default WIDTH_AND_HEIGHT
     mode does not wrap, so a long string escapes its board sideways. */
  t.textAutoResize="HEIGHT"; t.resize(w, t.height);
  t.name=name;
  p.appendChild(t); t.x=x; t.y=y;
  const b=await figma.getNodeByIdAsync(t.id);
  const fits=b.x+b.width<=p.width+0.5 && b.y+b.height<=p.height+0.5;
  out.push(key+"\\t"+(fits?"OK":"OOB")+"\\t"+b.id+" "+Math.round(b.width)+"x"+Math.round(b.height)+" @"+Math.round(b.x)+","+Math.round(b.y));` : `
  out.push(key+"\\tDRY\\twould add TEXT "+name+" to "+parentId);`}
}`,

  "add-rect": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.parent, x.row.name, x.row.x, x.row.y, x.row.w, x.row.h,
  x.row.color ? hexToRgb(x.row.color) : null, x.row.stroke ? hexToRgb(x.row.stroke) : null, x.row.radius ?? 0]))};
for(const [key,parentId,name,x,y,w,h,rgb,stroke,radius] of rows){
  const p=await figma.getNodeByIdAsync(parentId);
  if(!p){ out.push(key+"\\tMISSING\\t"+parentId); continue; }
  const dup=(p.children||[]).find(c=>c.name===name);
  if(dup){ out.push(key+"\\tSAME\\t"+dup.id+" already named "+name); continue; }
  ${APPLY ? `
  const r=figma.createRectangle();
  r.name=name; r.resize(w,h);
  r.fills = rgb ? [{type:"SOLID",color:rgb}] : [];
  if(stroke){ r.strokes=[{type:"SOLID",color:stroke}]; r.strokeWeight=1; }
  if(radius) r.cornerRadius=radius;
  p.appendChild(r); r.x=x; r.y=y;
  const b=await figma.getNodeByIdAsync(r.id);
  const fits=b.x+b.width<=p.width+0.5 && b.y+b.height<=p.height+0.5;
  out.push(key+"\\t"+(fits?"OK":"OOB")+"\\t"+b.id+" "+Math.round(b.width)+"x"+Math.round(b.height)+" @"+Math.round(b.x)+","+Math.round(b.y));` : `
  out.push(key+"\\tDRY\\twould add RECT "+name+" to "+parentId);`}
}`,

  /* A caption sits under its board, copying an existing caption's type so the
     page keeps one voice. `from` names that caption; without it, 12/Regular
     ink-muted, the file's own default. */
  "add-caption": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.board, x.row.name, String(x.row.text), x.row.from || null, x.row.w || 0, x.row.x, x.row.y]))};
for(const [key,boardId,name,text,fromId,w,px,py] of rows){
  const b0=await figma.getNodeByIdAsync(boardId);
  if(!b0){ out.push(key+"\\tMISSING\\t"+boardId); continue; }
  const host=b0.parent;
  const dup=(host.children||[]).find(c=>c.name===name);
  if(dup){ out.push(key+"\\tSAME\\t"+dup.id); continue; }
  let size=12, style="Regular", rgb={r:0.42,g:0.447,b:0.502}, lead=18, width=w||b0.width;
  if(fromId){ const f=await figma.getNodeByIdAsync(fromId);
    if(f && f.type==="TEXT"){ size=f.fontSize; style=(typeof f.fontName==="object"?f.fontName.style:"Regular");
      if(Array.isArray(f.fills)&&f.fills[0]&&f.fills[0].color) rgb=f.fills[0].color;
      if(f.lineHeight&&f.lineHeight.unit==="PIXELS") lead=f.lineHeight.value;
      if(!w) width=f.width; } }
  ${APPLY ? `
  await figma.loadFontAsync({family:"Inter", style:style});
  const t=figma.createText();
  t.fontName={family:"Inter", style:style};
  t.characters=text; t.fontSize=size; t.fills=[{type:"SOLID",color:rgb}];
  t.lineHeight={unit:"PIXELS", value:lead};
  t.textAutoResize="HEIGHT"; t.resize(width, t.height);
  t.name=name;
  host.appendChild(t);
  t.x = px===null||px===undefined ? b0.x : px;
  t.y = py===null||py===undefined ? b0.y+b0.height+12 : py;
  const b=await figma.getNodeByIdAsync(t.id);
  out.push(key+"\\tOK\\t"+b.id+" "+Math.round(b.width)+"x"+Math.round(b.height)+" @"+Math.round(b.x)+","+Math.round(b.y));` : `
  out.push(key+"\\tDRY\\twould caption "+boardId+" with "+name);`}
}`,

  /* Clone a node and re-home it. Cloning the label beside the one being added
     inherits font, size, colour and leading, so a new door cannot drift from
     the three already on the board — which is why the agents reached for this
     far more than for add-text. `textIndex` picks which TEXT inside a cloned
     ROW takes the new string; null means the clone is itself the TEXT. */
  "clone-node": (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.src, x.row.parent, x.row.name, x.row.text ?? null, x.row.textIndex, x.row.x, x.row.y, x.row.width ?? 0]))};
for(const [key,srcId,parentId,name,text,ti,nx,ny,width] of rows){
  const src=await figma.getNodeByIdAsync(srcId);
  const p=await figma.getNodeByIdAsync(parentId);
  if(!src){ out.push(key+"\\tMISSING\\tsrc "+srcId); continue; }
  if(!p){ out.push(key+"\\tMISSING\\tparent "+parentId); continue; }
  const dup=(p.children||[]).find(c=>c.name===name);
  if(dup){ out.push(key+"\\tSAME\\t"+dup.id+" already named "+name); continue; }
  ${APPLY ? `
  const c=src.clone();
  p.appendChild(c);
  c.name=name;
  if(nx!==null&&nx!==undefined) c.x=nx;
  if(ny!==null&&ny!==undefined) c.y=ny;
  if(text!==null){
    let t=c;
    if(c.type!=="TEXT"){
      const texts=[];
      const st=[...(c.children||[])];
      while(st.length){ const n=st.shift(); if(n.type==="TEXT") texts.push(n); if(n.children) for(const k of n.children) st.push(k); }
      t = texts[ti===null||ti===undefined?0:ti] || null;
    }
    if(!t){ c.remove(); out.push(key+"\\tNOTEXT\\tclone has no TEXT at index "+ti); continue; }
    for(const seg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
    if(typeof t.fontName==="object") await figma.loadFontAsync(t.fontName);
    if(width){ t.textAutoResize="HEIGHT"; t.resize(width, t.height); }
    t.characters=text;
  }
  const b=await figma.getNodeByIdAsync(c.id);
  const fits=b.x+b.width<=p.width+0.5 && b.y+b.height<=p.height+0.5;
  out.push(key+"\\t"+(fits?"OK":"OOB")+"\\t"+b.id+" "+Math.round(b.width)+"x"+Math.round(b.height)+" @"+Math.round(b.x)+","+Math.round(b.y));` : `
  out.push(key+"\\tDRY\\twould clone "+srcId+" into "+parentId+" as "+name);`}
}`,

  /* Re-point an edge that already exists. If the node carries no reaction to
     `from`, say so — do NOT create one. A missing edge and a mis-aimed edge are
     different defects and the plan was written for the second. */
  rewire: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.id, x.row.from, x.row.to]))};
for(const [key,id,from,to] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(key+"\\tMISSING\\t"+id); continue; }
  const rs=n.reactions||[];
  /* A Reaction carries BOTH a legacy singular 'action' and the current 'actions'
     array, and Figma reads 'actions'. Rewriting only the singular leaves the edge
     pointing where it was while the call reports success — which is exactly what
     happened on the four Content crumb rows. Read and write both. */
  const destsOf=(r)=>[r.action&&r.action.destinationId].concat((r.actions||[]).map(a=>a&&a.destinationId)).filter(Boolean);
  const dests=rs.reduce((a,r)=>a.concat(destsOf(r)),[]);
  if(dests.includes(to)){ out.push(key+"\\tSAME\\talready -> "+to); continue; }
  if(!dests.includes(from)){ out.push(key+"\\tNOEDGE\\thas: "+(dests.join(",")||"none")+" (expected "+from+")"); continue; }
  ${APPLY ? `
  await n.setReactionsAsync(rs.map(r => {
    const next={...r};
    /* Same refusal applies here: send the plural only. The singular is dropped
       rather than rewritten, because writing it is rejected outright. */
    const src = Array.isArray(next.actions) && next.actions.length ? next.actions
              : (next.action ? [next.action] : []);
    next.actions = src.map(a=>(a&&a.destinationId===from)?{...a,destinationId:to}:a);
    delete next.action;
    return next;
  }));
  const b=await figma.getNodeByIdAsync(id);
  const now=(b.reactions||[]).reduce((a,r)=>a.concat([r.action&&r.action.destinationId].concat((r.actions||[]).map(x=>x&&x.destinationId)).filter(Boolean)),[]);
  out.push(key+(now.includes(to)?"\\tOK\\t":"\\tDRIFT\\t")+now.join(","));` : `
  out.push(key+"\\tDRY\\twould repoint "+from+" -> "+to);`}
}`,

  /* A hotspot is a named rect at the label's own bounds, not a reaction on the
     board. wire-edges.mjs walks a TEXT node up to its nearest frame ancestor,
     which is the BOARD when the label was appended straight to it — and the
     edge silently becomes click-anywhere-to-navigate. */
  hotspot: (rows) => `
const rows=${JSON.stringify(rows.map((x) => [x.key, x.row.over, x.row.to, x.row.name || "hotspot/link", x.row.pad ?? 8]))};
for(const [key,overId,toId,name,pad] of rows){
  const over=await figma.getNodeByIdAsync(overId);
  const to=await figma.getNodeByIdAsync(toId);
  if(!over){ out.push(key+"\\tMISSING\\t"+overId); continue; }
  if(!to){ out.push(key+"\\tMISSINGTARGET\\t"+toId); continue; }
  const parent=over.parent;
  const dup=(parent.children||[]).find(c=>c.name===name && Math.abs(c.x-(over.x-pad))<2 && Math.abs(c.y-(over.y-pad))<2);
  if(dup){ out.push(key+"\\tSAME\\t"+dup.id); continue; }
  ${APPLY ? `
  const r=figma.createRectangle();
  r.name=name; r.resize(over.width+pad*2, over.height+pad*2);
  r.fills=[]; r.opacity=0.001;
  parent.appendChild(r);
  /* A hotspot must sit exactly over its label. If the parent is auto-layout the
     layout owns x/y and the rect lands wherever the stack puts it — one landed
     169px into a 280px board at 136 wide and left it. ABSOLUTE takes it out of
     the flow so the coordinates mean something. */
  if(parent.layoutMode && parent.layoutMode!=="NONE") r.layoutPositioning="ABSOLUTE";
  r.x=over.x-pad; r.y=over.y-pad;
  /* Figma REFUSES the legacy singular field on write — "Please update the
     actions field instead of the action field in order to prevent data loss."
     It still READS both, which is why a rewire has to read both; but a write
     must send the plural only. */
  await r.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId:toId,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
  const b=await figma.getNodeByIdAsync(r.id);
  const wired=(b.reactions||[]).some(x=>(x.action&&x.action.destinationId===toId)||(x.actions||[]).some(a=>a&&a.destinationId===toId));
  out.push(key+(wired?"\\tOK\\t":"\\tDRIFT\\t")+b.id+" over "+overId+" -> "+toId);` : `
  out.push(key+"\\tDRY\\twould wire "+overId+" -> "+toId);`}
}`,
};

/* ---------- batching ---------- */

function batch(pending) {
  const groups = new Map();
  for (const r of pending) {
    const k = `${r.page}|${r.row.op}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const batches = [];
  for (const [k, rows] of groups) {
    const [page, op] = k.split("|");
    let cur = [];
    for (const r of rows) {
      const probe = BUILD[op]([...cur, r]);
      if (cur.length && probe.length > MAX_PAYLOAD) { batches.push({ page, op, rows: cur }); cur = [r]; }
      else cur.push(r);
    }
    if (cur.length) batches.push({ page, op, rows: cur });
  }
  return batches;
}

/* ---------- run ---------- */

const all = loadRows();
const bad = all.filter((r) => r.bad);
const good = all.filter((r) => !r.bad);
const done = good.filter((r) => ["OK", "SAME"].includes(state.rows[r.key]?.status));
const pending = good.filter((r) => !["OK", "SAME"].includes(state.rows[r.key]?.status));
const batches = batch(pending);

console.log(`plans      ${new Set(all.map((r) => r.slug)).size} files, ${all.length} rows`);
console.log(`unusable   ${bad.length}${bad.length ? " (" + [...new Set(bad.map((r) => r.bad))].join("; ") + ")" : ""}`);
console.log(`already    ${done.length}`);
console.log(`pending    ${pending.length} rows in ${batches.length} calls`);
console.log(`spent today ${state.spend[today]} of ${BUDGET} budgeted (Figma allows 200/day, 15/min)`);

if (bad.length) {
  console.log("\nunusable rows — resolve the node id or fix the op, then re-run:");
  for (const r of bad.slice(0, 20)) console.log(`  ${r.key}\t${r.bad}\t${(r.row.why || "").slice(0, 40)}`);
  if (bad.length > 20) console.log(`  … and ${bad.length - 20} more`);
}

if (STATUS_ONLY) process.exit(0);
if (!batches.length) { console.log("\nnothing pending."); process.exit(0); }

/* A dry run costs ZERO calls and stops here. It cannot show the current value
   of a node without spending the same call the write would — and at 200 a day,
   a preview that costs what the change costs is not a preview. Validation,
   batching and the price are all knowable locally, so that is what it reports. */
if (!APPLY) {
  console.log(`\nDRY RUN — 0 calls spent. Applying would cost ${Math.min(batches.length, BUDGET - state.spend[today])} calls:`);
  const byOp = {};
  for (const b of batches) byOp[`${b.op} @ ${b.page}`] = (byOp[`${b.op} @ ${b.page}`] || 0) + 1;
  for (const [k, v] of Object.entries(byOp)) console.log(`  ${String(v).padStart(4)} calls   ${k}`);
  console.log("\nAdd --apply to spend them.");
  process.exit(0);
}

const room = BUDGET - state.spend[today];
if (room <= 0) { console.log(`\nBudget for ${today} is spent. Resume tomorrow — state is on disk, nothing is redone.`); process.exit(0); }

await connect();
let used = 0, stopped = null;
const tally = {};

for (const b of batches) {
  if (used >= room) { stopped = `budget (${BUDGET})`; break; }
  /* Assembled as an array join, matching apply-text-fixes.mjs. A single big
     template literal reads better and trips lint-sandbox-scripts.mjs, whose
     boundary detection cannot tell the literal's own closing backtick from a
     stray one inside it. The repo already had a pattern; use it. */
  const code = [
    "const pg=figma.root.children.find(p=>p.id===" + JSON.stringify(b.page) + ");",
    'if(!pg) return "PAGE-NOT-FOUND";',
    "await figma.setCurrentPageAsync(pg);",
    "const out=[];",
    BUILD[b.op](b.rows),
    'return out.join(String.fromCharCode(10));',
  ].join("\n");

  if (code.length > 19000) { console.error("OVERSIZE batch skipped (" + code.length + " chars) — " + b.op + " on " + b.page); continue; }

  const r = await rpc("tools/call", {
    name: "use_figma",
    arguments: { fileKey: FILE_KEY, code, description: "apply-queue: " + b.rows.length + " " + b.op + " rows on page " + b.page, skillNames: "figma-use" },
  }, 1);
  used++;
  state.spend[today] = (state.spend[today] || 0) + 1;

  const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300);

  if (/tool call limit/i.test(txt)) {
    /* A daily cap, not a rate limit. Backing off does not clear it, and the
       next call would only confirm that again at the cost of nothing left to
       spend. Stop, keep the state, resume in the next window. */
    /* Do NOT declare the day spent. The cap TRICKLES — calls return one or two
       at a time within minutes — and writing 200 here poisons this script's own
       counter, so the next run refuses on its own guard while Figma would have
       answered. That happened: a 105-row batch was blocked by this line, not by
       Figma, and landed in full the moment the guard was raised.
       Record that the cap was seen, and let the next run ask. */
    stopped = "Figma tool-call limit (it trickles — re-run, do not assume the day is over)";
    state.capSeenAt = new Date().toISOString();
    break;
  }
  if (txt === "PAGE-NOT-FOUND") { console.error("page " + b.page + " not found"); continue; }

  /* A sandbox that throws returns prose, not tab-delimited rows — and a loop
     that only looks for rows reports "outcomes none" while a call was spent and
     an error went unread. Surface it. */
  let parsed = 0;
  for (const line of txt.split("\n")) {
    const [key, status, detail] = line.split("\t");
    if (!key || !status) continue;
    parsed++;
    state.rows[key] = { status, detail: (detail || "").slice(0, 200), at: new Date().toISOString(), op: b.op };
    tally[status] = (tally[status] || 0) + 1;
  }
  if (!parsed) {
    console.error("\nNO ROWS PARSED from a " + b.op + " batch of " + b.rows.length + " on page " + b.page + " — the sandbox almost certainly threw. Raw reply:");
    console.error(txt.slice(0, 700));
  }
  save();
  process.stdout.write("\r  " + used + " calls · " + Object.entries(tally).map(([k, v]) => k + " " + v).join(" · ") + "          ");

  if (used < room && batches.indexOf(b) < batches.length - 1) await new Promise((s) => setTimeout(s, SPACING_MS));
}

save();
console.log("\n");
console.log("calls used   " + used);
console.log("outcomes     " + (Object.entries(tally).map(([k, v]) => k + " " + v).join(" · ") || "none"));
const left = good.filter((r) => !["OK", "SAME"].includes(state.rows[r.key]?.status)).length;
console.log("still owed   " + left + " rows");
if (stopped) console.log("STOPPED ON  " + stopped + " — re-run to resume; " + left + " rows carry over, nothing is redone.");

/* A DRIFT or REFUSED row is information, not a failure to retry blindly: DRIFT
   means the write landed and the node does not hold what was asked, REFUSED
   means the board has moved on since the plan was written. Both want a human
   read before the plan is changed. */
const attention = Object.entries(state.rows).filter(([, v]) => ["DRIFT", "REFUSED", "MISSING", "NOTTEXT", "NOSOLID", "NORESIZE", "MISSINGTARGET"].includes(v.status));
if (attention.length) {
  console.log("\n" + attention.length + " rows need a read before re-planning:");
  for (const [k, v] of attention.slice(0, 25)) console.log("  " + k + "\t" + v.status + "\t" + v.detail);
  if (attention.length > 25) console.log("  … and " + (attention.length - 25) + " more (see " + STATE + ")");
}
