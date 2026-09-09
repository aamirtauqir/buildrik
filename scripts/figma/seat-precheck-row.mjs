/**
 * The second half of UX-E-06, and a correction to how the first half was done.
 *
 * `apply-publish-v2.mjs` inserts the seventh checklist row at y=321 and shifts
 * the divider / warnings band / second divider / footer down by 36 to make room.
 * Neither half worked, for one reason that only a read-back could show:
 *
 *   **the pre-checks boards are VERTICAL AUTO-LAYOUT stacks.**
 *
 * The children's y values are 0+56, 56+1, 57+48, 105, 141, 177, 213, 249, 285,
 * 321+1, 322+56, 378+1, 379+60 — a stack with itemSpacing 0 whose content ends
 * at 439 inside a 475-tall board. Every `c.y = c.y + 36` was accepted and
 * discarded, all eight reading back unchanged, because a flow child's position
 * belongs to its parent. The row itself only stayed at 321 because it was given
 * `layoutPositioning = "ABSOLUTE"`, which is what parked it ON TOP of the
 * divider instead of above it.
 *
 * The stack is also the fix. The 36px of dead space at the bottom is exactly one
 * row, so seating the row as a FLOW child immediately before the divider makes
 * auto-layout perform the shift itself — divider 321 -> 357, band 322 -> 358,
 * divider 378 -> 414, footer 379 -> 415, content ending flush on the board's
 * 475 bottom edge. Nothing is resized and no sibling is moved by hand.
 *
 * `insertChild`'s index is interpreted after the moved child is spliced out, so
 * the index is not assumed: the row is seated, its y read back, and the
 * neighbouring index tried if the first one missed. Idempotent — a row already
 * sitting at 321 as a flow child is left alone.
 *
 * Usage:
 *   node scripts/figma/seat-precheck-row.mjs            # dry run
 *   node scripts/figma/seat-precheck-row.mjs --apply
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY=${APPLY};
const AT=321;
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
for(const bid of ["833:4518","893:4518"]){
  const b=await figma.getNodeByIdAsync(bid);
  if(!b){ OUT.push("MISSING  "+bid); continue; }
  OUT.push(bid+"  "+Math.round(b.width)+"x"+Math.round(b.height)+
    "  layoutMode="+(b.layoutMode||"NONE")+" itemSpacing="+(b.itemSpacing!=null?b.itemSpacing:"-")+
    " primaryAxisSizing="+(b.primaryAxisSizingMode||"-"));
  const row=b.children.find(c=>c.name==="v2/row-approval");
  if(!row){ OUT.push("MISSING  "+bid+"  v2/row-approval - run apply-publish-v2.mjs --apply first"); continue; }
  if(!b.layoutMode||b.layoutMode==="NONE"){ OUT.push("NOTSTACK "+bid+"  not auto-layout after all; this script does not apply"); continue; }
  const div=b.children.find(c=>c.name.indexOf("v2/")!==0&&c.name.indexOf("hotspot/")!==0&&Math.round(c.y)>=AT);
  if(!div){ OUT.push("NODIV    "+bid+"  nothing at or below "+AT+" to seat the row above"); continue; }
  if(row.layoutPositioning!=="ABSOLUTE"&&Math.round(row.y)===AT&&Math.round(div.y)>AT){
    OUT.push("SAME     "+bid+"  row already seated in the stack at "+AT+"; divider at "+Math.round(div.y)); continue; }
  if(!APPLY){
    OUT.push("WOULD    "+bid+"  seat "+row.id+" (now "+row.layoutPositioning+" @y="+Math.round(row.y)+
      ") as a flow child before "+div.id+" '"+String(div.name).slice(0,20)+"' @y="+Math.round(div.y)); continue; }
  row.layoutPositioning="AUTO";
  let seated=false, tried=[];
  for(const d of [0,-1,1,-2,2]){
    const i=b.children.findIndex(c=>c.id===div.id)+d;
    if(i<0||i>b.children.length) continue;
    b.insertChild(i,row);
    const y=Math.round(row.y);
    tried.push(i+"->"+y);
    if(y===AT){ seated=true; break; }
  }
  const a=await figma.getNodeByIdAsync(row.id);
  const dv=await figma.getNodeByIdAsync(div.id);
  OUT.push((seated?"OK       ":"MISMATCH ")+bid+"  row "+a.id+" positioning="+a.layoutPositioning+
    " y="+Math.round(a.y)+" h="+Math.round(a.height)+"   divider "+dv.id+" y="+Math.round(dv.y)+
    "   (indices tried "+tried.join(", ")+")");
}
OUT.push("--- read-back ---");
for(const bid of ["833:4518","893:4518"]){
  const b=await figma.getNodeByIdAsync(bid);
  if(!b) continue;
  let bottom=0;
  for(const c of b.children) if(String(c.name).indexOf("hotspot/")!==0) bottom=Math.max(bottom,Math.round(c.y+c.height));
  OUT.push(bid+"  "+Math.round(b.width)+"x"+Math.round(b.height)+"   content ends at "+bottom);
  for(const c of [...b.children].sort((p,q)=>p.y-q.y))
    OUT.push("   y="+String(Math.round(c.y)).padStart(4)+" h="+String(Math.round(c.height)).padStart(3)+"  "+c.id+"  "+String(c.name).slice(0,44));
}
return OUT.join(String.fromCharCode(10)).slice(0,15000);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "seat" : "dry-run seating") + " the seventh pre-checks row in the board's auto-layout stack (UX-E-06)",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 900));
