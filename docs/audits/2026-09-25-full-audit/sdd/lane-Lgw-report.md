# Lane Lgw report: gap-walk doors (93-gap-walk.md #1–#10)

Worktree `buildrik-af-Lgw`, branch `fix/audit-Lgw`. Range `4a513679e..2b142a26c` (11 commits: 1 docs + 10 fixes).
First commit `4a0f4fead`: docs(audit), the Phase 2b gap walk report plus owner-decisions.md.

## Gate
- `npx tsc --noEmit -p packages/editor` exit 0 with 0 lines. `npx tsc --noEmit -p packages/dashboard` exit 0.
- `pnpm run verify:ds` (packages/editor, foreground, `bash -c`) exit 0. The tree was clean afterwards, so no baseline was rewritten.
- vitest `--maxWorkers=2`, touched test files only:
  - editor: 10 files, 192/192 passed.
  - dashboard (root config): 3 files, 15/15 passed.
- No DB tests were written, and test:db was not run.

## Per door

### GW-1 · letter after Esc (dead): fixed `8a98b2808`
- **Root cause.** A rail letter called `onTabChange` only, which switched the tab and never opened the panel. After Esc closed a column panel (`isLeftPanelOpen=false`, tab kept), U → Esc → H switched to History inside a closed column. Any letter pressed while the drawer was closed had the same bug.
- **Fix.** `LeftSidebar` now binds letters to `ui:switch-tab`, the same door `I` already used. It switches the tab, opens the panel when it is closed, and applies the viewer gate and its toast.
- **Test.** `LeftSidebarRailClick.test.tsx`: "a letter emits ui:switch-tab…". Red (0 emits) → green.

### GW-2 · column panels with the inspector hidden (dead): fixed `023e726b8`
- **Root cause.** `inspectorOpen` was gated on the inspector's own hide preference. The panels that live in that column (History/Publish/Review/Activity, Issues) therefore mounted into a 0-px column. AI had a one-off patch that force-persisted `inspectorShown=true`.
- **Fix.** New pure function `isInspectorColumnOpen` (tabsConfig.ts). The column opens for any panel it hosts (column tabs, Issues or AI), and hiding the inspector now hides only the inspector. The AI special case was removed.
- **Tests.**
  - `tabsConfig.test.ts` › isInspectorColumnOpen (4 cases): red ("not a function") → green.
  - The A-14 source assertion in `StudioPanels.openRequests.test.ts` was rewritten to the new rule.

### GW-3 · Hide inspector no-return: fixed `3250eff6f`
- **Choice: do not persist the hidden state, and answer the hide with a way back.** flow-check.md and the code record no board with a visible "Show inspector" control. The footer toggle was removed as off-board (G2-037). So nothing was invented:
  - `inspectorShown` is now session-only. The localStorage key `buildrik-inspector-shown` is no longer read or written.
  - Hiding raises the toast "Inspector hidden" with a **Show** action.
  - ⌘K "Toggle inspector" is still available.
- **Test.** New `StudioPanels.inspectorHide.test.ts` (source-level, the house style for StudioPanels): red → green.

### GW-4 · Bind to CMS field… (wrong-destination): fixed `9fd100c77`
- **A picker exists.** Inspector › Content (Source · Collection · Field, board 4428:149540). This was **not a missing screen**, and nothing new was built.
- **Fix.** The row selects the element and emits `UI_INSPECTOR_FOCUS_SECTION {section:"content"}`, the same path "Add interaction" uses. It no longer opens the CMS workspace. OD-GW-2 in owner-decisions.md is annotated as done-as-recommended.
- **Tests.** `standaloneActions.test.ts` › bind-to-cms, 2 cases. The first was red → green. The second pins that every bindable type's inspector profile carries `content`.

### GW-5 · Copy link TypeError on http (error): fixed `87fc80aa0`
- **Root cause.** 11 editor sites each called `navigator.clipboard` their own way:
  - 2 crashed with a synchronous TypeError on insecure origins (Layers, PreviewShareModal).
  - 3 failed silently.
  - Pages survived only because it was guarded by hand.
- **Fix: one shared path.** New `shared/utils/clipboard.ts` `writeClipboardText`:
  - It never throws synchronously.
  - It falls back to `execCommand("copy")` via a transient offscreen textarea. That file is allowlisted for Gate 22, and the allowlist entry is commented.
  - It rejects when nothing copied.
- All 11 sites were migrated. Layers' failure toast now carries the URL.
- **Tests.**
  - `clipboard.test.ts`, 4 cases. One is a guard that fails on any new direct `navigator.clipboard.writeText` in editor src. It was red with 12 offenders → green.
  - The `usePages.test.tsx` "copy manually" case was updated to the new failure path, which still shows the URL.

