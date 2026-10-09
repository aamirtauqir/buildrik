#!/usr/bin/env node
/**
 * gate:relative-imports — ratchet on `../../` module specifiers (DQ-006).
 *
 * Root CLAUDE.md bans `../../` relative imports ("use path aliases") and no
 * gate enforced it: the 2026-10-08 audit counted 919 import lines. This
 * counts every module specifier under src/ (tests included) that climbs two
 * or more levels — `from`, side-effect `import`, dynamic `import()`,
 * `vi.mock`/`vi.importActual`, `require` — and fails when the count rises
 * above scripts/baselines/relative-imports.json. It may only go down: when the
 * count drops, lower the baseline in the same commit (`--update`).
 *
 * The residuals are specifiers an alias cannot carry safely: CSS imports and
 * paths that leave packages/editor/src. Everything else has an alias — `@/…`
 * for src, `@buildrik/shared/…` for packages/shared, `@server/…` for the
 * tRPC router types.
 *
 * Usage: node scripts/check-relative-imports.mjs [--update] [--list]
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const BASELINE_PATH = join(ROOT, "scripts", "baselines", "relative-imports.json");
const RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\bvi\.(?:mock|doMock|unmock|importActual|importMock)\(\s*|\brequire\(\s*)(["'])(\.\.\/\.\.\/[^"'\n]*)\1/g;

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) {
      if (n !== "node_modules") walk(p, out);
    } else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(SRC)) {
  for (const m of readFileSync(file, "utf8").matchAll(RE)) hits.push(`${relative(ROOT, file)}: ${m[2]}`);
}
const count = hits.length;

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE_PATH, JSON.stringify({ count }, null, 2) + "\n");
  console.log(`[relative-imports] baseline set to ${count}`);
  process.exit(0);
}
if (process.argv.includes("--list")) hits.forEach((h) => console.log(`  ${h}`));

const { count: baseline } = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
if (count > baseline) {
  console.error(`[relative-imports] FAIL — ${count} '../../' specifiers, baseline ${baseline}. Use a path alias (@/…, @buildrik/shared/…).`);
  console.error("  Run with --list to see them.");
  process.exit(1);
}
if (count < baseline) {
  console.log(`[relative-imports] ok — ${count} (baseline ${baseline}). Ratchet: node scripts/check-relative-imports.mjs --update`);
} else {
  console.log(`[relative-imports] ok — ${count} (baseline ${baseline})`);
}
