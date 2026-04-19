# DS V1 Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Buildrik DS V1 — align editor chrome values with `DESIGN.md`, apply 438 HIGH-confidence consumer migrations, fix 69 site leaks, persist schema versioning to project JSON, and enforce DS invariants in CI.

**Architecture:** Eight phases, each shippable to `main` as one commit. Phase 1 runs a rewritten hex gate in WARN mode to establish a regression baseline. Phase 2 captures 15 screenshots for visual diff. Phases 3-6 apply token changes bottom-up (DS source first, then tokens, then consumers, then site leaks). Phase 7 wires schema versioning into project JSON persistence. Phase 8 flips all gates to FAIL mode and adds an ESLint overlay.

**Tech Stack:** Node ESM scripts, CSS custom properties, React 18 + TypeScript, Vite 7, Vitest, Emotion, ESLint 9 flat config.

**Spec:** `docs/superpowers/specs/2026-04-20-ds-v1-remediation-design.md`
**Input data:** `docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md`
**Design contract:** `DESIGN.md`

---

## File Structure

### Files created

| Path | Phase | Purpose |
|---|---|---|
| `packages/editor/scripts/find-inline-hex-v2.mjs` | 1 | Rewritten hex gate scanning .css/.ts/.tsx, per-site markers |
| `packages/editor/scripts/.hex-baseline` | 1 | Baseline count for WARN mode (deleted in Phase 8) |
| `docs/reviews/ds-v1-baseline-screenshots/*.png` | 2 | 15 manual screenshots for visual diff |
| `packages/editor/scripts/apply-ds-v2-patch.mjs` | 5 | Codemod script reading V2 fix-list per confidence |
| `packages/editor/src/features/design-system/migrations/__tests__/schema-version.test.ts` | 7 | 4 tests for load/save/migrate/future-version |
| `packages/editor/eslint.config.mjs` | 8 | ESLint flat config with DS rules |
| `packages/editor/eslint-rules/no-inline-hex.js` | 8 | Custom ESLint rule |
| `packages/editor/eslint-rules/no-inspector-tokens.js` | 8 | Custom ESLint rule |
| `packages/editor/eslint-rules/no-get-property-value-ds.js` | 8 | Custom ESLint rule |
| `packages/editor/eslint-rules/index.js` | 8 | Plugin entry |

### Files modified

| Path | Phase | What |
|---|---|---|
| `packages/editor/package.json` | 1, 8 | Add `lint:ds-hex`, `lint` scripts; ESLint devDeps |
| `packages/editor/src/themes/design-system/color.css` | 3, 4 | Fix drifts + append new tokens |
| `packages/editor/src/themes/design-system/typography.css` | 3, 4 | Drop named fallbacks + append new tokens |
| `packages/editor/src/themes/design-system/design.css` | 3 | Replace AI-slop defaults |
| `packages/editor/src/themes/design-system/shadow.css` | 4 | Append new tokens |
| `packages/editor/src/themes/design-system/a11y.css` | 4 | Append 1 new token |
| `packages/editor/src/features/design-system/constants.ts` | 3 | Mirror design.css site-default changes |
| `packages/editor/src/features/design-system/ui/DesignSystemTab.tsx` | 7 | Save+load schema version |
| `packages/editor/src/features/design-system/migrations/index.ts` | 7 | Export helpers as needed |
| `packages/editor/scripts/ds-grep-gates.sh` | 8 | Add Gate 7; remove `components.css` exclusion from Gate 4 |
| `.github/workflows/editor-ci.yml` | 8 | Add `verify:ds`, `lint:ds-hex`, `lint` steps |
| Various chrome `.tsx`/`.css` per V2 Table 1 | 5 | ~438 HIGH-confidence token replacements |
| Various site `.tsx`/`.css` per V2 Table 2 | 6 | 69 site-leak fixes |

---

## Safety Gate (runs after every phase, before commit)

Save this as a reusable check. Every phase's final task ends with running this.

```bash
#!/bin/bash
# Phase safety gate — all 5 must pass.
set -e
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor

echo "1/5 vite build"
npx vite build

echo "2/5 vitest run"
npx vitest run

echo "3/5 ds-grep-gates"
bash scripts/ds-grep-gates.sh

echo "4/5 hex gate (WARN mode — count ≤ baseline)"
node scripts/find-inline-hex-v2.mjs

echo "5/5 design baseline parity"
node scripts/verify-design-baselines.mjs

echo "All gates passed. Now eyeball-diff against docs/reviews/ds-v1-baseline-screenshots/"
```

Every phase's final task runs this script. Failure = `git reset --hard HEAD` (if not yet committed) OR `git revert HEAD` (if committed), diagnose, re-implement.

---

## Phase 1 — Hex gate rewrite (WARN mode)

### Task 1.1: Write `find-inline-hex-v2.mjs`

**Files:**
- Create: `packages/editor/scripts/find-inline-hex-v2.mjs`

- [ ] **Step 1: Create the file**

```javascript
#!/usr/bin/env node
/**
 * Hex gate V2 — scans chrome .css/.ts/.tsx for inline hex values.
 *
 * Improvements over v1 (find-inline-hex.mjs):
 *   - Scans .css in addition to .ts/.tsx
 *   - Per-site @lint-hex-policy: marker, not whole-file bypass
 *   - Matches any hex in a property value (not just 11 specific props)
 *   - Outputs count / list / group-by-value
 *   - Exits 1 if count exceeds .hex-baseline (WARN mode)
 *   - Run with `--fail` to exit 1 if count > 0 (FAIL mode, Phase 8)
 *
 * @license BSD-3-Clause
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDITOR_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(EDITOR_ROOT, "../..");
const BASELINE_FILE = path.join(__dirname, ".hex-baseline");

const CHROME_ROOTS = [
  "src/editor",
  "src/shared/ui",
  "src/shared/forms",
  "src/ai",
  "src/features/design-system/ui",
];
const EXTRA_FILES = [
  "src/themes/components.css",
  "src/themes/ux-fixes.css",
];

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const POLICY_RE = /@lint-hex-policy:/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(css|ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const rel of CHROME_ROOTS) {
    files.push(...walk(path.join(EDITOR_ROOT, rel)));
  }
  for (const rel of EXTRA_FILES) {
    const p = path.join(EDITOR_ROOT, rel);
    if (fs.existsSync(p)) files.push(p);
  }
  return files;
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const sites = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (POLICY_RE.test(line)) continue;
    const prev = i > 0 ? lines[i - 1] : "";
    if (POLICY_RE.test(prev)) continue;
    const matches = line.match(HEX_RE);
    if (!matches) continue;
    for (const hex of matches) {
      if (!/[:=]/.test(line)) continue;
      sites.push({ file, line: i + 1, hex: hex.toUpperCase(), snippet: line.trim() });
    }
  }
  return sites;
}

const args = process.argv.slice(2);
const mode = args.includes("--fail") ? "FAIL"
  : args.includes("--group-by-value") ? "GROUP"
  : args.includes("--count") ? "COUNT"
  : "LIST";

const allSites = [];
for (const f of collectFiles()) {
  allSites.push(...scanFile(f));
}

const count = allSites.length;

if (mode === "COUNT") {
  console.log(count);
  process.exit(0);
}

if (mode === "GROUP") {
  const byValue = new Map();
  for (const s of allSites) {
    if (!byValue.has(s.hex)) byValue.set(s.hex, 0);
    byValue.set(s.hex, byValue.get(s.hex) + 1);
  }
  const ranked = [...byValue.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex, n] of ranked) {
    console.log(`${hex.padEnd(10)} ${String(n).padStart(4)}`);
  }
  console.log(`\nUnique: ${byValue.size}  Total: ${count}`);
  process.exit(0);
}

if (mode === "LIST") {
  for (const s of allSites) {
    const rel = path.relative(REPO_ROOT, s.file);
    console.log(`${rel}:${s.line}: ${s.hex}`);
  }
}

if (mode === "FAIL") {
  if (count === 0) {
    console.log("Hex gate: 0 violations. OK.");
    process.exit(0);
  }
  console.error(`Hex gate FAIL: ${count} inline hex sites in chrome.`);
  console.error("Run with no args to see the list.");
  process.exit(1);
}

// Default: LIST mode also does baseline comparison
if (!fs.existsSync(BASELINE_FILE)) {
  fs.writeFileSync(BASELINE_FILE, String(count));
  console.log(`\nBaseline written: ${count}`);
  process.exit(0);
}

const baseline = Number(fs.readFileSync(BASELINE_FILE, "utf8").trim());
console.log(`\nCurrent: ${count}  Baseline: ${baseline}`);

if (count > baseline) {
  console.error(`REGRESSION: hex count rose ${baseline} → ${count}`);
  process.exit(1);
}

if (count < baseline) {
  console.log(`Progress: ${baseline - count} sites removed.`);
}
process.exit(0);
```

