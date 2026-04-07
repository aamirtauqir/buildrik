# Canvas

> **Module:** Canvas
> **Source:** `src/editor/canvas/`
> **Generated:** 2026-03-25

## Overview

The Canvas is the central visual editing surface where users build their website. It renders all page elements, handles drag-and-drop placement, inline text editing, selection with visual handles, alignment guides, and overlay systems (rulers, grids, spacing labels, remote cursors).

## Layout

```
+-----------------------------------------------------------+
| [Breadcrumb: Page > Section > Container > Text]           |
+-----------------------------------------------------------+
|                                                           |
|  [Rulers - Top]                                           |
|  +------------------------------------------------------+ |
|  |[R]|                                                   | |
|  |[u]|     Canvas Content Area                           | |
|  |[l]|     (rendered elements)                           | |
|  |[e]|                                                   | |
|  |[r]|     +--[Selection Box]---------+                  | |
|  |   |     | [Element with handles]   |                  | |
|  |[L]|     +--[Resize Handles (8pt)]--+                  | |
|  |[e]|                                                   | |
|  |[f]|     [Smart Guides ---|--- alignment lines]        | |
|  |[t]|                                                   | |
|  +------------------------------------------------------+ |
|                                                           |
|  [Footer: Zoom Controls] [Grid Toggle] [Ruler Toggle]    |
+-----------------------------------------------------------+
| [Floating: Quick Actions Toolbar - when element selected] |
| [Floating: Context Menu - on right click]                 |
+-----------------------------------------------------------+
```

## Regions

### Canvas Content Area
The main rendering surface showing all page elements at the current zoom level and device width.

### Selection Overlays
When an element is selected:
- **Bounding box** — Blue outline around the element
- **8 resize handles** — Corner and edge handles for resizing
- **Selection label** — Element type/name badge above the selection
- **Drag handle** — Move cursor indicator

### Visual Guides
- **Grid overlay** — Pixel grid background (togglable)
- **Rulers** — Top and left pixel rulers (togglable)
- **Smart guides** — Snap-to alignment lines when dragging (automatic)
- **Spacing labels** — Dimension measurements between elements

### Floating UI
- **Quick Actions Toolbar** — Above selected element: copy, paste, duplicate, delete, lock
- **Unified Selection Toolbar** — Alignment, distribution, spacing controls
- **Breadcrumb** — DOM path from root to selected element
- **Remote cursors** — Colored cursors with names for collaborators

## Interactions

### Element Selection
- **Click** — Select single element; deselects previous
- **Shift+Click** — Add/remove element from multi-selection
- **Ctrl+Click** — Toggle element in selection
- **Drag marquee** — Draw rectangle to select all enclosed elements
- **Click empty area** — Clear selection
- **Escape** — Clear selection or exit current mode

### Element Drag & Drop (Insert)
- **Trigger:** Drag element from Add tab or template
- **Behavior:** Ghost preview follows cursor → drop zone highlights valid targets → insertion line shows drop position → on release, element created at drop position
- **Validation:** Only valid parent-child relationships allowed (e.g., no form inside form)
- **Auto-scroll:** Canvas scrolls when dragging near edges

### Element Move (Reposition)
- **Trigger:** Click and drag selected element
- **Behavior:** Element follows cursor → smart guides appear at alignment points → snap-to-grid if enabled → on release, position updates
- **Arrow keys:** Move element 1px per press; Shift+Arrow moves 10px
- **Constraints:** Cannot move locked elements

### Element Resize
- **Trigger:** Drag resize handle
- **Behavior:** Element resizes from dragged edge/corner → min/max constraints enforced → aspect ratio maintained with Shift held → snap-to-grid active
- **Handles:** 8-point: 4 corners + 4 edges
- **Special:** Alt+drag resizes from center; Shift+drag maintains aspect ratio

