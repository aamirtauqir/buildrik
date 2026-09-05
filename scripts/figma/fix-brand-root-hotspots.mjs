/**
 * W-G-01: not one of the nine Brand root rows reached its own destination.
 *
 * All nine `hotspot/row` frames sit exactly 96px ABOVE the rows they name -
 * 96 = strip/Brand & shared theme (h56) + DSModeToggle (h40), both inserted
 * above the list when the root was redrawn 2026-08-27. The older hotspots never
 * moved, so a click at the Tokens row's centre lands in Starters; every row is
 * off by two, and Lint and Import/export fall past the last hotspot entirely.
 * All nine destinations exist as boards. This is a placement bug, not a wiring
 * one.
 *
 * Second fix, same board: three `hotspot/state` frames sit at y=820 on an
 * 812-tall board - entirely outside it, so the loading, load-error and AI-prompt
 * states they reach are unreachable. Re-seated in the free band below the footer.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const b=await figma.getNodeByIdAsync("1333:7162");
const bb=b.absoluteBoundingBox;
const yOf=(n)=>Math.round(n.absoluteBoundingBox.y-bb.y);

// pair each hotspot to the row it names, and refuse unless the gap really is 96
const PAIRS=[["1670:7195","1334:7176"],["1670:7197","1334:7182"],["1670:7199","1334:7188"],
             ["1670:7201","1334:7194"],["1670:7203","1334:7199"],["1670:7205","1334:7204"],
             ["1670:7207","1334:7209"],["1670:7209","1334:7214"],["1670:7211","1334:7220"]];
const moves=[];
for(const [h,r] of PAIRS){
  const hn=await figma.getNodeByIdAsync(h), rn=await figma.getNodeByIdAsync(r);
  if(!hn||!rn) return "missing "+h+"/"+r+" - refusing";
  const d=yOf(rn)-yOf(hn);
  if(d!==96) return h+" gap is "+d+", expected 96 - refusing (someone moved things)";
  moves.push([hn,rn,d]);
}
for(const [hn,rn] of moves){
  if(hn.layoutPositioning!=="ABSOLUTE") return hn.id+" is "+hn.layoutPositioning+" - refusing";
  hn.y = hn.y + 96;
  OUT.push("  "+hn.id+" '"+hn.name.slice(0,28)+"' now y="+yOf(hn)+"  row y="+yOf(rn)+(yOf(hn)===yOf(rn)?"  ALIGNED":"  MISMATCH"));
}

// the three state hotspots parked outside the 812-tall board
const OUT2=[];
let seat=726;
for(const id of ["1720:17207","1720:17210","1720:17446"]){
  const n=await figma.getNodeByIdAsync(id);
  const before=yOf(n);
  if(before+n.height<=Math.round(b.height)){ OUT2.push("  "+id+" already inside - skipped"); continue; }
  n.y = n.y + (seat-before); seat += 28;
  OUT2.push("  "+id+" '"+n.name.slice(0,30)+"' y "+before+" -> "+yOf(n)+" (board h="+Math.round(b.height)+")");
}
return "ROW HOTSPOTS (+96):\\n"+OUT.join("\\n")+"\\n\\nSTATE HOTSPOTS re-seated inside the board:\\n"+OUT2.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"align the nine Brand root row hotspots with their rows",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
