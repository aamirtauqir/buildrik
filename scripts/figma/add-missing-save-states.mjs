/**
 * D-C-31, reduced to what is actually true.
 *
 * The agent's claim ("every full-shell board reads 'Saved 2m ago', five of six
 * shipped states have no board") did not survive measurement: First run already
 * draws "Unsaved changes", Saving->conflict draws "Conflict - reload", and the
 * Offline board draws the offline pill. The `Save status` COMPONENT_SET (697:461)
 * already carries all six variants the code ships.
 *
 * What IS missing is a board depicting two of them: State=saving and State=error.
 * Both are built by cloning the default shell (199:2) and switching ONE variant -
 * no new layout is authored, and the copy comes from the component master, which
 * matches SaveStatus.tsx's COPY table.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
function walk(n,acc){ if(CONT.has(n.type)&&n.children) for(const c of n.children){acc.push(c);walk(c,acc);} return acc; }
function texts(n,acc){ if(n.type==="TEXT"){acc.push(n);return acc;}
  if(CONT.has(n.type)&&n.children) for(const c of n.children) texts(c,acc); return acc; }

const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync("1776:8385");
const ref=await figma.getNodeByIdAsync("199:2");

const SLOTS=[{x:7900,y:3035,state:"saving",name:"Shell state 14 · Saving"},
             {x:9460,y:3035,state:"error", name:"Shell state 15 · Save failed"}];

// refuse if any slot is occupied
for(const s of SLOTS){
  for(const c of sec.children){
    if(s.x < c.x+c.width-1 && s.x+ref.width > c.x+1 && s.y < c.y+c.height-1 && s.y+ref.height > c.y+1)
      return "slot "+s.x+","+s.y+" collides with "+c.id+" '"+c.name+"' - refusing";
  }
}

for(const s of SLOTS){
  const clone=ref.clone();
  sec.appendChild(clone);
  clone.x=s.x; clone.y=s.y; clone.name=s.name;
  // find the save pill: the nested instance whose main component belongs to set 697:461
  let pill=null;
  for(const n of walk(clone,[])){
    if(n.type!=="INSTANCE") continue;
    const mc=await n.getMainComponentAsync();
    if(mc && mc.parent && mc.parent.id==="697:461"){ pill=n; break; }
  }
  if(!pill){ OUT.push(s.name+"\\tPILL NOT FOUND - clone left in place for inspection"); continue; }
  pill.setProperties({State:s.state});
  const t=texts(pill,[]).map(n=>n.characters).join("|");
  OUT.push(s.name+"\\t"+clone.id+"\\tat "+Math.round(clone.x)+","+Math.round(clone.y)+"\\tpill="+pill.id+" -> '"+t+"'");
}
sec.name="01 · Shell · "+sec.children.length;
OUT.push("section renamed -> "+sec.name+"  ("+Math.round(sec.width)+"x"+Math.round(sec.height)+")");
return OUT.join("\\n").slice(0,6000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"add the two shipped save states that had no board",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
