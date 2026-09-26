# Lane L4a report — editor keyboard / navigation / commands

Worktree: `/Users/shahg/Desktop/buildrik-af-L4a`, branch `fix/audit-L4a`, base `e143ffbaf`.
Commit range: `e143ffbaf..HEAD` (19 commits, see `git log --oneline e143ffbaf..fix/audit-L4a`).

## Round 1 (controller review) — addressed below, appended chronologically

Controller accepted A-6/A-7/A-18/A-13/C-6/B-9/A-22 as matching their ledger fixes
and B-1's partial as disclosed. Findings from the live `verify:ds` + review pass:

- **IMPORTANT 1** (context-menu Cut bypassed lock) — `fixed 4b17a0843`
- **IMPORTANT 2** (keyboard nudge ignored lock) — `fixed edac7de72`
- **IMPORTANT 3** (useLayerActions rescanned/replaced the Set on every element
  update, not just lock changes) — `fixed 89a2ef4ca`
- **MINOR 4** (LOCKED_ELEMENTS_SKIPPED had no listener) — `fixed 35edcda4d`
- **MINOR 6** (drain orphaned LayoutRequest/CodeRequest/BatchRequest/BatchResult) —
  `fixed 0001eace0`
- **Deferred** (duplicated prevDrawerTabRef, StudioPanels vs useStudioState) — not
  touched, per the controller's message.
- **Self-found during round-1 retest**: `pnpm run verify:ds`, launched before the
  round-1 message arrived, finished mid-round-1 and surfaced a real
  `gate:chrome-ui-surface` FAIL from the A-13 commit (deleted
  `chrome-ui/CommandPalette.tsx` without updating
  `scripts/gates/chrome-ui-surface.manifest.json`) — fixed in the same commit as
  MINOR 6 (`0001eace0`), re-verified with the standalone gate script per the
  resource rule (not a full verify:ds re-run).

