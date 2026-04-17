# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0.0] - 2026-04-17

### Added
- Layers tab theme migration: dark chrome + cobalt accent per DESIGN.md — token-layer flip across 29 consumer files via --ls-* aliasing
- Sidebar chrome now fully dark: topbar, panels, inspector all use consistent --aqb-bg-panel surfaces
- Pages tab visual refresh: cobalt accents, dot chips, HOME pill badge, improved hover states

### Fixed
- WCAG AA compliance: selected layer row now uses white text on cobalt-tint bg (4.0:1 contrast, was 2.8:1)
- Indigo/violet hex values purged from shared/ui: Badge, SharedDialogs, defaultStyles, PanelHeader
- Dead legacy CSS deleted: components/Panels/LayersPanel/styles/layers.css (651 lines, zero imports)

### Changed
- --ls-* tokens now alias --aqb-*/--accent instead of hardcoded hex (single source of truth in themes/default.css)
- --accent canonical token added as alias for --aqb-primary cobalt

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
