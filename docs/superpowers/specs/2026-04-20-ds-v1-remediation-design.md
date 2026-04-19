# Buildrik DS V1 Remediation — Design

**Date:** 2026-04-20
**Status:** Design — pending user approval
**Supersedes:** The "DS V1 complete" claim in `CHANGELOG.md:20-45` (2026-04-19)
**Related:**
- V2 fix list: `docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md`
- V1 plan: `docs/superpowers/plans/2026-04-19-buildrik-design-system-v1.md`
- V1 spec: `docs/superpowers/specs/2026-04-19-buildrik-design-system-v1-design.md`
- Design contract: `DESIGN.md`
- Prior Codex audit: `docs/superpowers/audits/2026-04-19-buildrik-design-system-v1-codex-reviews.md`

## 1. Context

DS V1 shipped in 31 commits on 2026-04-19. A Codex code review on 2026-04-20 found DS V1 is ~55% complete, not "complete." Independent verification confirmed every major claim:

1. **DS source drift from `DESIGN.md`.** `color.css:17,24,33-36` ship text/border/accent values one step darker than the contract. `typography.css:9-11` names banned fallback fonts (`"Inter"`, `"JetBrains Mono"`). `design.css:14,16,24,26` ship AI-slop defaults (`#8B5CF6` violet, `#0A0A0A` near-black, `"Inter"`, `"JetBrains Mono"`) — the exact patterns `DESIGN.md:194-208` bans.
2. **Hex gate is a false pass.** `find-inline-hex.mjs` reports 0 violations in chrome. Actual count: ~400 in `.tsx` + ~469 in `.css`. Script skips any file with `@lint-hex-policy:` marker (43 files, 254 hex sites bypassed), only scans `.tsx` not `.css`, only matches 11 specific CSS property names.
3. **Schema versioning is localStorage-only.** `designTokensSchemaVersion` is defined on `ProjectSettings` at `types/project.ts:199` but never written when saving (`DesignSystemTab.tsx:271-275`), never read when loading (`:141-149`). Migration path only exists for `localStorage` via `TokenRegistryContext.tsx:77-123`.
4. **CI doesn't run DS gates.** `.github/workflows/editor-ci.yml` runs `vite build` + `vitest` only. The `lint:ds` and `verify:ds` scripts exist in `package.json:13-14` but are never invoked.
5. **Token consumers.** 892 violating `var(--buildrick-*)` references in shell code (438 HIGH confidence, 181 MEDIUM, 153 LOW, 120 LOCAL_SHADOW). 69 site-leak rows in emitted HTML.

## 2. Goal

Finish DS V1 to the point where:
- Editor chrome values match `DESIGN.md` exactly.
- HIGH-confidence consumer migrations applied (~438 rows).
- Site leaks in user-exported code fixed (69 rows).
- Schema versioning persists to project JSON with migration on load.
- CI gates enforce invariants on every PR.

## 3. Non-Goals

- Playwright visual regression suite. Deferred — same as original DS V1 plan. Manual screenshots cover the remediation window.
- `components.css` duplicate `@media (prefers-*)` block cleanup (37 lines). Transitional, harmless. Future cleanup.
- MEDIUM/LOW/LOCAL_SHADOW consumer migration (334 rows total). Out of scope — these become opportunistic cleanup surfaced by the new Gate 10 when PRs touch affected files.
- Glass-effect tokens. The V2 list proposes 4 glass-* tokens only if glass is retained. Design direction is to remove glass (`DESIGN.md:11`: "No gradients, no blobs, no grain, no decorative texture"). Decision: remove glass usage rather than tokenize. Handled as adjacent cleanup during Phase 5 where encountered.

## 4. Architecture

Eight phases, sequential. Each phase ships as one commit to `main` (solo workflow). Each commit is gated by a safety suite; failure = `git revert HEAD` + diagnose.

```
Phase 1: Hex gate rewrite (WARN mode) — baseline
Phase 2: Visual baseline capture — 15 screenshots
Phase 3: DS source cleanup (Table 3, 13 edits)
Phase 4: Add missing tokens (Table 4 minus glass, ~28 additions)
Phase 5: HIGH codemod — 5a auto, 5b per-file preview
Phase 6: Site leak fix (Table 2, 69 rows)
Phase 7: Schema versioning persistence
Phase 8: CI gates + ESLint overlay (FAIL mode)
```

