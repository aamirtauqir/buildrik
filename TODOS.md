# TODOS

## Deferred from Left Bar Redesign (2026-04-07)

### Mobile/Responsive Rail Behavior
**What:** Collapse 60px rail to hamburger or bottom tab bar on mobile viewports.
**Why:** The rail takes 16% of a 375px screen. Users on phones can't use the editor.
**Effort:** M (human: ~1 week / CC: ~1 hour)
**Priority:** P2
**Depends on:** Left bar redesign shipped and stable.

### Per-conflict Merge Resolution for Branch Merges
**What:** When merging branches with conflicting element changes, surface per-element conflict UI.
**Why:** Currently, branch merges are all-or-nothing. Designers lose work.
**Effort:** L (human: ~2 weeks / CC: ~3 hours)
**Priority:** P3
**Depends on:** Branch system implementation.

### Favorites Set→Map Migration
**What:** Migrate `useBuildTab.ts` favorites from `Set<string>` to `Map<string, number>` for usage threshold tracking.
**Why:** Enables smart favorites that promote frequently-used elements automatically.
**Effort:** S (human: ~2 hours / CC: ~15 min)
**Priority:** P3
**Depends on:** Left bar redesign shipped. See learning: `favorites-set-to-map-migration`.

### schemaVersion:2 Upgrade Handler
**What:** Add a versioned migration system for localStorage state (panel state, sidebar state, etc).
**Why:** Currently, migrations are ad-hoc per-key. A centralized system prevents phantom ID bugs.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Priority:** P2
**Depends on:** Left bar redesign shipped. See learning: `localStorage-schema-migration-existing-users`.

### Migrate TemplatesTab to State Machine API
**What:** Replace legacy `showProgress`/`canRetry`/`resetStyles` API with `useTemplateApply` state machine methods.
**Why:** Dual API creates bidirectional coupling. Legacy compat shim is a maintenance burden.
**Effort:** M (human: ~4 hours / CC: ~30 min)
**Priority:** P3
**Depends on:** Left bar redesign shipped, useTemplateApply tests passing.

### Create DESIGN.md
**What:** Document the design system: color tokens, spacing scale, typography, component patterns.
**Why:** Design decisions are scattered across 3 CSS files (ls-*, aqb-*, default.css). No single reference.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Priority:** P2
**Depends on:** Run /design-consultation for structured output.

---

## Settings Tab Fixes (2026-04-17)

### DomainsScreen: wire "Connect Domain" button
**What:** `handleConnect` in `screens/DomainsScreen.tsx:36` is an empty function. Button is rendered but does nothing.
**Why:** Custom domain connection requires a backend API (domain verification, SSL provisioning) that isn't wired yet.
**Context:** `FEATURE_FLAGS.domains` gates the entire screen behind "Coming Soon" lock — not user-visible yet. When the flag is enabled, the dead button will be apparent.
**Fix:** Wire to domain connection API once backend endpoint exists. Until then, log a "not yet implemented" message so it's not silently dead.
**Depends on:** Backend domain connection API
**Priority:** P2

### jsdom test environment broken
**What:** All `render()` and `renderHook()` calls fail with `ReferenceError: document is not defined`. Affects entire editor test suite.
**Why:** jsdom environment not properly initialized in Vitest config.
**Priority:** P2 — blocks writing new tests

---

## Component Tab Fixes (2026-04-17)

### Component swap: override preservation via path remapping
**What:** When swapping a component instance with a different component, preserve user overrides by remapping JSON patch paths from the old master tree to the new one.
**Why:** The current Fix #1 MVP (detach + instantiate) discards all overrides on swap. Users who have customized instance properties lose their work.
**Pros:** Full feature parity with design intent. Makes component swapping truly usable for users who customize instances.
**Cons:** Path remapping between arbitrary master tree structures is complex. Requires deep comparison of old vs new element hierarchies.
**Context:** `ComponentInstance` stores overrides as JSON patches with element-index paths (e.g. `#/$5/textContent/fill`). If the new component has a different element tree, these paths break. A mapping strategy is needed — element-type matching, fuzzy matching, or explicit slot naming.
**Effort:** L (human: ~2 weeks / CC: ~2 hours) — complex engine work
**Priority:** P2
**Depends on:** Component Tab Fix #1 MVP shipped

