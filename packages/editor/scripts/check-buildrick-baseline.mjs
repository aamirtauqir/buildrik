#!/usr/bin/env node
/**
 * Vibcoder-finish CI gate.
 * Counts .buildrick-* className refs in src/editor/.
 * WARN mode: blocks regressions, auto-ratchets baseline on shrink.
 * ERROR mode: zero-tolerance — any ref fails the build.
 * Per-panel locks: every panel locked at current count; any growth fails.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const ROOT = process.cwd();
const BASELINE = resolve(ROOT, 'scripts', 'baselines', 'buildrick.json');
const EDITOR_ROOT = resolve(ROOT, 'src', 'editor');
// Match JSX className refs only — exclude --buildrick-* CSS tokens (canonical, MUST stay)
// and data-buildrick-* DOM attrs (engine hooks, MUST stay). Negative-lookbehind blocks
// any preceding `-` (catches `--buildrick`, `data-buildrick`) or alpha char (identifier-internal).
const CLASS_RE = /(?<![-a-zA-Z])buildrick-[a-z][a-z0-9-]*\b/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|ts)$/.test(entry) && !/\.d\.ts$/.test(entry)) yield full;
  }
}

function countMatches(file) {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(CLASS_RE)].length;
}

function panelOf(file) {
  const rel = relative(EDITOR_ROOT, file);
  return rel.split(sep)[0];
}

function scan() {
  let total = 0;
  const perPanel = {};
  try {
    for (const f of walk(EDITOR_ROOT)) {
      const n = countMatches(f);
      if (!n) continue;
      total += n;
      const p = panelOf(f);
      perPanel[p] = (perPanel[p] ?? 0) + n;
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return { total, perPanel };
}

function fail(msg) {
  console.error(`[buildrick gate] FAIL — ${msg}`);
  process.exit(1);
}
function pass(msg) {
  if (msg) console.log(`[buildrick gate] ${msg}`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const { total, perPanel } = scan();

if (baseline.mode === 'ERROR') {
  if (total > 0) fail(`Zero-tolerance violation: ${total} legacy refs found, expected 0`);
  pass('ERROR mode, count: 0. PASS.');
}

if (total > baseline.count) {
  fail(`Baseline regression: was ${baseline.count}, now ${total} (+${total - baseline.count}). Drain or remove.`);
}

// Per-panel growth lock — Phase Final 2026-05-07: ANY panel exceeding its
// locked count fails the gate, regardless of whether the lock is 0 or non-zero.
// This delivers ERROR-on-increase semantics per panel without flipping mode to
// literal ERROR (which would require count: 0 — unreachable post-audit).
for (const [panel, lockCount] of Object.entries(baseline.perPanel ?? {})) {
  const currentInPanel = perPanel[panel] ?? 0;
  if (currentInPanel > lockCount) {
    fail(`Panel ${panel} exceeds locked count: was ${lockCount}, now ${currentInPanel}`);
  }
}

if (total < baseline.count) {
  // Preserve baseline locks (zero entries) that don't appear in live scan
  // (zero-count panels are absent from `perPanel` because zero-count files don't increment).
  const mergedPerPanel = { ...(baseline.perPanel ?? {}), ...perPanel };
  const updated = { ...baseline, count: total, perPanel: mergedPerPanel };
  writeFileSync(BASELINE, JSON.stringify(updated, null, 2) + '\n');
  pass(`count: ${baseline.count} → ${total} (-${baseline.count - total}). Baseline updated.`);
}

pass(`count: ${total} (baseline ${baseline.count}). OK.`);
