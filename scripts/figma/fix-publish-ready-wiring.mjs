/**
 * SH-B-01 / SH-A-01: the Publish wiring is inverted.
 *
 * Census across the topbar instances on page 1:3 (two agents, independently):
 *   Publish=ready     23 instances,  0 wired
 *   Publish=disabled  80 instances, 55 wired (54 -> 307:2193, 1 -> 833:4518)
 *   Publish=anyway     2 instances,  0 wired
 *
 * The code is the mirror image. Topbar.tsx:311-320 renders the disabled branch
 * with `onClick={() => {}}` — literally nothing — and :322-333 is the only one
 * that fires, calling onPublish -> StudioHeader.tsx:662 handleCtaClick.
 *
 * So the prototype wires the button the product disables and leaves dead the
 * button the product acts on.
 *
 * This fixes only the additive half: give the 23 `ready` instances the edge they
 * should have had. The 54 edges hanging off DISABLED instances are deliberately
 * left alone and recorded instead — removing them is destructive, and they may
 * encode a legitimate "click to see why publishing is blocked" affordance that
 * the boards use elsewhere. That is one question about a convention, separate
 * from 23 missing edges.
 *
 * Destination: 833:4518 "Publish · pre-checks", which is where the single
 * correctly-wired instance already points. Note handleCtaClick has THREE
 * outcomes (open review when nextMove isn't publish, the issues-confirm modal
 * when errorCount > 0, else publishNow) — a single prototype edge cannot express
 * that, and pre-checks is the common path.
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
const dest=await figma.getNodeByIdAsync("833:4518");
if(!dest) return "833:4518 missing - refusing";
const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});

let ready=0, wired=0, already=0, failed=0, selfNav=0;
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
      if(!p||p.value!=="ready") continue;
      ready++;
      // the publish button inside this topbar instance
      let btn=null; const s2=[n];
      while(s2.length){ const k=s2.pop();
        if(/^btn\\/publish$/i.test(k.name)){ btn=k; break; }
        if(CONT.has(k.type)&&k.children) for(const g of k.children) s2.push(g); }
      if(!btn) continue;
      if((btn.reactions||[]).length){ already++; continue; }
      if(b.id==="833:4518"){ selfNav++; continue; }
      if(!APPLY){ wired++; continue; }
      try{ await btn.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav("833:4518")]}]); wired++; }
      catch(e){ failed++; if(failed<3) OUT.push("   FAILED on "+b.id+": "+String(e).slice(0,80)); }
    }
  }
}
OUT.push((APPLY?"WIRED ":"WOULD WIRE ")+wired+" of "+ready+" Publish=ready instances -> 833:4518   already="+already+"  self-nav skipped="+selfNav+"  failed="+failed);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"wire":"dry-run wiring")+" the live Publish buttons",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