Resource rule applied from the point it arrived: `--maxWorkers=2` on every vitest
run below, touched-files-only runs (no full-suite reruns), tsc run once at the end
of round 1 (`0001eace0`'s `0 errors`) rather than after every commit.

## A-6 — full-page surface owns keys — `fixed 117aa7c10`
`data-bk-surface="fullpage"` added to the three `FullPageRouter` hosts (tpl-host,
mgr-host, set-host). `CommandCenter.shouldHandleShortcut` refuses every command
except `save` while one is mounted (DOM query, no editor/ import, same pattern as
the existing modal carve-out). `StudioPanels` clears the canvas selection on entering
full-page mode. `LibraryManager`'s own Escape handler now stands down for a text
field.
- Tests: `CommandCenter.test.ts` (surface guard, ⌘S still saves, typing still works
  inside the surface — Plan Review Focus item 5), `LibraryManager.test.tsx` (Escape
  in the search field vs. outside it).
- NOT verified in the running app (browser-only `runtime_check` steps): the actual
  DOM click-through on `/edit/:id` with the asset library / Settings open.

## A-5 — lock and instance rules — `fixed 3c93aeaaf`
`defaultCommands.ts` delete/cut filter through `dropLockedAndInstances`
(`el.isLocked()` / `el.isComponentInstance()`, read off the element — SSOT) after
`topMost` pruning, so a locked container protects its own selected children.
`LOCKED_ELEMENTS_SKIPPED` event added and emitted when anything is filtered.
`editActions.ts` Cut now writes `composer.clipboard` like Copy.
`useLayerActions.toggleLock` reads the element's own lock instead of the panel's
tracking set, and a new `ELEMENT_UPDATED` listener resyncs `lockedIds`.
`findValidDropTarget` refuses a component instance (or anything nested in one) as a
drop target.
- Tests: `defaultCommands.test.ts`, `editActions.test.ts`, `useLayerActions.elementData.test.tsx`,
  new `dropTarget.instance.test.ts`.
- NOT verified in the running app: the live `?data-buildrick-id` count before/after
  probe from the ledger's `runtime_check`.
- **Round 1 follow-ups** (controller caught these gaps in the original A-5 pass):
  - IMPORTANT 1 — `editActions.ts`'s context-menu Cut called
    `composer.elements.removeElement` directly, never reaching the lock/instance
    filter at all. Routed through `commands.run("cut")` (same as Delete's row).
    `fixed 4b17a0843`, test in `editActions.test.ts`.
  - IMPORTANT 2 — `nudgeSelected` (arrow-key move) had no lock/instance check
    either. `dropLockedAndInstances` moved from `defaultCommands.ts` into
    `commandOperations.ts` (exported) to avoid a circular import
    (`defaultCommands.ts` imports `nudgeSelected` FROM `commandOperations.ts`);
    `nudgeSelected` now checks the single selected element and emits
    `LOCKED_ELEMENTS_SKIPPED`. `fixed edac7de72`, 3 new tests in
    `commandOperations.test.ts`.
  - IMPORTANT 3 — the `useLayerActions` `ELEMENT_UPDATED` resync rebuilt
    `lockedIds` from a full rescan on EVERY element mutation (style edits
    included), replacing the Set's identity even when the updated element's
    lock state hadn't changed. Now reads only the updated element's own
    `isLocked()` and returns the SAME Set (`prev`) when nothing about its
    membership needs to change. `fixed 89a2ef4ca`, 2 new tests asserting Set
    identity is preserved.
  - MINOR 4 — `LOCKED_ELEMENTS_SKIPPED` had no listener anywhere. Wired into
    `useClipboardToasts` (already the shell's home for copy/cut/paste/duplicate
    toasts, already subscribed to `addToast` in `StudioPanels`): "Locked
    elements were skipped". `fixed 35edcda4d`, test in
    `useClipboardToasts.test.tsx`.

## B-1 — shell dirty set — `partial 3dcb28707`
`guardNavigation` and the `beforeunload` handler in `StudioHeader.tsx` now also
check `brandDirty` (declaration moved above both so they can read it) — a staged
Brand edit with a clean project now opens the exit dialog and prompts on reload.
- Tests: two new `StudioHeader.test.tsx` cases (exit dialog on staged Brand edit;
  beforeunload prompts on the same).
- NOT done: a shell-owned dirty set spanning settings/brand/cms-record read by
  *every* tab-switch path (⌘H, the palette, `ui:switch-tab`, `openLeftPanelToTab`)
  — only Settings' own `safeTabChange` guards tab switches today, and CMS record
  drafts remain unguarded. This is materially larger than the must-have test
  (brand exit dialog + beforeunload) required; a real attempt risked a half-wired,
  under-tested refactor of the tab-switch plumbing given the remaining budget.
  Flagging for a follow-up pass. PD-11 (Brand autosave) was correctly left alone —
  not needed for this subset.
- NOT verified in the running app: the full `runtime_check` walk (Brand → colour
  edit → ‹ Exit → dialog; reload → native prompt; Settings › SEO → ⌘H → prompt,
  not silent switch — the ⌘H prompt part is the NOT-done piece above).

## A-7 — consume-once deep links / drawer-only persistence / exporter command — `fixed 5894132a5`
`openLeftPanelToTab` clears a primary tab's stale sub-tab when called without one
(consume-once). `leftPanelSubTabs` no longer persisted at all. `leftPanelTab`
persisted as the last DRAWER tab (via a `prevDrawerTabRef`, `getTabMode` check) —
a full-page tab is a destination, not a state to reopen into.
`StudioPanels.handleFullPageClose` restores that same prev-drawer-tab (its own
mirrored ref) instead of hard-coding `"add"`. `⌘K` "Open export settings" now
emits `UI_OPEN_EXPORTER` directly instead of `UI_PANEL_OPEN` (which landed on the
Settings overview since "export" is a door, not a screen).
- Tests: `useStudioState.test.ts:74` updated exactly as the ledger's pinning note
  named, plus 3 new cases (subTabs not persisted, drawer-only persistence,
  consume-once clears the same tab's stale subTab / leaves another tab's alone).
  `defaultCommands.test.ts` new case for `open-export-settings`.
- NOT verified in the running app: the full deep-link walk (Site menu › Published,
  Version history, Settings reload, Settings→Pages→Back, ⌘K → Open export settings).

## A-18 — time-travel blocks live input — `fixed 64763fc59`
`tt-preview` overlay drops `pointer-events-none` (its sandboxed iframe absorbs
clicks). `composer.readOnly` is set true while `active`, restored to whatever it
was before on exit (not hard-set false) — `exit()` runs first inside `restore()`,
so the restore always lands before the actual history write.
CommandCenter's existing `MUTATING_COMMANDS` gate covers Delete/⌘Z/etc. for free.
- Tests: `TimeTravelHost.test.tsx` — readOnly flips on open/exit, a pre-existing
  readOnly composer (view mode) is left alone, no `pointer-events-none` on the
  preview.
- NOT verified in the running app: the live 3-edit / ⌃⇧T / step-back / click+Delete
  walk from the ledger.

## A-13 — delete unused chrome-ui palette + shared Kbd — `fixed 6fb1bb637`
Deleted `chrome-ui/CommandPalette.tsx`, its test, and the barrel export — zero
importers outside its own test (confirmed by grep). Left the shell palette's local
`Kbd` as-is: its border/background tokens (`--bk-border`/`--bk-bg-subtle`) differ
from chrome-ui `Kbd`'s (`--bk-gray-200`/`--bk-gray-100`), so swapping would be a
visual change, not the pure dedup the h-5/11px geometry match suggested — noted in
the commit rather than swapped blind.
- Tests: full `chrome-ui/__tests__` + `shell/modals/__tests__/CommandPalette.test.tsx`
  (318 tests).
- NOT done (optional per ledger): adding a "Save page as template…" row to Pages.
- **Round 1 self-found gap**: this commit deleted the barrel export but not the
  matching row in `scripts/gates/chrome-ui-surface.manifest.json` — a live
  `pnpm run verify:ds` run (launched before round 1, finished mid-round-1)
  caught `gate:chrome-ui-surface` FAILing on 3 stale manifest entries (`Command`,
  `CommandPalette`, `CommandPaletteProps`). `fixed 0001eace0`, re-verified with
  `node scripts/check-chrome-ui-surface.mjs` standalone (PASS, 206 names).

## A-14 — ⌘J forces inspector open / dead AI client paths — `fixed f9e3d6da3` + `a5a3fff14`
`StudioPanels`' `ui:switch-tab "ai"` handler now also calls `setInspectorShown(true)`
and persists `buildrick-inspector-shown`, so ⌘J with a previously-collapsed
inspector shows AITab instead of mounting it into a zero-width column.
Deleted dead code: `shared/utils/openai.ts`'s unexported (zero-caller)
`generateLayout`/`generateCode`/`improveContent`, and
`AiTrpcClient.generateLayout` (only the deleted wrapper and its own test called it).
- Tests: `AiTrpcClient.test.ts` updated (mock wiring for the deleted mutation
  removed). `StudioPanels.openRequests.test.ts` gained a source-text-assertion
  case (this file has no render-level suite — StudioPanels needs too many
  providers to mount cheaply, and the file already pins other handler bodies the
  same way).
- NOT done, cross-lane: `server/trpc/routers/ai.ts`'s `ai.layout`/`ai.page`
  procedures are now true orphans (grep confirmed no dashboard/onboarding caller
  either). `server/` is outside this lane's ownership — flagged for
  `check-trpc-orphans.mjs` / the owning lane rather than deleted unverified.
- NOT verified in the running app: the ⌘J-with-collapsed-inspector width
  measurement (`getComputedStyle`), and `node packages/dashboard/scripts/check-trpc-orphans.mjs`.
- **Round 1 MINOR 6**: `LayoutRequest`/`CodeRequest` (only used by the
  `generateLayout`/`generateCode` functions this ID already deleted) and
  `BatchRequest`/`BatchResult` (zero readers anywhere) drained from
  `shared/utils/openai.ts` + the barrel re-export in `shared/utils/index.ts`.
  `fixed 0001eace0`.

## C-6 (editor half) — `fixed 446a2fc0c` (export command folded into A-7's commit)
Per PD-38, ⌘K "Clear history" is kept, not removed, but is now a real op behind a
confirm: `window.confirm` (no new dialog plumbing needed inside the palette for one
row) then `composer.history.clear()`, still emitting `HISTORY_CLEARED` for existing
listeners (e.g. TimeTravelHost's stack-changed guard). "Open export settings" fix
is the A-7 commit (same root cause, same file).
- Tests: two new `CommandPalette.test.tsx` cases (Cancel does nothing; confirm
  clears the stack).
- NOT done, cross-lane / out of scope for this ID: A14-6 (dashboard redirects
  copy), A14-9 (`gate:baked-flags` CI wiring), A14-17 (STORAGE_ERROR/COMMAND_ERROR
  toast listener) — these are dashboard/.github/CI files outside this lane's
  ownership and not in the L4a brief's must-have list for C-6 (only the two rows
  above were named).

## B-9 — Layers roving tabindex / rail tabIndex / checkboxes — `fixed d014ce53b`
Layers: `tabIndex={isSelected || (nothing selected && first visible) ? 0 : -1}`;
ArrowUp/Down now also moves DOM focus (`[data-testid="layer-row-<id>"]`) since the
handler only ever fires from a keydown already inside the tree (risk_notes'
"only when activeElement is already inside the tree" concern satisfied by
construction, not by an extra check). Rail: `tabIndex={isSelectedTab ? 0 : -1}` on
each tab button (arrow-key nav already existed); tabpanel gets
`aria-labelledby` → the active tab's new `id`. AssetGrid list view: both
`role="checkbox"` spans get `tabIndex={0}` + Space/Enter handlers mirroring their
onClick. PageRow: the bulk-select icon gets `role="checkbox"`/`aria-checked` when
wired — NOT made independently focusable, since it sits inside a row that is
already the focusable, Space-handling widget (nested interactive would be an
anti-pattern); its keyboard path already worked through the row.
- Tests: new `LayerTreeItem.roving.test.tsx`, `LeftSidebarRailClick.test.tsx`
  (2 new cases), `AssetGrid.test.tsx` (2 new cases), `PageRow.aria.test.tsx`
  (2 new cases).
- NOT done: canvas sibling traversal / "Comment on selected element" — explicitly
  deferred to PD-29 per the ledger, not decision-free.
- NOT verified in the running app: the live Tab/Arrow walk on `/edit/:id`.

## A-22 — dead code + single getSiteIdFromUrl — `fixed acb7681bd` + `864769952`
`ReviewService.currentSiteId` deleted (byte-for-byte duplicate of
`BuildrikSyncProvider.getSiteIdFromUrl` minus its decode try/catch); all ~10
importers repointed (componentSync, cmsSync, NotificationService, RoleService,
versionSync, templateSync, SettingsTab, useVersionSync, useComponentSync,
CommentLayer). Deleted zero-importer files verified by full-repo grep:
`useDeviceZoom.ts`, `useSaveState.ts`, `sidebar/tabs/media/data/mediaData.ts`.
Removed the dead `isFullPageMode` prop from `StudioPanels`. Follow-up commit
converts the touched-line imports from `../../../` to `@/` (root CLAUDE.md bans
`../../`) — not a wholesale pass over every pre-existing instance in those files.
- Tests: full re-run of every touched service/hook/component test file (all
  green; one `ReviewTab.banner.test.tsx` timeout under parallel load, confirmed
  a pre-existing flake by re-running it alone — passed).
- `npx tsc --noEmit -p packages/editor`: **0 errors**, both after the A-22 change
  set and again after the alias fixup commit.
- NOT done, cross-lane / cross-package: the five zero-importer dashboard
  components (`packages/dashboard/components/{billing/limit-reached,
  comments/comment-preview,dashboard/recent-sites,dashboard/workspace-health,
  help/contextual-help}.tsx`) — `packages/dashboard` is outside this lane's file
  ownership. `BrandWorkspace`'s second `useDSLint` mount (A02-20) — the ledger's
  own decision-free fix is conditional ("only if DSLintRunner publishes it;
  otherwise skip") and needs reading DSLintRunner's internals to answer; deferred
  rather than guessed. `FEATURE_KEYS`' `client_mode` entry
  (`packages/shared/schemas/feature-flags.ts`) — cross-package, and the ledger
  itself marks this "optional".

## Cross-lane edits (smallest edit only, named here per lane-common)
- `packages/shared/utils/openai.ts`, `packages/editor/src/services/ai/AiTrpcClient.ts`
  (+ its test) — not in L4a's declared file list but explicitly named in the A-14
  fix row ("delete dead AI client paths"); deleted only truly dead (zero-caller)
  code, verified by grep before deleting.
- `packages/editor/src/services/ReviewService.ts`, `RoleService.ts`,
  `NotificationService.ts`, `componentSync.ts`, `cmsSync.ts`, `versionSync.ts`,
  `templateSync.ts`, `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`,
  `packages/editor/src/editor/canvas/comments/CommentLayer.tsx` — required by A-22's
  "repoint its ~10 importers" instruction; every change is the same one-line
  import + call-site swap (`currentSiteId()` → `getSiteIdFromUrl()`).
- `packages/editor/e2e/boot-clean.spec.ts` — comment-only edit, required by A-22's
  own instruction ("edit the boot-clean.spec.ts comment").

## Real bugs found outside this lane's scope (not fixed)
- The C-6 ledger entry's A14-6 (dashboard redirects-tab copy is stale relative to
  what the publish worker actually does), A14-9 (`gate:baked-flags` never wired
  into CI) and A14-17 (no toast listener for STORAGE_ERROR/COMMAND_ERROR) remain
  open — dashboard/.github files, not named in this lane's must-have list.
- `server/trpc/routers/ai.ts`'s `ai.layout`/`ai.page` procedures are now
  confirmed orphans after the A-14 client-side deletion (see above).

## Verification summary
- `npx vitest run` (round 1 on: `--maxWorkers=2`, touched files only) over every
  test file touched, both before and during round 1: all green (one confirmed
  parallel-run-only flake in `ReviewTab.banner.test.tsx` and two more in
  `SiteMenu.kbd.test.tsx` / `StudioHeader.test.tsx`'s Unpublish-gating case —
  all three pass in isolation with the default timeout; none touch files this
  lane changed).
- `npx tsc --noEmit -p packages/editor`: 0 errors — confirmed after the A-22
  change set, again after the alias-fixup commit (864769952), and a final time
  after round 1's last commit (0001eace0) — that last run is the "once at the
  end" run per the controller's resource-rule message; no tsc run after any
  individual round-1 commit before that.
- `pnpm run verify:ds` — the ONE full run of this lane (launched before the
  resource-rule message arrived, finished mid-round-1) surfaced a real
  `gate:chrome-ui-surface` FAIL, fixed in `0001eace0` and re-verified with the
  standalone `node scripts/check-chrome-ui-surface.mjs` (not a full verify:ds
  re-run, per the resource rule). That one run's log shows every OTHER gate in
  the chain passing up to the point it stopped (`[tsc gate]`, `[anchors]`,
  `[boards]`, `[hex-drift]`, `[copy]`, `gate:tokens-generated`,
  `gate:vibcoder-ratchet`, `gate:editor-ui-gone`) — the chain uses `&&`, so
  `gate:styling-ratchet`, `gate:buildrick`, `gate:design-debt-ratchet` and
  `gate:narrow-control-padding` never ran in that log and were not re-run
  standalone after the fix (resource rule). Flagging those four for the
  controller to confirm on the final tree.
- Browser-driven `runtime_check` steps from the ledger (listed per-ID above as
  "NOT verified in the running app") were not run — this lane has no browser
  access; per lane-common these are Phase 2, the controller's.
