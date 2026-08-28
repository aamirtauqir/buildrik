#!/usr/bin/env node
/**
 * Gate: chrome-ui/ is the single public chrome surface for flowbite-react
 * (chrome-ui-single-surface spec §3, docs/plans/2026-07-31-chrome-ui-single-surface.md).
 *
 * Fix round 1 (this revision) closed two live bypasses a reviewer
 * demonstrated against the original version, plus one gap:
 *
 *  - CRITICAL 1: a brand-new file (`chrome-ui/NewFile.tsx`) that plainly
 *    `import`s a flowbite-react component and re-exports a themed wrapper of
 *    it under a NEW name, re-exported from the barrel via
 *    `export { NewName } from "./NewFile";`, passed every check. The old
 *    check 2 only scanned index.ts lines literally containing the string
 *    "flowbite-react" — a clean `export { X } from "./File"` line has none.
 *    The old check 3 heuristic required BOTH a renamed `X as FlowbiteX`
 *    import AND a literal `mergeTheme(` call, both trivially avoidable.
 *    Fixed by EXPORT_SURFACE_MANIFEST below — a manifest-diff replaces the
 *    heuristic and closes the hole regardless of internal file shape, because
 *    ANY new exported name not already in the manifest fails, full stop.
 *  - CRITICAL 2: deep imports (`@/editor/chrome-ui/selectTheme`,
 *    `../chrome-ui/selectTheme`) bypassed the barrel entirely and were
 *    undetected — documented as banned (spec §2(d), CLAUDE.md) but never
 *    enforced. Fixed by DEEP_IMPORT_BAN below.
 *  - IMPORTANT 3: `import(\`flowbite-react\`)` (backtick specifier) and
 *    `require("flowbite-react")` bypassed the old check 1 patterns, which
 *    only covered `from "..."` and `import("...")`/`import('...')`. Fixed by
 *    extending every specifier pattern to all 3 quote styles and both call
 *    forms (dynamic import + require).
 *
 * Four checks now:
 *
 *  1. NO_DIRECT_IMPORT (error — B3 sweep complete, count is 0) — no
 *     specifier matching `^flowbite-react(/.*)?$` anywhere under
 *     packages/editor/src outside chrome-ui/. Covers `from "..."`,
 *     `import("...")`, and `require("...")`, each in all three quote styles
 *     ('/"/`) where the JS grammar allows more than one.
 *
 *  1b. DEEP_IMPORT_BAN (error, from day one — 0 pre-existing violations
 *     confirmed) — no specifier reaching PAST the chrome-ui/ barrel into one
 *     of its internal files (`@/editor/chrome-ui/<name>`,
 *     `../chrome-ui/<name>`, any relative depth) outside chrome-ui/ itself.
 *     The bare `@/editor/chrome-ui` barrel import is exempt — that IS the
 *     sanctioned entry point. Same 3-quote-style, 3-call-form coverage as
 *     check 1.
 *
 *  2. BARREL_PURITY (error, from day one) — every line in chrome-ui/index.ts
 *     that references a `flowbite-react` specifier must be
 *     `export { X } from "flowbite-react...";` re-export syntax, never a
 *     component definition landing directly in the barrel. Still useful
 *     alongside check 3 below — it catches an in-file definition even before
 *     you'd get as far as asking "is this name in the manifest".
 *
 *  3. EXPORT_SURFACE_MANIFEST (error, from day one) — chrome-ui/index.ts's
 *     ENTIRE export surface (every name, from every `export {...} from
 *     "...";` statement, types included) is parsed fresh on every run and
 *     classified into one of three provenances:
 *       - "flowbite-reexport": statement's source is `flowbite-react` (bare
 *         or subpath).
 *       - "wrapper": statement's source is a local chrome-ui/ file that
 *         BOTH renames a flowbite-react import (`X as FlowbiteX`) AND calls
 *         `mergeTheme(` — the same structural tell verified unique to
 *         TextInput.tsx/Select.tsx (grep confirms 0 of chrome-ui's other
 *         ~50 files use the renamed-import form, even though ~18 of them
 *         import flowbite-react freely to compose it internally).
 *       - "local": everything else sourced from a chrome-ui/ file.
 *     That computed map is diffed against the checked-in manifest
 *     (`scripts/gates/chrome-ui-surface.manifest.json`). ANY drift — a name
 *     the barrel exports that isn't in the manifest, a name in the manifest
 *     the barrel no longer exports, or a name whose computed provenance no
 *     longer matches the manifest's recorded provenance — fails with a
 *     message telling the author to update the manifest in the same commit.
 *     That is what makes the "new file, new export name" bypass impossible:
 *     the new name is never in the manifest, regardless of what the file
 *     inside it looks like. It also mechanizes the review checkpoint the old
 *     heuristic only approximated — extending the manifest IS the deliberate
 *     amendment the spec calls for.
 *     Defensive parse check: any `export` keyword left over after all
 *     recognized `export {...} from "...";` statements are stripped out
 *     fails immediately — a different export shape (e.g. `export const X =`)
 *     is exactly the kind of "not what the parser expected" case that must
 *     not silently produce zero extracted names.
 *
 * grep, not rg: every other gate in scripts/ uses plain POSIX grep because
 * GitHub's ubuntu-latest CI runner does not ship ripgrep — an `rg`-based gate
 * would exit 127 ("command not found") on every CI run
 * (see scripts/check-editor-ui-gone.mjs's header for the same note).
 *
 * No pattern-allowlist file is read for the grep-based checks. Two
 * silent-pass bugs already hit this arc from exactly that shape — a blank
 * line and a bare `#` line in a `grep -F -f <allowlist-file>` pattern file,
 * either of which matches every line unconditionally
 * (docs/plans/2026-07-31-flowbite-bigbang-outcome.md). Every grep pattern
 * below is a literal, non-empty regex written directly into this script.
 * The EXPORT_SURFACE_MANIFEST *is* a checked-in JSON file by design (the
 * spec explicitly asks for one) — it is not a grep pattern file, and drift
 * against it fails LOUD (a blank/missing manifest flags every real export as
 * "new", it does not silently pass), so it is not the same risk shape.
 *
 * @license BSD-3-Clause
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── MODE ────────────────────────────────────────────────────────────────
// "warn"  — check 1 (NO_DIRECT_IMPORT) reports its count but always exits 0.
// "error" — check 1 fails the build if the count is not exactly 0.
// Checks 1b, 2, and 3 are ALWAYS enforced as errors, in both modes — there is
// no pre-existing backlog for any of them to grandfather.
// Flipped to "error" at the end of the B3 sweep (count reached 0 — see the
// commit history for the 6 surface-sized commits that drained it).
const MODE = "error";

const HERE = dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = resolve(HERE, "..");
const SRC = resolve(EDITOR_ROOT, "src");
const CHROME_UI_DIR = resolve(SRC, "editor/chrome-ui");
const BARREL = resolve(CHROME_UI_DIR, "index.ts");
const MANIFEST_PATH = resolve(EDITOR_ROOT, "scripts/gates/chrome-ui-surface.manifest.json");

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

/**
 * Builds the 3 call-shape patterns for a specifier "body" regex fragment
 * (the part between the quotes): a static `from` clause (JS grammar only
 * allows a plain '/" string literal there — no backtick form exists), a
 * dynamic `import(...)` call, and a CommonJS `require(...)` call. The latter
 * two accept any of the three quote styles, backtick included — the
 * Important-3 gap the original version had (only '/" were covered, and only
 * for `from`/`import()`, never `require()`).
 */
