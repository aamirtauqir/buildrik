# Lane L4b report — editor UX surfaces

Worktree: `/Users/shahg/Desktop/buildrik-af-L4b`, branch `fix/audit-L4b`, base `389c495d6`.
Commit range: `389c495d6..a8e8f66c8` (15 commits).

## Row 1 — B-2 publish: in-flight guard, poll back-off, Unpublish not primary
**fixed `f49b74bb6`**
- `usePublishJob.ts`: added `inFlightRef` (set before `await publishSite`, cleared in
  `finally`) so a double-click before the request lands can't fire two jobs.
- `tick`'s catch used to stop polling + set `error` on the FIRST failed poll, which
  permanently orphaned the job (status never reaches terminal on its own). Now backs
  off across `MAX_CONSECUTIVE_POLL_FAILURES` (3) before surfacing the error, and
  `pollLostRef` lets `publish()` ignore a job whose polling was lost even though its
  last-known status was never terminal.
- Cross-lane edit: `packages/dashboard/components/site-detail/site-header.tsx` —
  Unpublish button changed from default (primary) variant to `ghost`.
- Tests: `usePublishJob.test.ts` — rewrote the poll-failure test for back-off, added a
  single-dropped-poll test, a republish-after-poll-lost test, and a new double-click
  in-flight-guard describe block. `npx vitest run` on this file: 40/40 pass.
- **Not verified**: the ledger's `runtime_check` (double-click Publish in the running
  editor, watch network tab for exactly one `sites.publish` call) — needs the browser.

## Row 2 — A-8 editor: reviewsEnabled into ReviewTab/SendForReview, hide doors when off
**fixed `ea35fcc8e`**
- StudioHeader's Comments toggle (`toggleComments`) and `useEditorShortcuts`'s bare `C`
  shortcut were the two doors still offered unconditionally in the editor (the Review
  rail tab and the publish `nextMove` gate were already reviewsEnabled-gated by prior
  lanes). Both now gate on `reviewStatus.reviewsEnabled`; with it off, the Topbar
  renders no Comments button at all (not just a disabled one) and `C` does nothing.
- `useEditorShortcuts` call moved below `useLifecycle` in AquibraStudio.tsx so it can
  read `reviewStatus.reviewsEnabled` (didn't exist yet at the old call site).
- **NOT done**: ReviewTab/SendForReview themselves don't take a `reviewsEnabled` prop.
  Traced why: the Review rail tab is hidden (TabRouter, prior lane) and the CTA's
  `nextMove` only routes to review states when `reviewsEnabled` is true (lifecycle.ts:343),
  so these components are unreachable through any live path when off — confirmed by
  reading, not by clicking through the app. If a future deep link or command-palette
  entry can reach ReviewTab directly, it would need its own guard; flagging as a real
  gap, not a verified-safe one.
- Tests: `useEditorShortcuts.test.ts` (+3), `StudioHeader.test.tsx` (+1). Full files:
  121/121 pass (StudioHeader + AquibraStudio.wiring + useEditorShortcuts together).

## Row 3 — B-7 non-Conflict dialogs: ModalRoot naming, focus trap, Esc
**fixed `41d7f8f21`** (partial — see below)
- `ModalRoot`/`OverlayMount` dropped `labelledBy` on the floor: the actual
  `role="dialog"` node had no accessible name (ModalContent's `srTitle` only reached a
  redundant `aria-label` one level in, on the content div). Added `labelledBy`/
  `ariaLabel` to both, forwarded to the dialog node.
- `ReplaceAcrossDialog` and `AchievementPrompt` — the two shells this row names —
  predate OverlayMount and hand-roll their own backdrop, with 0 focus-trap coverage.
  Wired both onto the shared `useFocusTrap` hook (focus in, Tab trap, restore on
  close, Escape → close) instead of moving either onto OverlayMount's portal/scrim
  (larger rewrite, more risk).
- Tests: new `ModalRoot.a11y.test.tsx` (3 tests), + 1 test each in
  `Section21_per_page.test.tsx` and `AchievementPrompt.test.tsx` for focus-in/Escape.
- **NOT done**: the ledger's evidence names 8 shells with 0 ModalRoot/OverlayMount/
  useFocusTrap hits total; I fixed the 2 the brief explicitly named. Audited but did
  NOT fix: `IconBrowserOverlay.tsx` (has its own hand-rolled Escape handler + aria-label
  already, but no Tab trap), `StockBrowserOverlay.tsx`, `AssetDetailOverlay.tsx`,
  `PageSettingsDrawer.tsx` (all 0 hits, not touched). `CommandPalette.tsx` and the
  dashboard command-palette (A13-9) were not audited at all — out of my time budget
  this pass.
- **Not verified**: the ledger's runtime_check (Tab cycling stays inside each dialog,
  Esc closes, in the running app) — needs the browser.

