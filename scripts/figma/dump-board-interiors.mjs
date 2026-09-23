/**
 * Dump the INSIDE of a handful of boards, plus the geometry a placement decision
 * needs, in ONE call.
 *
 * Every other script here either writes, or reads one thing. Building a board
 * interior needs three facts at once and none of them is free: which slots in the
 * target section are empty (so a new clone does not open a row outside the
 * section), what the source board's direct children are called and where they sit
 * (a clone carries the same names and the same geometry, so the source is a map of
 * the clone), and which TEXT nodes exist to CLONE type from — because new text
 * chosen by hand is how this file got 920 nodes under the 11px floor.
 *
 * Three reads is three calls out of 200/day. This is one.
 *
 * Usage:
 *   node scripts/figma/dump-board-interiors.mjs --section=1776:8381 \
 *        --boards=32:2,807:8567 --texts=807:8567 [--page=1:3]
 *
 * Prints, in order: every SECTION on the page with its bounds (so a new board can
 * be placed without colliding with the next section), the target section's
 * children, each board's direct children, and each --texts board's TEXT
 * descendants with the size/style/colour a clone would inherit.
 *
 * Reads only. Writes nothing.
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=")[1];
const PAGE = arg("page", "1:3");
const SECTION = arg("section", "");
const BOARDS = arg("boards", "").split(",").filter(Boolean);
const TEXTS = arg("texts", "").split(",").filter(Boolean);
const CAPC = Number(arg("capChildren", "16"));
const CAPT = Number(arg("capTexts", "44"));

await connect();
const code = `
const PAGE=${JSON.stringify(PAGE)}, SECTION=${JSON.stringify(SECTION)};
const BOARDS=${JSON.stringify(BOARDS)}, TEXTS=${JSON.stringify(TEXTS)};
const CAPC=${CAPC}, CAPT=${CAPT};
const T=String.fromCharCode(9), NL=String.fromCharCode(10);
const O=[];
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "page "+PAGE+" not found";
await figma.setCurrentPageAsync(pg);
const r2=(v)=>Math.round(v);
const hex=(n)=>{
  try{ const f=(n.fills||[])[0]; if(!f||f.type!=="SOLID") return "-";
    const c=f.color; const h=(x)=>("0"+Math.round(x*255).toString(16)).slice(-2);
    return "#"+(h(c.r)+h(c.g)+h(c.b)).toUpperCase(); }catch(e){ return "-"; }
};
O.push("SECTIONS");
for(const s of pg.children.filter(c=>c.type==="SECTION")){
  O.push(s.id+T+r2(s.x)+T+r2(s.y)+T+r2(s.width)+"x"+r2(s.height)+T+s.name.slice(0,30));
}
if(SECTION){
  const sec=await figma.getNodeByIdAsync(SECTION);
  if(!sec) O.push("SECTION-MISSING"+T+SECTION);
  else{
    O.push("");
    O.push("SECTION-CHILDREN"+T+sec.id+T+r2(sec.width)+"x"+r2(sec.height)+T+"n="+sec.children.length);
    for(const c of sec.children){
      O.push(c.id+T+r2(c.x)+T+r2(c.y)+T+r2(c.width)+"x"+r2(c.height)+T+c.name.slice(0,44));
    }
  }
}
for(const bid of BOARDS){
  const b=await figma.getNodeByIdAsync(bid);
  O.push("");
  if(!b){ O.push("BOARD-MISSING"+T+bid); continue; }
  O.push("BOARD"+T+b.id+T+r2(b.width)+"x"+r2(b.height)+T+"layout="+(b.layoutMode||"NONE")+T+b.name.slice(0,44));
  const kids=(b.children||[]).slice(0,CAPC);
  for(const c of kids){
    O.push("  "+c.id+T+c.type.slice(0,9)+T+r2(c.x)+","+r2(c.y)+T+r2(c.width)+"x"+r2(c.height)+T+(c.visible?"v":"h")+T+c.name.slice(0,34));
  }
  if((b.children||[]).length>CAPC) O.push("  ...+"+((b.children||[]).length-CAPC)+" more children");
}
for(const bid of TEXTS){
  const b=await figma.getNodeByIdAsync(bid);
  O.push("");
  if(!b){ O.push("TEXTS-MISSING"+T+bid); continue; }
  O.push("TEXTS"+T+b.id);
  const st=[b], hit=[];
  while(st.length){ const c=st.shift(); if(c.type==="TEXT") hit.push(c); if(c.children) st.push(...c.children); }
  for(const t of hit.slice(0,CAPT)){
    const fn=t.fontName&&t.fontName.style?t.fontName.style:"?";
    const fam=t.fontName&&t.fontName.family?t.fontName.family:"?";
    O.push("  "+t.id+T+t.fontSize+"/"+fn+T+fam.slice(0,8)+T+hex(t)+T+r2(t.width)+"x"+r2(t.height)+T+t.textAutoResize+T+JSON.stringify(String(t.characters).slice(0,22)));
  }
  if(hit.length>CAPT) O.push("  ...+"+(hit.length-CAPT)+" more TEXT nodes");
}
return O.join(NL);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: "read-only dump of section geometry and board interiors", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 1200));