function specifierPatterns(bodyPattern) {
  return {
    fromClause: "from[[:space:]]+['\"]" + bodyPattern + "['\"]",
    dynamicImport: "import\\([[:space:]]*['\"`]" + bodyPattern + "['\"`]",
    requireCall: "require\\([[:space:]]*['\"`]" + bodyPattern + "['\"`]",
  };
}

function findSpecifierViolations(bodyPattern, dir, extraArgs) {
  const { fromClause, dynamicImport, requireCall } = specifierPatterns(bodyPattern);
  const hits = [
    ...grepFiles(fromClause, dir, extraArgs),
    ...grepFiles(dynamicImport, dir, extraArgs),
    ...grepFiles(requireCall, dir, extraArgs),
  ];
  return Array.from(new Set(hits)).sort();
}

const OUTSIDE_CHROME_UI_ARGS = ["--include=*.ts", "--include=*.tsx", "--exclude-dir=chrome-ui"];

// ── Check 1: NO_DIRECT_IMPORT ──────────────────────────────────────────────
// Any specifier that IS flowbite-react (bare or subpath), outside chrome-ui/
// — the one directory allowed to talk to flowbite-react directly.
const FLOWBITE_BODY = "flowbite-react(/[^'\"`]*)?";
const directImportFiles = findSpecifierViolations(FLOWBITE_BODY, SRC, OUTSIDE_CHROME_UI_ARGS);
const directImportCount = directImportFiles.length;

