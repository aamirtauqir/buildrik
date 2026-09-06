/**
 * The arc's own acceptance check, run against the file rather than a log.
 *
 * Five things this arc claims. Each is measured here, because every one of them
 * was true at some point today and then quietly stopped being true — a section
 * count went stale the moment a board was added, a marker census missed a whole
 * marker because its key list did not name it, and a reachability list stopped
 * checking the map board the moment the map board was rebuilt.
 *
 * Usage: node scripts/figma/verify-arc.mjs
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
};

const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const out=[];
let boards=0, secs=0, countDrift=[], overlaps=0;
const MARK={old:0,ni:0,unreach:0,retired:0};
const OLD=["design-ahead","UNBUILDABLE"];

for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  secs++; boards+=s.children.length;
  const m=String(s.name).match(/^(.*·\\s*)(\\d+)(\\s*(?:—[\\s\\S]*)?)$/);
  if(m && Number(m[2])!==s.children.length) countDrift.push(s.id+" says "+m[2]+" has "+s.children.length);
  // top-level pairwise overlap inside the section
  const k=s.children.filter(c=>c.width&&c.height);
  for(let i=0;i<k.length;i++) for(let j=i+1;j<k.length;j++){
    const a=k[i],b=k[j];
    if(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height) overlaps++;
  }
  for(const b of s.children){
    const st=[b];
    while(st.length){ const n=st.pop(); const nm=String(n.name);
      if(OLD.some(o=>nm.includes(o))) MARK.old++;
      else if(nm.startsWith("[not-implemented]")||nm.includes("[not-implemented]")) MARK.ni++;
      else if(nm.includes("[unreachable]")) MARK.unreach++;
      else if(nm.includes("RETIRED")) MARK.retired++;
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
  }
}
out.push("sections            "+secs);
out.push("boards             "+boards);
out.push("section-count drift "+(countDrift.length?countDrift.join(" | "):"none"));
out.push("top-level overlaps  "+overlaps);
out.push("markers             [not-implemented] "+MARK.ni+"   [unreachable] "+MARK.unreach+"   RETIRED "+MARK.retired);
out.push("OLD marker spellings "+MARK.old+"   (design-ahead / UNBUILDABLE — must be 0)");
return out.join(String.fromCharCode(10));
`;
console.log(await call(code, "verify the arc's five claims against the file"));
