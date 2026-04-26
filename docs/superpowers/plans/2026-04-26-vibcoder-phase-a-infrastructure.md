# Vibcoder Phase A Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the infrastructure (vendoring pipeline, codemods, gates, CLAUDE.md routing) needed to port vibcoder components into the editor under Position 3 + R2 namespace exception.

**Architecture:** Path B Hybrid — vendored CSS lives at `packages/editor/src/themes/components/<tier>/<name>.css`, sourced from `docs/reference/vibcoder/components/`. A shell orchestrator runs three codemods (class rename, token fold surface, alias bridge), then SHA256-pins the bundle. Codex routing rules + 4 grep gates protect namespace invariants.

**Tech Stack:** Bun (runtime for `.mjs` codemods), POSIX shell (orchestrator), Vitest (codemod unit tests), bash + grep (CI gates), CSS Cascade Layers (`@layer tokens, components, overrides;`).

**Spec set:** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/`
- `README.md` — index + 9 brainstorm decisions
- `design.md` — 5 sections (Architecture, Components, Data Flow, Error Handling, Testing)
- `roadmap.md` — phase sequencing + risk register
- `SCOPE.md` — component triage + token filter

**Out of scope for this plan:** Any actual component port. Phase 0 POC (Plan 2) consumes the infrastructure. Phase 1+ consume the gates.

---

## File Structure

| File | Purpose |
|---|---|
| `packages/editor/src/themes/components/_layer.css` | `@layer tokens, components, overrides;` declaration consumed by `default.css` |
| `packages/editor/src/themes/components/.bundle-version` | SHA256 of vendored bundle (generated) |
| `packages/editor/src/themes/components/atoms/` | Vendored atom CSS (created empty for now) |
| `packages/editor/src/themes/components/molecules/` | Vendored molecule CSS (empty) |
| `packages/editor/src/themes/components/organisms/` | Vendored organism CSS (empty) |
| `packages/editor/src/themes/components/layouts/` | Vendored layout CSS (empty) |
| `packages/editor/scripts/vibcoder-bundle-pin.mjs` | Compute SHA256 of `docs/reference/vibcoder/components/` → write `.bundle-version` |
| `packages/editor/scripts/vibcoder-codemod-1.mjs` | Rename `bdr-*` → `bd-*` classes + `@keyframes` + `animation-name` |
| `packages/editor/scripts/vibcoder-codemod-2.mjs` | Fold `--buildrick-*` token names per token-fold table |
| `packages/editor/scripts/vibcoder-codemod-3.mjs` | Emit `--bd-*` alias layer pointing at folded canonical names (filtered) |
| `packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs` | 12 unit tests across codemods 1 + 2 |
| `packages/editor/scripts/vibcoder-vendor.sh` | Shell orchestrator: pin → codemod 1 → 2 → 3 |
| `packages/editor/scripts/check-vibcoder-port.sh` | Per-PR gate: every ported component has manifest entry + body line |
| `packages/editor/scripts/ds-grep-gates.sh` | Modify: add Gate 19 (bdr-X leak) + Gate 21 (namespace direction) |
| `packages/editor/package.json` | Add 4 npm scripts |
| `packages/editor/src/themes/default.css` | Add `@import "./components/_layer.css";` at top |
| `packages/editor/CLAUDE.md` | Add "Vibcoder Position 3" routing section |

---

## Task 1: Create themes/components/ skeleton

**Files:**
- Create: `packages/editor/src/themes/components/atoms/.gitkeep`
- Create: `packages/editor/src/themes/components/molecules/.gitkeep`
- Create: `packages/editor/src/themes/components/organisms/.gitkeep`
- Create: `packages/editor/src/themes/components/layouts/.gitkeep`

- [ ] **Step 1:** Create empty tier directories with `.gitkeep` files

```bash
cd /Users/shahg/Desktop/pencil/buildrik
mkdir -p packages/editor/src/themes/components/{atoms,molecules,organisms,layouts}
touch packages/editor/src/themes/components/{atoms,molecules,organisms,layouts}/.gitkeep
```

- [ ] **Step 2:** Verify

```bash
ls packages/editor/src/themes/components/
```
Expected: `atoms  layouts  molecules  organisms`

- [ ] **Step 3:** Commit

```bash
git add packages/editor/src/themes/components/
git commit -m "$(cat <<'EOF'
chore(editor): scaffold vibcoder vendored CSS dirs

