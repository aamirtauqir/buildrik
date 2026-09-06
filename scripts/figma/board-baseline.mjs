/**
 * Per-section board counts for page 1:3, as an attributable baseline.
 *
 * A whole-page total is not enough. The arc report recorded "boards 927" and a
 * later check of the same measure — s.children.length summed over sections —
 * read 872. Fifty-five fewer, with no way to say WHERE, because a single number
 * cannot be diffed. This session's scripts cannot have caused it (the only real
 * deletion targets the proposal page, found by name; everything else removes a
 * clone it just made), but "cannot have" is an argument, not evidence.
 *
 * So: counts per section, written to a file. The next run diffs against it and
 * names the section that moved. A number you can only compare to itself is how
 * a 55-board delta becomes unattributable.
 *
 * Usage: node scripts/figma/board-baseline.mjs [--page=1:3]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
const FILE = "docs/design-jobs/findings/BOARD-BASELINE.json";

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
if(!pg) return "PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const rows=[];
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  rows.push({id:s.id,name:String(s.name).slice(0,60),n:(s.children||[]).length}); }
return JSON.stringify(rows);
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "per-section board counts for an attributable baseline", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? "";
if (!txt.trim().startsWith("[")) { console.log(txt.slice(0, 200)); process.exit(1); }
const now = JSON.parse(txt);
const total = now.reduce((a, s) => a + s.n, 0);

if (existsSync(FILE)) {
  const prev = JSON.parse(readFileSync(FILE, "utf8"));
  const pmap = Object.fromEntries(prev.sections.map((s) => [s.id, s]));
  let drift = 0;
  for (const s of now) {
    const p = pmap[s.id];
    if (!p) { console.log("NEW SECTION\t" + s.id + "\t" + s.name + "\t" + s.n); drift++; continue; }
    if (p.n !== s.n) { console.log("DRIFT\t" + s.id + "\t" + s.name + "\t" + p.n + " -> " + s.n); drift++; }
  }
  for (const p of prev.sections) if (!now.find((s) => s.id === p.id)) { console.log("SECTION GONE\t" + p.id + "\t" + p.name); drift++; }
  console.log(drift ? drift + " section(s) moved since " + prev.taken : "no drift since " + prev.taken);
}
writeFileSync(FILE, JSON.stringify({ taken: new Date().toISOString().slice(0, 10), page: PAGE, total, sections: now }, null, 1));
console.log("baseline: " + now.length + " sections, " + total + " boards -> " + FILE);
