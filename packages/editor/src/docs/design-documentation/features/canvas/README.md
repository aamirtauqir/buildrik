---
title: Canvas — Visual Editing Surface
description: Design specification for the central canvas where users build websites visually
feature: canvas
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../inspector/README.md
  - ../layers-tab/README.md
  - ../add-build-tab/README.md
  - ../collaboration/README.md
dependencies:
  - Inspector (bidirectional selection sync)
  - Layers Tab (bidirectional selection sync)
  - Add/Build Tab (element source for drag-drop)
status: approved
---

# Canvas — Visual Editing Surface

## Overview

The Canvas is the heart of Buildrik — the central surface where users visually construct their websites. It must feel like a direct-manipulation tool (not a form-filling exercise), with zero perceptible latency between user action and visual result. The canvas renders the user's actual website at the selected device width and zoom level, surrounded by editing overlays (selection, guides, cursors, measurement labels).

**Primary User Goal:** Place, arrange, resize, and style visual elements to produce a website layout.
**Success Criteria:** A designer can build a complete page from sections in < 45 minutes.
**Key Pain Points Addressed:** Eliminates the Figma-to-Webflow rebuild; direct visual building replaces code.

---

## User Experience Analysis

### Personas Served
- **Tom (Designer):** 80% of his time is here. Drag sections, style elements, check alignment.
- **Sarah (Lead):** Reviews work here. Selects elements to check properties. Uses X-ray mode for structure.
- **Maya (Content Mgr):** Views canvas in preview mode. Checks CMS-bound content rendering.
- **Dev:** Uses X-ray mode to understand element structure before export.

### Mental Model
Users think of the canvas as a page in a design tool (like Figma artboards) but with the added mental model of a browser viewport (because responsive breakpoints change the layout). The canvas is NOT a code editor — it's a spatial, visual workspace.

---

## Layout Architecture

```
+----------------------------------------------------------------+
| [Breadcrumb: Page > Section > Container > Text]        [52px]  |
+----------------------------------------------------------------+
|  ┌─── Rulers (optional, togglable) ───────────────────────┐    |
|  │ [R] ┌─────────────────────────────────────────────┐    │    |
|  │ [u] │                                             │    │    |
|  │ [l] │      CANVAS VIEWPORT                        │    │    |
|  │ [e] │      (user's page at device width)          │    │    |
|  │ [r] │                                             │    │    |
|  │     │   ┌──[Selection]──────────────────┐         │    │    |
|  │ [L] │   │  ○────────────────────────○   │         │    │    |
|  │ [e] │   │  │  Selected Element      │   │         │    │    |
|  │ [f] │   │  ○────────────────────────○   │         │    │    |
|  │ [t] │   └──────────────────────────────┘         │    │    |
|  │     │                                             │    │    |
|  │     │   ← Smart Guide ─────────────── →           │    │    |
|  │     │   ← 16px → Spacing Label                    │    │    |
|  │     │                                             │    │    |
|  │     │   👆 Sarah (remote cursor)                  │    │    |
|  │     │                                             │    │    |
|  │     └─────────────────────────────────────────────┘    │    |
|  └────────────────────────────────────────────────────────┘    |
|                                                                |
|  [Footer: Zoom ▾ 100% [+][-][⊞]] [Grid ⊞] [Rulers 📏] [X-ray]|
+----------------------------------------------------------------+
|  [FLOATING: Quick Actions — Copy Paste Duplicate Delete Lock]  |
+----------------------------------------------------------------+
```

