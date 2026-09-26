# Lane L6 report — engineering, performance, DS ratchets, deferred follow-up plans

Worktree: `/Users/shahg/Desktop/buildrik-af-L6`, branch `fix/audit-L6`, base `389c495d6`.
Commit range (initial submission): `389c495d6..4d4f2876d` (11 commits: `b78c99c26`..`4d4f2876d`).
Commit range (Fix round 1): `4d4f2876d..57e2800d5` (2 commits). See "Fix round 1" section at the end of this report.

## Per-fix status

### D-7 — canvas DOMParser round trip / CMS preview short-circuit
**fixed `b78c99c26`.**
- `useCanvasContent.ts`: dropped the no-op DOMParser round-trip — returns `resolvedContent` directly instead of re-parsing it.
- `useCMSPreview.ts`: short-circuits to `setResolvedContent(content)` when the composer has neither element bindings nor collection-list bindings. Added `BaseBindingManager.hasAny()`.
- Tests: added a DOMParser-construction-count test to `useCanvasContent.test.ts` (0 constructions on the no-bindings path); updated `useCanvasContent.cms.test.tsx`'s mock composer to add `hasAny`.
- `npx vitest run --maxWorkers=2` on `useCanvasContent.test.ts`, `useCanvasContent.cms.test.tsx`, `useCanvasSync.test.ts`: 15/15 pass.
- **NOT verified:** the `runtime_check`'s DevTools Performance-panel scrub comparison (needs the running app) — not run in this lane.
- **Not done:** D-7's XL "full fix" (incremental DOM patching / keyed renderer, `Canvas.tsx:486-501,776`'s `dangerouslySetInnerHTML` whole-replace) — blocked on PD-2/S-1b. Follow-up plan: `docs/superpowers/plans/2026-09-26-canvas-sandbox-incremental-dom.md`.

