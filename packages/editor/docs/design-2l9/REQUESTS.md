# Requests against lead-owned / founder files

Lanes and Phase-1 tasks record changes they need in files they may not edit.
Format: lane/task · file · change · board · why.

## Open — `packages/editor/src/editor/shell/AquibraStudio.tsx` (founder WIP, never staged by agents)

1. **Task 1.2 · AquibraStudio.tsx:727, useStudioState.ts:179-180,283, useComposerInit.ts:951-985, StudioPanels.tsx:83,227,928-929, Canvas.types.ts:42-44** · delete the `canUndo`/`canRedo` state, the seven-event effect that feeds it and the props it travels through · board 497:99433 (one undo) · the canvas footer undo is gone and the topbar reads `useHistoryState`; this plumbing now feeds nothing (dead code, Phase-1 exit review finding 4).
2. **Task 1.7 · AquibraStudio.tsx (publish confirm)** · remove the now-unreachable "Publish with N errors?" confirm and its issue-locating logic, which the tray duplicates; stop opening the old Publish panel after a confirmed publish · boards 499:2656, 233:2 · OD-1 makes blocking issues shut the CTA, so the confirm cannot be reached.
3. **Task 1.7 · AquibraStudio.tsx → StudioPanels** · pass the publish issues to StudioPanels directly instead of through `publishTrayStore` · — · only StudioHeader receives the issues today.
4. **Task 1.6 · AquibraStudio.tsx (banner slot)** · mount `LoadErrorBanner` in the slot under the topbar, not above the header · board B7-G02 · placement only.
5. **Task 1.2 · StudioHeader** · `onVercelPublish` prop is unused since the tray; drop it with its AquibraStudio caller.

## Open — server

6. **Task 1.6 · server** · send an `x-request-id` response header so "Copy details" and Sentry carry a real request id (today: "none sent").
7. **Task 1.8 · server `CmsEntry`** · add `publishedAt` so "Changed since publish" works for server-loaded records (owner decision pending; alternative: drop the warning tone).
8. **Safety · publish worker** · `PUBLISH_ALLOW_SIMULATION=true` does not prevent a real deploy when the workspace has an active Vercel connection; make the flag force simulation, or rename it so it does not read as a safety switch.

## Open — found on the live walk (2026-10-26)

9. **L-A · canvas footer status** · the selection readout double-escapes HTML entities ("Heading · Tom &amp;amp; Jerry" for "Tom & Jerry") · — · present on `main`, not caused by design-2l9.

## Open — lane L-E (2026-10-26)

10. **L-E · `sidebar/FullPageRouter.tsx:160` / `shell/StudioPanels.tsx`** · render Site settings inside the editor shell (Topbar 56, Rail, bottom bar "Editor keeps {page} open — return with ‹ Back to Editor") instead of a full-screen portal · boards B8-S01 238:9980, B8-S02 238:10283 and every page-06 settings board · SettingsTab already draws the board's nav, pane header ("‹ Back to Editor · {page}") and footer; only the host differs.
11. **L-E · `scripts/.ds-green-panels.json:85`** · drop `sidebar/tabs/settings/icons.tsx` from the list so the lane can delete the file (and its `export *` in `settings/index.ts`) · B8-S01 238:9980 draws text-only nav rows · `NAV_ICONS` has no consumer since the nav lost its glyphs (dead export, CLAUDE.md "No dead code").
12. **L-E · Inspector header / shell** · after Form submissions › "Configure in Inspector", show "‹ Back to submissions · {Form} / {View}" and return to the same Settings view · board GAP-FM11 272:28766 · the Inspector and shell are not lane-E paths.
13. **L-E · `shell/__tests__/StudioHeader.test.tsx:496`** · the viewer's publish refusal becomes "Publishing needs Editor access" (`lifecycle.ts` publishBlocker) — that test pins the old "Viewers can't publish — ask an editor" through the topbar tooltip, so the copy change waits on the lead's test file · board B8-PB19 233:10270 · lane E owns `lifecycle.ts`, not the StudioHeader test.