## Row 4 — B-3 page visibility honest copy
**fixed `33d3b21a8`**
- `AdvancedTab.tsx` showed both "Not published, left out of the deploy" AND "not
  linked in menus but reachable via direct URL" for Hidden — the second line is false
  (`isPageLive` drops hidden pages from export). Now only the honest line shows.
- Test updated: `AdvancedTab.test.tsx:82-87` rewritten (was asserting the false copy),
  + a new test for the live-only helper text. 11/11 pass.

## Row 5 — B-14 honest copy subset
**fixed `0e7786f73`**
- Zero state: "No issues. This page is ready to publish." → "No brand issues." (the
  panel only ever knew about brand lint, never the whole publish checklist).
- "Ignore once" (misleading — `LintState.suppress` is session-persistent, not "once")
  → "Ignore for this token", plus a new "Ignored (n)" row in IssuesPanel with a
  per-token Restore button, backed by new `LintState.suppressedIds()`.
- `<Progress progress={60}>` (a hardcoded fake percentage) → `<Spinner>`.
- `LayerTreeItem`: hidden-in-editor rows announced ", hidden" to screen readers,
  indistinguishable from a real `display:none`. Changed to ", dimmed in editor".
- Tests: `IssuesPanel.test.tsx` (+2), `IssuesPanel.autofix.test.tsx` (renamed/updated
  1), `LintState.test.ts` (+1). 42/42 pass across the touched files.
- Required a follow-up conformance fixture fix — see "Cross-cutting" below.

## Row 6 — B-15/A02-9
Skipped per controller amendment (DONE by lane x3, merged).

## Row 7 — B-16 editor: toast pause, ChatThread role=log, icon-button labels
**fixed `c455e7b6b`**
- Toast.tsx had 0 hover/focus pause — a timer ran to completion under the cursor.
  Added pause on mouseover/focus, resume with remaining time (not full re-arm) on
  mouseout/blur, tracked via `Date.now()`. Persistent toasts (`duration: Infinity`)
  unaffected. Tests: 2 new tests in `Toast.test.tsx`, all 13 pass, fake-timer tests
  untouched and still green.
- Audited the rest: `ChatThread.tsx` no longer exists (decision #23/E-8 removed the
  chat-thread model — already-fixed by deletion, no code to touch). Icon-only buttons
  across owned editor surfaces (pages, content, settings, media, chrome-ui, SiteMenu)
  all already pass `label`/aria-label through `IconButton`. `#9CA3AF` has zero
  literal hits under any owned editor path — that finding is dashboard-only
  (sidebar.tsx/top-nav.tsx), out of L4b scope.

## Row 8 — A-15 one instantiateComponentAtSelection
**fixed `21ae6c607`**
- `BuildTab.insertMine` and `useComponentsState.handleInstantiate` ran the identical
  algorithm (selected element → active page root → "no parent" toast, same
  instantiateComponent call, same success/error copy) with two different toast
  mechanisms wrapped around it. Extracted to
  `component-library/instantiate.ts::instantiateComponentAtSelection`, returns
  `"ok" | "no-parent" | "error"`; each caller keeps its own toast call.