if (MODE === "warn") {
  console.log(
    `[chrome-ui-surface] WARN MODE — ${directImportCount} file(s) outside chrome-ui/ still import flowbite-react ` +
      `directly. This is a REPORT, not a pass/fail signal. This check flips to ERROR mode (and must be 0) once the ` +
      `sweep completes — do not read a green run of THIS gate today as "the surface is closed."`,
  );
  if (directImportCount > 0) {
    console.log(`  sample (first 10 of ${directImportCount}):`);
    for (const f of directImportFiles.slice(0, 10)) console.log(`    ${relative(EDITOR_ROOT, f)}`);
  }
} else if (directImportCount > 0) {
  fail(
    `[chrome-ui-surface] FAIL — ${directImportCount} file(s) outside chrome-ui/ import flowbite-react directly ` +
      `(from/import()/require(), any quote style):\n` +
      directImportFiles.map((f) => `    ${relative(EDITOR_ROOT, f)}`).join("\n"),
  );
} else {
  console.log("[chrome-ui-surface] PASS — 0 direct flowbite-react imports outside chrome-ui/.");
}

// ── Check 1b: DEEP_IMPORT_BAN ──────────────────────────────────────────────
// Any specifier that reaches PAST the barrel into a specific chrome-ui/
// internal file — `@/editor/chrome-ui/<name>` or a relative `.../chrome-ui/
// <name>` at any depth — outside chrome-ui/ itself. The bare barrel import
// (`@/editor/chrome-ui`, no trailing path segment) does NOT match this
// pattern (it requires "/chrome-ui/" with something after the second
// slash) and stays allowed — that IS the sanctioned single entry point.
const CHROME_UI_DEEP_BODY = "[^'\"`]*/chrome-ui/[^'\"`]+";
const deepImportFiles = findSpecifierViolations(CHROME_UI_DEEP_BODY, SRC, OUTSIDE_CHROME_UI_ARGS);

if (deepImportFiles.length > 0) {
  fail(
    `[chrome-ui-surface] FAIL — ${deepImportFiles.length} file(s) outside chrome-ui/ import a chrome-ui/ INTERNAL ` +
      `file directly, bypassing the barrel (spec §2(d) — the barrel is the only entry point):\n` +
      deepImportFiles.map((f) => `    ${relative(EDITOR_ROOT, f)}`).join("\n") +
      `\n  Import from "@/editor/chrome-ui" (no subpath) instead.`,
  );
} else {
  console.log("[chrome-ui-surface] PASS — 0 deep imports into chrome-ui/ internals outside chrome-ui/.");
}