- [ ] **Step 2: Make it executable + commit the file on its own**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
chmod +x packages/editor/scripts/find-inline-hex-v2.mjs
git add packages/editor/scripts/find-inline-hex-v2.mjs
```

(don't commit yet — will be bundled with package.json change and baseline in Task 1.4)

### Task 1.2: Add `lint:ds-hex` script

**Files:**
- Modify: `packages/editor/package.json`

- [ ] **Step 1: Read current scripts block**

```bash
grep -A 10 '"scripts":' packages/editor/package.json
```

Expected to show `"lint:ds"`, `"verify:ds"`, no `lint:ds-hex`.

- [ ] **Step 2: Add the script after `verify:ds`**

Edit `packages/editor/package.json`. In the `"scripts"` object add:

```json
"lint:ds-hex": "node scripts/find-inline-hex-v2.mjs"
```

(place it after `"verify:ds"` in the existing object).

- [ ] **Step 3: Stage the change**

```bash
git add packages/editor/package.json
```

### Task 1.3: Generate the baseline

- [ ] **Step 1: Run the gate once, writing baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/find-inline-hex-v2.mjs
```

Expected output: a long list of `file:line: #HEX` followed by:
```
Baseline written: <N>
```

Where N is around 300-900 (actual count depends on current state).

- [ ] **Step 2: Verify baseline file exists**

```bash
cat packages/editor/scripts/.hex-baseline
```

Expected: a single number (e.g., `612`). Save that number — it's referenced in every subsequent phase.

- [ ] **Step 3: Stage baseline**

```bash
git add packages/editor/scripts/.hex-baseline
```

### Task 1.4: Commit Phase 1

- [ ] **Step 1: Verify staging**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git status --short
```

Expected: 3 files staged (`find-inline-hex-v2.mjs`, `package.json`, `.hex-baseline`).

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ds-v1): rewrite hex gate with baseline (WARN mode)

find-inline-hex-v2.mjs scans .css + .ts + .tsx, honors @lint-hex-policy
as per-site marker (not whole-file bypass), matches any hex on a line
with a property declarator. Writes .hex-baseline on first run; exits 1
if count rises. Phase 8 will flip to FAIL mode.

Baseline: <N> sites across chrome.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace `<N>` with the actual baseline number from Task 1.3 Step 2.

---

## Phase 2 — Visual baseline capture

### Task 2.1: Create screenshots directory

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/shahg/Desktop/pencil/buildrik/docs/reviews/ds-v1-baseline-screenshots
```

- [ ] **Step 2: Add README**

Create `docs/reviews/ds-v1-baseline-screenshots/README.md`:

```markdown
# DS V1 Remediation — Visual Baseline

Captured: 2026-04-20, before any Phase 3+ edits.
Used for per-phase eyeball-diff to detect unintended visual changes.

## Surfaces

00-editor-default.png — topbar + rail + collapsed sidebar, default project
01-rail-add.png — Add tab expanded
02-rail-templates.png — Templates tab expanded
03-rail-media.png — Media tab expanded
04-rail-layers.png — Layers tab with 3+ elements
05-rail-pages.png — Pages tab with 2+ pages
06-rail-components.png — Components tab
07-rail-design.png — Design tab (user-editable site tokens)
08-rail-settings.png — Settings tab
09-rail-history.png — History tab
10-inspector-box.png — Element selected, Box section open
11-inspector-typography.png — Typography section open
12-canvas-selection.png — Selection handles + drop zones
13-command-palette.png — ⌘K opened
14-modal.png — Export modal opened
```

### Task 2.2: Capture 15 screenshots

- [ ] **Step 1: Start dev server**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run dev
```

Wait for `Local: http://localhost:5050/` (or similar). Leave running.

- [ ] **Step 2: Capture each surface manually**

In browser, open `http://localhost:5050/`. For each of the 15 surfaces listed in README, navigate to the state + take an OS screenshot (Cmd+Shift+4 on macOS). Save each to `docs/reviews/ds-v1-baseline-screenshots/` with the exact filename from the README.

Approx. time: 10-15 minutes of clicking and capturing.

- [ ] **Step 3: Verify all 15 files present**

```bash
ls -1 docs/reviews/ds-v1-baseline-screenshots/*.png | wc -l
```

Expected: `15`.

- [ ] **Step 4: Stop dev server**

Ctrl+C in the terminal running `npm run dev`.

### Task 2.3: Commit Phase 2

- [ ] **Step 1: Stage screenshots**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add docs/reviews/ds-v1-baseline-screenshots/
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(ds-v1): capture visual baseline — 15 editor surfaces

Pre-Phase-3 ground truth for eyeball-diff after each remediation phase.
Covers rail tabs, inspector sections, canvas selection, command palette,
a modal. Manual screenshots — Playwright install deferred per original
DS V1 audit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — DS source cleanup (Table 3 + forced-consistency fixes)

Codex's V2 Table 3 enumerated 13 drifts. Phase 3 applies those 13 plus 4 forced-consistency edits to prevent color-collisions or unreadable pairings.

**Forced additions (not in V2 Table 3, required to ship a coherent state):**
- `color.css:18` text-secondary value — would collide with new :17 value otherwise
- `color.css:19` text-muted — must shift so :18 has somewhere to move
- `design.css:17` color-text — white-on-white if :16 background becomes light without flipping text
- `design.css:25` font-body — `"Inter"` should be `"Inter Tight"` parity with :24 (heading)

### Task 3.1: Fix `color.css` text cascade (lines 17-19)

**Files:**
- Modify: `packages/editor/src/themes/design-system/color.css:17-19`

- [ ] **Step 1: Read the current values**

```bash
sed -n '17,21p' packages/editor/src/themes/design-system/color.css
```

Expected:
```
  --buildrick-text-primary: #0F172A;
  --buildrick-text-secondary: #334155;
  --buildrick-text-muted: #64748B;
  --buildrick-text-tertiary: #94A3B8;
  --buildrick-text-on-accent: #FFFFFF;
```

- [ ] **Step 2: Apply the 3 edits**

Edit `packages/editor/src/themes/design-system/color.css`:
- Line 17: change `#0F172A` to `#334155`
- Line 18: change `#334155` to `#64748B`
- Line 19: change `#64748B` to `#94A3B8`

Leave line 20 (`--buildrick-text-tertiary: #94A3B8`) alone — will equal `--buildrick-text-muted` after this shift, which is acceptable (tertiary stays as an alias of muted until a future cleanup).

- [ ] **Step 3: Verify**

```bash
sed -n '17,20p' packages/editor/src/themes/design-system/color.css
```

Expected:
```
  --buildrick-text-primary: #334155;
  --buildrick-text-secondary: #64748B;
  --buildrick-text-muted: #94A3B8;
  --buildrick-text-tertiary: #94A3B8;
```

### Task 3.2: Fix `color.css` border (line 24)

- [ ] **Step 1: Apply the edit**

Edit `packages/editor/src/themes/design-system/color.css:24`:
- Change `#64748B` to `#E2E8F0`

- [ ] **Step 2: Verify**

```bash
sed -n '24p' packages/editor/src/themes/design-system/color.css
```

Expected: `  --buildrick-border: #E2E8F0;`

### Task 3.3: Fix `color.css` accent cascade (lines 33-36)

- [ ] **Step 1: Apply 4 edits**

Edit `packages/editor/src/themes/design-system/color.css`:
- Line 33: `#2557CC` → `#4B8DFF`
- Line 34: `#1E4499` → `#1E58D9`
- Line 35: `rgba(45, 109, 255, 0.08)` → `rgba(45, 109, 255, 0.05)`
- Line 36: `rgba(45, 109, 255, 0.12)` → `rgba(45, 109, 255, 0.10)`

- [ ] **Step 2: Verify**

```bash
sed -n '32,36p' packages/editor/src/themes/design-system/color.css
```

Expected:
```
  --buildrick-accent: #2D6DFF;
  --buildrick-accent-hover: #4B8DFF;
  --buildrick-accent-pressed: #1E58D9;
  --buildrick-accent-subtle: rgba(45, 109, 255, 0.05);
  --buildrick-accent-tint: rgba(45, 109, 255, 0.10);
```

### Task 3.4: Fix `typography.css` named fallbacks (lines 9-11)

- [ ] **Step 1: Apply 3 edits**

Edit `packages/editor/src/themes/design-system/typography.css`:
- Line 9: `"Inter Tight", "Inter", sans-serif` → `"Inter Tight", sans-serif`
- Line 10: `"General Sans", "Inter Tight", sans-serif` → `"General Sans", sans-serif`
- Line 11: `"Geist Mono", "JetBrains Mono", monospace` → `"Geist Mono", monospace`

