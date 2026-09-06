/**
 * SH-D-07: the exit guard's third variant is a dead end.
 *
 * 1172:4804 draws three guard variants. Two are fully wired:
 *   dirty          Stay -> 199:2  · Leave anyway -> 927:4474 · Save & leave -> 927:4474
 *   risky-offline  Stay -> 66:441 · Leave and lose changes -> 927:4474
 * The third, `stranded`, has BOTH buttons at rx=0. Wiring the topbar's exit
 * across 104 instances today raised this board's in-degree to ~104, which made
 * the dead end busier rather than fixing it.
 *
 * Destinations follow the code, not a guess. `stranded` fires when the PROJECT
 * is clean but mirror writes are queued — StudioHeader.tsx:414-415,
 * `const stranded = totalPendingMirrors(); if (stranded > 0) ...` — so Stay
 * returns to the ordinary clean shell (199:2), exactly as the `dirty` variant's
 * Stay does, rather than to the offline board the `risky` variant uses. Leave
 * anyway calls `leaveAnyway` (:445-450) like both siblings.
 *
 * Note this does NOT address SH-D-10, which says 927:4474 is the wrong exit
 * destination for all three variants — that is one question about the
 * destination, separate from these two missing edges, and is recorded there.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});

// refuse unless the siblings still look the way this fix was derived from
const sibStay=await figma.getNodeByIdAsync("1172:4808");
const sibLeave=await figma.getNodeByIdAsync("1172:4810");
const d1=sibStay.reactions[0]&&sibStay.reactions[0].actions[0]&&sibStay.reactions[0].actions[0].destinationId;
const d2=sibLeave.reactions[0]&&sibLeave.reactions[0].actions[0]&&sibLeave.reactions[0].actions[0].destinationId;
if(d1!=="199:2"||d2!=="927:4474") return "sibling wiring changed (Stay->"+d1+", Leave->"+d2+") - refusing";

for(const [id,dest,label] of [["1309:7","199:2","stranded · Stay"],
                              ["1309:9","927:4474","stranded · Leave anyway"]]){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ OUT.push(id+" missing"); continue; }
  if((n.reactions||[]).length){ OUT.push(label+" already wired - skipped"); continue; }
  await n.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(dest)]}]);
  const back=await figma.getNodeByIdAsync(id);
  OUT.push("wired "+label+" ("+id+") -> "+dest+"   readback="+((back.reactions||[]).length?back.reactions[0].actions[0].destinationId:"NONE"));
}
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"wire the stranded exit-guard variant to match its siblings",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
