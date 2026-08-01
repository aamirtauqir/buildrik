#!/usr/bin/env node
/**
 * Gate: the old component library may only shrink.
 *
 * Counts files importing the legacy libraries (editor/shared/vibcoder,
 * shared/extensions, shared/ui). The number is locked at the baseline and may
 * only go DOWN. A new import fails the build.
 *
 * This is what lets a 352-file migration run without freezing feature work:
 * nobody has to stop shipping, but nobody can add to the pile either. When the
 * count reaches 0, delete the old libraries and this gate with them.
 *
 * Auto-ratchets on shrink, like scripts/check-buildrick-baseline.mjs.
 *
 * @license BSD-3-Clause
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SRC = join(ROOT, "src");
const BASELINE = join(HERE, "baselines", "vibcoder-ratchet.json");

const LEGACY_IMPORT = /from\s+["'][^"']*(?:editor\/shared\/vibcoder|shared\/extensions|shared\/ui)(?:\/[^"']*)?["']/;

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !/\.d\.ts$/.test(p)) files.push(p);
  }
})(SRC);

const consumers = files.filter((f) => {
  if (f.includes("/shared/vibcoder/") || f.includes("/shared/extensions/") || f.includes("/shared/ui/")) return false;
  return LEGACY_IMPORT.test(readFileSync(f, "utf8"));
});

const count = consumers.length;
const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));

if (count > baseline.count) {
  const known = new Set(baseline.files ?? []);
  const added = consumers.map((f) => relative(ROOT, f)).filter((f) => !known.has(f));
  console.error(
    `[vibcoder-ratchet] FAIL — legacy component imports grew: ${baseline.count} → ${count} (+${count - baseline.count}).`,
  );
  console.error("  The old library is being migrated away from. Import from flowbite-react or @/editor/chrome-ui instead.");
  for (const f of added.slice(0, 15)) console.error(`    new: ${f}`);
  process.exit(1);
}

if (count < baseline.count) {
  writeFileSync(
    BASELINE,
    JSON.stringify({ ...baseline, count, files: consumers.map((f) => relative(ROOT, f)).sort() }, null, 2) + "\n",
  );
  console.log(
    `[vibcoder-ratchet] PASS — ${baseline.count} → ${count} (-${baseline.count - count}). Baseline ratcheted down.`,
  );
  process.exit(0);
}

console.log(`[vibcoder-ratchet] PASS — ${count} files still on the old library (baseline ${baseline.count}).`);