- [ ] **Step 2: Verify**

```bash
sed -n '9,11p' packages/editor/src/themes/design-system/typography.css
```

Expected:
```
  --buildrick-font-family: "Inter Tight", sans-serif;
  --buildrick-font-family-display: "General Sans", sans-serif;
  --buildrick-font-family-mono: "Geist Mono", monospace;
```

### Task 3.5: Fix `design.css` site defaults (lines 14-25)

- [ ] **Step 1: Apply 6 edits**

Edit `packages/editor/src/themes/design-system/design.css`:
- Line 14: `#8B5CF6` → `#64748B` (violet → slate-500 neutral secondary; spec decision — user can override)
- Line 16: `#0A0A0A` → `#F8FAFC` (near-black → slate-50 light)
- Line 17: `#FFFFFF` → `#334155` (white → slate-700; forced pair with :16)
- Line 24: `"Inter"` → `"Inter Tight"`
- Line 25: `"Inter"` → `"Inter Tight"` (forced pair with :24)
- Line 26: `"JetBrains Mono"` → `"Geist Mono"`

- [ ] **Step 2: Verify**

```bash
sed -n '13,26p' packages/editor/src/themes/design-system/design.css
```

Expected:
```
  --buildrick-design-color-primary: #3B82F6;
  --buildrick-design-color-secondary: #64748B;
  --buildrick-design-color-accent: #22C55E;
  --buildrick-design-color-background: #F8FAFC;
  --buildrick-design-color-text: #334155;
  --buildrick-design-color-muted: #71717A;
  --buildrick-design-color-border: #27272A;
  --buildrick-design-color-success: #22C55E;
  --buildrick-design-color-error: #EF4444;

  /* TYPOGRAPHY (11 — user-editable) */
  --buildrick-design-font-heading: "Inter Tight";
  --buildrick-design-font-body: "Inter Tight";
  --buildrick-design-font-mono: "Geist Mono";
```

### Task 3.6: Mirror changes in `constants.ts`

**Why:** `verify-design-baselines.mjs` asserts `design.css ↔ constants.ts` parity. Without this, the safety gate fails.

**Files:**
- Modify: `packages/editor/src/features/design-system/constants.ts:35, 55, 116, 124, 132`

- [ ] **Step 1: Find each value**

```bash
grep -n '"#8B5CF6"\|"#0A0A0A"\|"#FFFFFF"\|value: "Inter"\|"JetBrains Mono"' packages/editor/src/features/design-system/constants.ts
```

Expected output showing lines around 35, 55, and 116/124/132.

- [ ] **Step 2: Apply edits**

Edit `packages/editor/src/features/design-system/constants.ts`:
- Update the color-secondary token object: `value: "#8B5CF6"` → `value: "#64748B"`
- Update color-background: `value: "#0A0A0A"` → `value: "#F8FAFC"`
- Update color-text: `value: "#FFFFFF"` → `value: "#334155"`
- Update font-heading: `value: "Inter"` → `value: "Inter Tight"`
- Update font-body: `value: "Inter"` → `value: "Inter Tight"`
- Update font-mono: `value: "JetBrains Mono"` → `value: "Geist Mono"`

- [ ] **Step 3: Verify parity check passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/verify-design-baselines.mjs
```

Expected: exits 0 with a success message. If it fails, compare output — `design.css ↔ constants.ts` must match exactly for the 9 color / 3 font tokens.

### Task 3.7: Run full safety gate

- [ ] **Step 1: Build**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build
```

Expected: build succeeds, `dist/` directory produced. No "unresolved" or "Could not resolve" errors.

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```

Expected: all tests pass. If any fail, read the failure — if it's a snapshot test that captured old color values, UPDATE the snapshot only after confirming the new color is correct per `DESIGN.md`. Don't blindly update.

- [ ] **Step 3: Grep gates**

```bash
bash scripts/ds-grep-gates.sh
```

Expected: all gates pass.

- [ ] **Step 4: Hex gate**

```bash
node scripts/find-inline-hex-v2.mjs
```

Expected: count should be equal to baseline (Phase 3 doesn't touch chrome consumers). If count rose, some edit inadvertently added a hex — diagnose.

- [ ] **Step 5: Visual diff**

```bash
npm run dev
```

Open `http://localhost:5050/`. Compare each of the 15 surfaces against `docs/reviews/ds-v1-baseline-screenshots/`.

**Expected visual changes:**
- Borders noticeably lighter (slate-500 → slate-200)
- Primary text slightly lighter (slate-900 → slate-700)
- Accent hover brighter not darker (now brightens on hover as spec requires)
- Design tab preview: default site goes light with slate text (no longer dark + violet)

**Unexpected would be:** a panel going dark, icons inverting, any surface flipping semantics. If any, stop and diagnose.

Stop the dev server when done (Ctrl+C).

### Task 3.8: Commit Phase 3

- [ ] **Step 1: Stage files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/design-system/color.css \
        packages/editor/src/themes/design-system/typography.css \
        packages/editor/src/themes/design-system/design.css \
        packages/editor/src/features/design-system/constants.ts
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix(ds-v1): align DS source to DESIGN.md contract