### 4.1 Why Phase 1 goes first

The current Gate 10 is a false pass — it reports 0 violations when ~869 exist. Without a rewritten gate producing a baseline count, phases 3-6 have no regression signal. Running the rewrite in WARN mode first establishes the baseline; every subsequent phase is gated on "count did not increase." Phase 8 flips WARN to FAIL after all phases reduce violations to zero.

### 4.2 Safety gate (runs after every phase before commit)

```bash
cd packages/editor
npx vite build                              # no unresolved imports / TS errors
npx vitest run                              # no test regressions
bash scripts/ds-grep-gates.sh               # existing grep invariants hold
node scripts/find-inline-hex-v2.mjs         # count ≤ baseline
node scripts/verify-design-baselines.mjs    # design.css ↔ constants.ts parity
# Manual: npm run dev → eyeball-diff against Phase 2 screenshots, check console
```

All 5 automated checks must return 0. Manual diff must not flag unexpected visual changes (some visual changes are expected — e.g., lighter borders after Phase 3; the diff is to catch unexpected ones).

### 4.3 Rollback policy

Solo workflow direct-to-main. Each phase = 1 commit. On any failure (gate or visual): `git revert HEAD`, diagnose root cause, re-implement, re-attempt. Never skip the gate or commit over a failing state.

### 4.4 Data flow (Phase 7, schema versioning)

```
SAVE:
  DesignSystemTab.save()
    → composer.setProjectSettings({
        ...current,
        designTokens: tokenRecords,
        designTokensSchemaVersion: CURRENT_SCHEMA_VERSION
      })
    → persisted to project JSON

LOAD:
  DesignSystemTab.loadFromComposer()
    → const { designTokens, designTokensSchemaVersion } = composer.getProjectSettings()
    → const storedVersion = designTokensSchemaVersion ?? 1       // legacy = v1
    → if storedVersion < CURRENT
        → migratedTokens = migrateDesignTokens(designTokens, storedVersion, CURRENT)
        → apply migratedTokens
    → if storedVersion > CURRENT
        → console.warn("project from newer editor; token behavior may differ")
        → apply designTokens as-is
    → if storedVersion === CURRENT
        → apply designTokens as-is
```

The `localStorage` path (`TokenRegistryContext.tsx:77-123`) stays as-is — already versioned. Project JSON becomes a second, equivalent versioned path. Not unified: `localStorage` is per-browser draft, project JSON is canonical persisted state.

### 4.5 New hex gate spec (Phase 1 + 8)

Replaces `find-inline-hex.mjs` with `find-inline-hex-v2.mjs`:
- Scans: `.css`, `.ts`, `.tsx` in chrome roots (`src/editor/**`, `src/shared/ui/**`, `src/shared/forms/**`, `src/ai/**`, `src/features/design-system/ui/**`) plus `src/themes/components.css` and `src/themes/ux-fixes.css`.
- Matches: any `#[0-9A-Fa-f]{3,8}` on a line containing a CSS/JS property declarator (`:` followed by value), excluding the `@lint-hex-policy:` marker line itself.
- Per-site markers: a hex site is bypassed only if the same line ends with `/* @lint-hex-policy: <reason> */` (CSS) or has `// @lint-hex-policy: <reason>` above it (TS). Whole-file bypass is removed.
- Output modes:
  - `--count` — prints total count (for baseline)
  - `--list` — prints file:line:value per site (default)
  - `--group-by-value` — ranks unique hex values by frequency
- Exit code:
  - WARN mode (Phase 1): exits 0 if count ≤ `.hex-baseline`, exits 1 if count > baseline
  - FAIL mode (Phase 8): exits 0 only if count == 0

## 5. Components per phase

### Phase 1 — Hex gate rewrite (WARN)

**Files:**
- Create: `packages/editor/scripts/find-inline-hex-v2.mjs` (the rewritten gate)
- Create: `packages/editor/scripts/.hex-baseline` (count, written on first run)
- Modify: `packages/editor/package.json` — add `"lint:ds-hex": "node scripts/find-inline-hex-v2.mjs"`

