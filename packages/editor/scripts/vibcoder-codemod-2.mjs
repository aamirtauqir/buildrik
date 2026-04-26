#!/usr/bin/env node
// packages/editor/scripts/vibcoder-codemod-2.mjs
/**
 * Vibcoder codemod 2: fold vibcoder token names into Buildrik canonical names.
 * See design.md Section 3 for the complete fold table.
 *
 * Idempotent.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const TARGET = join(ROOT, "packages/editor/src/themes/components");

// Vibcoder-name → Buildrik-canonical-name. Extend per token-fold spec table.
export const TOKEN_FOLDS = {
  "--buildrick-color-bg-panel": "--buildrick-bg-panel",
  "--buildrick-color-bg-card": "--buildrick-bg-card",
  "--buildrick-color-bg-subtle": "--buildrick-bg-subtle",
  "--buildrick-color-bg-hover": "--buildrick-bg-hover",
  "--buildrick-color-fg-primary": "--buildrick-fg-primary",
  "--buildrick-color-fg-secondary": "--buildrick-fg-secondary",
  "--buildrick-color-fg-muted": "--buildrick-fg-muted",
  "--buildrick-color-border": "--buildrick-border",
  "--buildrick-color-accent": "--buildrick-accent",
  "--buildrick-color-accent-hover": "--buildrick-accent-hover",
  "--buildrick-color-accent-tint": "--buildrick-accent-tint",
  // Extend with full spec table during Phase 1 codemod tuning.
};

export function transform(css) {
  let out = css;
  for (const [from, to] of Object.entries(TOKEN_FOLDS)) {
    // Use lookahead to avoid double-fold on already-canonical names
    const re = new RegExp(from.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "(?![a-z0-9-])", "g");
    out = out.replace(re, to);
  }
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
  console.log(`codemod 2: ${touched}/${files.length} files rewritten`);
}