Phase A Task 1. Empty tier dirs that codemod pipeline will populate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Cascade layer declaration

**Files:**
- Create: `packages/editor/src/themes/components/_layer.css`
- Modify: `packages/editor/src/themes/default.css` (top of file)

- [ ] **Step 1:** Write the layer file

```css
/* packages/editor/src/themes/components/_layer.css */
/**
 * Vibcoder vendored CSS cascade layer.
 * Order: tokens (defs) < components (vendored vibcoder) < overrides (Emotion + page-level).
 * Emotion writes unlayered styles which always win against layered ones, so existing
 * styled() components remain authoritative during Phase 1-5 transition.
 * @license BSD-3-Clause
 */
@layer tokens, components, overrides;
```

- [ ] **Step 2:** Read `default.css` to find safe import location

```bash
head -20 packages/editor/src/themes/default.css
```

- [ ] **Step 3:** Add import as the FIRST line of `default.css`

`@layer` must be declared before any other rule references the layer. The Edit tool old_string should be the existing first line; new_string prepends `@import "./components/_layer.css";` followed by a blank line.

- [ ] **Step 4:** Verify dev build still works

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: PASS (no errors).

- [ ] **Step 5:** Commit

```bash
git add packages/editor/src/themes/components/_layer.css packages/editor/src/themes/default.css
git commit -m "$(cat <<'EOF'
feat(editor): declare vibcoder cascade layers

Phase A Task 2. @layer tokens, components, overrides; — vendored
vibcoder CSS lands in `components` layer. Emotion remains unlayered
so existing styled() components stay authoritative through transition.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Bundle pin script

**Files:**
- Create: `packages/editor/scripts/vibcoder-bundle-pin.mjs`

- [ ] **Step 1:** Write the script

```js
#!/usr/bin/env node
// packages/editor/scripts/vibcoder-bundle-pin.mjs
/**
 * Compute SHA256 of vendored vibcoder bundle and write .bundle-version artifact.
 * Run after every bundle vendor cycle. Diff in PR proves "bundle changed" vs
 * "bundle unchanged, only codemod output drifted" — distinct review paths.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const SRC = join(ROOT, "docs/reference/vibcoder/components");
const OUT = join(ROOT, "packages/editor/src/themes/components/.bundle-version");

export function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".css") || p.endsWith(".html") || p.endsWith(".md") || p.endsWith(".svg")) out.push(p);
  }
  return out.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = walk(SRC);
  const hash = createHash("sha256");
  for (const f of files) {
    hash.update(relative(SRC, f));
    hash.update("\0");
    hash.update(readFileSync(f));
    hash.update("\0");
  }
  const digest = hash.digest("hex");
  writeFileSync(OUT, `${digest}\n${files.length} files\n${new Date().toISOString()}\n`);
  console.log(`pinned: ${digest.slice(0, 12)}… (${files.length} files)`);
}
```

- [ ] **Step 2:** Test it runs

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bun packages/editor/scripts/vibcoder-bundle-pin.mjs
cat packages/editor/src/themes/components/.bundle-version
```
Expected: prints `pinned: <12 hex chars>… (<N> files)`, file contains 3 lines.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/vibcoder-bundle-pin.mjs packages/editor/src/themes/components/.bundle-version
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder bundle pin script + initial digest

Phase A Task 3. SHA256 over docs/reference/vibcoder/components/ written
to .bundle-version. Re-pin on every bundle update to make "bundle drift"
visible in PR diffs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: .gitignore exception for vendored CSS

**Files:**
- Modify: `.gitignore` (root)

The `docs/reference/` tree is gitignored. The vendored output `packages/editor/src/themes/components/` lives under `packages/editor/src/`, which is NOT gitignored, so no exception is needed there. This task verifies the boundary and adds explicit comment so a future hand doesn't broaden the gitignore.

- [ ] **Step 1:** Confirm current state

```bash
git check-ignore -v packages/editor/src/themes/components/atoms/.gitkeep || echo "not ignored — good"
```
Expected: `not ignored — good`

- [ ] **Step 2:** Add a comment to `.gitignore` near the `docs/reference/` line documenting the boundary

Find the existing `docs/reference/` line in `.gitignore` and replace it with:

```
# Designer-facing spec drop, dev-local snapshot. Vendored output lives under
# packages/editor/src/themes/components/ and IS tracked.
docs/reference/
```

- [ ] **Step 3:** Verify

```bash
git diff .gitignore
git check-ignore -v docs/reference/vibcoder/README.md
```
Expected: `docs/reference/vibcoder/README.md` is ignored; comment added above the rule.

- [ ] **Step 4:** Commit

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: document gitignore boundary for vibcoder bundle

Phase A Task 4. docs/reference/ stays ignored (designer drop). Vendored
output at packages/editor/src/themes/components/ is tracked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Codemod 1 — class rename + animation refs

**Files:**
- Create: `packages/editor/scripts/vibcoder-codemod-1.mjs`

The vibcoder bundle uses `bdr-*` BEM classes. Buildrik chrome uses `bd-*`. This codemod rewrites class definitions, attribute selectors, `@keyframes` names, and `animation-name` refs.

- [ ] **Step 1:** Write the codemod

```js
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
```

- [ ] **Step 2:** Smoke test (no files yet, should report 0/0)

```bash
bun packages/editor/scripts/vibcoder-codemod-1.mjs
```
Expected: `codemod 1: 0/0 files rewritten`

- [ ] **Step 3:** Commit (test in Task 7)

```bash
git add packages/editor/scripts/vibcoder-codemod-1.mjs
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder codemod 1 — class + animation rename

Phase A Task 5. Rewrites bdr-* → bd-* across class selectors, attribute
selectors, @keyframes names, and animation-name (longhand + shorthand).
Idempotent. Tests land in Task 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Codemod 2 — token fold surface

**Files:**
- Create: `packages/editor/scripts/vibcoder-codemod-2.mjs`

Folds vibcoder token names to Buildrik canonical names per the spec table. See `design.md` Section 3 (Data Flow) for the full token-fold table.

- [ ] **Step 1:** Write the codemod

```js
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
```

- [ ] **Step 2:** Smoke test

```bash
bun packages/editor/scripts/vibcoder-codemod-2.mjs
```
Expected: `codemod 2: 0/0 files rewritten`

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/vibcoder-codemod-2.mjs
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder codemod 2 — token fold surface

Phase A Task 6. Folds vibcoder token names to Buildrik canonical names
via lookup table (extended in Phase 1 per spec table). Lookahead guards
against double-fold. Idempotent. Tests land in Task 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Codemod unit tests (13 cases)

**Files:**
- Create: `packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs`

- [ ] **Step 1:** Write failing tests

```js
// packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs
import { describe, it, expect } from "vitest";
import { transform as cm1 } from "../vibcoder-codemod-1.mjs";
import { transform as cm2 } from "../vibcoder-codemod-2.mjs";

describe("vibcoder-codemod-1: class + animation rename", () => {
  it("rewrites simple class selector", () => {
    expect(cm1(".bdr-button { color: red; }")).toBe(".bd-button { color: red; }");
  });
  it("rewrites BEM element", () => {
    expect(cm1(".bdr-card__header {}")).toBe(".bd-card__header {}");
  });
  it("rewrites BEM modifier", () => {
    expect(cm1(".bdr-btn--primary {}")).toBe(".bd-btn--primary {}");
  });
  it("rewrites attribute selector", () => {
    expect(cm1('[class*="bdr-icon"] {}')).toBe('[class*="bd-icon"] {}');
  });
  it("rewrites @keyframes name", () => {
    expect(cm1("@keyframes bdr-fade-in {}")).toBe("@keyframes bd-fade-in {}");
  });
  it("rewrites animation-name longhand", () => {
    expect(cm1(".x { animation-name: bdr-spin; }")).toBe(".x { animation-name: bd-spin; }");
  });
  it("rewrites animation shorthand", () => {
    expect(cm1(".x { animation: bdr-spin 1s linear; }")).toBe(".x { animation: bd-spin 1s linear; }");
  });
  it("rewrites all names in multi-animation shorthand (regression for bdc5f13)", () => {
    expect(cm1(".x { animation: bdr-foo, bdr-bar; }")).toBe(".x { animation: bd-foo, bd-bar; }");
  });
  it("is idempotent", () => {
    const once = cm1(".bdr-foo {}");
    expect(cm1(once)).toBe(once);
  });
  it("leaves non-bdr classes untouched", () => {
    expect(cm1(".bd-existing {} .other-thing {}")).toBe(".bd-existing {} .other-thing {}");
  });
});

describe("vibcoder-codemod-2: token fold", () => {
  it("folds bg-panel token", () => {
    expect(cm2("color: var(--buildrick-color-bg-panel);"))
      .toBe("color: var(--buildrick-bg-panel);");
  });
  it("does not fold canonical name (no double-fold)", () => {
    expect(cm2("color: var(--buildrick-bg-panel);"))
      .toBe("color: var(--buildrick-bg-panel);");
  });
  it("folds multiple tokens in one declaration", () => {
    expect(cm2("border: 1px solid var(--buildrick-color-border); color: var(--buildrick-color-fg-primary);"))
      .toBe("border: 1px solid var(--buildrick-border); color: var(--buildrick-fg-primary);");
  });
});
```

- [ ] **Step 2:** Run tests — should all PASS (codemods already written in Tasks 5+6)

```bash
cd packages/editor && npx vitest run scripts/__tests__/vibcoder-codemod.test.mjs
```
Expected: 13 passing.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs
git commit -m "$(cat <<'EOF'
test(editor): vibcoder codemods 1+2 unit suite (13 cases)

Phase A Task 7. Covers selectors, BEM, attribute selectors, @keyframes,
animation longhand + shorthand + multi-name (regression for bdc5f13),
idempotency, no-op on non-vibcoder classes, token fold, no double-fold,
multi-token declarations.

Plan updated 12 → 13 to reflect the regression test addition.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Codemod 3 — alias bridge (filtered)

**Files:**
- Create: `packages/editor/scripts/vibcoder-codemod-3.mjs`

Emits the `--bd-*` alias layer that points at folded canonical names. Filtered per `SCOPE.md` Token Filter table (skips mobile/dashboard/cms/canvas-internal/fab/stage-dark scopes).

- [ ] **Step 1:** Write the codemod

```js
#!/usr/bin/env node
// packages/editor/scripts/vibcoder-codemod-3.mjs
/**
 * Vibcoder codemod 3: emit --bd-* alias layer mapping each canonical
 * --buildrick-* token to its short --bd-* alias. Filtered per SCOPE.md
 * Token Filter table.
 *
 * Output: packages/editor/src/themes/components/_aliases.generated.css
 * Idempotent (overwrites output every run).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const TARGET = join(ROOT, "packages/editor/src/themes/components");
const OUT = join(TARGET, "_aliases.generated.css");

const SKIP_PATTERNS = [
  /^--buildrick-mobile-/,
  /^--buildrick-dashboard-/,
  /^--buildrick-cms-/,
  /^--buildrick-canvas-internal-/,
  /^--buildrick-fab-/,
  /^--buildrick-stage-dark$/,
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (entry === "_aliases.generated.css") continue;
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".css")) out.push(p);
  }
  return out;
}

function shouldSkip(name) {
  return SKIP_PATTERNS.some(re => re.test(name));
}

function aliasOf(canonical) {
  // --buildrick-bg-panel → --bd-bg-panel
  return canonical.replace(/^--buildrick-/, "--bd-");
}

const tokens = new Set();
for (const f of walk(TARGET)) {
  const css = readFileSync(f, "utf8");
  for (const m of css.matchAll(/var\((--buildrick-[a-z0-9-]+)/g)) {
    if (!shouldSkip(m[1])) tokens.add(m[1]);
  }
}

const sorted = [...tokens].sort();
const lines = [
  "/**",
  " * Vibcoder alias layer (R2 namespace exception).",
  " * Generated by scripts/vibcoder-codemod-3.mjs — DO NOT EDIT BY HAND.",
  " * Maps short --bd-* aliases used by chrome JSX to their canonical",
  " * --buildrick-* defs. Filtered per SCOPE.md Token Filter table.",
  " */",
  "@layer tokens {",
  "  :root {",
  ...sorted.map(t => `    ${aliasOf(t)}: var(${t});`),
  "  }",
  "}",
  "",
];
writeFileSync(OUT, lines.join("\n"));
console.log(`codemod 3: emitted ${sorted.length} aliases`);
```

- [ ] **Step 2:** Smoke test (no tokens yet)

```bash
bun packages/editor/scripts/vibcoder-codemod-3.mjs
cat packages/editor/src/themes/components/_aliases.generated.css
```
Expected: `codemod 3: emitted 0 aliases`. File contains header + empty `@layer tokens { :root { } }`.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/vibcoder-codemod-3.mjs packages/editor/src/themes/components/_aliases.generated.css
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder codemod 3 — filtered alias bridge

Phase A Task 8. Emits --bd-* aliases pointing at folded --buildrick-*
canonical defs, filtered per SCOPE.md Token Filter table (skips
mobile/dashboard/cms/canvas-internal/fab/stage-dark scopes). R2
namespace exception preserves existing chrome JSX.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Shell orchestrator

**Files:**
- Create: `packages/editor/scripts/vibcoder-vendor.sh`

- [ ] **Step 1:** Write the orchestrator (shell, NOT TS — avoids child_process hook)

```bash
#!/usr/bin/env bash
# packages/editor/scripts/vibcoder-vendor.sh
# Vibcoder vendoring pipeline. Sequenced: pin → codemod 1 → 2 → 3.
# @license BSD-3-Clause
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