- New test file `instantiate.test.ts` (4 tests). Full suite across 4 touched test
  files: 57/57 pass.

## Row 9 — A-17 editor: records empty-state link, miss warning
**fixed `3356b5722`**
- `ContentViews.tsx` RootView's zero state offered only "Create a collection" — added
  "Open Sources"/"Open Variables"/"Open Conditions" links to the doors this tab also
  owns. (Named "Open X" rather than bare "X" to avoid colliding with the real Data
  rows' text during the pre-hydration transient render — see the note in the commit;
  this was caught by a real, reproduced test regression during the fix, not
  theoretical.)
- `DynamicPagesPane.tsx`: a collection's saved `pageTemplatePath` can go stale (page
  renamed/deleted) without the pane noticing — it kept showing "Ready" while
  `appendDynamicPagesToPublish` silently skips the collection. Added a
  dangling-reference status line and gated `ready` on the template actually
  resolving to a live page.
- Tests: `ContentTab.test.tsx` (+1), `DynamicPagesPane.test.tsx` (+1). 26/26 pass.
- **NOT done** (server-side, cms.service.ts, out of L4b's owned files): the silent
  template-miss on the SERVER side (`if (!template) continue`), whole-document
  substitution safety, second `<title>` dedup, unbounded record list. These are the
  server half of A-17's decision-free fix; noted for whichever lane owns
  `server/services/cms.service.ts`.

## Row 10 — A-20 editor: no "was deleted" band for linkless notifications
**fixed `2fc83aee0`**
- `NotificationPanel.tsx` rendered "What this points to was deleted" for any row with
  `actionUrl == null` — but most linkless notifications (account security, billing)
  never had a target at all; the server has no field that says "was deleted".
  Removed the band; a linkless row is now plain, non-interactive info.
- Test rewritten in `NotificationPanel.test.tsx`, 8/8 pass.
- Required a follow-up conformance fixture fix — see "Cross-cutting" below.

## Row 11 — C-7 (PD-39 overridden): honest Localization copy
**fixed `3642c2eab`**
- Kept the Localization UI (Add locale, Locales table, translation progress) per the
  override. Added a strip: "Per-language pages publish in a later release. Today,
  publishing ships the default locale only — the rows below track translation
  progress, not live routes."
- `<html lang>` = default locale was **already wired** (`handleSave` syncs
  `composer.getProjectSettings().seo.language` from `defaultLocale`, which
  SEOInjector/ExportEngine already read) — confirmed already-fixed by reading the
  code, not touched further.
- Test: `LocalizationScreen.test.tsx` +1 assertion. 24/24 pass.
- **Not verified**: the ledger's runtime_check (publish simulation, inspect exported
  HTML for `<html lang="xx">`) — needs the browser/export pipeline running.

## Row 12 — D-5 typed drop dispatcher, no `as any`
**fixed `4164cddc4`**
- `useDropExecution.ts`'s dispatch chain cast every handler call through `as any`.
  Exported `DropPayloads` from `dropOperations.tsx`, gave each of the 5 handlers
  (`handleMultiElementDrop`, `handleElementDrop`, `handleComponentDrop`,
  `handleTemplateDrop`, `handleBlockDrop`) an optional `payloads` param they prefer
  over a direct `e.dataTransfer.getData(...)` read (mirrors `handleCatalogDrop`'s
  existing pattern) — this also fixes the underlying bug the casts were hiding:
  `handleTemplateDrop`/`handleBlockDrop` ran AFTER an `await` on
  `handleComponentDrop`, by which point a real browser's DataTransfer is zeroed out.
  `dropSucceeded` for the block branch now comes from the handler's own return value
  instead of being hardcoded `true`.
- Tests: `dropOperations.test.ts` — 5 new tests proving each handler honors
  pre-snapshotted payloads even when `getData` returns `""` (the zeroed-DataTransfer
  case). Both named pinning tests (`dropOperations.test.ts`,
  `useCanvasDragDrop.test.ts`) pass: 51/51 and 27/27.