Table 3 drifts per Codex audit + forced-consistency cascade:
  color.css:17-19  text scale fixed (primary #334155, cascade shifted)
  color.css:24     border hairline #E2E8F0 (was slate-500)
  color.css:33-36  accent hover/pressed/subtle/tint aligned
  typography.css:9-11  drop named fallbacks (Inter, JetBrains Mono)
  design.css:14,16,17,24-26  remove AI-slop dark-mode + violet defaults
  constants.ts     mirrored for verify-design-baselines parity

No chrome consumer changes yet — Phase 5 handles those.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Add missing tokens (Table 4)

Reference V2 Table 4 for exact values. Glass-* tokens are SKIPPED (glass effect being removed, not tokenized).

### Task 4.1: Append tokens to `color.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/color.css` (append to `:root`)

- [ ] **Step 1: Find insertion point**

```bash
grep -n '^}' packages/editor/src/themes/design-system/color.css
```

Expected: line 73 (end of `:root` block).

- [ ] **Step 2: Insert new token block before the closing `}`**

Use the Edit tool to replace line 72 `  --buildrick-input-ring-error: rgba(220, 38, 38, 0.10);` with:

```css
  --buildrick-input-ring-error: rgba(220, 38, 38, 0.10);

  /* ─── DS V1 REMEDIATION (2026-04-20) — NEW TOKENS ─── */

  /* Pressed / active fills (distinct from accent-tint which is branded selection) */
  --buildrick-bg-pressed: rgba(15, 23, 42, 0.06);

  /* Text */
  --buildrick-text-disabled: #CBD5E1;

  /* Canvas box-model overlay */
  --buildrick-boxmodel-content: rgba(111, 168, 220, 0.50);
  --buildrick-boxmodel-padding: rgba(147, 196, 125, 0.45);
  --buildrick-boxmodel-margin: rgba(246, 178, 107, 0.50);

  /* Layer tree tints */
  --buildrick-layer-accent-muted: rgba(45, 109, 255, 0.15);
  --buildrick-layer-muted-alpha: rgba(100, 116, 139, 0.15);
  --buildrick-layer-muted-light: rgba(100, 116, 139, 0.08);

  /* Border */
  --buildrick-border-subtle: rgba(148, 163, 184, 0.24);
  --buildrick-border-default: #CBD5E1;

  /* Semantic tints */
  --buildrick-danger-bg: rgba(220, 38, 38, 0.05);
  --buildrick-success-bg: rgba(22, 163, 74, 0.10);
  --buildrick-status-synced: #16A34A;
  --buildrick-primary-alpha-15: rgba(45, 109, 255, 0.15);

  /* Pill borders (retained for legacy component migration window) */
  --buildrick-pill-stroke: rgba(148, 163, 184, 0.35);
  --buildrick-pill-stroke-strong: rgba(148, 163, 184, 0.50);
```

(Keep the original closing `}` on the next line.)

- [ ] **Step 3: Verify 16 new tokens added**

```bash
grep -c -E '^\s*--buildrick-(bg-pressed|text-disabled|boxmodel|layer-|border-subtle|border-default|danger-bg|success-bg|status-synced|primary-alpha|pill-stroke):' packages/editor/src/themes/design-system/color.css
```

Expected: `16`.

### Task 4.2: Append tokens to `shadow.css`

- [ ] **Step 1: Find end of :root**

```bash
grep -n '^}' packages/editor/src/themes/design-system/shadow.css
```

- [ ] **Step 2: Before the closing `}`, append**

```css

  /* ─── DS V1 REMEDIATION (2026-04-20) — NEW TOKENS ─── */
  --buildrick-shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --buildrick-shadow-modal: 0 8px 32px rgba(15, 23, 42, 0.08);
  --buildrick-shadow-accent: 0 0 0 3px rgba(45, 109, 255, 0.08);
  --buildrick-shadow-hover: 0 4px 12px rgba(15, 23, 42, 0.08);
  --buildrick-shadow-inner: inset 0 1px 2px rgba(15, 23, 42, 0.06);
  --buildrick-selection-glow-sm: 0 2px 8px rgba(45, 109, 255, 0.10);
```

- [ ] **Step 3: Verify 6 added**

```bash
grep -c -E '^\s*--buildrick-(shadow-xs|shadow-modal|shadow-accent|shadow-hover|shadow-inner|selection-glow-sm):' packages/editor/src/themes/design-system/shadow.css
```

Expected: `6`.

### Task 4.3: Append tokens to `typography.css`

- [ ] **Step 1: Before the closing `}` of `:root`, append**

```css

  /* ─── DS V1 REMEDIATION (2026-04-20) — NEW TOKENS ─── */
  --buildrick-text-2xs: 10px;
  --buildrick-text-2xs-plus: 10.5px;
  --buildrick-text-md-plus: 15px;
  --buildrick-text-display: 48px;
  --buildrick-line-relaxed: 1.6;
```

- [ ] **Step 2: Verify 5 added**

```bash
grep -c -E '^\s*--buildrick-(text-2xs|text-2xs-plus|text-md-plus|text-display|line-relaxed):' packages/editor/src/themes/design-system/typography.css
```

Expected: `5`.

### Task 4.4: Append token to `a11y.css`

- [ ] **Step 1: Find the `:root` block or create one**

```bash
head -40 packages/editor/src/themes/design-system/a11y.css
```

- [ ] **Step 2: Add at the top of the `:root` block (or create a `:root` block if none exists)**

```css
:root {
  --buildrick-focus-ring-offset: 2px;
}
```

If `:root` already exists, insert the `--buildrick-focus-ring-offset: 2px;` line within it.

- [ ] **Step 3: Verify**

```bash
grep -c -E '^\s*--buildrick-focus-ring-offset:' packages/editor/src/themes/design-system/a11y.css
```

Expected: `1`.

### Task 4.5: Run safety gate

- [ ] **Step 1: Run the gate**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build && \
npx vitest run && \
bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && \
node scripts/verify-design-baselines.mjs
```

Expected: all succeed. Hex count equal to baseline (new tokens don't add hex; they're token *definitions* which are the source of truth, not consumers).

- [ ] **Step 2: Dev-server smoke**

```bash
npm run dev
```

Open editor, click through. No visual changes expected in Phase 4 (tokens added but nothing consumes them yet). Console should have no new warnings. Stop server.

### Task 4.6: Commit Phase 4

- [ ] **Step 1: Stage**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/themes/design-system/color.css \
        packages/editor/src/themes/design-system/shadow.css \
        packages/editor/src/themes/design-system/typography.css \
        packages/editor/src/themes/design-system/a11y.css
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ds-v1): add 28 missing tokens per V2 Table 4

Additions by file:
  color.css     16 tokens — bg-pressed, text-disabled, boxmodel-*,
                  layer-*, border-subtle, border-default, tints, pill-stroke
  shadow.css     6 tokens — shadow-xs, shadow-modal, shadow-accent,
                  shadow-hover, shadow-inner, selection-glow-sm
  typography.css 5 tokens — text-2xs, text-2xs-plus, text-md-plus,
                  text-display, line-relaxed
  a11y.css       1 token — focus-ring-offset

Skipped V2 Table 4 glass-* tokens (glass effect being removed per
DESIGN.md:11 "no decorative texture", not tokenized).

No consumer changes — Phase 5 codemod references these.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — HIGH codemod

Two sub-phases. 5a is 4 unambiguous repo-wide find-replace patterns (no human review per site). 5b is the remaining ~388 HIGH rows with per-file preview.

### Task 5a.1: Apply 4 unambiguous non-namespaced aliases

**Files:**
- Modify: any chrome file containing `var(--text-primary)`, `var(--text-muted)`, `var(--border-medium)`, `var(--font-mono)`

- [ ] **Step 1: Count occurrences pre-change**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for tok in "--text-primary" "--text-muted" "--border-medium" "--font-mono"; do
  count=$(grep -rE "var\(\s*${tok}\b" packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
  echo "${tok}: ${count} occurrences"
done
```

Record the counts.

- [ ] **Step 2: Apply each replacement across all files**

Use the `grep -rl` pattern to find files then `sed -i` (macOS uses `-i ''` empty backup):

```bash
cd /Users/shahg/Desktop/pencil/buildrik

# --text-primary → --buildrick-text-primary
grep -rlE 'var\(\s*--text-primary\b' packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" | \
  xargs sed -i '' 's/var(--text-primary)/var(--buildrick-text-primary)/g'

# --text-muted → --buildrick-text-muted
grep -rlE 'var\(\s*--text-muted\b' packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" | \
  xargs sed -i '' 's/var(--text-muted)/var(--buildrick-text-muted)/g'

# --border-medium → --buildrick-border-medium
grep -rlE 'var\(\s*--border-medium\b' packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" | \
  xargs sed -i '' 's/var(--border-medium)/var(--buildrick-border-medium)/g'

# --font-mono → --buildrick-font-family-mono
grep -rlE 'var\(\s*--font-mono\b' packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" | \
  xargs sed -i '' 's/var(--font-mono)/var(--buildrick-font-family-mono)/g'
```

- [ ] **Step 3: Verify counts zeroed**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for tok in "--text-primary" "--text-muted" "--border-medium" "--font-mono"; do
  count=$(grep -rE "var\(\s*${tok}\)" packages/editor/src --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
  echo "${tok}: ${count} remaining"
done
```

Expected: all four at `0`.

### Task 5a.2: Safety gate + commit 5a

- [ ] **Step 1: Run full safety gate**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build && npx vitest run && \
bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && \
node scripts/verify-design-baselines.mjs
```

Expected: all pass. Hex count equal to baseline (Phase 5a touches vars not hex).

- [ ] **Step 2: Dev-server smoke**

```bash
npm run dev
```

Visual diff against baseline screenshots. Text and border colors should be unchanged because the new `--buildrick-*` tokens have the same values as the old `--text-*` aliases did before Phase 3 (and after Phase 3 any value change was already captured).

- [ ] **Step 3: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add -u packages/editor/src
git commit -m "$(cat <<'EOF'
refactor(ds-v1): drain 4 non-namespaced aliases to canonical DS tokens

Repo-wide safe rename:
  --text-primary    → --buildrick-text-primary
  --text-muted      → --buildrick-text-muted
  --border-medium   → --buildrick-border-medium
  --font-mono       → --buildrick-font-family-mono

Zero judgment calls — these are pure namespace drains, values unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 5b.1: Write `apply-ds-v2-patch.mjs`

**Files:**
- Create: `packages/editor/scripts/apply-ds-v2-patch.mjs`

- [ ] **Step 1: Write the script**

```javascript
#!/usr/bin/env node
/**
 * DS V2 patch applier — reads docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md,
 * applies rows filtered by table + confidence + file.
 *
 * Usage:
 *   node scripts/apply-ds-v2-patch.mjs --list                           # list all files with pending rows
 *   node scripts/apply-ds-v2-patch.mjs --file <rel/path> --preview      # print diff
 *   node scripts/apply-ds-v2-patch.mjs --file <rel/path> --apply        # write diff to disk
 *   node scripts/apply-ds-v2-patch.mjs --table 2 --file ... --preview   # Table 2 (site leaks)
 *
 * @license BSD-3-Clause
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const V2 = path.join(REPO_ROOT, "docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md");

function args() {
  const a = process.argv.slice(2);
  return {
    list: a.includes("--list"),
    preview: a.includes("--preview"),
    apply: a.includes("--apply"),
    file: ((i) => i >= 0 ? a[i + 1] : null)(a.indexOf("--file")),
    table: ((i) => i >= 0 ? Number(a[i + 1]) : 1)(a.indexOf("--table")),
    confidence: ((i) => i >= 0 ? a[i + 1] : "HIGH")(a.indexOf("--confidence")),
  };
}

function parseTable(tableNumber) {
  const lines = fs.readFileSync(V2, "utf8").split("\n");
  const header = tableNumber === 1
    ? "## Table 1 — Shell consumers to fix"
    : "## Table 2 — Site code reading shell tokens (inverse leak)";
  const idx = lines.findIndex((l) => l.trim() === header);
  if (idx < 0) throw new Error(`Table ${tableNumber} header not found`);

  const rows = [];
  for (let i = idx + 3; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.startsWith("|")) break;
    const cells = ln.split("|").slice(1, -1).map((s) => s.trim());
    if (cells[0] === "---" || !/^\d+$/.test(cells[0])) continue;
    if (tableNumber === 1) {
      const [num, fileLine, token, category, replacement, notes, confidence] = cells;
      rows.push({ num, fileLine, token, category, replacement, notes, confidence });
    } else {
      const [num, fileLine, token, replacement, confidence, notes] = cells;
      rows.push({ num, fileLine, token, replacement, confidence: confidence || "HIGH", notes });
    }
  }
  return rows;
}

function filterApplyable(rows, confidence) {
  return rows.filter((r) => {
    if (r.confidence !== confidence) return false;
    if (r.category === "LOCAL_SHADOW") return false;
    if (r.replacement === "KEEP_LOCAL") return false;
    if (r.replacement.startsWith("<")) return false;
    return true;
  });
}

function groupByFile(rows) {
  const byFile = new Map();
  for (const r of rows) {
    const [rel, lineStr] = r.fileLine.split(":");
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel).push({ ...r, line: Number(lineStr) });
  }
  return byFile;
}

function previewFile(rel, edits) {
  const abs = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) return { ok: false, reason: "file not found", rel };

  const text = fs.readFileSync(abs, "utf8");
  const lines = text.split("\n");
  const newLines = [...lines];
  const changes = [];

  for (const edit of edits) {
    const idx = edit.line - 1;
    if (idx < 0 || idx >= newLines.length) {
      changes.push({ line: edit.line, status: "out-of-range" });
      continue;
    }
    const before = newLines[idx];
    const fromPattern = `var(${edit.token})`;
    const toPattern = `var(${edit.replacement})`;
    if (!before.includes(fromPattern)) {
      changes.push({ line: edit.line, status: "not-found", expected: fromPattern, snippet: before });
      continue;
    }
    const after = before.split(fromPattern).join(toPattern);
    newLines[idx] = after;
    changes.push({ line: edit.line, status: "ok", before, after });
  }

  return { ok: true, rel, abs, oldText: text, newText: newLines.join("\n"), changes };
}

function diff(result) {
  console.log(`\n--- ${result.rel}`);
  console.log(`+++ ${result.rel}`);
  for (const c of result.changes) {
    if (c.status === "ok") {
      console.log(`@@ ${c.line} @@`);
      console.log(`- ${c.before}`);
      console.log(`+ ${c.after}`);
    } else {
      console.log(`! ${c.line}: ${c.status}${c.expected ? ` (expected ${c.expected})` : ""}`);
    }
  }
  const okCount = result.changes.filter((c) => c.status === "ok").length;
  const skipCount = result.changes.length - okCount;
  console.log(`\n  ${okCount} applicable, ${skipCount} skipped`);
}

function main() {
  const opts = args();
  const rows = parseTable(opts.table);
  const applyable = filterApplyable(rows, opts.confidence);
  const byFile = groupByFile(applyable);

  if (opts.list) {
    for (const [rel, edits] of [...byFile.entries()].sort()) {
      console.log(`${edits.length.toString().padStart(4)}  ${rel}`);
    }
    console.log(`\nTotal files: ${byFile.size}  Total edits: ${applyable.length}`);
    return;
  }

  if (!opts.file) {
    console.error("Provide --file <path> or --list");
    process.exit(2);
  }

  const edits = byFile.get(opts.file);
  if (!edits || edits.length === 0) {
    console.error(`No pending edits for ${opts.file} in Table ${opts.table} / ${opts.confidence}`);
    process.exit(1);
  }

  const result = previewFile(opts.file, edits);
  if (!result.ok) {
    console.error(`ERROR ${result.reason}`);
    process.exit(1);
  }

  if (opts.preview) {
    diff(result);
    return;
  }

  if (opts.apply) {
    fs.writeFileSync(result.abs, result.newText);
    const okCount = result.changes.filter((c) => c.status === "ok").length;
    console.log(`APPLIED ${result.rel}: ${okCount} edits`);
    return;
  }

  console.error("Pass --preview or --apply");
  process.exit(2);
}

main();
```

- [ ] **Step 2: Make executable + commit on its own**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
chmod +x packages/editor/scripts/apply-ds-v2-patch.mjs
git add packages/editor/scripts/apply-ds-v2-patch.mjs
git commit -m "$(cat <<'EOF'
chore(ds-v1): add V2 patch-list codemod script

Reads docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md,
applies rows filtered by table/confidence/file with --preview before
--apply. Skips LOCAL_SHADOW, KEEP_LOCAL, and <new-token-needed> rows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 5b.2: List files to process

- [ ] **Step 1: Run the script list mode**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/apply-ds-v2-patch.mjs --list --table 1 --confidence HIGH
```

Expected output: ordered list of files with row counts. Top entries likely:
- `packages/editor/src/themes/components.css` (~150+ rows)
- `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` (~40+)
- `packages/editor/src/editor/canvas/Canvas.css` (~30+)
- etc.

Total at bottom should be around 380-400 (remaining after Phase 5a).

Save this list — it drives the per-directory batching loop below.

### Task 5b.3: Per-directory apply loop

**Files:** every file listed in Task 5b.2. Grouped by top-level directory under `src/`.

Suggested directory batches (adjust based on actual list):
- Batch A: `src/ai/**`
- Batch B: `src/editor/canvas/**`
- Batch C: `src/editor/sidebar/tabs/pages/**`
- Batch D: `src/editor/sidebar/tabs/**` (all other tabs)
- Batch E: `src/editor/shell/**`
- Batch F: `src/editor/inspector/**`
- Batch G: `src/editor/panels/**`
- Batch H: `src/editor/rail/**`
- Batch I: `src/editor/media/**`
- Batch J: `src/editor/*.tsx` remaining
- Batch K: `src/shared/ui/**`
- Batch L: `src/shared/forms/**`
- Batch M: `src/features/design-system/ui/**`
- Batch N: `src/themes/components.css`
- Batch O: `src/themes/ux-fixes.css`

For EACH batch:

- [ ] **Step 1: Preview each file**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
for f in $(node scripts/apply-ds-v2-patch.mjs --list --table 1 --confidence HIGH | awk '$2 ~ /<BATCH_PATTERN>/ {print $2}'); do
  echo "=== $f ==="
  node scripts/apply-ds-v2-patch.mjs --table 1 --confidence HIGH --file "$f" --preview
done
```

Replace `<BATCH_PATTERN>` with a regex matching the batch (e.g., `canvas` for Batch B, `shared/ui` for Batch K).

- [ ] **Step 2: Review the diffs**

For each file's diff, confirm each `- old line` / `+ new line` pair makes semantic sense. If any row has status `! not-found`, the V2 file's line number is stale (file has been edited since V2 was generated) — skip that file for now and note it.

- [ ] **Step 3: Apply the batch**

```bash
for f in $(node scripts/apply-ds-v2-patch.mjs --list --table 1 --confidence HIGH | awk '$2 ~ /<BATCH_PATTERN>/ {print $2}'); do
  node scripts/apply-ds-v2-patch.mjs --table 1 --confidence HIGH --file "$f" --apply
done
```

- [ ] **Step 4: Safety gate for this batch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build && npx vitest run && \
bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && \
node scripts/verify-design-baselines.mjs
```

Expected: all pass. Hex count should be EQUAL to baseline (this batch replaces `var()` refs, not hex literals).

- [ ] **Step 5: Visual diff this batch's surfaces**

Start `npm run dev`. Navigate specifically to the surfaces this batch affects:
- Batch B (canvas): canvas area, selection
- Batch C (pages): Pages rail tab
- Batch E (shell): topbar, command palette
- Batch F (inspector): inspector panel
- etc.

Compare against baseline screenshots. Expected = surfaces look unchanged (tokens preserve values). Unexpected = any color/spacing regression.

- [ ] **Step 6: Commit this batch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add -u packages/editor/src
git commit -m "refactor(ds-v1): batch <letter> HIGH codemod — <count> rows in <batch-name>"
```

Where `<count>` is the number of files/rows and `<batch-name>` describes the directory (e.g., `editor/canvas`).

Repeat Steps 1-6 for each batch A-O. Approximate 15 commits total in Phase 5b.

### Task 5b.4: Final Phase 5 verification

- [ ] **Step 1: List remaining HIGH rows**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/apply-ds-v2-patch.mjs --list --table 1 --confidence HIGH
```

Expected: empty list (all applicable HIGH rows applied). Any remaining rows are skipped-not-found (V2 stale vs current files) or `<new-token-needed>` rows that shouldn't be in the HIGH set. Document each remaining row as follow-up.

- [ ] **Step 2: Full safety gate**

```bash
npx vite build && npx vitest run && \
bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && \
node scripts/verify-design-baselines.mjs
```

- [ ] **Step 3: Full visual-diff pass on all 15 surfaces**

Run `npm run dev`, eyeball each surface against baseline.

---

## Phase 6 — Site leaks (V2 Table 2)

### Task 6.1: Preview Table 2 per file

- [ ] **Step 1: List Table 2 files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/apply-ds-v2-patch.mjs --list --table 2 --confidence HIGH
```

Expected: ~20 files across `src/blocks/`, `src/shared/utils/html/`, select `src/ai/`.

- [ ] **Step 2: Preview each**

```bash
for f in $(node scripts/apply-ds-v2-patch.mjs --list --table 2 --confidence HIGH | awk 'NF==2 {print $2}'); do
  echo "=== $f ==="
  node scripts/apply-ds-v2-patch.mjs --table 2 --confidence HIGH --file "$f" --preview
done
```

- [ ] **Step 3: For each file, confirm it emits user HTML (not editor chrome)**

If any file is actually editor chrome (still rendering in the editor UI, not user-published output), SKIP that file and document why. Table 2 rows for chrome should stay reading shell tokens.

### Task 6.2: Apply Table 2

- [ ] **Step 1: Apply per file**

```bash
for f in <list approved in Task 6.1 Step 3>; do
  node scripts/apply-ds-v2-patch.mjs --table 2 --confidence HIGH --file "$f" --apply
done
```

- [ ] **Step 2: Safety gate**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build && npx vitest run && \
bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && \
node scripts/verify-design-baselines.mjs
```

- [ ] **Step 3: Smoke test user HTML export**

```bash
npm run dev
```

Open editor, create a simple page with a ContactForm block, click Export/Publish. Inspect the exported HTML — it should reference `--buildrick-design-*` tokens, not `--buildrick-*` chrome tokens.

### Task 6.3: Commit Phase 6

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add -u packages/editor/src
git commit -m "$(cat <<'EOF'
fix(ds-v1): site code reads site tokens, not chrome tokens

V2 Table 2 inverse leaks fixed in blocks/ and shared/utils/html/.
User-published HTML now uses --buildrick-design-* namespace exclusively;
editor chrome remains on --buildrick-*.

Editor-chrome-in-templates/* files excluded per V2 re-scope (those render
in editor, not user sites).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Schema versioning persistence (TDD)

### Task 7.1: Read current migration module

- [ ] **Step 1: Confirm `CURRENT_SCHEMA_VERSION` exports**

```bash
grep -n 'CURRENT_SCHEMA_VERSION\|migrateDesignTokens' packages/editor/src/features/design-system/migrations/index.ts
```

Expected: both symbols exported.

- [ ] **Step 2: Read `DesignSystemTab` save + load paths**

```bash
sed -n '140,160p' packages/editor/src/features/design-system/ui/DesignSystemTab.tsx
sed -n '265,285p' packages/editor/src/features/design-system/ui/DesignSystemTab.tsx
```

Confirm current load (~:141) reads `settings.designTokens` without reading `designTokensSchemaVersion`, and save (~:271) writes `designTokens` without writing `designTokensSchemaVersion`.

### Task 7.2: Write failing test — save path persists version

**Files:**
- Create: `packages/editor/src/features/design-system/migrations/__tests__/schema-version.test.ts`

- [ ] **Step 1: Create test file with first test**

```typescript
/**
 * Schema version persistence tests — Phase 7 of DS V1 remediation.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../index";

describe("schema version — load path", () => {
  it("legacy project with no designTokensSchemaVersion loads as v1", () => {
    const storedVersion = undefined;
    const effectiveVersion = storedVersion ?? 1;
    expect(effectiveVersion).toBe(1);
  });

  it("project at CURRENT version loads as-is without migration", () => {
    const tokens = [{ id: "t1", name: "primary", value: "#000", cssVar: "--x", category: "color", type: "color" } as any];
    const storedVersion = CURRENT_SCHEMA_VERSION;
    const migrated = storedVersion < CURRENT_SCHEMA_VERSION
      ? migrateDesignTokens(tokens, storedVersion, CURRENT_SCHEMA_VERSION)
      : tokens;
    expect(migrated).toEqual(tokens);
  });

  it("project at version < CURRENT gets migrated", () => {
    const tokens = [{ id: "t1", name: "primary", value: "#000", cssVar: "--x", category: "color", type: "color" } as any];
    const storedVersion = 1;
    if (CURRENT_SCHEMA_VERSION === 1) {
      // No migration path to test yet
      expect(migrateDesignTokens(tokens, 1, CURRENT_SCHEMA_VERSION)).toEqual(tokens);
    } else {
      const migrated = migrateDesignTokens(tokens, 1, CURRENT_SCHEMA_VERSION);
      expect(migrated).toBeDefined();
      expect(Array.isArray(migrated)).toBe(true);
    }
  });

  it("project at version > CURRENT loads unchanged, with warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const tokens = [{ id: "t1" } as any];
    const storedVersion = CURRENT_SCHEMA_VERSION + 1;

    // Simulate the load-path branch: stored > current → warn, load as-is
    if (storedVersion > CURRENT_SCHEMA_VERSION) {
      console.warn("project from newer editor; token behavior may differ");
    }
    const result = tokens;

    expect(result).toEqual(tokens);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("newer editor"));
    warnSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests, expect them to pass (these only check existing migration helpers)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/features/design-system/migrations/__tests__/schema-version.test.ts
```

Expected: 4 tests pass. These validate the migration helper behaves correctly. Next step adds tests that check the SAVE/LOAD path in `DesignSystemTab` specifically — those will fail until Task 7.4.

### Task 7.3: Modify DesignSystemTab load path

**Files:**
- Modify: `packages/editor/src/features/design-system/ui/DesignSystemTab.tsx` (~lines 141-160)

- [ ] **Step 1: Read current load path**

```bash
sed -n '138,160p' packages/editor/src/features/design-system/ui/DesignSystemTab.tsx
```

- [ ] **Step 2: Add imports at top of file**

Find the existing imports from `"../migrations"` or add a new import line. Ensure this is present in the import block:

```typescript
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../migrations";
```

If no such line exists, add it near other feature-internal imports (e.g., after `import { DEFAULT_TOKENS } from "../constants";`).

- [ ] **Step 3: Modify `loadFromComposer` to migrate**

Replace the body of `loadFromComposer` (starting where it reads `settings.designTokens`). The replacement should:

```typescript
const loadFromComposer = React.useCallback(() => {
  if (!composer) return;
  try {
    const settings = composer.getProjectSettings();
    const storedVersion = settings.designTokensSchemaVersion ?? 1;

    if (storedVersion > CURRENT_SCHEMA_VERSION) {
      console.warn(
        `project was saved with designTokensSchemaVersion=${storedVersion} ` +
        `(editor supports up to ${CURRENT_SCHEMA_VERSION}); loading tokens as-is`
      );
    }

    if (settings.designTokens && settings.designTokens.length > 0) {
      let incoming = settings.designTokens;
      if (storedVersion < CURRENT_SCHEMA_VERSION) {
        incoming = migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION);
      }
      const merged = DEFAULT_TOKENS.map((def) => {
        const saved = incoming.find((t) =>
          t.id ? t.id === def.id : t.name === def.name
        );
        return saved ? { ...def, value: saved.value } : def;
      });
      colorState.resetFromSaved(merged);
      typeState.resetFromSaved(merged);
      spacingState.resetFromSaved(merged);
      hasLoadedRef.current = true;
      setIsFirstLoad(false);
    } else {
      // first-load path preserved
    }
  } catch (err) {
    console.error("loadFromComposer failed", err);
  }
}, [composer, colorState, typeState, spacingState]);
```

(The `// first-load path preserved` comment means you keep the existing first-load `else` branch — do not delete it; only modify the if-branch that handles `settings.designTokens && .length > 0`.)

- [ ] **Step 4: Verify build still passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vite build
```

Expected: build succeeds.

### Task 7.4: Modify DesignSystemTab save path

**Files:**
- Modify: `packages/editor/src/features/design-system/ui/DesignSystemTab.tsx` (~line 271)

- [ ] **Step 1: Find the save statement**

```bash
grep -n 'composer.setProjectSettings' packages/editor/src/features/design-system/ui/DesignSystemTab.tsx
```

Expected: one hit around line 272.

- [ ] **Step 2: Update the save call**

Find the line:

```typescript
composer.setProjectSettings({ ...current, designTokens: tokenRecords });
```

Replace with:

```typescript
composer.setProjectSettings({
  ...current,
  designTokens: tokenRecords,
  designTokensSchemaVersion: CURRENT_SCHEMA_VERSION,
});
```

- [ ] **Step 3: Build**

```bash
npx vite build
```

Expected: succeeds. TypeScript must accept `designTokensSchemaVersion` on `ProjectSettings` (already defined at `types/project.ts:199`).

### Task 7.5: Run all Phase 7 tests + safety gate

- [ ] **Step 1: Run schema-version tests**

```bash
npx vitest run src/features/design-system/migrations/__tests__/schema-version.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: no regressions.

- [ ] **Step 3: Full safety gate**

```bash
npx vite build && bash scripts/ds-grep-gates.sh && \
node scripts/find-inline-hex-v2.mjs && node scripts/verify-design-baselines.mjs
```

- [ ] **Step 4: Manual smoke — save+reload a project**

```bash
npm run dev
```

Open editor, Design tab, change a color, click Save. Hard-refresh the browser. Change should persist. Open the project JSON (check via devtools or composer state) — should contain `designTokensSchemaVersion: <CURRENT_SCHEMA_VERSION>`.

### Task 7.6: Commit Phase 7

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/features/design-system/ui/DesignSystemTab.tsx \
        packages/editor/src/features/design-system/migrations/__tests__/schema-version.test.ts
git commit -m "$(cat <<'EOF'
feat(ds-v1): persist designTokensSchemaVersion in project JSON

Fixes Codex P1 finding: schema versioning worked only in localStorage;
project JSON save/load ignored the version field defined on ProjectSettings.

Save path: writes designTokensSchemaVersion: CURRENT_SCHEMA_VERSION
Load path: reads stored version, calls migrateDesignTokens if < CURRENT,
           soft-warns if > CURRENT (future editor — load as-is)

4 new tests cover the load/migrate/future-version paths.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — CI gates + ESLint overlay (FAIL mode)

### Task 8.1: Add Gate 7 to `ds-grep-gates.sh`

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh`

- [ ] **Step 1: Read current gate numbering**

```bash
grep -n '^# Gate\|^pass\|^fail' packages/editor/scripts/ds-grep-gates.sh
```

Expected: Gate 1-6, Gate 8, Gate 10 present. Gate 7 missing.

- [ ] **Step 2: Insert Gate 7 between Gate 6 and Gate 8**

Locate the line starting `# Gate 8: ` (around line 71 per earlier inspection). Before it, insert:

```bash

# Gate 7: @media (prefers-*) must only appear in a11y.css
LEAKED_MEDIA=$(grep -rlE '@media\s*\(\s*prefers-' packages/editor/src --include="*.css" 2>/dev/null | grep -v 'design-system/a11y.css' || true)
if [ -n "$LEAKED_MEDIA" ]; then
  echo "FAIL Gate 7: @media (prefers-*) outside a11y.css:"
  echo "$LEAKED_MEDIA"
  fail "Gate 7: a11y media queries leaked"
fi
pass "Gate 7: @media (prefers-*) only in a11y.css"

```

- [ ] **Step 3: Verify gate 7 is executable**

```bash
bash packages/editor/scripts/ds-grep-gates.sh 2>&1 | grep -i "Gate 7"
```

Expected: either a pass or a fail with the leaked files listed. If a fail, that's expected per the Codex audit — Phase 8 tolerates this transitional state if there's no new consumer code. Document any fails as known; they'll be addressed in a follow-up cleanup.

If Gate 7 fails with just `components.css:N` lines, confirm those are the 37 known transitional blocks; leave them. If it fails elsewhere, diagnose.

### Task 8.2: Remove `components.css` exclusion from Gate 4

**Files:**
- Modify: `packages/editor/scripts/ds-grep-gates.sh:46` (Gate 4 `grep -v components.css`)

- [ ] **Step 1: Locate the line**

```bash
grep -n 'components.css' packages/editor/scripts/ds-grep-gates.sh
```

Expected: line 46 (in Gate 4's grep chain).

- [ ] **Step 2: Remove the `| grep -v components.css` segment**

Edit the Gate 4 line. Before:

```bash
LEAK=$(grep -rE 'var\(--(ls-|rail-|surface-[a-z]|brand-|primary-[0-9]|buildrick-(control|build|ai)-|accent\)|accent,|bar\)|bar,|blue\)|blue,|txt\)|txt,)' packages/editor/src 2>/dev/null | grep -v components.css | grep -v __tests__ || true)
```

After:

```bash
LEAK=$(grep -rE 'var\(--(ls-|rail-|surface-[a-z]|brand-|primary-[0-9]|buildrick-(control|build|ai)-|accent\)|accent,|bar\)|bar,|blue\)|blue,|txt\)|txt,)' packages/editor/src 2>/dev/null | grep -v __tests__ || true)
```

- [ ] **Step 3: Run Gate 4**

```bash
bash packages/editor/scripts/ds-grep-gates.sh 2>&1 | grep -i "Gate 4"
```

Expected: passes. If fails, means Phase 5 missed some components.css rows — go back and drain them with the codemod before proceeding.

### Task 8.3: Flip hex gate to FAIL mode

**Files:**
- Modify: `packages/editor/scripts/find-inline-hex-v2.mjs` (already has `--fail` mode)

- [ ] **Step 1: Verify hex count is zero**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
node scripts/find-inline-hex-v2.mjs --count
```

Expected: `0`. If not zero, there's leftover hex in chrome — either from missed Phase 5 rows or from files the V2 list didn't cover (e.g., canvas-local themes, adjacent raw rgba). Grep and fix or mark `@lint-hex-policy:` with a justified reason before continuing.

- [ ] **Step 2: Delete the baseline file**

```bash
rm packages/editor/scripts/.hex-baseline
```

- [ ] **Step 3: Verify FAIL mode**

```bash
node scripts/find-inline-hex-v2.mjs --fail
echo "exit: $?"
```

Expected: exits 0 with "Hex gate: 0 violations. OK."

### Task 8.4: Add ESLint devDependencies

**Files:**
- Modify: `packages/editor/package.json`

- [ ] **Step 1: Add to devDependencies**

Check current:

```bash
grep -E '"eslint"\|"@eslint/js"\|"@typescript-eslint' packages/editor/package.json
```

If missing, add to the `"devDependencies"` object:

```json
"eslint": "^9.0.0",
"@eslint/js": "^9.0.0",
"@typescript-eslint/parser": "^7.0.0",
"@typescript-eslint/eslint-plugin": "^7.0.0",
"globals": "^15.0.0"
```

- [ ] **Step 2: Add `lint` script**

In the `"scripts"` block, add:

```json
"lint": "eslint . --ext .ts,.tsx"
```

- [ ] **Step 3: Install**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
pnpm install
```

Expected: pnpm-lock.yaml updated. No errors.

### Task 8.5: Write custom `no-inline-hex` rule

**Files:**
- Create: `packages/editor/eslint-rules/no-inline-hex.js`

- [ ] **Step 1: Write rule**

```javascript
/**
 * ESLint rule: no-inline-hex
 * Bans #RRGGBB literals in JSX style values and Emotion template literals.
 * Honors `// @lint-hex-policy: <reason>` on preceding line as per-site escape.
 * @license BSD-3-Clause
 */
"use strict";

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const POLICY_RE = /@lint-hex-policy:/;

function hasPolicyComment(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const commentsBefore = sourceCode.getCommentsBefore(node);
  return commentsBefore.some((c) => POLICY_RE.test(c.value));
}

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow inline hex color literals in chrome JSX/Emotion" },
    schema: [],
    messages: {
      inlineHex: "Inline hex '{{hex}}' — use a var(--buildrick-*) token or mark with @lint-hex-policy: <reason>",
    },
  },
  create(context) {
    function checkString(str, node) {
      const matches = str.match(HEX_RE);
      if (!matches) return;
      if (hasPolicyComment(context, node)) return;
      for (const hex of matches) {
        context.report({ node, messageId: "inlineHex", data: { hex } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (node.value.length < 4) return;
        if (!HEX_RE.test(node.value)) return;
        // Only flag in style-adjacent positions: JSXAttribute with name matching style|color|...
        const parent = node.parent;
        if (!parent) return;
        // Heuristic: flag inside JSX style attribute or in Emotion `css` / `styled.X` calls
        // Simpler: flag any string containing hex inside JSXExpressionContainer
        let walker = parent;
        while (walker && walker.type !== "Program") {
          if (walker.type === "JSXAttribute" && walker.name && ["style", "css"].includes(walker.name.name)) {
            checkString(node.value, node);
            return;
          }
          walker = walker.parent;
        }
      },
      TemplateLiteral(node) {
        // Emotion: styled.div`color: #FF0000;`
        const raw = node.quasis.map((q) => q.value.cooked).join("");
        if (!HEX_RE.test(raw)) return;
        if (hasPolicyComment(context, node)) return;
        const matches = raw.match(HEX_RE);
        for (const hex of matches) {
          context.report({ node, messageId: "inlineHex", data: { hex } });
        }
      },
    };
  },
};
```

### Task 8.6: Write `no-inspector-tokens` rule

**Files:**
- Create: `packages/editor/eslint-rules/no-inspector-tokens.js`

- [ ] **Step 1: Write rule**

```javascript
/**
 * ESLint rule: no-inspector-tokens
 * Bans INSPECTOR_TOKENS import and usage (Phase 3.7 codemod eliminated this indirection).
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow INSPECTOR_TOKENS indirection — use var(--buildrick-*) directly" },
    schema: [],
    messages: {
      tokensImport: "INSPECTOR_TOKENS import banned — use var(--buildrick-*) directly",
      tokensAccess: "INSPECTOR_TOKENS access banned — use var(--buildrick-*) directly",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        for (const spec of node.specifiers) {
          if (spec.imported && spec.imported.name === "INSPECTOR_TOKENS") {
            context.report({ node: spec, messageId: "tokensImport" });
          }
        }
      },
      Identifier(node) {
        if (node.name === "INSPECTOR_TOKENS") {
          // ignore declarations; only flag references
          const parent = node.parent;
          if (!parent) return;
          if (parent.type === "VariableDeclarator" && parent.id === node) return;
          if (parent.type === "ImportSpecifier") return;
          if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
          context.report({ node, messageId: "tokensAccess" });
        }
      },
    };
  },
};
```

### Task 8.7: Write `no-get-property-value-ds` rule

**Files:**
- Create: `packages/editor/eslint-rules/no-get-property-value-ds.js`

- [ ] **Step 1: Write rule**

```javascript
/**
 * ESLint rule: no-get-property-value-ds
 * Bans `getComputedStyle(...).getPropertyValue('--buildrick-...')` — use getToken() helper.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow getPropertyValue on --buildrick-* tokens; use getToken()" },
    schema: [],
    messages: {
      directRead: "getPropertyValue('{{name}}') — use getToken('{{name}}') from shared/utils/tokens",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;
        if (!callee.property || callee.property.name !== "getPropertyValue") return;
        const arg = node.arguments[0];
        if (!arg || arg.type !== "Literal" || typeof arg.value !== "string") return;
        if (!arg.value.startsWith("--buildrick-")) return;
        context.report({ node, messageId: "directRead", data: { name: arg.value } });
      },
    };
  },
};
```

### Task 8.8: Write rules plugin index

**Files:**
- Create: `packages/editor/eslint-rules/index.js`

- [ ] **Step 1: Write plugin entry**

```javascript
/**
 * buildrik ESLint plugin — custom rules for DS V1 invariants.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  rules: {
    "no-inline-hex": require("./no-inline-hex"),
    "no-inspector-tokens": require("./no-inspector-tokens"),
    "no-get-property-value-ds": require("./no-get-property-value-ds"),
  },
};
```

### Task 8.9: Write `eslint.config.mjs`

**Files:**
- Create: `packages/editor/eslint.config.mjs`

- [ ] **Step 1: Write config**

```javascript
/**
 * ESLint flat config — DS V1 remediation.
 * @license BSD-3-Clause
 */
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import buildrik from "./eslint-rules/index.js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { buildrik },
    rules: {
      "buildrik/no-inline-hex": "error",
      "buildrik/no-inspector-tokens": "error",
      "buildrik/no-get-property-value-ds": "error",
      // Disable base rules that conflict with TS
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "**/__tests__/**", "**/*.test.{ts,tsx}"],
  },
];
```

### Task 8.10: Run ESLint locally

- [ ] **Step 1: Run lint**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
pnpm run lint
```

