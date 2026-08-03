#!/usr/bin/env node
/**
 * How long since each conformance spec was extracted from Figma.
 *
 * Usage:  check-spec-age.mjs --mode=prepush   FAIL past the limit
 *         check-spec-age.mjs --mode=ci        WARN past the limit, exit 0
 *
 * BE HONEST ABOUT WHAT THIS IS
 * This is a calendar alarm, NOT drift detection. A board can change ten minutes
 * after extraction and this stays quiet until the threshold expires; a board
 * that never changes will trip it for no reason at all. It is a proxy, and the
 * only one available: CI has no Figma access (see README §"Why extraction is an
 * agent step"), so nothing automated can ask whether the board actually moved.
 *
 * WHY THE TWO MODES
 * The hard failure belongs where the fix is possible. A developer's machine has
 * the Figma MCP and can re-extract; a CI runner cannot, and failing a build for
 * something the build cannot fix teaches people to route around the gate. So
 * pre-push blocks and CI reports.
 *
 * THE MODE IS AN ARGUMENT, NEVER INFERRED
 * Sniffing `process.env.CI` would mean one wrong default silently turns the
 * blocking half into a no-op, and nothing would look broken. Refusing to run
 * without an explicit --mode makes that failure impossible rather than unlikely.
 *
 * WHAT IT CANNOT PROMISE
 * `scripts/hooks/pre-push` is installed per clone by `pnpm run hooks:install`
 * and is bypassable with `git push --no-verify`. So even the blocking half is
 * advisory in the end. Spec freshness is a human ritual with a reminder
 * attached, and the plan says so rather than implying a guarantee.
 *
 * Exit codes: 0 fine (or CI mode), 1 stale in prepush mode / a spec is
 * malformed, 3 nothing to check.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPECS = join(HERE, "specs");

/** Days before a spec is considered worth re-extracting. */
const MAX_AGE_DAYS = 30;

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith("--mode="));
const mode = modeArg?.slice("--mode=".length);

if (mode !== "prepush" && mode !== "ci") {
  console.error(
    "[spec-age] --mode is required and must be `prepush` or `ci`.\n" +
    "           It is never inferred from the environment: one wrong default would\n" +
    "           turn the blocking half into a silent no-op and nothing would look broken.\n" +
    "             --mode=prepush   FAIL past the limit (your machine can re-extract)\n" +
    "             --mode=ci        WARN past the limit (CI has no Figma access)"
  );
  process.exit(2);
}

if (!existsSync(SPECS)) {
  console.error(`[spec-age] no specs/ directory at ${SPECS} — nothing to check.`);
  process.exit(3);
}

const files = readdirSync(SPECS).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error(`[spec-age] specs/ is empty — nothing to check. A harness with no specs compares nothing.`);
  process.exit(3);
}

const now = Date.now();
const rows = [];
const malformed = [];

for (const file of files) {
  const name = file.replace(/\.json$/, "");
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(SPECS, file), "utf8"));
  } catch (err) {
    malformed.push(`${name}: not valid JSON (${err.message})`);
    continue;
  }
  // A spec with no timestamp is not "fresh", it is unmeasurable. Treating a
  // missing field as fine is how a check quietly stops checking.
  if (!spec.extractedAt) {
    malformed.push(`${name}: has no \`extractedAt\` — cannot tell how old it is`);
    continue;
  }
  const t = Date.parse(spec.extractedAt);
  if (Number.isNaN(t)) {
    malformed.push(`${name}: \`extractedAt\` is not a date (${spec.extractedAt})`);
    continue;
  }
  rows.push({ name, days: (now - t) / 86_400_000, at: spec.extractedAt });
}

if (malformed.length) {
  console.error(`[spec-age] ${malformed.length} spec(s) cannot be aged:`);
  for (const m of malformed) console.error(`           ${m}`);
  console.error(`           Re-extract: node scripts/conformance/extract.mjs <surface>`);
  process.exit(1);
}

rows.sort((a, b) => b.days - a.days);
const stale = rows.filter((r) => r.days > MAX_AGE_DAYS);

const line = (r) => `${r.name.padEnd(24)} ${String(Math.floor(r.days)).padStart(4)}d   ${r.at}`;

if (!stale.length) {
  console.log(`[spec-age] PASS — ${rows.length} spec(s), oldest ${Math.floor(rows[0].days)}d (limit ${MAX_AGE_DAYS}d).`);
  process.exit(0);
}

const header =
  `${stale.length} of ${rows.length} spec(s) are older than ${MAX_AGE_DAYS} days. ` +
  `This is a calendar alarm, not proof the board moved — but nothing automated can check that.`;

if (mode === "ci") {
  console.log(`[spec-age] WARN — ${header}`);
  for (const r of stale) console.log(`           ${line(r)}`);
  console.log(`           CI cannot re-extract (no Figma access). Blocking happens at push time.`);
  process.exit(0);
}

console.error(`[spec-age] STALE — ${header}`);
for (const r of stale) console.error(`           ${line(r)}`);
console.error(
  `\n           Re-extract on this machine, which has the Figma MCP:\n` +
  `             1. agent step: get_design_context(<nodeId>) -> raw-figma/<surface>.json\n` +
  `             2. node scripts/conformance/extract.mjs <surface>\n` +
  `           Then review the raw-figma diff — that is where a board change is visible.`
);
process.exit(1);
