/**
 * Every note `apply-publish-v2.mjs` adds is an ABSOLUTELY positioned child at a
 * hard-coded y. On the pre-checks boards that turned out to be a stack, and the
 * row landed on top of the divider — the write returned OK and the read-back of
 * the node's own geometry agreed with the plan, because the node WAS where the
 * plan asked. What neither could see is what was already at that y.
 *
 * So this asks the other question: for each `v2/*` node, what visible content
 * does its box intersect? A note in an empty spacer band is fine; a note across
 * a label or a button is a defect that looks identical from the write's side.
 *
 * Read-only. Reports, changes nothing.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();

const code = `
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hits=(p,q)=>p.x<q.x+q.width-0.5&&p.x+p.width>q.x+0.5&&p.y<q.y+q.height-0.5&&p.y+p.height>q.y+0.5;
for(const bid of ["784:4326","781:4489","778:4238","784:4250","641:2652","784:4480","784:4403","833:4518","893:4518"]){
  const b=await figma.getNodeByIdAsync(bid);
  if(!b){ OUT.push("MISSING "+bid); continue; }
  const bb=b.absoluteBoundingBox;
  const mine=b.children.filter(c=>String(c.name).indexOf("v2/")===0);
  OUT.push(bid+" '"+String(b.name).slice(0,34)+"'  "+Math.round(b.width)+"x"+Math.round(b.height)+
    "  layoutMode="+(b.layoutMode||"NONE")+"  v2 nodes: "+mine.length);
  /* every TEXT and every visible leaf that carries paint, flattened to board coords */
  const paint=[];
  const st=[...b.children];
  while(st.length){
    const c=st.pop();
    if(c.visible===false) continue;
    if(String(c.name).indexOf("v2/")===0||String(c.name).indexOf("hotspot/")===0) continue;
    const r=c.absoluteBoundingBox;
    const inked=c.type==="TEXT"||(Array.isArray(c.fills)&&c.fills.some(f=>f.visible!==false&&f.opacity!==0));
    if(r&&inked&&!(CONT.has(c.type)&&c.children&&c.children.length&&c.type!=="INSTANCE"))
      paint.push({id:c.id,name:String(c.name).slice(0,26),type:c.type,
        x:r.x-bb.x,y:r.y-bb.y,width:r.width,height:r.height,
        t:c.type==="TEXT"?JSON.stringify(String(c.characters).slice(0,28)):""});
    if(CONT.has(c.type)&&c.children) for(const g of c.children) st.push(g);
  }
  for(const m of mine){
    const r=m.absoluteBoundingBox;
    const box={x:r.x-bb.x,y:r.y-bb.y,width:r.width,height:r.height};
    const clash=paint.filter(p=>hits(box,p));
    OUT.push("   "+m.name+"  "+Math.round(box.width)+"x"+Math.round(box.height)+
      " at "+Math.round(box.x)+","+Math.round(box.y)+
      "  positioning="+(m.layoutPositioning||"-")+
      "   intersects "+clash.length+" inked node(s)");
    for(const p of clash.slice(0,4))
      OUT.push("      X  "+p.id+"  "+p.type+"  "+Math.round(p.x)+","+Math.round(p.y)+" "+
        Math.round(p.width)+"x"+Math.round(p.height)+"  "+p.name+" "+p.t);
  }
}
return OUT.join(String.fromCharCode(10)).slice(0,15000);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "check every v2/* Publish annotation against the inked content underneath it",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 900));