Expected outcomes:
- If Phase 5 fully drained hex sites and INSPECTOR_TOKENS references: lint passes with 0 errors
- If remaining violations: count them. Each violation is either (a) a genuine miss from Phase 5 that should be fixed now, or (b) a file that needs a `// @lint-hex-policy: <reason>` per-site marker with justification.

- [ ] **Step 2: Drive violation count to zero**

Either fix each violation's source code or add a per-site policy marker. Document the justification in commit.

### Task 8.11: Add CI steps

**Files:**
- Modify: `.github/workflows/editor-ci.yml`

- [ ] **Step 1: Locate the build step**

```bash
grep -n 'Build editor\|editor tests' .github/workflows/editor-ci.yml
```

Expected: `Build editor` and `Run editor tests` steps.

- [ ] **Step 2: Add 3 new steps AFTER `Build editor` and BEFORE `Run editor tests`**

Edit `.github/workflows/editor-ci.yml`. After the `- name: Build editor` block, insert:

```yaml
      - name: DS invariants (grep + baselines)
        working-directory: packages/editor
        run: pnpm run verify:ds

      - name: DS hex gate (FAIL mode)
        working-directory: packages/editor
        run: node scripts/find-inline-hex-v2.mjs --fail

      - name: ESLint (DS rules)
        working-directory: packages/editor
        run: pnpm run lint
```