### GW-6 · History › Published `<div>` in `<p>` (error): fixed `07d4b39e9`
- **Root cause.** The note under the Published list was a `<p>` wrapping the ⓘ Tooltip, and the Tooltip renders a `<div>`. It was not the empty state as the walk guessed: the verify site has v1–v4 in its list.
- **Fix.** The note is now a `<div>`.
- **Test.** `PublishHistory.details.test.tsx` asserts `document.querySelector("p div") === null`. Red → green.

### GW-7 · VIEWER topbar search (dead): fixed `2bf3e2bb8`
- **Fix.** In view mode `onOpenSearch` is not passed, so no ⌘K field is drawn. View mode refuses the palette by design, so this hides the dead door. A context search, such as the Layers filter, is unaffected. The viewer palette question stays open as OD-GW-3.
- **Tests.** `StudioHeader.test.tsx` has 2 cases, both of which pass a composer. Red → green.

### GW-8 · Invite teammate for non-admins (wrong-destination): fixed `81ff1c6ab`
- **Dashboard.** The Home quick action is now disabled for non-admins, with the title "Only workspace admins can invite teammates.". The role comes from `dashboard.health`, the same pattern api-tokens and integrations use.
- **Editor.** The site menu's "Invite teammates ↗" is the same door. It is now withheld when `roleAtLeast(role,"ADMIN") === false`, the same rule Unpublish uses. `canUnpublish` was renamed to `atLeastAdmin`.
- **Tests.**
  - New `components/dashboard/__tests__/quick-actions.test.tsx`, 5 cases. The non-admin cases were red → green.
  - `SiteMenu.board.test.tsx`: 1 case, red → green.

### GW-9 · Transfer Site for non-owners (wrong-destination): fixed `37945d82f`
- **Server enforcement was verified in code.**
  - `sites.transfer` requires `checkSiteRole(..,"OWNER")`.
  - The service throws `NOT_OWNER` unless the caller is `site.createdBy`.
  - `team.list` is ADMIN-gated, which is why non-owners saw an empty member list.
- **Fix.**
  - `ContextMenu` withholds Transfer unless `canTransfer` is set.
  - The grid and list views compute `canTransfer` as `health.role==="OWNER" && site.createdBy===session.user.id`, using `transferOwnerId` from the projects page.
- **Test.** New `context-menu-transfer.test.tsx`, 3 cases. Red → green.

### GW-10 · /edit without access (wrong-destination): fixed `2b142a26c`
- **Fix.**
  - The route renders the existing `DeniedState` instead of `notFound()`.
  - It is titled "You don't have access to this site".
  - It uses the site-detail screen's deleted-or-no-access wording, so it does not reveal which case applies.
  - It has a "Back to sites" link to `/dashboard/projects`.
- **Test.** `app/edit/[siteId]/__tests__/page.test.tsx`: the non-member case was rewritten to render the screen and assert heading, copy and link. Red → green.

## NOT verified live (the controller's Phase 2 re-walk)
None of the 10 was checked in the running app. This lane ran unit tests, tsc and gates only. Items to walk:
- **#1** U → Esc → H and U → Esc → U in a real editor, for all 4 roles. As VIEWER, a blocked letter such as A should toast once, not twice.
- **#2/#3**
  - Hide inspector, then open History, Issues and AI, and measure the column width. Close them and confirm the inspector stays hidden.
  - Reload and confirm the inspector is back. Click the toast's Show.
- **#4** Right-click a heading → Bind to CMS field…. Confirm the inspector switches to the Content section, scrolls and tints it. **Known gap, not fixed:** if a column panel (History etc.) or AI is open, or the inspector is hidden, the focus event lands on an unmounted inspector and nothing visible happens. "Add interaction" has the same limit.
- **#5** Copy link on the http LAN origin. The legacy fallback was never exercised in a real browser (jsdom only). Confirm it copies, or that the failure toast shows.
- **#6** Check the console on History › Published with rows present.
- **#7** VIEWER `?view=readonly`: the topbar should show no search field and still keep Preview and Publish(disabled).
- **#8** Log in as EDITOR, VIEWER and scoped: Home's Invite teammate should be disabled with a tooltip. Also check the editor site menu row. An admin briefly sees the button disabled while `dashboard.health` loads.
- **#9** Log in as EDITOR and as OWNER on a site another member created: Transfer should be absent. As OWNER on their own site it should be present.
- **#10** As the scoped user, open `/edit/<S2>`. The page returns HTTP 200 now, not 404.

## Cross-lane edits
- The `packages/editor/scripts/gates/overlay-allowlist.txt` entry for `shared/utils/clipboard.ts` is one path plus a comment.
- Many editor shell and sidebar files were touched for the clipboard migration. Each was a one-line swap to `writeClipboardText`.
- No server or Prisma changes, and no env vars.

