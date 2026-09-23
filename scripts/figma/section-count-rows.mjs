/**
 * Emit rename rows that put each section's REAL child count into its title.
 *
 * F22: thirteen of twenty-nine section titles claim a board count the section
 * does not have. Yesterday none of them did — the arc added 104 boards and no
 * title was regenerated.
 *
 * `order-sections.mjs` already derives the count, but it also does `s.x = 0;
 * s.y = y` on every section: a whole-page re-layout. F22 asks for the titles to
 * stop lying, not for the page to move. So this reads the counts and writes
 * plan rows; the applier's `expect` guard then refuses any title that has
 * changed since the read.
 *
 * Hand-typing them is not an option and the reason is on the record: the
 * 13:39 baseline recorded Inspector at 52, and a read four hours later gave 56.
 * A count typed by hand is stale the same afternoon; a derived one is not.
 *
 * Usage: node scripts/figma/section-count-rows.mjs --out=<plan.json>   (1 call)
 */
import { writeFileSync } from "node:fs";
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const OUT = (process.argv.find((a) => a.startsWith("--out=")) || "--out=").split("=")[1];
if (!OUT) { console.error("need --out"); process.exit(2); }

await connect();
const code = `
const pg = figma.root.children.find(p => p.id === "1:3");
if (!pg) return "page 1:3 not found";
await figma.setCurrentPageAsync(pg);
const T = String.fromCharCode(9);
return pg.children.filter(c => c.type === "SECTION")
  .map(s => [s.id, (s.children || []).length, String(s.name)].join(T)).join(String.fromCharCode(10));
`;
const res = await rpc("tools/call", { name: "use_figma", arguments: { description: "Read section child counts (read-only)", code, fileKey: "g4GzQFqzNYz5sosz1QtZXC" } }, 11);
const out = (res.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (res.result?.isError || !out.includes("\t")) { console.error("INCOMPLETE:", out.slice(0, 200)); process.exit(3); }

const rows = [];
for (const line of out.split("\n")) {
  const [id, n, ...rest] = line.split("\t");
  if (!id || !rest.length) continue;
  const name = rest.join("\t");
  /* The count is the number after the LAST " · " that is followed by a number,
     which is how these titles are built: "NN · Label · count[ — note]". */
  const m = name.match(/^(.*·\s*)(\d+)(\s*(?:—.*)?)$/);
  if (!m) { console.log(`skip (no trailing count): ${id} ${name}`); continue; }
  if (Number(m[2]) === Number(n)) continue;
  rows.push({
    op: "rename", id, name: `${m[1]}${n}${m[3]}`, expect: name,
    why: `F22 — the title claims ${m[2]} boards; the section holds ${n}. Count derived from the section's own children at read time, not hand-typed: the 13:39 baseline said Inspector 52 and a read four hours later said 56, so a typed number is stale the day it is written. Rename only — deliberately NOT order-sections.mjs, which also does s.x=0; s.y=y on every section and would re-lay-out the page.`,
  });
}
writeFileSync(OUT, JSON.stringify({ slug: "zz-f22-counts", page: "1:3", rows }, null, 1));
console.log(`${rows.length} sections need their count corrected -> ${OUT}`);
for (const r of rows) console.log(`  ${r.id}  ${r.expect}  ->  ${r.name}`);
