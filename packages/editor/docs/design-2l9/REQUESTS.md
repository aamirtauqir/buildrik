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

## Open — lane L-A (2026-10-26)

10. **L-A · `shell/hooks/useBlockInsertion.ts:81-140`** · replace the inline smart-placement walk with `resolveInsertTarget(composer, def.elementType)` from `sidebar/tabs/build/insertTarget.ts` (same rules: selected container → end; text leaf → after it; Section's lone container slot; walk up; page root) · board 7:18981 · the Add panel's "Insert into Hero · At end" strip reads that resolver; until the hook calls it too there are two copies of one rule.
11. **L-A · `shell/hooks/useBlockInsertion.ts` (insert toast)** · receipt copy "{Element} added to {Parent}" with the second line "Selected on canvas · Focus stays here" (and keep Undo) · boards 7:19448, 302:4542, 10:3787 · the receipt is raised in the lead-owned hook; the panel cannot set it.

## Closed

9. ~~**L-A · canvas footer status** · the selection readout double-escapes HTML entities~~ · fixed in lane L-A: `getLayerPreview` (`panels/layers/data/layerUtils.ts`) decodes the stored HTML's entities once, so the footer readout and Layers row names print "Tom & Jerry". Test `layerUtils.test.ts › getLayerPreview`.
