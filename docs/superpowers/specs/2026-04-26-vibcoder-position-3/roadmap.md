# Vibcoder Position 3 Integration — Execution Roadmap

**Date:** 2026-04-26 (last updated 2026-04-28 at M8 close)
**Companion:** `design.md` (this folder)
**Total scope:** ~6-8 weeks dispatched CC + ~10-12 hr human QA

**Phase numbering note (post-M8):** The execution plan renumbered late in the
arc. What this roadmap originally called "Phase 4 — Layouts" was deferred; the
chrome re-port (originally Phase 5) shipped as **Phase 4 chrome re-port** at
M8 (2026-04-28). The layout phase folds into Phase 5 chrome integration where
layout primitives land alongside consumer rewrites. See `poc-findings.md`
Phase 4 section for the actual delivered scope.

## Phase dependency graph

```
Phase A (Infrastructure)      Phase B (Token Folds)      Phase C (Chrome-ssot Stage 2)
  - Codemod build             - 8 commits Strategy C       - Sidebar 280→240/320
  - Plan v3 doc               - Vocab-add per tier         - 200ms ease-out
  - SCOPE.md                  - DESIGN.md per tier         - Layers nav, others authoring
  - 4 new gates                                            - P0 + P1 QA
       │                            │                            │
       └────────────┬───────────────┘                            │
                    │                                            │
                    ▼                                            │
            Phase 0 (POC)  ◄──────────────────────────────────────┤
            - Button + ListRow + Tag                              │
            - Validates Path B end-to-end                         │
                    │                                             │
                    ▼                                             │
            Phase 1 (Atoms)                                       │
            - 25 atoms in 5-6 batches                             │
                    │                                             │
                    ▼                                             │
            Phase 2 (Molecules)                                   │
            - 18 molecules in 5 batches                           │
                    │                                             │
                    ▼                                             │
            Phase 3 (Organisms)  ◄──────────────────── Phase D (Chrome-ssot Stage 3)
            - 15 organisms in 5 batches                  - Rail 48→60
            - Codex routing → blocking                   - Inspector 280→320
                    │                                    - Canvas auto-fit recalc
                    ▼                                            │
            Phase 4 (Layouts)  ◄─────────────────────────────────┘
            - 7 layouts in 2 batches
                    │
                    ▼
            Phase 5 (Re-port existing 37)
            - Codemod-driven
            - Buildrik-specifics audited
                    │
                    ▼
            Phase 6 (Visual regression infra)
            - Playwright snapshot infra
            - Per-component snapshots
            - Gate 22 (gallery presence) ships
```

## Parallel tracks

**Track 1 (Infrastructure → Components):** A → 0 → 1 → 2 → 3 → 4 → 5 → 6 (sequential)

**Track 2 (Token Folds):** B (8 commits, can run anytime after A)

**Track 3 (Chrome-ssot):** C (Stage 2) → D (Stage 3), can run parallel to component
phases. C should land before Phase 1 atoms ship to avoid layout reflow during
component port QA. D should land before Phase 3 organisms (drawer dimensions
depend on rail width).

## Phase A — Infrastructure (~1 week dispatched, ~7 hr CC after Pass 6 trim)

### A1: Build codemod toolchain + bundle pinning (~3.5 hr CC)

