/**
 * File-wide invariant check for page 1:3 (and any page passed as argv[2]).
 *
 * These five are the ones this arc has actually broken, each at least once:
 *   loose      - a board sitting on the canvas outside every section
 *   oob        - a child whose bounds escape its own board
 *   overlap    - two boards in a section covering the same pixels
 *   secoverlap - two sections covering the same pixels
 *   dangling   - a prototype action pointing at a node that no longer exists
 *
 * Read-only. Run it after every structural change; a clone or a resize is
 * exactly the kind of edit that reports success and breaks one of these.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const PAGE = process.argv[2] || "1:3";
const code = `
const PAGE=${JSON.stringify(PAGE)};
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const pg=figma.root.children.find(p=>p.id===PAGE);
await figma.setCurrentPageAsync(pg);
const hit=(a,b)=>a.x<b.x+b.width-0.5&&a.x+a.width>b.x+0.5&&a.y<b.y+b.height-0.5&&a.y+a.height>b.y+0.5;

const secs=pg.children.filter(c=>c.type==="SECTION");
const loose=pg.children.filter(c=>c.type!=="SECTION");
OUT.push("loose nodes on page: "+loose.length+(loose.length?" -> "+loose.slice(0,8).map(c=>c.id+" '"+c.name.slice(0,30)+"'").join(", "):""));

let secOv=0;
for(let i=0;i<secs.length;i++) for(let j=i+1;j<secs.length;j++)
  if(hit(secs[i],secs[j])){secOv++; if(secOv<6) OUT.push("  SECTION OVERLAP "+secs[i].name+" x "+secs[j].name);}
OUT.push("section overlaps: "+secOv);

let ov=0, oob=0, boards=0;
const oobBoards=new Map();
for(const s of secs){
  const kids=s.children.filter(c=>c.width&&c.height);
  boards+=kids.length;
  for(let i=0;i<kids.length;i++) for(let j=i+1;j<kids.length;j++)
    if(hit(kids[i],kids[j])){ov++; if(ov<8) OUT.push("  OVERLAP in "+s.name+": "+kids[i].id+" '"+kids[i].name.slice(0,28)+"' x "+kids[j].id+" '"+kids[j].name.slice(0,28)+"'");}
  for(const b of kids){
    if(!CONT.has(b.type)||!b.children) continue;
    if(/RETIRED|SUPERSEDED|CUT \d|UNBUILDABLE/i.test(b.name)) continue;
    const bb=b.absoluteBoundingBox; if(!bb) continue;
    const stack=[...b.children];
    while(stack.length){
      const c=stack.pop(); const r=c.absoluteBoundingBox;
      /* hotspot/* rows are prototype scaffolding parked outside the board on
         purpose - the file's own convention for "click here to see this state".
         Skip the whole subtree: the paired state label is their child. */
      if(c.name.indexOf("hotspot/")===0) continue;
      /* Vertical-only overflow inside a clipping frame is a SCROLL REGION, not
         a defect - an expanded Insert panel runs past 812px, and a canvas
         scrolled down puts its nav above the viewport. Only unclipped overflow,
         or overflow to the left/right, means content renders outside the board.
         The naive version reported 467 "defects" that were mostly correct. */
      const over = r ? {l:r.x<bb.x-0.5, r:r.x+r.width>bb.x+bb.width+0.5,
                        t:r.y<bb.y-0.5, b:r.y+r.height>bb.y+bb.height+0.5} : null;
      const scrollish = over && b.clipsContent && (over.t || over.b) && !over.l && !over.r;
      if(over&&(over.l||over.r||over.t||over.b)&&!scrollish){
        oob++; oobBoards.set(b.id+" "+b.name.slice(0,24),(oobBoards.get(b.id+" "+b.name.slice(0,24))||0)+1); if(oob<4) OUT.push("  OOB "+b.id+" '"+b.name.slice(0,26)+"' <- "+c.id+" '"+c.name.slice(0,26)+"'");
      }
      if(CONT.has(c.type)&&c.children) for(const g of c.children) stack.push(g);
    }
  }
}
OUT.push("sections: "+secs.length+"  boards: "+boards);
OUT.push("board overlaps: "+ov);
OUT.push("out-of-bounds children: "+oob+"  (boards affected: "+oobBoards.size+")");
OUT.push("  top offenders: "+[...oobBoards.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+"="+v).join(" "));

// prototype edges
let edges=0, dangling=0;
const ids=new Set();
(function idx(n){ids.add(n.id); if(n.children) for(const c of n.children) idx(c);})(pg);
const stack=[...pg.children];
while(stack.length){
  const n=stack.pop();
  for(const rx of (n.reactions||[])){
    const acts=rx.actions||(rx.action?[rx.action]:[]);
    for(const a of acts){ if(!a||!a.destinationId) continue; edges++; if(!ids.has(a.destinationId)) {dangling++; if(dangling<6) OUT.push("  DANGLING "+n.id+" -> "+a.destinationId);} }
  }
  if(CONT.has(n.type)&&n.children) for(const c of n.children) stack.push(c);
}
OUT.push("prototype edges: "+edges+"  dangling: "+dangling);
OUT.push("");
OUT.push((loose.length===0&&secOv===0&&ov===0&&oob===0&&dangling===0)?"PASS":"FAIL");
return OUT.join("\\n").slice(0,15000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"verify file invariants on page "+PAGE,skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
