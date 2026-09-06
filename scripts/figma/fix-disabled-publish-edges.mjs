/**
 * SH-CO-02, now settled: 54 topbar instances drawing Publish=DISABLED carried an
 * ON_CLICK to 307:2193 "S5.4 · gate · pending". In the product that button does
 * nothing at all — Topbar.tsx:311-320 renders the disabled branch with
 * `onClick={() => {}}` and only :322-333 fires. A disabled control that
 * navigates teaches a designer the opposite of what ships.
 *
 * I left these in place on the first pass because they might have been a
 * deliberate "click to see WHY publishing is blocked" affordance, and removing
 * them could have orphaned the gate board. Both halves are now checked:
 *
 *   - The gate keeps a door. 307:2193's inbound edges are 54 from disabled
 *     publish buttons AND 1 from `903:4507 hotspot/alt · blocked by approval` on
 *     833:4518 — a proper alternate-outcome edge ON the producer, which is this
 *     file's own convention (36 hotspot/alt against 386 reviewer chips).
 *   - The product does surface the reason, as a TOOLTIP on the disabled button
 *     (Topbar.tsx:305-310), not by navigating.
 *
 * So the reason stays reachable by the correct edge and the false affordance goes.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);

// refuse unless the gate still has its non-publish door
let alt=0;
function carriers(n,acc){acc.push(n); if(CONT.has(n.type)&&n.children) for(const c of n.children) carriers(c,acc); return acc;}
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  for(const b of s.children) for(const n of carriers(b,[]))
    for(const rx of (n.reactions||[])) for(const a of (rx.actions||[]))
      if(a&&a.destinationId==="307:2193" && !/^btn\\/publish$/i.test(n.name)) alt++; }
if(alt===0) return "the gate board's only doors are the disabled publish buttons - refusing, removal would orphan it";
OUT.push("gate 307:2193 keeps "+alt+" non-publish inbound edge(s) - safe to proceed");

let cleared=0, kept=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(b.type!=="FRAME"||!b.children) continue;
    const st=[b];
    while(st.length){
      const n=st.pop();
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
      if(n.type!=="INSTANCE") continue;
      const mc=await n.getMainComponentAsync();
      const set=mc&&mc.parent&&mc.parent.type==="COMPONENT_SET"?mc.parent.id:null;
      if(set!=="681:122") continue;
      const p=n.componentProperties&&n.componentProperties.Publish;
      if(!p||p.value!=="disabled") continue;
      let btn=null; const s2=[n];
      while(s2.length){ const k=s2.pop();
        if(/^btn\\/publish$/i.test(k.name)){ btn=k; break; }
        if(CONT.has(k.type)&&k.children) for(const g of k.children) s2.push(g); }
      if(!btn||!(btn.reactions||[]).length) continue;
      const dest=btn.reactions[0].actions[0]&&btn.reactions[0].actions[0].destinationId;
      /* Leave the single instance pointing at the real publish flow — that one
         is a mis-set VARIANT, not a false affordance, and is filed separately. */
      if(dest!=="307:2193"){ kept++; continue; }
      if(APPLY) await btn.setReactionsAsync([]);
      cleared++;
    }
  }
}
OUT.push((APPLY?"CLEARED ":"WOULD CLEAR ")+cleared+" edges from disabled Publish buttons   left alone (non-gate destination)="+kept);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"clear":"dry-run clearing")+" edges on disabled Publish buttons",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
