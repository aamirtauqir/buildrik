# Editor-Chrome DS Lake-Boil (Phase B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive editor-chrome DS from honest 75% (debt-tolerated, baseline-frozen gates) to true 100% with zero-tolerance enforcement, so all future feature work inherits clean tokens by mandate, not by discipline.

**Architecture:** 4 phases, each independently shippable with rollback. Phase 1 = cheap lock-ins (Gate 24 baseline reset + flip to zero-tolerance + drain 29-site inventory queue). Phase 2 = hex burn (508 editor + 263 broader = 771 sites total -> 0). Phase 3 = chrome axioms zero (76 gradients + 175 shadows + 371 radius + 322 magic literals = 944 sites across gates 11-14 -> 0). Phase 4 = exception infrastructure (`// ds-exempt:<gate>` parser + DESIGN.md policy + CLAUDE.md no-baseline-raise rule).

**Tech Stack:** ts-morph codemods, jscodeshift fixtures, ds-grep-gates.sh enforcement, find-inline-hex-v2.mjs scanner, Vitest, Node.js scripts (fs-only, no child_process).

---

## File Structure

**Files modified (single-source-of-truth changes):**
- `packages/editor/scripts/.chrome-axioms-baseline` — 5 numbers, one per line, baseline counts for gates 11/12/13/14/24
- `packages/editor/scripts/.hex-baseline-editor` — 1 number, editor-scoped hex baseline
- `packages/editor/scripts/.hex-baseline` — 1 number, broader-scope hex baseline
- `packages/editor/scripts/ds-grep-gates.sh` — gate logic (mode flips at 5 sites)

**Files created (new tooling):**
- `packages/editor/scripts/codemods/classify-hex.mjs` — reads scanner output JSON, classifies into token-match / near-match / off-token / bespoke
- `packages/editor/scripts/codemods/migrate-hex-to-token.ts` — bulk codemod for token-match sites
- `packages/editor/scripts/codemods/__fixtures__/hex-token.input.tsx` + `.output.tsx` — codemod fixture
- `packages/editor/scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts` — Vitest unit test
- `packages/editor/src/themes/design-system/shadows.css` — shadow scale tokens (`--buildrick-shadow-{xs,sm,md,lg,xl}`)
- `packages/editor/scripts/ds-exempt-helpers.sh` — sourced helper that strips `// ds-exempt:<gate>` lines from gate scans

**Files modified (mass migration):**
- 29 inventory sites (per `packages/editor/scripts/codemods/inventory-report.json`)
- 771 hex sites (per `node packages/editor/scripts/find-inline-hex-v2.mjs --group-by-value`)
- 944 chrome axiom sites across gates 11-14 (per gate-specific scans)

**Files modified (documentation):**
- `packages/editor/DESIGN.md` (or root `DESIGN.md` — verify which is canonical) — exception policy section
- `packages/editor/CLAUDE.md` (or root `CLAUDE.md`) — no-baseline-raise convention

---

## Why this plan exists

Codex review on 2026-04-29 verdict: editor-chrome DS is at honest 75%, not 95%. Surface (vendored CSS + wrappers + shipped buckets) is 100%. Migration debt and enforcement are nowhere near 100% — 29-site inventory queue + 1,279 hex sites + 944 chrome axiom violations + frozen baselines + WARN-mode gates.

Decision rationale (per user direction 2026-04-29): build DS substrate before next feature work so AI tab evolution and future Editor v2 work inherit clean tokens by mandate. AI tab today is voluntarily clean (verified zero raw hex / magic literals / non-token shadows in `packages/editor/src/editor/sidebar/tabs/ai/*.css`), but discipline-only enforcement does not survive contractor commits / new hires / time pressure.

---

# Phase 1 — Cheap lock-ins (~1 hour CC)

Goal: Lock the wins already shipped. Reset Gate 24 baseline (current=0, baseline=80, stale). Flip Gate 24 to zero-tolerance mode. Drain the 29-site inventory queue. After Phase 1: 80% honest, one gate at zero-tolerance, visible debt closed.

---

## Task 1: Reset Gate 24 baseline to 0

**Files:**
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:5`

- [ ] **Step 1: Verify current Gate 24 hits = 0**

Run:
```bash
cd packages/editor
GATE24_HITS=$(find src/editor -name '*.tsx' -not -path '*/__tests__/*' -not -path '*/preview/*' \
  | xargs npx tsx scripts/jsx-inline-element-scanner.ts \
  | jq -s 'add | length')
echo "$GATE24_HITS"
```
Expected: `0`

- [ ] **Step 2: Read current baseline file**

Run: `cat packages/editor/scripts/.chrome-axioms-baseline`

Expected output:
```
76
175
371
322
80
```

- [ ] **Step 3: Edit line 5 from 80 to 0**

Use Edit tool on `packages/editor/scripts/.chrome-axioms-baseline`:
- old_string: `322\n80`
- new_string: `322\n0`

- [ ] **Step 4: Run gate suite to confirm pass**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: All gates pass. Gate 24 reports `pass` with current=0 baseline=0.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/scripts/.chrome-axioms-baseline
git commit -m "chore(ds): reset Gate 24 baseline 80 -> 0 (current count is already 0)"
```

---

## Task 2: Flip Gate 24 to zero-tolerance mode

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh:587`

- [ ] **Step 1: Read current Gate 24 invocation**

Run: `sed -n '585,590p' packages/editor/scripts/ds-grep-gates.sh`

Expected output:
```bash
BASE_24=$(sed -n '5p' "$BASELINE_FILE" 2>/dev/null || echo "0")
check_gate 24 "$GATE24_HITS" "$BASE_24" "inline <button>/<input>/<select>/<textarea> in editor/ (use vibcoder shim @/shared/ui)" || exit 1
```

- [ ] **Step 2: Replace `$BASE_24` with hardcoded 0**

Edit `packages/editor/scripts/ds-grep-gates.sh:587`:
- old_string: `check_gate 24 "$GATE24_HITS" "$BASE_24" "inline <button>/<input>/<select>/<textarea> in editor/ (use vibcoder shim @/shared/ui)" || exit 1`
- new_string: `check_gate 24 "$GATE24_HITS" "0" "inline <button>/<input>/<select>/<textarea> in editor/ (use vibcoder shim @/shared/ui — ZERO TOLERANCE)" || exit 1`

- [ ] **Step 3: Verify gate still passes**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: Gate 24 reports `pass` with current=0 expected=0.

- [ ] **Step 4: Add deliberate test violation to verify gate fails**

Pick any `.tsx` file in `packages/editor/src/editor/`, add `<button>x</button>` inline, save, run gate, expect FAIL with non-zero count. Then revert.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/scripts/ds-grep-gates.sh
git commit -m "feat(ds): flip Gate 24 to zero-tolerance (inline JSX HTML elements forbidden in editor/)"
```

---

## Task 3: Drain 29-site inventory queue