### Canvas Background
- Outside the page viewport: `--aqb-canvas-bg` (#F8F9FB) — subtle gray, checkerboard pattern at high zoom
- The page itself: `--aqb-canvas-page` (#FFFFFF) — crisp white, matching a real browser

### Device Viewport Rendering
| Device | Width | Canvas Behavior |
|--------|-------|-----------------|
| Desktop | 1280px | Canvas renders at 1280px width, centered if window is wider |
| Tablet | 768px | Canvas narrows to 768px, centered with gray margins |
| Mobile | 375px | Canvas narrows to 375px, centered with large gray margins |

Canvas scales via CSS `transform: scale()` for zoom. Elements are NOT re-rendered at different sizes — the viewport is scaled. This ensures pixel-perfect WYSIWYG.

---

## Screen States

### State 1: Empty Canvas (No Elements)

**Visual:** White page area centered on gray canvas background. Large empty state message in center.

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│        🎨                          │
│                                    │
│    Start building your page        │
│                                    │
│    Drag elements from the sidebar  │
│    or choose a template            │
│                                    │
│    [Browse Templates]  [Add Tab →] │
│                                    │
│                                    │
└────────────────────────────────────┘
```

**Typography:**
- Icon: 48px, `--buildrick-text-tertiary`
- Heading: `--aqb-heading-md`, `--buildrick-text-secondary`
- Description: `--aqb-body`, `--buildrick-text-tertiary`
- Buttons: Ghost variant, `--buildrick-accent`

### State 2: Active Editing (Elements Present, None Selected)

**Visual:** User's website renders inside the page viewport. Hover highlights appear when mouse moves over elements.

- **Hover highlight:** 1px dashed `--buildrick-accent` at 50% opacity, appears instantly on mousemove
- **No selection indicators** — clean view of the design
- **Breadcrumb hidden** when no element is selected

### State 3: Single Element Selected

**Visual:** Full selection UI visible:

| Overlay Element | Spec |
|-----------------|------|
| **Bounding box** | 1px solid `--buildrick-accent`, with 2px `--aqb-primary-glow` outer glow |
| **Resize handles** | 8 handles (4 corners, 4 edges). 8x8px white squares, 1px `--buildrick-accent` border, `--aqb-elevation-1` shadow |
| **Selection label** | Positioned 4px above top-left of bounding box. `--aqb-caption` text, `--aqb-chrome-surface` bg, `--buildrick-design-radius-sm` corners, 4px 8px padding. Shows element type + name (e.g., "Heading · Hero Title") |
| **Quick Actions toolbar** | Positioned 8px above selection label. Row of icon buttons: Copy, Paste, Duplicate, Delete, Lock. `--aqb-chrome-surface` bg, `--aqb-elevation-2` shadow, `--buildrick-design-radius-md` corners |
| **Breadcrumb** | Top of canvas area. Shows DOM path: "Page > Section > Container > Heading". Each segment clickable to select parent. `--aqb-body-sm`, `--buildrick-text-secondary`, `--buildrick-accent` for hovered segment |

### State 4: Multi-Element Selected

**Visual:** Each selected element gets a bounding box (no handles individually). A combined bounding box wraps all selections.

- **Multi-select badge:** "3 selected" pill at top-right of combined bounding box. `--buildrick-accent` bg, white text, `--aqb-caption` size.
- **Unified toolbar:** Alignment and distribution controls replace the single-element quick actions. 9 alignment buttons (left, center, right, top, middle, bottom, distribute H, distribute V, equal spacing).

### State 5: Drag-in-Progress (From Sidebar)

**Visual:**
- Ghost preview of the element follows cursor at 50% opacity
- Valid drop zones highlight with 2px solid `--buildrick-accent` border
- Insertion line (2px `--buildrick-accent` horizontal bar) shows exact drop position
- Invalid drop targets show no highlight

### State 6: Resize-in-Progress

**Visual:**
- Active handle fills with `--buildrick-accent`
- Dimension labels appear near the element: "320 × 200" in `--aqb-caption` size, `--buildrick-accent` background pill
- Smart guides fire when edges align with siblings/parents (1px solid `#FF6B6B`)
- Spacing labels show distance to nearest neighbors ("16px" in `--buildrick-accent` background pills)

### State 7: Inline Text Editing

**Visual:**
- Text element's bounding box becomes an editable text cursor
- Floating rich text toolbar appears 8px above: Bold, Italic, Underline, Strikethrough, Link, Text Color, Font Size. `--aqb-chrome-surface` bg, `--aqb-elevation-2`.
- Text selection uses browser-native selection rendering
- Click outside or Escape to exit

### State 8: Preview Mode

**Visual:**
- ALL editing UI disappears (selection boxes, handles, guides, quick actions, breadcrumb, footer toolbar)
- Canvas fills the full space (sidebar and inspector hide)
- Top bar shows only: "Preview Mode" label + "Exit Preview" button + device selector
- Interactions become active (click handlers, hover effects, scroll triggers)
- Semi-transparent overlay bar at top: "PREVIEW MODE — interactions are active" with [Exit] button

### State 9: X-Ray Mode (Dev Overlay)

**Visual:**
- Each element gets a colored border based on its type:
  - Containers/Sections: blue dashed
  - Text: green dashed
  - Images/Media: purple dashed
  - Forms: orange dashed
- z-index values shown as small badges at top-right of each element
- CSS class names shown as labels below each element's type badge
- Useful for developer handoff understanding

### State 10: Collaboration Active

**Visual:**
- Remote cursors: 12px arrow icons in collaborator's assigned color, with username label
- Remote selections: Colored bounding boxes (same color as cursor) around elements other users have selected
- Soft lock badges: "Sarah is editing" label on locked elements, using collaborator's color
- All collaboration overlays render at z-index 200-299 (above selection, below menus)

---

## Interaction Specifications

### Selection

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click element | Select (deselect previous). Highlight appears on `mousedown`, not `mouseup`. | Instant (0ms) |
| Shift+Click | Toggle element in multi-selection | Instant |
| Ctrl+Click | Add element to multi-selection | Instant |
| Click empty space | Clear all selection | Instant |
| Escape | Clear selection or exit current mode | Instant |
| Marquee drag (on empty space) | Draw rectangle → select all fully enclosed elements | Rectangle follows mouse at 60fps |

### Drag-and-Drop

| Phase | Visual Feedback | Performance |
|-------|----------------|-------------|
| Drag start (from sidebar) | Ghost preview at 50% opacity follows cursor | Immediate on mousedown + 3px movement threshold |
| Drag over canvas | Drop zones highlight with `--buildrick-accent` border; insertion line shows position | 60fps cursor tracking |
| Drag over invalid target | No highlight; cursor shows "not-allowed" | Immediate |
| Drop | Element created at insertion point; auto-selected | Instant creation, canvas re-render < 16ms |
| Auto-scroll | Canvas scrolls when cursor is within 40px of edge | Smooth scroll, 8px/frame |

### Resize

| Modifier | Behavior |
|----------|----------|
| Default drag | Free resize from dragged edge/corner |
| Shift+drag | Maintain aspect ratio |
| Alt+drag | Resize from center (symmetric) |
| Shift+Alt+drag | Both constraints combined |

### Context Menu (Right-Click)

```
┌─────────────────────────────┐
│ Edit                    ▸   │
│ ├ Copy              ⌘C      │
│ ├ Cut               ⌘X      │
│ ├ Paste             ⌘V      │
│ ├ Duplicate         ⌘D      │
│ ├ Rename                    │
│ └ Delete            ⌫       │
│─────────────────────────────│
│ Insert              ▸       │
│ ├ Add Element               │
│ ├ Add Component             │
│ └ Add Block                 │
│─────────────────────────────│
│ Layout              ▸       │
│ ├ Align Left                │
│ ├ Align Center              │
│ ├ Align Right               │
│ ├ ──────────                │
│ ├ Bring Forward     ]       │
│ ├ Send Backward     [       │
│ ├ Bring to Front    ⌘]      │
│ └ Send to Back      ⌘[      │
│─────────────────────────────│
│ Switch Variant      ▸       │  ← Only for component instances
│ ├ Primary ✓                 │
│ ├ Secondary                 │
│ └ Outline                   │
│─────────────────────────────│
│ Lock / Unlock       ⌘L      │
│ Hide / Show                 │
│ Export as Image              │
└─────────────────────────────┘
```

**Visual spec:** `--aqb-chrome-surface` background, `--aqb-elevation-2` shadow, `--buildrick-design-radius-md` corners, 8px vertical padding, 240px width. Items: `--aqb-body` text, `--buildrick-text-secondary` for shortcuts. Hover: `--aqb-chrome-surface-hover` background. Dividers: 1px `--aqb-chrome-border`.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected |
| ⌘D | Duplicate |
| ⌘C / ⌘V / ⌘X | Copy / Paste / Cut |
| ⌘A | Select all on page |
| ⌘K | Command palette |
| ⌘G / ⌘⇧G | Group / Ungroup |
| Arrow keys | Move 1px |
| Shift+Arrows | Move 10px |
| [ / ] | Send backward / forward |
| ⌘[ / ⌘] | Send to back / front |
| ? | Show keyboard cheat sheet |
| Space+drag | Pan canvas |
| ⌘+scroll | Zoom |

### Command Palette (⌘K)

```
┌─────────────────────────────────────┐
│ 🔍 Type a command...                │
│─────────────────────────────────────│
│ Recently Used                       │
│   ↺ Duplicate Element          ⌘D  │
│   ↺ Toggle Grid                     │
│─────────────────────────────────────│
│ All Commands                        │
│   ◻ Insert Hero Section             │
│   ◻ Insert CTA Section              │
│   🎨 Change Primary Color           │
│   📱 Switch to Mobile               │
│   📦 Create Component               │
└─────────────────────────────────────┘
```

**Visual:** Centered overlay, 480px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-3` shadow, `--buildrick-design-radius-xl` corners. Search input at top with auto-focus. Results use `--aqb-body` text, fuzzy-matched characters highlighted in `--buildrick-accent`.

---

## Footer Toolbar

```
┌────────────────────────────────────────────────────────┐
│ [100% ▾] [−] [+] [⊞ Fit]  │  [Grid ⊞] [Rulers 📏] [X-ray 🔍] │
└────────────────────────────────────────────────────────┘
```

**Position:** Fixed to bottom-right of canvas area, 40px height, `--aqb-chrome-surface` bg with 80% opacity + backdrop blur, `--buildrick-design-radius-lg` top corners.

| Control | Behavior | Visual |
|---------|----------|--------|
| Zoom dropdown | Click: shows preset list (25%, 50%, 75%, 100%, 150%, 200%). Also accepts direct number input. | `--aqb-body` text |
| Zoom +/- | Increment/decrement by 10% | Icon buttons, `--buildrick-text-secondary` |
| Fit | Auto-calculate zoom to show entire page | Icon button |
| Grid toggle | Show/hide pixel grid overlay | Toggle, active = `--buildrick-accent` |
| Rulers toggle | Show/hide top + left rulers | Toggle, active = `--buildrick-accent` |
| X-ray toggle | Show/hide dev overlay (boundaries, z-index, classes) | Toggle, active = `--buildrick-warning` |

---

## Performance Requirements

| Metric | Target | Rationale |
|--------|--------|-----------|
| Selection → Inspector populate | < 16ms | One frame. No perceived delay. |
| Style change → Canvas re-render | < 16ms | Live preview must feel direct. |
| Drag frame rate | 60fps | Smooth drag-and-drop experience. |
| Smart guide calculation | < 8ms per frame | Must not cause jank during drag. |
| 500+ elements rendering | 60fps | Virtual rendering for off-screen elements. |
| Zoom in/out | < 16ms per step | CSS transform scale, no re-render. |

---

## Accessibility

- **Tab order:** Canvas elements are not in the tab order (they use custom keyboard navigation via arrow keys when canvas is focused)
- **Screen reader:** Canvas announces selected element type and name: "Selected: Heading, Hero Title. Use arrow keys to move, Delete to remove."
- **Focus:** Canvas has a visible focus ring when tabbed to. Once focused, keyboard shortcuts become active.
- **Reduced motion:** Drag ghost follows cursor without animation. No spring effects on drop.
- **Color independence:** Selection is indicated by both color (blue bounding box) AND pattern (handles, label badge) — not color alone.

---

## Implementation Notes

- Canvas renders in a dedicated `<div>` with `position: relative` and `overflow: hidden`
- Element rendering uses the actual DOM (not virtual canvas/SVG) for WYSIWYG fidelity
- Zoom is achieved via `transform: scale()` on the canvas container, NOT by resizing elements
- Selection overlays are absolute-positioned siblings to the canvas, not children of elements
- Smart guides use a pre-computed alignment cache that updates on element add/remove/move
- Remote cursors are rendered in a separate overlay layer at z-index 200+
- All canvas interactions go through DragManager (state machine: IDLE → PENDING → DRAGGING → IDLE)

---

## Related Documentation
- [Inspector](../inspector/README.md) — Bidirectional selection sync
- [Layers Tab](../layers-tab/README.md) — Bidirectional selection sync
- [Add/Build Tab](../add-build-tab/README.md) — Element source for drag-drop
- [Collaboration](../collaboration/README.md) — Remote cursors and conflict resolution
- [Style Guide](../../design-system/style-guide.md) — Color tokens and selection system
