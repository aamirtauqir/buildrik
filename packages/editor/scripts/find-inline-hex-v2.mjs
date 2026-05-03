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
 * Flags (v2, 2026-04-25 Week 3 additions):
 *   --editor-only       scope to editor/** excluding editor/inspector/**
 *                       uses .hex-baseline-editor file
 *   --exclude-fallback  skip hex in var(--X, #HEX) fallback position
 *
 * @license BSD-3-Clause
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(EDITOR_ROOT, "../..");

const argv = process.argv.slice(2);
const EDITOR_ONLY = argv.includes("--editor-only");
const EXCLUDE_FALLBACK = argv.includes("--exclude-fallback");

const BASELINE_FILE = EDITOR_ONLY
  ? path.join(__dirname, ".hex-baseline-editor")
  : path.join(__dirname, ".hex-baseline");

const FULL_CHROME_ROOTS = [
  "src/editor",
  "src/shared/ui",
  "src/shared/forms",
  "src/ai",
];
const EDITOR_ONLY_ROOTS = ["src/editor"];
const EDITOR_EXCLUDE_DIRS = ["inspector"]; // mid-flight port; re-include later

const CHROME_ROOTS = EDITOR_ONLY ? EDITOR_ONLY_ROOTS : FULL_CHROME_ROOTS;
const EXTRA_FILES = EDITOR_ONLY
  ? []
  : ["src/themes/components.css", "src/themes/ux-fixes.css"];

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
// Match hex inside var(--name, #HEX) fallback position.
// Captures the hex so we can compare per match.
const FALLBACK_HEX_RE = /var\(\s*--[a-z0-9-]+\s*,\s*(#[0-9A-Fa-f]{3,8})\b/gi;
const POLICY_RE = /@lint-hex-policy:/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      if (EDITOR_ONLY && EDITOR_EXCLUDE_DIRS.includes(e.name)) continue;
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
    // When --exclude-fallback is active, skip hex values that appear
    // only as var(--X, #HEX) fallback. Those aren't drift; they're
    // defensive defaults that never render once canonical resolves.
    const fallbackHexes = new Set();
    if (EXCLUDE_FALLBACK) {
      const re = new RegExp(FALLBACK_HEX_RE.source, FALLBACK_HEX_RE.flags);
      let m;
      while ((m = re.exec(line)) !== null) {
        fallbackHexes.add(m[1].toUpperCase());
      }
    }
    for (const hex of matches) {
      if (!/[:=]/.test(line)) continue;
      if (EXCLUDE_FALLBACK && fallbackHexes.has(hex.toUpperCase())) continue;
      sites.push({ file, line: i + 1, hex: hex.toUpperCase(), snippet: line.trim() });
    }
  }
  return sites;
}

const args = process.argv.slice(2);
const mode = args.includes("--fail") ? "FAIL"
  : args.includes("--json") ? "JSON"
  : args.includes("--group-by-value") ? "GROUP"
  : args.includes("--count") ? "COUNT"
  : "LIST";
const outIdx = args.indexOf("--out");
const OUT_PATH = outIdx >= 0 ? args[outIdx + 1] : null;

const allSites = [];
for (const f of collectFiles()) {
  allSites.push(...scanFile(f));
}

const count = allSites.length;

if (mode === "COUNT") {
  console.log(count);
  process.exit(0);
}

if (mode === "JSON") {
  const payload = allSites.map((s) => ({
    file: path.relative(REPO_ROOT, s.file),
    line: s.line,
    hex: s.hex,
    snippet: s.snippet,
  }));
  const json = JSON.stringify(payload, null, 2);
  if (OUT_PATH) {
    fs.writeFileSync(OUT_PATH, json);
    console.log(`Wrote ${count} sites to ${OUT_PATH}`);
  } else {
    console.log(json);
  }
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
