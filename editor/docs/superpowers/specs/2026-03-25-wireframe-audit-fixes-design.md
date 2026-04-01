# Wireframe Audit Fixes — Design Spec
**File:** `/Users/shahg/Desktop/pencil/editer.pen`
**Date:** 2026-03-25
**Scope:** 18 lo-fi wireframe screens, Buildrik (Aquibra Studio)

---

## Context

All 18 frames were built per `2026-03-25-pencil-wireframes-plan.md`. A full 15-dimension design audit revealed 6 Critical issues, 6 Refinement issues, and 6 Polish issues. This spec defines every fix to be applied in the `.pen` file using `mcp__pencil__batch_design`.

---

## Design Tokens (Reference)

```
Surfaces: surface-1=#0f0f14, surface-2=#171720, surface-3=#1e1e28, surface-4=#252530, surface-5=#2e2e38
Accent blue: #1D4ED8
Amber: #F59E0B
Text primary: #E2E2E6
Text muted: #6B6B7B
Radius: sm=5, md=8
Font: 10px section headers (uppercase), 12px list items, 13px body
```

---

## Phase 1 — Critical Fixes

### P1-A: Inspector — Populate element properties (Frames 02, 03, 05)

**Problem:** Inspector always shows blank "Session / Layout / Style / Effects" chrome across all frames. Frames with selected elements show nothing.

**Fix:** For Frames 02 (8IaFP), 03 (FBFST), 05 (q3VhD) — populate the inspector body with:
- A "Layout" section showing: W=100%, H=auto, X=0, Y=0 fields
- A "Fill" row showing a color swatch placeholder + hex value "#FFFFFF"
- A "Border Radius" row showing "8px"
- Use surface-4 background rows, 12px text, proper label/value pairs

**Frame 18 (Rb6qe):** Inspector already has Data Binding content — add a small "W / H" dimension row at top of inspector body above Collection Bindings.

### P1-B: Rail icons — Differentiate all 8 positions (All frames)

**Problem:** All 8 rail icon slots appear as identical ~8px square placeholders.

**Fix:** Replace each rail icon placeholder with a distinct text label icon (2-letter abbreviation rendered in a 16×16 box):
- Position 1 (Add): "＋" symbol centered
- Position 2 (Media): "◫" or "IMG" label
- Position 3 (Layers): "≡" three-line icon
- Position 4 (Templates): "⊞" grid icon
- Position 5 (Pages): "☰" doc icon
- Position 6 (Design): "◉" palette icon
- Position 7 (Settings): "⚙" gear icon
- Position 8 (History): "↺" history icon

