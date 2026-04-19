---
title: Card Components
description: Card patterns for settings, templates, assets, and element tiles
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Card Components

## Settings Card
- **Size:** ~120px × 100px (2-column grid in sidebar)
- **Background:** `--aqb-chrome-surface`
- **Border:** 1px `--aqb-chrome-border`
- **Border radius:** `--buildrick-design-radius-lg` (8px)
- **Padding:** `--buildrick-design-space-4` (16px)
- **Content:** Icon (24px, `--buildrick-text-secondary`) + label (`--aqb-heading-sm`)
- **Hover:** `--aqb-chrome-surface-hover` bg, border `--aqb-chrome-border-strong`
- **Click:** Triggers drill-in animation

## Template Card
- **Width:** Full sidebar width minus padding
- **Background:** `--aqb-chrome-surface`
- **Border radius:** `--buildrick-design-radius-lg`
- **Thumbnail:** 16:10 aspect ratio, rounded top corners, `object-fit: cover`
- **Content below:** Name (`--aqb-heading-sm`), category badge, "Use Template" button
- **Hover:** `--aqb-elevation-1` shadow, preview icon overlay on thumbnail

## Asset Card (Media)
- **Size:** Grid layout (2-3 columns in sidebar)
- **Thumbnail:** Square aspect ratio, `--buildrick-design-radius-md` corners
- **Filename:** Below, `--aqb-body-sm`, truncated with ellipsis
- **Hover overlay:** Semi-transparent `--aqb-chrome-bg` at 80% with action icons (Edit, Delete, Insert)
- **Selected:** 2px `--buildrick-accent` border

## Element Tile (Add Tab)
- **Size:** ~64px × 64px (grid layout)
- **Background:** `--aqb-chrome-surface`
- **Border:** 1px `--aqb-chrome-border`
- **Border radius:** `--buildrick-design-radius-md`
- **Content:** Icon (24px, centered) + label below (`--aqb-caption`, centered)
- **Hover:** `--aqb-chrome-surface-hover` bg, `--aqb-chrome-border-strong` border
- **Drag start:** 3px movement threshold, ghost at 50% opacity
- **Star (Favorite):** Small star icon top-right corner, `--buildrick-warning` when active