**Done-when:** First run writes the baseline count. Second run with no changes exits 0.

### Phase 2 — Visual baseline capture

**Files:**
- Create: `docs/reviews/ds-v1-baseline-screenshots/*.png` — 15 files

**15 surfaces:**
1. `00-editor-default.png` — topbar + rail + collapsed sidebar
2. `01-rail-add.png`
3. `02-rail-templates.png`
4. `03-rail-media.png`
5. `04-rail-layers.png` (3+ elements)
6. `05-rail-pages.png` (2+ pages)
7. `06-rail-components.png`
8. `07-rail-design.png`
9. `08-rail-settings.png`
10. `09-rail-history.png`
11. `10-inspector-box.png` (element selected, Box section open)
12. `11-inspector-typography.png`
13. `12-canvas-selection.png` (selection handles + drop zones)
14. `13-command-palette.png` (`⌘K` open)
15. `14-modal.png` (Export modal open)

**Tool:** OS screenshot tool (Playwright install deferred). Named per list, committed to repo.

**Done-when:** 15 files committed, filenames match list.

### Phase 3 — DS source cleanup (Table 3)

**Files:**
- Modify: `packages/editor/src/themes/design-system/color.css` — lines 17, 24, 33, 34, 35, 36
- Modify: `packages/editor/src/themes/design-system/typography.css` — lines 9, 10, 11
- Modify: `packages/editor/src/themes/design-system/design.css` — lines 14, 16, 24, 26
- Modify: `packages/editor/src/features/design-system/constants.ts` — mirror `design.css` changes in `DEFAULT_TOKENS` (values for the 4 site tokens edited: color-secondary, color-background, font-heading, font-body, font-mono)

**Exact edits:** All 13 specified in V2 Table 3 with `old value → new value`. Example: `color.css:17 #0F172A → #334155`.

**Constants parity:** `verify-design-baselines.mjs` asserts `design.css ↔ constants.ts`. After editing `design.css:14,16,24,26`, `constants.ts` must match. This is a runtime-verified invariant.

**Done-when:** All 13 edits applied + `constants.ts` updated + `verify-design-baselines.mjs` passes + safety gate passes + visual diff shows expected lightening (borders, text, accent hovers).

### Phase 4 — Add missing tokens (Table 4)

**Files:**
- Modify: `packages/editor/src/themes/design-system/color.css` — append 15 tokens (bg-pressed, text-disabled, boxmodel-content, boxmodel-padding, boxmodel-margin, layer-accent-muted, layer-muted-alpha, layer-muted-light, border-subtle, border-default, danger-bg, success-bg, status-synced, primary-alpha-15, pillStroke, pillStroke2)
- Modify: `packages/editor/src/themes/design-system/shadow.css` — append 6 tokens (shadow-xs, shadow-modal, shadow-accent, shadow-hover, shadow-inner, selection-glow-sm)
- Modify: `packages/editor/src/themes/design-system/typography.css` — append 5 tokens (text-2xs, text-2xs-plus, text-md-plus, text-display, line-relaxed)
- Modify: `packages/editor/src/themes/design-system/a11y.css` — append 1 token (focus-ring-offset)

**Skip:** 4 glass-* tokens from V2 Table 4. Glass is being removed, not tokenized. Rows in V2 Table 1 mapping to glass tokens become manual-removal cases in Phase 5b.

**Done-when:** All ~28 tokens appended (exact count per V2 Table 4 minus the 4 glass-* rows), grouped by semantic section in each file per existing conventions. Safety gate passes. Phase 5 codemod can reference any of them.

### Phase 5 — HIGH codemod

**Sub-phase 5a — 4 unambiguous aliases (auto-apply, ~50 rows):**
- `var(--text-primary)` → `var(--buildrick-text-primary)` (repo-wide in chrome)
- `var(--text-muted)` → `var(--buildrick-text-muted)` (repo-wide in chrome)
- `var(--border-medium)` → `var(--buildrick-border-medium)` (repo-wide in chrome)
- `var(--font-mono)` → `var(--buildrick-font-family-mono)` (repo-wide in chrome)

