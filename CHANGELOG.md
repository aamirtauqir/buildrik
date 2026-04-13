# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1.0] - 2026-04-13

### Added
- Templates tab: TemplateCard and TemplatePagination components plus pagination, sub-category, and Page/Section type filters in `useTemplateSelection`. Templates browser now opens cleanly with grid + paging (CAN-002).
- Sections mode in the Add tab: implemented `useSectionInsert` so clicking a section card inserts production HTML into the active page root inside a single history transaction (CAN-003).
- Settings → Export: shared screen-style module (`settings/styles/index.ts`) with `screenStyles`, `exportOptionsStyles`, `exportOptionStyles`, `activeExportOptionStyles`, `noteStyles`. Settings tab no longer crashes on open (CAN-004).
- Build tab Elements/Sections mode-switch hook fields (`mode`, `setMode`) wired to sessionStorage so the active mode survives sidebar re-opens.

### Fixed
- Editor failed to boot due to missing `PinPopover` import in `BuildTab.tsx`. Stripped the half-landed Quick Picks + Pin feature so the editor renders (CAN-001). Quick Picks can be rebuilt on its own branch when ready.
- Click-to-insert nested elements inside the wrong parent: clicking Heading then Button produced `div > h2 > span` ("HeadingClick Me" jammed on one line). `useBlockInsertion` now only auto-nests when the selection is a layout `CONTAINER`; otherwise inserts as a sibling. Matches click-to-stack UX without distorting HTML validation (CAN-005).
- Inspector showed stale element data after undo. `Composer.importProject` now clears selection before clearing elements, so the inspector's React state cascades to no-selection through the existing `selection:cleared` event (CAN-006).
- Test/implementation drift in two existing test files: `catalog.test.ts` expected 7 categories (catalog has 6), `SearchResults.test.tsx` referenced removed copy. Both updated to match current implementation.

### Tests
- 16 new tests covering `useBlockInsertion` smart-placement (4), `Composer.importProject` selection-clear ordering (2), `TemplateCard` (9 — existing spec), and refreshed `SearchResults` (4).
- Full editor suite now green: 405 passing, 0 failing.

## [0.2.0.0] - 2026-04-13

### Added
- Media tab is functional end-to-end: drag-drop, click-insert, search, maximize, and quick-upload all work from the slim launcher
- Drop images at the exact cursor position on the canvas — no more center-placed images
- Type-aware insert: fonts apply to selected text; images/video/icons/SVG/audio/lottie each create the right element
- Replace-across-canvas dialog surfaces partial failures with a "Retry failed" action (previously silent)
- Storage quota, invalid file, and no-active-page errors now show specific, actionable toasts instead of a generic error
- SVG uploads are sanitized on write — stored cross-site scripting via malicious SVG is blocked
- Usage counts in the library are memoized — library panels render instantly with large asset counts

### Fixed
- Media tab could not load at all: the `composer.mediaCommands` object was called from 8 sites but never defined. Created `MediaCommandLayer` to back those calls.
- Three UI components (`SlimLauncher`, `TypePills`, `MediaContextMenu`) were imported but never shipped — the module tree could not mount. Components added with the expected prop contracts.
- Blob URLs no longer leak across library mount cycles; ref-counted and revoked on delete

### Changed
- `composer.elements.insertMedia(src, type)` extended to `insertMediaAt(src, type, opts?)` with coordinates, a target-element hint, and a `font` type that applies to selected text. Original signature kept as an alias.

## [0.1.0.0] - 2026-04-08

### Added
- 3-zone left rail navigation (Creation, Structure, Config) with variable panel widths
- Full-page mode for Templates, Settings, History, and Design tabs
- Light theme sidebar with ls-* design tokens matching .pen design spec
- AI Suggestions card in the Add tab with dismiss and click actions
- Skeleton loading states for all 8 sidebar tabs
- 4 shared dialog components (UnsavedChanges, DeleteConfirm, RevertConfirm, AddPage)
- Template Apply state machine with confirm, progress, success, error, and retry states
- Layers context menu component
- Empty state components for 7 tabs with icons, messages, and action buttons
- Design System entry in Settings tab for accessing color/font/spacing tokens
- Dialog accessibility: role=dialog, aria-modal, focus trap, Escape-to-close
- 76 new unit tests across 6 test files (tabsConfig, panelStateMigration, usePanelState, useTemplateApply, SharedDialogs, AISuggestions)
- TODOS.md for tracking deferred work items
- Pixel-perfect topbar redesign with light theme, breadcrumbs, publish states
- Page wizard for first-time entry experience
- HTML export wiring and React exporter foundation

### Changed
- Redesigned topbar with tb-* light theme classes
- LayoutShell CSS grid now supports 4-column layout with drawer overlay mode
- Tab configuration is now the single source of truth (tabsConfig.ts)
- Panel state management moved to usePanelState hook with localStorage persistence

### Fixed
- Panel state migration now maps to valid GroupedTabId values (was producing phantom IDs)
- useStudioState defaults use current tab IDs instead of legacy 'build'/'structure'/'content'
- Template apply timeout prevents infinite spinner (15s auto-fail)
- Template apply re-entry guard prevents double-apply confusion
- completeApply setTimeout cleanup on unmount prevents stale setState calls
- AddPageDialog resets name/slug state when reopened after cancel
- Removed dead tabConfig variable from FullPageView
- Separated fullpage tab props from panel tab props (no fake isPinned in fullpage mode)

### Removed
- Legacy LeftRail files and re-exports
- Unused OnboardingProgress and TourOverlay imports
