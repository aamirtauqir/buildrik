#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BASELINE = resolve(ROOT, 'scripts/baselines/ssot.json');
const SCANNER = resolve(ROOT, 'scripts/audit/ssot-scan.mjs');

const ERROR_MODE_CATEGORIES = new Set([
  'componentDuplicates',
  'keyframeDuplicates',
  'tokenAliasSSOT',
]);

/*
  All eight categories, not `--category=1,2,3,4`.

  Categories 5-8 (homeContractViolations, antiPatterns, legacyResiduals,
  docDrift) had never run in CI. The one that matters is 6 — the dead-export
  check. It works: planting `export const PROBE = 42` that nobody imports made
  the scanner report it and this gate still printed "[ok] DS SSOT gate green",
  because the gate never asked for category 6. Every unreachable affordance
  found by hand in the 2026-08-16 sweep — a header button that never rendered,
  a canvas gear with no consumer, a template retry for a failure that cannot
  happen — sat in a category CI did not run.
*/
let scannerOut;
try {
  scannerOut = execFileSync('node', [SCANNER, '--json', '--category=1,2,3,4,5,6,7,8'], {
    cwd: ROOT, encoding: 'utf8',
  });
} catch (e) {
  // Scanner exits 1 when violations exist; capture stdout from the error.
  scannerOut = e.stdout?.toString() ?? '';
  if (!scannerOut) {
    console.error('[ds-ssot gate] scanner failed without stdout:', e.stderr?.toString() ?? e.message);
    process.exit(2);
  }
}

const live = JSON.parse(scannerOut);
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));

function key(v) { return `${v.path}:${v.line}:${v.message}`; }

let failed = false;
const updatedBaseline = [];
for (const liveCat of live) {
  const baseCat = baseline.find((b) => b.category === liveCat.category) ?? { category: liveCat.category, violations: [] };
  const baseKeys = new Set(baseCat.violations.map(key));
  const liveKeys = new Set(liveCat.violations.map(key));

  const additions = liveCat.violations.filter((v) => !baseKeys.has(key(v)));
  const removals = baseCat.violations.filter((v) => !liveKeys.has(key(v)));

  if (additions.length > 0) {
    failed = true;
    console.error(`\n[FAIL] ${liveCat.category}: ${additions.length} new violation(s):`);
    for (const v of additions) console.error(`  - ${v.path}:${v.line} — ${v.message}`);
  }
  if (removals.length > 0) {
    console.log(`[ratchet] ${liveCat.category}: ${removals.length} violation(s) removed`);
  }
  if (ERROR_MODE_CATEGORIES.has(liveCat.category) && liveCat.violations.length > 0) {
    failed = true;
    console.error(`\n[FAIL] ${liveCat.category} is locked at zero — found ${liveCat.violations.length} violation(s):`);
    for (const v of liveCat.violations) console.error(`  - ${v.path}:${v.line} — ${v.message}`);
  }
  updatedBaseline.push({ category: liveCat.category, violations: liveCat.violations });
}

if (!failed) {
  writeFileSync(BASELINE, JSON.stringify(updatedBaseline, null, 2) + '\n');
  console.log('\n[ok] DS SSOT gate green');
  process.exit(0);
} else {
  console.error('\nFix new violations or grandfather only with explicit reason in commit message.');
  process.exit(1);
}