Applied via Grep + Edit batch. One commit.

**Sub-phase 5b — remaining ~388 HIGH rows:**

**Files:**
- Create: `packages/editor/scripts/apply-ds-v2-patch.mjs`

**Script behavior:**
- Reads `docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md`, parses Table 1 rows
- Filters by `--confidence HIGH`, excludes `LOCAL_SHADOW` + `KEEP_LOCAL` + `<new-token-needed>` + `<needs-chrome-token>` rows
- Groups remaining rows by file
- Two modes:
  - `--file <path> --preview` — prints a unified diff for that file, does not modify
  - `--file <path> --apply` — applies the diff to disk
- Human reviews each preview, approves, applies
- Directory-batch commits (e.g., all `src/editor/canvas/**` changes → one commit with all files in that dir)

**Done-when:** All 438 HIGH rows applied (50 in 5a + 388 in 5b), every batch passes safety gate, visual diff matches expected changes per file.

### Phase 6 — Site leak fix (Table 2)

**Files:** Per V2 Table 2 (69 rows after `templates/*` chrome filtered out):
- Modify: `packages/editor/src/blocks/Components/*.tsx` — element renderers (ContactForm, PricingTable, Testimonials, etc.)
- Modify: `packages/editor/src/shared/utils/html/**` — any `var(--buildrick-*)` not `var(--buildrick-design-*)` in emitted HTML strings
- Optionally modify: `packages/editor/src/ai/*` — only rows where the output goes into serialized user HTML (verify per file — some AI chrome stays shell)

**Mechanism:** Re-use `apply-ds-v2-patch.mjs` from Phase 5 with a `--table 2` flag that reads Table 2 instead of Table 1. Per-file preview.

**Done-when:** All 69 rows applied. User HTML export uses `--buildrick-design-*`. Editor chrome UI unchanged (these files serialize to published sites, not editor chrome).

### Phase 7 — Schema versioning persistence

**Files:**
- Modify: `packages/editor/src/features/design-system/ui/DesignSystemTab.tsx`
  - Save path (~lines 271-275): add `designTokensSchemaVersion: CURRENT_SCHEMA_VERSION` to `setProjectSettings` call
  - Load path (~lines 141-149): read `settings.designTokensSchemaVersion`, call migration if `stored < CURRENT`, warn if `stored > CURRENT`
  - Import `CURRENT_SCHEMA_VERSION` and `migrateDesignTokens` from `../migrations`
- Modify: `packages/editor/src/features/design-system/migrations/index.ts`
  - Ensure `CURRENT_SCHEMA_VERSION` is exported (confirm existing)
  - Ensure `migrateDesignTokens(tokens, from, to)` is pure, returns input unchanged on unknown path
- Create: `packages/editor/src/features/design-system/migrations/__tests__/schema-version.test.ts`
  - Test 1: project with no `designTokensSchemaVersion` → treated as v1, loads successfully
  - Test 2: project with `designTokensSchemaVersion: CURRENT_SCHEMA_VERSION` → loads as-is
  - Test 3: project with `designTokensSchemaVersion: CURRENT_SCHEMA_VERSION + 1` → warn emitted, tokens load unchanged
  - Test 4: save path writes `designTokensSchemaVersion: CURRENT_SCHEMA_VERSION`

**Done-when:** All 4 tests pass. Manual verify: open a pre-phase project save file, load it, re-save — check project JSON gains `designTokensSchemaVersion` field.

### Phase 8 — CI gates + ESLint overlay (FAIL mode)

**Files:**
- Modify: `.github/workflows/editor-ci.yml` — add steps after `vite build`, before `vitest`:
  ```yaml
  - name: DS invariants (grep + baselines)
    working-directory: packages/editor
    run: pnpm run verify:ds
  - name: DS hex gate
    working-directory: packages/editor
    run: pnpm run lint:ds-hex
  - name: ESLint (DS rules)
    working-directory: packages/editor
    run: pnpm run lint
  ```
- Modify: `packages/editor/scripts/ds-grep-gates.sh`
  - Add Gate 7: no `@media (prefers-*)` outside `a11y.css`
  - Remove the `components.css` exclusion from Gate 4 (deprecated alias hunt)
