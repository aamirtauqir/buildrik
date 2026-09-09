/**
 * Let a clipped TEXT grow to the height its glyphs need — but only if that is
 * safe, and revert it if it is not.
 *
 * `render-defects.mjs` reports CLIPPED for a fixed-height TEXT whose box fits
 * its parent while its glyphs do not: the node measures 28px tall and the same
 * string, allowed to auto-height, measures 32 or 48. Every box-based check in
 * this repo passes it, because the box is fine. The reader sees a cut letter.
 *
 * The repair is one property — `textAutoResize = "HEIGHT"` — and it is exactly
 * the kind of one-liner that has repeatedly made things worse here. Growing a
 * node inside a fixed row can push it out of its parent or straight through the
 * sibling below it, trading a clipped descender for an overlap. Two fixers in
 * this arc did their damage that way: `relay-panel-width.mjs` created six
 * OVERPRINTs while fixing a width, and an earlier overprint fixer squeezed three
 * nodes to 40px recreating the class it was clearing.
 *
 * So every node is checked AFTER the change and reverted on the spot if it now
 * escapes its parent or collides with a sibling below. A fixer that can leave
 * the file worse than it found it is not a fixer.
 *
 * Auto-layout parents are left alone: there the parent owns the height, growing
 * a child reflows the whole stack, and that is a layout decision rather than a
 * repair.
 *
 * Usage:
 *   node scripts/figma/fix-clipped-text.mjs                 # dry run, 1 call
 *   node scripts/figma/fix-clipped-text.mjs --apply
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

/* As reported by render-defects.mjs on 1776:8373, 2026-09-07. */
const NODES = ["153:149", "154:25", "154:186", "306:2257", "306:2290", "306:2323"];

await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id==="1:3");',
  "await figma.setCurrentPageAsync(pg);",
  "const APPLY=" + APPLY + ";",
  "const out=[];",
  "for(const id of " + JSON.stringify(NODES) + "){",
  "  const n=await figma.getNodeByIdAsync(id);",
  '  if(!n){ out.push(id+"\\tMISSING"); continue; }',
  '  if(n.type!=="TEXT"){ out.push(id+"\\tNOTTEXT\\t"+n.type); continue; }',
  "  const p=n.parent;",
  '  if(p && p.layoutMode && p.layoutMode!=="NONE"){ out.push(id+"\\tAUTOLAYOUT\\tparent "+p.id+" owns height - reflow is a layout decision, not a repair"); continue; }',
  "  const was=Math.round(n.height), wasMode=n.textAutoResize;",
  /* Measure the need without touching the original. */
  "  let need=-1;",
  "  try{ const c=n.clone(); c.textAutoResize=\"HEIGHT\"; need=Math.round(c.height); c.remove(); }catch(e){ need=-1; }",
  '  if(need<0){ out.push(id+"\\tUNMEASURED\\tclone or font failed - not touched"); continue; }',
  '  if(need<=was){ out.push(id+"\\tSAME\\talready tall enough ("+was+")"); continue; }',
  '  if(!APPLY){ out.push(id+"\\tDRY\\t"+was+" -> "+need+"  parent "+(p?p.id:"none")+" "+(p?Math.round(p.height):"?")); continue; }',
  "  for(const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);",
  '  if(typeof n.fontName==="object") await figma.loadFontAsync(n.fontName);',
  '  n.textAutoResize="HEIGHT";',
  "  const b=await figma.getNodeByIdAsync(id);",
  /* Two ways this can be worse than the clip it fixed. */
  "  let bad=null;",
  "  if(p && typeof p.height===\"number\" && b.y + b.height > p.height + 0.5) bad=\"escapes parent by \"+Math.round(b.y+b.height-p.height);",
  "  if(!bad && p && p.children) for(const sib of p.children){",
  "    if(sib.id===b.id || typeof sib.y!==\"number\") continue;",
  "    if(sib.y < b.y + 0.5) continue;",
  "    if(b.y + b.height > sib.y + 0.5){ bad=\"overlaps sibling \"+sib.id+\" by \"+Math.round(b.y+b.height-sib.y); break; }",
  "  }",
  "  if(bad){",
  "    n.textAutoResize=wasMode; n.resize(b.width, was);",
  "    const rb=await figma.getNodeByIdAsync(id);",
  '    out.push(id+"\\tREVERTED\\t"+bad+"  (back to "+Math.round(rb.height)+")");',
  "    continue;",
  "  }",
  '  out.push(id+"\\tOK\\t"+was+" -> "+Math.round(b.height)+"  in "+(p?p.id:"none"));',
  "}",
  "return out.join(String.fromCharCode(10));",
];

const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: (APPLY ? "un-clip" : "dry-run") + " " + NODES.length + " clipped text nodes", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing changed."); process.exit(2); }
console.log(txt);
const reverted = (txt.match(/\tREVERTED\t/g) || []).length;
if (reverted) console.error("\n" + reverted + " node(s) could not be un-clipped without causing a worse defect — they need a layout change, not a resize.");
