#!/usr/bin/env node
/**
 * One-shot codemod: rewrite every legacy chrome token reference to its
 * generated `--bk-*` equivalent, using scripts/tokens/legacy-map.json.
 *
 *   node scripts/tokens/codemod.mjs            # dry run, prints the plan
 *   node scripts/tokens/codemod.mjs --apply    # writes the files
 *
 * Only `var(--legacy…)` REFERENCES are rewritten. Legacy DEFINITIONS are left
 * alone here and deleted in a separate step, so the two changes stay reviewable
 * independently.
 *
 * Site-builder tokens (`--buildrick-design-*`) are never touched: those values
 * ship inside customers' published websites, and restyling them is a product
 * decision with a migration, not a refactor. The guard below is load-bearing.
 *
 * @license BSD-3-Clause
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const SRC = join(ROOT, "src");
const APPLY = process.argv.includes("--apply");

const { map } = JSON.parse(readFileSync(join(HERE, "legacy-map.json"), "utf8"));

const forbidden = Object.keys(map).filter((k) => k.startsWith("--buildrick-design-"));
if (forbidden.length) {
  console.error(`REFUSING TO RUN: ${forbidden.length} site-builder tokens are in the map:`);
  for (const f of forbidden) console.error(`  ${f}`);
  process.exit(1);
}

/** longest-first so `--bd-accent-tint` is never clipped by `--bd-accent` */
const legacy = Object.keys(map).sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(var\\(\\s*)(${legacy.map((t) => t.replace(/[-]/g, "\\-")).join("|")})(?![a-zA-Z0-9_-])`, "g");

/** .html covers the dev-only vibcoder preview galleries in src/preview/ */
const EXT = new Set([".css", ".ts", ".tsx", ".html"]);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (EXT.has(p.slice(p.lastIndexOf(".")))) files.push(p);
  }
})(SRC);

let touchedFiles = 0;
let totalReplacements = 0;
const perToken = new Map();
const biggest = [];

for (const file of files) {
  if (file.includes("tokens.generated")) continue;
  const before = readFileSync(file, "utf8");
  let count = 0;
  const after = before.replace(pattern, (_m, open, token) => {
    count++;
    perToken.set(token, (perToken.get(token) || 0) + 1);
    return open + map[token];
  });
  if (!count) continue;
  touchedFiles++;
  totalReplacements += count;
  biggest.push([count, relative(ROOT, file)]);
  if (APPLY) writeFileSync(file, after);
}

biggest.sort((a, b) => b[0] - a[0]);

console.log(`${APPLY ? "APPLIED" : "DRY RUN"}`);
console.log(`  files scanned      ${files.length}`);
console.log(`  files changed      ${touchedFiles}`);
console.log(`  references rewritten ${totalReplacements}`);
console.log(`  distinct legacy tokens hit ${perToken.size} of ${legacy.length} mapped`);
console.log(`\n  busiest files:`);
for (const [n, f] of biggest.slice(0, 12)) console.log(`    ${String(n).padStart(4)}  ${f}`);
if (!APPLY) console.log(`\n  re-run with --apply to write.`);