**Active state:** Active rail icon background = surface-4, with a 2px left border in accent blue (#1D4ED8).

Since updating all 18 frames individually is costly, update the 6 unique sidebar states and rely on copy propagation. The rail is the same component in all frames — update root rail node.

### P1-C: Export Modal — Reposition as canvas overlay (Frame 10, node 4MVns)

**Problem:** Export progress bar sits in the dark gutter below the canvas, not as a modal overlay.

**Fix:**
- Remove existing export progress bar from below the canvas
- Insert a centered modal overlay inside the canvas viewport:
  - Modal: 480×280px, surface-3 background, radius md, centered at canvas center
  - Header: "Export Project" 14px semibold
  - Progress section: 4 rows (HTML/CSS, Images, Fonts, Deploy) each with: label + colored progress bar (width = % done)
  - Close button: "×" top-right corner
  - Semi-transparent overlay behind modal: full-canvas dark overlay at 60% opacity

### P1-D: Empty state messaging for blank canvases (Frames 01, 07, 08)

**Frame 01 (kN0dW) — Idle canvas:**
- Inside canvas viewport, add a centered group:
  - Large "+" icon placeholder (32×32px, dashed border circle)
  - Text below: "Click + in the rail to add your first element" (12px, muted)

**Frame 07 (hOLfn) — Build panel canvas:**
- Canvas should show a basic section placeholder (like Frame 02 canvas) — one white section rectangle with "Section" label centered, indicating a page is open

**Frame 08 (IXAAQ) — Design System canvas:**
- Canvas shows a "Design System Preview" zone: a simple 3-color swatch row centered in the canvas with label "Token Preview"

### P1-E: Layer tree indentation (Frames 03, 05)

**Problem:** All layer items are at same x position — no parent/child visual hierarchy.

**Fix for Frame 03 (FBFST) and Frame 05 (q3VhD):**
- Level 0 items (Section, Div): x=8px padding from left edge
- Level 1 items (Container): x=20px (add 12px indent)
- Level 2 items (H1, P, Button): x=32px (add another 12px indent)
- Add a 1px vertical line connecting parent to its children (surface-5 color)
- Use Unicode "└" prefix character for child items

### P1-F: Onboarding banner constrain to canvas (Frame 16, node XSLrx)

**Problem:** Blue banner extends edge-to-edge from x=0 across the rail.

**Fix:**
- Update the blue banner to start at x=44 (right edge of rail) and width=1396 (1440-44=1396)
- Or reposition as a notification bar: remove full-width banner, replace with a top-of-canvas strip inside the canvas viewport (y=0 of canvas, full canvas width, height=40px, blue fill)
- The canvas dimming overlay should also start at x=44

---

## Phase 2 — Refinement

### P2-A: Sidebar typography hierarchy (All panels)

**Fix:** For each sidebar panel's section header text nodes:
- Font size: 10px
- Text: UPPERCASE
- Color: #6B6B7B (muted)
- Letter spacing: +0.5

For each sidebar list item:
- Font size: 12px
- Color: #E2E2E6

Active/selected list item:
- Font size: 12px
- Color: #FFFFFF
- Background: surface-4 (#252530)
- Left border: 2px #1D4ED8

Apply to: all sidebar header labels across all 18 frames.

### P2-B: Remove annotation notes from UI chrome (Frames 07, 09, 14, 17)

**Problem:** Amber (#F59E0B) annotation bars placed inside sidebar/inspector panels are too visually dominant and confuse UI content vs. metadata.

**Fix:**
- Delete all amber text/bar nodes found inside the sidebar or inspector panel areas of frames 07, 09, 14, 17
- These frames already have annotation content in the y=880 annotation bar — the inline notes are redundant

### P2-C: Settings cards — add icon placeholder boxes (Frame 13, node KTRwQ)

**Fix:** Each of the 6 cards needs a 16×16 gray rounded rectangle (surface-4, radius sm) positioned at top-left inside the card. Cards should also have a 1px border (#2E2E38).

### P2-D: Pages panel active state (Frame 06, node sQuZs)

**Fix:**
- Selected page row ("Home"): background=surface-4, left border 2px accent blue
- Other pages: background=transparent, no border
- Add a "+" add page button row at the bottom of the pages list (text "＋ Add Page", muted color)

### P2-E: Design System section separators (Frame 08, node IXAAQ)

**Fix:**
- Between Color Tokens section and Typography section: insert a 1px horizontal divider line (surface-5 color, full sidebar width)
- Section header labels ("Colors", "Typography/Direction") styled per P2-A: 10px uppercase muted

### P2-F: Inspector tab active state (All frames)

**Fix:** In every frame's inspector tab row (Layout / Style / Effects):
- Active tab ("Layout"): add a 2px bottom border in accent blue, text color #FFFFFF
- Inactive tabs: text color #6B6B7B, no border

---

## Phase 3 — Polish

### P3-A: Onboarding pagination dots (Frame 16, node XSLrx)

**Fix:**
- Active dot: rectangle 20×6px, accent blue, radius full
- Inactive dots: circle 6×6px, surface-5 color
- The dots row should be centered at bottom of canvas overlay area

### P3-B: Version History restore states (Frame 15, node jooME)

**Fix:**
- Add a "Restore" ghost button (outline style, 10px text, padding 2px 8px) to the right side of every version entry row (not just v2.0)
- Add a "Current" badge (green #10B981, 10px, pill) to the first/top version entry

### P3-C: Media panel upload zone (Frame 12, node dXz7J)

**Fix:**
- Move "String with ALPHA, TEXT" annotation text out of the sidebar body — delete it or move to annotation bar
- Below the media grid thumbnails, add a "Drop files here" zone: dashed border rectangle, 100% width, 32px height, centered text "Drop files here or click to upload" (10px muted)

### P3-D: AI panel toggle state (Frame 17, node IpXmX)

**Fix:**
- "Suggested-Add-New-Block" toggle row: add a small toggle pill shape (24×12px) to the right of the label row
- ON state: blue fill (#1D4ED8) with white circle at right
- This communicates the toggle is interactive, not just a label

### P3-E: Publish step active state (Frame 14, node n5USt)

**Fix:**
- Active publish step row: background=surface-4, left border 2px accent blue
- Add a "⟳" spinner character to the left of the active step label text
- Other completed steps: add "✓" checkmark prefix in green

### P3-F: Canvas section dividers (Frames 02, 03, 05)

**Fix:**
- Horizontal divider lines between canvas sections: increase stroke to 1px, color #D0D0D0
- Add 8px vertical margin above/below each divider within the canvas viewport

---

## Implementation Notes

1. Use `mcp__pencil__batch_design` with Update (U) operations for existing node changes, Insert (I) for new nodes
2. Take screenshots after each Phase to validate
3. Rail updates may need to be applied per-frame since pencil doesn't have a shared component system
4. Annotation bar content (y=880 strip) must NOT be modified
5. Canvas viewport bounds: each frame's canvas starts at approximately x=44+260=304, width=780, height=540

---

## Success Criteria

- [ ] Every selected-element frame (02, 03, 05, 18) shows populated inspector
- [ ] All 8 rail icons are visually distinct
- [ ] Export modal (Frame 10) is a proper centered overlay
- [ ] Frames 01, 07, 08 have empty-state messaging in canvas
- [ ] Layer tree (Frames 03, 05) shows clear parent/child indentation
- [ ] Onboarding banner (Frame 16) does not overlap the rail
- [ ] Sidebar section headers are visually distinct from list items
- [ ] Annotation notes removed from sidebar/inspector chrome
- [ ] Settings cards have icon placeholders
