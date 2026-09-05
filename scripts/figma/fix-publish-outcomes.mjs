/**
 * W-D-01, narrowed by adversarial verification (W-D-01-b).
 *
 * The original finding said the publish lifecycle was broken at both ends. The
 * verifier corrected it in the producer's favour: 784:4250 "Publish · publishing"
 * IS properly reached (2 real inbound flow edges + 1 state chip). The gap is
 * one-sided and entirely DOWNSTREAM — nothing leads from publishing to either
 * outcome, so the money path stops at the progress bar:
 *
 *   784:4250 publishing  -> 784:4326 "Publish · live"    (missing)
 *   784:4250 publishing  -> 784:4403 "Publish · failed"  (missing)
 *
 * Both outcome boards exist and are drawn; each had in-degree 1, and that single
 * inbound was a reviewer state-chip on the panel rather than a flow edge.
 *
 * The two edges are carried on `hotspot/state` rows, which is this file's own
 * convention for reaching an alternate outcome. They are CLONED from the board's
 * existing hotspot (787:4377) rather than built from scratch: it is label-less
 * and already hit-tests correctly here, and a hand-built frame would be a guess
 * about what makes a hotspot clickable. They are seated INSIDE the board, over
 * its empty spacer band, because this board clips its content — a hotspot parked
 * below a clipping board is neither rendered nor clickable (see W-CO-12).
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const b=await figma.getNodeByIdAsync("784:4250");
const bb=b.absoluteBoundingBox;
const proto=await figma.getNodeByIdAsync("787:4377");
if(!proto||proto.parent.id!=="784:4250") return "template hotspot 787:4377 not on this board - refusing";
if(!b.clipsContent) OUT.push("note: board does not clip, seating inside is still correct");

const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});
const WANT=[["784:4326","hotspot/state · Publish · live",710],
            ["784:4403","hotspot/state · Publish · failed",744]];

for(const [dest,name,y] of WANT){
  const d=await figma.getNodeByIdAsync(dest);
  if(!d) { OUT.push("destination "+dest+" missing - skipped"); continue; }
  // idempotent: skip if this board already reaches it
  let already=false;
  for(const c of b.children) for(const rx of (c.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===dest) already=true;
  if(already){ OUT.push(name+" already wired - skipped"); continue; }

  const h=proto.clone();
  b.appendChild(h);
  h.layoutPositioning="ABSOLUTE";
  h.x=proto.x; h.y=proto.y+(y-Math.round(proto.absoluteBoundingBox.y-bb.y));
  h.name=name;
  await h.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(dest)]}]);
  const r=h.absoluteBoundingBox;
  OUT.push("created "+h.id+" '"+name+"' at y="+Math.round(r.y-bb.y)+" ("+Math.round(h.width)+"x"+Math.round(h.height)+") -> "+dest+" '"+d.name.slice(0,30)+"'");
}

// verify the outcomes are now reached from the producer
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
function carriers(n,acc){acc.push(n); if(CONT.has(n.type)&&n.children) for(const c of n.children) carriers(c,acc); return acc;}
async function inb(t){ let c=0;
  for(const s of pg.children){ if(s.type!=="SECTION") continue;
    for(const bd of s.children) for(const n of carriers(bd,[]))
      for(const rx of (n.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===t) c++; }
  return c; }
OUT.push("784:4326 live   in-degree now "+await inb("784:4326")+" (was 1)");
OUT.push("784:4403 failed in-degree now "+await inb("784:4403")+" (was 1)");
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"connect publishing to its two outcomes",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
