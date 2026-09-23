/**
 * Where can a note go, in several sections at once, without colliding.
 *
 * `dump-board-interiors.mjs` answers this for ONE section. Placing an
 * annotation in eight sections would therefore cost eight calls out of 200/day,
 * and the answer needed from each is small: the section's own box, how far down
 * its content actually reaches, and what occupies that last band so a new node
 * can be seated beside or below it. This returns exactly that, for every section
 * named, in one call — plus the TEXT interiors of a handful of boards, because a
 * copy verdict written without reading the copy is a claim, not a finding.
 *
 * Reads only. Writes nothing.
 *
 * Usage:
 *   node scripts/figma/dump-section-freespace.mjs --sections=a,b,c \
 *        [--texts=id,id] [--nodes=id,id] [--band=260] [--page=1:3]
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=")[1];
const PAGE = arg("page", "1:3");
const SECTIONS = arg("sections", "").split(",").filter(Boolean);
const TEXTS = arg("texts", "").split(",").filter(Boolean);
const NODES = arg("nodes", "").split(",").filter(Boolean);
const BAND = Number(arg("band", "260"));
const CAPT = Number(arg("capTexts", "22"));

await connect();
const code = `
const PAGE=${JSON.stringify(PAGE)}, SECS=${JSON.stringify(SECTIONS)};
const TEXTS=${JSON.stringify(TEXTS)}, NODES=${JSON.stringify(NODES)};
const BAND=${BAND}, CAPT=${CAPT};
const T=String.fromCharCode(9), NL=String.fromCharCode(10);
const O=[]; const r2=(v)=>Math.round(v);
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "page "+PAGE+" not found";
await figma.setCurrentPageAsync(pg);
O.push("PAGE-SECTIONS");
const all=pg.children.filter(c=>c.type==="SECTION").sort((a,b)=>a.y-b.y);
for(const s of all) O.push(s.id+T+r2(s.x)+","+r2(s.y)+T+r2(s.width)+"x"+r2(s.height)+T+s.name.slice(0,26));
for(const sid of SECS){
  const s=await figma.getNodeByIdAsync(sid);
  O.push("");
  if(!s){ O.push("SEC-MISSING"+T+sid); continue; }
  const kids=s.children.filter(c=>c.width&&c.height);
  let maxB=0, maxR=0;
  for(const c of kids){ if(c.y+c.height>maxB) maxB=c.y+c.height; if(c.x+c.width>maxR) maxR=c.x+c.width; }
  O.push("SEC"+T+s.id+T+r2(s.width)+"x"+r2(s.height)+T+"n="+kids.length+T+"maxBottom="+r2(maxB)+T+"maxRight="+r2(maxR)+T+s.name.slice(0,26));
  const band=kids.filter(c=>c.y+c.height>maxB-BAND).sort((a,b)=>a.x-b.x);
  for(const c of band) O.push("  "+c.id+T+r2(c.x)+","+r2(c.y)+T+r2(c.width)+"x"+r2(c.height)+T+c.name.slice(0,38));
}
for(const nid of NODES){
  const n=await figma.getNodeByIdAsync(nid);
  O.push("");
  if(!n){ O.push("NODE-MISSING"+T+nid); continue; }
  const par=n.parent?(n.parent.id+" "+n.parent.type):"-";
  let ext=0; for(const c of (n.children||[])) if(c.visible&&c.y+c.height>ext) ext=c.y+c.height;
  O.push("NODE"+T+n.id+T+r2(n.x)+","+r2(n.y)+T+r2(n.width)+"x"+r2(n.height)+T+"parent="+par+T+"kids="+((n.children||[]).length)+T+"extent="+r2(ext)+T+n.name.slice(0,44));
}
for(const bid of TEXTS){
  const b=await figma.getNodeByIdAsync(bid);
  O.push("");
  if(!b){ O.push("TEXTS-MISSING"+T+bid); continue; }
  O.push("TEXTS"+T+b.id+T+r2(b.width)+"x"+r2(b.height)+T+b.name.slice(0,40));
  const st=[b], hit=[];
  while(st.length){ const c=st.shift(); if(c.type==="TEXT") hit.push(c); if(c.children) st.push(...c.children); }
  for(const t of hit.slice(0,CAPT)) O.push("  "+t.id+T+r2(t.x)+","+r2(t.y)+T+t.fontSize+T+JSON.stringify(String(t.characters).slice(0,64)));
  if(hit.length>CAPT) O.push("  ...+"+(hit.length-CAPT)+" more TEXT");
}
return O.join(NL).slice(0,17000);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: "read-only: free space in several sections plus board text interiors", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 1500));
