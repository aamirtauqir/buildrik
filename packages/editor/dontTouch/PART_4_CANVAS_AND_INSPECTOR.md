# PART 4 — CANVAS AND INSPECTOR

**Extracted from:** `prd_final.md` (2026-03-12)
**Scope:** Canvas purpose, region, default/empty states, selection model, hover/focus/selected behaviors, resize/move/insert, guides/snap/drop zones, floating toolbar, overlays, canvas states/edge cases, inspector purpose/structure/tabs/grouping, property editing, multi-select, breakpoint editing, pseudo-state editing, inspector empty states, canvas↔inspector sync, editing power features, anti-regression warnings.
**Rule:** Current capability is the FLOOR, not the ceiling.

---

## 4.1 Canvas Purpose and Region

The canvas is the central editing surface where users visually design their web pages. It occupies the flexible center zone of the editor shell.

**Region spec:**
- Width: `flex: 1` (fills space between rail+sidebar and inspector)
- Height: `viewport − 52px (top bar) − 40px (canvas footer)`
- Background (surrounding area / content): `#FFFFFF` (`--aqb-bg-canvas`)
- Background (content area): `#FFFFFF` (same token — `--aqb-bg-canvas`)
- z-index: 1
- ARIA: `role="application"`, `aria-label="Canvas editing area"` (uses `role="application"` because canvas has custom keyboard handling)

**Canvas manages its own scroll/zoom:**
- No browser-level scrollbars
- Zoom/pan via `Viewport` manager (`composer.viewport`) — zoom via `viewport.setZoom()`
- Transform-based positioning

**Device breakpoints (canvas content width):**

| Device | Content Width | Shortcut |
|--------|-------------|----------|
| Desktop | 1920px (engine) / 100% (render) / 1440px (UI label) | Ctrl+1 |
| Tablet | 768px | Ctrl+2 |
| Mobile | 375px | Ctrl+3 |
| Watch | 196px | Ctrl+4 |

---

## 4.2 Canvas Default State

### New Project — Blank Canvas

| Property | Value |
|----------|-------|
| Canvas background | `#FFFFFF` (`--aqb-bg-canvas`) |
| Canvas content area | Not rendered (no white area until content exists) |
| CanvasEmptyCTA | Visible, centered |
| Sidebar | Closed (no panel open) |
| Inspector | IS-1 (InspectorEmptyState) |
| Top bar | All controls available. Save status: "New project". Device: Desktop. |
| Zoom | 100% |
| Overlays | All off (Guides, Spacing, Grid, Badges, X-Ray, Rulers) |
| Selection | None |
| OnboardingChecklist | Visible if first-ever visit (floating bottom-right) |

**After user clicks "Start Blank" on CanvasEmptyCTA:**

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Dismissed (hidden) |
| Canvas content area | Rendered as empty white `<body>` — `background: #FFFFFF; min-height: 100vh; width: [device width]` |
| OnboardingChecklist | Step 1 highlighted: "Drag an element to start" with pulsing arrow toward rail Add icon |
| Sidebar | Build tab auto-opens if OnboardingChecklist is active |

### New Project — Template Applied

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Hidden (never shown) |
| Canvas content area | Template HTML structure rendered, full content visible |
| OnboardingChecklist | Step 1 `add-element` auto-completed. Step 2 highlighted: "Edit some text" |
| Sidebar | Closed |
| Inspector | IS-1 (no selection) |
| Zoom | Auto-calculated to fit template content (`composer.viewport.setZoom()`) |

### Returning User — Session Restore

| Property | Value |
|----------|-------|
| Canvas content | Restored from last auto-save or manual save |
| Selection | None (not persisted across sessions) |
| Sidebar | Restored to last panel state via `localStorage` |
| Inspector | IS-1 (no selection on load) |
| Zoom | Restored from `localStorage` |
| Overlays | Restored from `localStorage` |
| Save status | "Auto-saved [relative time]" or "Saved at [time]" |
| OnboardingChecklist | Hidden if all steps completed. Visible if incomplete. |

---

## 4.3 Canvas Empty State (CanvasEmptyCTA)

**Shown when:** New project, no content, no template applied.

**Layout (centered on canvas):**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                  [layout icon, 40px]                     │
│                                                          │
│          "Start building your site"                      │  font: 18px Inter; weight: 600; color: #F5F5F0
│          "Choose a template or start from scratch"       │  font: 13px Inter; color: #B8B5AD
│                                                          │
│       [Browse Templates]        [Start Blank]            │  primary button + ghost button
│                                                          │
└─────────────────────────────────────────────────────────┘
```

- Card: `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 12px; padding: 32px; text-align: center; shadow: var(--aqb-shadow-md)`
- "Browse Templates" → opens Templates tab in sidebar
- "Start Blank" → creates empty `<body>` page, CTA disappears

---

## 4.4 Selection Model

### 4.4.1 Single Selection

**Trigger:** Click element on canvas, click element in Layers tree, or click via context menu "Select from stack" submenu.

**Visual spec:**
- Selected outline: `2px solid #6366f1` (`--aqb-primary`) on element bounding box
- Resize handles: 8 handles (see §4.6)
- Floating toolbar: positioned above element (see §4.8)
- Layers tree: corresponding node highlighted with `background: rgba(99,102,241,0.12)`; tree auto-scrolls (`scrollIntoView({ behavior: 'smooth', block: 'nearest' })`)

**Inspector behavior:**
- Transitions to IS-2 (full inspector)
- If element type changed: tab preserved but sections may change (e.g., Flexbox section appears/disappears based on display value)
- Scroll position within tab: preserved if same tab, reset to top if tab changes

**Canvas behavior:**
- If element is outside viewport: canvas auto-scrolls to center element
- Hover outlines on other elements still active (suppressed on selected element)

### 4.4.2 Multi-Selection

**Method 1 — Shift+click:**
- From single: Shift+click another element → both selected
- From multi: Shift+click selected element → removes from selection (toggle)
- From multi: Shift+click unselected element → adds to selection
- Order: selection order preserved (first selected = primary for alignment reference)

**Method 2 — Marquee select (CS-9):**
- Mousedown on empty canvas area + drag
- Marquee rectangle: `border: 1px dashed #6366f1; background: rgba(99,102,241,0.08)` with animated dash offset
- All elements whose bounding box **intersects** (not fully contained) are selected on release
- Zero intersected: selection cleared → state `none`

**Method 3 — Ctrl+A (Select All):**
- Selects all elements on current page
- Inspector: IS-3 (MultiSelectToolbar) with count = total elements

**Multi-select canvas visuals:**
- Each selected element: `2px solid #6366f1` outline (no resize handles on individuals)
- Group bounding box: `1px dashed rgba(99,102,241,0.4)` around collective bounds
- Floating toolbar replaced by MultiSelectToolbar above group bounding box
- Drag any selected element → all move together (maintaining relative positions)

### 4.4.3 Selection Context Menu — Select from Stack

**Purpose:** When elements overlap, right-click → "Select from stack" reveals all elements at click coordinates.

**Implementation:** `document.elementsFromPoint(clientX, clientY)`, filtered to canvas-managed elements.

**Submenu spec:**
- Same container style as parent context menu
- Position: right-aligned to parent; if no room: left of parent
- Each entry: `height: 32px; padding: 0 12px; display: flex; align-items: center; gap: 8px`
  - Icon: element-type-specific Lucide icon, `14×14px`, `color: #908D85`
  - Label: `"[Element Type]"` — `font: 13px Inter; color: #F5F5F0`
  - Sub-label (if custom name/ID): `" — [name]"` — `font: 11px Inter; color: #908D85`
