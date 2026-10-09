# Large-file split plan (DQ-007) — 2026-10-09

Audit item DQ-007 (docs/audits/2026-10-08-editor-full-audit, phase2-live/DQ.md):
26 non-test source files in `packages/editor/src` are over 800 lines.

## What is in place

- `gate:file-size` (`packages/editor/scripts/check-file-size.mjs`, in
  `verify:ds`) lists today's set in `scripts/baselines/file-size.json`. A file
  not on the list that crosses 800 lines fails; so does a higher count. When a
  listed file drops to 800 or fewer, run `--update` in the same commit.
- The three largest were split along seams that need no behaviour change
  (lane DQ-CODE, branch `fix/audit-dq-code`):
  - `engine/media/MediaManager.ts` → server-row metadata mapping moved to
    `engine/media/serverAssetMetadata.ts`.
  - `engine/export/ExportEngine.ts` → page publishing facts (`isPageLive`,
    `resolveHomePageId`, `pageFileNames`) moved to `engine/export/pageFiles.ts`.
  - `engine/Composer.ts` → the `designSystem` facade contract moved to
    `engine/designSystem/facade.ts` (`DesignSystemFacade`).

  All three are still over 800 lines; the cuts below are what takes them under.

## Rule for every split

One commit per file. Move, don't rewrite: the moved code keeps its comments,
the callers are re-pointed (no re-export shims — root CLAUDE.md "no middle-man
files"), and the file's own tests move with the code they cover. A split is not
done until `tsc` (editor + dashboard), the file's suite and `verify:ds` are
green, and — for anything in `editor/` — the surface is walked live.

## The rest, in order

Order is by risk-adjusted payoff: cross-cutting shell files first (most merge
conflicts), then the bug-dense panels named by the other audit lanes.

| # | File | Lines | Cut |
|---|---|---|---|
| 1 | `editor/shell/StudioPanels.tsx` | 1040 | Right-column routing (inspector / issues / AI / column tabs) into `useRightColumn`; view-mode chrome (`readOnlyView`, `viewerChrome`, root classes) into `useViewModeChrome`. JSX stays. |
| 2 | `editor/shell/hooks/useComposerInit.ts` | 1001 | Three jobs: composer construction, engine→React event bridging, autosave/retry. Split into `useComposerInstance`, `useComposerEventBridge`, `useAutosave` (retry constants move with it). |
| 3 | `editor/design-system/ui/BrandWorkspace.tsx` | 1229 | Nav model (`NAV`, `MORE_KINDS`, `pageLabel`, `isPageId`) → `brandNav.ts`; per-page renderers → one file per page under `ui/pages/`; the ⋯ menu and popovers → `BrandMenus.tsx`. |
| 4 | `editor/sidebar/tabs/review/ReviewTab.tsx` | 1237 | Comment thread list, composer and resolve/reattach actions are three components; round state into `useReviewRound`. |
| 5 | `editor/sidebar/tabs/settings/SettingsTab.tsx` | 1178 | Nav (`NavRowIcon`, nav rows, plan locks) → `SettingsNav.tsx`; save/flush orchestration → `useSettingsSave`. |
| 6 | `editor/sidebar/tabs/publish/PublishTab.tsx` | 1142 | `EnvRow`, `CollapsibleTitle`, `SkeletonRows` → `PublishTabParts.tsx`; checks fetch + fix targets → `usePublishChecks`. |
| 7 | `editor/media/LibraryManager.tsx` | 1258 | Toolbar (search tags, type pills, sort) → `LibraryToolbar.tsx`; folder actions → `useLibraryFolders`. |
| 8 | `editor/shell/StudioHeader.tsx` | 1009 | Save pill + dirty-exit guard → `useExitGuard`; publish outcome flash → `PublishButton.tsx`. |
| 9 | `editor/shell/AquibraStudio.tsx` | 965 | Founder file — coordinate before touching. Modal host block → `StudioModals.tsx`. |
| 10 | `editor/canvas/Canvas.tsx` | 992 | Zoom/fit/selection-zoom handlers → `useCanvasZoom`. |
| 11 | `editor/media/components/AssetGrid.tsx` | 1062 | Row/tile renderers vs selection + keyboard → `useAssetGridSelection`. |
| 12 | `editor/sidebar/tabs/media/components/SlimLauncher.tsx` | 908 | Section components per destination. |
| 13 | `editor/media/components/AssetDetailsPanel.tsx` | 885 | Metadata form vs versions list. |
| 14 | `engine/media/MediaManager.ts` | ~1760 | Folders (create/rename/delete/ensureProjectFolder) and the upload pipeline (`uploadFile`, ~270 lines) each into a collaborator the manager owns and calls with its state — not a pass-through class: each owns its own logic. |
| 15 | `engine/export/ExportEngine.ts` | ~1340 | Multi-page publish (`exportAllPages` … `renderPageElement`, ~500 lines) → `PageSiteExporter`; single-file export stays. |
| 16 | `engine/Composer.ts` | ~1340 | Facade *implementation* (`designSystem` object, ~150 lines) → `createDesignSystemFacade(composer)` once `mergedDesignTokens` / `tokensRemovedInUse` are exposed on a narrow internal interface. |
| 17 | `engine/VersionTimelineManager.ts` | 1077 | Snapshot capture/compare vs storage/prune. |
| 18 | `services/BuildrikSyncProvider.ts` | 1050 | Save chain vs load/conflict vs settings mirror. |
| 19 | `services/cmsSync.ts` | 1021 | Outbox/retry vs classify/conflict. |
| 20 | `engine/HistoryManager.ts` | 894 | Coalescing vs snapshot restore. Live-verify undo (engine/AGENTS.md). |
| 21 | `engine/collaboration/CollaborationManager.ts` | 826 | Demo-only (engine/AGENTS.md) — split only with the collab arc. |
| 22 | `engine/styles/StyleEngine.ts` | 825 | Breakpoint styles vs CSS generation. |

Not code to split — data tables, accepted as long:
`shared/constants/events.ts` (1004), `shared/types/media.ts` (976),
`shared/constants/icons.ts` (957), `engine/designSystem/defaultTokens.ts` (866).
They stay on the baseline list; a reviewer should still refuse growth that is
logic rather than entries.

CSS over 800 lines (`LibraryManager.css`, `history.css`, `inspector.css`,
`Canvas.css`) is not covered by the gate; it drains with the Tailwind
migration (styling ratchet).
