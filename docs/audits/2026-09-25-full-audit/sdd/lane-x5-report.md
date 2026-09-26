# Lane x5 report

Worktree: `/Users/shahg/Desktop/buildrik-x5`, branch `feat/x5`, rebased onto
`fix/audit-2026-09-25` @ `389c495d6`. Commit range: `389c495d6..6eeec6e4c`.

## FC-6 — one stock surface
Status: `fixed 4ef256702` (was uncommitted WIP at start; committed as-is,
verified complete). Drawer's "Add from stock" now opens `StockSourceModal`
(full-page) instead of `StockBrowserOverlay`; the overlay + its test are
deleted; `FAILURE_COPY`/`FilterDropdown`/`COLORS`/`ORIENTATIONS`/`TYPES`
ported into `StockSourceModal.tsx` verbatim (L8's failure-copy behaviour
preserved). Follow-up `fixed a2e648183`: `npx tsc --noEmit` and
`gate:ds-ssot`/`check-anchors` (run after the WIP) caught breakage the WIP
left — `e2e/probe/probe.tsx` still imported the deleted module (real tsc
error), a conformance recipe (`media-drill-in-stock-browser.json`, board
147:55, already `superseded:board:clone-3695:45569`) targeted testids that
only ever existed on the deleted overlay, and the exported helper consts
were now dead exports. Fixed all three; retired the recipe rather than
inventing new pixel authority for a Modal with a different DOM shape.

## FC-4 — "My folders" copy
Status: `fixed 76efd07be`. `MediaFolder` confirmed per-user in
`prisma/schema.prisma` (userId, no shared-folder model). Renamed the media
FolderTree section header "Folders" → "My folders" + ownership tooltip,
matching the existing Pages-folder pattern (`PageFolder.tsx` `FOLDERS_TIP`).

## FC-1 — CMS pages hint in Pages
Status: `fixed de8c921b8`. New `useDynamicPagesSummary` hook sums
`cms.dynamicPages` (server/trpc/routers/cms.ts:84) across every collection
with `pageSlugPattern` set; `PageList` renders a read-only "+N from
collections ›" row (only when N>0) that opens the collection's Dynamic
pages tab via `UI_CMS_OPEN` (extended `CmsOpenRequest`/`openRequest` with
an optional `tab`).

## FC-9 — viewer read-only History/Review/Activity
Status: `fixed 6eeec6e4c`. Two-part gap, both closed:
1. `StudioPanels.VIEWER_TABS` was blocking "history"/"review"/"activity"
   outright for a viewer — contradicted the decision. Added them.
2. Gated every write control found in the three panels with
   `useEditorRole()==="VIEWER"` → aria-disabled + Tooltip reason (same
   shape as `SendForReview.disabledReason`): Review resolve/reopen,
   re-send, revoke/withdraw, reattach, comment composer; History clear
   undo, session restore (ActivityView), saves restore/delete
   (VersionList), restore-from-details (VersionHistoryPanel), save a
   version (SaveVersionFooter), Time-Travel band restore (TimeTravelHost).
   Activity (ActivityLogView) was already pure-read, confirmed not changed.
   Server authz (`checkSiteRole` EDITOR+) already refuses all of these —
   not loosened, only mirrored in the chrome.

**Found, NOT fixed (documented in the commit, out of scope for this item):**
⌘K's `UI_PANEL_OPEN` → `openLeftPanelToTab` bypasses
`StudioPanels.handleRailTabChange`/`VIEWER_TABS` entirely — a pre-existing
hole letting a viewer reach even the still-blocked tabs (Add, Pages, CMS,
Brand, …) via the command palette. Not caused by this change.

## Tests
`npx tsc --noEmit -p .` clean (0 errors, after the FC-6 follow-up fix).
Targeted `npx vitest run --maxWorkers=2` on every touched test directory:
media (41 files/348 tests), pages (31 files/300 tests, 1 pre-existing
unrelated failure — see below), review (2 files/77 tests incl.), history
(2 files/26 tests), version-history/TimeTravelHost/StudioPanels (7
files/55 tests), cmsWorkspaceStore. All green except the one pre-existing
failure. `check-styling-ratchet`, `check-design-debt-ratchet`,
`check-ds-ssot`, `check-anchors`, `check-copy` all PASS.

**Pre-existing, NOT caused by this lane:** `PageList.treeChildren.test.tsx`
> "keeps the one-page note's Add button out of the tree" fails on base
`389c495d6` too (verified in a throwaway worktree at that exact commit,
same failure) — a row-checkbox role the test's helper wasn't updated for.
Left untouched (not my file ownership, not FC-1/4/6/9 scope).

## NOT verified
No live-app verification (port 3036 load not checked; did not attempt).
All four items verified by: reading current code, unit/component tests,
tsc, and the conformance/ratchet gates only.

## Cross-lane edits
`StudioPanels.tsx`, `TimeTravelHost.tsx` (shell) — not explicitly x5-owned
files, touched for FC-9's rail gate + Time-Travel restore.
`e2e/probe/probe.tsx`, `scripts/conformance/surfaces/*.json` — touched to
un-break what the received FC-6 WIP left broken.

## Fix round 1 (controller review)

Commit range: `389c495d6..65bb21433` (adds `eafc46b37`, `67be56d20`,
`522427e8e`, `6b2844162`, `65bb21433` on top of the original five).

