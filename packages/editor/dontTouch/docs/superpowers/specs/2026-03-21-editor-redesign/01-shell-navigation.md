# Module 01 — Shell & Navigation

## Problem

The editor shell has too many controls competing for attention. The top bar crams ~15 interactive elements into one row. The rail shows 10 icons at equal visual weight — no grouping, no hierarchy. The sidebar has 10 tabs with inconsistent header patterns. The overall layout doesn't feel like a professional design tool.

**Current state:**
- Top bar: logo, project name, save status, undo, redo, device switcher (4 buttons), preview, publish, AI button, overflow menu, sync dot, presence avatars — all in one 52px bar
- Rail: 56px wide, 10 icons vertically stacked, no grouping. Components tab (⇧A) only accessible via keyboard. Publish tab only accessible if you know the "U" shortcut.
- Sidebar: 280px fixed width. Each of 10 tabs has slightly different header patterns.
- Inspector: 280px fixed, always visible even when showing 2 controls.

## Requirements

### Top Bar
- Reduce visible controls to essentials: identity (logo + project name), save indicator, undo/redo, device switcher, preview button, publish button, collaboration avatars
- AI, export, overflow actions move to command palette (Ctrl+K) or contextual locations
- Must show save status at all times (P4: work is never lost)
- Must show collaboration presence when active
- Share/invite action accessible from top bar (for collaboration — see Module 06)

### Rail
- Group icons into creation tools (top) and system tools (bottom) with visual separator
- Publish becomes a top bar button (primary action, not buried in rail)
- Components section merges into Build tab (discoverable without knowing ⇧A)
- Each icon must have keyboard shortcut and tooltip showing that shortcut
- Active tab clearly indicated. Only one tab open at a time.

### Sidebar
- All 10 tabs use identical header pattern: icon + title + pin + close
- Pin/unpin: pinned panels stay open when clicking canvas, unpinned panels close
- Collapsible: close button or click active rail icon again
- Expandable: drag right edge to increase width
- Consistent search bar position (below header) on tabs that have search

### Inspector
- Collapsible (can hide to give canvas full width)
- Expandable (drag left edge for more room on complex sections)
- Shows page-level info when nothing selected (not blank)
- Adapts sections based on selected element type (U1: every panel earns its pixels)

### Layout Grid
- Classic layout: Top Bar → Rail + Sidebar + Canvas + Inspector
- Minimum supported viewport: 1024px wide
- Canvas fills remaining space (flex: 1)
- All zones have clear borders separating them

## Flows

### Panel Navigation
1. User clicks rail icon → sidebar opens to that tab
2. User clicks same rail icon → sidebar closes
3. User clicks different rail icon → sidebar content swaps (panel stays open)
4. User clicks pin → panel stays open even when clicking canvas
5. User presses Escape → panel closes (if unpinned)
6. User presses keyboard shortcut (A, T, Z, P, J, D, S, H) → panel opens to that tab

### Top Bar Actions
1. Click logo/project name → project settings modal
2. Click save dot (when error) → retry save
3. Click undo/redo → composer.history.undo() / redo()
4. Click device pill → composer.viewport.setDevice()
5. Click Preview → open preview in new tab
6. Click Publish → open publish tab in sidebar

## Engine APIs

| Surface | API | Methods |
|---------|-----|---------|
| Save status | `composer.storage` | saveProject(), auto-save interval |
| Undo/Redo | `composer.history` | undo(), redo(), canUndo, canRedo |
| Device switcher | `composer.viewport` | setDevice(), setZoom() |
| Panel state | `composer.selection` | getSelectedId() — drives inspector content |
| Presence | `composer.collaboration` | getPresence(), onUserJoin/Leave |

## Constraints

- All 30+ keyboard shortcuts from `defaultCommands.ts` must remain functional
- Tab order: Rail → Sidebar → Canvas → Inspector (for keyboard accessibility)
- Escape key priority: close modal → close context menu → deselect → close panel
- Ctrl+K must be globally available regardless of focus location

## Reference

- **Webflow:** Shell layout, rail grouping, sidebar behavior
- **Framer:** Dark surface treatment, minimal top bar, premium feel
- **Figma:** Panel pin/unpin behavior, collapse/expand, right panel density
- **Linear:** Top bar restraint — only show what matters NOW

## Sidebar Tabs (8 tabs — down from 10)

**Merged:** Components tab (⇧A) → now a section inside Build tab. Publish tab (U) → now a top bar button.

| # | Tab | Shortcut | What It Does |
|---|-----|---------|-------------|
| 1 | Build / Add | A | Element catalog with categories, search, favorites, components section |
| 2 | Media | J | Upload, browse, stock photos, image editor, icon picker |
| 3 | Layers | Z | Element tree, visibility toggle, drag reorder, canvas sync |
| 4 | Templates | T | Template browser, preview, apply with progress |
| 5 | Pages | P | Page list, page settings (SEO, Social, Advanced), add/delete |
| 6 | Design | D | Color/type/spacing tokens, draft/review/apply, export formats |
| 7 | Settings | S | Site settings, domains, analytics, integrations, advanced, export |
| 8 | History | H | Version history (named saves, auto-saves), activity log, undo/redo |

**Note:** Publish is a top bar button, not a sidebar tab. Components section lives inside Build tab.
