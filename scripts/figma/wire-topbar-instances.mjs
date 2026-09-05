/**
 * W-L-01: the exit flow had no first step, and one node caused it.
 *
 * The Topbar component master (681:27, page 1:2) carries rx=0 on EVERY control -
 * btn/exit, btn/notifications, btn/more, btn/publish, pill/saved - so no instance
 * inherits an edge. Consequence: the exit guard 1172:4804 had in-degree 1 across
 * all 27 sections, and that one edge came from 927:4474 - the screen you reach
 * AFTER leaving. The guard protecting the exit was reachable only from the far
 * side of it. Notifications was unreachable from the shell for the same reason.
 *
 * Wiring the MASTER does not work: the destinations live on page 1:3 and the
 * master on 1:2, and Figma rejects a cross-page prototype destination outright
 * ("destination 1172:4804 was rejected"). Probed before assuming, and reverted.
 *
 * So the edges go on each topbar INSTANCE on page 1:3, as overrides. Only
 * controls whose destination is correct on EVERY board are wired:
 *   btn/exit          -> 1172:4804  Exit guard
 *   btn/notifications -> 165:2      Notifications · unread
 *   btn/more          -> 642:3401   Site menu (⋯)
 * btn/publish is deliberately NOT wired - it is drawn disabled on the offline,
 * loading and preview boards, and an edge there would contradict the board.
 * pill/saved is a button only in the unsaved state, so it is per-board too.
 *
 * Idempotent: a control that already has its own reaction is left alone.
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
const WIRE={"btn/exit":"1172:4804","btn/notifications":"165:2","btn/more":"642:3401"};
for(const d of Object.values(WIRE)){ const n=await figma.getNodeByIdAsync(d); if(!n) return "destination "+d+" missing - refusing"; }
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:null,resetVideoPosition:false,resetScrollPosition:true});

let boards=0, wired=0, skipped=0, failed=0;
const perControl={};
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(b.type!=="FRAME") continue;
    if(/^caption\\/|^hotspot\\//.test(b.name)) continue;
    // find this board's topbar instance
    let tb=null; const st=[b];
    while(st.length){ const n=st.pop();
      if(n.type==="INSTANCE"){ const mc=await n.getMainComponentAsync(); if(mc&&mc.id==="681:27"){ tb=n; break; } }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
    if(!tb) continue;
    boards++;
    const st2=[tb];
    while(st2.length){
      const n=st2.pop();
      const dest=WIRE[n.name];
      if(dest){
        if((n.reactions||[]).length>0){ skipped++; }
        else if(APPLY){
          try{ await n.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(dest)]}]);
               wired++; perControl[n.name]=(perControl[n.name]||0)+1; }
          catch(e){ failed++; if(failed<3) OUT.push("  FAILED "+n.id+" "+String(e).slice(0,90)); }
        } else { wired++; perControl[n.name]=(perControl[n.name]||0)+1; }
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st2.push(c);
    }
  }
}
OUT.push((APPLY?"WIRED ":"WOULD WIRE ")+wired+" control(s) across "+boards+" boards with a topbar   skipped(already wired)="+skipped+"  failed="+failed);
OUT.push("  per control: "+JSON.stringify(perControl));
// verify inbound counts
async function inbound(target){ let c=0;
  for(const s of pg.children){ if(s.type!=="SECTION") continue;
    for(const b of s.children){ const st=[b];
      while(st.length){ const n=st.pop();
        for(const rx of (n.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===target) c++;
        if(CONT.has(n.type)&&n.children) for(const g of n.children) st.push(g); } } }
  return c; }
for(const [k,v] of Object.entries(WIRE)) OUT.push("  inbound to "+v+" ("+k+"): "+await inbound(v));
return OUT.join("\\n").slice(0,6000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"wire":"dry-run wire")+" topbar controls on every 1:3 board",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