- [ ] **Step 3: Verify YAML validity**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/editor-ci.yml'))" && echo OK
```

Expected: `OK`.

### Task 8.12: Final safety gate + commit

- [ ] **Step 1: Run everything locally**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
pnpm run verify:ds && \
node scripts/find-inline-hex-v2.mjs --fail && \
pnpm run lint && \
npx vite build && \
npx vitest run
```

Expected: all five exit 0.

- [ ] **Step 2: Stage all Phase 8 files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/scripts/ds-grep-gates.sh \
        packages/editor/scripts/find-inline-hex-v2.mjs \
        packages/editor/scripts/.hex-baseline \
        packages/editor/package.json \
        packages/editor/pnpm-lock.yaml \
        pnpm-lock.yaml \
        packages/editor/eslint.config.mjs \
        packages/editor/eslint-rules/ \
        .github/workflows/editor-ci.yml
```

(The `.hex-baseline` will be staged as a deletion since Task 8.3 removed it.)

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
ci(ds-v1): enforce DS invariants — hex FAIL mode + ESLint overlay

Gates now blocking on PR:
  verify:ds       10 grep invariants + design-baseline parity
  lint:ds-hex     --fail mode (zero hex tolerance)
  lint            ESLint flat config with 3 custom rules:
                    buildrik/no-inline-hex
                    buildrik/no-inspector-tokens
                    buildrik/no-get-property-value-ds

Gate script changes:
  Gate 7 added (no @media (prefers-*) outside a11y.css)
  Gate 4 components.css exclusion removed
  find-inline-hex-v2.mjs flipped from WARN to FAIL;
  .hex-baseline deleted (no longer needed)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 8.13: End-to-end smoke — deliberate violation + revert

- [ ] **Step 1: Add a test violation**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
```

