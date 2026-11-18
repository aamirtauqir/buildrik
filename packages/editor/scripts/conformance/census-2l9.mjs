#!/usr/bin/env node
/**
 * census-2l9 — which rows of `boards-2l9.json` are still open, and what
 * would close each one. The final gate of the 2L9 design plan reads its exit
 * code (docs/superpowers/plans/2026-10-22-implement-2l9-design.md, Task 0.4).
 *
 *   node scripts/conformance/census-2l9.mjs [manifest] [--json] [--tier P1|P2|P3]
 *
 * Exit 0: every active row done. 1: open rows (listed on stdout).
 * 2: manifest missing, malformed or invalid (reason on stderr).
 *
 * Retires once the done predicate holds for every row.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STATUS = new Set(["active", "design-ahead", "out-of-scope"]);
const VERIFIED = new Set(["no", "driven", "match", "drift-open", "drift-fixed", "unreachable"]);
const AUTHORITY = /^(board|undecided|(code|founder|blocked|open|superseded):.+)$/;
const CLOSING_AUTHORITY = /^(code|founder|blocked|superseded):/;
const NEEDS_NOTE = /^(code|founder):/;

class ManifestError extends Error {}

/** The done predicate for one row, ignoring `inheritsFrom` (see `census`). */
export function isDone(row) {
  if (row.status !== "active") return true;
  if (row.verified === "match" || row.verified === "drift-fixed") return true;
  if (!CLOSING_AUTHORITY.test(row.authority)) return false;
  return !NEEDS_NOTE.test(row.authority) || Boolean(row.verifiedNote?.trim());
}

function whatCloses(row) {
  if (NEEDS_NOTE.test(row.authority)) return "add verifiedNote explaining the authority";
  if (row.inheritsFrom) return `archetype ${row.inheritsFrom} must be done`;
  if (row.verified === "drift-open") return "fix the drift and re-compare";
  if (row.verified === "driven") return "compare live with the board";
  return "compare live with the board, or record an authority";
}

function validate(rows) {
  const ids = new Map(rows.map((r, i) => [r.nodeId, i]));
  rows.forEach((r, i) => {
    const bad = (field, why) => { throw new ManifestError(`manifest invalid at row ${i}, field ${field}: ${why}`); };
    if (typeof r.nodeId !== "string" || !r.nodeId) bad("nodeId", "missing");
    if (!STATUS.has(r.status)) bad("status", `unknown value ${JSON.stringify(r.status)}`);
    if (!VERIFIED.has(r.verified)) bad("verified", `unknown value ${JSON.stringify(r.verified)}`);
    if (typeof r.authority !== "string" || !AUTHORITY.test(r.authority)) bad("authority", `unknown value ${JSON.stringify(r.authority)}`);
    if (r.inheritsFrom === undefined) return;
    const seen = new Set([r.nodeId]);
    for (let at = r.inheritsFrom; at !== undefined; at = rows[ids.get(at)].inheritsFrom) {
      if (!ids.has(at)) bad("inheritsFrom", `dangling id ${at}`);
      if (seen.has(at)) bad("inheritsFrom", `cycle through ${at}`);
      seen.add(at);
    }
  });
}

/** Open rows and per-family counts for a parsed manifest. Throws ManifestError. */
export function census(manifest, { tier } = {}) {
  const rows = manifest?.boards;
  if (!Array.isArray(rows)) throw new ManifestError("manifest invalid at row -, field boards: not an array");
  validate(rows);
  const byId = new Map(rows.map((r) => [r.nodeId, r]));
  // An inheriting row takes its verification from its archetype, so it is
  // done exactly while the archetype is (unless it is out of scope itself).
  const done = (r) =>
    r.status !== "active" || (r.inheritsFrom === undefined ? isDone(r) : done(byId.get(r.inheritsFrom)));
  const families = {};
  const tiers = {};
  const open = [];
  for (const r of rows) {
    if (tier && r.tier !== tier) continue;
    const tr = (tiers[r.tier ?? "untiered"] ??= { total: 0, done: 0 });
    tr.total++;
    if (done(r)) tr.done++;
    const f = (families[r.family] ??= { total: 0, done: 0 });
    f.total++;
    if (done(r)) f.done++;
    else open.push({ nodeId: r.nodeId, family: r.family, verified: r.verified, authority: r.authority, closes: whatCloses(r) });
  }
  return { open, families, tiers };
}

function main(argv) {
  const json = argv.includes("--json");
  const tierAt = argv.indexOf("--tier");
  const tier = tierAt >= 0 ? argv[tierAt + 1] : undefined;
  const file = argv.find((a, i) => !a.startsWith("--") && !(tierAt >= 0 && i === tierAt + 1)) ?? new URL("./boards-2l9.json", import.meta.url);
  let result;
  try {
    let text;
    try { text = readFileSync(file, "utf8"); } catch { throw new ManifestError(`manifest invalid at row -, field file: cannot read ${file}`); }
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { throw new ManifestError(`manifest invalid at row -, field json: ${e.message}`); }
    result = census(parsed, { tier });
  } catch (e) {
    if (!(e instanceof ManifestError)) throw e;
    process.stderr.write(e.message + "\n");
    return 2;
  }
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else {
    for (const o of result.open) process.stdout.write(`${o.nodeId}\t${o.family}\t${o.verified}\t${o.authority}\t${o.closes}\n`);
    for (const [name, f] of Object.entries(result.families)) process.stdout.write(`# ${name}: ${f.done}/${f.total} done\n`);
    for (const [name, f] of Object.entries(result.tiers)) process.stdout.write(`## ${name}: ${f.done}/${f.total} done\n`);
  }
  return result.open.length ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
