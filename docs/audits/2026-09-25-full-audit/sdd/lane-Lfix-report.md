# Lane Lfix report

Worktree: /Users/shahg/Desktop/buildrik-af-Lfix, branch fix/audit-Lfix, base 0431517b8.
Commit range: 0431517b8..b4013983c (9 commits).

## Part A — 6 failing tests on the merged base

1. **publish-components.test.ts** — status: fixed 82af16860. Drifted test.
   A-16 (8052769eb) deleted `components/publish/{pre-publish-checks,
   publish-progress,publish-success}` and replaced the dashboard publish page
   with a redirect to `/edit/:id`. The test asserted on the deleted modules.
   Removed the file entirely — redirect coverage already exists in
   `app/dashboard/sites/[id]/publish/__tests__/page.test.tsx`, added by A-16
   itself. Nothing left to replace.

2. **notification-service.test.ts > respects custom limit parameter** —
   status: fixed 9c12a73b4. Drifted test. G1-033 added a `siteId` param to
   `getRecentNotifications(userId, siteId?, limit = 5)` — the second
   positional arg used to be `limit`. The old test's `getRecentNotifications
   ("user1", 10)` landed `10` on `siteId`, not `limit`. Updated the call to
   `("user1", undefined, 10)` and added a sibling case asserting `siteId`
   scoping reaches the query. The limit itself still reaches the query
   correctly — code was right, test was stale.

3. **review.service.supersede.test.ts** — status: fixed 9c12a73b4. Drifted
   test/mock. S-7 added `normalizeReviewEmail` to
   `client-review.service.ts`, which `review.service.ts` imports and calls.
   The test's `vi.mock("@/server/services/client-review.service", ...)`
   only stubbed `issueReviewToken`, so the mocked module had no
   `normalizeReviewEmail` export and `review.service.ts` crashed on import.
   Mock now uses `importOriginal` and spreads the real module, overriding
   only `issueReviewToken`; `normalizeReviewEmail` (pure function) stays
   real.

4. **sites-publish-acknowledge-stale.test.ts > ADMIN ... acknowledgeStale
   succeeds** — status: fixed 35bc432c4. Drifted test. L3's C-3 added a 6th
   `startPublish` argument, `{ expectedLastEditedAt }`, for the stale-copy
   CONFLICT check (`sites.ts:359-365`). The router already passes it through
   correctly (verified by reading the router code) — the test's mock
   assertion (`toHaveBeenCalledWith("s1","ws_1","u_1",[],true)`, 5 args)
   predated the new 6th arg. Updated to expect
   `{ expectedLastEditedAt: undefined }` as the 6th arg.

5. **dark-mode-trilogy.integration.test.tsx** (2 tests) — status: fixed
   3d527e7d8. Test drift, NOT a real dark-mode bug. D-4 (6a3a78790,
   66c6160b3) added `ProjectTokensHydrator` inside `TokenRegistryProvider`:
   on mount (and PROJECT_LOADED) it unconditionally runs
   `resetAllKinds(mergeProjectTokens(composer.getProjectSettings()
   .designTokens ?? [], ...))`, replacing every registry — an empty/missing
   designTokens list resolves to `DEFAULT_TOKENS`. The test seeded its
   custom color token only into `localStorage`
   (`buildrick-design-tokens-int-test-v1`), which the hydrator never reads;
   `new Composer({} as any)` has no project settings, so mount immediately
   discarded the seeded token in favor of the 18-token default seed
   (`--buildrick-design-color-*`), and the assertions on `--bd-color-primary`
   / `--bd-color-secondary` failed. For a REAL loaded project,
   `projectSettings.designTokens` is exactly what the hydrator reads, so
   dark-mode resolution over real project tokens is unaffected — confirmed
   by reading `ProjectTokensHydrator`'s effect and `mergeProjectTokens`.
   Fixed by seeding via `composer.setProjectSettingsRaw({ designTokens })`
   before render, using non-`DEFAULT_TOKENS` ids so `mergeProjectTokens`'
   "added" path preserves the test tokens' own cssVar/darkValue instead of
   a default entry overwriting them by id match.

6. **PageList.treeChildren.test.tsx** — status: fixed dfdc986cf. Test bug,
   not a DOM bug. B-9 gave PageRow's bulk-select checkbox a real
   `role="checkbox"`, nested two levels inside
   `role="tree" > role="presentation" > role="treeitem" > role="checkbox"`
   — a checkbox INSIDE a treeitem is valid ARIA (not a direct tree child).
   The test's `treeChildRoles()` helper, on hitting a `presentation` tree
   child, did an unbounded `querySelectorAll("[role]")`, which also
   collected the checkbox nested two levels inside the treeitem and reported
   it as if the tree owned it directly. Confirmed via DOM read (PageRow.tsx
   line 228-282: checkbox div is a child of the treeitem div, which is a
   child of the presentation div, which is the tree's direct child — nesting
   is correct). Fixed the helper to use `:scope > [role]` (only the
   presentation wrapper's own immediate child), not a deep query.

## Part B — security carry-overs

7. **sanitizeProjectStyles missing on theme rollback + duplicateSite** —
   status: fixed 54f605cda. Real gaps, same class as the S-1 P0. Fixed:
   - `theme.service.ts` `rollbackSiteTheme`'s legacy-snapshot branch (no
     `prevTokens`, restores `snap.prevStyles` as `projectStyles` verbatim)
     now runs it through `sanitizeProjectStyles` first.
   - `sites.service.ts` `duplicateSite` copied `original.projectStyles`
     straight into the new site's `create()`; now sanitized first.
   Tests: a rule with an unsafe selector is dropped in both paths; confirmed
   to fail for the right reason (assertion mismatch, not a mock gap) via
   `git stash` of only the fix file before restoring.

8. **`</head>` first-occurrence injection** — status: fixed ac7ac5c3a. Real
   gap — confirmed reachable: `escapeStyleText`
   (`packages/shared/schemas/element-markup.ts:178-180`) only escapes
   `</style`, not `</head>`. A literal `</head>` inside global CSS (a
   `content: "</head>"` value or a comment) reaches the published HTML
   untouched, inside the `<style>` block that sits inside `<head>`, before
   the real closing tag. `html.replace("</head>", …)` (String.replace =
   first match) would land injected workspace-app scripts / icon-OG tags /
   canonical-robots meta / CMS SEO tags inside that `<style>` block instead
   of the true head close. Fixed: `lib/publish-html.ts` gets an exported
   `insertBeforeHeadClose(html, block)` helper using `lastIndexOf("</head>")`
   — safe because everything after the true `</head>` is `<body>`, whose
   content is serialized through element/attribute encoding, so a raw
   `</head>` substring cannot occur there. `injectWorkspaceApps`,
   `injectHeadTags`, `injectSeoTags` all use it now.
   `server/services/cms.service.ts generateDynamicPages` reuses the SAME
   helper (SSOT) instead of its own first-match replace at the former
   line ~291 (ledger cited ~215; code had moved). Tests in both
   `lib/__tests__/publish-html.test.ts` and
   `server/services/__tests__/cms.service.test.ts` construct a template
   with a literal `</head>` inside a `<style>` block and assert the
   injected tags land after it, not before; both confirmed to fail for the
   right reason pre-fix.

9. **⌘K palette bypasses the VIEWER rail gate** — status: fixed b4013983c.
   Real gap. `StudioPanels.tsx`'s rail click handler
   (`handleRailTabChange`) gated tabs on `VIEWER_TABS` for `viewerChrome`,
   but the `"ui:switch-tab"` bus event — emitted by the ⌘K command palette,
   canvas context menus, inspector doors, `PublishTab`,
   `PublishGateBanner`, `CmsWorkspace`, `BrandWorkspace`, and others — called
   `onLeftPanelTabChange?.(data.tab)` unconditionally, with no gate at all.
   Extracted one predicate, `isTabAllowedForViewer(tab, viewerChrome)`
   (exported), and made both the rail handler and the `ui:switch-tab`
   handler call it — same rule, not two copies. The bus handler now shows
   the same "View only" toast. Test: source-scan confirms both call sites
   use the shared predicate and only one definition exists in the file,
   plus a direct unit-test of the predicate
   (`describe("isTabAllowedForViewer")`) in
   `StudioPanels.openRequests.test.ts`. Confirmed 4 of the new assertions
   fail for the right reason (missing gate / missing export) on the pre-fix
   file via `git stash`.

## Test run

```
npx vitest run \
  __tests__/notification-service.test.ts \
  server/services/__tests__/review.service.supersede.test.ts \
  server/trpc/routers/__tests__/sites-publish-acknowledge-stale.test.ts \
  server/services/__tests__/theme.service.test.ts \
  __tests__/sites-service.test.ts \
  lib/__tests__/publish-html.test.ts \
  server/services/__tests__/cms.service.test.ts \
  --maxWorkers=2
