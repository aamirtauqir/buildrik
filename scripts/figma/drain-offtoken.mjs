/**
 * Drain off-token paints and sub-ramp type sizes named by a plan file, and read
 * every change back out of the file.
 *
 * Why a new script rather than one of the existing ones. `fix-accent-near-miss.mjs`
 * hardcodes three #1A57DB nodes and the lesson it carries; `fix-label-tracking.mjs`
 * moves one property on nodes it discovers itself; `bind-master-type-styles.mjs`
 * only touches MASTER components, because binding a style on an instance CHILD
 * bakes an override that hides the next drift. None of the three takes a plan of
 * specific free nodes and does repaint + promote + bind on them, which is what
 * `docs/design-jobs/V2-TO-V1/plans/brand-03-conformance.json` needs.
 *
 * Three rules this file inherits from the ones above, each learned the hard way:
 *
 *  1. A SWATCH EQUALS THE VALUE IT CAPTIONS AND IS NEVER TOKEN-BOUND.
 *     fix-accent-near-miss.mjs shipped exactly that defect one row after fixing
 *     it: it painted a chip accent-blue and bound it, and the chip then
 *     contradicted its own `#E2E5F8` caption forever after. Any node whose name
 *     contains "swatch" is REFUSED here, not repainted.
 *
 *  2. setBoundVariableForPaint RETURNS A NEW PAINT. Capture and reassign it;
 *     mutating in place does nothing and reports success.
 *
 *  3. A 10 -> 11px promotion WIDENS a WIDTH_AND_HEIGHT node. fix-label-tracking's
 *     "28 of 34 would clip" blocker was a box-width problem, not a value
 *     question. Every promoted node is re-measured against its BOARD's right
 *     edge and switched to HEIGHT autoresize with a pinned width if it would
 *     escape.
 *
 * A write is not verified by the write. Every row is re-read after the write and
 * the script exits non-zero on any MISMATCH.
 *
 * Usage:
 *   node scripts/figma/drain-offtoken.mjs <plan.json>            # dry run
 *   node scripts/figma/drain-offtoken.mjs <plan.json> --apply
 *   node scripts/figma/drain-offtoken.mjs <plan.json> --only=repaint|promote
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "--only=all").split("=")[1];
/* Batch size. 12 was chosen for payload safety; these rows are node ids only
   (~30 chars each), so the real ceiling is far higher and at 200 calls/day the
   batch size IS the budget. Raise it deliberately, per run, never blindly. */
const CHUNK = Number((process.argv.find((a) => a.startsWith("--chunk=")) || "--chunk=12").split("=")[1]);
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) {
  console.error("usage: drain-offtoken.mjs <plan.json> [--apply] [--only=repaint|promote] [--page=1:3]");
  process.exit(1);
}
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const repaints = ONLY === "promote" ? [] : (plan.repaint ?? []);
const promotes = ONLY === "repaint" ? [] : (plan.promote?.nodes ?? []);

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", {
    name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" },
  }, 1);
  const t = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
  if (/tool call limit|Too Many Requests/i.test(t)) throw new Error("FIGMA QUOTA — no measurement taken. Stop; do not report a count.");
  return t;
};

let ok = 0, same = 0, refused = 0, missing = 0, mismatch = 0;
const tally = (text) => {
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    console.log(line);
    const k = line.split("\t")[0];
    if (k === "OK" || k === "WOULD") ok++;
    else if (k === "SAME") same++;
    else if (k === "REFUSED") refused++;
    else if (k === "MISSING" || k === "NOTTEXT") missing++;
    else if (k === "MISMATCH") mismatch++;
  }
};

/* ── repaint + bind ─────────────────────────────────────────────────────────── */
for (let i = 0; i < repaints.length; i += CHUNK) {
  const rows = repaints.slice(i, i + CHUNK);
  const code = `
const APPLY=${APPLY};
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(rows.map((r) => [r.id, r.kind ?? "fill", r.from, r.to, r.bind ?? ""]))};
const hx=(c)=>"#"+[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("").toUpperCase();
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const cols=await figma.variables.getLocalVariablesAsync("COLOR");
const out=[];
for(const [id,kind,from,to,bindName] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push("MISSING\\t"+id); continue; }
  /* Rule 1 — a swatch is its own value and is never bound. */
  if(/swatch/i.test(n.name)){ out.push("REFUSED\\t"+id+"\\tswatch: "+n.name.slice(0,40)); continue; }
  const prop = kind==="stroke" ? "strokes" : "fills";
  const arr = n[prop];
  if(!Array.isArray(arr)){ out.push("REFUSED\\t"+id+"\\t"+prop+" is not an array (mixed?)"); continue; }
  const idx = arr.findIndex(p=>p.type==="SOLID" && hx(p.color)===String(from).toUpperCase());
  if(idx<0){ out.push("SAME\\t"+id+"\\tno "+from+" on "+prop+" — already drained or never there"); continue; }
  if(!APPLY){ out.push("WOULD\\t"+id+"\\t"+prop+"["+idx+"] "+from+" -> "+to+(bindName?(" + bind "+bindName):"")); continue; }
  const next = arr.map(p=>({...p}));
  next[idx].color = rgb(to);
  if(bindName){
    const v = cols.find(c=>c.name===bindName);
    if(!v){ out.push("REFUSED\\t"+id+"\\tno colour variable named "+bindName); continue; }
    /* Rule 2 — this RETURNS a new paint; it does not mutate. */
    next[idx] = figma.variables.setBoundVariableForPaint(next[idx], "color", v);
  }
  n[prop] = next;
  const again = await figma.getNodeByIdAsync(id);
  const back = again[prop][idx];
  const hexOk = hx(back.color)===String(to).toUpperCase();
  const bindOk = !bindName || !!(back.boundVariables && back.boundVariables.color);
  out.push((hexOk&&bindOk ? "OK\\t" : "MISMATCH\\t")+id+"\\t"+hx(back.color)+(bindOk?" bound":" UNBOUND"));
}
return out.join(String.fromCharCode(10));
`;
  tally(await call(code, (APPLY ? "repaint " : "dry-run repaint of ") + rows.length + " off-token paints to their token value and bind the role"));
}

