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

12. **L-A · shell overlay state (`useStudioState` / `StudioPanels` → `Canvas` `overlays`)** · add two canvas view preferences, "Show outlines" (element outlines without X-Ray's wireframe) and "Focus mode" (board meaning to confirm: hide the side panels), and pass them to `CanvasFooterToolbar` · board 145:64586 · the View menu draws both rows; the overlay state lives in lead-owned shell hooks, so the lane cannot add them.

13. **L-A · engine `PageManager.reorderPage` (and the personal-folder store)** · record a page reorder as one composer history step, so ⌘Z undoes it and the receipt can carry Undo; decide whether folder moves (per-user, outside the document) get an Undo at all · boards 137:53911, 137:59625, 127:38819, 131:41086 · the boards' receipts end in "Undo"; today reorder emits PROJECT_CHANGED with no history entry, and a panel-local undo would break the one-undo rule, so L-A ships the receipts without it.

## Closed

9. ~~**L-A · canvas footer status** · the selection readout double-escapes HTML entities~~ · fixed in lane L-A: `getLayerPreview` (`panels/layers/data/layerUtils.ts`) decodes the stored HTML's entities once, so the footer readout and Layers row names print "Tom & Jerry". Test `layerUtils.test.ts › getLayerPreview`.
9. **L-A · canvas footer status** · the selection readout double-escapes HTML entities ("Heading · Tom &amp;amp; Jerry" for "Tom & Jerry") · — · present on `main`, not caused by design-2l9.

## Open — lane L-B (Inspector)

10. **L-B · `inspector/components/InspectorHeader.tsx`** · the context line follows the active tab: Content → "Content · All breakpoints", Behavior → "Behavior · {type}", Style / Effects keep "Editing {breakpoint} · {state}" (the state Select only on those two). Needs an `activeTab` prop (ProInspector passes it; L-B adds the prop at the call site when the header accepts it) · boards 161:8480, 161:13919, 36:2 · content and behaviour writes are breakpoint- and state-independent, so the state Select on those tabs misleads.
11. **L-B · `src/engine/` (element conditions)** · an element-level conditions model (show/hide by a record field, "both must pass" with device visibility) persisted on the element and honoured by the export runtime, so Content › Conditions can exist · boards D04–D10 (`255:94411`…), the Conditions row of every Content board · there is no conditions data today; the Inspector draws no Conditions row until there is (no placeholder rows).
12. **L-B · `src/engine/components/ComponentInstances.ts` (`detachInstance`)** · record the detach on the document history (instance map entry + `componentInstance` data restored on undo), so Detach can apply directly with a "{name} detached · Undo" receipt · board 241:19230 (IC06) · today detach drops the instance link outside history, so the Inspector keeps the confirm dialog (`code:detach-not-undoable`).
## Open — lane L-D (Brand)

10. **L-D → lead · `sidebar/FullPageRouter.tsx:186-200`** · mount Brand in the resource area (topbar, rail and bottom bar stay; board B6-B01 boxes Topbar 0–56 · Workspace 56–868 · BottomBar 868–900) instead of the `fixed inset-0` portal, and render Brand's loading / failed-to-load / offline-first-load states there (B6-B42 skeleton, B6-B56 "Couldn’t load Brand · Something went wrong on our side. Your site and its colors are not affected. · Retry", B6-B57 "You’re offline · Brand needs a connection to load the first time. Reconnect and try again. · Retry") · 203:33565, 212:37895, 219:42151, 219:42387 · Brand's own nav has "‹ Back to Editor · {page}" now; the shell should show around it, and the lazy mount is where those states live.
11. **L-D → L-E · `sidebar/tabs/settings/SettingsTab.tsx:378`** · in `performNav("branding")`, call `requestBrandReturn(composer, { screen: currentScreen })` (`@/editor/design-system/ui/brandOpenRequest`) before `onOpenDesignTab?.()` · GAP-ST-T03 277:27516, T04 277:107722, T05 277:107940, LB 278:67847 · Brand then labels its door "‹ Back to Site settings" and returns to that screen via `UI_PANEL_OPEN {panel:"settings", screen}`. The boards also draw `Undo | Redo` in Brand's header; not adopted (one undo, topbar only).
12. **L-D → lead · `src/shared/constants/brandReadOnly.ts:9`** (outside `design-system/`) · change the `held` copy to the board's "Brand update is on hold. Your site keeps its current look. Editing resumes when the update finishes. This is not about your access." · B6-B46 212:38857 · the current "This site's brand was rolled back — editing is paused." reads as a permission problem; the board says it is not. Brand renders whatever this constant says.
## Open — lane L-C (resources), 2026-10-26

10. **L-C → lead · `sidebar/FullPageRouter.tsx:139`, `shell/StudioPanels.tsx` (`mediaFullPage`, :360/:447/:589/:788)** · mount `media/LibraryManager` as an in-place resource area over the canvas column (the CMS workspace's shape, StudioPanels.tsx:951), not the edge-to-edge portal; keep topbar, rail and the bottom bar's "‹ Back to Editor" · board 199:37199 (B6-A01) and every B6-A board · the boards keep the shell around Assets; the mount point is not in L-C's paths. L-C then restyles `LibraryManager`'s own top bar (drops "Asset library" / "‹ Back to canvas").
11. **L-C → L-B · `inspector/sections/CmsBindingSection.tsx:222`, `CollectionListSection.tsx:91`** · pass `origin` on the `UI_CMS_OPEN` request: `"<element label> · <property> binding"` (e.g. "Heading · Title binding") from Open record, `"<page> · <list label>"` from Open collection. `CmsOpenRequest.origin` is added by L-C (cmsWorkspaceStore.ts) · boards 173:16169, 173:17098, 189:28227, Play F2.06 · the record's back and its leave guard name the origin ("‹ Heading · Title binding", "Your destination is …").
12. **L-C → lead · `shell/StudioPanels.tsx:462` (`backToCanvas`)** · after restoring the selection, reopen the inspector on the binding the request came from (the Content property's binding subview once L-B builds it) instead of the bare canvas · Play F2.12 `302:16675` · the round trip ends on the same binding.
13. **L-C → L-B · Choose source picker, binding detail, binding summary** (Play F2.02 `302:12190`, F2.05 `302:13946`, F2.16 `302:18532`; boards B5-D02…D13) · build them in the Content tab's property row (OD-2) rather than Behaviour › CMS binding. Board copy: popover "Choose source · Search sources or fields… · RECORD DATA: This page's record · {Collection} (Each generated page shows its own record) · List item · Specific record · SITE & PAGE: Site, Page · LIVE SOURCES: Date / URL parameter / Cookie (Planned)"; subview "‹ Back to Content · {Property} binding · Source · Format As written · If empty · Open record › · Unbind — keep shown text"; summary "Dynamic bindings · N binding · {Property} · {Collection}.{field} ›". The surface is in L-B's path and moves with the Content tab, so L-C did not build it.
## Open — lane L-E (2026-10-26)

10. **L-E · `sidebar/FullPageRouter.tsx:160` / `shell/StudioPanels.tsx`** · render Site settings inside the editor shell (Topbar 56, Rail, bottom bar "Editor keeps {page} open — return with ‹ Back to Editor") instead of a full-screen portal · boards B8-S01 238:9980, B8-S02 238:10283 and every page-06 settings board · SettingsTab already draws the board's nav, pane header ("‹ Back to Editor · {page}") and footer; only the host differs.
11. **L-E · `scripts/.ds-green-panels.json:85`** · drop `sidebar/tabs/settings/icons.tsx` from the list so the lane can delete the file (and its `export *` in `settings/index.ts`) · B8-S01 238:9980 draws text-only nav rows · `NAV_ICONS` has no consumer since the nav lost its glyphs (dead export, CLAUDE.md "No dead code").
12. **L-E · Inspector header / shell** · after Form submissions › "Configure in Inspector", show "‹ Back to submissions · {Form} / {View}" and return to the same Settings view · board GAP-FM11 272:28766 · the Inspector and shell are not lane-E paths.
13. **L-E · `shell/__tests__/StudioHeader.test.tsx:496`** · the viewer's publish refusal becomes "Publishing needs Editor access" (`lifecycle.ts` publishBlocker) — that test pins the old "Viewers can't publish — ask an editor" through the topbar tooltip, so the copy change waits on the lead's test file · board B8-PB19 233:10270 · lane E owns `lifecycle.ts`, not the StudioHeader test.
