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

## Open — lane L-C (resources), 2026-10-26

10. **L-C → lead · `sidebar/FullPageRouter.tsx:139`, `shell/StudioPanels.tsx` (`mediaFullPage`, :360/:447/:589/:788)** · mount `media/LibraryManager` as an in-place resource area over the canvas column (the CMS workspace's shape, StudioPanels.tsx:951), not the edge-to-edge portal; keep topbar, rail and the bottom bar's "‹ Back to Editor" · board 199:37199 (B6-A01) and every B6-A board · the boards keep the shell around Assets; the mount point is not in L-C's paths. L-C then restyles `LibraryManager`'s own top bar (drops "Asset library" / "‹ Back to canvas").
11. **L-C → L-B · `inspector/sections/CmsBindingSection.tsx:222`, `CollectionListSection.tsx:91`** · pass `origin` on the `UI_CMS_OPEN` request: `"<element label> · <property> binding"` (e.g. "Heading · Title binding") from Open record, `"<page> · <list label>"` from Open collection. `CmsOpenRequest.origin` is added by L-C (cmsWorkspaceStore.ts) · boards 173:16169, 173:17098, 189:28227, Play F2.06 · the record's back and its leave guard name the origin ("‹ Heading · Title binding", "Your destination is …").
12. **L-C → lead · `shell/StudioPanels.tsx:462` (`backToCanvas`)** · after restoring the selection, reopen the inspector on the binding the request came from (the Content property's binding subview once L-B builds it) instead of the bare canvas · Play F2.12 `302:16675` · the round trip ends on the same binding.
13. **L-C → L-B · Choose source picker, binding detail, binding summary** (Play F2.02 `302:12190`, F2.05 `302:13946`, F2.16 `302:18532`; boards B5-D02…D13) · build them in the Content tab's property row (OD-2) rather than Behaviour › CMS binding. Board copy: popover "Choose source · Search sources or fields… · RECORD DATA: This page's record · {Collection} (Each generated page shows its own record) · List item · Specific record · SITE & PAGE: Site, Page · LIVE SOURCES: Date / URL parameter / Cookie (Planned)"; subview "‹ Back to Content · {Property} binding · Source · Format As written · If empty · Open record › · Unbind — keep shown text"; summary "Dynamic bindings · N binding · {Property} · {Collection}.{field} ›". The surface is in L-B's path and moves with the Content tab, so L-C did not build it.
