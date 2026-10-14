#!/usr/bin/env node
/**
 * gate:file-size — ratchet on source files over 800 lines (DQ-007).
 *
 * "One file = one job" had no gate, and the 2026-10-08 audit counted 26
 * non-test source files over 800 lines (MediaManager 1854, Composer 1451,
 * ExportEngine 1398 …). The ones that exist are listed in
 * scripts/baselines/file-size.json; this fails when
 *   - a file NOT on the list crosses 800 lines, or
 *   - the number of files over 800 rises.
 * A listed file that drops to 800 or fewer is reported so the list can shrink
 * (`--update` rewrites it to today's set). Listed files may still change size
 * — the plan for draining them is docs/plans/2026-10-09-large-file-split-plan.md.
 *
 * Usage: node scripts/check-file-size.mjs [--update]
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 800;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const BASELINE_PATH = join(ROOT, "scripts", "baselines", "file-size.json");

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) {
      if (n !== "node_modules" && n !== "__tests__") walk(p, out);
    } else if (/\.(ts|tsx)$/.test(n) && !/\.(test|spec)\.tsx?$/.test(n) && !n.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const over = {};
for (const file of walk(SRC)) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > LIMIT) over[relative(ROOT, file)] = lines;
}
const sorted = Object.fromEntries(Object.entries(over).sort(([, a], [, b]) => b - a));

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE_PATH, JSON.stringify({ limit: LIMIT, files: sorted }, null, 2) + "\n");
  console.log(`[file-size] baseline set: ${Object.keys(sorted).length} files over ${LIMIT} lines`);
  process.exit(0);
}

const { files: listed } = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const fresh = Object.keys(over).filter((f) => !(f in listed));
const shrunk = Object.keys(listed).filter((f) => !(f in over));
const count = Object.keys(over).length;
const baseCount = Object.keys(listed).length;

if (fresh.length > 0 || count > baseCount) {
  console.error(`[file-size] FAIL — ${count} files over ${LIMIT} lines (baseline ${baseCount}).`);
  for (const f of fresh) console.error(`  new: ${f} (${over[f]} lines) — split it by concern before it lands`);
  process.exit(1);
}
if (shrunk.length > 0) {
  console.log(`[file-size] ok — ${count} over ${LIMIT} (baseline ${baseCount}); now under the limit: ${shrunk.join(", ")}`);
  console.log("  Ratchet: node scripts/check-file-size.mjs --update");
} else {
  console.log(`[file-size] ok — ${count} files over ${LIMIT} lines (baseline ${baseCount})`);
}