- Modify: `packages/editor/scripts/find-inline-hex-v2.mjs`
  - Flip exit logic: exit 1 if count > 0 (no more baseline comparison)
  - Delete `.hex-baseline` file
- Create: `packages/editor/eslint.config.mjs`
  - Flat config
  - Rules:
    - Custom `buildrik/no-inline-hex` (see below)
    - Custom `buildrik/no-inspector-tokens` — bans `INSPECTOR_TOKENS` import + usage
    - Custom `buildrik/no-getPropertyValue-on-ds` — bans `getComputedStyle(...).getPropertyValue('--buildrick-*')`, redirects to `getToken()`
- Create: `packages/editor/eslint-rules/no-inline-hex.js`
  - Custom ESLint rule
  - Flags `#[0-9a-fA-F]{3,8}` literals in:
    - JSX `style={{...}}` prop values
    - Emotion template literals (`` styled.div`color: #FF0000;` ``)
    - Inline `style: "..."` string values on style-adjacent keys (color, background, border, boxShadow, etc.)
  - Honors `// @lint-hex-policy: <reason>` on preceding line as per-site bypass
- Create: `packages/editor/eslint-rules/index.js` — plugin entry
- Modify: `packages/editor/package.json`
  - Add `"lint": "eslint . --ext .ts,.tsx"` script
  - Add devDependencies if missing: `eslint`, `@eslint/js`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
- Verify: `pnpm install` succeeds; new lock entries committed

**Done-when:** `pnpm run verify:ds && pnpm run lint:ds-hex && pnpm run lint` all exit 0 locally. CI passes on a test PR. Deliberately introducing a violation (adding `#FF0000` to a chrome `.tsx`) fails CI.

## 6. Testing

### 6.1 Automated (in CI + post-phase)

| Check | Enforces | Runs in |
|-------|----------|---------|
| `vite build` | Imports resolve, TS compiles | Every phase, CI |
| `vitest run` | Unit + integration don't regress | Every phase, CI |
| `ds-grep-gates.sh` | 10 grep invariants (SSOT, a11y, no hex in chrome, etc.) | Every phase, CI (Phase 8+) |
| `find-inline-hex-v2.mjs` | Hex count monotonically non-increasing | Every phase, CI (Phase 8+) |
| `verify-design-baselines.mjs` | `design.css ↔ constants.ts` parity | Every phase, CI (existing) |
| `eslint .` | No-inline-hex in JSX, no INSPECTOR_TOKENS, no direct CSSVar reads | Phase 8+, CI |

### 6.2 Unit tests (added in Phase 7)

`packages/editor/src/features/design-system/migrations/__tests__/schema-version.test.ts` — 4 tests covering save/load/migrate/future-version paths.

### 6.3 Manual (after each phase)

- Visual diff vs Phase 2 screenshots (15 surfaces)
- `npm run dev` — open editor, click through: rail tabs, inspector sections, canvas selection, `⌘K`, one modal
- Browser console check — no `--foo is not defined` warnings
- Keyboard spot-check — rail shortcuts (`A`, `T`, `M`, etc.), undo/redo, command palette

### 6.4 End-to-end smoke (after Phase 8)

Final verification before considering DS V1 "actually done":
- Open a project created pre-Phase-7 (no `designTokensSchemaVersion`) — confirm load succeeds, migration runs, re-save writes the field.
- Open a project with a mocked `designTokensSchemaVersion: 99` (future) — confirm warn in console, tokens load unchanged.
- Create a test PR that adds `#FF0000` to `src/editor/shell/AquibraStudio.tsx` — confirm CI fails on `lint` step.

## 7. Error handling

**Compile errors during phases.** Phases 1/2/3/4 are low risk (add files, edit values, capture images). Phases 5/6 carry most risk (hundreds of edits across dozens of files). The per-file preview gate in 5b + 6 catches syntactic issues before apply. Emotion and Vite both fail-fast on unresolved CSS vars, surfacing problems at `vite build` time.

**Visual regressions.** Phase 2's screenshots are the ground truth. Acceptable regressions are pre-specified per phase (e.g., borders lighten in Phase 3 — expected). Unacceptable is any surface flipping unexpectedly (a card becoming a border, a text color inverting). Human-in-the-loop at every phase.

