# Pages Tab

> **Module:** Sidebar — Tab 4
> **Source:** `src/editor/sidebar/tabs/pages/`
> **Keyboard Shortcut:** P
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Pages tab manages all pages in the project. Users can create, duplicate, rename, delete, and reorder pages. Each page has its own SEO settings, social preview metadata, and can be designated as the homepage. **Inline SEO score badges** on each page list item give teams instant visibility into which pages need SEO attention without drilling into settings.

## Layout

```
+---------------------------+
| Pages                     |
| [+ Add Page]              |
+---------------------------+
| 🏠 Home        🟢 [⋯]   |
|    /                      |
+---------------------------+
| About           🟡 [⋯]   |
|    /about                 |
+---------------------------+
| Contact         🔴 [⋯]   |
|    /contact               |
+---------------------------+
| Blog            🟢 [⋯]   |
|    /blog                  |
+---------------------------+

🟢 = Good SEO  🟡 = Needs Work  🔴 = Poor SEO
```

## Fields

### Page List Item
| Element | Type | Behavior |
|---------|------|----------|
| Home icon (🏠) | Badge | Shown only on homepage |
| Page name | Text (editable) | Double-click to rename |
| Page path / slug | Text (secondary) | URL slug shown below name |
| **SEO score badge** | Color dot (🟢🟡🔴) | Inline on every page item; green = Good, yellow = Needs Work, red = Poor. No drill-in needed to see SEO status at a glance |
| More menu (⋯) | Dropdown | Duplicate, Delete, Set as Home, Page Settings |

### Page Settings Drawer (drill-in)

#### SEO Section
| Field | Type | Required | Default | Validation | Notes |
|-------|------|----------|---------|------------|-------|
| Page title | Text | No | Page name | Max 60 chars | Browser tab title + SEO title |
| Meta description | Textarea | No | Empty | Max 160 chars | Search engine description |
| URL slug | Text | Yes | Auto from name | Alphanumeric + hyphens | Page URL path |
| SEO score | Badge (expanded) | — | Computed | — | Detailed breakdown: title, description, headings, alt text, slug |

#### SEO Score Calculation Rules
| Factor | Weight | Good | Needs Work | Poor |
|--------|--------|------|------------|------|
| Page title set | 25% | Title 30-60 chars | Title < 30 or > 60 chars | No title |
| Meta description set | 25% | Description 120-160 chars | Description < 120 or > 160 chars | No description |
| Heading hierarchy | 25% | H1 present, proper H2-H6 order | H1 present but hierarchy gaps | No H1 |
| Image alt text | 15% | All images have alt text | > 50% of images have alt | < 50% have alt |
| Clean slug format | 10% | Lowercase, hyphens, descriptive | Has numbers or mixed case | Auto-generated/untouched |

#### Social Preview Section
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Social image | Image upload | No | None | Open Graph / Twitter card image |
| Social title | Text | No | Page title | Override title for social sharing |
| Social description | Textarea | No | Meta description | Override description for social sharing |

#### Advanced Section
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Custom head tags | Code editor | No | Empty | Inject custom HTML in `<head>` |
| No-index | Checkbox | No | false | Tell search engines not to index this page |

## Interactions

### Create New Page
- **Trigger:** Click "+ Add Page" button
- **Behavior:** New page created with default name "New Page" → auto-switches to new page → name field enters edit mode for immediate rename
- **Default:** New page starts empty (no elements)

### Switch Page
- **Trigger:** Click page item
- **Behavior:** Canvas switches to show selected page elements → PageRouter activates page → Inspector clears selection

### Rename Page
- **Trigger:** Double-click page name
- **Behavior:** Name becomes editable → Enter confirms → slug auto-updates to match (slugified name) → Escape cancels

### Duplicate Page
- **Trigger:** More menu → Duplicate
- **Behavior:** Full deep copy of page (all elements, styles, settings) → appended as "[Name] (Copy)" → user switches to copy

### Delete Page
- **Trigger:** More menu → Delete
- **Behavior:** Confirmation modal → on confirm, page deleted → switches to next available page
- **Guards:** Cannot delete the only remaining page; cannot delete homepage without setting another page as home first
- **Toast:** Warning toast if attempting to delete homepage

### Set as Homepage
- **Trigger:** More menu → Set as Home
- **Behavior:** Selected page becomes homepage (🏠 icon) → previous homepage loses icon → URL path becomes "/"

### Open Page Settings
- **Trigger:** More menu → Page Settings
- **Behavior:** Drill-in panel opens showing SEO, social preview, and advanced settings

### SEO Score Update
- **Trigger:** Automatic — recalculates on page settings change and on element changes (heading additions, image alt text changes)
- **Behavior:** Score computed from weighted factors → color dot updates inline on page list item → drill-in shows detailed breakdown

## Business Rules

1. Every project has exactly one homepage (path = "/")
2. Page slugs must be unique across the project
3. Slug auto-generated from page name but can be manually overridden
4. **SEO score badge is always visible** on each page list item — no drill-in needed to see which pages need attention
5. SEO score is informational — does not prevent publishing
6. Page order in the list can be rearranged (drag-and-drop)
7. Page tab bar in header reflects the same page list

## Screen Relationships
- **Bidirectional with:** Page Tab Bar in header (same page list)
- **To:** Canvas (page switch), All sidebar tabs (content changes per page)
- **Data coupling:** Active page ID shared globally; page changes trigger full canvas re-render; SEO score recalculates on element changes (heading structure, alt text)
