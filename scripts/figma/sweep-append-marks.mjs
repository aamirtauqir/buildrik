/**
 * APPEND a marker to a board's name, without knowing the name first.
 *
 * `apply-truth-marks.mjs` sets the FULL name and is the right tool when the
 * whole name is being authored. It is the wrong tool for a sibling sweep: the
 * boards being swept already carry markers from earlier passes, a section
 * listing truncates names, and a plan that guesses the tail silently destroys
 * it. That has already happened once in this arc — `1736:8397` on page 1:6 was
 * renamed to the literal sentence *"APPEND to whatever the current name is: …"*,
 * and the run logged OK because the read-back matched the string it was asked
 * for. A write is not verified by the write; it is verified by reading what the
 * node now holds and checking it is what was MEANT.
 *
 * So this script never sends a full name. It sends a suffix and a `key`, and
 * the sandbox does the concatenation against whatever the node actually holds.
 * `key` also makes it idempotent: a name already containing it is left alone.
 *
 * Rows may name their own page — the client-review family is canonical on 1:6
 * while everything else is on 1:3 — and rows are grouped so each page costs one
 * call, not one per row.
 *
 * Usage:
 *   node scripts/figma/sweep-append-marks.mjs <plan.json>           # dry run
 *   node scripts/figma/sweep-append-marks.mjs <plan.json> --apply
 *
 * plan.json rows: { "id", "skip_if_name_contains", "append_to_name", "page"?, "why" }
 * The field names are deliberately NOT `add`/`key`: normalize-plans.mjs reads
 * those as an `append-text` row and would hand these FRAME ids to the TEXT-node
 * appender in the shared queue.
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: sweep-append-marks.mjs <plan.json> [--apply]"); process.exit(1); }

const doc = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(doc) ? doc : doc.sweep;
if (!Array.isArray(plan)) { console.error("plan has no `sweep` array"); process.exit(1); }
const BAD = plan.filter((r) => !r.id || !/^\d+:\d+$/.test(r.id) || !r.skip_if_name_contains || !r.append_to_name);
if (BAD.length) { console.error("malformed rows: " + JSON.stringify(BAD.map((r) => r.id)).slice(0, 300)); process.exit(1); }
/* A straight double quote inside the marker survives JSON.stringify, but the
   arc has paid twice for quote handling in these payloads. Refuse rather than
   discover it in Figma. */
const QUOTED = plan.filter((r) => /["`]/.test(r.append_to_name) || /["`]/.test(r.skip_if_name_contains));
if (QUOTED.length) { console.error('rows carry a straight double quote or backtick — use the curly pair: ' + QUOTED.map((r) => r.id).join(",")); process.exit(1); }

const byPage = new Map();
for (const r of plan) { const p = r.page || "1:3"; if (!byPage.has(p)) byPage.set(p, []); byPage.get(p).push(r); }

await connect();
const CHUNK = 20;
let changed = 0, same = 0, missing = 0; const bad = [];

for (const [page, rows] of byPage) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const payload = JSON.stringify(slice.map((r) => [r.id, r.skip_if_name_contains, r.append_to_name]));
    const code = [
      'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(page) + ');',
      'if(!pg) return "PAGE NOT FOUND";',
      'await figma.setCurrentPageAsync(pg);',
      'const rows=' + payload + ';',
      'const out=[];',
      'for(const [id,key,add] of rows){',
      '  const n=await figma.getNodeByIdAsync(id);',
      '  if(!n){ out.push("MISSING\\t"+id); continue; }',
      '  const had=String(n.name);',
      '  if(had.indexOf(key)>=0){ out.push("SAME\\t"+id+"\\t"+had.slice(0,150)); continue; }',
      '  const want=had+add;',
      APPLY ? '  n.name=want;' : '',
      APPLY ? '  const again=await figma.getNodeByIdAsync(id);'
            : '  const again={name:had};',
      APPLY ? '  out.push((String(again.name)===want?"OK\\t":"MISMATCH\\t")+id+"\\t"+String(again.name).slice(0,260));'
            : '  out.push("WOULD\\t"+id+"\\t"+had+"\\t==>\\t"+want.slice(0,260));',
      '}',
      'return out.join(String.fromCharCode(10)).slice(0,18500);',
    ].filter(Boolean).join("\n");

    const r = await rpc("tools/call", { name: "use_figma", arguments: {
      fileKey: FILE_KEY, code,
      description: (APPLY ? "append" : "dry-run append of") + " a sibling-sweep marker to " + slice.length + " board names on page " + page,
      skillNames: "figma-use" } }, 1);
    const text = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
    /* An unparseable reply is a result, not a silence — a thrown sandbox comes
       back as prose and has read as "nothing found" in this repo before. */
    if (!/^(OK|WOULD|SAME|MISSING|MISMATCH)\t/m.test(text)) { console.error("RAW REPLY (no rows parsed):\n" + text.slice(0, 900)); process.exit(2); }
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const kind = line.split("\t")[0];
      if (kind === "OK" || kind === "WOULD") { changed++; console.log(line); }
      else if (kind === "SAME") { same++; console.log(line); }
      else if (kind === "MISSING") { missing++; console.log(line); }
      else { bad.push(line); console.log(line); }
    }
  }
}
console.log("");
console.log((APPLY ? "appended " : "would append ") + changed + "   already-carried=" + same + "   missing=" + missing + "   MISMATCH=" + bad.length);
if (bad.length || missing) process.exit(3);
