# Editor Deep Audit — Design

**Date:** 2026-04-29
**Scope:** `packages/editor/src/` (~155K LOC, 2119 files)
**Goal:** Systematic fix of performance blockers, business logic bugs, and structural duplications.

---

## Context

The editor has accumulated 1020 commits since 2025. Three independent audit tracks surfaced 22 confirmed issues across performance, duplication, and business logic. Codex review (2026-04-29) removed 4 phantom bugs and corrected 9 incomplete items. Fixing them ad-hoc risks regressions. This design establishes a sequenced, spec-driven remediation.

**Tracks:**
- **A** = Performance (7 critical issues)
- **C** = Business Logic Bugs (8 confirmed issues)
- **B** = Duplications & Wrappers (4 categories)

**Sequence:** A → C → B. Performance fixes improve UX immediately. Business logic prevents data loss. Duplication cleanup is safe only after A and C stabilize the surface.

---

## Track A: Performance Blockers

### A1 — `StyleEngine.ts`: Full CSS rebuild on every property change

**Problem:** `setProperty()` triggers `updateStylesheet()` (lines 551–555) → full `this.toCSS()` rebuild on every call. `inheritStyles()` loops `setProperty()` N times, and `setProperty()` calls `setRule()` which also rebuilds, causing up to 2N full CSS regenerations for bulk style updates.

**Fix:** Batch style mutations. Add a `pendingUpdate` flag. `updateStylesheet()` sets the flag and schedules one RAF-aligned flush. All mutation methods (`setProperty`, `setRule`, `removeProperty`, `removeBreakpointStyleProperty`) only set the flag. A single RAF callback performs one full CSS rebuild. Synchronous `getStyles()` does not flush — it reads the in-memory `styles` Map directly, avoiding DOM side effects.

**Files:** `engine/styles/StyleEngine.ts`

### A2 — `StyleEngine.ts`: O(n) rule scan

**Problem:** `findRule()` (lines 542–545) scans `Array.from(this.styles.values())` on every lookup by `selector + mediaQuery`.

**Fix:** Maintain a `Map<string, Rule>` keyed by `selector + '|' + mediaQuery` in parallel with `this.styles`. Update the map on `addRule`, `removeRule`, and `setRule`. O(1) lookup.

**Files:** `engine/styles/StyleEngine.ts`

### A3 — `SnapCalculator.ts`: DOM-heavy drag frames

**Problem:** `calculateSmartGuides()` (lines 133–253) calls `getElementBounds()` → `getBoundingClientRect()` + `getComputedStyle()` for every non-dragged element on every drag frame.

**Fix:** Cache bounds in a `Map<string, DOMRect>` at drag-start. Invalidate on: element `styles` change, element `children` change, canvas scroll, or viewport resize. Read from cache during drag. Bounds are relative to canvas rect; drag auto-scrolls, so scroll invalidation is required.

**Files:** `engine/canvas/SnapCalculator.ts`, `engine/canvas/BoundsCalculator.ts`

### A4 — `SpacingCalculator.ts`: Recursive tree walk + DOM queries

**Problem:** `updateSpacingIndicators()` (lines 30–64) recursively walks the full element tree and hits DOM for every element on spacing overlay toggle.

**Fix:** Share the same bounds cache as A3. Reuse cached `DOMRect`s. Re-query on cache miss or scroll/resize invalidation.

**Files:** `engine/canvas/SpacingCalculator.ts`

### A5 — `VersionHistoryManager.ts`: O(n²) version compare

**Problem:** `compareVersions()` (lines 638–718) iterates `allElementIds` and calls `findElementById()` (recursive tree traversal, O(n)) per ID. Total O(n²).

**Fix:** Flatten both snapshots into `Map<string, Element>` before comparison. O(n) total.

**Files:** `engine/VersionHistoryManager.ts`

### A6 — `Composer.ts`: Anonymous listener leaks

**Problem:** Constructor registers `this.collaboration.on("operation:apply", ...)` and `this.on("element:selected", ...)` with anonymous arrows (lines 155–176). `off()` requires exact reference; without stored refs, individual removal is impossible. Only `removeAllListeners()` in `destroy()` cleans up.

**Fix:** Store handler references in private `Set` fields. Expose `removeCollaborationListeners()` and `removeSelectionListeners()` for targeted cleanup.

**Note:** Codex review found no proven retained-owner leak path beyond "anonymous arrows exist." `destroy()` already calls `removeAllListeners()`. Treat as preventive hygiene, not confirmed bug.

**Files:** `engine/Composer.ts`, `engine/EventEmitter.ts`

### A7 — `OTEngine.ts`: O(m×n) patch transform

