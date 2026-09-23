/**
 * Find nodes by NAME inside named boards, and read back what a text dump cannot:
 * the node's id, box, fill, and sizing mode.
 *
 * Several repair rows on this arc were held for exactly one missing fact — the
 * hero's paint, a thumb frame's id, whether a board hugs. Each is one lookup,
 * and looking them up one at a time is how a 200-call day disappears. This does
 * the whole set in one call.
 *
 * Usage:
 *   node scripts/figma/resolve-and-read.mjs --pairs=52:2/Hero — SELECTED,641:2505/thumb --out=x.tsv
 *   node scripts/figma/resolve-and-read.mjs --boards=1333:7162,817:4856 --out=x.tsv   # whole-board kids
 *
 * Reads only.
 */
import { writeFileSync } from "node:fs";
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=").slice(1).join("=");
const PAIRS = arg("pairs", "").split(",").filter(Boolean).map((p) => { const i = p.indexOf("/"); return [p.slice(0, i), p.slice(i + 1)]; });
const BOARDS = arg("boards", "").split(",").filter(Boolean);
const OUT = arg("out", "");
if (!OUT || (!PAIRS.length && !BOARDS.length)) { console.error("need --out and --pairs or --boards"); process.exit(2); }

await connect();
const code = `
const PAIRS=${JSON.stringify(PAIRS)}, BOARDS=${JSON.stringify(BOARDS)};
const T=String.fromCharCode(9); const O=[];
const r=(v)=>v==null?"":String(Math.round(v));
const bx=(n)=>{ try{ const b=n.absoluteBoundingBox; return b?(r(b.x)+","+r(b.y)+","+r(b.width)+","+r(b.height)):""; }catch(e){ return ""; } };
const hex=(x)=>{ try{ const f=(x.fills||[])[0]; if(!f) return "none"; if(f.type!=="SOLID") return f.type;
  const c=f.color,h=(v)=>("0"+Math.round(v*255).toString(16)).slice(-2);
  return "#"+(h(c.r)+h(c.g)+h(c.b)).toUpperCase()+(f.opacity!=null&&f.opacity<1?("@"+f.opacity):""); }catch(e){ return "-"; } };
const sz=(x)=>{ try{ return (x.layoutSizingHorizontal||"?")+"/"+(x.layoutSizingVertical||"?")+(x.layoutPositioning==="ABSOLUTE"?"/ABS":""); }catch(e){ return ""; } };
const props=(x)=>{ try{ if(x.type!=="INSTANCE") return ""; const cp=x.componentProperties||{};
  return Object.keys(cp).map(k=>k+"="+(cp[k]&&cp[k].value!==undefined?cp[k].value:"?")).join(";"); }catch(e){ return ""; } };
const line=(tag,n,extra)=>O.push(tag+T+n.id+T+n.type+T+bx(n)+T+hex(n)+T+sz(n)+T+(n.layoutMode||"")+T+String(n.visible)+T+String(n.name).slice(0,60)+T+props(n)+(extra?T+extra:""));
for(const [board,name] of PAIRS){
  const b=await figma.getNodeByIdAsync(board);
  if(!b){ O.push("MISS"+T+board); continue; }
  const st=[b], hits=[];
  while(st.length){ const c=st.pop(); if(c!==b && String(c.name).indexOf(name)===0) hits.push(c); if(c.children) st.push(...c.children); }
  O.push("FIND"+T+board+T+name+T+"n="+hits.length);
  for(const h of hits.slice(0,40)) line("  H",h,"parent="+(h.parent?h.parent.id+":"+String(h.parent.name).slice(0,24):""));
}
for(const id of BOARDS){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ O.push("MISS"+T+id); continue; }
  line("B",n,"kids="+((n.children||[]).length));
  for(const c of (n.children||[]).slice(0,30)) line("  K",c,"");
}
O.push("END"+T+"pairs="+PAIRS.length+T+"boards="+BOARDS.length);
return O.join(String.fromCharCode(10));
`;
const res = await rpc("tools/call", { name: "use_figma", arguments: { description: "Resolve node names and read fills/sizing (read-only)", code, fileKey: "g4GzQFqzNYz5sosz1QtZXC" } }, 9);
const joined = (res.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (res.result?.isError || !joined.includes("\nEND\t")) { console.error("INCOMPLETE:", joined.slice(0, 250)); process.exit(3); }
writeFileSync(OUT, joined);
console.log(`ok ${joined.length} bytes -> ${OUT}`);
