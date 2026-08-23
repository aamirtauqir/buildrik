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

/*
  A grandfathered violation is identified by WHAT it is, not by where it sits.

  The key used to be `path:line:message`, and the message embeds line numbers
  too ("defined in 2 files: Canvas.css:533, a11y.css:60"). So editing anything
  ABOVE a grandfathered violation moved it and the gate reported the very same
  duplicate as a brand-new one — while also reporting the baseline entry as
  "removed". This is not hypothetical: `.bd-depth-badge` in Canvas.css drifted
  533 -> 556 -> 569 across two arcs, and the gate sat red the whole time on a
  duplicate that was deliberately grandfathered (CLAUDE.md names it as one of
  the four real concerns: a11y.css is the only file allowed @media (prefers-*),
  so the second definition is intentional).

  Stripping :NNN from both halves makes the key positional-insensitive. A
  genuinely new duplicate — a different selector, or the same selector in a
  different FILE — still changes the key and still fails the gate.
*/
const stripLines = (s) => String(s).replace(/:\d+\b/g, "");
function key(v) { return `${v.path}:${stripLines(v.message)}`; }

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