---

## Vibcoder DS Bridge (2026-04-26)

### Resolve chrome-ssot-convergence.md (designer call to self) — STAGE 1/3 LANDED 2026-04-26
**What:** Pick canonical chrome dimensions across DESIGN.md, `shared/constants/layout.ts`, `editor/rail/tabsConfig.ts`, `editor/shell/LayoutShell.css`. Reconcile rail width (48 vs 56), structure-zone panel width (280 vs 320), inspector width, header/footer heights. Update all 4 sources to one set.
**STATUS 2026-04-26:** Designer chose **Option C from chrome-ssot doc — phased convergence**. Stage 1 (vertical: topbar 48→56, footer 32→40) LANDED THIS SESSION. Stages 2+3 deferred:
  - Stage 2 (sidebar 280→240 nav / 320 authoring) — affects Layers/Pages/Components nav panels (shrink) + Add/Publish/History authoring panels (grow). Per-tab QA required. Effort: human ~3 hr + per-tab QA, CC ~30 min.
  - Stage 3 (rail 48→60, inspector 280→320) — canvas shrinks 52px combined. Affects rail icon spacing + inspector content reflow. Effort: human ~2 hr + QA, CC ~30 min.
**Why:** Blocks Gate 3 of vibcoder bridge phase (`shahg-main-design-vibcoder-integration-20260425-235606.md`). Stage 1 unblocks vertical-token folds; Stages 2+3 still gate the layout.css 56/320 vs 280/280 reconciliation.
**Depends on / blocked by:** None. Stage 2 ideal next; Stage 3 after Stage 2 verified clean.
**Priority:** P1 (downgraded from blocking — Stage 1 done, vibcoder layout fold still gates on Stages 2+3)

### Triage vibcoder non-chrome surfaces for separate canvas/dashboard initiative
**What:** When dashboard / CMS / mobile-editor work starts (months from now), triage vibcoder's 73-component bundle to identify components that belong to non-editor-chrome domains: dashboard surfaces, CMS table-frame, mobile/tablet rail variant, FAB, asset-library workspace, color-picker popover. Decide scope per-domain.
**Why:** Codex flag #7 (plan-eng-review of vibcoder bridge addendum, 2026-04-26) — vibcoder's `COMPONENTS.md` includes surfaces beyond editor chrome (dashboard `screens/dashboard.html`, CMS `bdr-table-frame`, mobile rail `bdr-rail--horizontal`, FAB `bdr-fab`, etc.). Without this triage, future canvas/dashboard work risks rebuilding what vibcoder already specs OR pulling non-chrome surfaces into editor-chrome React by mistake.
**Pros:** Visible reminder that vibcoder is partial spec for canvas/dashboard, not just chrome. Stops scope-creep into v3 rollout. Reuses existing design work when canvas/dashboard initiative starts.
**Cons:** Triage is 2-hour work item, low complexity but needs domain context.
**Context:** Vibcoder bundle at `docs/reference/vibcoder/` (post-Commit 1 of bridge phase). Scope-flag rows in `docs/reference/vibcoder/components/COMPONENTS.md` lines 70-90 + 130-150. Plan addendum's Out-of-Scope section already documents this; this TODO surfaces it on the action board.
**Effort:** Human ~2 hr / CC ~30 min.
**Depends on / blocked by:** Vibcoder bridge phase Commit 1 (relocates bundle to docs/reference/). Otherwise no dependency — can sit until canvas/dashboard initiative scopes up.
**Priority:** P3