**Problem:** `transform(patchA, patchB)` (lines 255–303) uses nested `for` loops over operation arrays.

**Fix:** Add operation-type fast paths within the nested loop (e.g. `replace` vs `replace` → latter wins). Do NOT add naive "different object keys" early-exit — transform handles parent deletes and array index shifts, so non-overlap fast paths can corrupt patches on shared array parents or ancestor/descendant paths.

**Files:** `engine/OTEngine.ts`

---

## Track C: Business Logic Bugs

### C1 — `Composer.ts`: Async init race

**Problem:** `initialize()` is async but invoked synchronously in constructor (line 184). Callers polling `isReady()` immediately after `new Composer(...)` can see `false` indefinitely. `initialize()` can also reject via `media.init()`, `sync.init()`, or `loadProject()`, leaving the Composer in an undefined state.

**Fix:** Expose `whenReady(): Promise<void>` that resolves on success and rejects with explicit error on init failure. Internal callers await it before state-mutating operations. Keep `isReady()` for backward compatibility.

**Files:** `engine/Composer.ts`

### C2 — `MediaManager.ts`: Duplicate blob URLs

**Problem:** `getAssetSrc` (lines 125–157) is async. Concurrent calls for same `id` create duplicate blob URLs and corrupt ref-count map before either `set` completes.

**Fix:** Deduplicate with `Map<string, Promise<string>>` in-flight cache. Return existing promise for duplicate concurrent requests.

**Files:** `engine/media/MediaManager.ts`

### C3 — `BuildrikSyncProvider.ts`: Unhandled `loadProject` errors

**Problem:** `loadProject` has no `try/catch` (lines 50–53). tRPC network or schema errors bubble unhandled.

**Fix:** Wrap in `try/catch`. Keep throwing on failure (do not change return shape to `{ success, error }` — that breaks callers `initBuildrikSync()` and existing tests at `buildrik-sync-provider.test.ts:99`). Throw a domain error with context.

**Files:** `services/BuildrikSyncProvider.ts`

### C4 — `BuildrikSyncProvider.ts`: Auto-save timeout overlap

**Problem:** Auto-save timeout handler (lines 127–143) does not guard against overlapping retries. If `saveProject` hangs, rapid `project:changed` events fire concurrent saves.

**Fix:** Add `isSaving` boolean + `pendingChanges` dirty flag. If save in flight, set `pendingChanges = true` instead of returning early. On save completion, if `pendingChanges` is true, trigger another save. Reset both flags in `finally`. This preserves trailing changes without dropping them.

**Files:** `services/BuildrikSyncProvider.ts`

### C5 — `CloudSyncService.ts`: Unvalidated remote JSON

**Problem:** `fetchRemote` (lines 428–448) returns `res.json()` without validating HTTP `Content-Type` or JSON shape.

**Fix:** Check `Content-Type: application/json`. Parse with Zod schema before returning.

**Files:** `services/CloudSyncService.ts`

### C6 — `HistoryManager.ts`: Empty checkpoint crash

**Problem:** `reconstructState` (lines 280–303) assumes a checkpoint exists.

**Note:** Codex review found `trimHistory()` re-materializes a checkpoint when one is shifted out (`HistoryManager.ts:377`). Empty checkpoint state is unlikely but not impossible. Keep as defensive guard.

**Fix:** Guard `targetIndex`. If no checkpoint found, return current state and log warning instead of throwing.

**Files:** `engine/HistoryManager.ts`

### C7 — `CollaborationManager.ts`: Unvalidated project import

**Problem:** `handleSyncResponse` (lines 715–724) passes network-received `project` directly into `this.composer.importProject` with zero validation.

**Fix:** Validate `project` payload with Zod schema before import. Reject malformed payloads with explicit error. Allocate schema to `shared/schemas/project.ts`.

**Files:** `engine/collaboration/CollaborationManager.ts`, `shared/schemas/project.ts`

### C8 — `PluginManager.ts`: Half-registered plugin on load failure

**Problem:** `register` stores plugin in `this.plugins` before `await this.load(id)` (lines 32–70). If `load` throws, plugin remains half-registered with `loaded: false` and no rollback.

**Fix:** Move storage after successful `load`. If `load` throws, do not add to registry.

**Files:** `engine/PluginManager.ts`

### C9 — `PublishTab.tsx`: Hardcoded SEO readiness

**Problem:** `hasSeoTitle`, `hasMetaDesc`, `hasSocialImg` hardcoded to `false` (lines 302–304). Publish readiness logic is broken.

**Fix:** Wire to canonical persisted SEO fields: `settings.seo.metaTitle`, `settings.seo.metaDescription`, `settings.seo.ogImage`. Do not use `page.seo.*` — that data model does not exist.