→ 7 test files, 97 tests passed

(packages/editor) npx vitest run \
  src/editor/design-system/__tests__/dark-mode-trilogy.integration.test.tsx \
  src/editor/sidebar/tabs/pages/__tests__/PageList.treeChildren.test.tsx \
  src/editor/shell/__tests__/StudioPanels.openRequests.test.ts \
  --maxWorkers=2
→ 3 test files, 16 tests passed
```

`npx tsc --noEmit -p packages/editor` — clean (exit 0).
`npx tsc --noEmit -p packages/dashboard` — clean, no output.

`__tests__/publish-components.test.ts` was deleted (obsolete, not replaced —
see item 1); everything else is a fix in place.

## What was NOT verified

- No browser/live-app verification of any of the 9 fixes — this lane only
  ran the affected vitest files plus tsc, per the resource rule (no full
  suite, no browser). In particular: the ⌘K palette gate (#9) and the
  `</head>` injection fix (#8) were verified only at the unit-test level,
  not by actually opening the editor as a VIEWER and pressing ⌘K, or by
  publishing a real site with global CSS containing a literal `</head>`.
- Did not run the full repo test suite or `pnpm run verify:ds` — lane rules
  say the controller runs full suites at merge; this lane's changes don't
  touch editor chrome/DS files (StudioPanels.tsx is chrome-adjacent shell
  code but the diff is two `if` conditions + one small helper, no
  markup/token changes), so `verify:ds` was not run.
- Did not check whether any OTHER `ui:switch-tab` emitter or `UI_PANEL_OPEN`
  path has a similar viewer-bypass gap beyond what `isTabAllowedForViewer`
  now covers (e.g. `UI_PANEL_OPEN`'s `VALID_LEFT_TABS` allowlist in
  `useEditorEventListeners.ts` is a different, unrelated gate on tab
  existence, not role — not touched, out of scope per the brief's specific
  citation of `openLeftPanelToTab` / `ui:switch-tab`).
- Did not audit for other unsanitized `projectStyles` write paths beyond the
  two named in the brief (theme rollback legacy branch, duplicateSite) — a
  full sweep for every `projectStyles:` write site was not performed.
- Did not audit for other first-match `</head>`/`</body>` string-replace
  injection sites beyond `lib/publish-html.ts` and
  `server/services/cms.service.ts` (e.g. `injectAnalyticsBeacon` and
  `injectBadge` use `</body>` first-match — not in scope per the brief,
  which cited `</head>` only, and `</body>` is the LAST tag before end of
  document so first-vs-last is moot there, but this reasoning was not
  independently re-verified against a hostile page).

## Cross-lane edits

None — all files touched (theme.service.ts, sites.service.ts,
publish-html.ts, cms.service.ts, StudioPanels.tsx, plus the 6 test files)
are named directly in the Lfix brief.

## Fix round 1 (controller review)

Rebased twice as instructed:
1. `git rebase fix/audit-2026-09-25` (f7ffd5dbd — lane x5, FC-9 widened
   `VIEWER_TABS` to include history/review/activity, read-only). Auto-merged
   cleanly; `isTabAllowedForViewer` reads the widened set (all commit hashes
   below are post-rebase).
2. Rebased again onto the moved `fix/audit-2026-09-25` (072e6c21f — L4b + x2
   + x4 merged). One conflict: `server/services/cms.service.ts` — x4 added a
   parser-based sink sanitizer (`sanitizeGeneratedPageHtml`) on the same
   lines my `insertBeforeHeadClose` touched. Resolved by keeping both: build
   the head-close insertion with `insertBeforeHeadClose`, then run
   `sanitizeGeneratedPageHtml` over the result, same order x4 had it (defense
   after substitution, not folded into it). `npx prisma generate` re-run
   after the rebase (x2's Form schema fields) — required for
   `form-submission.service.ts` type errors that were rebase artifacts, not
   mine.

**CRITICAL — ⌘K VIEWER bypass, actually closed this round.** My first pass
only gated StudioPanels' own rail click and `"ui:switch-tab"` handler. The
controller's read was correct: most ⌘K nav commands (Add, CMS, Brand,
Publish, Settings, Components, Activity, Pages) call `openPanel()` →
`composer.emit(EVENTS.UI_PANEL_OPEN, {panel})`, handled in
`useEditorEventListeners.ts:173-184`, which only checks `VALID_LEFT_TABS`
(existence, not role) and calls `openLeftPanelToTab` unfiltered — wired at
`AquibraStudio.tsx:265`. Every topbar/site-menu button
(`onOpenProjectSettings`, `onOpenPublish`, `onOpenHistory`, `onOpenPages`,
`onOpenActivity`, `onOpenReview`, `AquibraStudio.tsx:375,605-612`) also calls
`state.openLeftPanelToTab(...)` directly, same bypass.

Fixed at the SSOT sink instead of chasing callers: `useStudioState.ts`'s
`openLeftPanelToTab` and `setLeftPanelTab` — the function every one of those
doors eventually calls — now check `isTabAllowedForViewer(tab, viewerChrome)`
before touching state. `viewerChrome` comes from a new shared
`useViewerChrome()` hook (`editor/shell/hooks/useEditorRole.ts`), the same
`readOnlyView && editorRole === "VIEWER"` computation StudioPanels used to
inline — StudioPanels now calls the shared hook too (dropped its own copy).
`VIEWER_TABS`/`isTabAllowedForViewer` moved from StudioPanels.tsx to
`editor/rail/tabsConfig.ts` (the tab registry) so all three consumers
(`useStudioState.ts`, `StudioPanels.tsx`, `CommandPalette.tsx`) import the
ONE definition, no circular import.

**Every caller of `openLeftPanelToTab` / `setLeftPanelTab` / `onLeftPanelTabChange`, grepped:**

```
openLeftPanelToTab callers (all now protected — the sink gates itself):
  useEditorEventListeners.ts:178      UI_PANEL_OPEN handler (⌘K path)
  AquibraStudio.tsx:375               openSiteSettings (⌃-doors)
  AquibraStudio.tsx:605               onOpenProjectSettings (topbar/site menu)
  AquibraStudio.tsx:606               onOpenPublish
  AquibraStudio.tsx:607               onOpenHistory
  AquibraStudio.tsx:608               onOpenPages
  AquibraStudio.tsx:610               onOpenActivity
  AquibraStudio.tsx:612               onOpenReview

