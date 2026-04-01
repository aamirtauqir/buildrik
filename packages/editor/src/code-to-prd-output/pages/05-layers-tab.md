# Layers Tab

> **Module:** Sidebar — Tab 3
> **Source:** `src/editor/sidebar/tabs/layers/` + `src/editor/panels/layers/`
> **Keyboard Shortcut:** Z
> **Generated:** 2026-03-25

## Overview

The Layers tab shows the complete DOM tree hierarchy of all elements on the current page. Users can select, reorder, rename, lock, hide, and manage elements through this hierarchical view — similar to layer panels in Figma or Photoshop.

## Layout

```
+----------------------------+
| [Search: "Filter layers"]  |
+----------------------------+
| [Breadcrumb: Page > Sect.] |
+----------------------------+
| ▼ Page Root                |
|   ▼ Header Section         |
|     ├ Logo (image)    👁 🔒|
|     ├ Nav (navbar)    👁   |
|     └ CTA Button      👁   |
|   ▼ Hero Section           |
|     ├ Heading         👁   |
|     ├ Paragraph       👁   |
|     └ Image           👁   |
|   ▶ Features Section  👁   |
|   ▶ Footer            👁   |
+----------------------------+
| [N layers selected]        |
+----------------------------+
```

## Fields

### Search
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Search input | Text | No | Empty | Filters layers by name; non-matching layers dimmed |

### Layer Tree Items
| Element | Type | Behavior |
|---------|------|----------|
| Expand/collapse arrow | Icon | Toggle child visibility in tree |
| Element icon | Icon | Type-specific icon (text, image, container, etc.) |
| Element name | Text (editable) | Double-click to rename |
| Visibility toggle (eye) | Icon button | Hide/show element on canvas |
| Lock toggle (lock) | Icon button | Lock/unlock element from editing |
| Drag handle | Drag target | Drag to reorder or reparent element |

### Selection Banner
| Element | Type | Behavior |
|---------|------|----------|
| Count display | Text | "N layers selected" when multi-select active |

## Interactions

### Select Element
- **Click** — Select single layer; highlights on canvas
- **Shift+Click** — Add to multi-selection
- **Behavior:** Canvas selection syncs immediately → Inspector shows selected element properties

### Rename Element
- **Trigger:** Double-click layer name
- **Behavior:** Name becomes editable text input → Enter confirms → Escape cancels
- **Validation:** Name cannot be empty

### Reorder Element (Drag)
- **Trigger:** Drag a layer item vertically
- **Behavior:** Drop indicator shows insertion point → release moves element in DOM tree → canvas re-renders
- **Reparent:** Drag onto a container to move element inside it
- **Constraints:** Cannot create invalid nesting (e.g., form inside form)

### Toggle Visibility
- **Trigger:** Click eye icon
- **Behavior:** Element hidden on canvas (display: none) → eye icon shows "hidden" state → element still exists in tree but grayed out
- **Scope:** Hides element and all children

### Toggle Lock
- **Trigger:** Click lock icon
- **Behavior:** Element becomes non-editable and non-selectable on canvas → lock icon shows "locked" state
- **Scope:** Locks element and all children from editing

### Right-Click Context Menu
- **Trigger:** Right-click layer item
- **Actions:** Duplicate, Delete, Copy, Paste inside, Bring forward, Send backward, Bring to front, Send to back, Lock, Unlock, Hide, Show

### Search / Filter
- **Trigger:** Type in search bar
- **Behavior:** Non-matching layers are dimmed/collapsed → matching layers expand and highlight

### Expand / Collapse
- **Trigger:** Click arrow icon or keyboard (→ expand, ← collapse)
- **Behavior:** Shows/hides child elements in tree view

## Business Rules

1. Layer order reflects DOM order (top of list = first in DOM = rendered behind subsequent siblings)
2. Selection state is bidirectional: selecting on canvas highlights in Layers and vice versa
3. Locked elements show lock icon; cannot be selected, moved, or resized on canvas
4. Hidden elements show dimmed with crossed-out eye; not visible on canvas but present in export
5. Drag-reorder wraps in a single history transaction
6. Breadcrumb at top shows path from page root to currently selected element

## Screen Relationships
- **Bidirectional with:** Canvas (selection sync), Inspector (selected element properties)
- **Data coupling:** Element tree state shared with Canvas; structural changes (reorder, delete) trigger full tree rebuild