### Inline Text Editing
- **Trigger:** Double-click a text element
- **Behavior:** Text becomes editable in-place → cursor appears → standard text editing (select, type, delete) → Ctrl+B bold, Ctrl+I italic → click outside or Escape to confirm
- **Rich text:** Bold, italic, underline, link, text color available via floating toolbar

### Right-Click Context Menu
- **Trigger:** Right-click on element or canvas
- **Categories:**
  - **Edit:** Copy, Cut, Paste, Duplicate, Rename, Delete
  - **Insert:** Add element, Add component, Add block (inside selected element)
  - **Layout:** Align (left/center/right/top/middle/bottom), Distribute, Arrange (bring forward/backward/front/back)
  - **Style:** Quick style toggles
  - **Standalone:** Lock/unlock, Hide/show, Export element as image

### Command Palette
- **Trigger:** Ctrl+K (or Cmd+K on Mac)
- **Behavior:** Search overlay opens → type action name → fuzzy search matches commands → Enter executes → Escape closes
- **Available actions:** All editing, selection, alignment, insertion commands

### Keyboard Shortcuts (Canvas-Level)

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected element(s) |
| Ctrl+D | Duplicate selection |
| Ctrl+C / Ctrl+V | Copy / Paste |
| Ctrl+X | Cut |
| Ctrl+A | Select all elements on page |
| Ctrl+K | Open command palette |
| Arrow keys | Move element 1px |
| Shift+Arrows | Move element 10px |
| Ctrl+G | Group selected elements |
| Ctrl+Shift+G | Ungroup |
| [ / ] | Bring backward / forward |
| Ctrl+[ / Ctrl+] | Send to back / front |
| ? | Show keyboard shortcut cheat sheet |

### Block Picker
- **Trigger:** Quick Add Bar or Insert action
- **Behavior:** Modal opens showing pre-built blocks organized by category → hover to preview → click to insert at current selection point

### Canvas Footer Controls

| Control | Behavior |
|---------|----------|
| Zoom controls | Zoom in/out/fit buttons |
| Grid toggle | Show/hide pixel grid |
| Ruler toggle | Show/hide top and left rulers |
| X-ray mode | Dev-mode overlay showing element boundaries, z-index values, and CSS class names. Useful for developer handoff — helps engineers understand the element structure visually. Toggle on/off. |

## Overlay System

| Overlay | When Visible | Purpose |
|---------|-------------|---------|
| Selection box | Element selected | Blue bounding box with handles |
| Hover highlight | Mouse over unselected element | Dashed outline showing hoverable element |
| Parent highlight | Multi-select or deep nesting | Highlights parent container |
| Drop feedback | During drag-and-drop | Shows valid insertion point |
| Multi-select badge | 2+ elements selected | Shows count "N selected" |
| Grid | When toggled on | Pixel grid background |
| Rulers | When toggled on | Top + left measurement rulers |
| Smart guides | During drag/resize | Alignment snap lines to siblings/parents |
| Spacing labels | During drag/resize | Pixel distance measurements |
| Remote cursors | When collaborators present | Named colored cursors |
| Breadcrumb | Always (when element selected) | DOM path navigation |

## Engine Dependencies

| Manager | Role |
|---------|------|
| ElementManager | Element CRUD, tree structure |
| SelectionManager | Selection state |
| DragManager | Drag lifecycle state machine |
| ResizeHandler | Resize operations with snap/constraints |
| CanvasIndicators | All visual overlays |
| CommandCenter | Command palette and keybindings |
| HistoryManager | Every action creates history entry |
| CollaborationManager | Remote cursor sync |
| InteractionManager | Preview mode runtime |

## Screen Relationships
- **From:** All sidebar tabs can trigger canvas changes; Inspector edits reflected on canvas
- **To:** Inspector shows properties of canvas-selected element; Layers tab highlights selected element
- **Data coupling:** Selection state shared between Canvas, Inspector, and Layers; drag-drop from Add tab creates elements on canvas