## Carry-over 13 — B-1 remainder (shell-owned dirty registry)
**NOT ATTEMPTED — reporting why rather than shipping a partial fix.**
Traced the real architecture: the actual chokepoints are `useStudioState.ts`'s
`setLeftPanelTab`/`openLeftPanelToTab` (StudioPanels calls `onLeftPanelTabChange` =
`state.setLeftPanelTab` DIRECTLY for `ui:switch-tab`/`UI_PANEL_OPEN`/command-palette
results — bypassing LeftSidebar's `safeTabChange`+`settingsDirty` guard entirely,
which only wraps the RAIL-click and ⇧A paths). `brandDirty` lives in StudioHeader,
`settingsDirty` in StudioPanels, the confirm-dialog UI lives in LeftSidebar — three
siblings, no shared parent state below AquibraStudio. A correct fix needs either a
real cross-component registry (module-level store, as the ledger suggests) wired as
BOTH a producer (brand, settings, cms-record) and a consumer at the `setLeftPanelTab`/
`openLeftPanelToTab` chokepoint, with a consistent confirm UX across all 5 trigger
paths (⌘H, ⇧A, palette, `ui:switch-tab`, `UI_PANEL_OPEN`) — or a restructuring so
LeftSidebar's existing, tested guard becomes the single gate. Both are real,
multi-file changes across heavily-tested components (StudioHeader alone has 87+
tests). Given the risk of landing an INCONSISTENT partial fix (protected via ⌘H but
not via palette, e.g.) that looks safer than it is, and the remaining lane time
budget, I chose not to ship a half-covered version. CMS record drafts (A04-10) have
zero dirty tracking of any kind today — confirmed, not touched; this is the largest
sub-piece and needs its own design pass (draft state doesn't currently exist
anywhere for CMS records). Recommend this become its own follow-up item with an
explicit owner, not a carry-over squeezed into an existing lane's tail.

## Carry-over 14 — Layers lockedIds resync on undo/redo/import
**fixed `46ceca9e5`**
- `useLayerActions.ts` only resynced `lockedIds` off `ELEMENT_UPDATED` (per-element).
  Undo/redo replay a whole history snapshot and `PROJECT_LOADED` swaps the document
  out from under the panel — neither fires a per-element `ELEMENT_UPDATED`, so
  `lockedIds` went stale. Added a full-rescan effect on `HISTORY_UNDO`, `HISTORY_REDO`,
  `PROJECT_LOADED`.
- Tests: 3 new tests in `useLayerActions.elementData.test.tsx`. 13/13 pass across both
  test files in that hook's directory.

## Carry-over 15 — Auto-milestone quota burn (S-8)
**fixed `c0b8e48b2`**
- `useAutoMilestone.ts`: every `requestSuggestion` call spends AI quota regardless of
  outcome, but the 30s cooldown only ever armed on SUCCESS — a run of failures
  (quota already exhausted, a flaky endpoint) left `lastSuggestionTime` at its initial
  0 forever, so the cooldown gated nothing once it started failing. Raised the
  cooldown to 10 minutes, moved the arm point to every ATTEMPT (before the network
  call), added a significance threshold (≥5 history entries since the gate last
  armed — exempting the very first attempt of a session, which has nothing to
  measure activity since), and added a `document.visibilityState === "hidden"` check.
- Tests: 4 new/rewritten tests in `useAutoMilestone.test.ts`. Note: my first attempt
  at the significance-threshold test used `vi.useFakeTimers()` (fully faked), which
  broke `waitFor`'s internal polling and hung the WHOLE FILE for 8 tests × 15s each
  (~125s) because the test-timeout abort orphaned the `finally { vi.useRealTimers() }`
  cleanup, corrupting every subsequent test's timers. Fixed by faking only `Date`
  (`toFake: ["Date"]`) and using `vi.setSystemTime` instead of `advanceTimersByTime`,
  plus a defensive `vi.useRealTimers()` in the file's shared `afterEach`. Final run:
  18/18 pass in 3.9s (was 125s+ hung before the fix). Flagging this pattern in case
  other lanes hit the same trap with `vi.useFakeTimers()` + `waitFor`.

