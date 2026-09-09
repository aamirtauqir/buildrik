/**
 * Put UX-G-04's quota meter where UX-G-04 asks for it: beside the send control.
 *
 * `build-ai-v2-boards.mjs --only=D` drew the meter on board 170:2 (AI · idle) at
 * `pf.x + pf.width - 116, pf.y - 20`, where `pf` was matched by /prompt/i
 * anywhere in the subtree. Two things were wrong and only a read found either:
 *
 *  1. Those coordinates are relative to **pf's own parent**; the meter was
 *     appended to the BOARD. Two coordinate spaces, silently mixed.
 *  2. It did not matter, because **170:2 is a VERTICAL auto-layout frame packed
 *     MIN with zero spacing and zero padding** — x/y on a flow child are
 *     computed by the parent and assigning them is a no-op. The first attempt
 *     at this fix wrote x=164 and read back x=0: the call returned, the node
 *     did not move.
 *
 * So the meter has to leave the flow (`layoutPositioning = "ABSOLUTE"`) before
 * it can be placed — and leaving the flow re-flows the stack, so this reverts
 * if any sibling moves.
 *
 * The slot is measured, not guessed. Board 170:2 read 2026-09-07:
 *   Back row 0..36 · Header 36..80 · Scope 80..112 · Prompt 112..184 ·
 *   Suggestions 184..304 · note 304..400 · Draft 400..492 · hotspots below.
 * The children are contiguous, so there is NO gap above the composer: the first
 * attempt at a "band above the composer" fell through to the composer's
 * top-right and put the label across the input's top-right corner. What is
 * genuinely free is the bottom-right of the input itself (170:8, board
 * 16,120 248x52), whose only content is the placeholder 170:9 at 26,128
 * 169x18 — the standard place for a quiet counter, and the one that is
 * literally beside where the prompt is sent.
 *
 * The slot is computed from those nodes at run time and asserted clear of every
 * TEXT inside the input; if it is not clear, the step falls back to the free
 * right-hand half of the Scope row and says which it used.
 *
 * Usage: node scripts/figma/ai-gap-fix-quota-meter.mjs [--apply]
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const code = [
  "const pg=figma.root.children.find(p=>p.id===\"1:3\");",
  "await figma.setCurrentPageAsync(pg);",
  "const OUT=[];",
  "const b=await figma.getNodeByIdAsync(\"170:2\");",
  "const bb=b.absoluteBoundingBox;",
  "const rel=(n)=>{ const r=n.absoluteBoundingBox; return {x:r.x-bb.x,y:r.y-bb.y,w:r.width,h:r.height}; };",
  "const hit=(a,c)=>a.x<c.x+c.w-0.5&&a.x+a.w>c.x+0.5&&a.y<c.y+c.h-0.5&&a.y+a.h>c.y+0.5;",
  "OUT.push(\"BOARD\\\\t\"+b.id+\"\\\\t\"+Math.round(bb.width)+\"x\"+Math.round(bb.height)+\"\\\\tlayout=\"+b.layoutMode+\"\\\\tspacing=\"+b.itemSpacing);",
  "const meter=b.children.find(n=>n.type===\"TEXT\"&&n.characters===\"7 left today\");",
  "if(!meter){ OUT.push(\"NO-METER\"); return OUT.join(String.fromCharCode(10)); }",
  "const pf=b.children.find(c=>c.type!==\"TEXT\"&&/prompt|composer/i.test(c.name));",
  "const scope=b.children.find(c=>c.type!==\"TEXT\"&&/^scope/i.test(c.name));",
  "if(!pf){ OUT.push(\"REFUSED\\\\tno composer frame among the board's direct children\"); return OUT.join(String.fromCharCode(10)); }",
  "const inner=(pf.children||[]).filter(c=>c.type!==\"TEXT\"&&c.width);",
  "const field=inner.length?inner.reduce((a,c)=>c.width*c.height>a.width*a.height?c:a):pf;",
  "const fr=rel(field);",
  "const texts=[]; { const st=[...field.children||[]]; while(st.length){ const n=st.pop(); if(n.type===\"TEXT\") texts.push(rel(n)); else if(n.children) st.push(...n.children); } }",
  "OUT.push(\"FIELD\\\\t\"+field.id+\" '\"+field.name+\"'\\\\t\"+Math.round(fr.x)+\",\"+Math.round(fr.y)+\" \"+Math.round(fr.w)+\"x\"+Math.round(fr.h)+\"\\\\ttexts=\"+texts.length);",
  "const W=Math.round(meter.width), H=Math.round(meter.height);",
  "let slot={x:Math.round(fr.x+fr.w-10-W),y:Math.round(fr.y+fr.h-8-H),w:W,h:H}, where=\"input-bottom-right\";",
  "if(texts.some(t=>hit(slot,t))){",
  "  if(scope){ const sr=rel(scope); slot={x:Math.round(bb.width-16-W),y:Math.round(sr.y+(sr.h-H)/2),w:W,h:H}; where=\"scope-row-right\"; }",
  "  else { OUT.push(\"REFUSED\\\\tinput bottom-right is occupied and there is no scope row to fall back to\"); return OUT.join(String.fromCharCode(10)); }",
  "}",
  "OUT.push(\"SLOT\\\\t\"+where+\"\\\\t\"+slot.x+\",\"+slot.y+\" \"+slot.w+\"x\"+slot.h);",
  "if(meter.layoutPositioning===\"ABSOLUTE\"&&Math.abs(meter.x-slot.x)<2&&Math.abs(meter.y-slot.y)<2){",
  "  OUT.push(\"SAME\\\\t\"+meter.id+\"\\\\talready at \"+slot.x+\",\"+slot.y);",
  "  return OUT.join(String.fromCharCode(10));",
  "}",
  "const before=b.children.filter(c=>c.id!==meter.id).map(c=>[c.id,Math.round(c.x),Math.round(c.y)]);",
  "OUT.push(\"METER-BEFORE\\\\t\"+meter.id+\"\\\\t@\"+Math.round(meter.x)+\",\"+Math.round(meter.y)+\"\\\\tpos=\"+meter.layoutPositioning);",
  "meter.layoutPositioning=\"ABSOLUTE\"; meter.x=slot.x; meter.y=slot.y;",
  "let moved=0, first=\"\";",
  "for(const [id,ox,oy] of before){ const n=await figma.getNodeByIdAsync(id); if(Math.abs(n.x-ox)>1||Math.abs(n.y-oy)>1){ moved++; if(!first) first=id+\" \"+ox+\",\"+oy+\" -> \"+Math.round(n.x)+\",\"+Math.round(n.y); } }",
  "if(moved){ meter.layoutPositioning=\"AUTO\"; OUT.push(\"REVERTED\\\\t\"+moved+\" sibling(s) moved: \"+first); return OUT.join(String.fromCharCode(10)); }",
  "const ck=await figma.getNodeByIdAsync(meter.id); const cb=ck.absoluteBoundingBox;",
  "OUT.push(\"METER-AFTER\\\\t\"+ck.id+\"\\\\t@\"+Math.round(ck.x)+\",\"+Math.round(ck.y)+\"\\\\t\"+Math.round(ck.width)+\"x\"+Math.round(ck.height)+\"\\\\tpos=\"+ck.layoutPositioning+\"\\\\t\"+where+\"\\\\tsiblings-moved=0\\\\tfits=\"+((cb.x>=bb.x-0.5)&&(cb.x+cb.width<=bb.x+bb.width+0.5)&&(cb.y>=bb.y-0.5)&&(cb.y+cb.height<=bb.y+bb.height+0.5))+\"\\\\t\"+JSON.stringify(ck.characters));",
  "return OUT.join(String.fromCharCode(10));",
].join(String.fromCharCode(10));

console.log("payload " + (code.length) + " chars");
if (!APPLY) { console.log("dry run — not sent"); process.exit(0); }
await connect();
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "place the UX-G-04 quota meter at the composer input's bottom-right on board 170:2, measured, absolute, reverting if any sibling moves",
    skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? JSON.stringify(r).slice(0, 900));
