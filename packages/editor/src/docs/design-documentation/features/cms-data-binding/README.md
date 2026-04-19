---
title: CMS & Data Binding
description: Design specification for the CMS collection setup, data binding, repeater elements, and preview bar
feature: cms-data-binding
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../inspector/README.md
dependencies:
  - Canvas (repeater rendering, CMS preview bar)
  - Inspector (data binding popover)
status: approved
---

# CMS & Data Binding

## Overview

The CMS feature allows users to define data collections (e.g., Blog Posts, Products, Team Members), bind collection fields to visual elements, and create repeater containers that clone per data item. A CMS Preview Bar above the canvas lets users browse through data entries to see how the design renders with real content. E-commerce projects get pre-built schemas for Products, Categories, and Orders.

**Primary User Goal:** Create data-driven pages where content and design are separated.
**Success Criteria:** Binding a field to an element takes < 3 clicks. Repeater renders all items in < 200ms.
**Key Pain Points Addressed:** Eliminates hardcoding content into designs; enables dynamic page generation from structured data.

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────┐
│ CMS Preview: Blog Posts  [< Prev] [Item 3/12] [Next >]│ Preview Bar
├──────────────────────────────────────────────────────┤
│                                                      │
│                    CANVAS                            │
│                                                      │
│  ┌────────────────────────────────────────┐          │
│  │ Repeater: Blog Posts                   │          │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐│          │
│  │ │ {{title}} │ │ {{title}} │ │ {{title}} ││          │
│  │ │ {{image}} │ │ {{image}} │ │ {{image}} ││          │
│  │ │ {{date}}  │ │ {{date}}  │ │ {{date}}  ││          │
│  │ └──────────┘ └──────────┘ └──────────┘│          │
│  └────────────────────────────────────────┘          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Screen States

### State 1: Collection Setup Modal

```
┌──────────────────────────────────────┐
│ Create Collection              [✕]   │
├──────────────────────────────────────┤
│ Name:    [Blog Posts          ]      │
│ Slug:    [blog-posts          ]      │
├──────────────────────────────────────┤
│ Fields:                              │
│ ┌──────────────────────────────────┐ │
│ │ title        Text       [⋮][✕]  │ │
│ │ image        Image      [⋮][✕]  │ │
│ │ body         Rich Text  [⋮][✕]  │ │
│ │ date         Date       [⋮][✕]  │ │
│ │ author       Reference  [⋮][✕]  │ │
│ └──────────────────────────────────┘ │
│            [+ Add Field]             │
├──────────────────────────────────────┤
│         [Cancel]  [Create]           │
└──────────────────────────────────────┘
```

- **Modal:** 520px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-3`.
- **Field types (17 total):** Text, Rich Text, Number, Boolean, Date, DateTime, Image, File, Video, Color, URL, Email, Phone, Reference, Multi-Reference, Enum, JSON.
- **Drag handle (⋮):** Reorder fields. Delete (✕): removes field with confirmation if data exists.

### State 2: Data Binding (Inspector Popover)

- **Trigger:** Click "Bind Data" icon on any text/image/link property in the Inspector.
- **Popover:** 240px wide. Lists available collections → click collection → lists fields → click field to bind.
- **Bound indicator:** Purple database icon replaces the static value. Field name shown: `{{blog.title}}`.
- **Unbind:** Click the bound indicator to remove binding.

### State 3: Repeater Element

- **Setup:** User wraps a container in a repeater and selects a collection.
- **Canvas rendering:** Shows 3 preview clones by default (configurable 1-10).
- **Visual:** Repeater container has a dashed `--buildrick-info` border with "Repeater: [Collection]" label.
- **Edit mode:** Editing the first clone edits the template; other clones show the result.
- **Sort/filter:** Repeater settings popover — sort by field, filter conditions, limit count.

### State 4: CMS Preview Bar

- **Position:** Fixed above the canvas, 40px height, `--aqb-chrome-surface` bg, `--aqb-elevation-1`.
- **Content:** Collection selector dropdown + previous/next arrows + current item indicator ("Item 3/12").
- **Behavior:** Switching items updates all bound elements on canvas with that item's data.
- **Visible only** when the page has CMS-bound elements.

### State 5: E-Commerce Pre-Built Schema

- **Trigger:** Creating a new project with "E-commerce" type, or manually from CMS settings.
- **Pre-built collections:** Products (name, price, images, description, category, variants, inventory), Categories (name, slug, image), Orders (items, total, status, customer).
- **Fields are editable** — pre-built schemas are starting points, not locked.

### State 6: Empty CMS

- **Visual:** "No collections yet" + illustration + [Create Collection] button + "Or start with a template" link (e-commerce schema).

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Create collection | Opens setup modal | Modal fade-in, 150ms |
| Bind field to element | Inspector popover → select field | Popover appears, bind icon swap |
| Create repeater | Wraps selected container, assigns collection | Dashed border appears, clones render |
| Navigate CMS preview | Prev/next updates all bound content | Instant content swap, < 100ms |
| Add field to collection | New row in field list | Slide-in row, 150ms |
| Drag to reorder fields | Reorder with drag handle | 60fps drag tracking |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Collection setup modal open | < 100ms |
| Data binding (field selection → canvas update) | < 100ms |
| Repeater render (3 clones) | < 200ms |
| Repeater render (10 clones) | < 500ms |
| CMS preview item switch | < 100ms |
| Collection with 1000 items (preview navigation) | < 200ms per switch |

---

## Accessibility

- **Collection modal:** Focus trapped, Tab moves between fields, Escape to cancel
- **Field type selector:** `role="listbox"`, arrow keys navigate types
- **Data binding popover:** `role="dialog"`, keyboard navigable, Escape to close
- **CMS Preview Bar:** Previous/Next buttons `aria-label="Previous/Next CMS item"`, item count announced
- **Repeater:** Announced as "Repeater container with [N] items from [Collection]"
- **Bound fields:** `aria-label` includes "Data-bound to [collection].[field]"

---

## Implementation Notes

- Collections stored in project data via `Composer.cms.collections`
- Data binding stored as element metadata: `{ binding: { collection, field } }`
- Repeater rendering: template element cloned N times, each clone receives a data context
- CMS Preview Bar reads from `Composer.cms.getItems(collectionId)` and injects into bindings
- E-commerce schemas defined in `src/blocks/ecommerce-schemas.ts`
- Field type validation rules defined per type (e.g., Email validates format, Number validates range)

---

## Related Documentation
- [Canvas](../canvas/README.md) — Repeaters render here, preview bar sits above
- [Inspector](../inspector/README.md) — Data binding popover on properties
- [Pages Tab](../pages-tab/README.md) — CMS pages (dynamic routes) appear in page list
- [Style Guide](../../design-system/style-guide.md) — Modal, popover, and preview bar specs
