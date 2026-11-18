# Phase 2 continuation — Pages and History

Observed 10 October 2026 in authenticated local Chromium at 1440×900. All data mutations were confined to the disposable draft site `cmv1z8k860002yulrh29dr5fw`. No application code changes, publishing, or changes to existing user sites.

## Pages workflow

- Home exposes a disabled Delete action with “Homepage can’t be deleted”.
- Menu Duplicate created `Home Copy` (`page-mv2eg9pp-lf14xqozj9`) with the heading and paragraph retained and fresh element IDs. The copy was selected explicitly after creation.
- F2 opened inline rename. Renaming to `Audit renamed copy` offered Keep URL / Update URL / Cancel. Keep URL retained `home-copy`; a subsequent server read after reload confirmed it.
- Delete opened a confirmation explaining that Undo restores the page. Confirming removed the copy; Meta+Z restored the same page ID and its content. Save and reload retained it.
- Meta+D on a focused page row did not duplicate the page, both before and after reload. The menu displays ⌘D. Menu activation itself works. This is a shortcut-contract defect, not evidence that duplication is entirely broken.

**PAGE-01 — P1, verified:** `src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:114` renders the shortcut. `PageRow.tsx:247` handles Enter, F2 and Space, but does not dispatch page duplication. The registered global duplicate command acts on selected elements. Acceptance for eventual approved work: focused page shortcut targets that page exactly once, input fields retain native editing, and canvas duplication retains its own context. No fix made.

Existing tests: `evidence/pages-continuation-tests.json` reports **5 files, 52 tests passed**: useFolders.server (7), usePages (35), usePageCommands (4), PagesTab.deleteTemplate (4), PageSettingsDrawer.escape (2). These tests use harnesses/mocks and do not certify every remote or keyboard behavior.

## History workflow

1. Opened History → Saves and saved named version `Audit checkpoint 1010`. The UI listed it and the server `siteVersions.list` returned it as a named, non-auto version.
2. Compare initially reported that the draft matched the checkpoint.
3. Renamed the copied page to `Audit after checkpoint`, retained its URL, and saved. Compare still reported **“The current draft matches ‘Audit checkpoint 1010’.”**
4. Restore to draft opened a confirmation describing its scope: draft pages/styles/saved settings; live site, Content records, Media, saved components and server settings excluded. Those exclusions were read, not independently verified in this workflow.
5. Restore changed the page back to `Audit renamed copy`. A safety version named `Before restoring "Audit checkpoint 1010"` appeared and an Undo restore action remained in the panel.
6. Undo restore returned `Audit after checkpoint` and produced another safety version. Save, reload, and independent server GETs confirmed the final page name, `home-copy` slug, checkpoint and two safety versions. This verifies the tested page-metadata round trip, not all saved-project data or failure modes.

**HIST-01 — P1, verified:** comparison omits a page-name change while asserting draft equality. `src/engine/VersionTimelineManager.ts:714` captures the live draft; `compareSnapshots` compares flattened elements and counts page additions/deletions by ID (`:722–811`), but does not compare the names of matched pages. `src/editor/panels/version-history/CompareView.tsx:191` renders the equality message when the change list is empty. Restore does restore the name, so the omitted difference matters to the action the comparison supports. Proposed direction for later design/approval: compare restorable metadata or clearly scope the result to what was compared. Acceptance: rename-only drafts produce a truthful comparison before restore; unchanged snapshots remain distinguishable. No implementation made.

Screenshot: [rename difference omitted from comparison](evidence/history-rename-compare.png), captured and visually inspected after reload. The current page tab is truncated to “Audit after check…” while the comparison reports a match. [Server reload evidence](evidence/pages-history-reload.json) preserves sanitized observed names and statuses, without auth secrets.

Existing History tests also passed: **3 files / 41 tests** — VersionTimelineManager (12), VersionHistoryPanel.branches (24), CompareView (5). Raw result: `evidence/history-continuation-tests.json`. Together with the Pages run this continuation passed 93 tests across 8 files. These passing tests do not invalidate the runtime findings; the observed rename-only comparison and page-shortcut gaps remain open. No tests were changed.

## Panel and context behavior

At 1440×900 the Pages drawer measured 280px wide at x60/y56; the inspector was 300px at x1140/y56. Opening History replaced the inspector and closed Pages. Escape returned to the inspector and focused the History trigger; Pages remained closed. `StudioPanels.tsx` conditions left-drawer visibility on no active right-column tab. This is recorded behavior and an IA input, not automatically a defect.

History provides Session / Saves / Published tabs. Session describes its temporary scope; Saves provides named versions. The version overflow offers details, naming, restore, compare and delete. Overflow triggers in both Pages and version rows require row hover in the observed pointer flow; keyboard discoverability remains open. The restore confirmation provided an explicit cancel path. No published-version action was run.

## Remaining verification

Page drag ordering, folder server behavior, CMS template deletion dependencies, version offline/failure paths, metadata beyond page name, multi-role permissions, session time travel, cross-browser behavior and complete keyboard access remain pending. Gate 2 is still open. Phase 3 ownership/benchmark consolidation follows this audit; AS-IS Figma must precede TO-BE and implementation approval.