step() { echo ""; echo "=== $1 ==="; }
fail() { echo "ORCHESTRATOR FAIL: $1"; exit 1; }

step "1/4 bundle pin"
bun packages/editor/scripts/vibcoder-bundle-pin.mjs || fail "bundle pin"

step "2/4 codemod 1: class + animation rename"
bun packages/editor/scripts/vibcoder-codemod-1.mjs || fail "codemod 1"

step "3/4 codemod 2: token fold surface"
bun packages/editor/scripts/vibcoder-codemod-2.mjs || fail "codemod 2"

step "4/4 codemod 3: alias bridge"
bun packages/editor/scripts/vibcoder-codemod-3.mjs || fail "codemod 3"

echo ""
echo "vibcoder-vendor: complete"
```

- [ ] **Step 2:** Make executable + run

```bash
chmod +x packages/editor/scripts/vibcoder-vendor.sh
bash packages/editor/scripts/vibcoder-vendor.sh
```
Expected: 4 numbered steps print, ends with `vibcoder-vendor: complete`.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/vibcoder-vendor.sh
git commit -m "$(cat <<'EOF'
feat(editor): vibcoder-vendor.sh shell orchestrator

Phase A Task 9. Sequences pin → codemod 1 → 2 → 3 with set -e and
explicit step labels. Mirrors ds-grep-gates.sh pattern. Shell instead
of TS to keep child_process out of the build surface.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: npm scripts

**Files:**
- Modify: `packages/editor/package.json` (scripts section)

- [ ] **Step 1:** Read scripts section

```bash
grep -A 20 '"scripts"' packages/editor/package.json | head -30
```

- [ ] **Step 2:** Add 4 new entries to scripts

Use Edit to insert the following keys inside the `"scripts"` object, alphabetized near other `vibcoder:`-style entries (or after `verify:ds`):

```json
"vibcoder:pin": "bun packages/editor/scripts/vibcoder-bundle-pin.mjs",
"vibcoder:vendor": "bash packages/editor/scripts/vibcoder-vendor.sh",
"vibcoder:test": "vitest run packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs",
"vibcoder:check-port": "bash packages/editor/scripts/check-vibcoder-port.sh",
```

- [ ] **Step 3:** Verify scripts run via npm

```bash
cd packages/editor && npm run vibcoder:pin
```
Expected: `pinned: …`

- [ ] **Step 4:** Commit

```bash
git add packages/editor/package.json
git commit -m "$(cat <<'EOF'
chore(editor): vibcoder npm scripts (pin/vendor/test/check-port)