- Hover: `background: var(--aqb-surface-3)`
- Canvas preview on hover: hovered entry's element shows teal highlight outline (`2px solid rgba(20,184,166,0.6)` — hardcoded, no token)
- Click: selects element, closes entire context menu

**Stack order:** topmost (highest z-index) first, bottommost last.

---

## 4.5 Selection State Machine

5 states: `none`, `single`, `multi`, `inline-edit`, `context-menu`

| # | Current State | Trigger | Next State | Side Effects |
|---|--------------|---------|-----------|-------------|
| S1 | `none` | Click element on canvas | `single` | Indigo outline + resize handles + floating toolbar. Inspector: IS-2. Layers: scroll + highlight. aria-live: `"[type] selected"` |
| S2 | `none` | Click element in Layers tree | `single` | Same as S1 + canvas scrolls/zooms to show element |
| S3 | `single` | Click same element | `single` | No change |
| S4 | `single` | Click different element | `single` | Previous deselected. New selected. Inspector updates. |
| S5 | `single` | Click empty canvas area | `none` | Deselected. Inspector: IS-1. Floating toolbar hidden. |
| S6 | `single` | Shift+click another element | `multi` | Both selected. Inspector: IS-3 (MultiSelectToolbar). Group bounding box. |
| S7 | `single` | Escape | `none` | Deselected. |
| S8 | `single` | Double-click (text element) | `inline-edit` | contenteditable. Outline: `#818cf8`. Floating toolbar → text formatting. Inspector Typography auto-expands. |
| S9 | `single` | Double-click (non-text) | `single` | No change. Only text supports inline edit. |
| S10 | `single` | Right-click | `context-menu` | Context menu at cursor. Selection preserved. |
| S11 | `single` | Drag on empty canvas | `none` → `marquee` | Marquee begins. Previous selection cleared. |
| S12 | `multi` | Click single element (no Shift) | `single` | Multi cleared. Only clicked element selected. |
| S13 | `multi` | Shift+click selected element | `multi` or `single` | Removed from selection. If 1 remains → `single`. |
| S14 | `multi` | Shift+click unselected element | `multi` | Added to selection. Count updates. |
| S15 | `multi` | Escape | `none` | All deselected. Inspector: IS-1. |
| S16 | `multi` | Delete | `none` | All deleted (ConfirmDialog if > 3 elements). |
| S17 | `inline-edit` | Escape | `single` | Text committed. Returns to selected state. |
| S18 | `inline-edit` | Click outside element | `single` or `none` | Text committed. If clicked another → S4. If empty → S5. |
| S19 | `inline-edit` | Tab | `single` (next element) | Text committed. Next sibling selected (if exists). |
| S20 | `context-menu` | Click menu item | varies | Action executed. Menu closes. |
| S21 | `context-menu` | Escape | `single` or `multi` | Menu closes. Previous selection preserved. |
| S22 | `context-menu` | Click outside menu | `single` or `multi` | Menu closes. Previous selection preserved. |
| S23 | `none` | Ctrl+A | `multi` | All elements selected. Inspector: IS-3. |
| S24 | marquee | Mouse release | `none`, `single`, or `multi` | 0 = `none`. 1 = `single`. 2+ = `multi`. |

---

## 4.6 Hover, Focus, and Selected Behaviors

### Hover (useCanvasHover)

- Mouse over element → teal outline: `2px solid rgba(20,184,166,0.6)` (hardcoded — no `--aqb-teal` token exists; closest token is `--aqb-accent-cyan: #22d3ee`)
- Element type badge: `font: 10px Inter; font-weight: 500; color: #FFFFFF; background: rgba(20,184,166,0.8); padding: 1px 6px; border-radius: 3px; position: absolute; top: -16px; left: 0`
- Badge shows: element type (e.g., "Section", "Heading", "Image")
- Hover outline suppressed on already-selected element (selected outline takes priority)
- Transition: opacity fade in 100ms ease

### Focus (Keyboard)

- Tab navigation moves focus between zones (Rail → Sidebar → Canvas → Inspector)
- Within canvas: focused element gets focus ring: `outline: 2px solid #6366f1; outline-offset: 2px`
- Arrow keys: nudge selected element 1px
- Shift+Arrow: nudge 10px

### Selected

- Indigo outline: `2px solid #6366f1` on bounding box
- 8 resize handles (see §4.7)
- Floating toolbar above element (see §4.8)
- Element type badge NOT shown (replaced by floating toolbar)
- Outline appears instantly (0ms, no animation)

---

## 4.7 Resize, Move, and Insert

### Resize Handles (8 points)

Each handle:
- `width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF; border: 1.5px solid #6366f1`
- Positioned at: top-left, top-center, top-right, middle-left, middle-right, bottom-left, bottom-center, bottom-right
- Hover cursor: `nw-resize`, `n-resize`, `ne-resize`, `w-resize`, `e-resize`, `sw-resize`, `s-resize`, `se-resize`
- During drag: element resizes live; dimension tooltip appears near cursor: `"320 × 240"` — `font: 11px JetBrains Mono; background: rgba(0,0,0,0.75); color: #FFFFFF; padding: 2px 8px; border-radius: 4px`
- Shift held during drag: proportional resize (aspect ratio locked)
- Alt held during drag: resize from center (both sides move)

### Move (useCanvasElementDrag)

- Drag selected element → element becomes semi-transparent (opacity: 0.6)
- Snap lines activate during drag (see §4.9)
- Shift held during drag: constrain to horizontal or vertical axis
- Drop position: element moves to new position
- canvas Spring easing on release: GSAP `elastic.out(1, 0.5)` — subtle bounce

### Insert from Sidebar (useCanvasDragDrop)

**Drag from Build tab to canvas (drop zone behavior):**

1. Drag start: element card goes to 50% opacity at source position; ghost (DragGhost) renders at cursor with element icon + label, `--aqb-surface-4` bg, `shadow-md`, border-radius: 8px
2. During drag: canvas highlights valid drop targets (dashed teal border `2px dashed rgba(20,184,166,0.6)`), invalid targets (red border `2px dashed rgba(239,68,68,0.4)` + "Cannot drop here" label), and shows insert position indicator (animated horizontal line between elements)
3. Drop: element inserted at position; ghost disappears; element auto-selected on canvas
4. Cancel (Escape during drag): ghost disappears, no insertion

**Click behavior (alternative to drag):** Click on element card → element inserted at end of active page / inside selected container.

---

## 4.8 Guides, Snap Lines, and Drop Zones

### Snap Lines (useCanvasSnapping)

- **Threshold:** 6px — when a moving/resizing element edge comes within 6px of another element's edge or center, a snap line appears
- **Horizontal snap:** magenta line (`backgroundColor: #FF00FF; opacity: 0.85; boxShadow: 0 0 3px rgba(255,0,255,0.4)`) spanning full canvas width at snap position
- **Vertical snap:** magenta line spanning full canvas height
- **Snap types:** edge-to-edge, center-to-center, edge-to-center
- **Line thickness:** zoom-aware — `1 / (zoom / 100)` px visual thickness regardless of zoom level
- **Distance labels:** not yet implemented in code (placeholder exists in `SmartGuidesOverlay.tsx`)

### Ruler Guides

- Horizontal and vertical rulers on canvas edges (when `showRulers` toggle is ON in canvas footer)
- Ruler: `height: 20px` (horizontal) or `width: 20px` (vertical)
- Background: `var(--aqb-surface-2)`
- Tick marks: every 10px small, every 50px medium, every 100px large with number label
- Click on ruler: creates guide line (draggable, deletable)
- Guide line: `1px solid rgba(20,184,166,0.5)`, full width/height

### Drop Zones

