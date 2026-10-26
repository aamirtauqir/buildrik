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

## Open — lane L-D (Brand)

10. **L-D → lead · `sidebar/FullPageRouter.tsx:186-200`** · mount Brand in the resource area (topbar, rail and bottom bar stay; board B6-B01 boxes Topbar 0–56 · Workspace 56–868 · BottomBar 868–900) instead of the `fixed inset-0` portal, and render Brand's loading / failed-to-load / offline-first-load states there (B6-B42 skeleton, B6-B56 "Couldn’t load Brand · Something went wrong on our side. Your site and its colors are not affected. · Retry", B6-B57 "You’re offline · Brand needs a connection to load the first time. Reconnect and try again. · Retry") · 203:33565, 212:37895, 219:42151, 219:42387 · Brand's own nav has "‹ Back to Editor · {page}" now; the shell should show around it, and the lazy mount is where those states live.
11. **L-D → L-E · `sidebar/tabs/settings/SettingsTab.tsx:378`** · in `performNav("branding")`, call `requestBrandReturn(composer, { screen: currentScreen })` (`@/editor/design-system/ui/brandOpenRequest`) before `onOpenDesignTab?.()` · GAP-ST-T03 277:27516, T04 277:107722, T05 277:107940, LB 278:67847 · Brand then labels its door "‹ Back to Site settings" and returns to that screen via `UI_PANEL_OPEN {panel:"settings", screen}`. The boards also draw `Undo | Redo` in Brand's header; not adopted (one undo, topbar only).
12. **L-D → lead · `src/shared/constants/brandReadOnly.ts:9`** (outside `design-system/`) · change the `held` copy to the board's "Brand update is on hold. Your site keeps its current look. Editing resumes when the update finishes. This is not about your access." · B6-B46 212:38857 · the current "This site's brand was rolled back — editing is paused." reads as a permission problem; the board says it is not. Brand renders whatever this constant says.