Phase A Task 10. Surfaces orchestrator + tests + per-PR port check
through standard npm script interface.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Gate 19 — bdr-X leak detection

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh`

Append a new gate that fails CI if any `bdr-*` class survives anywhere in the editor source tree (vendored CSS should be 100% `bd-*` after codemod 1).

- [ ] **Step 1:** Read existing gates count

```bash
grep -c "^# Gate " packages/editor/scripts/ds-grep-gates.sh
```
Expected: prints existing gate count (used for sanity).

- [ ] **Step 2:** Append Gate 19 to the file (before the final summary echo)

```bash
# Gate 19: No bdr-* class leaks in editor source
# Vibcoder vendoring renames bdr-* → bd-* via codemod 1. Any survivor is
# either a missed codemod pass or a hand-written regression.
LEAK=$(grep -rE 'bdr-[a-z0-9_-]+' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 19: bdr-* class leak (codemod 1 not applied or hand-written regression)"
fi
pass "Gate 19: no bdr-* class leaks"
```

- [ ] **Step 3:** Run gates

```bash
bash packages/editor/scripts/ds-grep-gates.sh
```
Expected: all gates including Gate 19 PASS.

- [ ] **Step 4:** Commit

```bash
git add packages/editor/scripts/ds-grep-gates.sh
git commit -m "$(cat <<'EOF'
feat(editor): Gate 19 — bdr-* class leak detection

Phase A Task 11. Catches missed codemod 1 passes or hand-written
regressions in vibcoder vendored CSS.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Gate 21 — namespace direction

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh`

Enforces that no chrome source file defines new `--buildrick-color-*` (vibcoder old shape) tokens. The fold table in codemod 2 should be the only place vibcoder names appear, and they should be on the LHS of the fold.

- [ ] **Step 1:** Append Gate 21 after Gate 19

```bash
# Gate 21: No new vibcoder-shape token defs in chrome source
# Vibcoder uses --buildrick-color-* / --buildrick-color-fg-* shapes.
# Buildrik canonical is --buildrick-bg-* / --buildrick-fg-*. New defs
# in vibcoder shape mean someone bypassed codemod 2.
LEAK=$(grep -rE '^\s*--buildrick-(color|color-fg|color-bg)-[a-z0-9-]+\s*:' packages/editor/src --include='*.css' --exclude-dir=components 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 21: vibcoder-shape token def in non-vendored CSS (bypass of codemod 2)"
fi
pass "Gate 21: no vibcoder-shape defs outside vendored components"
```

- [ ] **Step 2:** Run

```bash
bash packages/editor/scripts/ds-grep-gates.sh
```
Expected: PASS.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/ds-grep-gates.sh
git commit -m "$(cat <<'EOF'
feat(editor): Gate 21 — namespace direction enforcement

Phase A Task 12. Blocks vibcoder-shape (--buildrick-color-*) token defs
outside the vendored components dir. Forces all new defs through
codemod 2's fold table.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: check-vibcoder-port.sh — manifest + body line gate

**Files:**
- Create: `packages/editor/scripts/check-vibcoder-port.sh`

Per-PR gate. For every CSS file under `themes/components/<tier>/`, verify (a) it has a corresponding entry in `docs/reference/vibcoder/components/COMPONENTS.md` manifest, and (b) it contains a body class definition matching its filename.

- [ ] **Step 1:** Write the script

```bash
#!/usr/bin/env bash
# packages/editor/scripts/check-vibcoder-port.sh
# Per-PR gate: every ported component file has a manifest entry + body class.
# @license BSD-3-Clause
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

MANIFEST="docs/reference/vibcoder/components/COMPONENTS.md"
TIER_DIR="packages/editor/src/themes/components"
fail() { echo "PORT CHECK FAIL: $1"; exit 1; }
pass() { echo "  PASS: $1"; }

if [ ! -f "$MANIFEST" ]; then
  echo "  SKIP: manifest not found at $MANIFEST (vibcoder bundle not vendored)"
  exit 0
fi

count=0
for tier in atoms molecules organisms layouts; do
  dir="$TIER_DIR/$tier"
  [ -d "$dir" ] || continue
  for f in "$dir"/*.css; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .css)
    [ "$name" = "_aliases.generated" ] && continue
    [ "$name" = "_layer" ] && continue

    # (a) manifest entry — look for `bd-<name>` or `bdr-<name>` in manifest
    if ! grep -qE "(bdr|bd)-${name}\b" "$MANIFEST"; then
      fail "$f: no manifest entry for bd-${name} (or bdr-${name}) in $MANIFEST"
    fi

    # (b) body class — file must define .bd-<name> at column 0 or after whitespace
    if ! grep -qE "^\s*\.bd-${name}(\s|\{|,|:|__|--)" "$f"; then
      fail "$f: no body class definition .bd-${name} found"
    fi
    count=$((count+1))
  done
done

pass "vibcoder port: $count file(s) checked, all have manifest + body class"
```

- [ ] **Step 2:** Make executable + run

```bash
chmod +x packages/editor/scripts/check-vibcoder-port.sh
bash packages/editor/scripts/check-vibcoder-port.sh
```
Expected: either `SKIP: manifest not found …` (if bundle not yet vendored) OR `PASS: vibcoder port: 0 file(s) checked, all have manifest + body class`.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/scripts/check-vibcoder-port.sh
git commit -m "$(cat <<'EOF'
feat(editor): check-vibcoder-port.sh — manifest + body line gate

Phase A Task 13. Per-PR gate. For each file in themes/components/<tier>/,
verifies it appears in COMPONENTS.md manifest and has a body class def
matching its filename. Catches port shortcuts (CSS without manifest
discipline or copy-paste typos).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: CLAUDE.md vibcoder routing section

**Files:**
- Modify: `packages/editor/CLAUDE.md`

Adds a "Vibcoder Position 3 — routing rules" section that future agents (Claude or Codex) will read before touching chrome.

- [ ] **Step 1:** Append the new section to the END of `packages/editor/CLAUDE.md` (after the existing GSTACK section)

```markdown

## Vibcoder Position 3 — Chrome Routing Rules

The chrome layer (sidebar/rail/inspector/topbar/footer) is now governed by the
vibcoder bundle vendored at `src/themes/components/`. Position 3 + R2 namespace
exception: vibcoder canonical names are authoritative; `--bd-*` short aliases
remain for existing chrome JSX via the generated alias layer.

### When porting / modifying chrome

- **Source of truth:** `docs/reference/vibcoder/components/COMPONENTS.md` manifest. Do NOT invent components.
- **Vendoring pipeline:** `npm run vibcoder:vendor` (orchestrates pin + 3 codemods). Never hand-edit files in `src/themes/components/` — they're generated output.
- **Bundle pin:** `.bundle-version` artifact MUST change when bundle changes. PR diff makes "bundle drift" vs "codemod drift" visible.
- **Cascade:** `@layer tokens, components, overrides;`. Vendored CSS lands in `components`. Emotion remains unlayered (always wins) so existing styled() chrome stays authoritative through Phase 1-5 transition.
- **Tokens:** Use canonical `--buildrick-*` names in vendored CSS. Use short `--bd-*` aliases in chrome JSX. Never define new `--buildrick-color-*` shapes (vibcoder shape) in chrome — Gate 21 blocks it.

### CI gates this section enforces

- Gate 19: no `bdr-*` class leaks (codemod 1 must run cleanly)
- Gate 21: no vibcoder-shape token defs in non-vendored CSS
- `vibcoder:check-port`: every file in `components/<tier>/` has manifest entry + body class def

### Codex routing

Codex review for vibcoder ports is **advisory** during Phase 1-4 migration arc and
**blocking** post-Phase 5 (per Pass 6 scope-guardian finding — solo-workflow
mid-arc tier transition is theater, single-mode is honest).

### Phase status

See `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`.
```

- [ ] **Step 2:** Verify

```bash
tail -40 packages/editor/CLAUDE.md
```
Expected: section ends with the roadmap reference.

- [ ] **Step 3:** Commit

```bash
git add packages/editor/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(editor): CLAUDE.md vibcoder Position 3 routing section

Phase A Task 14. Tells future agents (Claude + Codex) the rules for
touching chrome under the vibcoder vendored model. Names the gates
(19, 21, check-port) and the cascade strategy.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Final verification + Phase A summary commit

- [ ] **Step 1:** Run the full gate suite

```bash
cd /Users/shahg/Desktop/pencil/buildrik
bash packages/editor/scripts/ds-grep-gates.sh
bash packages/editor/scripts/check-vibcoder-port.sh
cd packages/editor && npx vitest run scripts/__tests__/vibcoder-codemod.test.mjs
```
Expected: all gates PASS, all 13 codemod tests PASS.

- [ ] **Step 2:** Run vendoring pipeline once end-to-end

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npm --prefix packages/editor run vibcoder:vendor
```
Expected: 4 numbered steps print, ends with `vibcoder-vendor: complete`. `.bundle-version` re-pinned with stable digest.

- [ ] **Step 3:** Type check

```bash
cd packages/editor && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4:** Confirm commit log

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git log --oneline | head -16
```
Expected: 14 Phase A task commits visible (Tasks 1-14 each landed one commit).

- [ ] **Step 5:** Update spec status checkbox

Edit `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md`. Find the Status section. Change `- [ ] Phase 0 POC dispatched` (or whichever Phase A line exists) and add a new line above it:

```markdown
- [x] Phase A infrastructure landed
- [ ] Phase 0 POC dispatched
```

- [ ] **Step 6:** Commit status update

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md
git commit -m "$(cat <<'EOF'
docs(spec): mark Phase A infrastructure complete

Phase A landed (15 tasks, 14 commits). Pipeline + gates + CLAUDE.md
routing all green. Phase 0 POC unblocked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:** Phase A in `roadmap.md` calls for: tier dirs, layer cascade, bundle pin, codemod 1+2+3, tests, orchestrator, npm scripts, Gate 19, Gate 21, check-vibcoder-port, CLAUDE.md routing. All covered above.

**No placeholders:** Every code block is complete. Every regex is concrete. Every commit message is final.

**Type consistency:** Codemod exports use `transform` consistently (cm1/cm2 in test file). `bdr-*` → `bd-*` rename is the same convention everywhere.

**What this plan deliberately does NOT do:** Port any actual component (Phase 0 POC handles that). Extend the codemod 2 fold table beyond the seed entries (Phase 1 tunes per port). Wire vibcoder-vendor.sh into pre-commit/CI (Phase A4 in roadmap intentionally leaves CI wiring for Phase 5 cutover, per scope-guardian finding).
