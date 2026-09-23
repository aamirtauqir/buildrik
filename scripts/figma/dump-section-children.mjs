/**
 * Direct children of several SECTIONs on one page, in ONE call.
 *
 * `dump-board-interiors.mjs` reads one target section plus named boards;
 * `board-baseline.mjs` reads counts only. Neither answers "what is inside these
 * four sections, and where is the next free slot in each" — which is exactly
 * what a placement decision needs before a board is drawn, and the reason the
 * shell arc placed a board from a stale 34-child reading of a section that now
 * holds 54.
 *
 * Reads only. Writes nothing.
 *
 * Usage:
 *   node scripts/figma/dump-section-children.mjs --sections=1776:8385,1779:5 [--page=1:3] [--text]
 *
 * `--text` also returns the leading characters of every TEXT child. A caption is
 * a TEXT child of the section, not of a board, so its content is invisible to a
 * name-only listing — and a sibling sweep cannot tell a caption that already
 * carries a finding from one that does not without reading it.
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=")[1];
const PAGE = arg("page", "1:3");
const SECTIONS = arg("sections", "").split(",").filter(Boolean);
const TEXT = process.argv.includes("--text");
/* A 74-char name is enough to place a board and NOT enough to decide whether it
   already carries a marker — this arc swept five boards for a clause their
   truncated names had hidden. `--full` widens names for exactly that check. */
const FULL = process.argv.includes("--full");
if (!SECTIONS.length) { console.error("usage: dump-section-children.mjs --sections=a,b [--page=1:3]"); process.exit(1); }

await connect();
const code = `
const PAGE=${JSON.stringify(PAGE)}, IDS=${JSON.stringify(SECTIONS)}, WANT_TEXT=${TEXT}, NAME_N=${FULL?360:74};
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const out=[];
/* "*" = every top-level child of the page, sections and loose boards alike.
   Page 1:6 holds the canonical client-review family and its boards are NOT all
   parented to sections, so a section-only listing reports them as absent —
   which is the difference between "not there" and "not looked at". */
if(IDS.length===1 && IDS[0]==="*"){
  for(const c of pg.children){
    out.push(c.type.slice(0,7)+"\t"+c.id+"\t"+Math.round(c.x)+","+Math.round(c.y)+"\t"+Math.round(c.width)+"x"+Math.round(c.height)+"\t"+String(c.name).slice(0,90));
    if(c.type==="SECTION"){ for(const g of c.children){ out.push("   "+g.type.slice(0,5)+"\t"+g.id+"\t"+Math.round(g.width)+"x"+Math.round(g.height)+"\t"+String(g.name).slice(0,90)); } }
  }
  const b0=out.join(String.fromCharCode(10));
  return b0.length>18500 ? b0.slice(0,18500)+String.fromCharCode(10)+"!! TRUNCATED at 18500 of "+b0.length : b0;
}
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  out.push("SEC\\t"+s.id+"\\t"+Math.round(s.x)+","+Math.round(s.y)+"\\t"+Math.round(s.width)+"x"+Math.round(s.height)+"\\t"+String(s.name).slice(0,48)); }
out.push("");
for(const id of IDS){
  const s=await figma.getNodeByIdAsync(id);
  if(!s){ out.push("MISSING\\t"+id); continue; }
  out.push("== "+id+" "+String(s.name).slice(0,60)+"  "+Math.round(s.width)+"x"+Math.round(s.height)+"  children="+s.children.length);
  for(const c of s.children){
    let line="  "+c.type.slice(0,5)+"\\t"+c.id+"\\t"+Math.round(c.x)+","+Math.round(c.y)+"\\t"+Math.round(c.width)+"x"+Math.round(c.height)+"\\t"+String(c.name).slice(0,NAME_N);
    if(WANT_TEXT && c.type==="TEXT"){ line+="\\t>>\\t"+String(c.characters).replace(/[\\r\\n]+/g," ").slice(0,150); }
    out.push(line);
  }
}
const body=out.join(String.fromCharCode(10));
return body.length>18500 ? body.slice(0,18500)+String.fromCharCode(10)+"!! TRUNCATED at 18500 of "+body.length+" — re-read fewer sections" : body;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "read direct children of " + SECTIONS.length + " sections on page " + PAGE,
  skillNames: "figma-use" } }, 7);
if (r?.error) { console.error("RPC ERROR " + JSON.stringify(r.error).slice(0, 500)); process.exit(2); }
console.log((r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "[" + c.type + "]")).join("\n"));