**Files:** `editor/sidebar/tabs/publish/PublishTab.tsx`

---

## Track B: Duplications & Wrappers

### B1 — `ComponentManager.ts`: Delete 8 pass-through methods

**Methods:** `instantiateComponent`, `getInstancesOfComponent`, `detachInstance`, `syncInstance`, `updateInstanceVariant`, `findInstanceContainingElement`, `getVariantStylesForElement`, `getOverridesForElement`.

**Fix:** Delete methods. Call standalone utility functions directly from consumers. Update imports.

**Files:** `engine/components/ComponentManager.ts`

### B2 — `canvasGeometry.ts`: Remove duplicate aliases

**Fix:** Delete `getDOMElementById` alias. Export `getDOMElement` only. Redirect `getCanvasContainer` to direct reference.

**Files:** `engine/canvas/canvasGeometry.ts`

### B3 — Merge duplicate geometry modules

**Problem:** `engine/canvas/canvasGeometry.ts` and `editor/canvas/shared/geometry.ts` share 6 functions with different names.

**Fix:** Canonicalize to `shared/utils/geometry.ts`. Delete `engine/canvas/canvasGeometry.ts`. Update `engine/` and `editor/` imports to use `shared/utils/geometry.ts`.

**Files:** `engine/canvas/canvasGeometry.ts`, `editor/canvas/shared/geometry.ts`

### B4 — Extract duplicate constants

**Constants:** `DEFAULT_SNAP_CONFIG`, `CANVAS_COLORS`, `MAX_RECENT`, `DEFAULT_IMAGE_ADJUSTMENTS`, `DEFAULT_IMAGE_FILTERS`.

**Fix:** Move each to `shared/constants/` canonical file. Delete duplicates. Update imports.

**Files:** `engine/canvas/resize/constants.ts`, `engine/canvas/constants.ts`, `shared/constants/canvas.ts`, `shared/types/media-image-editor.ts`, `shared/types/media.ts`, `shared/ui/QuickSwitcher.styles.ts`, `editor/sidebar/tabs/elements/constants.ts`

### B5 — Inline identical `getComputedStyle` pattern

**Pattern:** `getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || ""`.

**Fix:** Extract to `shared/utils/getCssVariable.ts`. Replace both call sites.

**Files:** `editor/inspector/sections/SizeSection.tsx`, `editor/inspector/sections/typography/FontControls.tsx`

### B6 — Delete Radix pass-through wrappers

**Components:** `Popover.tsx` (`PopoverTrigger`, `PopoverPortal`, `PopoverArrow`), `Tooltip.tsx` (`TooltipProvider`, `TooltipTrigger`, `TooltipPortal`), `Toast.tsx` (`Toast = RadixToast.Root`).

**Fix:** Audit each wrapper. If it adds zero CSS, props, or behavior, delete and import from Radix directly at call sites. If it is an intentional composition point, document the reason in a file-level comment.

**Files:** `editor/shared/vibcoder/Popover.tsx`, `editor/shared/vibcoder/Tooltip.tsx`, `editor/shared/vibcoder/Toast.tsx`

### B7 — Delete legacy barrel redirects

**Problem:** `components/Canvas/styled/OverlayStyles.ts` and `components/Canvas/styled/SelectionStyles.ts` re-export from `editor/canvas/styled/`.

**Fix:** Delete files. Update consumers to import from `editor/canvas/styled/` directly.

**Files:** `components/Canvas/styled/OverlayStyles.ts`, `components/Canvas/styled/SelectionStyles.ts`

---

## Success Criteria

- Track A: Drag frame time ≤ 16 ms on 500-element page. Memory leak count = 0 in Chrome DevTools heap snapshot after 10 Composer create/destroy cycles.
- Track C: All 12 bug categories covered by unit tests. Zero unhandled promise rejections in `services/` and `engine/sync/`.
- Track B: Deletion-only diff; no new logic. Net LOC reduction ≥ 500.

## Out of Scope

- God-class refactors (VersionHistoryManager, CollaborationManager, ExportEngine) — architectural, not performance. Separate initiative.
- `components/` → `editor/` full migration — ongoing, not part of this audit.
- New features (undo for component deletion, soft delete) — noted but deferred.

## Risks

1. **Cache invalidation bugs** (A3, A4) — missed invalidation events cause stale snap/spacing data. Mitigation: exhaustive event-list coverage in tests.
2. **Import path changes** (B3, B6, B7) — risk breaking consumers outside `packages/editor/`. Mitigation: full-project grep before each change.
3. **Async init contract change** (C1) — external consumers may await `isReady()` polling loop. Mitigation: keep `isReady()` working, add `whenReady()` as new API.
