/**
 * Add a missing state board by cloning the board it should be built from.
 *
 * The workflow audit produced 112 missing-screen findings that name a parent to
 * build from. Building one by hand is where mistakes happen: the clone lands on
 * top of a neighbour, the section count in its name goes stale, or the new board
 * is drawn and never wired, which is the exact defect the audit was cataloguing.
 * This does the mechanical half and refuses when it cannot do it safely.
 *
 *   node scripts/figma/add-state-board.mjs <sourceBoardId> "<new name>" [--wire-from <nodeId>] [--apply]
 *
 * Placement: the section's own grid pitch is measured from its existing boards
 * rather than assumed, and every candidate slot is collision-tested against
 * every sibling before the clone is moved into it.
 *
 * --wire-from adds an ON_CLICK from an existing node to the new board, because a
 * board with no inbound edge is not a screen, it is a picture.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const args = process.argv.slice(2);
const SRC = args[0];
const NAME = args[1];
const APPLY = args.includes("--apply");
const wi = args.indexOf("--wire-from");
const WIRE = wi >= 0 ? args[wi + 1] : "";
if (!SRC || !NAME) {
  console.error('usage: add-state-board.mjs <sourceBoardId> "<new name>" [--wire-from <nodeId>] [--apply]');
  process.exit(1);
}
await connect();
const code = `
const SRC=${JSON.stringify(SRC)}, NAME=${JSON.stringify(NAME)}, WIRE=${JSON.stringify(WIRE)}, APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const src=await figma.getNodeByIdAsync(SRC);
if(!src) return "source "+SRC+" not found - refusing";
const sec=src.parent;
if(sec.type!=="SECTION") return "source's parent is "+sec.type+", expected SECTION - refusing";

const sibs=sec.children.filter(c=>c.width&&c.height);
const W=Math.round(src.width), H=Math.round(src.height);

// measure the section's own grid rather than assuming one
const xs=[...new Set(sibs.map(c=>Math.round(c.x)))].sort((a,b)=>a-b);
const ys=[...new Set(sibs.map(c=>Math.round(c.y)))].sort((a,b)=>a-b);
const pitchX=xs.length>1 ? Math.min(...xs.slice(1).map((v,i)=>v-xs[i]).filter(d=>d>=W)) : W+120;
OUT.push("section '"+sec.name+"'  source "+W+"x"+H+"  grid x="+xs.slice(0,6).join(",")+(xs.length>6?"…":"")+"  pitchX="+pitchX);

const hits=(x,y)=>sibs.some(c=>x<c.x+c.width-1 && x+W>c.x+1 && y<c.y+c.height-1 && y+H>c.y+1);
let slot=null;
outer:
for(const y of ys){
  for(let k=0;k<24;k++){
    const x=xs[0]+k*pitchX;
    if(!hits(x,y)){ slot={x,y}; break outer; }
  }
}
if(!slot){ const lastY=Math.max(...sibs.map(c=>c.y+c.height)); slot={x:xs[0], y:Math.round(lastY+120)}; OUT.push("no free slot in existing rows - opening a new row"); }
OUT.push("slot: "+Math.round(slot.x)+","+Math.round(slot.y));

if(!APPLY){ OUT.push("DRY RUN - pass --apply to create"); return OUT.join("\\n"); }

const clone=src.clone();
sec.appendChild(clone);
clone.x=slot.x; clone.y=slot.y; clone.name=NAME;
OUT.push("created "+clone.id+" '"+clone.name+"' at "+Math.round(clone.x)+","+Math.round(clone.y));

// collision re-test AFTER the move, because a clone can carry effects
const after=sec.children.filter(c=>c.id!==clone.id&&c.width&&c.height);
const bad=after.filter(c=>clone.x<c.x+c.width-1 && clone.x+clone.width>c.x+1 && clone.y<c.y+c.height-1 && clone.y+clone.height>c.y+1);
OUT.push(bad.length ? "  OVERLAP with "+bad.map(c=>c.id).join(",") : "  no overlap");

if(WIRE){
  const from=await figma.getNodeByIdAsync(WIRE);
  if(!from) OUT.push("  wire-from "+WIRE+" not found - board created but UNWIRED");
  else {
    const keep=(from.reactions||[]).slice();
    keep.push({trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId:clone.id,navigation:"NAVIGATE",transition:null,resetVideoPosition:false,resetScrollPosition:true}]});
    try{ await from.setReactionsAsync(keep); OUT.push("  wired "+WIRE+" -> "+clone.id+" (now "+keep.length+" reaction(s) on that node)"); }
    catch(e){ OUT.push("  WIRE FAILED: "+String(e).slice(0,120)); }
  }
} else OUT.push("  no --wire-from given: board has NO inbound edge yet");

sec.name=sec.name.replace(/·\\s*\\d+(\\s*—|$)/, "· "+sec.children.length+"$1");
OUT.push("section renamed -> "+sec.name);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"create":"dry-run")+" state board "+NAME,skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