## Cross-cutting: verify:ds
Touching `IssuesPanel.tsx` (B-14) and `NotificationPanel.tsx` (A-20) broke two of
`verify:ds`'s regression-net gates, since they pin copy the audit explicitly says is
false: `check-anchors.mjs` (the `notifications-jump-target-deleted` conformance
recipe referenced the now-removed `notifications-jump-gone*` testids) and
`check-copy.mjs` (the manifest expected "This page is ready to publish." to still
ship). Fixed both fixtures in a separate commit (`a8e8f66c8`) rather than reverting
the product fix — this is exactly the CLAUDE.md "behaviour precedence over the board"
case: the board draws content the ledger's binding decision says is factually
unsupported. `pnpm run verify:ds` now exits 0.

## Gate results
- `npx tsc --noEmit -p .` (packages/editor): clean (fixed 2 errors introduced during
  the pass — a `boolean | null` vs `boolean | undefined` mismatch in AquibraStudio.tsx
  and a `.sort()` on a readonly array in a test — both in commit `f8fceeb37`).
- `pnpm run verify:ds` (packages/editor): PASS, exit 0.
- Vitest: ran per-file with `--maxWorkers=2`, scoped to touched files only (resource
  rule). No full-suite run — that's the controller's job at merge.
- `pnpm test:db`: not run — no DB-tier changes in this lane (all fixes are editor
  React/hooks, no Prisma/service changes).

## What was NOT verified (browser required, controller's Phase 2)
- B-2: double-click Publish → exactly one `sites.publish` network call.
- B-7: Tab cycling stays inside ReplaceAcrossDialog/AchievementPrompt; Escape closes;
  dialog announces its name to a screen reader.
- C-7: publish (simulation), inspect exported HTML for `<html lang="xx">`.
- A-17: DynamicPagesPane's dangling-template warning against a real deleted page.
- A-15/A-20/B-3/B-14/B-16/carry-14/carry-15: all covered by unit tests but not walked
  live in the running editor.

## Cross-lane edits
- `packages/dashboard/components/site-detail/site-header.tsx` (B-2, Unpublish button
  variant) — dashboard, not editor.

## Real bugs found outside this lane's assigned scope (not fixed)
- A-17's server-side half (cms.service.ts: silent template miss, whole-document
  substitution safety, `<title>` dedup, unbounded record query) — server file, not
  owned by L4b.
- B-7's remaining 6+ unguarded overlay shells (IconBrowserOverlay, StockBrowserOverlay,
  AssetDetailOverlay, PageSettingsDrawer, both command palettes) — audited, not fixed.
- Carry-over 13 in full (see above) — traced, scoped, deliberately not attempted this
  pass.

## Fix round 1

Findings from the round-1 task review, one commit each on top of `a8e8f66c8`.

### 1. CRITICAL B-2 — poll-lost job spun forever (no failed state, no retry)
**fixed `13293ba61`**
- `usePublishJob.ts`: `pollLostRef`/`error` were set on poll-loss but `jobId` stayed
  non-null with a non-terminal `status`, so `uiState` (derived only from
  `jobId`/`status`) stayed `"publishing"` forever. Mirrored `pollLostRef` into a new
  `pollLost` state so `uiState` actually re-renders, and folded it into `"failed"`.
- Added a `pollLost` field to `UsePublishJobResult` so `PublishTab` can tell a
  poll-lost failure apart from a real terminal FAILED. It now renders "Check status"
  (`track(jobId)`, resumes polling the SAME job) instead of "Try again" (which would
  fire a second publish on top of one that may still be running server-side).
- Updated the pinning test at `usePublishJob.test.ts:296` to assert `uiState`, not
  just `error`; added a `track()`-resumes-and-clears test and a `PublishTab`
  "Check status" test. 41/41 + 7/7 pass.
