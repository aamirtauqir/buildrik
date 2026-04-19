# Changelog

All notable changes to this project will be documented in this file.

## Buildrik DS V1 — 2026-04-19

Supersedes Theme Unification V3 (which shipped ~65% complete). DS V1 delivers
the remaining structural cleanup + enforcement + versioning infrastructure.

### Added
- `packages/editor/src/themes/design-system/` directory with 11 focused token files (color, typography, spacing, radius, shadow, motion, z-index, layout, design, a11y, index). ~329 canonical tokens total.
- `--buildrick-space-1..12` chrome spacing tokens (were previously consumed from `--buildrick-design-space-*`).
- `--buildrick-radius-sm..full` chrome radius tokens (were previously consumed from `--buildrick-design-radius-*`).
- `--buildrick-font-family-mono` chrome mono font token.
- `getToken(name: TokenName): string` helper in `shared/utils/tokens.ts` for JS-level token reads.
- `TokenName` type union in `shared/utils/token-names.ts` — compile-time safety for getToken calls.
- `designTokensSchemaVersion?: number` field on `ProjectSettings` interface.
- Token migration framework at `features/design-system/migrations/` — handles schema version transitions for user-saved tokens. Empty MIGRATIONS table (V1 baseline).
- `generateCompatibilityShim(version)` in `exportUtils.ts` — prepends deprecated-alias lines to exported CSS during 2-version retention window.
- `scripts/ds-grep-gates.sh` — 8 CI invariants enforced via grep.
- `scripts/verify-design-baselines.mjs` — verifies `design.css` parity with `constants.ts` DEFAULT_TOKENS.
- `npm run verify:ds` — runs parity check + all 8 grep gates.
- ESLint rules (`.eslintrc.buildrik-ds.js`): bans INSPECTOR_TOKENS import, bans direct `getPropertyValue` on `--buildrick-*`.
- `components.css` — transitional home for legacy `.buildrick-*` class rules and responsive `@media` blocks extracted from old `default.css`.

### Changed
- `themes/default.css` is now a thin aggregator (21 lines, was 5151). Imports only `design-system/index.css` + `components.css`.
- Namespace invariant: `--buildrick-design-*` = SITE tokens (user-facing, published in deployed sites). `--buildrick-*` = SHELL tokens (editor chrome, static).
- 265 chrome consumer sites migrated off `--buildrick-design-*` → `--buildrick-*` equivalents.
- `TokenRegistryContext` loader supports both legacy array format and new versioned format `{schemaVersion, tokens}`.
- `TokenRegistryContext` persistAll writes versioned format going forward.
- `buildExport()` in exportUtils accepts optional `schemaVersion` param; CSS output prepends compatibility shim.
- INSPECTOR_TOKENS constant pattern deleted (was 14 keys mapping to `--buildrick-control-*` aliases). 211 usage sites across 32 files converted to direct `var(--buildrick-*)` or rgba strings via codemod.

### Removed
- 10 alias layer families: `--accent`, `--ls-*`, `--rail-*`, `--surface-*`, `--brand-*`, `--bar/--blue/--txt`, `--primary-*`, `--buildrick-control-*`, `--buildrick-build-*`, `--buildrick-ai-*`.
- 275 duplicate CSS var def lines from old `default.css` (V3 residue).
- 29 dark-value fallback sites (`#0c0c12`, `#161620`, `#818CF8`, `#6366F1`, `#00d4aa`, `rgba(99, 102, 241, *)`) from `LeftRail.css`. 2 indigo box-shadows replaced with cobalt.
- `themes/compat.css` (transitional file, all 10 alias families drained during Phase 3).
- 32 duplicate `--buildrick-design-*` defs from `components/Canvas/Canvas.css` (6) and `editor/sidebar/tabs/design/styles/design-tokens.css` (26).

### Migration
- V3 projects load identically in DS V1 (names preserved per Decision 1 Option A — no user project migration needed).
- localStorage format backward compat: loader accepts both legacy array and new `{schemaVersion, tokens}` shape.
- Future token renames follow 2-version alias retention policy (see DESIGN.md Token Public Contract).

### Infrastructure
- Codex (OpenAI Codex CLI v0.121.0) gated each phase boundary — Codex reviews from Phase 0 through Phase 5, plus mid-session reviews on audit findings and 6 architecture decisions.
- Self-review + Codex verification caught: Decision 1 fundamental reframing (site-vs-shell not mutable-vs-static), token versioning gap (no schema version infrastructure), big-switch execution risk (aggregator pattern adopted instead), --accent premature-delete risk (alias-then-drain pattern adopted).

## Theme Unification V3 — 2026-04-19

### Changed
- Renamed all `--aqb-*` CSS variables to `--buildrick-*` (chrome) and `--buildrick-design-*` (user design tokens).
- Renamed all `aqb-*` class names, `data-aqb-*` attributes, `aqb-*` localStorage keys, `aqb:trace:*` dev flags to `buildrick-*` equivalents.
- Renamed all `@keyframes aqb-*` to `@keyframes buildrick-*`.
- Enforced "chrome never mutated at runtime" invariant via two-namespace split.
- Deleted runtime `applyTheme()` function (chrome now renders from `themes/default.css` canonical light values per DESIGN.md 2026-04-18).
- Added `migrateAqbKeys()` storage migration — preserves existing user state across rename.

### Fixed
- `PagesTab.css` dark-override block removed (was shadowing canonical tokens, DESIGN.md violation).
- `components/Canvas/Canvas.css` DARK_THEME_SHIM values corrected to light canonical.
- 29 previously-undefined-but-consumed tokens resolved (defined, renamed, or deleted).
- 2 orphan `@keyframes` animation-name references deleted (`aqb-slide-down`, `aqb-bar-slide-up`).
- Orphan `CSS_CLASSES` constant deleted.

### Known limitations
- Experimental Design-tab user customizations may reset to `DEFAULT_TOKENS` on first post-V3 load (Q4=C lossy retargeting, acceptable).
- Structural debt (file consolidations in `themes/`, storage key duplication cleanup, engine class-name SSOT wire-up) explicitly deferred to separate specs.

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