- Write `scripts/vibcoder-codemod-1.ts` (class rename, includes @keyframes and
  animation-name reference handling per Pass 6 finding #2)
- Write `scripts/vibcoder-codemod-2.ts` (token fold surface)
- Write `scripts/vibcoder-codemod-3.ts` (namespace bridge + alias mirror, with
  SCOPE.md token allowlist filter to skip dashboard/mobile/CMS tokens)
- Write `scripts/__tests__/codemod-rename.test.ts` (12 unit tests minimum — see
  design.md Section 5)
- Write `scripts/vibcoder-bundle-pin.ts` — bundle pinning artifact manager
  (computes SHA256 of reference + components dirs, writes
  `docs/reference/vibcoder/.bundle-version`, refuses codemod run on hash mismatch)
- Add `.gitignore` exception: `!docs/reference/vibcoder/.bundle-version`
- Add npm scripts:
  - `"vibcoder:diff"` — surface bundle changes vs pinned version
  - `"vibcoder:pin"` — bump `.bundle-version` after intentional bundle update
  - `"vibcoder:vendor"` — refuses if hash mismatch; runs all 3 codemods if pinned

**Validation:** All 12 unit tests pass. Bundle pinning refuses codemod when on-disk
hash differs from `.bundle-version`. Manual run on Button source produces expected
output in `themes/components/bd-btn.css` + `src/preview/button.html`.

### A2: Write SCOPE.md token allowlist section (~15 min CC)

SCOPE.md already lives in this spec folder. Add new section: "Token Filter for
Codemod 3" listing `--buildrick-X` name patterns to skip during alias auto-mirror
(dashboard/mobile/CMS tokens). Initially populated based on dashboard-bucket
component CSS inspection.

(Plan v3 task A2 from earlier roadmap version REMOVED per Pass 6 scope-guardian
finding #5 — spec set IS the plan in solo workflow.)

### A3: Add 3 new gates (~1.5 hr CC, Gate 20 cut, Gate 22 cut)

- Gate 19 (bdr-X leak detection) added to `ds-grep-gates.sh`
- Gate 21 (namespace direction R2) — extends existing partial coverage
- vibcoder-port gate (separate script, similar to `check-vocab-add.sh`) — ALSO
  performs COMPONENTS.md presence check (merged Gate 20 functionality per Pass 6
  finding #13)
- Negative tests for each new gate
- Gate 20 NOT added separately — coverage merged into vibcoder-port gate
- Gate 22 (gallery presence) NOT added — broken gallery is its own signal per
  Pass 6 finding #14

**Validation:** Gates 19, 21, vibcoder-port all PASS on shipped state. Negative
tests fire correctly.

### A4: Update editor CLAUDE.md (~30 min CC)

- Add "Vibcoder Bridge" section under DESIGN SYSTEM area
- R2 namespace exception documented (with permanence framing)
- Codex routing rule added — advisory throughout migration arc
- Position 3 framing explicit
- Bundle pinning workflow documented

### A5: User review gate

- User reviews amended spec set
- Approves or requests further changes
- Hand off to `/writing-plans` skill

## Phase B — Token Folds (~3 hr CC, parallel after A)

### B-C1: Color Tier 1 (ink alpha ramp, 12 tokens)

Add 12 `--buildrick-ink-{04,06,08,10,12,15,18,20,25,30,32,40}` to `color.css`.
Codemod auto-mirrors `--bd-ink-*` to `bd-aliases.css`. DESIGN.md adds new ink ramp
section. Commit body includes vocab-add per tier.

### B-C2: Color Tier 2 (soft semantic tints, 4 tokens)

Add `--buildrick-{accent,success,warning,error}-soft` at 0.12 alpha.

### B-C3: Color Tier 3 (on-dark tints, 4 tokens)

Add `--buildrick-on-dark-{10,12,15,40}`.

### B-C4: Color Tiers 5-10 grouped + Tier 12 alias-only

Tiers 5 (status bg-strong), 6 (ink mid-range), 7 (shadow black), 8 (highlight mark),
9 (status bg-light), 10 (status border-soft). Plus Tier 12 literal→alias
indirections (alias-only flag).

Tiers 4 (accent alpha extras) and 11 (amber-soft) deferred per token-diff doc.

### B-C5: Typography (5 dense scale)

Add `--buildrick-text-{3xs,3xs-plus,xs-plus,sm-half,md-half}`. Designer call required
for 9px and 9.5px (a11y risk under 11px) and half-step sizes (off-grid).

### B-C6: Radius (5 tiers)

Add `--buildrick-radius-{2xs,xs,2xl,circle,md-plus}`. Designer call required for
2xs/xs (ultra-rare), 2xl (alternative path), md-plus (off-grid). Recommend ADOPT
circle.

### B-C7: Z-index drawer (1) + Motion alias (trivial)

Add `--buildrick-z-drawer: 250` (between popover 200 and modal 300). Add motion
alias `--buildrick-duration-default: var(--buildrick-duration-normal)`.

### B-C8: Shadow refactor (alias-only)

Convert `--buildrick-shadow-dropdown` and `--buildrick-shadow-accent` from literals
to var() aliases. Pure refactor, 0 net new.

## Phase C — Chrome-ssot Stage 2 (~1 hr CC + ~3 hr human QA)

### C1: Layout constants (~15 min CC)

Edit `shared/constants/layout.ts`:
- `SIDEBAR_NAV_WIDTH = 240`
- `SIDEBAR_AUTHORING_WIDTH = 320`

### C2: LayoutShell.css width tokens (~15 min CC)

Update sidebar drawer width to consume new constants. Animation: `transition:
width 200ms ease-out`.

### C3: Tab classification (~15 min CC)

Edit `tabsConfig.ts`:
- Layers: `width: "nav"`
- All others (Add, Publish, History, Media, Design, Settings, Templates, Pages,
  Components): `width: "authoring"`

### C4: P0 QA (~2 hr human)

Manually verify in browser:
- Layers tab at 240 — list renders, no clipping, drag-resize works
- Add/Build tab at 320 — form fields fit, no wasted space
- Publish tab at 320 — CTA visible, status displays correctly
- Pages tab at 320 — navigation works, page list renders

### C5: Baseline ratchet + commit (~15 min CC)

Update `.layout-literals-baseline`. Single commit with body explaining Stage 2.

### C6: P1 QA (~1 hr human, post-ship)

Verify Components, Templates, Media, Design, History, Settings tabs at 320. Patch
any regressions in follow-up commits.

## Phase D — Chrome-ssot Stage 3 (~1 hr CC + ~2 hr human QA)

### D1: Layout constants

`RAIL_WIDTH = 60`, `INSPECTOR_WIDTH = 320`.

### D2: LayoutShell.css

Rail icon centering recalc. Inspector content reflow allowance.

### D3: Canvas auto-fit verification (~30 min)

Test with smallest common artboard (320×240). Verify auto-fit zoom math handles
the 52px horizontal shrink.

### D4: P0 QA — rail icon centering + inspector form reflow

### D5: Baseline ratchet + commit

## Phase 0 — POC (~4 hr CC, ~1 day calendar)

### 0.1: Vendor Button + ListRow + Tag

Run codemod on each. Verify output in `themes/components/` and `src/preview/`.

### 0.2: Write React components

`shared/ui/Button.tsx`, `ListRow.tsx`, `Tag.tsx`. Render bd-X classes.

### 0.3: Write tests

CSS scan + interaction tests per primitive.

### 0.4: Build minimal gallery

`src/preview/index.html` with iframe iteration. Side-by-side HTML demo + React
render per primitive.

### 0.5: Validate

- Codemod runs cleanly (0 leaks)
- bd-aliases.css auto-mirror successful
- Gates 19, 20, 21, vibcoder-port pass
- Visual diff between HTML demo and React render = 0 pixels

**Failure mode:** If POC validation fails, time-box to one day. Surface failure to
user. Adjust Path B or escalate Q2 re-decision.

## Phase 1 — Atoms (~1 week dispatched, ~5 commits)

Five batches grouped by category. POC pre-shipped button.css (covers Button +
ButtonSplit) and tag.css. 22 atom files remain post-POC:

- **Form atoms (5):** input, select, textarea, checkbox, switch
- **Display atoms (5):** avatar, badge, count, thumb, icon
- **Interactive atoms (3):** icon-button, slider, link
- **Status atoms (4):** progress, skeleton, spinner, helper-text
- **Structural atoms (5):** divider, grip, breakpoint-switcher, label, kbd

Each batch = 1 commit with 3-5 primitives, ~3 hr CC per batch.

**Per-batch canary protocol (Pass 6 finding #7):** Each batch starts with codemod
run on FIRST primitive only. Vendor + gate check + spot-check gallery. If pass,
proceed with remaining batch primitives. If fail, halt batch + investigate codemod
+ fix + re-run. Adds ~5 min per batch.

## Phase 2 — Molecules (~1.5 weeks dispatched, ~4 commits)

Four batches grouped by usage frequency. POC pre-shipped list-row.css. 17 molecule
files remain post-POC:

- **Navigation/composition (4):** card, form-field, section-head, surface-head
- **Interactive (5):** actionbar, breadcrumb, chipbar, color-trigger, tabs
- **Notification (4):** popover, toast, toggle-row, tile-meta
- **Specialized (4):** rail-tile, search-input, toolbar, uploader

## Phase 3 — Organisms (~2 weeks dispatched, ~4 commits)

Four batches in dependency order. 16 organism files (no POC overlap):

- **Foundation (2):** overlay-mount, drawer
- **Containers (6):** modal, footer, topbar, left-panel, inspector, rail
- **Specialized (6):** command-palette, history-panel, notification-center,
  color-picker, empty-state, a11y-overlay
- **Drawer variants (2):** pages-drawer, templates-drawer

**Milestone (per Pass 6 finding #15):** Codex routing remains advisory throughout
migration. Reconsider blocking mode post-Phase 5 based on realized false positive
rate.

## Phase 4 — Layouts (~3 days dispatched, ~2 commits) — DEFERRED

**Status:** deferred and folded into Phase 5 chrome integration (see header
"Phase numbering note" — chrome re-port shipped as Phase 4 at M8). Layout
primitives (sidebar-shell, stack, cluster, grid, center, frame, switcher) ship
alongside consumer rewrites in Phase 5 rather than as a standalone batch.

Two batches:

- **Most-needed:** sidebar-shell, stack, cluster
- **Universal:** grid, center, frame, switcher

## Phase 5 — Chrome integration — SHIPPED 2026-04-28 (M9)

Phase 5 shipped at M9 same calendar day as M8 Phase 4 — Buckets C + D fully
landed. Bucket A subsequently shipped 2026-04-28 once verified the vibcoder
bundle was already vendored in-repo (re-classified from "DEFERRED upstream" to
"single-repo work"). Bucket B remains deferred upstream pending Tooltip/Toast/
ContextMenu Radix-backing upgrades. Bucket E was already at
`src/shared/extensions/` by design, no work required.

**Bucket A — Hybrid simplification — SHIPPED 2026-04-28.** Vibcoder Popover now
Radix.Popover-backed compound (T1 `e0ef916`). `src/shared/ui/Popover.tsx` shim
deleted with 4 consumer hand-ports (T2 `e1874f9`). `useFocusTrap` deleted as
orphaned after shim removal (T3 `343957f`). `codemod:phase4` chain fully retired
including 12 orphan fixture pairs (T4 `309890b`). 34 files / +452 / −1155
(net −703 LOC). E2 + E3 contract waivers documented inline in vibcoder
Popover.tsx docstring as precedent for future Bucket B Radix-backings.
See `poc-findings.md` Bucket A findings section for full detail.

**Bucket B — Keep-legacy → bridge ports — IN PROGRESS.**

- **B1 Tooltip — PENDING.** Plan written 2026-04-30 at
  `docs/superpowers/plans/2026-04-30-vibcoder-bucket-b1-tooltip.md`. 10 chrome
  consumers. Awaits execution.
- **B2 ContextMenu — SHIPPED 2026-04-30 (pure deletion).** Pre-flight
  inventory revealed the shim was effectively dead: zero callers of the
  component or `useContextMenu` hook; the 1 type-importer (dropOperations.tsx)
  housed a half-finished feature path gated on `onShowContextMenu` callback
  that no caller ever supplied. Original plan assumed live consumer + Radix
  shape match — both wrong. Pure deletion was the correct disposition: shim
  (179 LOC) + dead heading-menu branch (~65 LOC) + dead callback param +
  type imports + barrel cleanups, 257 deletions. No Radix.ContextMenu
  install. No new wrapper. Commit `d81bed1`.
- **B3 Toast — PENDING.** Plan written 2026-04-30 at
  `docs/superpowers/plans/2026-04-30-vibcoder-bucket-b3-toast.md`. 27 chrome
  consumers, codemod-assisted. Awaits execution.

HelpTooltip retained as a separate molecule (Phase 5 carry-over); not part of
Bucket B execution.

**Bucket C — Adapter shim deletion — SHIPPED.** All 19 Phase 4 shims deleted
across T1-T4. Atoms (T2 ×15 + T2.X barrel codemod), molecules (T3 ×4), Modal (T4
+ ConfirmDialog extracted as a side-effect composition).

**Bucket D — Composition rewrites — SHIPPED.** CopyButton, PremiumBadge,
UpgradeModal moved to `src/shared/extensions/` (T5). PanelHeader (T3.D) and
ConfirmDialog (T4 follow-up) joined the same folder during their respective
tasks, plus Skeleton (extracted in T2.B). 6 files total now in `extensions/`.

**Bucket E — Stays as extension permanently — NO ACTION.** Icons.tsx,
QuickSwitcher, Resizable, TreeView, UpgradeGate, ErrorBoundary, InfoBanner stay
at `src/shared/ui/` per existing folder ownership rules. Not vibcoder primitive
ports; Buildrik domain code.

**Open issue:** #93 PopoverArrow — CLOSED 2026-04-28. `Popover.Arrow` now
re-exports `RadixPopover.Arrow` from the vibcoder compound (Bucket A T1
`e0ef916`).

**Reference:** `poc-findings.md` Phase 5 findings + Bucket A findings sections
capture commit tables, LOC deltas, surfaced lessons (5 inventory-script gaps +
6th gap from Bucket A T4: orphan fixture pairs after codemod-script deletion),
decision rubric, extensions/ folder contract, and E2/E3 contract waiver
precedents.

## Phase 6 — Visual regression infrastructure (~1 week dispatched)

- Wire Playwright visual snapshot infra (per TODOS T-VISUAL-REG)
- Add snapshot per primitive
- Gate 22 (gallery presence) ships
- Quarterly post-mortem cadence begins

## Milestones + check-ins

| Milestone | Trigger | Action |
|---|---|---|
| **M1: Infrastructure live** | Phase A complete | Pass 6 review, user review, hand off |
| **M2: POC validated** | Phase 0 complete | Decide whether to proceed Phase 1 |
| **M3: Atoms complete** | Phase 1 complete | All 25 atoms in gallery, gates green |
| **M4: Molecules complete** | Phase 2 complete | Composition working |
| **M5: Organisms complete** | Phase 3 complete | Codex routing remains advisory through chrome re-port (per Pass 6 finding #15) — SHIPPED 2026-04-27 (`bcfeda1`+`d146bb0`+organism close) |
| **M6: Layout coverage** | (merged into Phase 5 chrome integration) | Layout primitives ship alongside consumer rewrites |
| **M7: Re-port complete** | (renumbered → M8 — see Phase numbering note) | Adapter shim layer landed, consumer rewrites pending in Phase 5 |
| **M8: Phase 4 chrome re-port shipped** | T1–T8 complete | 19 adapter shims + 19 codemods + 17 keep-as-extension stamps + Gate 23 wired + Gate 24 ratcheted 264→100 — SHIPPED 2026-04-28 |
| **M9: Phase 5 chrome integration shipped** | T1–T5 complete | 19 adapter shims deleted (Bucket C) + 6 compositions in `src/shared/extensions/` (Bucket D) + Gate 24 stable at 79 + tsc 71 stable + vitest 213/1743 + Buckets A+B deferred upstream — SHIPPED 2026-04-28 |
| **M10: Visual regression live** | Phase 6 complete (post-Phase-5) | Pixel-level drift detection |

## Risk register (post-Pass 6)

| Risk | Mitigation |
|---|---|
| Codemod fails edge case in Phase 1+ scale | 12 unit tests + per-batch canary protocol (Pass 6 #7) |
| Vibcoder bundle updates break in-flight phase | `.bundle-version` pin file enforced by codemod (Pass 6 #1) |
| Codex routing false positives | Advisory throughout migration arc; reconsider blocking post-Phase 5 (Pass 6 #15) |
| Re-port loses existing primitive logic | Per-primitive preservation contract + test backfill before re-port (Pass 6 #4) |
| Stage 2/3 breaks per-tab content | P0/P1 QA tier; ratchet baseline only after verification |
| Gallery infra hostile to Vite | Time-box Q7 to 1 day; fall back to vendored vibcoder gallery only |
| Emotion + vendored CSS cascade collision | `@layer` strategy (Pass 6 #3) |
| Codemod 3 token alias pollution | SCOPE.md Token Filter section + Codemod 3 allowlist check (Pass 6 #9) |
| Solo-QA capacity for 14 surfaces × 3 viewports | Accepted advisory risk; P1 tabs verified post-ship |
| Arc abandonment mid-stream | Phase 0 POC = kill gate at 1 day; Phases 1-5 each ship visible value at gate-pass |
| Pass 6 surfaces fundamental flaw | DONE — 15 findings addressed inline before writing-plans handoff |

## Success conditions for arc complete

- [ ] Plan v3 supersedes v2
- [ ] SCOPE.md tracks 73 components in 4 buckets
- [ ] 50 net-new tokens folded across 8 commits
- [ ] 65 chrome components ported (Phases 1-4)
- [ ] 37 existing primitives re-ported (Phase 5)
- [ ] Stages 2 + 3 chrome-ssot landed
- [ ] Gallery shows side-by-side parity for all primitives
- [ ] 5 new gates active (19, 21, 22, 23, 24) — Gate 20 skipped during arc; 23+24 added in Phase 4 chrome re-port
- [ ] Codex routing in blocking mode
- [ ] Visual snapshot infra catches drift
- [ ] Quarterly post-mortem cadence established