setLeftPanelTab direct callers:
  useEditorEventListeners.ts:139,190  setLeftPanelTab("layers") — always
                                       allowed, unaffected by the gate

onLeftPanelTabChange callers (StudioPanels' own prop, = state.setLeftPanelTab,
now gated transitively via AquibraStudio.tsx:643 wiring):
  StudioPanels.tsx:446,450,460,468,476   internal settings-open/pages-open-
                                          settings/cms-open request handlers
  StudioPanels.tsx:542                   "ui:switch-tab" bus handler
  StudioPanels.tsx:610                   rail click handler
  StudioPanels.tsx:618                   viewer-forced "layers" landing effect
  StudioPanels.tsx:627                   handleFullPageClose (back to drawer)
  StudioPanels.tsx:823,824,826           FullPageView onSwitchToAdd /
                                          onSwitchToDesign / onTemplatesSwitchTab
  AquibraStudio.tsx:643                  wires onLeftPanelTabChange={state.setLeftPanelTab}
```

Also made `CommandPalette.tsx` HIDE disallowed nav rows for a VIEWER (not
just let them silently no-op): Add, Brand, CMS, Publish, Settings,
Components, AI, Templates, Pages disappear; Layers, Assets, Activity,
Review, History, and "Search stock photos" stay (FC-9 read-only set). Same
`isTabAllowedForViewer` predicate, via a `NAV_TAB_TARGET` id→tab map.

**Report correction (controller flagged this):** UI_PANEL_OPEN had NO role
gate at all before this round — my Part-9 commit's claim that the bypass was
"closed" was wrong; only the rail+ui:switch-tab minority path was gated.
UI_PANEL_OPEN (the ⌘K majority path) was always in scope per the original
brief's citation of `openLeftPanelToTab` / `ui:switch-tab`, and is now
covered.

**StudioHeader syncRetryQueue mocks** (separate item, added to this round
per controller message): `StudioHeader.test.tsx` and
`StudioHeader.savePill.test.tsx` failed at FILE level post-rebase —
`No "SyncRetryQueue" export is defined on the "@/services/syncRetryQueue"
mock`. L3's C-4 stamps added a `SyncRetryQueue` class export that
`versionSync.ts` constructs at module scope (`new SyncRetryQueue()`); L4b's
merged StudioHeader code now reaches it via `useVersionHistory`. Both test
files' mocks replaced the whole module with only `totalPendingMirrors`.
Fixed with `importOriginal`, spreading the real module and overriding only
`totalPendingMirrors` — no assertion weakened.

### Tests (fix round 1)

- `StudioPanels.openRequests.test.ts` — updated to import
  `isTabAllowedForViewer` from its new home, confirms StudioPanels no longer
  defines it locally, covers the widened FC-9 `VIEWER_TABS` set. 10/10 pass.
- `useStudioState.test.ts` — new describe block: a viewer's
  `openLeftPanelToTab`/`setLeftPanelTab` no-ops for design/settings/content,
  still works for layers/assets/history/review/activity, doesn't flip
  `isLeftPanelOpen` on a blocked call. Mocks `useViewerChrome` directly. 3 of
  5 new assertions confirmed to fail for the right reason pre-fix (via `git
  stash` of only the fix files). 34/34 pass.
- `CommandPalette.test.tsx` — new "VIEWER hides disallowed nav commands"
  block: non-viewer sees every door; viewer sees none of Add/Brand/
  Settings/CMS/Components/Publish/AI/Templates/Pages but still sees Layers/
  Assets/Activity/Review/History/Search-stock-photos; a viewer's click on an
  allowed door still emits it. 1 of 4 new assertions confirmed to fail for
  the right reason pre-fix. 58/58 pass.
- `StudioHeader.test.tsx` + `StudioHeader.savePill.test.tsx` — mock fix only,
  no new tests (nothing to assert beyond "the suite runs"). 96/96 pass.

Full command:
```
(packages/editor) npx vitest run \
  src/editor/design-system/__tests__/dark-mode-trilogy.integration.test.tsx \
  src/editor/sidebar/tabs/pages/__tests__/PageList.treeChildren.test.tsx \
  src/editor/shell/__tests__/StudioPanels.openRequests.test.ts \
  src/editor/shell/hooks/__tests__/useStudioState.test.ts \
  src/editor/shell/modals/__tests__/CommandPalette.test.tsx \
  src/editor/shell/__tests__/StudioHeader.test.tsx \
  src/editor/shell/__tests__/StudioHeader.savePill.test.tsx \
  --maxWorkers=2
