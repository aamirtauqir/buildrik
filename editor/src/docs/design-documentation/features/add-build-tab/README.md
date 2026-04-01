---
title: Add/Build Tab — Element Catalog
description: Design specification for the sidebar panel where users browse and insert 150+ elements and sections
feature: add-build-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../layers-tab/README.md
  - ../components-tab/README.md
dependencies:
  - Canvas (drag-drop target)
  - Layers Tab (new elements appear in tree)
  - SyncManager (team favorites sync)
status: approved
---

# Add/Build Tab — Element Catalog

## Overview

The Add/Build Tab is the primary entry point for placing new elements onto the canvas. It presents 150+ elements organized in a sections-first ordering — Hero, CTA, and Pricing sections appear at the top, while atomic elements (Text, Button, Image) are further down. This ordering matches the real-world workflow: users build pages from sections, not from individual tags.

**Primary User Goal:** Find and insert the right element or section in under 10 seconds.
**Success Criteria:** 90% of element insertions start from the first visible screen (no scrolling).
**Key Pain Points Addressed:** Eliminates hunting through flat alphabetical lists; surfaces high-value sections first.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ 🔍 Search elements...        │ Fuzzy search input
├──────────────────────────────┤
│ [Sections] [Elements] [Favs] │ 3-tab filter
├──────────────────────────────┤
│ ▼ Hero Sections              │ Category header
│ ┌────────┐ ┌────────┐       │
│ │ Hero 1 │ │ Hero 2 │       │ 2-column grid
│ └────────┘ └────────┘       │ 120x80px thumbnails
│ ┌────────┐ ┌────────┐       │
│ │ Hero 3 │ │ Hero 4 │       │
│ └────────┘ └────────┘       │
├──────────────────────────────┤
│ ▼ CTA Sections               │
│ ┌────────┐ ┌────────┐       │
│ │ CTA 1  │ │ CTA 2  │       │
│ └────────┘ └────────┘       │
├──────────────────────────────┤
│ ▼ Pricing                    │
│ ...                          │
├──────────────────────────────┤
│ ▼ Basic Elements             │ Lower priority
│ ┌────┐ ┌────┐ ┌────┐       │
│ │Text│ │Btn │ │Img │       │ 3-column compact
│ └────┘ └────┘ └────┘       │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Default View (Sections Tab Active)

- **Search bar:** 100% width, `--aqb-chrome-surface` bg, `--aqb-chrome-border` border, 36px height, placeholder "Search elements..."
- **Tab bar:** 3 pill buttons — Sections (default active), Elements, Favorites
- **Active tab:** `--aqb-primary` bg, white text. Inactive: `--aqb-chrome-surface` bg, `--aqb-text-secondary`
- **Category ordering:** Hero > CTA > Pricing > Features > Testimonials > Footer > Navigation > Forms > Basic Elements
- **Thumbnails:** 120x80px, `--aqb-radius-md` corners, `--aqb-chrome-border` border, hover: `--aqb-primary` 2px border + `--aqb-elevation-1` shadow
- **Labels:** `--aqb-caption`, `--aqb-text-secondary`, centered below thumbnail

### State 2: Search Active

- **Search input focused:** `--aqb-primary` border, `--aqb-primary-glow` ring
- **Results:** Flat list replacing category grid. Fuzzy matching highlights matched characters in `--aqb-primary`
- **No results:** "No elements matching '[query]'" in `--aqb-text-tertiary`, centered

### State 3: Favorites Tab

- **Populated:** Grid of starred elements, same thumbnail format
- **Empty:** "Star elements to add them here" + illustration, `--aqb-text-tertiary`
- **Sync badge:** Small "Synced" indicator if team favorites enabled, `--aqb-success` text

### State 4: Drag in Progress

- **Source thumbnail:** 50% opacity while dragging
- **Ghost preview:** Element preview follows cursor onto canvas at 50% opacity
- **Panel remains open** during drag operation

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click thumbnail | Insert element at canvas cursor position (or end of page) | Element fades in, 150ms `--aqb-ease-out` |
| Drag thumbnail | Ghost preview follows cursor to canvas drop zone | Immediate on mousedown + 3px threshold |
| Hover thumbnail | 2px `--aqb-primary` border, elevation lift | 150ms transition |
| Star/unstar | Toggle favorite; syncs to team via SyncManager | Heart icon fills/empties, 200ms |
| Search typing | Fuzzy filter with 100ms debounce | Results animate in with 150ms fade |
| Category collapse | Toggle section visibility | 200ms height transition |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Panel open → content visible | < 100ms |
| Search keystroke → results | < 100ms (fuzzy match on 150+ items) |
| Drag start → ghost visible | < 16ms |
| Thumbnail rendering | Lazy-load below fold, 10 visible initially |
| Favorites sync (SyncManager) | < 500ms round-trip |

---

## Accessibility

- **Search input:** Auto-focused when tab opens. `aria-label="Search elements"`
- **Tab bar:** `role="tablist"` with `role="tab"` for each filter
- **Thumbnails:** `role="button"`, `aria-label="Insert [Element Name]"`, Enter to insert, Space to drag
- **Categories:** `role="group"`, `aria-labelledby` pointing to category header
- **Keyboard:** Tab moves between thumbnails in grid order. Enter inserts. Arrow keys navigate grid.

---

## Implementation Notes

- Element catalog data lives in `src/blocks/` as read-only JSON definitions
- Fuzzy search uses a lightweight scorer (no external library) — match score = character adjacency + position bonus
- Team favorites sync through `SyncManager.favorites` channel
- Thumbnails are static SVG previews, not live renders (performance)
- Drag-and-drop uses the same `DragManager` state machine as canvas operations

---

## Related Documentation
- [Canvas](../canvas/README.md) — Drop target for dragged elements
- [Layers Tab](../layers-tab/README.md) — New elements appear in tree
- [Components Tab](../components-tab/README.md) — Custom components also insertable
- [Style Guide](../../design-system/style-guide.md) — Thumbnail and control specs
