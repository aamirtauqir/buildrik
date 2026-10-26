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

## Open — lane L-F (2026-10-26)

10. **L-F S1 · AquibraStudio.tsx `resendReview` (:519)** · replace its body with `sendReviewRound(composer, { email: clientEmail }, { preview: options?.preview ?? true })` from `shell/reviewSend.ts`, taking `(clientEmail?, options?: { preview: boolean })`; widen `TabRouter.onResendReview` to the same signature · Play F5.04 `307:16107` · a failed render must throw `ReviewPreviewError` so ReviewTab asks "Try again / Send without preview"; today the panel re-send still sends with no preview, unasked.
11. **L-F S2 · AquibraStudio.tsx (banner slot mount)** · supersedes #4's placement note: `LoadErrorBanner` now IS the global banner slot (`GlobalBannerSlot`, led by the load failure). Mount it in the 40 px slot under `<header>` (board B7-G02 / B7-G31, y = 56), not above it · boards 225:2821, 227:14297 · placement only; the slot already renders at today's mount.
12. **L-F S2 · shell/hooks/useComposerInit.ts (autosave network branch, :~850) and useSaveCallback.ts (manual network branch)** · online + transport failure → `showCantReachBanner(retryNow)` instead of the "Couldn't reach the server — not saved" toast; offline → no toast (the slot raises B7-G11 itself from `online`/`offline`); each scheduled retry → `showReconnectingBanner(pendingCount?)`; a save that lands → `clearGlobalBanner(BANNER_ID.connection)` · boards 225:8126, 225:8654, 225:7600 · the board puts these conditions in the one slot, not in toasts that the next toast replaces.
13. **L-F S2 · shell/hooks/useOtherTabNotice.ts:33** · replace the persistent `addToast` with `showOtherTabBanner()` (the hook then needs no `addToast`) · board 227:12711 · banner, not toast; "Edit here" waits on the tab handoff (G29/G30).
14. **L-F S2 · useSaveCallback.ts:105 + useComposerInit.ts:325-332 (role refused / view-mode toasts)** · `showRoleChangedBanner({ download: () => downloadProject(composer.exportProject(), "unsaved"), askAdmin: () => composer.emit(EVENTS.UI_OPEN_PERMISSIONS) })` instead of the toasts · board 227:7411 · banner with the board's two actions.
15. **L-F S2 · useComposerInit.ts (after the composer is created)** · `registerWorkSnapshot(() => instance.exportProject())`, unregistered on teardown; and AquibraStudio's `onSaveBackup` download (:~818) → `downloadProject(composer.exportProject(), "backup")` · — · every "Download a copy" on page 07 (G02, G18, G22, G14, G26) reads it; without it they fall back to the kept unsaved copy or show no button. Removes the inline duplicate download code.
16. **L-F S3 · useComposerInit.ts:363-400 (kept-work toast) + AquibraStudio.tsx:662 (RecoveryBanner mount) + CompareHost** · (a) replace the "Some work never reached the server" toast with `setKeptWorkOffer({ siteId, at: unsaved.at, project: unsaved.project, restore: <the toast action's body> })`, and `onOffScreenSettled(siteId, () => setKeptWorkOffer(null))` in place of the toast dismiss; (b) drop `pageCount` from the RecoveryBanner mount (the board names no scope); (c) a kept-copy source for the shared Compare so G08/G09 can offer "Compare" · boards 225:5474, 225:6003, 225:6532 · one recovery surface instead of a banner and a toast with different words.