- A follow-up commit (`548d8411f`) fixed a missed `pollLost` field on
  `PublishTab.buildLog.test.tsx`'s own job-literal builder, caught by `tsc`, not by
  the scoped vitest run.
- **Not verified**: double-click Publish in the running editor (needs the browser,
  same as round 1).

### 2. CRITICAL carry-15 — auto-milestone remount reset the cooldown/significance gate
**fixed `2b373ba5a`**
- `useAutoMilestone.ts`: `lastSuggestionTime` was plain React state — a remount reset
  it to 0, and the `hasAttempted` first-attempt exemption then bypassed BOTH the
  10-minute cooldown and the significance threshold, identical to a fresh session.
- Persisted `lastSuggestionTime` per site in `sessionStorage` (keyed via the shared
  `getSiteIdFromUrl` helper, wrapped in try/catch) so the cooldown survives a
  remount. Dropped the exemption entirely — the significance threshold
  (`MIN_CHANGES_SINCE_LAST_SUGGESTION = 5`) now applies unconditionally, including to
  a session's first attempt.
- Rewrote the significance-threshold pinning test (depended on the exemption);
  added a remount-survives-cooldown test; added an `armSignificance` test helper and
  applied it to every trigger test that used to get a free first fire under the old
  exemption. 19/19 pass.

### 3. IMPORTANT A-8 — permanent Review chip opened a blank panel when reviews off
**fixed `372493bf9`**
- `StudioHeader.tsx`'s `reviewChip()` drew a permanent "Review ›" door in state
  `"none"` whenever `!(reviewsEnabled && editsRequireApproval)` — including
  `reviewsEnabled: false`, where `TabRouter`'s `"review"` case
  (`TabRouter.tsx:239`) returns `null` for every state. The chip opened a real
  panel door onto nothing.
- `reviewChip()` now returns `null` outright when `!status.reviewsEnabled`, for
  every state (not just `"none"`), and `StudioHeader` passes that through as
  `review={null}` — `Topbar` already treats a null `review` as "no chip".
- Audited every other Review/comment door named in the finding: rail
  (`LeftSidebar.tsx:354`, already gated by a prior lane), site menu (no review door
  there — removed earlier), ⌘K command palette (`CommandPalette.tsx:108`, already
  gated on `reviewsEnabled`), `C` shortcut (`useEditorShortcuts.ts:118`, already
  gated by round 1). `ReviewTab`'s own "never-sent" Send-for-review button still has
  no internal `reviewsEnabled` guard of its own, but stays unreachable through any
  live path now that rail/chip/palette/shortcut are all gated — same gap round 1
  already flagged, still not fixed (would need its own prop threading into
  `ReviewTab`/`SendForReview`).
- New test: `StudioHeader.test.tsx` "reviewsEnabled false — no Review door at all".
  89/89 pass.

### 4. IMPORTANT B-7 — srTitle never reached the role=dialog node without per-file wiring
**fixed `8469b9fe0`** (naming) + **`1b7daedc8`** (alertdialog focus-trap/isModalOpen)
- Round 1 gave `ModalRoot`/`OverlayMount` a `labelledBy`/`ariaLabel` prop, but
  nothing called it automatically — a caller had to wire `labelledBy` BY HAND in
  addition to rendering `ModalTitle` or setting `ModalContent`'s `srTitle`, so the
  ~50 existing `ModalRoot` consumers (including `DeleteConfirmModal`) still left the
  real `role="dialog"` node unnamed.
- Added a `ModalAutoNameContext` in `ModalParts.tsx`: `ModalTitle` registers its id
  (caller-supplied or `useId()`-generated) as the dialog's name; `ModalContent`'s
  `srTitle` registers as the fallback when there's no visible `ModalTitle`.
  `ModalRoot` reads both and forwards whichever applies — a visible title wins over
  `srTitle`, and an explicit `labelledBy`/`ariaLabel` passed directly to `ModalRoot`
  still wins over both auto-detected values. Zero consumer files touched.