## Found out of scope (not fixed)
- **Dashboard clipboard.** The dashboard has 7 unguarded `navigator.clipboard.writeText` sites, which crash the same way on an http LAN origin:
  - `projects/page.tsx:359`
  - `api-tokens-tab.tsx:267`
  - `access-tab.tsx:198`
  - `share-draft-modal.tsx:60`
  - `site-card.tsx:39`
  - `media-library.tsx:179`
  - `webhooks-card.tsx:165`, which is guarded but silent
  
  The editor helper is not importable from dashboard layering. The dashboard needs its own single helper, and `lib/` is the natural home.
- **Service import in a route.** `app/edit/[siteId]/page.tsx` imports `@server/services/sites.service` directly. This existed before this lane and breaks the Page → tRPC rule for a server component. It was left alone.
- **OD-GW-1** (VIEWER dashboard write doors) was not built, as instructed.

## Fix round 1 (review CHANGES_REQUIRED + live re-check)

Range `2b142a26c..d07516345` (13 commits). Gate:
- `tsc -p packages/editor` exit 0, `tsc -p packages/dashboard` exit 0.
- `verify:ds` (foreground, `bash -c`) exit 0, and the tree was clean afterwards.
- Touched tests, `--maxWorkers=2`: editor 9 files 62/62, dashboard/lib/server 6 files 35/35.
- Also re-run: StudioHeader ×3 (103), the useComposerInit/save suites (99), Layers ×10 (30), canvas ×8 (48), the share tests ×3 (26), and the dashboard settings/site-detail tests (64).

| item | SHA | root cause → fix | test (red → green) |
|---|---|---|---|
| I-1 (+M-6) | `e3366423d` (+ `d07516345` typing) | UI_INSPECTOR_FOCUS_SECTION only had a listener in the rendered ProInspector. StudioPanels now routes a request that the visible body could not take: it shows the inspector, closes AI/Issues/the column tab, holds the payload, and re-emits it on the next frame once the body is up. The payload is held only while the body is not shown, so it cannot loop, and full-page and CMS-workspace states are skipped. For M-6, usePropertyJump reads the selection type at frame time instead of from its closure. | New render harness `StudioPanels.inspectorColumn.test.tsx`: the AI, History and hidden-inspector cases end with the inspector shown and the section revealed, and a request already taken is not re-sent. `usePropertyJump.test.tsx` gains a stale-type case. |
| M-2 | `7e2ba50a5` | Choice: skip the "Inspector hidden" toast when the inspector body is not the rendered branch. The toggle does **not** close the covering mode. | Render tests: hiding shows the toast and Show restores the inspector; the hidden state does not survive a remount; there is no toast under AI. |
| M-1 | `e17a7a25e` | Choice: keep the board's "‹ Inspector" label and make it true. The back row closes the mode **and** shows the inspector, while ✕ only closes, so a hidden inspector stays hidden. Issues' back action is now owned by StudioPanels: AquibraStudio passes `renderIssuesPanel(onBack)`, which is a cross-file edit to AquibraStudio. | Render tests for the AI back row, AI ✕, and the Issues back row. |
| M-11 | `61d52631f` | Removed `StudioPanels.inspectorHide.test.ts` (a regex over source) and the A-14 string check. They are replaced by render tests, including "AI, a column tab and Issues each open a hidden inspector's column". `BINDABLE_TYPES` is exported and imported by the test. | These are the tests themselves. |
| M-4 | `63feb293c` | The fallback now focuses the textarea (Safari needs this for execCommand), remembers `document.activeElement`, and restores it in `finally`. | `clipboard.test.ts`: the focus case went red once `focus()` was added, then green. |
| M-5 | `8f0690ae4` | New `lib/clipboard.ts` with the editor's contract. All 8 dashboard sites were migrated: projects, partner, webhooks, share-draft, access-tab, site-card, media-library and api-tokens. Each confirms only on success and says so on failure. API tokens show "Copied" only after the write resolves; on failure, a `role=alert` asks the user to copy by hand while the token stays visible and selectable (`select-all`). | `lib/__tests__/clipboard.test.ts` has the contract tests plus a no-direct-writer guard, which went red with 8 offenders. `api-tokens-tab-copy.test.tsx` has 2 cases. Toast mocks were added to the webhooks and access-tab tests. |
| M-8 | `380fd07db` | Only a **known** non-admin role disables Invite teammate. While the role is loading or has errored, the link is kept. | quick-actions: the loading case went red → green. |
| L-1 | `b1d51fcb9` | New `useCanvasNavigationGuard` on the canvas frame root, in the capture phase. It prevents the default action of click and auxclick on or inside `a[href]`/`area[href]` (Enter on a focused link arrives as a click) and of any submit. Events still propagate. It is active in view mode too. | `useCanvasNavigationGuard.test.tsx`, 4 cases. |
| L-2 | `d95fea572` | The bypass moved from a StudioHeader ref to a shared `unloadGuardBypass.ts`. `refuseForbiddenSave` navigates through it, with injectable navigation. The header's unmount ends any bypass, which also stops it leaking between tests. | `refuseForbiddenSave.unload.test.ts`: the navigation happens with the bypass on. |
| L-3 | `56c6c7e16` | `setActivePage` emits `project:changed {type:"page:activated"}`, and autosave treated it as an edit. The autosave handler now drops `isNavigationOnlyChange`, the same filter the dirty markers use. The active page is not a content edit. | `useComposerInit.markSaved.test.ts`: a page switch sends no save and does not set dirty, and `page:updated` still saves. |
| L-4 | `ef3c355f6` | CommandCenter stands down inside `role=tree`, and the row did not handle Delete or Backspace. The row now runs `composer.commands.run("delete")`, which brings the lock and instance rules, the multi-select confirm and a single undo step. It selects a focused but unselected row first, and ignores keys from the rename field. | `LayerTreeItem.delete.test.tsx`, 4 cases. |
| L-5 | `6deaba244` | `deliveredCmsBindings` projects the bindings map to the element ids on the delivered pages, and the CMS field set is computed from that same projection. | `share-link.visitor.test.ts`: only delivered bindings ship and "secret" is absent. One existing case was updated to put the bound element on a delivered page. |

