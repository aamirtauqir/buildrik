#!/usr/bin/env node
// packages/editor/scripts/vibcoder-variants.mjs
/**
 * Vibcoder variants discovery: prints variant + state modifier classes
 * defined by a vendored CSS file. Helps wrapper authors enumerate type
 * unions exhaustively without manual grep.
 *
 * Usage: bun packages/editor/scripts/vibcoder-variants.mjs <path/to/file.css>
 *   OR:  bun packages/editor/scripts/vibcoder-variants.mjs atoms/button
 *
 * Output groups modifiers by base class:
 *   bd-btn:
 *     variants: primary, secondary, ghost, danger, publish
 *     sizes: sm, md, lg
 *     states: busy
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const COMPONENTS = join(ROOT, "packages/editor/src/themes/components");

// Heuristic buckets. Modifier name pattern → group label.
const SIZE_TOKENS = new Set(["xs", "sm", "md", "lg", "xl", "2xl"]);
// State tokens — modifier names that semantically represent UI state (paired
// with aria-* by the wrapper) rather than visual variant. Phase 1 added
// `selectable` (Tag toggle), `pressed` (IconButton toggle), `pulse` (StatusDot).
const STATE_TOKENS = new Set(["busy", "loading", "active", "disabled", "hover", "focus", "selected", "checked", "indeterminate", "open", "closed", "expanded", "collapsed", "selectable", "pressed", "pulse"]);

export function classify(modifier) {
  if (SIZE_TOKENS.has(modifier)) return "sizes";
  if (STATE_TOKENS.has(modifier)) return "states";
  return "variants";
}

export function extract(css) {
  const found = new Map(); // base → { variants: Set, sizes: Set, states: Set }
  for (const m of css.matchAll(/^\s*\.bd-([a-z0-9_-]+?)--([a-z0-9_-]+)/gm)) {
    const base = `bd-${m[1]}`;
    const modifier = m[2];
    if (!found.has(base)) found.set(base, { variants: new Set(), sizes: new Set(), states: new Set() });
    found.get(base)[classify(modifier)].add(modifier);
  }
  return found;
}

function resolvePath(arg) {
  if (existsSync(arg)) return arg;
  const tierPath = join(COMPONENTS, `${arg}.css`);
  if (existsSync(tierPath)) return tierPath;
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: bun vibcoder-variants.mjs <path/to/file.css | tier/name>");
    process.exit(1);
  }
  const path = resolvePath(arg);
  if (!path) {
    console.error(`not found: ${arg}`);
    process.exit(1);
  }
  const found = extract(readFileSync(path, "utf8"));
  if (found.size === 0) {
    console.log("(no .bd-X--Y modifier classes found)");
    process.exit(0);
  }
  for (const [base, groups] of found) {
    console.log(`${base}:`);
    if (groups.variants.size) console.log(`  variants: ${[...groups.variants].sort().join(", ")}`);
    if (groups.sizes.size) console.log(`  sizes: ${[...groups.sizes].sort().join(", ")}`);
    if (groups.states.size) console.log(`  states: ${[...groups.states].sort().join(", ")}`);
  }
}
