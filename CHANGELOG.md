# Changelog

All notable changes to this project will be documented in this file.

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
