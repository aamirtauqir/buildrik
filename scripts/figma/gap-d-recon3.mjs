/**
 * gap-d — resolve the one selector this arc has never resolved.
 *
 * publish-crosssection#10 (UX-E-05, Critical) names its target only as
 * { section: 1776:8376, board_name_matches: "Content · collection · dynamic
 * pages|dynamic-pages", text_matches: ["URL pattern", "/{slug}"] }. It has been
 * carried unresolved since the first apply, which means nobody knows whether
 * the board it wants exists at all — and "the board is missing" and "nobody
 * looked" are the two states this arc keeps confusing.
 *
 * One read settles it: the section's children, and for any board whose name
 * matches, its TEXT interior and content extent against its own height, which
 * is what says whether a head-preview card can be added without the overflow
 * that cost the first arc twelve board overlaps.
 *
 * Read-only.
 *
 * Usage: node scripts/figma/gap-d-recon3.mjs [--apply]
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const O=[];
const R=(n)=>Math.round(n);
const sec=await figma.getNodeByIdAsync("1776:8376");
if(!sec){ O.push("MISSING-SECTION"); }
else{
  O.push("SEC\\t"+sec.id+"\\t"+sec.name+"\\t"+R(sec.width)+"x"+R(sec.height)+"\\tkids="+sec.children.length);
  let maxBottom=0;
  for(const c of sec.children){ const b=c.y+c.height; if(b>maxBottom) maxBottom=b; }
  O.push("SEC\\tmaxBottom="+R(maxBottom)+"\\tfreeStrip="+R(sec.height-maxBottom));
  for(const c of sec.children){
    if(/dynamic|collection/i.test(c.name)) O.push("HIT\\t"+c.id+"\\t"+String(c.name).slice(0,68)+"\\t"+R(c.width)+"x"+R(c.height)+"\\t@"+R(c.x)+","+R(c.y));
  }
  for(const c of sec.children){
    if(!/dynamic/i.test(c.name) || c.type!=="FRAME") continue;
    const st=[...c.children], ts=[]; let ext=0;
    while(st.length){ const n=st.pop(); if(n.visible!==false){ const b=n.y+n.height; if(n.parent===c && b>ext) ext=b; } if(n.type==="TEXT") ts.push(n); else if(n.children) st.push(...n.children); }
    ts.sort((p,q)=>(p.y-q.y)||(p.x-q.x));
    O.push("BOARD\\t"+c.id+"\\t"+String(c.name).slice(0,60)+"\\t"+R(c.width)+"x"+R(c.height)+"\\tlayout="+(c.layoutMode||"NONE")+"\\textent="+R(ext)+"\\ttexts="+ts.length);
    for(const t of ts) O.push("T\\t"+c.id+"\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+R(t.width)+"x"+R(t.height)+"\\t"+JSON.stringify(t.characters.slice(0,72)));
  }
}
return O.join("\\n");
`;

console.log("payload chars:", code.length);
if (!APPLY) { console.log("(dry run — pass --apply to spend one call)"); process.exit(0); }

await connect();
const r = await rpc("tools/call", {
  name: "use_figma",
  arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC",
    code,
    description: "gap-d: resolve UX-E-05's unresolved dynamic-pages selector in section 06 Content",
    skillNames: "figma-use",
  },
}, 1);
console.log(r?.result?.content?.map?.((c) => c.text).join("\n") ?? JSON.stringify(r));