### NOT verified live (round 1)
None of these was run in the browser.
- **I-1:** Bind to CMS field / Add interaction with AI, Issues, History or a hidden inspector. Check the real reveal: scroll, tint and focus.
- **L-1:** Click, middle-click, and Enter on a focused canvas link, plus a canvas form submit. The editor must stay put.
- **L-1 inline editing:** a click on a link inside inline-edit text now also has its default prevented, so check the caret still lands.
- **L-2:** Repeat the demote loop about 5 times and confirm there is no "Leave site?".
- **L-3:** Page-tab clicks should send 0 `saveProject`. Other markDirty sources on page render, if any exist, are not covered.
- **L-4:** Delete on an unlocked and on a locked Layers row: the locked one is skipped with its toast, and a 2-row selection asks to confirm.
- **L-5:** Inspect the /share RSC payload.
- **M-5:** Copy buttons on the http LAN origin, using the legacy fallback in a real browser.

### Notes
- Two helpers carry the same clipboard contract, `packages/editor/src/shared/utils/clipboard.ts` and `lib/clipboard.ts`. This is because the editor cannot import root `lib/`, and the header comment in `lib/clipboard.ts` says so.
- `components/dashboard/site-card.tsx` has no importer. It looks like dead code; it was migrated anyway and not deleted.

## Fix round 2

Range `d07516345..1bb490a55` (4 commits). Gate:
- `tsc -p packages/editor` exit 0, `tsc -p packages/dashboard` exit 0.
- `verify:ds` exit 0, and the tree was clean afterwards.
- Touched tests: canvas guard 6/6, StudioPanels harness 13/13, share visitor 14/14, canvas component tests 48/48, and `__tests__/dashboard-components.test.ts` 6/6 after the deletion.

| item | SHA | root cause → fix | test |
|---|---|---|---|
| I-2 | `97f67626d` | The L-1 guard attached in an effect keyed on a ref object, so it guarded the node that existed at mount. Showing the device frame remounts the frame, so the listeners stayed on the detached node. The guard is now a **callback ref**: each node the frame becomes is guarded and the old one is released. Canvas composes it with `frameRef` in one stable callback. | Two new cases in `useCanvasNavigationGuard.test.tsx`: a keyed remount of the guarded root, and a device-frame show/hide sequence. **The keyed-remount case is red on the old hook**: a scratch probe against the committed ref-object hook gave `defaultPrevented: false`. |
| m-1 | `61167ff0f` | A held focus request now lapses after 500 ms (`PENDING_FOCUS_MS`) and on any `selection:changed`. The payload and timer live in refs, so the route effect re-subscribing does not drop or orphan them. The harness now owns the tab after its initial value; a prop spread had been overriding it. | 2 render cases: expiry, and a selection change. Both were red against the previous StudioPanels, checked by temporarily restoring it with `git show HEAD:` and putting the new file back afterwards. No stash was used. |
| m-3 | `d1730f4cd` | Deleted `components/dashboard/site-card.tsx`, which had zero importers. | — |
| optional | `1bb490a55` | `forEachElement` is now shared by `deliveredCmsBindings` and `boundCmsFields`. Behaviour is unchanged. | Share visitor tests 14/14. |

**Not verified live:** mobile, show device frame, click a canvas link, and the editor must stay put. The held focus request lapsing, in the browser.

**Harness note.** The device-frame-only test does not reproduce the detach under jsdom: jsdom reported the old node as still connected. That case documents the scenario. The red-on-current proof is the keyed-remount case.