### ~~Decide typography display font — Inter Tight vs General Sans~~ — RESOLVED 2026-04-26
**Decision:** **KEEP Inter Tight.** Vibcoder typography.css's `"General Sans"` display token will NOT fold. Shipped `--buildrick-font-family-display: "Inter Tight", system-ui, sans-serif` remains canonical. Plan line 287 (General Sans .woff2 OOS) holds. Vibcoder spec deviates on this one row; acceptable per "partial reference, not authoritative" framing. Commit 2 mechanical-diff doc annotates typography.css display row as `LEAVE (vibcoder spec deviates)`.

### ~~Decide a11y.css fold direction (vibcoder bridge)~~ — RESOLVED 2026-04-26
**Decision:** **Cherry-pick + verified no fold needed.** Vibcoder a11y.css `@media (prefers-contrast: high)` block defines `--buildrick-border: #64748B` and `--buildrick-border-light: #94A3B8`. Shipped a11y.css already defines exact same values at lines 13-15. Diff-verified 2026-04-26: zero delta in border values. Vibcoder's `.bdr-btn` BEM selectors are bridge-rename targets per Premise 3 (port-time renames `bdr-X` → `bd-{domain}-X`). Shipped's 65 extra lines (focus rings, skip link, print styles) stay canonical. Commit 2 annotates a11y.css row as `SKIP (vibcoder is older + thinner; values already overlap)`.

### ~~Define vocabulary expansion sign-off process (vibcoder bridge)~~ — ENFORCEMENT LANDED 2026-04-26
**STATUS:** Rule defined + automated enforcement shipped same day.
**RULE:** Each Commit 3.x vocab-add fold MUST contain in commit body, one line per new tier:
```
vocab-add: <token name> | tier=<tier> | design-md=<section updated OR "no-change-required: <reason>"> | ack=<initials>
```
Example for adding `--buildrick-radius-md-plus`:
```
vocab-add: --buildrick-radius-md-plus | tier=10px (between md=8 and lg=12) | design-md=A1.3 Border-radius scale (added md-plus row) | ack=SG
```
For pure refactor (literal→alias indirection, same resolved value), use:
```
vocab-add: --buildrick-info | tier=alias-only | design-md=no-change-required: literal #2D6DFF replaced with var(--buildrick-accent), same resolved value | ack=SG
```
**ENFORCEMENT:** `packages/editor/scripts/check-vocab-add.sh` validates HEAD (or any sha). Wired as `DS vocab-add gate` step in `.github/workflows/editor-ci.yml`. Triggers only when a commit (a) touches `packages/editor/src/themes/design-system/*.css` AND (b) introduces at least one NEW `--buildrick-*` token name. Value-only changes + non-DS commits + merge commits auto-skip. Self-tested (4/4 pass): missing-vocab rejection, valid vocab acceptance, value-change skip, non-DS-touch skip.

---

## Post-Migration: Layers Tab Theme (2026-04-17)

### Playwright visual regression infra
**What:** Add Playwright-based visual regression tests covering all 7 sidebar tabs (Layers, Build, Design, Pages, Templates, History, Settings).
**Why:** No automated visual regression infra exists. Manual QA (Task 8) is the current gate — this automates it.
**Effort:** M (human: ~2 days / CC: ~1 hr)
**Priority:** P2
**Depends on:** Layers tab migration shipped

### CI grep rule for banned indigo/violet hex
**What:** Add a CI step that greps for banned indigo/violet hex values (`#1D4ED8|#1E40AF|#4F46E5|indigo|violet`) in `packages/editor/src` and fails the build.
**Why:** Prevent indigo regression — the root cause of the light-theme leakage was 50 hardcoded indigo hex values.
**Effort:** S (human: ~1 day / CC: ~30 min)
**Priority:** P2
**Depends on:** Layers tab migration shipped

### ~~Post-migration hardcoded indigo audit~~ — RESOLVED 2026-04-26
**Decision:** No work needed. Theme unification (2026-04-18 light-theme flip) already swept these. Verified 2026-04-26: `grep -rE '#F0F4F8|#EEF2F7|--surface-base|--surface-canvas' packages/editor/src --include='*.css'` returns zero hits. LayoutShell.css line numbers in original TODO predate theme unification — file has been rewritten since. No code change required.
