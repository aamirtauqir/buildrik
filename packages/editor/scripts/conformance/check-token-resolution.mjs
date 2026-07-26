#!/usr/bin/env node
/**
 * Conformance Phase 0 rule 1 (docs/designs/2026-07-26-editor-conformance-plan.md):
 * every `var(--token)` referenced anywhere in src/ must have a definition
 * somewhere in src/ CSS (or an inline fallback). Undefined CSS vars fail
 * silently in the browser — this single class of bug produced three of the
 * six defects found the week of 2026-07-20 (--buildrick-surface-2/-3
 * referenced 36× across 14 files, defined nowhere).
 *
 * ERROR: var(--x) with no definition and no fallback  → exit 1
 * WARN : var(--x) with no definition but a fallback   → report only
 * SKIP : dynamic refs (var(--${...})) — statically unresolvable, counted.
 *
 * Definitions recognized:
 *  - `--x: value` declarations in any .css file under src/ and demo/
 *  - `--x: value` inside TS/TSX template literals / style objects ("--x": v)
 *  - setProperty("--x", ...) calls in TS/TSX
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "demo"];
const EXCLUDED_DIRS = new Set(["__tests__", "node_modules", "test-stubs", ".playwright-mcp"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry)) continue;
      walk(full, out);
    } else if (/\.(css|ts|tsx|html)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(resolve(ROOT, d)));

const defined = new Set();
const refs = new Map(); // name -> [{file, line, hasFallback}]
let dynamicRefs = 0;

const DEF_RE = /(?:^|[{;\s"'`])(--[a-zA-Z0-9-]+)\s*:/g;
const SET_PROP_RE = /setProperty\(\s*["'`](--[a-zA-Z0-9-]+)["'`]/g;
const REF_RE = /var\(\s*(--[a-zA-Z0-9-]+)\s*(,)?/g;
const DYNAMIC_REF_RE = /var\(\s*--[a-zA-Z0-9-]*\$\{/g;

// Comments mention tokens by example (`var(--bd-*)` in docstrings) — strip
// /* … */ blocks and whole-line //-and-* doc lines before scanning refs.
// Line structure is preserved (blanked, not removed) so line numbers hold.
function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split("\n")
    .map((l) => (/^\s*(\/\/|\*)/.test(l) ? "" : l))
    .join("\n");
}

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  for (const m of content.matchAll(DEF_RE)) defined.add(m[1]);
  for (const m of content.matchAll(SET_PROP_RE)) defined.add(m[1]);

  const scannable = stripComments(content);
  dynamicRefs += [...scannable.matchAll(DYNAMIC_REF_RE)].length;

  const lines = scannable.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(REF_RE)) {
      // `var(--prefix-${id})` — the capture is a truncated prefix, not a token;
      // DYNAMIC_REF_RE already counts these.
      if (lines[i].slice(m.index + m[0].length).startsWith("$")) continue;
      const name = m[1];
      if (!refs.has(name)) refs.set(name, []);
      refs.get(name).push({ file: rel, line: i + 1, hasFallback: m[2] === "," });
    }
  }
}

const errors = [];
const warns = [];
for (const [name, sites] of refs) {
  if (defined.has(name)) continue;
  for (const site of sites) {
    (site.hasFallback ? warns : errors).push({ name, ...site });
  }
}

const byToken = (list) => {
  const g = new Map();
  for (const v of list) {
    if (!g.has(v.name)) g.set(v.name, []);
    g.get(v.name).push(`${v.file}:${v.line}`);
  }
  return g;
};

if (warns.length) {
  console.log(`[token-resolution] WARN — ${warns.length} ref(s) undefined but carrying a fallback:`);
  for (const [name, sites] of byToken(warns)) {
    console.log(`  ${name}  (${sites.length}×)  e.g. ${sites[0]}`);
  }
}
if (dynamicRefs) {
  console.log(`[token-resolution] ${dynamicRefs} dynamic var(--\${…}) ref(s) skipped (statically unresolvable)`);
}

if (errors.length) {
  console.error(`\n[token-resolution] FAIL — ${errors.length} ref(s) to undefined tokens with NO fallback:`);
  for (const [name, sites] of byToken(errors)) {
    console.error(`  ${name}`);
    for (const s of sites) console.error(`    - ${s}`);
  }
  process.exit(1);
}

console.log(
  `[token-resolution] PASS — ${refs.size} distinct tokens referenced, all resolve (${defined.size} defined, ${warns.length} fallback-only warns)`,
);