/* ── promote sub-11px + bind the ramp ───────────────────────────────────────── */
for (let i = 0; i < promotes.length; i += CHUNK) {
  const rows = promotes.slice(i, i + CHUNK);
  const code = `
const APPLY=${APPLY};
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(rows.map((r) => [r.id, r.board]))};
const styles=await figma.getLocalTextStylesAsync();
const isSym=(v)=>typeof v==="symbol";
/* Load every ramp font before touching a node: a resize against an unloaded
   font fails silently and leaves the box at its default, which measures as
   "fits". */
const fonts=new Map();
for(const s of styles) fonts.set(s.fontName.family+"|"+s.fontName.style, s.fontName);
for(const f of fonts.values()){ try{ await figma.loadFontAsync(f); }catch(e){} }
const out=[];
for(const [id,boardId] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push("MISSING\\t"+id); continue; }
  if(n.type!=="TEXT"){ out.push("NOTTEXT\\t"+id+"\\t"+n.type); continue; }
  if(isSym(n.fontName)||isSym(n.fontSize)){ out.push("REFUSED\\t"+id+"\\tmixed styling — hand-set"); continue; }
  if(n.fontSize>=11){ out.push("SAME\\t"+id+"\\talready "+n.fontSize+"px"); continue; }
  /* An instance child cannot take a style without baking an override that
     hides the next drift — bind-master-type-styles.mjs's rule. Promote the
     size, but refuse the bind and say so. */
  let p=n.parent, inInstance=false;
  while(p&&p.type!=="PAGE"){ if(p.type==="INSTANCE"){ inInstance=true; break; } p=p.parent; }
  const want=styles.find(s=>s.fontName.family===n.fontName.family&&s.fontName.style===n.fontName.style&&s.fontSize===11);
  if(!APPLY){ out.push("WOULD\\t"+id+"\\t"+n.fontSize+"px -> 11/16"+(want?(" bind "+want.name):" NO 11px "+n.fontName.style+" in ramp")+(inInstance?" (instance child — size only)":"")); continue; }
  const board=await figma.getNodeByIdAsync(boardId);
  const beforeAuto=n.textAutoResize;
  await figma.loadFontAsync(n.fontName);
  n.fontSize=11;
  n.lineHeight={unit:"PIXELS",value:16};
  /* Rule 3 — re-measure against the BOARD, not against nothing. */
  if(board){
    const bx=board.absoluteTransform[0][2], bw=board.width;
    const nx=n.absoluteTransform[0][2];
    if(nx+n.width > bx+bw-16){
      n.textAutoResize="HEIGHT";
      n.resize(Math.max(24, Math.round(bx+bw-16-nx)), n.height);
    }
  }
  if(want && !inInstance && !n.textStyleId){ try{ await n.setTextStyleIdAsync(want.id); }catch(e){} }
  const again=await figma.getNodeByIdAsync(id);
  const sizeOk = again.fontSize===11;
  const lhOk = !isSym(again.lineHeight) && again.lineHeight.unit==="PIXELS" && again.lineHeight.value===16;
  const escaped = board ? (again.absoluteTransform[0][2]+again.width > board.absoluteTransform[0][2]+board.width-8) : false;
  out.push((sizeOk&&lhOk&&!escaped ? "OK\\t" : "MISMATCH\\t")+id+"\\t"+again.fontSize+"/"+(isSym(again.lineHeight)?"MIX":again.lineHeight.value)+(again.textStyleId?" bound":" unbound")+(escaped?" ESCAPES BOARD":"")+" was "+beforeAuto);
}
return out.join(String.fromCharCode(10));
`;
  tally(await call(code, (APPLY ? "promote " : "dry-run promotion of ") + rows.length + " sub-11px TEXT nodes to 11/16 and bind the ui/11 ramp"));
}

console.log("");
console.log((APPLY ? "changed " : "would change ") + ok +
  "   already-correct=" + same + "   refused=" + refused +
  "   missing/not-text=" + missing + "   MISMATCH=" + mismatch);
if (mismatch) process.exit(2);
