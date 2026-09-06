/**
 * Apply the Figma-truth pass's board renames — and read every one of them back.
 *
 * The pass marks a board whose capability the code cannot produce. It NEVER
 * deletes the design: deleting a drawing because it was never built destroys the
 * design on the grounds that it is not yet real, and that call has already been
 * made and recorded once in this arc (SH-CO-01).
 *
 * Three markers, three different claims — collapsing them loses the difference:
 *   [not-implemented]  the code has no producer; it COULD be built
 *   [unreachable]      the product cannot produce this state by construction
 *   RETIRED            superseded by another board (an archive marker, not a
 *                      claim about the code)
 *
 * Writes are not verified by the write. A capture submit in this repo has
 * reported success on a dead POST and failure on four that landed, so every
 * rename here is read back from the file and diffed before the script reports.
 *
 * Usage:
 *   node scripts/figma/apply-truth-marks.mjs <plan.json>          # dry run
 *   node scripts/figma/apply-truth-marks.mjs <plan.json> --apply
 *
 * plan.json: [{ "id": "306:2111", "name": "new full board name", "why": "..." }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: apply-truth-marks.mjs <plan.json> [--apply]"); process.exit(1); }

const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const BAD = plan.filter((p) => !p.id || !p.name || !/^\d+:\d+$/.test(p.id));
if (BAD.length) { console.error("malformed rows:", JSON.stringify(BAD).slice(0, 400)); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
};

// Chunked so a large plan cannot hit the 20000-character response cap.
const CHUNK = 25;
let applied = 0, unchanged = 0, missing = 0;
const mismatches = [];

for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const payload = JSON.stringify(rows.map((r) => [r.id, r.name]));
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="1:3");',
    'await figma.setCurrentPageAsync(pg);',
    'const rows=' + payload + ';',
    'const out=[];',
    'for(const [id,want] of rows){',
    '  const n=await figma.getNodeByIdAsync(id);',
    '  if(!n){ out.push("MISSING\\t"+id); continue; }',
    '  const had=n.name;',
    '  if(had===want){ out.push("SAME\\t"+id); continue; }',
    APPLY ? '  n.name=want;' : '',
    // read back from the file, not from the local handle
    APPLY ? '  const again=await figma.getNodeByIdAsync(id);' : '  const again={name:had};',
    APPLY ? '  out.push((again.name===want?"OK\\t":"MISMATCH\\t")+id+"\\t"+had+"\\t=>\\t"+again.name);'
          : '  out.push("WOULD\\t"+id+"\\t"+had+"\\t=>\\t"+want);',
    '}',
    'return out.join(String.fromCharCode(10));',
  ].filter(Boolean).join("\n");

  const text = await call(code, (APPLY ? "rename" : "dry-run rename of") + " " + rows.length + " boards to their code-truth marker");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const kind = line.split("\t")[0];
    if (kind === "OK" || kind === "WOULD") applied++;
    else if (kind === "SAME") unchanged++;
    else if (kind === "MISSING") { missing++; console.log(line); }
    else { mismatches.push(line); console.log(line); }
    if (kind === "WOULD" || kind === "OK") console.log(line);
  }
}

console.log("");
console.log((APPLY ? "renamed " : "would rename ") + applied +
  "   already-correct=" + unchanged + "   missing=" + missing + "   MISMATCH=" + mismatches.length);
if (mismatches.length) { console.error("read-back disagreed with the write on " + mismatches.length + " nodes"); process.exit(2); }
if (missing) process.exit(3);
