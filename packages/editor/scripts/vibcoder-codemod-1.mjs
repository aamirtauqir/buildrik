#!/usr/bin/env node
// packages/editor/scripts/vibcoder-codemod-1.mjs
/**
 * Vibcoder codemod 1: rename bdr-* → bd-* across class defs, attribute selectors,
 * @keyframes names, and animation-name properties.
 *
 * Runs over packages/editor/src/themes/components/**\/*.css.
 * Idempotent: running twice produces the same output as running once.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const TARGET = join(ROOT, "packages/editor/src/themes/components");

export function transform(css) {
  let out = css;
  // 1. Class selectors and BEM parts: .bdr-foo, .bdr-foo__bar, .bdr-foo--var
  //    Note: also rewrites .bdr-* inside string literals (e.g., content: ".bdr-x").
  //    Acceptable — vibcoder bundle doesn't use such literals (verified 2026-04-26).
  out = out.replace(/\.bdr-([a-z0-9_-]+)/g, ".bd-$1");
  // 2. Attribute selectors: [class*="bdr-foo"]
  //    Quoted values only. Unquoted [class=bdr-foo] are valid CSS but rare and
  //    out of scope; vibcoder bundle uses quoted form everywhere (verified 2026-04-26).
  out = out.replace(/(\[class[*~|^$]?=["'])bdr-/g, "$1bd-");
  // 3. @keyframes definitions
  out = out.replace(/@keyframes\s+bdr-([a-z0-9_-]+)/g, "@keyframes bd-$1");
  // 4. animation-name property values
  out = out.replace(/(animation-name\s*:\s*)bdr-/g, "$1bd-");
  // 5. Shorthand animation: handles single OR multiple bdr-* names per declaration.
  //    `animation: bdr-foo, bdr-bar;` rewrites BOTH (lazy quantifier in earlier
  //    revision missed the second). Captures the full `animation: ...;` value
  //    (greedy up to ;) then runs an inner replace over the body.
  out = out.replace(/(animation\s*:[^;]*)/g, (m) => m.replace(/\bbdr-([a-z0-9_-]+)/g, "bd-$1"));
  return out;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".css")) out.push(p);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = walk(TARGET);
  let touched = 0;
  for (const f of files) {
    const before = readFileSync(f, "utf8");
    const after = transform(before);
    if (after !== before) { writeFileSync(f, after); touched++; }
  }
  console.log(`codemod 1: ${touched}/${files.length} files rewritten`);
}