### D-9 — layer-tree hover/rebuild coalescing
**fixed `9bad4647c`.**
- `useLayerTree.ts`: hover-driven ancestor-expansion `setExpandedIds` updater returns `prev` (same reference) when every ancestor is already expanded. The ELEMENT_UPDATED/PROJECT_CHANGED/etc. rebuild handler is rAF-coalesced (same pattern as `useCanvasSync.scheduleSync`); initial mount build stays synchronous.
- Tests: added a same-reference assertion test (hover on a different descendant whose ancestors are already expanded); updated the existing page-switch test to stub + flush rAF.
- `npx vitest run --maxWorkers=2` on `useLayerTree.test.tsx`: 13/13 pass.
- **NOT verified:** the React DevTools Profiler runtime_check (2s hover, near-zero LayerTree/Inspector commits) — needs the running app.
- **Not done:** memoizing `ProInspector`/`LeftSidebar`/`PageTabBar` (also part of D-9's decision-free fix) — those files (`StudioPanels.tsx`, `LeftSidebar.tsx`, `ProInspector.tsx`, `PageTabBar.tsx`) are outside this lane's named file ownership. **Cross-lane note for controller:** worth a small follow-up PR, not blocked by anything.

### D-10 — batched media hydration emit
**fixed `0024807ab`.**
- `MediaManager.importServerAssets`: collects new assets, persists with `Promise.all`, pushes all to state, emits one `MEDIA_ADDED_BATCH` instead of one `MEDIA_ADDED` per asset (separated by an IndexedDB await each).
- Added `MEDIA_ADDED_BATCH` to `MEDIA_EVENTS`; wired `useMediaManager`, `useLibraryState`, `useUploadState` to also reload/recalc on it. `MEDIA_ADDED` kept as-is for single uploads.
- Tests: added two tests to `MediaManager.serverMirror.test.ts` — one `MEDIA_ADDED_BATCH` for a 3-asset import (zero `MEDIA_ADDED`), zero emits for an empty import.
- `npx vitest run --maxWorkers=2` on `MediaManager.serverMirror.test.ts`, `useLibraryState.test.tsx`, `useUploadState.test.ts`: 77/77 pass.
- **NOT verified:** the React Profiler runtime_check (200+ asset library, 1-2 commits) — needs the running app with a large seeded library.

### D-12 — lazy jszip/gsap/react-easy-crop
**fixed `aab3a05a8`.**
- `ExportEngine.generateZip` / `ReactExporter.exportZip`: `jszip`'s top-level import is now type-only; the runtime module is `await import("jszip")`'d inside the method. Fixes every caller (useExportHandlers, ExportModal, exportPublishPages) without touching them.
- `GSAPEngine`: top-level `import { gsap } from "gsap"` is now type-only; runtime module is dynamic-imported and cached on first `createAnimation` call (now async). `InteractionRuntime.playAnimation` stays fire-and-forget (all its callers are event-handler callbacks). Since `GSAPEngine.ts` no longer statically imports `gsap`, importing the `GSAPEngine` class for its static `EASINGS` map (`inspector/sections/interactions/types.ts`) no longer pulls gsap in either — confirmed no separate change was needed there.
- `StudioModals.tsx`: `ImageEditorModal` split out of the `../media` barrel import, loaded via `React.lazy` + `Suspense`.
- Tests: updated `InteractionRuntime.test.ts` (createAnimation mock now resolves async; added a microtask-flush helper before asserting `play` was called; `callsFor()` assertions needed no change since the mock fn call itself is still synchronous). Updated `StudioModals.test.tsx` to mock `../media/ImageEditorModal` directly (not the barrel) and `findByTestId` for the lazy-loaded marker.
- `npx vitest run --maxWorkers=2` on `InteractionRuntime.test.ts` (47 pass, 2 todo), `StudioModals.test.tsx` (11/11), `ExportEngine.{formats,siteFontFace,zipAllPages}.test.ts` + `ReactExporter.test.ts` (79/79): all pass.
- **NOT verified:** the ledger's `runtime_check` — a real `pnpm --filter dashboard build` / bundle-analyzer confirmation that the `/edit/[siteId]` first-load chunk no longer contains JSZip/gsap/react-easy-crop identifiers. This lane did NOT run a production build; the fix is verified by code inspection (no static top-level imports remain) and by the passing test suites, not by an actual bundle diff. **This is the single biggest gap in this lane's verification — flag for Phase 2.**

### D-11 — CMS concurrent entry fetch
**fixed `9ee91f32a`** (cmsSync.ts half only).
- `hydrateCmsFromServer`: collections now reconcile concurrently via `Promise.all` (was sequential `for` loop) — tRPC batches the parallel `entries.list.query` calls into one request. Each collection's own entry writes run as one `Promise.all` instead of a sequential per-entry await.
- Test: `cmsSync.test.ts` had one test asserting `saveContentItem` call order across two DIFFERENT collections, which concurrency no longer guarantees — switched to set-membership assertions and a `collectionId`-keyed `entries.list.query` mock instead of ordered `mockResolvedValueOnce`.
- `npx vitest run --maxWorkers=2` on `cmsSync.test.ts`: 35/35 pass.
- **BLOCKED-ON-OWNERSHIP, not a PD:** `server/services/sites.service.ts`'s `listSites` `needsFullScan` analytics-scan rewrite (same D-11 ledger entry, also decision-free per the ledger) is server-side and outside this lane's file ownership — not done. Flag for controller: either another lane owns it or it needs a small follow-up.
- **NOT verified:** the runtime_check's Prisma-query-log / network-tab checks — needs the running app + seeded DB.

### D-6 — NUL escape, stale lint exemptions, engine↔services boundary, dead code
**fixed `d1c130490`.**
- `RedirectsScreen.tsx:246`: literal NUL bytes (confirmed via `od -c`/python) in the repair-dedupe template literal replaced with `\u0000` escapes — same runtime string.
- `eslint.config.mjs`: removed the `buildrik/no-engine-public-export` block scoped to `src/editor/shared/vibcoder/*.tsx` and the `shared/extensions`/`ErrorState.tsx`/`HelpTooltip.tsx` ignores — all those paths were deleted 2026-07-28 per `packages/editor/CLAUDE.md`, so the rule/ignores matched nothing. `shared/forms/`'s ignore is kept (documented intentional exception). Added `engine/` ↛ `services/` and `services/` ↛ `engine/` at WARN using the CORE `no-restricted-imports` rule (a different key from the ERROR-level `@typescript-eslint/no-restricted-imports`, since flat config replaces rather than merges same-key rule settings for the same files glob — confirmed by testing that a naive two-block same-key approach silently dropped the first block's severity). Confirmed firing at warn (not error) on `Composer.ts`'s `EmailService` import and `cmsSync.ts`'s `CollectionStorage` import via `npx eslint`.
- Deleted zero-importer dead files (re-verified with whole-repo greps, ruling out comment-only false positives): `useUsageMap.ts`, `inspector/shared/types.ts` (`BaseTabProps`/`PropertyStates`, 0 consumers), `shared/constants/storage.ts` (dead re-export shim), dashboard's `comment-preview.tsx`/`recent-sites.tsx`. `useSaveState.ts`/`useDeviceZoom.ts`/`mediaData.ts` from the same ledger entry were already deleted on main (already-fixed). Removed the commented-out `useSelectionAnimation` import in `SelectionBoxOverlay.tsx`.
- `npx vitest run --maxWorkers=2` on `RedirectsScreen.test.tsx` (30/30) and `src/editor/canvas/overlays` (43/43, 9 files): pass.
- **Not done (out of scope for this lane / needs a decision):** the 4-server slugify unification (`server/services/{page,sites,template,cms}.service.ts` → `lib/slug.ts`) touches server files not in this lane's ownership. PD-42 (delete the stub email integrations and test-only UI) — the plan's decision log already answers PD-42 as "default: delete," but doing so is a larger surgical change (Composer.ts's `EmailService` wiring, `EmailService.ts` in two locations) that this lane did not attempt given time — flag as a small follow-up, not blocked.

### B-11 — decision-free (weight 700→600, unsized-Button ratchet)
**fixed `d7bdcdd3b`.**
- 6 `tw:font-bold`/`fontWeight: 700` uses in chrome outside `design-system/` snapped to 600 (`tw:font-semibold`/`fontWeight: 600`). Files touched are cross-lane (not in this lane's named ownership: `CMSCollectionSetupModal.tsx`, `AchievementPrompt.tsx`, `AssetDetailsPanel.tsx`, `ElementHoverOverlay.tsx`, `AssetGrid.tsx`) — smallest possible edits per lane-common's cross-lane rule.
- Within the lane's own `chrome-ui/{Button,buttonTheme,typeRamp}*` ownership: no weight-700 hits existed (already-fixed) and `typeRamp.ts` already uses `var(--bk-text-*)` exclusively (no off-scale literal to snap onto the ramp — the "ramp sizes where exact" part of B-11 had nothing to do within owned files).
- Added a `font-weight-700` ratchet (baseline 0) and a report-only unsized-`<Button>` counter (220 usages, excludes `chrome-ui/Button.tsx` itself and tests) to `scripts/check-design-debt-ratchet.mjs`. The counter is informational only — no default size exists yet to hold pixels against (PD-31).
- Verified: `node scripts/check-design-debt-ratchet.mjs` — PASS, all ratchets at or below baseline, `font-weight-700: 0 (baseline 0)`.
- **NOT verified:** full `pnpm run verify:ds` (ran the individual gate script directly, not the full chain — see resource-rule note below).

### B-12(1) — Gate 24 scope → shared/forms
**fixed `3227e580f`.**
- Added Gate 24b to `ds-grep-gates.sh`: same AST scanner (`jsx-inline-element-scanner.ts`), scoped to `shared/forms/`, RATCHET not zero-tolerance — baseline 4 (`FileField.tsx` ×2, `ColorField.tsx` ×2, confirmed via the real AST scanner, not naive grep).
- Verified: ran the FULL `bash packages/editor/scripts/ds-grep-gates.sh` (not just Gate 24b in isolation) — exit 0, log shows `PASS Gate 24 ... 0 at baseline 0` and `PASS Gate 24b ... 4 at baseline 4`.
- **Not done (XL, out of scope):** B-12 items 2-4 (StatusBadge, Tabs, SearchBar consolidation). Follow-up plan: `docs/superpowers/plans/2026-09-26-ds-size-contract-primitive-consolidation.md`.

### B-10(a)(b) — dead FONT_FAMILY, shell literals → tokens
**fixed `daa9fcecc`.**
- `DEFAULTS.FONT_FAMILY` (`"Inter, system-ui, sans-serif"`, zero consumers confirmed, named a banned `system-ui` fallback) deleted.
- `Topbar.tsx`'s `tw:h-14` → `var(--bk-size-topbar)`; `Rail.tsx`'s `tw:w-[60px]` → `var(--bk-size-rail)`; `RightPanel.tsx`'s narrow `tw:w-[300px]` → `var(--bk-size-panel-right)`. `RightPanel`'s wide `360px` and `PanelFrame.tsx`'s `360` left as literals — no `--bk-size-*` token for 360px exists in `tokens.generated.css` (confirmed by grep); nothing to swap onto.
- `npx vitest run --maxWorkers=2` on `Topbar.test.tsx`: 23/23 pass. No test files exist for `RightPanel`/`Rail` (both zero-consumer primitives, per B-10's own main finding).
- **Not done (blocked on PD-30, this lane's main B-10 item):** migrating `LeftSidebar.tsx`/`LayoutShell.tsx` onto the chrome-ui primitives (or deleting the primitives). Follow-up plan: `docs/superpowers/plans/2026-09-26-shell-migration.md`.

### D-15 rest — source-scan test rename (PD-46)
**fixed `041b265aa`.**
- Renamed (git mv, no content change) `schema-integrity.test.ts`, `e2e-frontend-gaps.test.ts`, `e2e-backend-safety.test.ts`, `db-data-flows.test.ts`, `soft-delete-cascade.test.ts` → `*.source.test.ts`. Confirmed each is a pure `readFileSync`+string-assertion test (no runtime under test despite "e2e" names). Confirmed `vitest.config.ts`'s `__tests__/**/*.test.{ts,tsx}` include glob still matches the new names — no config change needed.
- `npx vitest run --maxWorkers=2` on all 5 renamed files (run from repo root): 32/32 pass.
- **Note:** this touches root-level `__tests__/` and not the editor package — outside this lane's editor-focused file list, but explicitly assigned as fix-order item 10 in the lane brief.

## Follow-up plans written (8, one commit `4d4f2876d`)
`docs/superpowers/plans/2026-09-26-{collab-engine,media-scope-quota,canvas-sandbox-incremental-dom,shell-migration,ds-size-contract-primitive-consolidation,presence-heartbeat,authz-resolver-consolidation,cron-install-xff-switch}.md`
— covering C-5, A-11, S-1b/D-7 full, B-10 main, B-11/B-12 remainder, A-21, D-2, C-2+S-11. Each has a goal + observable done-condition, why-deferred, decisions needed, proposed tasks, risks.

## Gate results (this lane)
- `npx tsc --noEmit -p packages/editor`: exit 0, no output — clean.
- `npx tsc --noEmit -p packages/dashboard`: exit 0, no output — clean.
- `bash packages/editor/scripts/ds-grep-gates.sh` (full script, not just the touched gates): exit 0 — PASS.
- Did NOT run the full `pnpm run verify:ds` chain (which also runs `check-hooks.mjs`, `seam-scan.mjs`, `verify-design-baselines.mjs`, `check-ds-ssot.mjs`, token/anchor/board/hex-drift/copy checks, `check-tsc-baseline.mjs`, and the other `gate:*` npm scripts) — per the resource rule, ran only the individual vitest files touched and the two gate scripts directly modified (`check-design-debt-ratchet.mjs`, `ds-grep-gates.sh`). **Controller should run the full `verify:ds` chain at merge.**
- Did NOT run `pnpm test:db` — no DB-tier tests were added in this lane (all fixes were unit-testable).

## What was NOT verified (browser/runtime, per lane-common — the controller runs these in Phase 2)
- D-7: DevTools Performance-panel scripting-cost comparison on a color-slider drag.
- D-9: React DevTools Profiler commit-count comparison during a 2s hover.
- D-10: React Profiler commit count on a 200+ asset library hydration.
- **D-12: the actual bundle-analyzer / `grep -l JSZip .next/static/chunks/*` confirmation that jszip/gsap/react-easy-crop left the first-load chunk. This lane verified the fix by code inspection (no remaining static top-level imports) and passing unit tests only — not by an actual production build. This is the highest-value thing for the controller to check first.**
- D-11: Prisma query-log / network-tab confirmation of batched `entries.list.query` calls against a real seeded DB.
- D-6: the RedirectsScreen dedupe-key runtime browser check (Settings › Redirects repair suggestion still dedupes) — the key string is unchanged so this should hold, but was not clicked through.
- B-10/B-11/B-12: no screenshots were taken; none of the visual-comparison acceptance criteria in the ledger were run (none of this lane's fixes were visual-appearance changes — weight 700→600 and literal→token swaps are pixel-identical by construction, but this was not screenshot-confirmed).

## Cross-lane edits (files outside this lane's named ownership, smallest possible edit made)
- `packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx`, `src/editor/onboarding/AchievementPrompt.tsx`, `src/editor/media/components/AssetDetailsPanel.tsx`, `src/editor/canvas/overlays/ElementHoverOverlay.tsx`, `src/editor/media/components/AssetGrid.tsx` — B-11 weight-700→600 single-line swaps.
- `packages/editor/src/services/cmsSync.ts` and its test — D-11's cmsSync half (services/ is not in this lane's explicit file list but the fix ID was assigned here; flagged in case another lane also touches this file).
- `packages/dashboard/components/comments/comment-preview.tsx`, `packages/dashboard/components/dashboard/recent-sites.tsx` — D-6 dead-file deletions (dashboard is out of the editor-focused ownership list but these are zero-importer confirmed).
- `__tests__/*.source.test.ts` (5 renames) — D-15, root-level not editor-package.

## Real bugs found outside this lane's scope (not fixed here)
None beyond what the ledger already names.

## Fix round 1 (controller review findings)

Commit range: `4d4f2876d..57e2800d5` (2 commits: `978678a31`, `57e2800d5`).

### IMPORTANT — D-10 regression: Composer.syncLibraryFont / SiteFontsModal missed MEDIA_ADDED_BATCH
**fixed `978678a31`.**
- Re-grepped every `MEDIA_EVENTS.MEDIA_ADDED` listener in the codebase (5
  total): `Composer.ts:464` (`syncLibraryFont`), `useUploadState.ts`,
  `useLibraryState.ts`, `useMediaManager.ts` (these 3 already covered by
  the initial submission), and `SiteFontsModal.tsx:109` (missed). Both
  `Composer.ts` and `SiteFontsModal.tsx` now also subscribe to
  `MEDIA_ADDED_BATCH` — `Composer.ts` iterates the asset array and calls
  `syncLibraryFont` per asset. Confirmed the two `emit(MEDIA_ADDED, ...)`
  call sites in `MediaManager.ts` (single-asset upload/replace, not
  `importServerAssets`) correctly need no change.
- Rewrote `Composer.test.ts`'s "a font added on another device" pinning
  test: it used to fake the event directly
  (`composer.media.emitEvent("media:added", ...)`), which never exercised
  the real `importServerAssets` path — exactly why it didn't catch the
  regression. It now calls the real `composer.media.importServerAssets`
  with a `userMetadata: { siteFont: true }` row.
- **Confirmed red on current (pre-fix) code first**, per instruction: reverted
  the `Composer.ts` `MEDIA_ADDED_BATCH` listener locally (kept the test
  rewrite), ran the test — timed out/failed (`Test timed out in 15000ms`)
  — then restored the fix and re-ran: 11/11 pass.
- The jsdom `indexedDB` polyfill already in `Composer.test.ts` only stubs
  the raw open/get/put/getAll calls the file's other (fake-event) tests
  use; `importServerAssets` goes through `MediaStorage.saveAsset`'s
  `IndexedDBAdapter.runTransaction`, which needs real transaction
  (`oncomplete`) semantics the polyfill doesn't provide. Stubbed
  `composer.media.storage.saveAsset` directly instead (same pattern
  `MediaManager.serverMirror.test.ts` already uses) rather than extending
  the polyfill.
- Tests: `npx vitest run --maxWorkers=2` on `Composer.test.ts` (11/11),
  `SiteFontsModal.test.tsx`, `MediaManager.serverMirror.test.ts`,
  `useLibraryState.test.tsx`, `useUploadState.test.ts`, and
  `shell/hooks/__tests__` (covers `useMediaManager`) — all green.

### MINOR — check-design-debt-ratchet.mjs design-system exclusion scope
**fixed `57e2800d5`.** Chose "scope it to the new rule only" over "keep
global + document" — `count()` now takes an opt-in `excludeDesignSystem`
flag; only the `font-weight-700` RATCHETS entry sets it. Verified no
pre-existing ratchet's count changed: ran the script before and after —
identical output (`offbrand-blue`, `ghost-link-incantation`,
`offscale-font-size`, `palette-gray-any`, `dead-radius-class`,
`offscale-css-font-size` all unchanged at 0/baseline 0). Also traced the
one design-system/ hit any pattern actually has
(`BrandPreview.tsx:95`'s `tw:text-[15px]`, under `offscale-font-size`) and
confirmed it was already excluded by the pre-existing `BrandPreview.tsx`
name exclusion — so the global exclusion would have been a no-op for
every other ratchet today regardless, but is scoped anyway since that's
not a guarantee for the future.

### Fix-round gates
- `npx tsc --noEmit -p packages/editor`: exit 0, clean.
- `bash packages/editor/scripts/ds-grep-gates.sh` (full script): exit 0 —
  PASS on all gates including Gate 24/24b.
- Did not re-run `pnpm run verify:ds` in full or `packages/dashboard` tsc
  (unchanged by this round's edits, which touched only editor engine/UI
  files and one editor script).

**NOT verified in this round (same category as the initial submission):**
the D-10 fix's `runtime_check` (React Profiler commit count during a
200+ asset library hydration, and now also a live-app check that a
synced site font actually appears in the font picker after a real
project load) still needs the running app — not run here.

Final reply to controller: see below.
