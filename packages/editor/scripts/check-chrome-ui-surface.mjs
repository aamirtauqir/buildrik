#!/usr/bin/env node
/**
 * Gate: chrome-ui/ is the single public chrome surface for flowbite-react
 * (chrome-ui-single-surface spec §3, docs/plans/2026-07-31-chrome-ui-single-surface.md).
 *
 * Three checks:
 *
 *  1. NO_DIRECT_IMPORT (WARN MODE — see banner below) — no specifier matching
 *     `^flowbite-react(/.*)?$` anywhere under packages/editor/src outside
 *     chrome-ui/, subpaths and `import("flowbite-react")` included. 249
 *     pre-existing violations are grandfathered until the B3 sweep task
 *     re-points them — this check currently only REPORTS the count, it does
 *     not fail the build. Flip `MODE` below to `"error"` in the B3 dispatch's
 *     final commit, once the count reaches 0.
 *
 *  2. BARREL_PURITY (error, from day one) — every line in chrome-ui/index.ts
 *     that references a `flowbite-react` specifier must be
 *     `export { X } from "flowbite-react...";` re-export syntax, never a
 *     component definition. This is exactly how the deleted in-house
 *     component library (`shared/vibcoder`, `editor/ui`) originally grew:
 *     someone adds `export const Button = (p) => <FlowbiteButton size="sm"
 *     {...p} />` straight into the barrel and the fork restarts.
 *
 *  3. CLOSED_WRAPPER_SET (error, from day one) — exactly the wrapper files
 *     named in WRAPPER_FILES below may exist. Detected by the same
 *     structural tell every wrapper in this codebase shares: a chrome-ui/
 *     file that imports a flowbite-react component under a renamed
 *     `X as FlowbiteX` alias (grep confirms this pattern is unique to
 *     TextInput.tsx/Select.tsx today — none of chrome-ui's other 45
 *     components, which also compose flowbite-react freely, use it) AND
 *     calls `mergeTheme(` to compose a default theme with a caller's. A
 *     third file matching both signals fails the gate until WRAPPER_FILES is
 *     deliberately amended in the same commit — that amendment is the review
 *     checkpoint the spec calls for.
 *
 * grep, not rg: every other gate in scripts/ uses plain POSIX grep because
 * GitHub's ubuntu-latest CI runner does not ship ripgrep — an `rg`-based gate
 * would exit 127 ("command not found") on every CI run
 * (see scripts/check-editor-ui-gone.mjs's header for the same note).
 *
 * No pattern-allowlist file is read here. Two silent-pass bugs already hit
 * this arc from exactly that shape — a blank line and a bare `#` line in a
 * `grep -F -f <allowlist-file>` pattern file, either of which matches every
 * line unconditionally (docs/plans/2026-07-31-flowbite-bigbang-outcome.md).
 * Every pattern below is a literal, non-empty regex written directly into
 * this script, not read from an external file.
 *
 * @license BSD-3-Clause
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── MODE ────────────────────────────────────────────────────────────────
// "warn"  — check 1 (NO_DIRECT_IMPORT) reports its count but always exits 0.
// "error" — check 1 fails the build if the count is not exactly 0.
// Checks 2 and 3 are ALWAYS enforced as errors, in both modes — there is no
// pre-existing backlog for them to grandfather.
const MODE = "warn";

const HERE = dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = resolve(HERE, "..");
const SRC = resolve(EDITOR_ROOT, "src");
const CHROME_UI_DIR = resolve(SRC, "editor/chrome-ui");
const BARREL = resolve(CHROME_UI_DIR, "index.ts");

/** The closed wrapper set (spec §3, guard #3). Amend here AND in
 *  chrome-ui/index.ts's "(b)" section in the same commit if this ever needs
 *  to grow — that amendment is the review checkpoint. */
const WRAPPER_FILES = new Set(["TextInput.tsx", "Select.tsx"]);

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