→ 7 files, 204 tests passed

npx vitest run (7 dashboard files from Part A/B, --maxWorkers=2)
→ 7 files, 122 tests passed
```

`npx tsc --noEmit -p packages/editor` — clean.
`npx tsc --noEmit -p packages/dashboard` — clean (after `npx prisma generate
--schema prisma/schema.prisma`, required post-rebase for x2's schema
fields).

### What was NOT verified (fix round 1)

- Still no browser verification of the ⌘K fix — a real VIEWER session
  opening ⌘K and confirming the rows are gone / blocked tabs don't open was
  not run. Unit + source-scan only.
- Did not re-audit whether `UI_PANEL_OPEN`'s `VALID_LEFT_TABS` existence
  check (a different, unrelated gate) needs any change — out of scope, it
  answers "does this tab exist" not "may a VIEWER open it," and the new sink
  gate sits downstream of it regardless.
- Did not check every OTHER possible door onto a left-panel tab beyond what
  the grep in this report surfaced (e.g. keyboard shortcuts routed through
  `useEditorShortcuts.ts` that might call `openLeftPanelToTab` under a
  different code path than the ones grepped) — the grep covered
  `openLeftPanelToTab(`, `setLeftPanelTab(`, and `onLeftPanelTabChange`
  textually; a caller reached only through a renamed local alias would not
  have been caught. All are protected regardless BECAUSE the gate sits at
  the sink, not at each caller — a caller I didn't find is still gated,
  the grep was for the report's completeness, not for finding what to fix.

### Commit range (fix round 1)

`072e6c21f..6b96a3141` — base is now `fix/audit-2026-09-25`'s tip
(072e6c21f, lane x4 merged) after the two rebases; all Part A/B commits got
new hashes from rebasing (`c0b86805f`..`64f7f7397`/`9ffcede8d`, same content
as originally reported). New commits this round: `86fb5da9b` (partial
rail-only fix, superseded same round), `864193a56` (the real sink fix),
`6b96a3141` (StudioHeader mocks).
