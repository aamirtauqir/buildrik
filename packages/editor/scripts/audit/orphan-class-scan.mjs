#!/usr/bin/env node
/**
 * The mirror of dead-css-scan: class names chrome JSX APPLIES that no CSS rule
 * anywhere DEFINES.
 *
 * Written after `bd-chain-btn` was found. Two inspector sections rendered a
 * token-link button with `className="bd-chain-btn"` and an inline
 * `opacity: 0`, commented "revealed by parent row :hover via CSS". No rule for
 * that class has ever existed here — and an inline style could not be
 * overridden by one anyway — so four token-binding buttons were permanently
 * invisible while every test stayed green.
 *
 * NOT a delete list, in either direction:
 *  - An orphan class is usually harmless. Plenty are query hooks for tests and
 *    e2e selectors, or leftover naming after a surface moved to `tw:`
 *    utilities. Those cost nothing but a misleading name.
 *  - It is a BUG only when the JSX RELIES on the missing rule to do something —
 *    reveal on hover, position, size. The tell is an inline style that hides or
 *    collapses the element next to the orphan class. Grep the hits for
 *    `opacity: 0`, `display: "none"`, `visibility: "hidden"` first; that is
 *    where the real defects are. (At the time of writing, the only other hits
 *    were a visually-hidden aria-live region and hidden file inputs — both
 *    deliberate.)
 *
 * Exclusions, each structural:
 *  - blocks/, templates/, engine/ — these EMIT class names into the customer's
 *    published HTML (`class="buildrick-slider"`). Anything they emit is
 *    treated as defined, since our CSS may legitimately style it and their
 *    markup is not chrome.
 *  - anything containing `:` — Tailwind utilities and variants; those are
 *    resolved by the Tailwind build, not by a rule in src/**.css.
 *  - __tests__ — a test may assert on a class it also invents.
 *
 * Template-literal interpolations are stripped, not guessed: `bd-ai-msg-${role}`
 * reports as the literal prefix `bd-ai-msg-`, which is a hint to look, not a
 * finding.
 *
 * Usage: node scripts/audit/orphan-class-scan.mjs
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim().split("\n").filter(Boolean);

const sources = git("ls-files", "src/**/*.tsx", "src/**/*.ts");
const stylesheets = git("ls-files", "src/**/*.css");
const EMITTERS = /^src\/(blocks|templates|engine)\//;

const defined = new Set();
for (const file of stylesheets) {
  for (const m of readFileSync(file, "utf8").matchAll(/\.([A-Za-z_][-\w]*)/g)) defined.add(m[1]);
}
for (const file of sources.filter((p) => EMITTERS.test(p))) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) defined.add(c);
  for (const m of text.matchAll(/className:\s*["'`]([^"'`]+)/g)) for (const c of m[1].split(/\s+/)) defined.add(c);
}

const orphans = new Map();
for (const file of sources.filter((p) => !EMITTERS.test(p) && !/__tests__/.test(p))) {
  for (const m of readFileSync(file, "utf8").matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const raw = (m[1] ?? m[2] ?? "").replace(/\$\{[^}]*\}/g, " ");
    for (const cls of raw.split(/\s+/).filter(Boolean)) {
      if (cls.includes(":") || defined.has(cls)) continue;
      if (!orphans.has(cls)) orphans.set(cls, new Set());
      orphans.get(cls).add(file);
    }
  }
}

const rows = [...orphans].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
console.log(`${rows.length} class name(s) applied by chrome with no CSS rule defining them.`);
console.log("Look for an inline style that hides the element — that is the bug shape.\n");
for (const [cls, files] of rows) {
  console.log(`${String(files.size).padStart(3)}  ${cls}\n     ${[...files].join("\n     ")}`);
}