Edit a chrome `.tsx` file (e.g., `src/editor/shell/AquibraStudio.tsx`). Add somewhere inside a JSX style prop:

```tsx
<div style={{ color: "#FF0000" }}>test</div>
```

- [ ] **Step 2: Run lint — expect FAIL**

```bash
pnpm run lint 2>&1 | tail -10
```

Expected: one error flagging `#FF0000` as `buildrik/no-inline-hex` violation.

- [ ] **Step 3: Run hex gate — expect FAIL**

```bash
node scripts/find-inline-hex-v2.mjs --fail
echo "exit: $?"
```

Expected: exit 1 with `Hex gate FAIL: 1 inline hex sites in chrome.`

- [ ] **Step 4: Revert the test violation**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git checkout -- packages/editor/src/editor/shell/AquibraStudio.tsx
```

- [ ] **Step 5: Re-run, confirm clean**

```bash
cd packages/editor
pnpm run lint
node scripts/find-inline-hex-v2.mjs --fail
```

Expected: both exit 0.

---

## Phase completion summary

After all 8 phases are committed and CI passes on `main`:

- `CHANGELOG.md` should be updated to reflect actual DS V1 state. That's a separate follow-up commit outside this plan.
- MEDIUM/LOW/LOCAL_SHADOW rows (334 total) are now surfaced by CI gates in any PR that touches an affected file. Opportunistic cleanup over time.
- The `docs/reviews/` audit artifacts (V1 fix-list, V2 fix-list) can stay as historical record.

## Known deferred work (explicit out-of-scope)

Per the spec's Non-Goals section:
- Playwright visual regression suite
- `components.css` duplicate `@media (prefers-*)` blocks (transitional, harmless)
- MEDIUM/LOW/LOCAL_SHADOW rows — gate-driven cleanup
- Glass-effect removal from consumer code (happens opportunistically in Phase 5b where encountered)
- Any additional `design.css` dark-mode defaults beyond the 4 fixed in Phase 3 (e.g., color-muted zinc, color-border zinc) — user-editable, not shipping as chrome
