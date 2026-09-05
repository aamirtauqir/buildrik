/**
 * W-L-03: the two save boards I added earlier today were content-correct and
 * in-degree 0 — six boarded states with two of them unreachable is a complete
 * component set and an incomplete flow.
 *
 * The lifecycle the code ships (chrome-ui/SaveStatus.tsx:24-29,41-52) is
 * unsaved -> saving -> saved, with saving -> error -> retry. SaveStatus documents
 * that the PILL becomes the button "for the two states a user can act on", which
 * is what makes the producer and the retry real controls rather than invented
 * affordances:
 *
 *   65:2       pill "Unsaved changes"      -> 2162:11660  Saving          (producer)
 *   2162:11660 hotspot/alt                 -> 199:2       Saved (default) (outcome)
 *   2162:11660 hotspot/alt                 -> 2162:11838  Save failed     (outcome)
 *   2162:11838 pill "Save failed — retry"  -> 2162:11660  Saving          (retry)
 *
 * Outcome edges use `hotspot/alt` and sit ON the producer, which is this file's
 * measured convention (36 alt = outcome-on-producer, 386 state = reviewer chip
 * on a hub board). They are cloned from the board's own existing hotspot and
 * stay inside it, because this board clips.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});

// 1 + 4: the two pills the code says are buttons
for(const [pillId,dest,label] of [["I682:2657;698:525","2162:11660","65:2 pill 'Unsaved changes' (producer)"],
                                  ["I2162:11839;698:465","2162:11660","2162:11838 pill 'Save failed — retry' (retry)"]]){
  const p=await figma.getNodeByIdAsync(pillId);
  if(!p){ OUT.push(label+" - pill not found, skipped"); continue; }
  if((p.reactions||[]).length){ OUT.push(label+" already wired - skipped"); continue; }
  await p.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(dest)]}]);
  OUT.push("wired "+label+" -> "+dest);
}

// 2 + 3: outcome edges on the producer, cloned from its own hotspot
const prod=await figma.getNodeByIdAsync("2162:11660");
const proto=await figma.getNodeByIdAsync("2162:11757");
if(!proto||proto.parent.id!=="2162:11660") return OUT.join("\\n")+"\\ntemplate hotspot not on the producer - refusing the outcome edges";
const bb=prod.absoluteBoundingBox;
const baseY=Math.round(proto.absoluteBoundingBox.y-bb.y);
let k=1;
for(const [dest,name] of [["199:2","hotspot/alt · Save · saved"],["2162:11838","hotspot/alt · Save · failed"]]){
  let already=false;
  for(const c of prod.children) for(const rx of (c.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===dest) already=true;
  if(already){ OUT.push(name+" already wired - skipped"); continue; }
  const h=proto.clone();
  prod.appendChild(h);
  h.layoutPositioning=proto.layoutPositioning;
  h.x=proto.x; h.y=proto.y - k*(Math.round(proto.height)+4);
  h.name=name;
  for(const t of (h.children||[])) if(t.type==="TEXT") t.visible=false;
  await h.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(dest)]}]);
  const r=h.absoluteBoundingBox;
  OUT.push("created "+h.id+" '"+name+"' y="+Math.round(r.y-bb.y)+" -> "+dest);
  k++;
}

// verify
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
function carriers(n,acc){acc.push(n); if(CONT.has(n.type)&&n.children) for(const c of n.children) carriers(c,acc); return acc;}
async function inb(t){ let c=0;
  for(const s of pg.children){ if(s.type!=="SECTION") continue;
    for(const b of s.children) for(const n of carriers(b,[]))
      for(const rx of (n.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===t) c++; }
  return c; }
OUT.push("2162:11660 Saving      in-degree "+await inb("2162:11660")+" (was 0)");
OUT.push("2162:11838 Save failed in-degree "+await inb("2162:11838")+" (was 0)");
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"close the save lifecycle: unsaved -> saving -> saved/failed -> retry",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
