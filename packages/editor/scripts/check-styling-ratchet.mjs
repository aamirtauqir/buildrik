#!/usr/bin/env node
/**
 * Styling-mechanism ratchet — one component system, enforced.
 *
 * The editor styles chrome five different ways: literal `style={{}}`, hoisted
 * `style={someConst}`, `tw:` utility classes, 30 hand-written CSS files, and
 * chrome-ui components. Changing how a panel looks means first working out
 * WHICH of the five owns it. That is the actual reason changes are slow — not
 * the token layer, which is one namespace (--bk-*, 166 tokens, 1 ghost).
 *
 * The target is chrome-ui components + `tw:` utilities. The other three are
 * being drained. This gate locks the count so a drain can never silently
 * reverse: the numbers may go DOWN or stay flat, never up.
 *
 * `tw:` classes and chrome-ui components are deliberately NOT counted — those
 * are the destination, and capping them would fight the migration.
 *
 * Baseline lives in scripts/.styling-baseline.json. Lower it when you drain;
 * never raise it. Raising it is the thing this file exists to prevent.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "src", "editor");
const BASELINE_PATH = join(HERE, ".styling-baseline.json");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== "__tests__") walk(p, out);
    } else out.push(p);
  }
  return out;
}

function measure() {
  let inline_literal = 0;
  let inline_hoisted = 0;
  let css_lines = 0;
  const worst = [];
  for (const p of walk(SRC)) {
    if (p.endsWith(".tsx")) {
      const s = readFileSync(p, "utf8");
      const lit = (s.match(/style=\{\{/g) || []).length;
      // `style={foo}` / `style={styles.bar}` — the hoisted CSSProperties
      // pattern. Excludes `style={{` by requiring a non-brace first char.
      const hoi = (s.match(/style=\{[a-zA-Z_$][^{]/g) || []).length;
      inline_literal += lit;
      inline_hoisted += hoi;
      if (lit + hoi > 0) worst.push([lit + hoi, p.slice(p.indexOf("/src/") + 1)]);
    } else if (p.endsWith(".css")) {
      css_lines += readFileSync(p, "utf8").split("\n").length;
    }
  }
  worst.sort((a, b) => b[0] - a[0]);
  return { inline_literal, inline_hoisted, css_lines, worst };
}

const now = measure();
const base = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));

if (process.argv.includes("--update")) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      { inline_literal: now.inline_literal, inline_hoisted: now.inline_hoisted, css_lines: now.css_lines },
      null,
      2,
    ) + "\n",
  );
  console.log("[styling-ratchet] baseline updated:", now.inline_literal, now.inline_hoisted, now.css_lines);
  process.exit(0);
}

if (process.argv.includes("--top")) {
  console.log("Heaviest remaining files (literal + hoisted inline styles):");
  for (const [n, p] of now.worst.slice(0, 30)) console.log(`  ${String(n).padStart(3)}  ${p}`);
  process.exit(0);
}

let failed = false;
for (const key of ["inline_literal", "inline_hoisted", "css_lines"]) {
  const delta = now[key] - base[key];
  const label = key.padEnd(15);
  if (delta > 0) {
    console.error(`[styling-ratchet] FAIL ${label} ${now[key]} > baseline ${base[key]} (+${delta})`);
    failed = true;
  } else {
    console.log(`[styling-ratchet] ok   ${label} ${now[key]} (baseline ${base[key]}${delta < 0 ? `, drained ${-delta}` : ""})`);
  }
}

if (failed) {
  console.error("");
  console.error("New inline styles or CSS lines were added to editor chrome.");
  console.error("Target is a chrome-ui component styled with `tw:` utilities.");
  console.error("Genuinely computed values (drag position, measured size) are the");
  console.error("one exception CLAUDE.md allows — put those in a canvas overlay.");
  console.error("See `node scripts/check-styling-ratchet.mjs --top` for the worst files.");
  process.exit(1);
}
console.log("[styling-ratchet] PASS — one-component-system drain holding");
