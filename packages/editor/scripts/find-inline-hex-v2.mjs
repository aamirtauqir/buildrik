#!/usr/bin/env node
/**
 * Hex gate V2 — scans chrome .css/.ts/.tsx for inline hex values.
 *
 * Improvements over v1 (find-inline-hex.mjs):
 *   - Scans .css in addition to .ts/.tsx
 *   - Per-site @lint-hex-policy: marker, not whole-file bypass
 *   - Matches any hex in a property value (not just 11 specific props)
 *   - Outputs count / list / group-by-value
 *   - Exits 1 if count exceeds .hex-baseline (WARN mode)
 *   - Run with `--fail` to exit 1 if count > 0 (FAIL mode, Phase 8)
 *
 * @license BSD-3-Clause
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(EDITOR_ROOT, "../..");
const BASELINE_FILE = path.join(__dirname, ".hex-baseline");

const CHROME_ROOTS = [
  "src/editor",
  "src/shared/ui",
  "src/shared/forms",
  "src/ai",
  "src/features/design-system/ui",
];
const EXTRA_FILES = [
  "src/themes/components.css",
  "src/themes/ux-fixes.css",
];

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const POLICY_RE = /@lint-hex-policy:/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(css|ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const rel of CHROME_ROOTS) {
    files.push(...walk(path.join(EDITOR_ROOT, rel)));
  }
  for (const rel of EXTRA_FILES) {
    const p = path.join(EDITOR_ROOT, rel);
    if (fs.existsSync(p)) files.push(p);
  }
  return files;
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const sites = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (POLICY_RE.test(line)) continue;
    const prev = i > 0 ? lines[i - 1] : "";
    if (POLICY_RE.test(prev)) continue;
    const matches = line.match(HEX_RE);
    if (!matches) continue;
    for (const hex of matches) {
      if (!/[:=]/.test(line)) continue;
      sites.push({ file, line: i + 1, hex: hex.toUpperCase(), snippet: line.trim() });
    }
  }
  return sites;
}

const args = process.argv.slice(2);
const mode = args.includes("--fail") ? "FAIL"
  : args.includes("--group-by-value") ? "GROUP"
  : args.includes("--count") ? "COUNT"
  : "LIST";

const allSites = [];
for (const f of collectFiles()) {
  allSites.push(...scanFile(f));
}

const count = allSites.length;

if (mode === "COUNT") {
  console.log(count);
  process.exit(0);
}

if (mode === "GROUP") {
  const byValue = new Map();
  for (const s of allSites) {
    if (!byValue.has(s.hex)) byValue.set(s.hex, 0);
    byValue.set(s.hex, byValue.get(s.hex) + 1);
  }
  const ranked = [...byValue.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex, n] of ranked) {
    console.log(`${hex.padEnd(10)} ${String(n).padStart(4)}`);
  }
  console.log(`\nUnique: ${byValue.size}  Total: ${count}`);
  process.exit(0);
}

if (mode === "LIST") {
  for (const s of allSites) {
    const rel = path.relative(REPO_ROOT, s.file);
    console.log(`${rel}:${s.line}: ${s.hex}`);
  }
}

if (mode === "FAIL") {
  if (count === 0) {
    console.log("Hex gate: 0 violations. OK.");
    process.exit(0);
  }
  console.error(`Hex gate FAIL: ${count} inline hex sites in chrome.`);
  console.error("Run with no args to see the list.");
  process.exit(1);
}

// Default: LIST mode also does baseline comparison
if (!fs.existsSync(BASELINE_FILE)) {
  fs.writeFileSync(BASELINE_FILE, String(count));
  console.log(`\nBaseline written: ${count}`);
  process.exit(0);
}

const baseline = Number(fs.readFileSync(BASELINE_FILE, "utf8").trim());
console.log(`\nCurrent: ${count}  Baseline: ${baseline}`);

if (count > baseline) {
  console.error(`REGRESSION: hex count rose ${baseline} → ${count}`);
  process.exit(1);
}

if (count < baseline) {
  console.log(`Progress: ${baseline - count} sites removed.`);
}
process.exit(0);
