---
title: Pages Tab — Page Management
description: Design specification for the page list with inline SEO scoring, page settings, and CRUD operations
feature: pages-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../settings-tab/README.md
dependencies:
  - Canvas (page switch loads new content)
  - History (per-page undo stacks)
status: approved
---

# Pages Tab — Page Management

## Overview

The Pages Tab lists all pages in the project with inline SEO health indicators. Each page shows a colored dot (green/yellow/red) representing its SEO score. Users can create, duplicate, delete, reorder pages, set a homepage, and drill into Page Settings for SEO, social preview, and advanced configuration.

**Primary User Goal:** Navigate between pages and ensure each page is SEO-ready before publish.
**Success Criteria:** SEO score is visible at a glance without opening any settings panel.
**Key Pain Points Addressed:** SEO is no longer an afterthought buried in settings; it is surfaced inline.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Pages (5)         [+ New Page]│ Header + add button
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 🏠 Home           🟢 92  │ │ Homepage badge + SEO score
│ │    /                     │ │ Slug
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    About          🟡 64  │ │ Yellow = needs work
│ │    /about                │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    Blog           🟢 88  │ │
│ │    /blog                 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    Pricing        🔴 31  │ │ Red = critical issues
│ │    /pricing              │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │    Contact        🟡 58  │ │
│ │    /contact              │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Page List

- **Page cards:** 56px height, `--aqb-chrome-surface` bg, `--aqb-radius-md`, 8px padding. Active page: `--aqb-primary-subtle` bg, `--aqb-primary` left border (2px).
- **Page name:** `--aqb-body`, `--aqb-text-primary`. Homepage badge: 🏠 icon, `--aqb-primary`.
- **Slug:** `--aqb-caption`, `--aqb-text-tertiary`, below name.
- **SEO dot:** 8px circle, right-aligned. Green (#22C55E) >= 80, Yellow (#EAB308) 50-79, Red (#EF4444) < 50.
- **SEO score number:** `--aqb-caption`, same color as dot, right of dot.

### State 2: Page Settings (Drill-In)

- **Trigger:** Click gear icon on page row, or right-click → "Page Settings"
- **View:** Slides in, replacing page list. Back arrow + "Page Settings" header.
- **Tabs:** SEO, Social Preview, Advanced

**SEO Tab:**
| Field | Weight | Control |
|-------|--------|---------|
| Page Title | 25% | Text input, character counter (50-60 optimal), preview |
| Meta Description | 25% | Textarea, character counter (150-160 optimal) |
| Heading Structure | 25% | Read-only audit: H1 count, heading hierarchy check |
| Image Alt Text | 15% | Read-only audit: images without alt listed |
| URL Slug | 10% | Editable slug input with validation |

**Social Preview Tab:** Facebook + Twitter card previews with editable OG title, description, image.

**Advanced Tab:** Custom code injection (head/body), redirect rules, page-level permissions.

### State 3: Create New Page

- **Modal:** Name input + slug auto-generated from name. Template selector (optional).
- **Slug validation:** Real-time, shows error if duplicate.
- **Created page:** Auto-navigates to new page on canvas.

### State 4: Empty State (No Pages)

- **Visual:** "Create your first page" with [+ New Page] button centered.
- **Note:** This state only appears on brand-new projects.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click page card | Switch canvas to that page | 150ms crossfade on canvas |
| Click "+ New Page" | Opens create modal | Modal fade-in 150ms |
| Right-click page | Context menu: Set as Homepage, Duplicate, Rename, Delete | Instant popup |
| Drag page card | Reorder pages in list | 60fps drag tracking |
| Click SEO dot | Opens Page Settings → SEO tab | Slide-in from right, 200ms |
| Click gear icon | Opens Page Settings | Slide-in from right, 200ms |
| Delete page | Confirmation modal if page has content | Modal with "Cannot undo" warning |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Page list render | < 50ms (even with 50+ pages) |
| Page switch (canvas reload) | < 200ms |
| SEO score calculation | < 100ms per page |
| Slug validation (duplicate check) | < 50ms |
| Page Settings open | < 100ms |

---

## Accessibility

- **Page list:** `role="listbox"`, `role="option"` per page. Arrow keys navigate. Enter selects.
- **SEO dots:** `aria-label="SEO score [number] out of 100, [status]"` where status is good/needs-work/critical
- **Homepage badge:** `aria-label="Homepage"` on the icon
- **Page Settings tabs:** `role="tablist"`, keyboard navigable
- **Delete confirmation:** Focus trapped in modal, auto-focus on Cancel

---

## Implementation Notes

- SEO score calculated client-side from page content via `Composer.seo.calculateScore(pageId)`
- Score formula: title (25%) + description (25%) + headings (25%) + alt text (15%) + slug (10%)
- Each factor scores 0-100, weighted sum produces final score
- Page data stored as separate documents in project; switching pages swaps the active document
- Slug auto-generation: lowercase, hyphens, strip special characters

---

## Related Documentation
- [Canvas](../canvas/README.md) — Page switch loads content here
- [Settings Tab](../settings-tab/README.md) — Site-level SEO vs page-level SEO
- [Publish Tab](../publish-tab/README.md) — Pages must have SEO before publish
- [Style Guide](../../design-system/style-guide.md) — Card and badge specs
