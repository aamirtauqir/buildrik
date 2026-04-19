---
title: Button Components
description: All button variants, states, and sizes for the Buildrik editor
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../tokens/colors.md
  - ../style-guide.md
status: approved
---

# Buttons

## Variants

### Primary
- **Background:** `--buildrick-accent` (#2563EB)
- **Text:** White (#FFFFFF)
- **Hover:** `--buildrick-accent-hover` (#3B82F6)
- **Active:** `--buildrick-accent-pressed` (#1D4ED8)
- **Focus:** 2px `--aqb-primary-glow` outline
- **Disabled:** 40% opacity, no pointer events
- **Usage:** Main CTAs (Export, Publish, Apply Template)

### Secondary
- **Background:** Transparent
- **Border:** 1px solid `--aqb-chrome-border-strong`
- **Text:** `--buildrick-text-primary`
- **Hover:** `--aqb-chrome-surface-hover` bg
- **Usage:** Cancel, secondary actions, filter chips

### Ghost
- **Background:** Transparent, no border
- **Text:** `--buildrick-text-secondary`
- **Hover:** `--aqb-chrome-surface-hover` bg, text becomes `--buildrick-text-primary`
- **Usage:** Toolbar actions, toggles, "More settings"

### Danger
- **Background:** Transparent
- **Border:** 1px solid `--buildrick-error`
- **Text:** `--buildrick-error`
- **Hover:** `--aqb-error-subtle` bg
- **Usage:** Delete, Clear History, destructive actions

### Icon-Only
- **Background:** Transparent
- **Icon:** `--buildrick-text-secondary` (16px Lucide icon)
- **Hover:** `--aqb-chrome-surface-hover` bg circle
- **Active:** `--buildrick-accent` icon color
- **Usage:** Undo/Redo, zoom +/-, toolbar icons

## Sizes

| Size | Height | Padding (H) | Font | Icon |
|------|--------|-------------|------|------|
| Small | 28px | 8px | `--aqb-body-sm` (12px) | 14px |
| Medium | 32px | 12px | `--aqb-body` (13px) | 16px |
| Large | 40px | 16px | `--aqb-body` (13px) | 18px |

## Specs
- **Border radius:** `--buildrick-design-radius-md` (6px)
- **Icon-to-label gap:** `--buildrick-design-space-1` (4px)
- **Transition:** `--aqb-duration-micro` (100ms) `--buildrick-ease-out`
- **Min width:** 64px (text buttons), 28/32/40px (icon-only matches height)

## Do's and Don'ts

**Do:** Use Primary for the single most important action on screen. Use Ghost for repeated toolbar actions.

**Don't:** Use two Primary buttons side-by-side. Use Danger for non-destructive actions. Use Ghost for important CTAs.
