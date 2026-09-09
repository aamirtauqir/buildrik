/**
 * Resolve the `selector` rows in a V2→V1 plan into TEXT node ids, in ONE mcp call.
 *
 * The Figma MCP seat quota — not the node count — is the binding constraint on
 * this arc (2026-09-07: every tool, read-only `get_metadata` included, answered
 * "You've reached the Figma MCP tool call limit for your Full seat on the
 * Professional plan"). Resolving 28 ids the ordinary way is 9 board reads. This
 * is one call.
 *
 * INPUT is a plan whose rows carry EITHER an `id` (already known, left alone) OR
 * a `selector` { board, contains } plus `unresolved-id: true`. OUTPUT is the same
 * plan with every resolvable row carrying `id` + `expect`, ready for
 * apply-text-fixes.mjs.
 *
 * It REFUSES an ambiguous row rather than guessing. Two TEXT nodes on one board
 * containing the same substring is exactly the case where taking the first
 * silently rewrites the wrong label, and a rename is the one failure a re-run
 * cannot recover from.
 *
 *   node scripts/figma/history-resolve-ids.mjs <plan.json>            # print to stdout
 *   node scripts/figma/history-resolve-ids.mjs <plan.json> --write    # rewrite in place
 *
 * `mode: "splice"` rows rewrite only the matched substring and keep the rest of
 * the node's characters. apply-text-fixes replaces the WHOLE node, so a fragment
 * row without this silently truncates the label it was meant to correct — the
 * caption rows are exactly that shape.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const WRITE = process.argv.includes("--write");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: history-resolve-ids.mjs <plan.json> [--write]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

const todo = plan.map((r, i) => [i, r]).filter(([, r]) => !r.id && r.selector);
if (!todo.length) { console.error("nothing to resolve"); process.stdout.write(JSON.stringify(plan, null, 1) + "\n"); process.exit(0); }

await connect();
const code = `
const ROWS=${JSON.stringify(todo.map(([i, r]) => [i, r.selector.board, r.selector.contains]))};
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
await figma.setCurrentPageAsync(pg);
const cache={};
const out=[];
for(const [i,board,contains] of ROWS){
  if(!(board in cache)){
    const b=await figma.getNodeByIdAsync(board);
    cache[board]= b && b.findAll ? b.findAll(n=>n.type==="TEXT") : null;
  }
  const ts=cache[board];
  if(!ts){ out.push([i,"NOBOARD",board,contains,""].join("\\t")); continue; }
  const hits=ts.filter(t=>t.characters.indexOf(contains)>=0);
  if(hits.length===0){ out.push([i,"NOMATCH",board,contains,""].join("\\t")); continue; }
  if(hits.length>1){ out.push([i,"AMBIG",board,contains,hits.map(h=>h.id+"="+JSON.stringify(h.characters.slice(0,40))).join(" | ")].join("\\t")); continue; }
  out.push([i,"OK",board,contains,hits[0].id,hits[0].characters.replace(/\\n/g," ")].join("\\t"));
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "resolve " + todo.length + " TEXT node ids by board+substring for " + planPath,
  skillNames: "figma-use" } }, 1);
const text = r?.result?.content?.[0]?.text ?? "";
if (!text || /tool call limit/i.test(text)) { console.error(text || JSON.stringify(r).slice(0, 400)); process.exit(2); }

let ok = 0;
for (const line of text.split("\n")) {
  const [i, status, board, contains, id, chars] = line.split("\t");
  const row = plan[Number(i)];
  if (status !== "OK") { console.error(`${status}\t${board}\t${contains}\t${id ?? ""}`); continue; }
  row.id = id;
  row.expect = chars;
  if (row.mode === "splice") { row.text = chars.replace(contains, row.splice); delete row.splice; delete row.mode; }
  delete row["unresolved-id"];
  ok++;
}
console.error(`resolved ${ok}/${todo.length}`);
const outText = JSON.stringify(plan, null, 1) + "\n";
if (WRITE) fs.writeFileSync(planPath, outText); else process.stdout.write(outText);
