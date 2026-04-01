# Templates Tab

> **Module:** Sidebar — Tab 2
> **Source:** `src/editor/sidebar/tabs/templates/`
> **Keyboard Shortcut:** T
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Templates tab lets users browse and apply pre-built page templates. Templates provide complete page layouts (hero, features, pricing, etc.) that users can customize after applying. Includes preview, **visual side-by-side comparison before applying**, and team-shared template management.

## Layout

```
+---------------------------+
| [Search: "Find templates"]|
+---------------------------+
| [Filter: All | Landing |  |
|  Portfolio | E-commerce |  |
|  Blog | Dashboard]        |
+---------------------------+
| [Template Card]           |
|  [Preview thumbnail]      |
|  "Landing Page - Modern"  |
|  [Use Template]           |
+---------------------------+
| [Template Card]           |
|  [Preview thumbnail]      |
|  "Portfolio - Minimal"    |
|  [Use Template]           |
+---------------------------+
| ...more templates...      |
+---------------------------+
| My Templates              |
|  [Saved Template 1]       |
|  [Saved Template 2]       |
+---------------------------+
| [Save Current Page ★]     |
+---------------------------+
```

## Fields

### Search & Filter
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Search | Text input | No | Empty | Filter templates by name |
| Category filter | Chip group | No | "All" | Landing, Portfolio, E-commerce, Blog, Dashboard |

### Template Cards
| Element | Type | Behavior |
|---------|------|----------|
| Thumbnail | Image | Preview of the template design |
| Name | Text | Template display name |
| Category badge | Badge | Template category label |
| "Use Template" button | Button | Opens side-by-side comparison before applying |
| Preview button | Icon | Opens full-size template preview |

## Interactions

### Browse Templates
- **Trigger:** Open Templates tab
- **Behavior:** Template grid loads with all available templates → filter chips narrow results → search further refines

### Preview Template
- **Trigger:** Click template preview icon
- **Behavior:** Full-size preview modal opens → shows template design at desktop width → close button or Escape to dismiss

### Apply Template (with Visual Comparison)
- **Trigger:** Click "Use Template" button
- **Behavior:** **Side-by-side comparison drawer opens** showing "Current Page" (left) alongside "Template Preview" (right) → options: Replace current page / Add to new page → progress overlay shows during apply → canvas updates with template content → toast "Template applied"
- **Visual comparison:** Both sides show rendered previews, not text descriptions. Designers are visual — show, don't tell.
- **Warning:** If current page has unsaved changes, comparison highlights "You have unsaved changes" with Save/Discard option
- **Undo:** Single undo action reverts entire template apply

### Save Current Page as Template
- **Trigger:** Click "Save Current Page" button (prominently placed at bottom of tab) or context menu
- **Behavior:** Name input modal → saves current page structure to "My Templates" section → synced via SyncManager for team access
- **Prominence:** This action is surfaced as a visible button (not buried in context menu) because design teams frequently save one page pattern and repeat it for subsequent client pages

### Delete Saved Template
- **Trigger:** Right-click or hover menu on saved template
- **Behavior:** Confirmation modal → deletes from My Templates

## Business Rules

1. Applying a template replaces all elements on the target page
2. Template apply is wrapped in a single history transaction (one undo step)
3. Templates are sourced from: built-in library (`templatesData.ts`) + TemplateManager (remote API) + user-saved (synced via SyncManager for team projects)
4. Template previews are static images, not live renders
5. Recently applied templates are tracked for quick re-access
6. **"Save as Template" is a primary action** — prominently placed, not buried. Design teams use this to replicate page patterns across client projects.
7. My Templates sync across team members via SyncManager for collaborative projects

## Screen Relationships
- **To:** Canvas (template elements rendered on canvas)
- **Data coupling:** Template apply triggers full page rebuild → Layers tab refreshes, Inspector clears selection