**CRITICAL — gate:boards, fixed `eafc46b37`.** Deleting
`surfaces/media-drill-in-stock-browser.json` (FC-6 follow-up) left
`boards.json` row 147:55 naming a dead recipe, `.conformance-baseline.json`
carrying an orphaned ratchet entry, and the recipe-count floor one ahead of
reality. Flipped 147:55 `status: active → retired` (`recipe: null`),
matching the vocabulary already used for a board with no live surface
(169:60 precedent) rather than inventing new pixel authority for
StockSourceModal (a Modal with a different DOM shape than the deleted
drawer overlay). Dropped the orphaned baseline entry, ran
`check-boards.mjs --update-floor` (186 → 185, deliberate). Ran
`bash -c 'cd packages/editor && pnpm run verify:ds'` ONCE, alone: it
surfaced 3 pre-existing `tsc` regressions from my own round-1 test edits
(wrong `vi.fn<[], T>()` generic form for this repo's vitest version — fixed
to `vi.fn<() => T>()`), not gate:boards itself. Re-ran `verify:ds`'s
component gates individually after the fix (styling-ratchet,
design-debt-ratchet, ds-ssot, check-boards, check-tsc-baseline) — all PASS.
Did not re-run the full `verify:ds` a second time (RESOURCE RULE — "ONCE,
alone"); the individual gates it chains are confirmed green piecewise.

**IMPORTANT — missing tests, fixed across 4 commits**, all
`--maxWorkers=2`, every touched file re-run green after edits:
- `67be56d20` FC-4: FolderTree "My folders" label + tooltip.
- `522427e8e` FC-1: PageList's "+N from collections ›" row (absent at 0,
  opens on click, hidden during bulk-select) + a new
  `useDynamicPagesSummary.test.ts` (sums per collection, empty with no
  composer/no pageSlugPattern collections, tolerates one collection's
  query rejecting, re-fetches on `CMS_STORE_REFRESHED`).
- `6b2844162` FC-9: viewer-gating in ReviewTab (Resolve, Re-send, Revoke,
  comment composer), VersionHistoryPanel (row Restore/Delete, details-modal
  Restore, Save a version), HistoryTab (Clear undo history), ActivityView
  (per-entry Restore) — each asserts aria-disabled + tooltip/title text as
  VIEWER and handler-not-called, and full function as EDITOR/default.
  ReviewTab.test.tsx and HistoryTabShell.test.tsx previously left role
  resolution to the real `fetchMyRole()` → network → `catch(() => null)`
  path; both now mock `useEditorRole` directly for determinism.
- `65bb21433` FC-6: new `MediaTab.stockSurface.test.tsx` — every sibling
  overlay stubbed, StockSourceModal left real; confirms it opens via
  `initialStockQuery`, stays unmounted otherwise, and renders the
  search-failure copy (StockSourceModal's own copy tests already covered
  the failure-copy matrix in depth; this pins the MediaTab-level wiring).

Bug found while writing the VersionHistoryPanel tests (fixed in the same
commit, not a separate finding): the file's shared `beforeEach` never
reset `mocks.state.loadError`/`isLoading`, so tests appended after the
"load error" describe block silently inherited its error state. Scoped
the reset to my new describe block rather than touching the shared one.

**Minor (noted, not fixed):** the null-role window (role not yet resolved)
renders write controls enabled — confirmed as an accepted existing pattern
(`useEditorRole`'s own doc comment: "null = ... let the server decide");
server-side `checkSiteRole` still refuses. No change made.

Tests: `npx tsc --noEmit -p .` clean; `node scripts/check-tsc-baseline.mjs`
PASS (editor 0, dashboard 0); all 5 gate scripts PASS; every new/modified
test file re-run individually with `--maxWorkers=2`, all green (FolderTree
+PageList+useDynamicPagesSummary: 43/43; ReviewTab: 50/50;
HistoryTabShell+ActivityView: 37/37; VersionHistoryPanel: 16/16;
MediaTab.stockSurface: 3/3; MediaTab.test.tsx re-run for regression: 6/6).

## Fix round 2 (controller re-review)

Commit: `44097338a`.

1. Added the two missing VIEWER tests: ReviewTab's Reattach comment
   (detached group, `ReviewTab.tsx:980-981`) — drives the panel's own
   `comments:orphans` reply (the same event the canvas layer uses) to get a
   comment into the detached group without the real Locate-› flow, then
   asserts aria-disabled + tooltip and that `setActivePage` never fires
   behind the disabled button, with an EDITOR counterpart. TimeTravelHost's
   Restore… band button (`TimeTravelHost.tsx:278-289`) — added a
   `useEditorRole` mock to that test file (previously unmocked), asserts
   aria-disabled + no `restoreEntry` call + no confirm band opens as
   VIEWER, and that it still works as EDITOR. Also upgraded the Re-send
   menu item's VIEWER test from title/aria-disabled-only to click-and-
   assert-not-called (`onResend`, no `review-resend-confirm` dialog),
   matching Revoke's existing shape.
2. `boards.json` `counts.active`/`counts.retired`: verified by counting
   rows directly (no generator script exists) — found they were **already
   stale before my 147:55 flip** (514/20 in the file vs. 506/23 the actual
   pre-flip row count), not the clean baseline the round-2 message assumed.
   Set to the current verified values, 505/24, rather than applying a ±1
   delta to a number that didn't match the rows. `counts.outOfScope` (57 in
   the file vs. 62 actual) is stale the same way — found, left unfixed
   (out of this item's specific scope; flagging rather than scope-creeping
   into a full manifest audit).

Tests: `npx tsc --noEmit -p .` clean. ReviewTab.test.tsx 52/52,
TimeTravelHost.test.tsx 10/10, both `--maxWorkers=2`.
`node scripts/conformance/check-boards.mjs` run once: PASS — 185
recipe(s) (floor 185) · 179/505 active board(s) measured (35.4%).
