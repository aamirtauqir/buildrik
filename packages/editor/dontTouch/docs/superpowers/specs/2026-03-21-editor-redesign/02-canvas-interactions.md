# Module 02 — Canvas & Interactions

## Problem

The canvas has 17 interaction states and 16+ hooks — all coded. But the visual feedback is rough. Empty projects show a blank canvas. Drop zones during drag are unclear. Snap lines are invisible or inconsistent. Resize handles are basic. Inline text editing lacks a formatting toolbar. The canvas doesn't feel like a precision design tool.

## Requirements

### Canvas States (all must have distinct visual treatment)

| State | What Happens |
|-------|-------------|
| Empty | Welcoming CTA — "Start building" with Browse Templates + Start Blank |
| Idle | White canvas on dark background, no selection outlines |
| Hover | Subtle outline on hovered element + element type badge |
| Selected | Indigo outline + 8 resize handles + floating toolbar above |
| Multi-selected | All selected elements outlined + group bounding box + multi-select toolbar |
| Inline editing | Text cursor inside element + formatting toolbar (bold/italic/underline/link/color) |
| Dragging from sidebar | Ghost follows cursor + valid/invalid drop zone highlighting |
| Dragging within canvas | Element semi-transparent + original position ghost + snap lines |
| Marquee selecting | Dashed rectangle from drag origin, elements inside get preview highlight |
| Context menu | Right-click menu with element actions + "Select from stack" |
| X-Ray mode | Wireframe view — all elements as labeled outlines |
| Dev mode | Canvas unchanged, inspector switches to raw CSS view |
| Spacing indicators | Selected element shows margin (warm) and padding (cool) overlays |
| Grid overlay | CSS grid lines visible on grid containers |
| Guides | User-defined ruler guides (draggable, deletable) |
| Rulers | Pixel rulers on top and left edges |

### Floating Element Toolbar
- Appears above selected element (or below if near top edge)
- Actions: select parent, duplicate, move up/down, copy, wrap in container, delete
- Hides during drag, reappears on drop
- Each button has tooltip with keyboard shortcut

### Resize Handles
- 8 handles: 4 corners + 4 edge midpoints
- Modifier keys: Shift = constrain ratio, Alt = resize from center
- Live dimension label near active handle showing current width × height

### Snap Lines
- Appear when dragged element aligns with another element's edge or center
- Threshold: ~6px
- Shows distance labels when snapped

### Drop Zones (drag from sidebar)
- Valid targets: highlighted with positive indicator
- Invalid targets: highlighted with negative indicator + "Cannot drop here"
- Insertion point: animated line between sibling elements showing where new element will land

### Canvas Footer
- Overlay toggles: Grid, Guides, Spacing, Badges, X-Ray, Rulers
- Zoom controls: zoom in, zoom out, percentage display, fit to view
- All toggles show on/off state clearly

## Flows

### Add Element to Canvas
1. User drags element from Build tab (or clicks to insert)
2. Canvas shows drop zone highlights as element hovers over canvas
3. Drop on valid target → element inserted → auto-selected
4. Inspector populates with new element's properties

### Select and Edit
1. Click element → selected state (outline + handles + toolbar)
2. Double-click text element → inline edit mode (cursor + formatting toolbar)
3. Type text → live update
4. Click outside or Escape → commit text, return to selected state

### Multi-select
1. Shift+click additional elements → multi-select
2. OR drag on empty canvas → marquee → all intersecting elements selected
3. OR Ctrl+A → select all
4. Multi-select toolbar shows: align, distribute, size match, wrap, delete

### Right-click Context Menu
1. Right-click element → context menu at cursor
2. Menu includes: select, select from stack (overlapping elements), AI improve, copy/cut/paste/duplicate, wrap, create component, show in layers, move up/down, delete
3. Keyboard navigation within menu (arrow keys, Enter to activate, Escape to close)

## Engine APIs

| Surface | API | Methods |
|---------|-----|---------|
| Element operations | `composer.elements` | add, delete, duplicate, move, createPage |
| Selection | `composer.selection` | select, clear, getSelected, multi-select |
| Drag | `composer.drag` | drag within canvas, z-index reorder |
| Resize | `composer.resize` | element resize with constraint handling |
| Snap/Guides | `composer.indicators` | spacing indicators, guides, grid, snapping |
| Inline edit | `composer.elements` | update text content |
| Context menu | `composer.commands` | execute command by ID |
| Canvas overlays | `composer.indicators` | showOutlines, showGuides, showSpacing, showGrid, showXRay, showRulers |
| Zoom | `composer.viewport` | setZoom, zoom range 25%–400% |

## Constraints

- Canvas must render at 60fps during drag and resize operations
- Selection outline must not be part of the element's actual border (uses overlay layer)
- Inline text editing must support contenteditable with live formatting
- All canvas keyboard shortcuts must work when canvas has focus (arrows, delete, Ctrl+D, etc.)
- Canvas must handle zoom/pan via Viewport manager, not browser scroll

## Reference

- **Webflow:** Canvas interaction model, drop zone feedback, inline text editing
- **Figma:** Selection handles, multi-select, snap lines, zoom behavior
- **Framer:** Canvas visual quality, element hover treatment