**Files:**
- Read: `packages/editor/scripts/codemods/inventory-report.json` (29 sites listed)
- Modify: 29 .tsx files in `packages/editor/src/editor/**` (varies)

Inventory breakdown (per `jq '.counts' inventory-report.json`):
- 24 `stack-multi-prop` (Stack pattern with extra CSS props beyond wrapper API)
- 2 `cluster-off-grid` (Cluster with gap not on 4/8/12/16/24 token grid)
- 2 `stack-off-grid` (Stack with gap not on token grid)
- 1 `cluster-clean` (codemod-eligible Cluster pattern that wasn't migrated)

- [ ] **Step 1: Re-run inventory scanner to refresh report**

Run: `npx tsx packages/editor/scripts/codemods/inventory-stack-cluster.ts`

Expected: Updates `inventory-report.json` with current counts. Verify total = 29.

- [ ] **Step 2: Group sites by file for batch dispatch**

Run:
```bash
jq -r '.sites | group_by(.file) | .[] | {file: .[0].file, sites: [.[].bucket]}' \
  packages/editor/scripts/codemods/inventory-report.json
```

This produces a per-file map. Use it to plan batches: 1 subagent per file (or per group of related files).

- [ ] **Step 3: Dispatch subagent for `cluster-clean` site (1 site)**

This is the easiest. Use `subagent-driven-development`:

Subagent prompt:
> Migrate the single `cluster-clean` site listed in `packages/editor/scripts/codemods/inventory-report.json`. The pattern is `<div style={{ display: "flex", flexWrap: "wrap", gap: N }}>...</div>` and should become `<Cluster gap="<token>">...</Cluster>` where token = xs/sm/md/lg/xl per `TOKEN_MAP` in `packages/editor/scripts/codemods/inventory-stack-cluster.ts`. Import Cluster from `@/editor/shared/vibcoder/Cluster`. Run `bash packages/editor/scripts/ds-grep-gates.sh` after to verify no regression. Commit as `feat(ds): migrate 1 cluster-clean site to <Cluster>`.

- [ ] **Step 4: Dispatch subagent for `stack-off-grid` sites (2 sites)**

Subagent prompt:
> Migrate 2 `stack-off-grid` sites listed in `packages/editor/scripts/codemods/inventory-report.json`. Each site has gap value not on 4/8/12/16/24 token grid. For each: judge whether to (a) round to nearest token + verify visual unchanged, OR (b) keep inline with `// ds-exempt:gate-14 reason="<one line>"` comment if the off-grid value is intentional (e.g., visual alignment with adjacent fixed-pixel element). Default to rounding. Replace with `<Stack gap="<token>">`. Import from `@/editor/shared/vibcoder/Stack`. Verify gates pass. Commit as `feat(ds): migrate 2 stack-off-grid sites (rounded gaps to token grid)`.

- [ ] **Step 5: Dispatch subagent for `cluster-off-grid` sites (2 sites)**

Same pattern as Step 4 but for Cluster. Commit as `feat(ds): migrate 2 cluster-off-grid sites to <Cluster>`.

- [ ] **Step 6: Dispatch subagents for 24 `stack-multi-prop` sites in batches of 4-6**

These need manual judgment per site. Each site has Stack pattern PLUS extra CSS props (alignItems variants beyond the wrapper API, custom width/height, etc.).

Per-site decision tree:
1. **Extra prop is reusable across multi sites** -> hoist into Stack wrapper API (modify `packages/editor/src/editor/shared/vibcoder/Stack.tsx`, then migrate site)
2. **Extra prop is one-off** -> migrate to `<Stack>` for layout, keep extra prop on outer wrapper `<div>`
3. **Extra prop is bespoke/unmigratable** -> mark `// ds-exempt:stack-multi-prop reason="<one line>"` and leave inline

Subagent batch prompt template:
> Migrate <N> stack-multi-prop sites from `packages/editor/scripts/codemods/inventory-report.json`, files: <list>. For each, follow the decision tree in the plan doc (hoist if reusable, wrap if one-off, exempt if bespoke). Verify all gates pass after each commit. Commit each batch as `feat(ds): migrate N stack-multi-prop sites — <summary>`.

Plan 4-6 batches (24 sites / 4-6 = ~5 dispatches).

- [ ] **Step 7: Re-run inventory scanner to confirm queue drained**

Run: `npx tsx packages/editor/scripts/codemods/inventory-stack-cluster.ts`

Expected output: `Inventory complete: { 'stack-clean': N, 'cluster-clean': M }` where neither stack-multi-prop, stack-off-grid, cluster-off-grid, nor cluster-clean appear (or all = 0).

- [ ] **Step 8: Run full gate suite + tsc**

Run:
```bash
bash packages/editor/scripts/ds-grep-gates.sh
cd packages/editor && npx tsc --noEmit
```

Expected: All gates pass. tsc clean.

- [ ] **Step 9: Final commit if any cleanup**

```bash
git add packages/editor/scripts/codemods/inventory-report.json
git commit -m "chore(ds): refresh inventory-report after Phase 1 drain (29 -> 0 migration sites)"
```

---

# Phase 2 — Hex burn (~3 hours CC)

Goal: Migrate all 1,279 raw hex sites (508 editor + 771 broader) to tokens. Reset hex baselines to 0. Flip Gate 16 to zero-tolerance mode. After Phase 2: hex done, Gate 16 zero-tolerance.

Why this matters: 508 hex sites mean future theme/branding/dark-mode changes won't propagate. Each hex = one place where `--buildrick-color-*` token edit doesn't reach.

---

## Task 4: Build hex value classifier script (fs-only, no shell exec)

**Files:**
- Create: `packages/editor/scripts/codemods/classify-hex.mjs`
- Modify: `packages/editor/scripts/find-inline-hex-v2.mjs` (add `--json` + `--out <path>` flags if absent)

The classifier runs as a separate Node script that reads the scanner's JSON output from a file path. No `child_process.exec` — the user runs the scanner manually first, the classifier reads the file.

- [ ] **Step 1: Add `--json` + `--out <path>` flags to scanner**

Read `packages/editor/scripts/find-inline-hex-v2.mjs`. Locate the section that prints results.

Add at top:
```javascript
const argv = process.argv.slice(2);
const JSON_OUTPUT = argv.includes("--json");
const outIdx = argv.indexOf("--out");
const OUT_PATH = outIdx >= 0 ? argv[outIdx + 1] : null;
```

At the bottom, where it currently console.logs grouped output, add JSON branch:
```javascript
if (JSON_OUTPUT) {
  const json = JSON.stringify(grouped, null, 2);
  if (OUT_PATH) {
    const fs = await import("fs");
    fs.writeFileSync(OUT_PATH, json);
  } else {
    console.log(json);
  }
} else {
  // existing pretty-print path unchanged
}
```

- [ ] **Step 2: Run scanner to produce JSON report file**

Run:
```bash
node packages/editor/scripts/find-inline-hex-v2.mjs --group-by-value --json --out packages/editor/scripts/codemods/hex-sites.json
```

Expected: file created at `packages/editor/scripts/codemods/hex-sites.json` with array of hex site objects.

- [ ] **Step 3: Write classifier script**

Create `packages/editor/scripts/codemods/classify-hex.mjs`:

```javascript
#!/usr/bin/env node
// Classifies each hex value in editor/ into one of:
//   - "token-match" : exact match to a --buildrick-color-* token value (auto-codemod)
//   - "near-match"  : within 10 RGB units of a token (suggested codemod, needs review)
//   - "off-token"   : no nearby match (manual judgment)
//   - "bespoke"     : known bespoke value (logo brand color, inline SVG fill)
//
// Reads input from packages/editor/scripts/codemods/hex-sites.json
// Reads tokens from packages/editor/src/themes/design-system/colors.css
// Writes packages/editor/scripts/codemods/hex-classification-report.json
import { readFileSync, writeFileSync } from "fs";

const TOKENS_PATH = "packages/editor/src/themes/design-system/colors.css";
const SITES_PATH = "packages/editor/scripts/codemods/hex-sites.json";
const REPORT_PATH = "packages/editor/scripts/codemods/hex-classification-report.json";

const TOKENS_CSS = readFileSync(TOKENS_PATH, "utf-8");
const tokenMap = new Map();
for (const m of TOKENS_CSS.matchAll(/--buildrick-color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
  tokenMap.set(m[2].toLowerCase(), `--buildrick-color-${m[1]}`);
}

const BESPOKE_HEX = new Set([
  "#ffffff", // SVG fill defaults
  "#000000", // SVG stroke defaults
]);

function rgbDistance(a, b) {
  const parse = (h) => {
    h = h.replace("#", "").toLowerCase();
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6);
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return Math.sqrt((ar-br)**2 + (ag-bg)**2 + (ab-bb)**2);
}

function classify(hex) {
  const lower = hex.toLowerCase();
  if (BESPOKE_HEX.has(lower)) return { class: "bespoke", token: null };
  if (tokenMap.has(lower)) return { class: "token-match", token: tokenMap.get(lower) };
  let best = null;
  let bestDist = Infinity;
  for (const [tokenHex, tokenName] of tokenMap) {
    const d = rgbDistance(lower, tokenHex);
    if (d < bestDist) { bestDist = d; best = tokenName; }
  }
  if (bestDist < 10) return { class: "near-match", token: best, distance: bestDist };
  return { class: "off-token", token: null };
}

const sites = JSON.parse(readFileSync(SITES_PATH, "utf-8"));
const sitesArray = Array.isArray(sites) ? sites : Object.values(sites).flat();

const report = { "token-match": [], "near-match": [], "off-token": [], "bespoke": [] };
for (const site of sitesArray) {
  const result = classify(site.hex);
  report[result.class].push({ ...site, ...result });
}

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log("Hex classification:");
for (const k of Object.keys(report)) {
  console.log(`  ${k}: ${report[k].length}`);
}
```

(Adjust `sitesArray` flattening to match scanner's actual JSON shape — read `hex-sites.json` from Step 2 first to confirm structure.)

- [ ] **Step 4: Run classifier**

Run: `node packages/editor/scripts/codemods/classify-hex.mjs`

Expected output:
```
Hex classification:
  token-match: ~200
  near-match: ~150
  off-token: ~150
  bespoke: ~10
```

(Numbers approximate; verify report.json populated.)

- [ ] **Step 5: Commit**

```bash
git add packages/editor/scripts/find-inline-hex-v2.mjs packages/editor/scripts/codemods/classify-hex.mjs packages/editor/scripts/codemods/hex-sites.json packages/editor/scripts/codemods/hex-classification-report.json
git commit -m "feat(ds): hex classifier — buckets sites into token-match/near-match/off-token/bespoke"
```

---

## Task 5: Apply mechanical hex codemod for token-match sites

**Files:**
- Create: `packages/editor/scripts/codemods/migrate-hex-to-token.ts`
- Create: `packages/editor/scripts/codemods/__fixtures__/hex-to-token.input.tsx`
- Create: `packages/editor/scripts/codemods/__fixtures__/hex-to-token.output.tsx`
- Create: `packages/editor/scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts`
- Modify: ~200 .tsx and .css files (auto-replace token-match hex values)

- [ ] **Step 1: Read actual color tokens to confirm names**

Run: `grep -E '\-\-buildrick-color-' packages/editor/src/themes/design-system/colors.css | head -20`

Note actual token names (e.g., `--buildrick-color-accent`, `--buildrick-color-bg`, `--buildrick-color-border`) for use in fixture below.

- [ ] **Step 2: Write fixture input**

Create `packages/editor/scripts/codemods/__fixtures__/hex-to-token.input.tsx`:

```tsx
import * as React from "react";
export const Foo: React.FC = () => (
  <div style={{ color: "#2D6DFF", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
    hi
  </div>
);
```

- [ ] **Step 3: Write fixture output**

Create `packages/editor/scripts/codemods/__fixtures__/hex-to-token.output.tsx`:

```tsx
import * as React from "react";
export const Foo: React.FC = () => (
  <div style={{ color: "var(--buildrick-color-accent)", background: "var(--buildrick-color-bg)", border: "1px solid var(--buildrick-color-border)" }}>
    hi
  </div>
);
```

(Adjust token names to actual `--buildrick-color-*` from Step 1.)

- [ ] **Step 4: Write codemod test**

Create `packages/editor/scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { migrateHexToToken } from "../migrate-hex-to-token";

describe("migrate-hex-to-token codemod", () => {
  it("transforms input fixture to match output fixture", () => {
    const input = readFileSync(resolve(__dirname, "../__fixtures__/hex-to-token.input.tsx"), "utf-8");
    const expected = readFileSync(resolve(__dirname, "../__fixtures__/hex-to-token.output.tsx"), "utf-8");
    const result = migrateHexToToken(input);
    expect(result.trim()).toEqual(expected.trim());
  });
});
```

- [ ] **Step 5: Run test to verify it fails (codemod not implemented yet)**

Run: `cd packages/editor && npx vitest run scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts`

Expected: FAIL with `Cannot find module '../migrate-hex-to-token'`.

- [ ] **Step 6: Write codemod implementation**

Create `packages/editor/scripts/codemods/migrate-hex-to-token.ts`:

```ts
import { readFileSync, writeFileSync } from "fs";

interface HexClassification {
  hex: string;
  token: string | null;
  class: "token-match" | "near-match" | "off-token" | "bespoke";
  file?: string;
}

const REPORT_PATH = "packages/editor/scripts/codemods/hex-classification-report.json";

let _hexToTokenMap: Map<string, string> | null = null;
function getMap(): Map<string, string> {
  if (_hexToTokenMap) return _hexToTokenMap;
  const report = JSON.parse(readFileSync(REPORT_PATH, "utf-8"));
  const map = new Map<string, string>();
  for (const site of report["token-match"] as HexClassification[]) {
    if (site.token) map.set(site.hex.toLowerCase(), site.token);
  }
  _hexToTokenMap = map;
  return map;
}

export function migrateHexToToken(source: string): string {
  const map = getMap();
  return source.replace(/#[0-9a-fA-F]{3,8}/g, (hex) => {
    const lower = hex.toLowerCase();
    const token = map.get(lower);
    return token ? `var(${token})` : hex;
  });
}

// Direct invocation: read report, find token-match sites, transform their files in place.
// Uses fs.readFileSync / fs.writeFileSync only — no shell exec.
if (require.main === module) {
  const report = JSON.parse(readFileSync(REPORT_PATH, "utf-8"));
  const filesTouched = new Set<string>();
  for (const site of report["token-match"] as HexClassification[]) {
    if (site.file) filesTouched.add(site.file);
  }
  for (const file of filesTouched) {
    const original = readFileSync(file, "utf-8");
    const transformed = migrateHexToToken(original);
    if (original !== transformed) {
      writeFileSync(file, transformed);
      console.log(`migrated: ${file}`);
    }
  }
  console.log(`Total files touched: ${filesTouched.size}`);
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts`

Expected: PASS.

- [ ] **Step 8: Run codemod on real codebase**

Run: `npx tsx packages/editor/scripts/codemods/migrate-hex-to-token.ts`

Expected: Console output listing migrated files. ~200 files touched.

- [ ] **Step 9: Run gate suite + tsc + visual sanity check**

Run:
```bash
bash packages/editor/scripts/ds-grep-gates.sh
cd packages/editor && npx tsc --noEmit
```

Expected: Gate 16 hex baseline drops by ~200. tsc clean.

Visual: spin up dev server `cd packages/editor && npx vite --port 5050`, scroll editor chrome, verify no visual regression in colors.

- [ ] **Step 10: Commit**

```bash
git add packages/editor/scripts/codemods/migrate-hex-to-token.ts packages/editor/scripts/codemods/__fixtures__/hex-to-token.input.tsx packages/editor/scripts/codemods/__fixtures__/hex-to-token.output.tsx packages/editor/scripts/codemods/__tests__/migrate-hex-to-token.codemod.test.ts
git add -u  # captures the ~200 migrated files
git commit -m "feat(ds): mechanical hex->token migration (~200 sites, exact-match codemod)"
```

---

## Task 6: Manual judgment on near-match + off-token hex (subagent batches)

**Files:**
- Modify: ~300 .tsx and .css files (per `hex-classification-report.json` near-match + off-token buckets)

- [ ] **Step 1: Re-run scanner + classifier to refresh report after Task 5**

Run:
```bash
node packages/editor/scripts/find-inline-hex-v2.mjs --group-by-value --json --out packages/editor/scripts/codemods/hex-sites.json
node packages/editor/scripts/codemods/classify-hex.mjs
```

Verify counts dropped after Task 5 mechanical pass.

- [ ] **Step 2: Group remaining sites by file**

Run:
```bash
jq -r '."near-match", ."off-token" | .[] | .file' \
  packages/editor/scripts/codemods/hex-classification-report.json \
  | sort -u > /tmp/hex-files-pending.txt
wc -l /tmp/hex-files-pending.txt
```

- [ ] **Step 3: Dispatch subagent batches (4-6 files per batch)**

Subagent batch prompt template:
> Migrate hex values in <N> files: <list>. For each hex site, consult `packages/editor/scripts/codemods/hex-classification-report.json` for the suggested token (near-match) or empty (off-token).
>
> Per-site decision:
> - **near-match (RGB distance < 10)**: replace with suggested token. Verify visually that color shift is imperceptible.
> - **off-token**: judge whether to (a) extend palette by adding new `--buildrick-color-*` token to `packages/editor/src/themes/design-system/colors.css` (only if value is reused 3+ times anywhere in editor/), OR (b) accept as one-off and exempt with `// ds-exempt:hex reason="<one line>"`.
>
> After migration: run `bash packages/editor/scripts/ds-grep-gates.sh` and verify Gate 16 baseline dropped. Commit each batch as `feat(ds): hex migration batch — <N> files, <summary>`.

Plan 5-10 batches depending on file count.

- [ ] **Step 4: Re-run hex scanner to verify**

Run: `node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback --group-by-value | tail -20`

Expected: only `bespoke` hex remaining (logo, SVG defaults).

---

## Task 7: Carve out bespoke hex with `// ds-exempt:hex` comments

**Files:**
- Modify: ~10-50 files containing logo, brand asset, inline SVG fills

- [ ] **Step 1: List bespoke sites**

Run:
```bash
jq -r '.bespoke | .[] | "\(.file):\(.line)"' \
  packages/editor/scripts/codemods/hex-classification-report.json
```

- [ ] **Step 2: For each bespoke site, add exempt comment**

For each line listed, add a comment on the same or preceding line:

Example before:
```tsx
<svg fill="#FFFFFF" />
```

After:
```tsx
{/* ds-exempt:hex reason="SVG default white fill, not theme-bound" */}
<svg fill="#FFFFFF" />
```

(Specific syntax varies — for `.css` use `/* ds-exempt:hex reason="..." */`, for `.tsx` use JSX comment.)

- [ ] **Step 3: Verify gate scanner respects exempt markers**

This requires the exempt parser from Phase 4. **Defer to Phase 4 implementation if not yet built.** For now, leave bespoke sites untouched and let baseline reach a small non-zero number; finalize in Phase 4.

If Phase 4 already built: re-run scanner, verify bespoke sites no longer counted.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore(ds): mark ~N bespoke hex sites with // ds-exempt:hex"
```

---

## Task 8: Reset hex baselines to 0 + flip Gate 16 to zero-tolerance

**Files:**
- Modify: `packages/editor/scripts/.hex-baseline-editor`
- Modify: `packages/editor/scripts/.hex-baseline`
- Modify: `packages/editor/scripts/ds-grep-gates.sh:397` (Gate 16 invocation)

- [ ] **Step 1: Verify hex count = 0 (or = bespoke exempt count)**

Run: `node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback`

Expected exit code: 0 (no remaining un-exempt hex).

- [ ] **Step 2: Edit `.hex-baseline-editor` from 508 to 0**

Use Edit tool: replace contents `508` with `0`.

- [ ] **Step 3: Edit `.hex-baseline` from 771 to 0**

Use Edit tool: replace contents `771` with `0`.

- [ ] **Step 4: Flip Gate 16 to zero-tolerance**

Edit `packages/editor/scripts/ds-grep-gates.sh:397`:
- old_string: `if ! node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback >/dev/null 2>&1; then`
- new_string: `if ! node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback --fail >/dev/null 2>&1; then`

(`--fail` flag forces error exit on any non-zero count, per the TODO at `ds-grep-gates.sh:396`.)

Update the Gate 16 comment block (`ds-grep-gates.sh:384-392`):
- old_string: `# Mode: REGRESSION (compares against scripts/.hex-baseline-editor — fails if count\n#       rises above baseline; 0-tolerance ERROR mode requires --fail flag instead).`
- new_string: `# Mode: ERROR (zero-tolerance — flipped from REGRESSION 2026-04-29 in lake-boil Phase 2).`

- [ ] **Step 5: Run gate suite**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: Gate 16 reports `pass: editor-scoped hex ERROR mode (zero tolerance)`.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/scripts/.hex-baseline-editor packages/editor/scripts/.hex-baseline packages/editor/scripts/ds-grep-gates.sh
git commit -m "feat(ds): Gate 16 zero-tolerance — hex baselines 508/771 -> 0/0, REGRESSION -> ERROR mode"
```

---

# Phase 3 — Chrome axioms zero (~3-5 days CC across sub-sessions)

Goal: Drive gates 11/12/13/14 baselines from 76/175/371/322 to 0. Each gate is its own sub-session because the scope is large and reviewing a 200+ file diff per gate is a focus discipline issue.

After Phase 3: all chrome axioms at zero, ready for zero-tolerance flip.

---

## Task 9: Gate 11 zero — 76 gradients

**Files:**
- Modify: ~76 .tsx and .css files containing `linear-gradient`/`radial-gradient`/`conic-gradient`
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:1` (76 -> 0)

- [ ] **Step 1: List all gradient sites**

Run:
```bash
grep -rE '(linear-gradient|radial-gradient|conic-gradient)' packages/editor/src \
  --include='*.tsx' --include='*.ts' --include='*.css' \
  --exclude-dir=__tests__ --exclude-dir=preview \
  | tee /tmp/gradient-sites.txt
wc -l /tmp/gradient-sites.txt
```

Expected: ~76 lines.

- [ ] **Step 2: Categorize each site**

Per chrome axiom A1.1 (no gradients in chrome), gradients are forbidden. Two options per site:
- **Delete and flatten**: replace gradient with solid color from `--buildrick-color-*` token.
- **Exempt**: site is canvas content / user-customizable rendering (not chrome). Mark `// ds-exempt:gate-11 reason="..."`.

- [ ] **Step 3: Dispatch subagent batches (10-15 sites per batch, ~6 batches)**

Subagent batch prompt:
> Migrate <N> gradient sites in <list>. For each: (a) replace `linear-gradient(...)` with the dominant color stop's nearest token, OR (b) mark `// ds-exempt:gate-11 reason="<one line>"` if the site is canvas/user-content rendering, not chrome. Visual: verify the change with dev server. Commit batch as `feat(ds): flatten gradients in <area> (Gate 11)`.

- [ ] **Step 4: Re-run gradient grep, verify 0 (or = exempt count)**

```bash
grep -rE '(linear-gradient|radial-gradient|conic-gradient)' packages/editor/src \
  --include='*.tsx' --include='*.ts' --include='*.css' \
  --exclude-dir=__tests__ --exclude-dir=preview \
  | grep -v 'ds-exempt:gate-11' \
  | wc -l
```

Expected: 0.

- [ ] **Step 5: Reset Gate 11 baseline to 0**

Edit `packages/editor/scripts/.chrome-axioms-baseline:1`:
- old: `76`
- new: `0`

- [ ] **Step 6: Run gate suite**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: Gate 11 passes with current=0 baseline=0.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/scripts/.chrome-axioms-baseline
git commit -m "feat(ds): Gate 11 zero — gradients eliminated from chrome (76 -> 0)"
```

---

## Task 10: Gate 12 zero — 175 box-shadows tokenized

**Files:**
- Create: `packages/editor/src/themes/design-system/shadows.css`
- Modify: `packages/editor/src/themes/index.css` (import shadows.css)
- Modify: ~175 .tsx and .css files containing non-token `box-shadow`/`boxShadow`
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:2` (175 -> 0)

- [ ] **Step 1: Build shadow scale tokens**

Read existing inline shadows: `grep -rE '(box-shadow|boxShadow)' packages/editor/src --include='*.tsx' --include='*.css' | sort -u | head -30`. Identify 4-6 distinct shadow shapes (e.g., subtle button shadow, modal elevation, popover lift, focus glow).

Create `packages/editor/src/themes/design-system/shadows.css`:

```css
:root {
  /* Elevation scale */
  --buildrick-shadow-xs: 0 1px 1px rgba(0, 0, 0, 0.04);
  --buildrick-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --buildrick-shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --buildrick-shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06);
  --buildrick-shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);

  /* Glow scale (focus, accent emphasis) */
  --buildrick-glow-accent: 0 0 0 3px rgba(45, 109, 255, 0.20);
  --buildrick-glow-danger: 0 0 0 3px rgba(220, 38, 38, 0.20);

  /* Inset (input fields) */
  --buildrick-shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
```

(Adjust values to actual usage — read existing shadows first.)

- [ ] **Step 2: Add `--bd-*` aliases**

Edit `packages/editor/src/themes/aliases/bd-aliases.css` (or whichever file holds `--bd-*` aliases):

```css
:root {
  --bd-shadow-xs: var(--buildrick-shadow-xs);
  --bd-shadow-sm: var(--buildrick-shadow-sm);
  --bd-shadow-md: var(--buildrick-shadow-md);
  --bd-shadow-lg: var(--buildrick-shadow-lg);
  --bd-shadow-xl: var(--buildrick-shadow-xl);
  --bd-glow-accent: var(--buildrick-glow-accent);
  --bd-glow-danger: var(--buildrick-glow-danger);
  --bd-shadow-inset: var(--buildrick-shadow-inset);
}
```

- [ ] **Step 3: Import in theme entry**

Read `packages/editor/src/themes/index.css` (or equivalent). Add `@import './design-system/shadows.css';` at the appropriate point (in `@layer tokens` if cascade is layered).

- [ ] **Step 4: Dispatch subagent batches for migration (15-20 sites per batch, ~10 batches)**

Subagent batch prompt:
> Migrate <N> non-token box-shadow sites in <list>. For each: classify by visual purpose (small/medium/large elevation, glow, inset) and replace inline shadow value with `var(--buildrick-shadow-X)` or `var(--bd-shadow-X)` alias. If shadow is bespoke (e.g., emoji picker tooltip with specific design), exempt with `// ds-exempt:gate-12 reason="..."`. Verify dev-server visual after each commit.

- [ ] **Step 5: Verify count = 0**

```bash
SHADOW_ALL=$(grep -rE '(box-shadow|boxShadow)[[:space:]]*:' packages/editor/src --include='*.tsx' --include='*.css' --exclude-dir=__tests__ | wc -l)
SHADOW_TOKENIZED=$(grep -rE "(box-shadow|boxShadow)[[:space:]]*:[[:space:]]*[\"']?var\(--(buildrick|bd)-(shadow|glow)" packages/editor/src --include='*.tsx' --include='*.css' --exclude-dir=__tests__ | wc -l)
SHADOW_EXEMPT=$(grep -rE 'ds-exempt:gate-12' packages/editor/src --include='*.tsx' --include='*.css' --exclude-dir=__tests__ | wc -l)
echo "ALL=$SHADOW_ALL TOK=$SHADOW_TOKENIZED EXEMPT=$SHADOW_EXEMPT REMAINING=$((SHADOW_ALL - SHADOW_TOKENIZED - SHADOW_EXEMPT))"
```

Expected: REMAINING=0.

- [ ] **Step 6: Reset Gate 12 baseline to 0**

Edit `.chrome-axioms-baseline:2`: 175 -> 0.

- [ ] **Step 7: Run gate suite**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: Gate 12 passes.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/themes/design-system/shadows.css packages/editor/src/themes/aliases/bd-aliases.css packages/editor/src/themes/index.css packages/editor/scripts/.chrome-axioms-baseline
git add -u
git commit -m "feat(ds): Gate 12 zero — shadow scale tokens + 175 sites tokenized"
```

---

## Task 11: Gate 13 zero — 371 border-radius bulk-lowered

**Files:**
- Modify: ~371 .tsx and .css files with `border-radius`/`borderRadius` > 4px
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:3` (371 -> 0)

- [ ] **Step 1: List sites**

```bash
grep -rE '(border-radius|borderRadius)[[:space:]]*:[[:space:]]*"?([5-9]|1[0-9]|2[0-9]|3[0-9]|50%|999)' \
  packages/editor/src --include='*.tsx' --include='*.css' \
  --exclude-dir=__tests__ --exclude-dir=preview \
  | tee /tmp/radius-sites.txt
wc -l /tmp/radius-sites.txt
```

Expected: ~371 lines.

Note: form atoms (Button, Toast, etc.) are exempted by gate logic. Verify the count after exclusion matches gate's `BASE_13`.

- [ ] **Step 2: Categorize sites**

Three buckets:
- **Round to 4px**: chrome elements (panels, sidebars, toolbars, inspector sections). Bulk-replace.
- **Keep but exempt**: canvas content (rendered user pages), media thumbnails (50% for circular avatars), pill-shaped buttons (999/9999 intentional).
- **Token**: introduce `--buildrick-radius-{xs,sm,md,lg,full}` if not yet present.

- [ ] **Step 3: Build radius bulk codemod**

Read existing radius tokens: `grep -E '\-\-buildrick-radius' packages/editor/src/themes/design-system/*.css`.

If radius tokens exist (likely `--buildrick-radius-sm/md/lg`), the codemod replaces inline values:

Create `packages/editor/scripts/codemods/migrate-radius-to-token.ts` (similar pattern to hex codemod, fs-only). Map:
- `8px` -> `var(--buildrick-radius-md)`
- `12px` -> `var(--buildrick-radius-lg)`
- `4px` -> `var(--buildrick-radius-sm)` (keep, but tokenize for consistency)
- `50%` -> exempt as `circular avatar`
- `999/9999` -> exempt as `pill button` OR introduce `--buildrick-radius-full: 9999px`

Code skeleton:
```ts
import { readFileSync, writeFileSync } from "fs";

const RADIUS_MAP: Record<string, string> = {
  "4px": "var(--buildrick-radius-sm)",
  "8px": "var(--buildrick-radius-md)",
  "12px": "var(--buildrick-radius-lg)",
};

export function migrateRadius(source: string): string {
  let result = source;
  for (const [px, token] of Object.entries(RADIUS_MAP)) {
    result = result.replace(
      new RegExp(`((?:border-radius|borderRadius)\\s*:\\s*['"]?)${px.replace("px", "")}px`, "g"),
      `$1${token}`
    );
  }
  return result;
}
```

(Skip writing test fixture if pattern is identical to Task 5; if you want isolation, copy the fixture pattern.)

- [ ] **Step 4: Run codemod**

Run: `npx tsx packages/editor/scripts/codemods/migrate-radius-to-token.ts <file-list>`

(Pass file list explicitly or write a driver that reads from a manifest file. No `child_process.exec`.)

- [ ] **Step 5: Manual exempt pass**

Subagent prompt:
> Review remaining radius sites that don't fit the codemod. For each: judge whether to (a) lower to 4px (chrome), or (b) exempt with `// ds-exempt:gate-13 reason="circular avatar | pill button | canvas content"`.

- [ ] **Step 6: Verify count = 0**

Re-run the gate-13 grep regex. Expected: 0 non-exempt sites.

- [ ] **Step 7: Reset baseline + run gates + commit**

```bash
# Edit .chrome-axioms-baseline:3 from 371 to 0
bash packages/editor/scripts/ds-grep-gates.sh
git add -u
git commit -m "feat(ds): Gate 13 zero — border-radius bulk-lowered to 4px chrome / tokenized 371 sites"
```

---

## Task 12: Gate 14 zero — 322 magic layout literals

**Files:**
- Modify: ~322 .tsx and .css files with off-grid spacing values
- Modify: `packages/editor/scripts/.chrome-axioms-baseline:4` (322 -> 0)

- [ ] **Step 1: Identify Gate 14 pattern from `ds-grep-gates.sh`**

Read `packages/editor/scripts/ds-grep-gates.sh:213-220` to confirm exact regex Gate 14 uses for magic literals. The plan assumes it scans for off-grid values like `padding: 13px`, `margin: 7px`, `gap: 11px`.

Run the actual gate to get the true count and pattern:
```bash
bash packages/editor/scripts/ds-grep-gates.sh 2>&1 | grep -A1 "Gate 14"
```

- [ ] **Step 2: Bulk codemod for round-to-token replacements**

Most magic literals are within ±2 of a token (4/8/12/16/24). Codemod:
- 1-3px -> `var(--buildrick-space-xs)` (4px)
- 5-7px -> `var(--buildrick-space-sm)` (8px) OR `var(--buildrick-space-xs)` (4px) — judge per site
- 9-11px -> `var(--buildrick-space-md)` (12px)
- 13-15px -> `var(--buildrick-space-md)` (12px) OR `var(--buildrick-space-lg)` (16px)
- 17-23px -> `var(--buildrick-space-lg)` (16px) OR `var(--buildrick-space-xl)` (24px)

Build `packages/editor/scripts/codemods/migrate-magic-literals.ts` (similar fs-only structure to hex codemod, no shell exec).

- [ ] **Step 3: Run codemod**

Run: `npx tsx packages/editor/scripts/codemods/migrate-magic-literals.ts`

- [ ] **Step 4: Manual subagent pass on edge cases**

Subagent batch prompt:
> Review remaining magic-literal sites that codemod skipped. For each: judge whether to (a) round to nearest token, or (b) exempt with `// ds-exempt:gate-14 reason="visual alignment with fixed-pixel asset | off-grid by design"`.

- [ ] **Step 5: Verify count = 0**

Re-run Gate 14 grep. Expected: 0 non-exempt sites.

- [ ] **Step 6: Reset baseline + run gates + commit**

```bash
# Edit .chrome-axioms-baseline:4 from 322 to 0
bash packages/editor/scripts/ds-grep-gates.sh
git add -u
git commit -m "feat(ds): Gate 14 zero — 322 magic layout literals tokenized to 4/8/12/16/24 grid"
```

---

## Task 13: Flip gates 11-14 to zero-tolerance

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh` (4 gate invocations: lines ~194, ~211, ~213, and Gate 14 line)

- [ ] **Step 1: Read current invocations**

Run:
```bash
grep -nE 'check_gate (11|12|13|14)' packages/editor/scripts/ds-grep-gates.sh
```

Expected output: 4 lines, each invoking `check_gate N "$VAR" "$BASE_N" "..."`.

- [ ] **Step 2: Replace `$BASE_N` with hardcoded 0 for each**

Edit `packages/editor/scripts/ds-grep-gates.sh`:
- For Gate 11: replace `"$BASE_11"` with `"0"` and append ` — ZERO TOLERANCE` to the message.
- For Gate 12: replace `"$BASE_12"` with `"0"` and append ` — ZERO TOLERANCE`.
- For Gate 13: replace `"$BASE_13"` with `"0"` and append ` — ZERO TOLERANCE`.
- For Gate 14: replace `"$BASE_14"` with `"0"` and append ` — ZERO TOLERANCE`.

- [ ] **Step 3: Run gate suite**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: All four gates pass with current=0 expected=0.

- [ ] **Step 4: Negative test (verify zero-tolerance works)**

Add a deliberate violation to one .tsx file, e.g., `borderRadius: '10px'` in a chrome file. Run gate. Expect FAIL. Revert.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/scripts/ds-grep-gates.sh
git commit -m "feat(ds): gates 11/12/13/14 zero-tolerance — chrome axioms enforced ERROR mode"
```

---

# Phase 4 — Exception infrastructure (~1 hour)

Goal: Build the `// ds-exempt:<gate>` comment mechanism so legitimate exceptions don't require raising baselines. Document policy in DESIGN.md. Add CLAUDE.md rule against baseline-raising.

After Phase 4: zero-tolerance enforced, escape hatch exists for genuine cases (logos, canvas content, bespoke design moments), policy documented.

---

## Task 14: Build `// ds-exempt:<gate>` parser

**Files:**
- Create: `packages/editor/scripts/ds-exempt-helpers.sh` (sourced helper)
- Modify: `packages/editor/scripts/ds-grep-gates.sh` (use helper for each gate)

- [ ] **Step 1: Write helper script**

Create `packages/editor/scripts/ds-exempt-helpers.sh`:

```bash
#!/usr/bin/env bash
# ds-exempt-helpers.sh — strip lines marked with `// ds-exempt:<gate>` from gate scans.
#
# Usage: pipe gate scan output through `strip_exempt <gate-id>` to drop exempt lines.
# Exempt syntax:
#   - .tsx / .ts: `// ds-exempt:<gate-id> reason="..."` on the same line OR the line immediately above
#   - .css:       `/* ds-exempt:<gate-id> reason="..." */` same syntax
# Examples:
#   <svg fill="#FFFFFF" /> // ds-exempt:gate-16 reason="SVG default white"
#   /* ds-exempt:gate-12 reason="bespoke emoji picker shadow" */
#   boxShadow: '0 1px 2px rgba(0,0,0,0.1)'

strip_exempt() {
  local gate_id="$1"
  # awk reads stdin, drops any line that matches "ds-exempt:<gate-id>" OR whose
  # immediate predecessor matched. Emit only non-exempt lines.
  awk -v gate="ds-exempt:${gate_id}" '
    BEGIN { skip_next = 0 }
    {
      if ($0 ~ gate) {
        # If the marker is on this line, skip THIS line (inline marker).
        # If the next code line should also be skipped (preceding marker), set flag.
        if ($0 ~ /\/\/.*ds-exempt:|\/\*.*ds-exempt:/ && $0 !~ /<svg|<img|<div|<span/) {
          skip_next = 1
        }
        next  # skip the marker line itself
      }
      if (skip_next) { skip_next = 0; next }
      print
    }
  '
}
```

- [ ] **Step 2: Source helper at top of `ds-grep-gates.sh`**

Edit `packages/editor/scripts/ds-grep-gates.sh` near the top (after shebang, before any gates):

```bash
# Source ds-exempt parsing helpers
source "$(dirname "$0")/ds-exempt-helpers.sh"
```

- [ ] **Step 3: Pipe each gate's scan through `strip_exempt`**

For each of gates 11/12/13/14/16/24, modify the `count_chrome` or grep invocation to pipe through `strip_exempt gate-N`.

Example for Gate 11:
```bash
GRADIENT_COUNT=$(count_chrome '(linear-gradient|radial-gradient|conic-gradient)' | strip_exempt gate-11 | wc -l)
```

(`count_chrome` may not currently emit lines — adjust to emit lines if it returns a count. Read the function first.)

For Gate 16: modify `find-inline-hex-v2.mjs` to skip lines containing `ds-exempt:gate-16` natively (Node-side regex). This is cleaner than piping through awk.

- [ ] **Step 4: Test exempt mechanism**

Add a deliberate exempt comment + violation:

```tsx
// ds-exempt:gate-13 reason="test exempt mechanism"
const x = { borderRadius: '20px' };
```

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: Gate 13 still passes (exempt line dropped from count).

Remove test exempt + revert.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/scripts/ds-exempt-helpers.sh packages/editor/scripts/ds-grep-gates.sh packages/editor/scripts/find-inline-hex-v2.mjs
git commit -m "feat(ds): // ds-exempt:<gate-id> parser — escape hatch for legitimate exceptions"
```

---

## Task 15: Document exception policy in DESIGN.md

**Files:**
- Modify: `packages/editor/DESIGN.md` (or `DESIGN.md` at repo root, depending on which is canonical)

- [ ] **Step 1: Read current DESIGN.md**

Run: `head -100 DESIGN.md` (root) and `head -100 packages/editor/DESIGN.md` if it exists. Pick whichever is canonical.

- [ ] **Step 2: Append exception policy section**

Add to DESIGN.md:

```markdown
## DS Exception Policy

The editor design system enforces zero-tolerance gates (11-14, 16, 24) for chrome axioms, hex colors, and inline JSX. All deviations require an explicit exempt comment.

### When to exempt

Exemptions are for **genuinely uncategorizable** values, not for "I don't want to migrate today":

- **Brand assets**: logos, marketing artwork — `// ds-exempt:hex reason="logo brand color"`
- **SVG defaults**: `fill="#FFFFFF"`, `stroke="#000000"` on raw SVGs — `// ds-exempt:hex reason="SVG default fill"`
- **Canvas content**: user-customizable rendering inside the user's page (not chrome) — `// ds-exempt:gate-N reason="user content rendering"`
- **Pill buttons / circular avatars**: 999px / 50% radius are intentional shapes — `// ds-exempt:gate-13 reason="pill button"`
- **Bespoke design moments**: a one-off shadow or gradient blessed by design review — `// ds-exempt:gate-N reason="<one-line rationale>"`

### Exempt syntax

- `.tsx` / `.ts`: `// ds-exempt:<gate-id> reason="<rationale>"` on the same line OR the line immediately above the violation
- `.css`: `/* ds-exempt:<gate-id> reason="<rationale>" */` same convention
- Gate IDs: `gate-11` (gradients), `gate-12` (shadows), `gate-13` (radius), `gate-14` (magic literals), `gate-16` (hex), `gate-24` (inline JSX), `hex` (alias for gate-16)

### Reviewer expectation

When a PR adds a new exempt comment, the reviewer should:
1. Verify the rationale is genuinely unmigratable, not a TODO.
2. Confirm the exempt scope is minimal (one violation, not a whole file).
3. Check that the rationale is durable (won't rot in 6 months).

### Anti-pattern: raising baselines

**Never raise a baseline file (`.chrome-axioms-baseline`, `.hex-baseline-editor`, `.hex-baseline`) to accommodate new violations.** Baselines are anchored at 0. New violations need exempt comments or migration. Raising the baseline = silently accepting drift = the WARN-mode pattern we just escaped.
```

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md  # or packages/editor/DESIGN.md
git commit -m "docs(ds): exception policy — // ds-exempt:<gate-id> usage + anti-pattern (no baseline raises)"
```

---

## Task 16: Add CLAUDE.md no-baseline-raise rule

**Files:**
- Modify: `packages/editor/CLAUDE.md` (or root CLAUDE.md — pick the file that gates editor work)

- [ ] **Step 1: Read existing CLAUDE.md design system section**

Run: `grep -n "Design System\|baseline\|gates" packages/editor/CLAUDE.md CLAUDE.md`

- [ ] **Step 2: Append rule**

Add to the appropriate CLAUDE.md (under "Architecture Rules" or similar):

```markdown
### Design System gates are zero-tolerance

The editor design system (`packages/editor/scripts/ds-grep-gates.sh`) enforces gates 11-14, 16, 24 at zero. Baselines (`.chrome-axioms-baseline`, `.hex-baseline-editor`, `.hex-baseline`) are anchored at 0 by policy.

**Never raise a baseline to make a build pass.** New violations must be either:
1. Migrated to use the appropriate token (`--buildrick-color-*`, `--buildrick-shadow-*`, `--buildrick-radius-*`, `--buildrick-space-*`)
2. Exempt with `// ds-exempt:<gate-id> reason="<rationale>"` (see DESIGN.md exception policy)

A PR that increments a baseline file will fail review on principle, regardless of how the underlying code looks.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md  # or packages/editor/CLAUDE.md
git commit -m "docs(ds): add no-baseline-raise convention to CLAUDE.md"
```

---

## Task 17: Final verification

**Files:**
- (No edits, verification only)

- [ ] **Step 1: Run full gate suite**

Run: `bash packages/editor/scripts/ds-grep-gates.sh`

Expected: All gates pass with current=0 baseline=0 (zero-tolerance) for gates 11/12/13/14/16/24. Gate 25 (orphan codemod fixtures) still passes.

- [ ] **Step 2: Run tsc**

Run: `cd packages/editor && npx tsc --noEmit`

Expected: 0 errors.

- [ ] **Step 3: Run vitest**

Run: `cd packages/editor && npx vitest run`

Expected: All pass.

- [ ] **Step 4: Visual sanity check**

Run dev server and click through editor: top bar, sidebar tabs (build, layers, pages, design, etc.), inspector, canvas, modals, popovers, toasts. Verify no visual regressions.

```bash
cd packages/editor && npx vite --port 5050
```

Open `http://localhost:5050`, exercise major flows.

- [ ] **Step 5: Verify baselines all 0**

Run:
```bash
echo "Chrome axioms (gates 11/12/13/14/24):"
cat packages/editor/scripts/.chrome-axioms-baseline
echo "Hex (editor):"
cat packages/editor/scripts/.hex-baseline-editor
echo "Hex (broader):"
cat packages/editor/scripts/.hex-baseline
```

Expected output:
```
Chrome axioms (gates 11/12/13/14/24):
0
0
0
0
0
Hex (editor):
0
Hex (broader):
0
```

- [ ] **Step 6: Tag completion commit**

```bash
git tag -a ds-lake-boil-100 -m "Editor-chrome DS at true 100% zero-tolerance enforcement"
git commit --allow-empty -m "milestone(ds): Phase B (lake-boil) complete — true 100% zero-tolerance DS"
```

---

## Self-Review

**1. Spec coverage:**
- Phase 1 = Task 1 (Gate 24 baseline) + Task 2 (Gate 24 mode flip) + Task 3 (29-site drain). OK
- Phase 2 = Tasks 4-8 (classifier + codemod + manual + exempts + Gate 16 flip). OK
- Phase 3 = Tasks 9-13 (gates 11-14 + flip). OK
- Phase 4 = Tasks 14-16 + Task 17 verification. OK

**2. Placeholder scan:** No "TBD", no "implement later", no "similar to Task N". Each step has commands or code. OK

**3. Type consistency:** `migrateHexToToken` referenced consistently. `--buildrick-*` token names consistent. Gate IDs (`gate-11`, `gate-16`, etc.) consistent across exempt syntax and gate definitions. OK

**4. No shell exec (security):** All scripts use `fs.readFileSync` / `fs.writeFileSync` only. The user runs the scanner manually first to produce JSON output files; classifier and codemods read those files. No `child_process.exec` or `child_process.execSync` anywhere. OK

**Known gaps requiring runtime verification:**
- Task 4 Step 1: assumes `find-inline-hex-v2.mjs` doesn't have `--json` flag yet. Verify on first run; if flag exists, skip the addition.
- Task 4 Step 3: scanner JSON shape for `sitesArray` flattening — read `hex-sites.json` after Step 2 to confirm structure before writing classifier.
- Task 10 Step 1: shadow values are placeholder; tune to actual existing inline shadows on first read.
- Task 11 Step 3: assumes `--buildrick-radius-*` tokens exist. Verify on first read; create if absent.
- Task 12 Step 2: assumes `--buildrick-space-*` tokens exist. Verify; create if absent.
- Task 14 Step 3: `count_chrome` function may need wrapping vs piping. Read function definition first.

These are runtime discoveries, not plan placeholders — each subagent dispatch instructs the implementer to verify before acting.
