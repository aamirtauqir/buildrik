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

### Post-migration hardcoded indigo audit
**What:** Audit `editor/rail/LayoutShell.css` (lines 59, 258) for `--surface-base`/`--surface-canvas` light fallbacks (`#F0F4F8`, `#EEF2F7`). Update to dark fallbacks.
**Why:** LeftSidebar.css Task 4 noted these files still have light-mode fallbacks for `--surface-*` tokens.
**Effort:** S (human: ~1 hr / CC: ~10 min)
**Priority:** P2
**Depends on:** Layers tab migration shipped