| State | Visual |
|-------|--------|
| Valid drop target | `border: 2px dashed rgba(20,184,166,0.6); background: rgba(20,184,166,0.04)` |
| Invalid drop target | `border: 2px dashed rgba(239,68,68,0.4); background: rgba(239,68,68,0.04)` + "Cannot drop here" label |
| Insert position indicator | Animated horizontal line between elements: `2px solid #6366f1; animation: insert-pulse 1s ease infinite` |

---

## 4.9 Floating Toolbar

**Positioned above selected element, centered horizontally.**

```
┌─────────────────────────────────────────────────────────────────┐
│ [↑parent] [⊕dup] [↑move-up] [↓move-down] [📋copy] [⊞wrap] [🗑] │
└─────────────────────────────────────────────────────────────────┘
```

**Container:**
- `height: 36px; display: inline-flex; align-items: center; gap: 2px; padding: 4px`
- `background: var(--aqb-surface-2)` (`#16161d`)
- `border: 1px solid var(--aqb-border-light)` (`rgba(255,255,255,0.12)`)
- `border-radius: 8px`
- `shadow: var(--aqb-shadow-md)` (`0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.25)`)
- Position: `12px` above the top edge of the selected element, centered. If too close to top bar: repositions below element.
- z-index: 200

**7 buttons (each):**
- `width: 28px; height: 28px; border-radius: 6px; background: transparent; border: none; color: #B8B5AD; cursor: pointer`
- Icon: Lucide, 16px
- Hover: `background: var(--aqb-surface-3); color: #F5F5F0`
- Active/Pressed: `background: var(--aqb-surface-4)`
- Tooltip on hover (300ms delay): action name + shortcut

| # | Icon (Lucide) | Action | Tooltip | Shortcut |
|---|---------------|--------|---------|----------|
| 1 | `arrow-up-from-dot` | Select parent element | "Select Parent" | — |
| 2 | `copy-plus` | Duplicate element | "Duplicate — Ctrl+D" | Ctrl+D |
| 3 | `chevron-up` | Move up in sibling order | "Move Up — Ctrl+]" | Ctrl+] |
| 4 | `chevron-down` | Move down in sibling order | "Move Down — Ctrl+[" | Ctrl+[ |
| 5 | `clipboard-copy` | Copy element to clipboard | "Copy — Ctrl+C" | Ctrl+C |
| 6 | `square-dashed-bottom` | Wrap in container | "Wrap in Container" | — |
| 7 | `trash-2` | Delete element | "Delete — Del" | Delete |

**Delete button**: `color: #B8B5AD`. Hover: `color: #ef4444; background: rgba(239,68,68,0.12)`.
Click → ConfirmDialog: "Delete this [type]? This cannot be undone." + [Delete] destructive + [Keep] ghost.

---

## 4.10 Canvas Overlays

7 overlay types, toggled via canvas footer toolbar.

| # | Overlay | Toggle Label | Default | Visual When Active |
|---|---------|-------------|---------|-------------------|
| 1 | Element outlines | Guides | ON | Teal outlines on all elements |
| 2 | Ruler guides | — (managed by Rulers toggle) | OFF | Horizontal/vertical guide lines |
| 3 | Spacing indicators | Spacing | OFF | Pink/purple distance indicators between elements |
| 4 | Element type badges | Badges | OFF | Small labels showing element type on each element |
| 5 | Grid overlay | Grid | OFF | Dot grid or line grid over canvas |
| 6 | Ruler bars | Rulers | OFF | Pixel rulers on canvas edges |
| 7 | X-Ray mode | X-Ray | OFF | Wireframe view (see below) |

### Canvas Footer Toolbar

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Guides ●] [Spacing] [Grid] [Badges] [X-Ray] [Rulers]     [-] 100% [+] [Fit] [?] │
└───────────────────────────────────────────────────────────────────────────┘
Height: 40px | Background: --aqb-surface-1 | Border-top: 1px solid rgba(255,255,255,0.08)
```

**Each overlay toggle button:**
- `height: 28px; padding: 0 10px; border-radius: 6px; font: 11px Inter; font-weight: 500; cursor: pointer; border: none`
- OFF state: `background: transparent; color: #908D85`. Hover: `background: var(--aqb-surface-3); color: #B8B5AD`
- ON state: `background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3)`
- Active indicator (ON): small `6px` dot `background: #818cf8; border-radius: 50%` inside button, left of text

**Zoom controls (right side of footer):**
- Zoom out `[-]`: icon button, 28×28px
- Zoom level `[100%]`: text, 11px mono, click opens zoom dropdown (25%, 50%, 75%, 100%, 125%, 150%, 200%)
- Zoom in `[+]`: icon button, 28×28px
- Zoom to fit `[Fit]`: icon button (Lucide `maximize-2`), 28×28px
- Help `[?]`: icon button (Lucide `help-circle`), 28×28px — opens keyboard shortcuts modal

### X-Ray Mode (CS-11)

When X-Ray is toggled ON:
- Canvas background: `#1a1a2e` (dark blue)
- All elements rendered as wireframe: `outline: 1px solid rgba(255,255,255,0.3); background: transparent`
- Element type labels: `font: 9px JetBrains Mono; color: rgba(255,255,255,0.5)` — top-left of each element
- Images replaced with placeholder icon
- Text content visible but dimmed
- Colors stripped — everything monochrome
- Purpose: structure inspection without visual distraction

---

## 4.11 Canvas States and Edge Cases

### Full Canvas State Table (17 states)

| # | State ID | Name | Trigger | Canvas Visual | Inspector State |
|---|---------|------|---------|--------------|-----------------|
| CS-1 | idle | No selection, content loaded | Default after page load | Content visible, no outlines on selected | IS-1 (empty) |
| CS-2 | hover | Hovering over element | Mouse enter element | Teal outline on hovered element + type badge | IS-1 (unchanged) |
| CS-3 | selected | Single element selected | Click element | Indigo outline + 8 resize handles + floating toolbar | IS-2 (full inspector) |
| CS-4 | selected-post-action | After insert/drop/duplicate | Automatic after action | Same as CS-3 | IS-2 |
| CS-5 | multi-selected | 2+ elements selected | Shift+click, marquee, Ctrl+A | Indigo outlines on each + group bounding box + MultiSelectToolbar | IS-3 (multi-select) |
| CS-6 | inline-edit | Text element inline editing | Double-click text element | Lighter indigo outline (`#818cf8`) + cursor + text formatting toolbar | IS-2 (Typography auto-expanded) |
| CS-7 | drag-from-sidebar | Dragging element from Build tab | Drag start from Build tab | Drop zones highlighted (teal valid, red invalid) + insert indicator | IS-1 (unchanged) |
| CS-8 | drag-within-canvas | Repositioning element | Drag selected element | Element semi-transparent + snap lines active | IS-2 (unchanged) |
| CS-9 | marquee | Drawing marquee rectangle | Mousedown on empty + drag | Dashed indigo rectangle | IS-1 (during drag) |
| CS-10 | resize | Resizing element via handle | Drag resize handle | Handles active + dimension tooltip | IS-2 (values update live) |
| CS-11 | x-ray | X-Ray mode active | Footer toggle | Wireframe view: dark bg, outlines, type labels | IS state unchanged |
| CS-12 | dev-mode | Dev Mode active | Inspector DevModeToggle | Normal canvas + code indicator badge on elements | IS-2 with CSS editor visible |
| CS-13 | component-view | Component boundaries visible | Ctrl+Shift+C toggle | Component instances have purple dashed border | IS state unchanged |
| CS-14 | guides-visible | Guides overlay active | Footer toggle "Guides" | Teal outlines on all elements | IS state unchanged |
| CS-15 | spacing-visible | Spacing overlay active | Footer toggle "Spacing" | Pink distance indicators between elements | IS state unchanged |
| CS-16 | grid-visible | Grid overlay active | Footer toggle "Grid" | Dot or line grid over canvas | IS state unchanged |
| CS-17 | badges-visible | Badges overlay active | Footer toggle "Badges" | Type labels on each element | IS state unchanged |