// ── Check 2: BARREL_PURITY ─────────────────────────────────────────────────
// Every line in the barrel that mentions "flowbite-react" must be a bare
// re-export statement, never a component definition landing in this file.
const REEXPORT_LINE_PATTERN = /^export\s+(type\s+)?\{[^}]+\}\s+from\s+["']flowbite-react(\/[^"']*)?["'];?\s*$/;

function stripComments(src) {
  // Strip block comments (preserving newline count so line numbers in any
  // FAIL output stay accurate) and trailing line comments.
  const noBlockComments = src.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ""));
  return noBlockComments
    .split("\n")
    .map((line) => line.split("//")[0])
    .join("\n");
}

const barrelSource = readFileSync(BARREL, "utf8");
const barrelCodeOnly = stripComments(barrelSource);
const barrelLinesRaw = barrelSource.split("\n");
const barrelLinesCodeOnly = barrelCodeOnly.split("\n");
const impureLines = [];
let pureReexportCount = 0;

barrelLinesCodeOnly.forEach((codeOnly, idx) => {
  if (!/["']flowbite-react/.test(codeOnly)) return;
  if (REEXPORT_LINE_PATTERN.test(codeOnly.trim())) {
    pureReexportCount += 1;
  } else {
    impureLines.push({ n: idx + 1, line: barrelLinesRaw[idx] });
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

// ── Check 3: EXPORT_SURFACE_MANIFEST ───────────────────────────────────────
const EXPORT_STMT_RE = /export\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["'];?/g;

function parseBarrelExports(codeOnly) {
  const entries = []; // { name, source }
  let residual = codeOnly;
  let match;
  EXPORT_STMT_RE.lastIndex = 0;
  while ((match = EXPORT_STMT_RE.exec(codeOnly))) {
    const [full, , inner, source] = match; // 2nd group (statement-level `type` keyword) doesn't affect
    // classification — provenance is per-source-file, uniform across every name in the statement whether
    // it's `export {...}` or `export type {...}`.
    residual = residual.replace(full, "");
    const parts = inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      const cleaned = part.replace(/^type\s+/, ""); // per-part `type X` inside a mixed, non-type-only statement
      const aliasMatch = cleaned.match(/^(\S+)\s+as\s+(\S+)$/);
      const exportedName = aliasMatch ? aliasMatch[2] : cleaned;
      if (!exportedName) continue;
      entries.push({ name: exportedName, source });
    }
  }
  return { entries, residual };
}

function classifyProvenance(source) {
  if (/^flowbite-react(\/.*)?$/.test(source)) return "flowbite-reexport";
  if (!source.startsWith("./")) return null; // unrecognized source shape — caller treats as a hard failure
  const base = resolve(CHROME_UI_DIR, source.slice(2));
  const candidate = [base + ".tsx", base + ".ts"].find((f) => existsSync(f));
  if (!candidate) return null;
  const content = stripComments(readFileSync(candidate, "utf8"));
  const hasRenamedFlowbiteImport = /[A-Za-z]+ as Flowbite[A-Za-z]+/.test(content);
  const callsMergeTheme = /mergeTheme\(/.test(content);
  return hasRenamedFlowbiteImport && callsMergeTheme ? "wrapper" : "local";
}

const { entries: barrelEntries, residual } = parseBarrelExports(barrelCodeOnly);

// Defensive: a different export shape (e.g. `export const X = ...;`) would
// silently produce zero extracted names for that statement if left
// unchecked — this asserts nothing "export"-shaped survives outside the
// statements the parser above already understood and removed.
const leftoverExport = residual.match(/\bexport\b/);
if (leftoverExport) {
  fail(
    `[chrome-ui-surface] FAIL — chrome-ui/index.ts contains an export statement this gate's parser does not ` +
      `recognize (only \`export { X } from "...";\` / \`export type { X } from "...";\` are allowed in the ` +
      `barrel). Residual after stripping recognized statements still contains "export".`,
  );
}

if (!existsSync(MANIFEST_PATH)) {
  fail(`[chrome-ui-surface] FAIL — manifest missing: ${relative(EDITOR_ROOT, MANIFEST_PATH)}`);
} else {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const manifestExports = manifest.exports ?? {};

  const actual = {};
  const unresolved = [];
  for (const { name, source } of barrelEntries) {
    const provenance = classifyProvenance(source);
    if (provenance === null) {
      unresolved.push(`${name} (source: ${source})`);
      continue;
    }
    actual[name] = provenance;
  }

  if (unresolved.length > 0) {
    fail(
      `[chrome-ui-surface] FAIL — ${unresolved.length} barrel export(s) have a source this gate cannot resolve ` +
        `(neither flowbite-react nor a "./LocalFile" chrome-ui/ path):\n` +
        unresolved.map((u) => `    ${u}`).join("\n"),
    );
  }

  const actualNames = new Set(Object.keys(actual));
  const manifestNames = new Set(Object.keys(manifestExports));

  const newExports = [...actualNames].filter((n) => !manifestNames.has(n)).sort();
  const removedExports = [...manifestNames].filter((n) => !actualNames.has(n)).sort();
  const changedProvenance = [...actualNames]
    .filter((n) => manifestNames.has(n) && manifestExports[n] !== actual[n])
    .map((n) => `${n}: manifest says "${manifestExports[n]}", actual is "${actual[n]}"`)
    .sort();

  if (newExports.length > 0) {
    fail(
      `[chrome-ui-surface] FAIL — ${newExports.length} barrel export(s) are NOT in the manifest ` +
        `(${relative(EDITOR_ROOT, MANIFEST_PATH)}):\n` +
        newExports.map((n) => `    ${n} (computed provenance: "${actual[n]}", source: ${barrelEntries.find((e) => e.name === n)?.source})`).join("\n") +
        `\n  If this addition is deliberate, add it to the manifest with its provenance in the SAME commit — ` +
        `that edit is the review checkpoint the spec calls for. A "wrapper" provenance is reserved for the ` +
        `closed 3-member set (TextInput, Select, Button — grown 2026-08-28, design-debt arc) — adding a 4th here means deliberately deciding to grow that set.`,
    );
  }
  if (removedExports.length > 0) {
    fail(
      `[chrome-ui-surface] FAIL — ${removedExports.length} name(s) in the manifest are no longer exported by the ` +
        `barrel — remove them from the manifest in the same commit that removed the export:\n` +
        removedExports.map((n) => `    ${n} (manifest says: "${manifestExports[n]}")`).join("\n"),
    );
  }
  if (changedProvenance.length > 0) {
    fail(
      `[chrome-ui-surface] FAIL — ${changedProvenance.length} export(s) changed provenance since the manifest was ` +
        `last updated (spec §3 guard #3):\n` +
        changedProvenance.map((c) => `    ${c}`).join("\n") +
        `\n  If deliberate, update the manifest in the same commit — this is exactly the review checkpoint a new ` +
        `wrapper must pass through.`,
    );
  }

  if (newExports.length === 0 && removedExports.length === 0 && changedProvenance.length === 0 && unresolved.length === 0) {
    const wrapperNames = Object.entries(actual)
      .filter(([, p]) => p === "wrapper")
      .map(([n]) => n)
      .sort();
    console.log(
      `[chrome-ui-surface] PASS — export surface matches the manifest: ${actualNames.size} names ` +
        `(${Object.values(actual).filter((p) => p === "flowbite-reexport").length} flowbite-reexport, ` +
        `${wrapperNames.length} wrapper [${wrapperNames.join(", ")}], ` +
        `${Object.values(actual).filter((p) => p === "local").length} local).`,
    );
  }
}

if (failed) {
  process.exit(1);
}
console.log(`[chrome-ui-surface] done (MODE=${MODE}).`);