**Schema migration errors (Phase 7).** `migrateDesignTokens` is pure and exception-free — unknown-version path returns input unchanged. Load path never throws; worst case is tokens remain at stored values. Future-version path soft-warns rather than refusing, per decision 4.3.

**CI gate false positives (Phase 8).** FAIL mode enabled only after Phases 1-6 reduce violations to zero. If a gate fires after that: either the gate is buggy (fix the gate) or a violation slipped through (fix the violation). No "ignore this once" escape hatches.

**Codemod script failures (Phase 5b, 6).** Script exits 1 on any parse error or apply failure. Current phase aborts; `git stash` or `git checkout -- <files>` reverts partial applies. Fix the script or the specific row, re-run.

## 8. Decisions log

| Decision | Rationale |
|----------|-----------|
| Phase 1 (hex gate) runs FIRST in WARN mode, not LAST | Establishes regression baseline before any change. Without this, Phases 3-6 are flying blind. |
| Drop MEDIUM/LOW/LOCAL_SHADOW rows (334 total) from scope | Solo-session fatigue; per-file gate-driven cleanup is more sustainable than a 334-row marathon. Gate 10 surfaces them in PRs over time. |
| Soft-warn on future-schema-version load, not refuse | User might intentionally downgrade editor. Hard refuse is hostile. |
| Manual screenshots, not Playwright install | Playwright install is its own sub-project per original DS V1 audit. Manual covers the remediation window. |
| `localStorage` path kept as-is; project JSON is second, parallel versioned path | They have different semantics (draft vs canonical). Unifying is scope creep. |
| `@lint-hex-policy` becomes per-site marker, not whole-file bypass | Current whole-file bypass hides 254 hex sites across 43 files. Per-site requires explicit justification per offense. |
| Remove `components.css` exclusion from Gate 4 in Phase 8 | Codex identified Gate 4 as missing deprecated consumers there. Fix the gate, not the exclusion. |
| Remove glass effect rather than tokenize it | `DESIGN.md:11`: "No gradients, no blobs, no grain, no decorative texture." Glass-* tokens proposed by V2 Table 4 are skipped; Phase 5b removes glass usage where encountered. |
| `constants.ts` must be updated in lockstep with `design.css` edits | `verify-design-baselines.mjs` enforces parity. Phase 3 edits both. |

## 9. Apply order constraints (hard dependencies)

- Phase 1 MUST run before Phase 2 — baseline screenshots should reflect the gate's starting count.
- Phase 2 MUST run before Phase 3 — need ground-truth visuals before any token change.
- Phase 3 MUST run before Phase 4 — Phase 4's new tokens assume Phase 3's drifts are corrected.
- Phase 4 MUST run before Phase 5 — Phase 5's codemod replacements reference Phase 4's new tokens.
- Phase 6 can run before or after Phase 5 — independent (site vs shell).
- Phase 7 is independent of 3-6 — can run at any point after Phase 2. Placing it after 6 keeps the sequence clean.
- Phase 8 MUST run last — FAIL mode requires all violations cleared.

## 10. Open questions

None at design time. All upstream decisions locked:
- Scope: 8 phases
- Schema version policy: soft-warn on future
- Gate mode progression: WARN → FAIL after all phases complete
- Testing: multi-layer, Playwright deferred
- Glass: removed not tokenized
- MEDIUM/LOW/LOCAL_SHADOW: out of scope, gate-driven cleanup

## 11. Success criteria

- All 8 phase commits land on `main`, each passing the safety gate.
- `DESIGN.md` contract matches shipped `color.css` / `typography.css` / `design.css` values 1:1.
- `find-inline-hex-v2.mjs --count` returns 0 in chrome directories.
- Test PR adding `#FF0000` to a chrome `.tsx` fails CI on the `lint` step.
- A project saved pre-Phase-7 loads cleanly post-Phase-7, acquires `designTokensSchemaVersion` on first re-save.
- No console errors (`--foo is not defined`) in normal editor usage.
- Visual diff vs Phase 2 screenshots shows only expected changes (lighter borders, corrected accent scale, site defaults no longer violet/black).