- Separately fixed `focus.ts`: `useFocusTrap`'s `isTopmost()` and `isModalOpen()`
  (the F9 rule every global shortcut checks) both queried only
  `[role="dialog"][aria-modal="true"]`. `ReplaceAcrossDialog`/`AchievementPrompt`
  predate `OverlayMount` and hand-roll `role="alertdialog"` — invisible to both
  selectors, so global shortcuts (C, ?, ⌘K, ⌘S, undo) fired behind them instead of
  standing down. Both selectors now match `dialog` OR `alertdialog`.
- Tests: rewrote `ModalRoot.a11y.test.tsx`'s "no accessible name" pinning case
  (a `ModalTitle` in the tree now DOES get one) and added auto-detection/precedence
  tests (7/7 pass); added the representative-consumer test the finding names —
  `DeleteConfirmModal.test.tsx` "has an accessible name on the role=dialog node",
  with `DeleteConfirmModal.tsx` itself untouched (6/6 pass); new
  `focus.test.tsx` covering `isModalOpen()` on an alertdialog, Escape on a
  standalone alertdialog, and Escape on an alertdialog stacked under a real dialog
  answering only the topmost (5/5 pass).
- **Not verified**: Tab cycling / Escape / screen-reader name walked live in the
  running app (needs the browser).
- **Still open** (unchanged from round 1): `IconBrowserOverlay`, `StockBrowserOverlay`,
  `AssetDetailOverlay`, `PageSettingsDrawer`, both command palettes — audited, not
  fixed, out of this round's named scope too.

### 5. Cross-lane edits — full list, this round and carried from round 1
Of the six files the task review named (StudioHeader.tsx, AquibraStudio.tsx,
useEditorShortcuts.ts, BuildTab.tsx, useComponentsState.ts, dashboard
site-header.tsx): the first five are `packages/editor/` files L4b already owns
(editor UX surfaces) — not cross-lane. `useComponentsState.ts` and `BuildTab.tsx`
were touched by round 1's A-15 fix (`21ae6c607`, in-lane); `StudioHeader.tsx` and
`useEditorShortcuts.ts` by round 1's A-8 fix and this round's A-8 fix (both
in-lane); `AquibraStudio.tsx` by round 1's A-8 fix (in-lane, call-order change for
`useEditorShortcuts`). This round touched no dashboard files. The one genuine
cross-lane edit remains from round 1 and is unchanged:
`packages/dashboard/components/site-detail/site-header.tsx` (Unpublish button
variant) — dashboard, not editor, owned by a different lane.

### 6. Minor — instantiate.ts relative-import ban
**fixed `3622b0071`** — `../../../../engine` → `@/engine` (type-only import,
mirrors `adoptionTracker.ts`/`ContentTab.tsx`). 4/4 pass.

### 7. Minor — ReplaceAcrossDialog's alertdialog role invisible to focus-trap selectors
**fixed `1b7daedc8`** — folded into finding 4 above (same commit, same root cause:
`role="dialog"`-only selectors in `focus.ts`).

### Gate results (round 1)
- `npx vitest run` on all 8 touched test files together: 178/178 pass.
- `npx tsc --noEmit -p packages/editor`: caught one missed fixture
  (`PublishTab.buildLog.test.tsx`, fixed in `548d8411f`); clean after.
- `bash -c 'pnpm run verify:ds'` (packages/editor): PASS, exit 0, all gates green
  (tsc gate 0 errors editor+dashboard at baseline, styling/design-debt/chrome-ui-surface/
  vibcoder-ratchet/editor-ui-gone/buildrick/narrow-control-padding all at or below
  baseline).
- `pnpm test:db`: not run — no DB-tier changes this round.

### What was NOT verified this round (browser required)
- B-2: "Check status" retry resumes a poll-lost job and reaches a terminal state
  against the real server.
- A-8: clicking through the editor with reviews disabled confirms no Review UI
  appears anywhere (rail/chip/palette/shortcut were verified by code audit + unit
  tests, not live).
- B-7: screen-reader announcement of the auto-detected dialog name; Escape/Tab
  behavior on a live alertdialog stacked under a real dialog.