/** Non-empty, non-blank literal patterns only — see header note. */
function assertRealPattern(pattern) {
  if (!pattern || pattern.trim().length < 4) {
    throw new Error(`[chrome-ui-surface] refusing to run with a blank/short grep pattern: ${JSON.stringify(pattern)}`);
  }
}

/**
 * Runs `grep -rlE <pattern> <dir>` and returns the matching file list.
 * grep's exit-code convention: 0 = matches found, 1 = no matches (the normal
 * "clean" case, NOT an error), 2+ = a real failure (bad pattern, missing
 * binary). Only status 1 is swallowed — anything else aborts the gate loudly
 * rather than silently reporting zero violations (the same "configured never
 * to fail" shape flagged in check-editor-ui-gone.mjs).
 */
function grepFiles(pattern, dir, extraArgs = []) {
  assertRealPattern(pattern);
  try {
    const out = execFileSync("grep", ["-rlE", ...extraArgs, pattern, dir], { encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  } catch (e) {
    if (e.status === 1) return [];
    console.error(`[chrome-ui-surface] FAIL — could not run grep (exit ${e.status}): ${e.stderr || e.message}`);
    process.exit(1);
  }
}

// ── Check 1: NO_DIRECT_IMPORT ──────────────────────────────────────────────
// Matches `from "flowbite-react"`, `from "flowbite-react/types"`, etc. (both
// quote styles) and `import("flowbite-react...")`, excluding chrome-ui/
// itself (which is the one directory allowed to talk to flowbite-react
// directly).
const STATIC_IMPORT_PATTERN = String.raw`from[[:space:]]+['"]flowbite-react(/[^'"]*)?['"]`;
const DYNAMIC_IMPORT_PATTERN = String.raw`import\([[:space:]]*['"]flowbite-react(/[^'"]*)?['"]`;

const staticHits = grepFiles(STATIC_IMPORT_PATTERN, SRC, [
  "--include=*.ts",
  "--include=*.tsx",
  "--exclude-dir=chrome-ui",
]);
const dynamicHits = grepFiles(DYNAMIC_IMPORT_PATTERN, SRC, [
  "--include=*.ts",
  "--include=*.tsx",
  "--exclude-dir=chrome-ui",
]);
const directImportFiles = Array.from(new Set([...staticHits, ...dynamicHits])).sort();
const directImportCount = directImportFiles.length;

if (MODE === "warn") {
  console.log(
    `[chrome-ui-surface] WARN MODE — ${directImportCount} file(s) outside chrome-ui/ still import flowbite-react ` +
      `directly. This is a REPORT, not a pass/fail signal: the B3 sweep task re-points these to ` +
      `@/editor/chrome-ui. This check flips to ERROR mode (and must be 0) in that dispatch's final commit — ` +
      `do not read a green run of THIS gate today as "the surface is closed."`,
  );
  if (directImportCount > 0) {
    console.log(`  sample (first 10 of ${directImportCount}):`);
    for (const f of directImportFiles.slice(0, 10)) console.log(`    ${relative(EDITOR_ROOT, f)}`);
  }
} else {
  if (directImportCount > 0) {
    fail(
      `[chrome-ui-surface] FAIL — ${directImportCount} file(s) outside chrome-ui/ import flowbite-react directly:\n` +
        directImportFiles.map((f) => `    ${relative(EDITOR_ROOT, f)}`).join("\n"),
    );
  } else {
    console.log("[chrome-ui-surface] PASS — 0 direct flowbite-react imports outside chrome-ui/.");
  }
}

// ── Check 2: BARREL_PURITY ─────────────────────────────────────────────────
// Every line in the barrel that mentions "flowbite-react" must be a bare
// re-export statement, never a component definition landing in this file.
const REEXPORT_LINE_PATTERN = /^export\s+(type\s+)?\{[^}]+\}\s+from\s+["']flowbite-react(\/[^"']*)?["'];?\s*$/;

const barrelSource = readFileSync(BARREL, "utf8");
// Strip block comments before scanning — the header docstring above legitimately
// prose-quotes `"flowbite-react"` while explaining this very rule; without
// stripping, that documentation line would itself trip guard #2. Newlines
// inside the stripped comment are preserved (replaced with themselves) so
// line numbers in any FAIL output below still point at the real source line.
const barrelCodeOnly = barrelSource.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ""));
const barrelLines = barrelCodeOnly.split("\n");
const impureLines = [];
let pureReexportCount = 0;

