/**
 * Every TEXT node in a board that matches a pattern — all hits, with full
 * characters, in ONE call.
 *
 * `resolve-selectors.mjs` is the right tool when a row's selector is already
 * correct: it refuses AMBIGUOUS and NOMATCH rather than guessing, which is what
 * you want from an applier. It is the wrong tool for finding out WHY a row did
 * not resolve, because the answer it gives — "no" — is the same answer for a
 * string that moved, a string that was already rewritten, and a board that draws
 * the phrase twice. Eight rows across UX-I-16, UX-I-10 and UX-I-38 came back
 * unresolved on 2026-09-07 and the next move for all eight was the same: read
 * the board and look.
 *
 * Prints every hit rather than one, and the WHOLE string rather than a prefix,
 * because a `splice` row needs the surrounding words and a whole-node rewrite
 * that drops them is the failure this arc guards with `expect`.
 *
 * Reads only. Writes nothing.
 *
 * Usage:
 *   node scripts/figma/find-text-nodes.mjs --page=1:3 \
 *        --in=162:2:approval --in=163:113:time-travel --in=1138:13436:*
 *
 *   --in=<boardId>:<substring>   case-insensitive; `*` returns every TEXT node.
 *   --names=<boardId>:<substring> layer NAMES rather than characters (any type),
 *                                 for finding the control a hotspot must cover.
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=")[1];
const multi = (k) => process.argv.filter((a) => a.startsWith("--" + k + "="))
  .map((a) => a.slice(k.length + 3))
  .map((s) => { const i = s.indexOf(":", s.indexOf(":") + 1); return [s.slice(0, i), s.slice(i + 1)]; });

const PAGE = arg("page", "1:3");
const IN = multi("in");
const NAMES = multi("names");
const CAP = Number(arg("cap", "26"));
if (!IN.length && !NAMES.length) { console.error("usage: find-text-nodes.mjs --in=<board>:<substring> [--names=<board>:<substring>]"); process.exit(1); }

await connect();
const code = `
const PAGE=${JSON.stringify(PAGE)}, IN=${JSON.stringify(IN)}, NAMES=${JSON.stringify(NAMES)}, CAP=${CAP};
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "page "+PAGE+" not found";
await figma.setCurrentPageAsync(pg);
const TB=String.fromCharCode(9), NL=String.fromCharCode(10);
const out=[];
const walk=(root)=>{ const st=[root], all=[];
  while(st.length){ const n=st.shift(); all.push(n); if(n.children) for(const c of n.children) st.push(c); }
  return all; };
for(const [bid,pat] of IN){
  const b=await figma.getNodeByIdAsync(bid);
  out.push("");
  if(!b){ out.push("MISSING"+TB+bid); continue; }
  out.push("IN"+TB+bid+TB+Math.round(b.width)+"x"+Math.round(b.height)+TB+String(b.name).slice(0,52));
  const p=String(pat).toLowerCase();
  let n=0;
  for(const t of walk(b)){
    if(t.type!=="TEXT") continue;
    let ch=""; try{ ch=String(t.characters); }catch(e){ continue; }
    if(p!=="*" && ch.toLowerCase().indexOf(p)<0) continue;
    if(n++>=CAP){ out.push("  ...cap"); break; }
    out.push("  "+t.id+TB+Math.round(t.x)+","+Math.round(t.y)+TB+t.fontSize+TB+t.textAutoResize+TB+JSON.stringify(ch).slice(0,190));
  }
  if(!n) out.push("  NO-HIT");
}
for(const [bid,pat] of NAMES){
  const b=await figma.getNodeByIdAsync(bid);
  out.push("");
  if(!b){ out.push("MISSING"+TB+bid); continue; }
  out.push("NAMES"+TB+bid+TB+String(b.name).slice(0,52));
  const p=String(pat).toLowerCase();
  let n=0;
  for(const c of walk(b)){
    if(c.id===b.id) continue;
    const nm=String(c.name||"");
    if(p!=="*" && nm.toLowerCase().indexOf(p)<0) continue;
    if(n++>=CAP){ out.push("  ...cap"); break; }
    out.push("  "+c.id+TB+c.type.slice(0,9)+TB+Math.round(c.x)+","+Math.round(c.y)+TB+Math.round(c.width)+"x"+Math.round(c.height)+TB+nm.slice(0,44));
  }
  if(!n) out.push("  NO-HIT");
}
return out.join(NL).slice(0,17000);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "read-only: every TEXT node matching a pattern in " + (IN.length + NAMES.length) + " board(s)",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 1200));