**Notes:**
- CS-11 through CS-17 are overlay states that can be combined with CS-1 through CS-10 (they are not mutually exclusive with interaction states)
- CS-11 (X-Ray) and CS-12 (Dev Mode) change the fundamental canvas rendering
- CS-14 through CS-17 are additive overlays

### Context Menu (CS-10 trigger: right-click)

**Container:**
- `min-width: 200px; max-width: 280px; padding: 4px 0`
- `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border-light); border-radius: 8px; shadow: var(--aqb-shadow-md)`
- z-index: 5000

**Menu items:**

| # | Item | Icon (Lucide) | Shortcut | Condition |
|---|------|---------------|---------|-----------|
| 1 | Select | `mouse-pointer` | — | Always |
| 2 | Select from stack → | `layers` | — | When overlapping elements exist. Opens submenu. |
| — | separator | — | — | — |
| 3 | AI: Improve this element | `sparkles` | — | Always |
| — | separator | — | — | — |
| 4 | Cut | `scissors` | Ctrl+X | Always |
| 5 | Copy | `copy` | Ctrl+C | Always |
| 6 | Paste | `clipboard` | Ctrl+V | Clipboard not empty |
| 7 | Duplicate | `copy-plus` | Ctrl+D | Always |
| — | separator | — | — | — |
| 8 | Wrap in Container | `square-dashed-bottom` | — | Always |
| 9 | Create Component | `component` | — | Always |
| 10 | Show in Layers | `layers` | — | Always |
| — | separator | — | — | — |
| 11 | Bring to Front | `chevrons-up` | Ctrl+Shift+] | Always |
| 12 | Bring Forward | `chevron-up` | Ctrl+] | Always |
| 13 | Send Backward | `chevron-down` | Ctrl+[ | Always |
| 14 | Send to Back | `chevrons-down` | Ctrl+Shift+[ | Always |
| — | separator | — | — | — |
| 15 | Delete | `trash-2` | Del | Always. Styled destructive (red on hover). |

**Each menu item:** `height: 32px; padding: 0 12px; display: flex; align-items: center; gap: 8px`
- Icon: 14px, `color: #908D85`
- Label: `font: 13px Inter; color: #F5F5F0`
- Shortcut: `font: 11px JetBrains Mono; color: #5a584f; margin-left: auto`
- Hover: `background: var(--aqb-surface-3)`
- Destructive hover: `background: rgba(239,68,68,0.12); color: #ef4444`
- Separator: `height: 1px; background: var(--aqb-border-subtle); margin: 4px 8px`

**Keyboard navigation within menu:**
- Arrow Down: next item (wraps)
- Arrow Up: previous item (wraps)
- Enter: execute item
- Escape: close menu
- Right Arrow on "Select from stack": open submenu
- Left Arrow in submenu: close submenu

---

## 4.12 Inspector Purpose and Structure

The inspector occupies the right panel (280px default, expandable to 400px). It shows properties of the selected element and provides controls to modify all CSS and behavioral properties.

### Inspector States

| # | State | Trigger | Content |
|---|-------|---------|---------|
| IS-1 | Empty (no selection) | No element selected | InspectorEmptyState: page info + quick tips |
| IS-2 | Full (single element) | One element selected | Full header + 3 tabs + all sections |
| IS-3 | Multi-select | 2+ elements selected | MultiSelectToolbar: align/distribute/size/actions |
| IS-4 | Pseudo-state editing | Pseudo-state button clicked | IS-2 with amber banner + override indicators |
| IS-5 | Dev Mode | DevModeToggle ON | IS-2 with CSS editor visible in Effects tab |

### Inspector Header (8 rows)

The inspector header is fixed (does not scroll with section content).

```
ROW 1: [Element Type Icon 16px] [Element Name 14px semibold] [</> DevMode toggle] [× delete]
ROW 2: [Tag badge: <div>] [ID: #abc12 (click to copy)] [Delete button (trash icon)]
ROW 3: [Breadcrumb: body > section > div.hero] — click any segment to select that element
ROW 4: [Layout] [Style] [Behavior] — 3 tab buttons (internal IDs: layout, appearance, effects; display labels: "Layout", "Style", "Behavior")
ROW 5: [Desktop] [Tablet] [Mobile] [Watch] — BreakpointIndicator pills
ROW 6: [Normal] [Hover] [Focus] [Active] [Disabled] — PseudoStateSelector buttons
ROW 7: [Search sections...] input
ROW 8: [Collapse All] [Expand All] — toggle buttons
```

**ROW 1 spec:**
- Element icon: Lucide icon matching element type, 16px, `color: #B8B5AD`
- Element name: `font: 14px Inter; font-weight: 600; color: #F5F5F0` — editable (click to rename)
- DevModeToggle: Lucide `code-2`, 16px. OFF: `color: #908D85`. ON: `color: #6366f1; background: rgba(99,102,241,0.12); border-radius: 4px`. Tooltip: "Toggle Dev Mode"
- Delete button: Lucide `trash-2`, 16px, `color: #908D85`. Hover: `color: #ef4444`. Click → ConfirmDialog.

**ROW 2 spec:**
- Tag badge: `font: 11px JetBrains Mono; background: var(--aqb-surface-3); color: #A09D96; padding: 2px 6px; border-radius: 4px`
- Element ID: `font: 11px JetBrains Mono; color: #A09D96`. Click → copies to clipboard + toast "Element ID copied"
- Delete button: Lucide `trash-2`, 16px, `color: #908D85`. Hover: `color: #ef4444`. Click → ConfirmDialog.

**ROW 3 — Breadcrumb:**
- `font: 11px Inter; color: #908D85`
- Separator: ` > ` in `--aqb-text-muted` (#908D85) (note: `--aqb-text-dim` does not exist; use `--aqb-text-muted` or `--aqb-text-tertiary`)
- Each segment clickable: selects that element on canvas + inspector updates
- Last segment (current): `font-weight: 500; color: #F5F5F0`
- Overflow: horizontal scroll, fade mask on edges

**ROW 4 — Tabs:**
- 3 tabs: Layout / Style / Behavior (internal IDs: `layout` / `appearance` / `effects`; display labels: `"Layout"` / `"Style"` / `"Behavior"`)
- Active: `font: 13px Inter; font-weight: 600; color: #F5F5F0; border-bottom: 2px solid #6366f1`
- Inactive: `font: 13px Inter; font-weight: 400; color: #B8B5AD; border-bottom: 2px solid transparent`. Hover: `color: #F5F5F0`
- Tab bar: `height: 36px; border-bottom: 1px solid var(--aqb-border)`
- ARIA: `role="tablist"` on container, `role="tab"` + `aria-selected` on each

**ROW 5 — BreakpointIndicator:**
- 4 pills: Desktop / Tablet / Mobile / Watch
- Active pill: `background: var(--aqb-primary); color: #FFFFFF; font-weight: 500`
- Inactive pill: `background: var(--aqb-surface-3); color: #B8B5AD`
- Each pill: `height: 24px; padding: 0 8px; border-radius: 12px; font: 11px Inter; gap: 4px`
- Click: switches device breakpoint (same as top bar device switcher)

**ROW 6 — PseudoStateSelector:**
- 5 buttons: Default / :hover / :focus / :active / :disabled (label "Default" for normal state, not "Normal")
- Each state has its own color — NOT uniform amber:
  - Default: `#6c7086` (gray)
  - :hover: `#a855f7` (purple)
  - :focus: `#3b82f6` (blue)
  - :active: `#22c55e` (green)
  - :disabled: `#6b7280` (gray)
- Active button: `background: ${rawColor}20; border: 1px solid ${rawColor}50; color: ${rawColor}; fontWeight: 600`
- Inactive: `background: transparent; color: var(--aqb-text-tertiary); border: 1px solid transparent`
- Override dot: `width: 5px; height: 5px; border-radius: 50%; background: ${rawColor}` positioned top-right (top: 3, right: 3) — indicates at least one CSS override for this state
- Each button: `flex: 1; padding: 3px 5px; border-radius: 6px; font-size: var(--aqb-text-xs); fontWeight: 600`
- Container: `role="group"; aria-label="Element state selector"; gap: 3px; padding: 4px 8px; background: rgba(0,0,0,0.15); borderRadius: 6`
- "State:" label prefix: `fontSize: 12; color: var(--aqb-text-tertiary)`

**ROW 7 — Search:**
- Input: `height: 28px; font: 12px Inter; background: var(--aqb-surface-3); border: 1px solid var(--aqb-border); border-radius: 6px; padding: 0 8px 0 28px`
- Search icon: Lucide `search`, 14px, left
- Placeholder: "Search sections..."
- Behavior: filters visible sections in real-time (sections whose name does not match are hidden)

**ROW 8 — Collapse/Expand:**
- Two icon buttons: Lucide `chevrons-up-down` (collapse all) + `chevrons-down-up` (expand all)
- `width: 28px; height: 28px; border-radius: 6px; color: #908D85`. Hover: `background: var(--aqb-surface-3); color: #F5F5F0`
- Tooltips: "Collapse All" / "Expand All"

---

## 4.13 Inspector Tabs and Grouping

### Shared Section Accordion Pattern

All 20+ sections use the same accordion pattern:

**Section header:**
- `height: 32px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer`
- Label: `font: 10px Inter; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #908D85`
- Chevron: Lucide `chevron-right` (collapsed) / `chevron-down` (expanded), 14px, `color: #5a584f`
- Hover: `background: var(--aqb-surface-2)`
- ARIA: `role="region"` + `aria-labelledby` on section; `aria-expanded` on header

**Section content:**
- `padding: 8px 16px 16px`
- Transition: expand/collapse `max-height` animation, 150ms ease

### Shared Control Specs

| Control Type | Height | Font | Background | Border | Radius |
|-------------|--------|------|-----------|--------|--------|
| Text/Number input | 32px | 12px Inter | `var(--aqb-surface-3)` | `1px solid var(--aqb-border)` | 6px |
| Dropdown select | 32px | 12px Inter | `var(--aqb-surface-3)` | `1px solid var(--aqb-border)` | 6px |
| Toggle switch | 20×36px (thumb: 16×16) | — | OFF: `var(--aqb-surface-4)` / ON: `var(--aqb-primary)` | none | 10px (track), 50% (thumb) |
| Color swatch | 24×24px | — | current color | `1px solid var(--aqb-border)` | 6px |
| Segmented control | 28px per segment | 11px Inter | `var(--aqb-surface-3)` container | `1px solid var(--aqb-border)` | 6px |
| Slider | 4px track height | — | Track: `var(--aqb-surface-4)` / Fill: `var(--aqb-primary)` | none | 2px (track), 50% (thumb: 12×12) |
| Linked toggle | 16×16px | — | Linked: `var(--aqb-primary)` / Unlinked: `var(--aqb-surface-4)` | `1px solid var(--aqb-border)` | 4px |
| Unit selector | 28px width | 10px JetBrains Mono | `var(--aqb-surface-4)` | none | 0 0 6px 6px (right side of input) |

### Tab 1 — Layout (7 sections)

| # | Section | Controls |
|---|---------|---------|
| 1 | Position | display mode, position type (static/relative/absolute/fixed/sticky), top/right/bottom/left inputs (value + unit), z-index |
| 2 | Display | display value (block/flex/grid/inline/inline-block/none), visibility (visible/hidden), overflow-x/overflow-y |
| 3 | Size | width (value + unit + auto), height, min-width, max-width, min-height, max-height |
| 4 | Spacing | margin (4 sides, linked/unlinked), padding (4 sides, linked/unlinked), visual box model diagram |
| 5 | Flexbox | (visible when display=flex) direction, wrap, align-items, justify-content, gap, flex-grow/shrink/basis per child |
| 6 | Grid | (visible when display=grid) grid-template-columns/rows, gap, auto-flow, alignment |
| 7 | Variants | (visible when element is component instance) variant selector dropdown |

**Spacing section — visual box model diagram:**
- Interactive box model showing margin (outer), border, padding (inner), content area
- Margin: `background: rgba(245,158,11,0.1)` (amber tint)
- Padding: `background: rgba(34,197,94,0.1)` (green tint)
- Content: `background: rgba(99,102,241,0.08)` (indigo tint)
- Each value clickable → becomes input field
- `font: 11px JetBrains Mono` for values

### Tab 2 — Style (7 sections + 1 conditional)

| # | Section | Controls |
|---|---------|---------|
| 1 | Typography | font-family picker, font-size, font-weight, font-style, line-height, letter-spacing, text-align, color (color picker), text-decoration, text-transform, text-overflow |
| 2 | Background | type toggle (color/gradient/image), color picker, gradient editor (linear/radial, stops), image uploader (MediaManager), background-repeat/size/position/blur |
| 3 | Border | border-width (4 sides, linked/unlinked), border-style, border-color, border-radius (4 corners + link toggle) |
| 4 | CSS Classes | text input for class names, applied classes list with remove buttons |
| 5 | Link | href input, target dropdown, rel checkboxes (nofollow, noopener, noreferrer) |
| 6 | Visibility | show/hide toggle per breakpoint (4-column toggle matrix: desktop/tablet/mobile/watch) |
| 7 | Data Attributes | key/value pairs table, add/remove, custom data-* attributes |
| 7+1 | Element Properties | (conditional, visible for specific element types) tag-specific attributes: `src`, `alt`, `href`, `placeholder`, `type`, `action`, `method`, etc. |

### Tab 3 — Behavior (display label) / Effects (internal ID) — 6 sections

| # | Section | Controls |
|---|---------|---------|
| 1 | Shadows | box-shadow layers (add/remove), per layer: offset-x, offset-y, blur, spread, color, inset toggle |
| 2 | Transforms | rotate, scale-x, scale-y, translate-x, translate-y, skew-x, skew-y, transform-origin |
| 3 | Animation | GSAP-backed entrance animation, trigger (on load/scroll/hover), type, duration, delay, easing |
| 4 | Interactions | event type (click/hover/scroll), action type, target element picker, parameters. "Add interaction" ghost button. Target picker: crosshair cursor mode on canvas. |
| 5 | AI Suggestions | Context label: "Based on your [element type]:" + 3 suggestion cards + Regenerate button. Each suggestion: `height: 36px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.12)` with [Apply] ghost button. |
| 6 | All CSS (DevMode) | Monospace code editor (`font: 12px JetBrains Mono; min-height: 120px; max-height: 300px; resize: vertical`), Apply button, Computed tab toggle. Syntax highlighting: properties in `#6366f1`, values in `#F5F5F0`, units in `#908D85`. |

---

## 4.14 Property Editing

### Input Behavior

- **Number inputs:** Arrow Up/Down increments/decrements by 1. Shift+Arrow by 10. Enter confirms + blurs. Escape reverts + blurs.
- **Text inputs:** Enter confirms. Escape reverts.
- **Color picker:** Opens as popover below color swatch. Includes: color wheel, HSL/RGB/Hex input, opacity slider, eyedropper tool, recent colors (last 8).
- **Unit selector:** Dropdown right of value input. Options: `px`, `%`, `em`, `rem`, `vw`, `vh`, `auto`. Click or keyboard to change.
- **Linked toggle:** When linked, changing one side updates all 4 (margin/padding/border-radius). Unlinked: independent.

### Live Preview

ALL property changes reflect on canvas in real-time (no "apply" step except for CSS editor and AI suggestions). Changes go through `composer.styles.setRule(selector, properties)` or `composer.styles.setBreakpointStyle(elementId, breakpoint, styles)` for device-specific overrides.

### CSS Context System

`deriveCssContext()` enables/disables controls based on element type and display value:
- `display: flex` → Flexbox section visible, Grid section hidden
- `display: grid` → Grid section visible, Flexbox section hidden
- Component instance → Variants section visible
- Text element → Typography section auto-expanded
- Image element → Element Properties shows `src`, `alt`

---

## 4.15 Multi-Select Inspector (IS-3)

**Shown when:** 2+ elements selected.

**Header:** `"[N] elements selected"` — `font: 14px Inter; font-weight: 600; color: #F5F5F0; padding: 12px 16px`

**Layout (vertical stack, `gap: 16px; padding: 16px`):**

```
┌─────────────────────────────────────────────┐
│ 3 elements selected                          │
├─────────────────────────────────────────────┤
│ ALIGN                                        │
│ [⫷] [⫸] [⫼] [⊤] [⊥] [⊞]                   │  6 icon buttons, 32×32px each
│  L    CH   R    T    CV   B                  │
├─────────────────────────────────────────────┤
│ DISTRIBUTE                                   │
│ [⊞H] [⊞V]                                   │  2 icon buttons
├─────────────────────────────────────────────┤
│ SIZE                                         │
│ [Same width] [Same height]                   │  2 ghost buttons
├─────────────────────────────────────────────┤
│ ACTIONS                                      │
│ [Group]  [Wrap in Container]  [Delete all]   │  3 buttons
└─────────────────────────────────────────────┘
```

**Align buttons (6):**

| # | Icon (Lucide) | Action | Tooltip |
|---|---------------|--------|---------|
| 1 | `align-start-horizontal` | Align left edges | "Align Left" |
| 2 | `align-center-horizontal` | Align horizontal centers | "Align Center (H)" |
| 3 | `align-end-horizontal` | Align right edges | "Align Right" |
| 4 | `align-start-vertical` | Align top edges | "Align Top" |
| 5 | `align-center-vertical` | Align vertical centers | "Align Center (V)" |
| 6 | `align-end-vertical` | Align bottom edges | "Align Bottom" |

Each: `width: 32px; height: 32px; border-radius: 6px; background: var(--aqb-surface-3); color: #B8B5AD`. Hover: `var(--aqb-surface-4); color: #F5F5F0`.

**Distribute buttons:** same spec, icons `distribute-spacing-horizontal` / `distribute-spacing-vertical`.

**Size buttons:** `height: 32px; width: 48%; border-radius: 6px; background: var(--aqb-surface-3); border: 1px solid var(--aqb-border); font: 12px Inter; color: #B8B5AD`.

**Action buttons:**
- Group: ghost button
- Wrap: ghost button
- Delete all: `color: #ef4444` on hover. Click → ConfirmDialog: "Delete [N] elements? This cannot be undone."

---

## 4.16 Breakpoint Editing

**Activation:** Change device in top bar switcher or inspector ROW 5 breakpoint pills.

**Visual changes when editing non-desktop breakpoint (e.g., Tablet):**

1. **Breakpoint badge in ROW 5:** Tablet pill active (`background: var(--aqb-primary)`)

2. **Override dots:** Any property that differs from desktop base shows `6px` blue dot (`#3b82f6`):
   - `width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 4px`
   - Hover on dot: tooltip "Overridden at tablet. Desktop value: 16px"

3. **Inherited values:** Properties NOT overridden at this breakpoint show desktop value in `color: #5a584f` (dimmed) with italic text.

4. **Reset override:** Right-click on overridden property → "Reset to desktop value". Or click the blue dot → resets.

5. **Canvas:** Resizes to breakpoint width (Desktop: 1920px/100%, Tablet: 768px, Mobile: 375px, Watch: 196px).

---

## 4.17 Pseudo-State Editing

**Activation:** Click pseudo-state button in ROW 6 (Hover, Focus, Active, or Disabled). "Normal" returns to base state.

**Visual changes when editing a pseudo-state (e.g., Hover):**

1. **State-colored banner** below pseudo-state row (color matches the active state — e.g., purple for :hover, blue for :focus, green for :active, gray for :disabled — NOT uniform amber):
   - `height: 28px; background: ${rawColor}12; border: 1px solid ${rawColor}25; border-radius: 6px; padding: 0 12px; margin: 8px 16px`
   - Text: `"Editing :hover state"` — `font: 11px Inter; font-weight: 500; color: ${rawColor}`
   - Icon: Lucide `alert-triangle`, 12px, `${rawColor}`

2. **Section controls** behave identically but apply to pseudo-state CSS rule (`:hover`, `:focus`, `:active`, `[disabled]`)

3. **Override indicators:** Any overridden property shows:
   - Left border: `3px solid ${rawColor}` on the control row (color matches the pseudo-state)
   - Reset icon: Lucide `rotate-ccw`, 12px, appears on hover — click removes override
   - Value display: override value shown; inherited (non-overridden) properties show base value in `color: #5a584f` (dimmed)

4. **Canvas preview:** Element renders with pseudo-state styles applied. Small badge: `":hover"` in state-colored pill.

5. **Override dot on pseudo-state button:** `width: 5px; height: 5px; border-radius: 50%; background: ${rawColor}` positioned top-right (top: 3, right: 3) — indicates this state has overrides. Color matches the state (purple/blue/green/gray, not uniform amber).

---

## 4.18 Inspector Empty States

### IS-1 — InspectorEmptyState (no selection)

**Layout (actual code — `InspectorEmptyState.tsx`):**

```
┌─────────────────────────────────────────────┐
│        [SvgPointer icon, 48px circle]        │  bg: rgba(255,255,255,0.03)
│                                              │  border: 1px solid rgba(255,255,255,0.05)
│          "Nothing Selected"                  │  14px Inter; weight: 600; color: --aqb-text-primary
│                                              │
│  "Click an element on the canvas or use      │  13px Inter; color: --aqb-text-tertiary
│   the Layers panel to select and edit        │  maxWidth: 220px
│   properties."                               │
│                                              │
│       [Open Build Panel]                     │  primary button; bg: var(--aqb-primary); color: #fff
│       Browse Templates                       │  text link; underline; color: --aqb-text-secondary
│                                              │
│  Tip: Press [A] to open Build panel · [Esc]  │  11px; bg: rgba(137,180,250,0.08)
│       to deselect                            │
└─────────────────────────────────────────────┘
```

- Container: `padding: 24px; text-align: center; marginTop: 40px; color: var(--aqb-text-secondary)`
- Also has a **post-template-apply state**: if a template was applied within last 30 minutes, shows "Template applied!" banner in green with "Set Brand Colors" button (emits `EVENTS.UI_OPEN_DESIGN_PANEL`)
- "Open Build Panel" emits `EVENTS.UI_OPEN_BUILD_PANEL`
- "Browse Templates" emits `EVENTS.UI_BROWSE_TEMPLATES`
- No page name/slug/SEO link in current implementation

---

## 4.19 Canvas↔Inspector Sync

### Bidirectional Sync Rules

| Direction | Trigger | Behavior |
|-----------|---------|----------|
| Canvas → Inspector | Click element on canvas | Inspector transitions to IS-2 with element's properties. Tab preserved. Sections update. |
| Canvas → Inspector | Double-click text | Inspector auto-expands Typography section in Style tab. |
| Canvas → Inspector | Shift+click (multi) | Inspector transitions to IS-3 (MultiSelectToolbar). |
| Canvas → Inspector | Click empty area | Inspector transitions to IS-1. |
| Inspector → Canvas | Change any property | Canvas updates in real-time (live preview). |
| Inspector → Canvas | Switch breakpoint | Canvas resizes to breakpoint width. |
| Inspector → Canvas | Switch pseudo-state | Canvas shows element with pseudo-state styles. |
| Inspector → Canvas | Delete element | Element removed from canvas. Inspector → IS-1. |
| Layers → Canvas | Click layer node | Element selected on canvas. Canvas auto-scrolls to element. |
| Layers → Inspector | Click layer node | Inspector transitions to IS-2. |
| Canvas → Layers | Hover element | Corresponding layer node highlights. |
| Canvas → Layers | Select element | Layer node highlighted + auto-scrolled into view. |

### Scroll Position Persistence

- Inspector remembers scroll position per element ID
- Switching between elements: scroll resets to top if tab changes, preserved if same tab
- Switching tabs: scroll resets to top of new tab

---

## 4.20 Editing Power Features

### Dev Mode (IS-5)

- Toggled via `</>` button in inspector header ROW 1
- When ON: Effects tab → "All CSS" section is fully editable (not just visible)
- CSS editor: monospace code editor with syntax highlighting
  - `font: 12px/1.5 JetBrains Mono; background: var(--aqb-surface-3); border: 1px solid var(--aqb-border); padding: 12px; border-radius: 6px`
  - Property names: `#6366f1`, values: `#F5F5F0`, units: `#908D85`
  - Invalid properties: underlined in `#ef4444`
  - Apply button: only enabled when content changed from computed state
  - Computed tab toggle: switches between editable CSS and read-only computed values
- Canvas indicator: elements show small code badge when Dev Mode is active

### CSS Context-Aware Controls

`deriveCssContext()` conditionally shows/hides inspector sections:
- `display: flex` → shows Flexbox section (Layout tab §5)
- `display: grid` → shows Grid section (Layout tab §6)
- Component instance → shows Variants section (Layout tab §7)
- Element Properties section (Style tab §7+1) → shows tag-specific attributes based on element type

### CMS Binding (Chain Icon)

> **NOT YET IMPLEMENTED in inspector code.** The CMS binding chain icon UI described below is a PRD target-state spec. No binding/chain icon components exist in `src/editor/inspector/` as of the current codebase. The CMS engine (`CollectionManager`, binding types) exists in `src/engine/` but the inspector UI entry point has not been built.

- Chain icon (Lucide `link`, 12px) appears to right of any bindable inspector property field
- Default: `color: #908D85`. Hover: `color: #6366f1`
- Click → binding dropdown (`width: 280px; max-height: 320px`)
- Collections listed as groups with field rows showing compatible fields only
- Bound state: value replaced with `"BlogPosts.title"` in indigo, field becomes read-only
- Chain icon turns `#6366f1` when bound
- Unbind: click indigo chain icon → "Unbind?" popover + [Unbind] destructive button

---

## 4.21 Anti-Regression Warnings

These are the most likely failure modes for canvas and inspector. Each MUST be verified before shipping.

| # | Risk | What could go wrong | Verification | Pass criteria | PRD source |
|---|------|--------------------|--------------|--------------|----|
| AR1 | Inspector sections removed | Reduced to "simplify" | Count sections per tab | Layout=7, Style=7+1, Effects=6. Total ≥ 20. | §11.3 |
| AR2 | Pseudo-state selector removed | ROW 6 dropped from header | Verify ROW 6 exists with 5 buttons | Normal + Hover + Focus + Active + Disabled all present | §11.2, §11.4 |
| AR5 | CMS UI not designed | CMS surfaces missing | Verify: CMS List in Build tab, Collection Setup modal, chain icon in inspector, binding dropdown | All 4 CMS entry points functional | §12 |
| AR8 | Multi-select inspector not implemented | Shows nothing or single-element view | Shift+click 2 elements → verify MultiSelectToolbar | Align (6) + Distribute (2) + Size (2) + Actions (3) visible | §11.6 |
| AR9 | Canvas overlays reduced | Fewer than 7 toggles | Count toggles in canvas footer | Guides, Spacing, Grid, Badges, X-Ray, Rulers all present | §10.7 |
| AR14 | "Select from stack" removed | Right-click menu missing submenu | Right-click overlapping elements → verify submenu | Lists all elements at click point in z-order | §10.8, §21.3 |
| AR16 | DevModeToggle buried or removed | Not in inspector header ROW 1 | Verify `</>` toggle in ROW 1 | Toggle visible without scrolling | §11.2 |
| AR17 | Breakpoint override indicators missing | No blue dots on overridden properties | Switch to Tablet → override → verify blue dot | `6px` blue dot appears with tooltip | §11.5 |
| AR18 | Canvas empty state missing | Blank project shows empty canvas with no guidance | New project → verify CanvasEmptyCTA | CTA with "Browse Templates" + "Start Blank" | §10.2 |
| AR19 | Snap lines not implemented | No alignment guides during drag | Drag near another element → verify snap lines | Magenta lines (#FF00FF) at 6px threshold | §10.5 |
| AR20 | Floating toolbar missing | Selected element has no toolbar | Click element → verify toolbar above | 7 buttons visible | §10.3 |
| AR21 | Confirm dialog missing on destructive actions | Delete executes without confirmation | Click delete → verify dialog | Dialog with consequence text + buttons | §25.1 |
| AR25 | Accessibility focus ring removed | Not visible on keyboard nav | Tab through UI → verify ring | `2px solid #6366f1, offset 2px` on every focusable element | §20.1 |

### Anti-Downgrade Checklist Items (Canvas/Inspector-specific, from Output E)

**Canvas (E.3):**

| # | Feature | Check |
|---|---------|-------|
| C1 | Canvas empty state (CanvasEmptyCTA) | See blank canvas screen |
| C2 | Resize handles (8 points) | Look for handle design |
| C3 | Floating toolbar | Look for toolbar above element |
| C4 | Marquee rectangle | Look for dashed rectangle |
| C5 | MultiSelectToolbar | Look for align/distribute toolbar |
| C6 | Drop zone valid + invalid states | Teal vs red indicators |
| C7 | Snap lines horizontal + vertical | Magenta lines (#FF00FF) |
| C8 | Canvas footer: all 7 overlay toggles | Count toggles |
| C9 | Canvas footer: zoom controls | Look for - / % / + / Fit |
| C10 | X-Ray mode visual | Wireframe overlay |
| C11 | Context menu: "Select from stack" | Submenu exists |
| C12 | Inline edit mode | Text cursor visible |

**Inspector (E.4):**

| # | Feature | Check |
|---|---------|-------|
| I1 | 3 tabs (Layout / Style / Behavior) | Count tabs |
| I2 | Layout: 7 sections | Count sections |
| I3 | Style: 7 sections | Count sections |
| I4 | Effects: 6 sections | Count sections |
| I5 | Pseudo-state row: 4 states | Count buttons |
| I6 | Pseudo-state override dot | Look for dot on buttons |
| I7 | Breakpoint indicator | Look for pill in header |
| I8 | DevModeToggle visible in header | Not buried |
| I9 | Empty state: page properties | InspectorEmptyState |
| I10 | Multi-select: align/distribute | MultiSelectToolbar |
| I11 | Element breadcrumb | Look for breadcrumb row |
| I12 | Search sections input | In header |
| I13 | Collapse All / Expand All | In header |
| I14 | Delete with confirmation | Confirm modal exists |

---

## 4.22 Canvas Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Arrow keys | Nudge selected element 1px in direction |
| Shift+Arrow | Nudge selected element 10px |
| Enter | Enter inline edit mode (text elements only) |
| Delete / Backspace | Delete selected element(s) |
| Ctrl+A | Select all elements |
| Ctrl+D | Duplicate selected element |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / Cut / Paste |
| Ctrl+] / Ctrl+[ | Move up / Move down in sibling order |
| Ctrl+Shift+] / Ctrl+Shift+[ | Bring to front / Send to back |
| Escape | Deselect / exit inline edit / close context menu |

### Inspector Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between controls within current section |
| Arrow Left/Right | Switch between tabs when tab bar focused |
| Space | Toggle checkboxes, toggles, segmented controls |
| Enter | Confirm edit in text/number input (blur + apply) |
| Escape | Revert current input to previous value + blur |
| Arrow Up/Down (in number input) | Increment/decrement by 1 |
| Shift+Arrow Up/Down (in number input) | Increment/decrement by 10 |

---

## 4.23 Screen Reader Announcements (Canvas/Inspector-specific)

| Event | aria-live | Announcement |
|-------|----------|-------------|
| Element selected | `polite` | `"[Element type] selected"` |
| Multi-select | `polite` | `"[N] elements selected"` |
| Element deselected | `polite` | `"No selection"` |
| Element added | `polite` | `"[Element type] added to canvas"` |
| Element deleted | `polite` | `"[Element type] deleted"` |
| Undo | `polite` | `"Undo: [action description]"` |
| Redo | `polite` | `"Redo: [action description]"` |
| Drag start | `polite` | `"Dragging [element type]. Use arrow keys to position, Enter to drop, Escape to cancel."` |

---

## Plain-English Summary

The canvas is the flexible center zone where users design their web pages. It shows a white content area (`--aqb-bg-canvas: #ffffff`), with support for 4 device widths (1920px/100% desktop, 768px tablet, 375px mobile, 196px watch). The canvas has 17 distinct states covering idle, hover, selection, inline editing, drag operations, overlays, and special modes like X-Ray and Dev Mode.

When an element is selected, it gets an indigo outline, 8 resize handles, and a floating toolbar above it with 7 action buttons. Multi-selection works via Shift+click, marquee drag, or Ctrl+A. The selection state machine has 24 transitions across 5 states.

The canvas footer toolbar has 7 overlay toggles (Guides, Spacing, Grid, Badges, X-Ray, Rulers) and zoom controls. Right-clicking opens a context menu with 15 items including a "Select from stack" submenu for overlapping elements.

The inspector (right panel, 280px) has 5 states: empty (IS-1), single element (IS-2), multi-select (IS-3), pseudo-state editing (IS-4), and dev mode (IS-5). The header has 8 rows including element identity, breadcrumb, 3 tabs, breakpoint pills, pseudo-state buttons, search, and collapse/expand controls.

The 3 inspector tabs (displayed as Layout / Style / Behavior) contain 20+ sections: Layout (7: Position, Display, Size, Spacing, Flexbox, Grid, Variants), Style (7+1: Typography, Background, Border, CSS Classes, Link, Visibility, Data Attributes, Element Properties), and Behavior/Effects (6: Shadows, Transforms, Animation, Interactions, AI Suggestions, All CSS).

Pseudo-state editing lets users style :hover, :focus, :active, and [disabled] states independently with per-state color indicators (purple for hover, blue for focus, green for active, gray for disabled). Breakpoint editing shows blue dots on properties that differ from the desktop base. Both use override indicators and reset mechanisms.

Canvas and inspector are bidirectionally synced: selecting on canvas updates inspector, changing inspector properties updates canvas in real-time, and Layers tree participates in the sync.

---

## Source Traceability

| Part 4 Section | PRD Source Section(s) |
|---------------|----------------------|
| 4.1 Canvas Purpose and Region | §6.2, §10 intro |
| 4.2 Canvas Default State | §26.1, §26.2, §26.3 |
| 4.3 Canvas Empty State | §10.2 |
| 4.4 Selection Model | §21.1, §21.2, §21.3 |
| 4.5 Selection State Machine | §19.2 |
| 4.6 Hover/Focus/Selected | §10.1 state table, §21 |
| 4.7 Resize/Move/Insert | §10.4, §10.6, §9.5 drag behavior |
| 4.8 Guides/Snap/Drop Zones | §10.5, §10.6 |
| 4.9 Floating Toolbar | §10.3 |
| 4.10 Canvas Overlays | §10.7, §10.1 CS-11 through CS-17 |
| 4.11 Canvas States/Edge Cases | §10.1 full state table, §10.8 context menu |
| 4.12 Inspector Purpose/Structure | §11.1, §11.2 |
| 4.13 Inspector Tabs/Grouping | §11.3, §5C |
| 4.14 Property Editing | §11.3 control specs |
| 4.15 Multi-Select | §11.6 |
| 4.16 Breakpoint Editing | §11.5 |
| 4.17 Pseudo-State Editing | §11.4 |
| 4.18 Inspector Empty States | §11.7 |
| 4.19 Canvas↔Inspector Sync | §21, §11 behaviors |
| 4.20 Editing Power Features | §11.3 Tab 3 §6, §12.3 |
| 4.21 Anti-Regression Warnings | §30, Output E §E.3/§E.4 |
| 4.22 Canvas Keyboard Navigation | §20.2 |
| 4.23 Screen Reader Announcements | §20.4 |

---

## Unclear or Ambiguous Items

| # | Item | Note |
|---|------|------|
| 1 | Inspector panel collapse behavior | The PRD describes the inspector as having states IS-1 through IS-5, but does not define a collapse-to-0px state machine like the left sidebar has. IS-1 (empty state) shows "Nothing Selected", suggesting the inspector is always open. Needs clarification on whether the inspector can fully collapse. |
| 2 | Resize handle positioning for inline elements | The PRD specifies 8 resize handles for selected elements but doesn't clarify behavior for inline elements (e.g., `<span>`, inline `<a>`) where bounding box may not be rectangular or resizing may not make sense. |
| 3 | Canvas state CS-4 vs CS-3 distinction | CS-4 ("selected-post-action") is described identically to CS-3 ("selected"). The PRD doesn't explain what visual or behavioral difference exists between them. May be an internal state used for focus management only. |
| 4 | Floating toolbar vs text formatting toolbar | When inline editing text (CS-6/S8), the floating toolbar changes to a "text formatting toolbar" but the PRD does not provide the full spec for the text formatting toolbar buttons. Only mentions it replaces the standard 7-button toolbar. |
| 5 | Inspector scroll position per element ID | The PRD states scroll is "remembered per element ID" but doesn't specify the storage mechanism or TTL. For large pages with many elements, this could become a memory concern. |
| 6 | Desktop breakpoint width inconsistency | Engine `Viewport.ts` uses 1920px, `BreakpointDropdown.tsx` shows "1440px" as UI label, canvas renders at 100%. Three different values for "desktop" — needs single source of truth. |
| 7 | Selection state machine: PRD vs code | PRD specifies a formal 5-state/24-transition state machine. Code (`SelectionManager.ts`) uses simple state management (selected/multiSelected) with events, not a formal state machine. |
