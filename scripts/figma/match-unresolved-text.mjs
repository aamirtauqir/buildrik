/**
 * Resolve `text` rows whose selector names a board but a string the board does
 * not hold — by reading the board and matching what is actually there.
 *
 * `resolve-selectors.mjs` answers "is there a node containing exactly this?"
 * and correctly returns NOMATCH when the audit lane guessed the wording. That
 * is the honest answer and it is also a dead end: 77 rows named a real board and
 * a plausible-but-wrong string.
 *
 * So this takes a dump of every TEXT node on those boards and scores each
 * unresolved row against it:
 *
 *   1. exact containment (what resolve-selectors already tried)
 *   2. containment after normalising whitespace and case
 *   3. token overlap — the selector's distinctive words against the node's
 *
 * A row resolves only when ONE node wins outright. Ties and weak matches are
 * left unresolved and reported, because picking the best of three near-misses is
 * how the wrong label gets rewritten — the same reason resolve-selectors refuses
 * to take the first of several exact hits.
 *
 * Input: a TSV of `boardId <tab> nodeId <tab> JSON-quoted characters`.
 * Costs zero Figma calls; the dump is made separately.
 *
 * Usage:
 *   node scripts/figma/match-unresolved-text.mjs <dump.tsv> [--min=0.5] [--write]
 */
import fs from "node:fs";

const QUEUE = "docs/design-jobs/V2-TO-V1/queue.json";
const dumpPath = process.argv[2];
const WRITE = process.argv.includes("--write");
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=0.5").split("=")[1]);
if (!dumpPath) { console.error("usage: match-unresolved-text.mjs <dump.tsv> [--min=0.5] [--write]"); process.exit(1); }

const byBoard = new Map();
for (const line of fs.readFileSync(dumpPath, "utf8").split("\n")) {
  const [board, node, json] = line.split("\t");
  if (!board || !node || !json) continue;
  let chars; try { chars = JSON.parse(json); } catch { continue; }
  if (!byBoard.has(board)) byBoard.set(board, []);
  byBoard.get(board).push({ id: node, chars });
}
console.log(`dump: ${byBoard.size} boards, ${[...byBoard.values()].reduce((a, v) => a + v.length, 0)} TEXT nodes`);

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "is", "in", "on", "for", "it", "this", "that", "with"]);
const toks = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));

const doc = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
let resolved = 0, ambiguous = 0, nohit = 0, noboard = 0;
const report = [];

for (const row of doc.rows) {
  if (!row.unresolved || row.op !== "text" || row.id) continue;
  const sel = row.selector || {};
  const want = sel.contains || sel.equals || sel.matches;
  const board = sel.board;
  if (!want || !board) continue;
  const nodes = byBoard.get(board);
  if (!nodes) { noboard++; continue; }

  const wt = toks(want);
  const scored = nodes.map((n) => {
    if (n.chars.includes(want)) return { n, s: 1 };
    if (norm(n.chars).includes(norm(want))) return { n, s: 0.95 };
    const nt = toks(n.chars);
    if (!wt.size || !nt.size) return { n, s: 0 };
    let hit = 0; for (const w of wt) if (nt.has(w)) hit++;
    return { n, s: hit / wt.size };
  }).filter((x) => x.s >= MIN).sort((a, b) => b.s - a.s);

  if (!scored.length) { nohit++; report.push(["NOHIT", row.key, board, want.slice(0, 50), ""]); continue; }
  /* One winner means one winner. A near-tie is a tie. */
  if (scored.length > 1 && scored[1].s >= scored[0].s - 0.001) {
    ambiguous++;
    report.push(["TIE", row.key, board, want.slice(0, 50), scored.slice(0, 3).map((x) => x.n.id).join(" ")]);
    continue;
  }
  row.id = scored[0].n.id;
  row.matchedOn = scored[0].n.chars.slice(0, 60);
  row.matchScore = Number(scored[0].s.toFixed(2));
  delete row.unresolved;
  resolved++;
  report.push(["OK", row.key, board, want.slice(0, 40), `${scored[0].n.id} s=${scored[0].s.toFixed(2)} "${scored[0].n.chars.slice(0, 40)}"`]);
}

for (const r of report.slice(0, 40)) console.log(r[0].padEnd(6) + r.slice(1).join("  "));
if (report.length > 40) console.log(`… and ${report.length - 40} more`);
console.log(`\nresolved ${resolved}  ties ${ambiguous}  no-hit ${nohit}  board-not-in-dump ${noboard}`);
if (WRITE) { fs.writeFileSync(QUEUE, JSON.stringify(doc, null, 1)); console.log(`wrote ${QUEUE}`); }
else console.log("DRY RUN — add --write to keep the ids.");
