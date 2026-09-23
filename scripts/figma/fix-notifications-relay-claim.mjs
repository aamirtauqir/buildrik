/**
 * Correct six board names that this arc made false.
 *
 * The Notifications boards carried, in their own names, the sentence
 * "The 280→360 re-lay is NOT taken here — a frame resize alone leaves a 280
 * interior in a 360 box." That was true when it was written and stopped being
 * true the moment `relay-panel-width.mjs` ran: all six are now 360 with their
 * interiors re-seated and 0 out-of-bounds.
 *
 * A board asserting something false about itself is the defect this whole arc
 * exists to remove, and it is worse for having been introduced by the fix. The
 * rename was written immediately and the daily Figma cap bit before it landed —
 * so this is the FIRST thing to run in the next window, ahead of any new work.
 *
 * Idempotent: a board whose name no longer contains the old sentence is
 * reported NOCLAIM and left alone.
 *
 * Usage: node scripts/figma/fix-notifications-relay-claim.mjs
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
/* The six boards carry, in their own names, the sentence "The 280→360 re-lay is
   NOT taken here". It has just been taken. A board asserting something false
   about itself is the exact defect this arc exists to remove, and it would be
   worse for having been introduced by the fix. */
/* Two wordings to correct, not one. `165:2` is the "full statement" board and
   says "drawn 280 wide" in its own sentence; the other five carry the
   NOT-taken clause. Both became false when the re-lay landed. */
const PAIRS = [
  ["The 280→360 re-lay is NOT taken here — a frame resize alone leaves a 280 interior in a 360 box.",
   "Re-laid to 360 on 2026-09-07: the frame AND its interior — right-aligned nodes re-seated to their original right margin, wrapping copy re-measured, 0 out-of-bounds."],
  ["drawn 280 wide; the shipped dropdown is 360",
   "drawn 360 as of 2026-09-07, matching the shipped dropdown"],
  /* A THIRD wording, found 2026-09-07 by reading the boards back instead of the
     plan: four of the six say "drawn 280; ships 360", which neither pair above
     matches. The first run therefore reported success on the boards it could
     match and left the rest asserting 280 while measuring 360. Match strings
     have to come from the nodes, not from the sentence somebody meant to write. */
  ["drawn 280; ships 360", "drawn 360 as of 2026-09-07; ships 360"],
];
const lines=[
 'const pg=figma.root.children.find(p=>p.id==="1:3");',
 'await figma.setCurrentPageAsync(pg);',
 'const PAIRS=' + JSON.stringify(PAIRS) + ';',
 'const out=[];',
 'for(const id of ["165:2","165:24","165:44","165:51","165:71","453:4051"]){',
 '  const n=await figma.getNodeByIdAsync(id);',
 '  if(!n){ out.push(id+"\\tMISSING"); continue; }',
 '  let name=String(n.name), hits=0;',
 '  for(const [o,w] of PAIRS){ if(name.indexOf(o)>=0){ name=name.split(o).join(w); hits++; } }',
 '  if(!hits){ out.push(id+"\\tNOCLAIM\\t"+String(n.name).slice(-70)); continue; }',
 '  n.name=name;',
 '  const b=await figma.getNodeByIdAsync(id);',
 '  const stale=PAIRS.some(([o])=>String(b.name).indexOf(o)>=0);',
 '  out.push(id+(stale?"\\tDRIFT\\t":"\\tOK\\t")+Math.round(b.width)+"w  fixed "+hits+"  ..."+String(b.name).slice(-52));',
 '}',
 'return out.join(String.fromCharCode(10));',
];
const r=await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code:lines.join("\n"),description:"correct the six Notifications board names now that the re-lay is done",skillNames:"figma-use"}},1);
console.log((r.result?.content||[]).map(c=>c.text||"").join("\n"));
