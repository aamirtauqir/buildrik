---
title: Layers Tab — DOM Tree
description: Design specification for the hierarchical element tree with drag reorder, visibility, and lock controls
feature: layers-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../inspector/README.md
dependencies:
  - Canvas (bidirectional selection sync)
  - Inspector (selected layer populates inspector)
status: approved
---

# Layers Tab — DOM Tree

## Overview

The Layers Tab provides a hierarchical tree view of every element on the current page, mirroring the DOM structure. It is the structural counterpart to the visual canvas — what the canvas shows spatially, the Layers Tab shows hierarchically. Selection is bidirectional: clicking a layer selects it on canvas, and selecting on canvas highlights it in the tree.

**Primary User Goal:** Understand page structure and select elements that are hard to click on canvas (overlapping, hidden, deeply nested).
**Success Criteria:** Any element is reachable in < 3 clicks from the tree root.
**Key Pain Points Addressed:** Eliminates guessing what is inside a container; makes reordering/reparenting visual.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Page > Section > Container    │ Breadcrumb trail
├──────────────────────────────┤
│ 🔍 Filter layers...          │ Search/filter input
├──────────────────────────────┤
│ ▼ 📄 Page                    │ Root node
│   ▼ 📦 Header Section        │
│     ├ 🔤 Logo Text        👁🔒│ Visibility + Lock
│     ├ 📦 Nav Container     👁🔒│
│     │  ├ 🔗 Link 1        👁🔒│
│     │  ├ 🔗 Link 2        👁🔒│
│     │  └ 🔗 Link 3        👁🔒│
│     └ 🔘 CTA Button       👁🔒│
│   ▼ 📦 Hero Section          │
│     ├ 🔤 Heading           👁🔒│ ← Selected (highlighted)
│     ├ 🔤 Subheading        👁🔒│
│     └ 🖼 Hero Image        👁🔒│
│   ▸ 📦 Features Section      │ Collapsed
│   ▸ 📦 Footer Section        │ Collapsed
└──────────────────────────────┘
```

---

## Screen States

### State 1: Default Tree View

- **Breadcrumb:** Top bar showing path to selected element. Each segment clickable to select parent. `--aqb-body-sm`, `--buildrick-text-secondary`, separator " > ".
- **Tree nodes:** 32px row height, 16px indent per level. Type icon (12px, `--buildrick-text-tertiary`) + name (`--aqb-body-sm`, `--buildrick-text-primary`).
- **Expand/collapse:** Chevron icon, 12px, rotates 90deg on expand. `--aqb-duration-short` transition.
- **Visibility icon (eye):** Right-aligned, `--buildrick-text-tertiary`. Crossed-out when hidden. Click toggles `display: none`.
- **Lock icon:** Right-aligned next to eye. `--buildrick-text-tertiary`. Locked = `--buildrick-warning`. Prevents selection and editing on canvas.

### State 2: Element Selected

- **Selected row:** `--buildrick-accent-tint` bg, `--buildrick-accent` left border (2px).
- **Canvas sync:** Corresponding element on canvas shows selection bounding box.
- **Inspector sync:** Inspector populates with selected element properties.
- **Breadcrumb updates** to show path to selected element.

### State 3: Search/Filter Active

- **Filter input focused:** `--buildrick-accent` border. Typing filters tree to matching nodes + their ancestor chain.
- **Matched nodes:** Name text has matched characters highlighted in `--buildrick-accent`.
- **Non-matching ancestors:** Shown but dimmed (`--buildrick-text-tertiary`).
- **No results:** "No layers matching '[query]'" centered.

### State 4: Drag Reorder

- **Drag handle:** Visible on hover (6-dot grip icon, left of type icon).
- **Dragging row:** 50% opacity, elevated with `--aqb-elevation-2`.
- **Drop indicators:**
  - Between siblings: 2px `--buildrick-accent` horizontal line at insertion point
  - Into container: Target container row gets 2px `--buildrick-accent` border (reparent)
- **Invalid drop:** No indicator shown (e.g., dropping parent into own child).

### State 5: Empty Page

- **Visual:** Single root "Page" node with no children. Below: "Add elements from the Build tab" in `--buildrick-text-tertiary`.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click layer row | Select element on canvas + inspector | Instant highlight |
| Double-click name | Inline rename (text input replaces label) | Instant |
| Click eye icon | Toggle visibility (canvas updates) | Eye icon cross-out, 150ms |
| Click lock icon | Toggle lock state | Lock icon color change, 150ms |
| Drag row | Reorder or reparent in DOM tree | 60fps drag tracking |
| Right-click row | Context menu: Rename, Duplicate, Delete, Group, Ungroup | Instant popup |
| Expand/collapse | Toggle children visibility | Chevron rotate 200ms |
| Cmd+click | Add to multi-selection | Instant |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Tree render (100 elements) | < 50ms |
| Tree render (500+ elements) | < 100ms (virtualized list) |
| Selection sync (canvas ↔ layers) | < 16ms |
| Drag reorder feedback | 60fps |
| Filter/search response | < 100ms |

---

## Accessibility

- **Tree structure:** `role="tree"` on container, `role="treeitem"` on each row, `aria-expanded` on parent nodes
- **Keyboard navigation:** Arrow Up/Down moves between visible rows. Arrow Right expands, Arrow Left collapses. Home/End jump to first/last.
- **Visibility toggle:** `aria-label="Toggle visibility for [Element Name]"`, announces "hidden" or "visible"
- **Lock toggle:** `aria-label="Toggle lock for [Element Name]"`, announces "locked" or "unlocked"
- **Drag reorder:** Arrow keys with Alt held = move element up/down in tree

---

## Implementation Notes

- Tree data derives from `Composer.elements` hierarchy — not a separate data structure
- Virtualized rendering (react-window or custom) for pages with 500+ elements
- Drag-and-drop uses native HTML5 drag API with custom drop zone calculation
- Bidirectional sync: canvas `element:selected` event updates tree highlight; tree click calls `Composer.elements.select()`
- Inline rename commits on Enter or blur, cancels on Escape

---

## Related Documentation
- [Canvas](../canvas/README.md) — Bidirectional selection sync
- [Inspector](../inspector/README.md) — Selected layer populates inspector
- [Add/Build Tab](../add-build-tab/README.md) — New elements appear in tree
- [Style Guide](../../design-system/style-guide.md) — Tree node and icon specs