barrelLines.forEach((line, idx) => {
  const codeOnly = line.split("//")[0]; // strip a trailing line comment, if any
  if (!/["']flowbite-react/.test(codeOnly)) return;
  if (REEXPORT_LINE_PATTERN.test(codeOnly.trim())) {
    pureReexportCount += 1;
  } else {
    impureLines.push({ n: idx + 1, line });
  }
});

if (impureLines.length > 0) {
  fail(
    `[chrome-ui-surface] FAIL — chrome-ui/index.ts has ${impureLines.length} line(s) referencing flowbite-react ` +
      `that are not pure re-export syntax (spec §3 guard #2 — barrel purity):\n` +
      impureLines.map(({ n, line }) => `    index.ts:${n}: ${line.trim()}`).join("\n"),
  );
} else {
  console.log(`[chrome-ui-surface] PASS — barrel purity: ${pureReexportCount} flowbite-react re-export line(s), all pure.`);
}

// ── Check 3: CLOSED_WRAPPER_SET ────────────────────────────────────────────
// A wrapper file in this codebase always does two things together: renames a
// flowbite-react import to `X as FlowbiteX` AND calls `mergeTheme(` to
// compose its default theme with a caller's. Both signals, taken together,
// are unique to the intended wrapper files — verified empirically: none of
// chrome-ui's other components (which import flowbite-react freely) use the
// renamed-alias pattern.
const RENAMED_IMPORT_PATTERN = String.raw`[A-Za-z]+ as Flowbite[A-Za-z]+`;
const MERGE_THEME_CALL_PATTERN = String.raw`mergeTheme\(`;

const renamedImportFiles = new Set(
  grepFiles(RENAMED_IMPORT_PATTERN, CHROME_UI_DIR, ["--include=*.tsx", "--exclude-dir=__tests__"]),
);
const mergeThemeCallerFiles = new Set(
  grepFiles(MERGE_THEME_CALL_PATTERN, CHROME_UI_DIR, ["--include=*.tsx", "--exclude-dir=__tests__"]),
);

const detectedWrappers = Array.from(renamedImportFiles)
  .filter((f) => mergeThemeCallerFiles.has(f))
  .map((f) => relative(CHROME_UI_DIR, f))
  .sort();

const detectedSet = new Set(detectedWrappers);
const unexpected = detectedWrappers.filter((f) => !WRAPPER_FILES.has(f));
const missing = Array.from(WRAPPER_FILES).filter((f) => !detectedSet.has(f));

if (unexpected.length > 0) {
  fail(
    `[chrome-ui-surface] FAIL — ${unexpected.length} file(s) match the wrapper signature (renamed flowbite-react ` +
      `import + mergeTheme(...)) but are NOT in the closed set (spec §3 guard #3): ${unexpected.join(", ")}\n` +
      `  If this addition is deliberate, amend WRAPPER_FILES here AND chrome-ui/index.ts's "(b)" section in the ` +
      `same commit — that amendment is the review checkpoint the spec calls for.`,
  );
} else if (missing.length > 0) {
  fail(
    `[chrome-ui-surface] FAIL — expected wrapper(s) not found: ${missing.join(", ")}. Either the wrapper was ` +
      `removed/renamed without updating WRAPPER_FILES, or it no longer matches the detection signature (renamed ` +
      `flowbite-react import + mergeTheme(...) call).`,
  );
} else {
  console.log(`[chrome-ui-surface] PASS — closed wrapper set is exactly [${Array.from(WRAPPER_FILES).join(", ")}].`);
}

if (failed) {
  process.exit(1);
}
console.log(`[chrome-ui-surface] done (MODE=${MODE}).`);
