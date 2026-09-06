/**
 * Reconcile panels whose stack runs off the bottom.
 *
 * The cause is always the same: a node was INSERTED and the spacer above the
 * footer was never shrunk, so everything below it slid past the board edge and
 * was clipped away. `Media · no-results` lost its entire footer that way — 197px
 * below an 812px board — and no other detector could see it.
 *
 * The repair mirrors the cause: shrink the spacer by exactly the overrun and
 * pull everything below it up by the same amount. Where a board has no spacer to
 * take the slack, this REFUSES and says so — moving content without somewhere to
 * put the difference just relocates the defect, and this arc has already shipped
 * one repair that left the file worse than it found it.
 *
 * The move is guarded. Writing `y` on a child whose `layoutPositioning` is
 * "AUTO" inside an auto-layout parent is SILENTLY IGNORED by Figma — the write
 * returns, nothing throws, and a script that trusts its own intent prints a
 * success for a move that never happened. This one refuses that board instead,
 * because flipping the children to ABSOLUTE to force the move would quietly
 * convert a flow-laid panel into a positioned one, which is a bigger edit than
 * the defect. And every applied move is RE-MEASURED afterwards: the line printed
 * is what the file now says, not what was asked for.
 *
 * Usage: node scripts/figma/fix-panel-stacks.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
const BOARDS = ["777:4093","782:4353","1704:8361","1704:8396","807:8342","156:2"];

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const H=812, out=[];
for(const id of ${JSON.stringify(BOARDS)}){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const kids=(b.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0 && c.height);
  const last=kids.reduce((a,c)=>(c.y+c.height)>(a.y+a.height)?c:a, kids[0]);
  const gap=Math.round(last.y+last.height)-H;
  if(gap<=0){ out.push("OK\\t"+id+"\\talready reconciles"); continue; }
  /* the simplest case: the overrunning node IS the spacer, so it is just too
     tall and nothing needs moving */
  if(/spacer/i.test(String(last.name))){
    out.push((${APPLY}?"FIX\t":"WOULD\t")+id+"\t"+String(b.name).slice(0,30)+"\tspacer "+last.id+" is itself the overrun: h"+Math.round(last.height)+"->"+(Math.round(last.height)-gap));
    ${APPLY ? 'last.resize(last.width, Math.round(last.height)-gap);' : ''}
    continue;
  }
  /* otherwise the spacer is the slack in the stack; prefer the one ABOVE the overrunning node */
  const spacers=kids.filter(c=>/spacer/i.test(String(c.name)) && c.y < last.y && c.height > gap);
  const sp = spacers.sort((a,c)=>(c.height-a.height))[0];
  if(!sp){
    out.push("REFUSED\\t"+id+"\\t"+String(b.name).slice(0,30)+"\\toverruns by "+gap+
      " and has no spacer taller than that to absorb it — needs eyes");
    continue;
  }
  const below=kids.filter(c=>c.y>sp.y);
  /* the write that lies: y on an AUTO-positioned child of an auto-layout parent */
  const stuck=b.layoutMode&&b.layoutMode!=="NONE"
    ? below.filter(c=>(c.layoutPositioning||"AUTO")!=="ABSOLUTE") : [];
  if(stuck.length){
    out.push("REFUSED\\t"+id+"\\t"+String(b.name).slice(0,30)+"\\tboard is "+b.layoutMode+
      " auto-layout and "+stuck.length+" of the "+below.length+" nodes below the spacer are AUTO — a y write on them is ignored, not applied. Needs eyes.");
    continue;
  }
  out.push((${APPLY}?"FIX\\t":"WOULD\\t")+id+"\\t"+String(b.name).slice(0,30)+"\\tspacer "+sp.id+" h"+Math.round(sp.height)+"->"+(Math.round(sp.height)-gap)+", "+
    below.length+" nodes below pulled up "+gap);
  ${APPLY ? `
  const want=below.map(c=>({id:c.id,y:Math.round(c.y)-gap}));
  sp.resize(sp.width, Math.round(sp.height)-gap);
  for(const c of below) c.y=Math.round(c.y)-gap;
  /* read the outcome back — the write is not the proof */
  let bad=0;
  for(const w of want){ const n=await figma.getNodeByIdAsync(w.id); if(!n||Math.round(n.y)!==w.y) bad++; }
  const after=await figma.getNodeByIdAsync(id);
  const ak=(after.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0 && c.height);
  const al=ak.reduce((a,c)=>(c.y+c.height)>(a.y+a.height)?c:a, ak[0]);
  out.push("  VERIFY\\t"+id+"\\t"+(bad?bad+" of "+want.length+" moves did NOT take":"all "+want.length+" moves took")+
    ", stack now ends at "+Math.round(al.y+al.height)+" (board "+H+")");
  ` : ''}
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "reconcile" : "dry-run reconciling") + " the panels whose stack runs off the bottom", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
