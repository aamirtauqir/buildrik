---
title: Templates Tab — Page Templates
description: Design specification for the templates browser with visual comparison and single-undo apply
feature: templates-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../pages-tab/README.md
dependencies:
  - Canvas (template renders after apply)
  - History (single-undo transaction)
status: approved
---

# Templates Tab — Page Templates

## Overview

The Templates Tab lets users browse, preview, and apply full page templates. It is the fastest path from blank page to functional layout. Templates are browsable by category, visually comparable side-by-side before committing, and applied as a single undo transaction so users can revert safely.

**Primary User Goal:** Go from empty page to structured layout in under 30 seconds.
**Success Criteria:** Template apply + undo round-trip completes in < 500ms.
**Key Pain Points Addressed:** Eliminates building common layouts from scratch; "Save Current Page" turns user work into reusable templates.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ 🔍 Search templates...        │
├──────────────────────────────┤
│ [All] [Landing] [Blog] [+▾] │ Category filters
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │  [★ Save Current Page]   │ │ Prominent save button
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │   Template Preview 1     │ │ Full-width thumbnail
│ │   (Landing — Hero)       │ │ ~240x160px
│ │                          │ │
│ └──────────────────────────┘ │
│ Landing Page — Hero          │
│ 12 sections · Responsive     │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │   Template Preview 2     │ │
│ │   (Blog — Standard)      │ │
│ └──────────────────────────┘ │
│ Blog — Standard              │
│ 8 sections · Responsive      │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Default Browse

- **Category pills:** Horizontally scrollable row. Active: `--aqb-primary` bg, white text. Inactive: `--aqb-chrome-surface`, `--aqb-text-secondary`. Categories: All, Landing, Blog, Portfolio, E-commerce, SaaS, Custom.
- **Save button:** Full-width, `--aqb-primary-subtle` bg, `--aqb-primary` text, `--aqb-radius-md`, 40px height. Star icon left-aligned.
- **Template cards:** Full-width thumbnails (240x160px), `--aqb-radius-md`, `--aqb-chrome-border` border. Below: name in `--aqb-heading-sm`, metadata in `--aqb-caption` `--aqb-text-tertiary`.
- **Hover:** Card lifts with `--aqb-elevation-1`, border becomes `--aqb-primary`.

### State 2: Template Detail / Comparison

- **Trigger:** Click on template card
- **View:** Slides in a detail panel (overlays the list)
- **Content:** Full-height scrollable preview of the template, "Apply Template" primary button, "Compare" secondary button
- **Compare mode:** Split view — current page on left, template on right, 50/50 width, draggable divider
- **Back:** Chevron-left + "Back to Templates" at top

### State 3: Apply Confirmation

- **Modal:** Centered, 360px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-3`
- **Content:** "Replace current page content with [Template Name]? This action can be undone."
- **Buttons:** [Cancel] ghost + [Apply Template] primary
- **Apply behavior:** Entire page content replaced as a single undo transaction (one Ctrl+Z reverts)

### State 4: Save Current Page as Template

- **Modal:** Name input + category dropdown + description textarea
- **Preview:** Auto-generated thumbnail of current page
- **Save:** Creates template in "Custom" category
- **Saved state:** Success toast "Template saved", template appears at top of Custom category

### State 5: Empty State (No Templates Match Filter)

- **Visual:** Centered illustration, "No templates in this category" in `--aqb-text-tertiary`
- **Action:** "Browse All Templates" ghost button

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click template card | Opens detail view | Slide-in from right, 200ms `--aqb-ease-out` |
| Click "Apply Template" | Confirmation modal → replaces page content | Instant swap, canvas re-render < 100ms |
| Click "Compare" | Split view: current vs template | Slide divider in, 200ms |
| Ctrl+Z after apply | Full revert to previous page state | Instant (single transaction) |
| Click "Save Current Page" | Opens save modal | Modal fade-in 150ms |
| Category pill click | Filters template list | 150ms fade transition on cards |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Template list load | < 200ms (thumbnails lazy-loaded) |
| Template apply (DOM swap) | < 100ms |
| Undo after apply | < 50ms (single transaction revert) |
| Thumbnail generation for save | < 1s |
| Search filtering | < 100ms debounce |

---

## Accessibility

- **Category pills:** `role="tablist"`, arrow keys to navigate between categories
- **Template cards:** `role="button"`, `aria-label="[Template Name], [section count] sections"`, Enter to open detail
- **Compare view:** Accessible via keyboard; Tab moves focus between left/right panels
- **Apply confirmation:** Focus trapped in modal, Escape to cancel, auto-focus on Cancel button
- **Screen reader:** Announces "Template applied. Press Ctrl+Z to undo." after apply

---

## Implementation Notes

- Template data lives in `src/templates/` as JSON page definitions
- Apply wraps the entire DOM swap in `HistoryManager.transaction()` for single-undo
- Thumbnails are pre-rendered static images, not live DOM captures
- "Save Current Page" serializes current page state via `Composer.serialize()`
- Compare view uses two `<iframe>` elements for isolated rendering

---

## Related Documentation
- [Canvas](../canvas/README.md) — Template content renders here
- [Pages Tab](../pages-tab/README.md) — Templates apply to the active page
- [History Tab](../history-tab/README.md) — Template apply is one undo entry
- [Style Guide](../../design-system/style-guide.md) — Card and modal specs
