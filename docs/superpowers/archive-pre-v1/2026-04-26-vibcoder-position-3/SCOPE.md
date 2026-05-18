# Vibcoder Component Scope — Buildrik Triage Manifest

**Date:** 2026-04-26
**Owner:** shahg
**Source:** vibcoder bundle snapshot 2026-04-25 at `docs/reference/vibcoder/`
**Spec:** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/`

## Purpose

This document declares Buildrik-specific scope assignments for each of the 73
vibcoder components. The vibcoder bundle ships a superset spanning editor chrome,
dashboard surfaces, CMS, mobile, and engine concerns. Buildrik triages each
component into one of four buckets:

- **CHROME** — port now into editor chrome via Path B (vendored CSS + React render)
- **DASHBOARD/MOBILE** — defer until dashboard or mobile initiative scopes up
- **CMS** — defer until CMS records initiative scopes up
- **ENGINE** — special-case handling (port wrapper styles only, internals stay engine-rendered)

This file is Buildrik-owned. The vibcoder bundle (`docs/reference/vibcoder/`) stays
pristine. Bundle regeneration does not affect this file.

## Triage table

### Atoms (26 files total: 24 chrome, 2 dashboard)

Note: button.css ships both `bdr-btn` and `bdr-btn-split` selectors (variant of
button). For port purposes, button.css covers both Button.tsx and ButtonSplit.tsx
React components. Counted as 1 atom file.

| Component | Bucket | Rationale |
|---|---|---|
| avatar | CHROME | Collaboration presence, comments, user identity in editor chrome |
| badge | CHROME | Status badges across editor (publish state, premium tier, etc.) |
| breakpoint-switcher | CHROME | Topbar viewport toggle (D/T/M) |
| button (incl. button-split variant) | CHROME | Universal interactive primitive. Single button.css file ships both `bdr-btn` and `bdr-btn-split` (publish CTA with caret submenu in topbar) |
| checkbox | CHROME | Forms across inspector, settings, preferences |
| count | CHROME | Sidebar tab counts, item counters |
| divider | CHROME | Visual separator across all surfaces |
| edge-tab | DASHBOARD/MOBILE | Tablet/mobile-only floating drawer-edge affordance per CSS comments |
| fab | DASHBOARD/MOBILE | Mobile shell drawer triggers, dashboard "+ New project" mobile per COMPONENTS.md |
| grip | CHROME | Drag handle for resize, reorder |
| helper-text | CHROME | Form validation hints |
| icon | CHROME | Universal icon primitive (sprite-based, 41 icons shipped) |
| icon-button | CHROME | Icon-only buttons in toolbars, action bars |
| input | CHROME | Single-line text/url/number entry across forms |
| kbd | CHROME | Keyboard shortcut display in command palette, tooltips |
| label | CHROME | Form field labels |
| link | CHROME | Inline text links in chrome |
| progress | CHROME | Publish, upload, generate, sync progress |
| select | CHROME | Native select styled to match input |
| skeleton | CHROME | Loading states |
| slider | CHROME | Inspector controls (opacity, blur, etc.) |
| spinner | CHROME | Async operation indicators |
| switch | CHROME | Toggles (settings, feature flags) |
| tag | CHROME | Chips, status pills, filter tags |
| textarea | CHROME | Multi-line text input |
| thumb | CHROME | Image thumbnails in media library, page list |

### Molecules (21 total: 18 chrome, 1 dashboard, 2 CMS)

| Component | Bucket | Rationale |
|---|---|---|
| actionbar | CHROME | Topbar action group, toolbar action clusters |
| breadcrumb | CHROME | Navigation in nested settings, asset library |
| card | CHROME | Panels, tile foundations |
| chipbar | CHROME | Tag groups, filter chip clusters |
| color-trigger | CHROME | Color picker entry button |
| form-field | CHROME | Form composition (label + input + helper-text) |
| list-row | CHROME | Sidebar rows (Layers, Pages, Components) |
| popover | CHROME | Overlays, menus, tooltips |
| rail-tile | CHROME | Left rail icon items |
| search-input | CHROME | Search bars in templates, components, media |
| section-head | CHROME | Panel section dividers with title |
| surface-head | CHROME | Panel headers (sidebar tab heads, modal heads) |
| table | CMS | Generic data table; current editor has no consumer |
| table-frame | CMS | CMS records table wrapper per memory; out of editor scope |
| tabs | CHROME | Tab strips in sidebar, inspector |
| tile-meta | CHROME | Template tiles, project tiles, asset tile feet (used in editor TemplatesTab) |
| toast | CHROME | Notification system |
| toggle-row | CHROME | Settings rows with label + switch |
| toolbar | CHROME | Canvas toolbar, inspector toolbars |
| uploader | CHROME | Media upload entry in MediaTab |
| workspace-chip | DASHBOARD/MOBILE | Workspace selector chip; not used in editor chrome |

### Organisms (19 total: 16 chrome, 2 dashboard, 1 engine)

| Component | Bucket | Rationale |
|---|---|---|
| a11y-overlay | CHROME | Accessibility audit overlay in editor |
| asset-library | DASHBOARD/MOBILE | Full-screen 3-column workspace pattern; editor MediaTab is inline sidebar (different surface) |
| canvas | ENGINE | Canvas internals are engine-rendered (Canvas.tsx mounts engine HTML, not React); port wrapper styles only (background, border, scrollbar) |
| color-picker | CHROME | Inspector + design tab color selection |
| command-palette | CHROME | Cmd+K command palette |
| drawer | CHROME | Slide-out panels (sidebar drawer base) |
| empty-state | CHROME | Zero-data states across all sidebar tabs |
| footer | CHROME | Bottom bar with status + actions |
| history-panel | CHROME | Undo/redo history panel |
| inspector | CHROME | Right panel for selected element properties |
| left-panel | CHROME | Sidebar shell |
| modal | CHROME | Dialogs (publish, settings, error) |
| notification-center | CHROME | Notifications panel |
| overlay-mount | CHROME | Portal mount infrastructure for overlays |
| pages-drawer | CHROME | Pages sidebar |
| rail | CHROME | Left icon rail |
| sheet | DASHBOARD/MOBILE | Page-within-page pattern for form-builder/CMS/settings preview; editor TemplatePreviewModal already covers template preview |
| templates-drawer | CHROME | Templates sidebar |
| topbar | CHROME | Top bar with viewport toggle, publish, account |

### Layouts (7 total: all chrome universal)

| Component | Bucket | Rationale |
|---|---|---|
| center | CHROME | Universal centering primitive |
| cluster | CHROME | Universal flex cluster |
| frame | CHROME | Universal aspect-ratio frame |
| grid | CHROME | Universal grid primitive |
| sidebar-shell | CHROME | Editor-specific sidebar shell |
| stack | CHROME | Universal vertical stack |
| switcher | CHROME | Universal switcher primitive |

## Bucket totals (file count)

| Bucket | Count | Atoms | Molecules | Organisms | Layouts |
|---|---:|---:|---:|---:|---:|
| CHROME | 65 | 24 | 18 | 16 | 7 |
| DASHBOARD/MOBILE | 5 | 2 | 1 | 2 | 0 |
| CMS | 2 | 0 | 2 | 0 | 0 |
| ENGINE | 1 | 0 | 0 | 1 | 0 |
| **Total** | **73** | **26** | **21** | **19** | **7** |

**Note on React component count vs file count:** button.css contains both `bdr-btn`
and `bdr-btn-split`. For React component port, this produces 2 components
(Button.tsx + ButtonSplit.tsx) from 1 vendored CSS file. Total React chrome
components ≈ 66, total chrome CSS files = 65. Phase planning uses file count.

## Port order (Phase reference)

Per `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`:

- **Phase 0 POC:** button, list-row, tag (3 chrome)
- **Phase 1:** all 25 atoms (5 batches)
- **Phase 2:** all 18 molecules (5 batches)
- **Phase 3:** all 15 organisms (5 batches)
- **Phase 4:** all 7 layouts (2 batches)
- **Phase 5:** re-port 37 existing `shared/ui/` primitives (codemod-driven)

## Engine wrapper handling (canvas)

The `bdr-canvas` organism in vibcoder is CSS for a static canvas surface. Buildrik's
`Canvas.tsx:465` injects engine HTML, not React JSX (per memory:
`project_canvas_render_path.md`). For this component:

- **Port:** background color, border, scrollbar styles, container sizing
- **Skip:** any internal canvas content styles, selection highlight (engine handles),
  drag handles (engine handles)

Output file: `themes/components/bd-canvas.css` contains only wrapper styles. The
React component `shared/ui/Canvas.tsx` (or wherever) consumes the wrapper class.
Engine continues to render canvas contents.

## Deferred bucket revisit triggers

### DASHBOARD/MOBILE (5 components)

Re-evaluate when:

- Dashboard initiative scopes up (separate Buildrik effort)
- Mobile/tablet editor variant becomes a goal
- AI tab adds floating action button affordance

Components: fab, workspace-chip, edge-tab, asset-library, sheet

### CMS (2 components)

Re-evaluate when:

- CMS records management feature scopes up
- Inspector grows table-like UI for data binding

Components: table, table-frame

## Token Filter for Codemod 3 (Pass 6 finding #9)

Codemod 3 auto-mirrors new `--bd-X` aliases for every `--buildrick-X` token vibcoder
ships. To prevent pollution of `bd-aliases.css` with tokens for deferred buckets
(dashboard/mobile/CMS), Codemod 3 SKIPS aliases for tokens whose names match these
patterns:

| Pattern | Reason |
|---|---|
| `--buildrick-mobile-*` | Mobile-only surfaces, editor is desktop-only |
| `--buildrick-dashboard-*` | Dashboard surfaces, separate workspace |
| `--buildrick-cms-*` | CMS records, separate scoping |
| `--buildrick-canvas-internal-*` | Engine-rendered canvas internals |
| `--buildrick-fab-*` | Floating action button (mobile/dashboard pattern) |
| `--buildrick-stage-dark` | Explicit "dark demo backdrop only" per token-diff doc |

When vibcoder ships a token matching a skip pattern, Codemod 3 logs the skip:

```
SKIPPED: --buildrick-mobile-fab-shadow (matches deferred-bucket pattern: --buildrick-mobile-*)
```

If Buildrik later needs a deferred-bucket token (e.g., dashboard initiative scopes
up), the pattern entry is removed from this filter and Codemod 3 mirrors on the
next bundle update.

Tokens NOT in this filter are mirrored automatically — the default is inclusion,
exception is exclusion.

## Extensions

This section tracks Buildrik-specific component variants that exist outside the
vibcoder bundle. Per the design spec, these are vibcoder-debt: temporary deviations
that should be requested for inclusion in vibcoder upstream.

Format per entry:

```
### bd-{name}--{variant}
- **Reason:** why we needed it before vibcoder shipped it
- **Resolution by:** target date for vibcoder upstream adoption
- **Ack:** SG
- **Source commit:** <sha when added>
```

(Currently empty. Populate as vibcoder-debt entries arise during execution.)

## Buildrik-specific primitives (no vibcoder equivalent)

These exist in `packages/editor/src/shared/ui/` and have no direct vibcoder
component to map to. Phase 5 audits each — port to vibcoder equivalent if one
exists under different name, or keep as Emotion (justified exception):

- Accordion
- ColorSwatch
- ContextMenu
- CopyButton
- ErrorMessage
- ErrorState
- HelpTooltip
- Icons (variant of icon)
- InfoBanner (might be vibcoder banner molecule under different name?)
- PanelHeader (likely overlaps surface-head molecule)
- PremiumBadge (likely overlaps badge atom with premium variant)
- QuickSwitcher
- Resizable
- SliderInput (likely overlaps slider atom + form-field molecule)
- Tooltip (likely overlaps popover molecule with tooltip variant)
- TreeView
- UpgradeGate
- UpgradeModal

Phase 5 outcome per primitive: documented mapping decision (port-to-vibcoder OR
keep-as-extension with rationale).

## Cross-references

- Design spec: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/design.md`
- Roadmap: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md`
- Vibcoder bundle: `docs/reference/vibcoder/` (READ-ONLY upstream)
- Vibcoder COMPONENTS.md: `docs/reference/vibcoder/components/COMPONENTS.md`
- Token diff: `docs/ideation/2026-04-26-vibcoder-token-diff.md`
- Editor CLAUDE.md: `packages/editor/CLAUDE.md`
