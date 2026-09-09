/**
 * Insert a notice band into a Settings pane and push the body down to make room.
 *
 * Two V2 findings need a sentence on a board that has nowhere to put one.
 * UX-I-40: half of Settings is inside version history and half is outside it and
 * nothing says which, so a restore silently keeps the redirects the user was
 * trying to leave. UX-I-36: the same savebar sits over three different commit
 * models — buffer-and-commit, savebar-writes-to-a-server-path, and
 * writes-immediately-on-its-own-button — and reads "0 unsaved" on all three.
 * Both are answered by one honest line in the pane, so one script draws it.
 *
 * The band is INSERTED, not floated: every sibling below the header moves down by
 * its height, so nothing is overprinted. render-defects.mjs and verify-invariants
 * both catch the alternative, and they have caught it here before.
 *
 * Usage:
 *   node scripts/figma/add-settings-blocks.mjs <plan.json>          # dry run
 *   node scripts/figma/add-settings-blocks.mjs <plan.json> --apply
 *
 * plan.json: [{ "board":"640:2440", "name":"Notice · not in version history",
 *               "text":"…", "tone":"warning", "why":"UX-I-40" }]
 *   tone: "warning" (#C27803 on #FFFBEB) | "info" (ink-soft on #F3F4F6)
 *   kind: "notice" (default) | "field" — a 32px input box carrying `text` as its
 *         placeholder, for UX-I-37's missing filter over the 13-row Settings nav.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: add-settings-blocks.mjs <plan.json> [--apply]"); process.exit(1); }
/* Plans live in the directory scripts/figma/apply-queue.mjs scans, and that
   queue can only do text / rename / resize / fill / hotspot. Structural work —
   deleting a node, inserting a band, drawing a dialog — is carried under a
   "structural" key beside an empty "rows", so the shared queue reads zero rows
   from this file instead of reporting every one of them as an unknown op. */
const _raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(_raw) ? _raw : _raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

const CHUNK = 11;   // one call per plan: an applied line is ~200 chars, well under the 20,000-char cap
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = `
const APPLY=${APPLY};
const rows=${JSON.stringify(rows.map((r) => [r.board, r.name, r.text, r.tone || "info", r.kind || "notice"]))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const TONE={warning:{bg:"#FFFBEB",ink:"#C27803",line:"#FDE68A"},info:{bg:"#F3F4F6",ink:"#4B5563",line:"#E5E7EB"}};
const out=[];
for(const [id,name,text,tone,kind] of rows){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  if(b.findAll(n=>n.name===name).length){ out.push("ALREADY\\t"+id+"\\t"+name); continue; }
  const hdr=b.findAll(n=>/^(pane header|panel header|header)$/i.test(n.name||""))[0];
  if(!hdr){ out.push("NOHDR\\t"+id); continue; }
  const pane=hdr.parent;
  const top=Math.round(hdr.y+hdr.height);
  const W=Math.round(pane.width)-48;
  const H=kind==="field"?32:52;
  /* Making room can push the last card out of the pane, which verify-invariants
     calls oob and which this script has no business creating. Measure first. */
  const below=pane.children.filter(c=>c.id!==hdr.id && c.y>=top-1);
  const foot=below.length?Math.max(...below.map(c=>c.y+c.height)):top;
  const slack=Math.round(pane.height-foot);
  if(!APPLY){ out.push("WOULD\\t"+id+"\\tpane="+pane.id+" ("+Math.round(pane.width)+"x"+Math.round(pane.height)+")\\tinsert at y="+(top+12)+" h="+H+"\\tbelow="+below.length+" slack="+slack+(slack<H+12?" >>> WOULD OVERFLOW":"")+"\\t"+name); continue; }
  if(slack<H+12){ out.push("REFUSED-OVERFLOW\\t"+id+"\\tslack="+slack+" needs "+(H+12)+"\\t"+name); continue; }
  const T=kind==="field"?{bg:"#FFFFFF",ink:"#6B7280",line:"#D1D5DB"}:(TONE[tone]||TONE.info);
  /* make room first, so the band cannot land on top of the first card */
  const moved=[];
  for(const c of below){ c.y=c.y+H+12; moved.push(c.id); }
  const band=figma.createFrame();
  band.name=name; band.resize(W,H); band.cornerRadius=kind==="field"?6:6;
  band.fills=[{type:"SOLID",color:hex(T.bg)}];
  band.strokes=[{type:"SOLID",color:hex(T.line)}]; band.strokeWeight=1;
  pane.appendChild(band); band.x=24; band.y=top+12;
  const t=figma.createText();
  await figma.loadFontAsync({family:"Inter",style:"Regular"});
  t.fontName={family:"Inter",style:"Regular"}; t.fontSize=kind==="field"?13:12;
  t.lineHeight={unit:"PIXELS",value:kind==="field"?20:18};
  t.textAutoResize="HEIGHT"; t.resize(W-24,18); t.characters=text;
  t.fills=[{type:"SOLID",color:hex(T.ink)}];
  band.appendChild(t); t.x=12; t.y=kind==="field"?6:8;
  if(kind!=="field" && t.height+16>H) band.resize(W,Math.round(t.height)+16);
  const again=await figma.getNodeByIdAsync(band.id);
  const gotText=again.findAll(n=>n.type==="TEXT").map(n=>{try{return n.characters}catch(e){return ""}})[0]||"";
  out.push((gotText===text?"OK\\t":"MISMATCH\\t")+id+"\\t"+again.id+"\\t"+Math.round(again.width)+"x"+Math.round(again.height)
    +"@"+Math.round(again.x)+","+Math.round(again.y)+"\\tmoved="+moved.length+"\\t'"+gotText.slice(0,60)+"'");
}
return out.join(String.fromCharCode(10));
`;
  const text = await call(code, (APPLY ? "insert " : "dry-run inserting ") + rows.length + " Settings notice bands");
  console.log(text);
}
