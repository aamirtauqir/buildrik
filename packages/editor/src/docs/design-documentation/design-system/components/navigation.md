---
title: Navigation Components
description: Rail, tabs, breadcrumb, context menu, and command palette specifications
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Navigation Components

## Left Rail (56px)
- **Background:** `--aqb-chrome-bg`
- **Border-right:** 1px `--aqb-chrome-border`
- **Icons:** 20px Lucide, `--buildrick-text-secondary`
- **Active icon:** `--buildrick-accent` color + 2px left border accent
- **Hover:** `--aqb-chrome-surface-hover` bg on 44px hit area
- **Tooltip:** Appears 200ms after hover, right-aligned. Tab name + shortcut key. `--aqb-chrome-surface` bg, `--aqb-elevation-2`, `--aqb-caption` text.
- **Grouping:** Top 6 icons (Creation) separated from bottom 4 (Configuration) by `--aqb-chrome-border` divider

## Sidebar Tabs
- **Container:** Row of tab labels inside the sidebar panel header
- **Tab label:** `--aqb-body-sm`, `--buildrick-text-secondary`
- **Active tab:** `--buildrick-text-primary`, 2px `--buildrick-accent` bottom border
- **Hover:** `--buildrick-text-primary`
- **Used in:** Inspector (Layout/Appearance/Effects), History (Versions/Activity), Media (My Library/Discovery)

## Breadcrumb
- **Context:** Top of canvas (element path) and top of Inspector (element hierarchy)
- **Segments:** `--aqb-body-sm`, `--buildrick-text-secondary`, separated by " > "
- **Hover:** Segment becomes `--buildrick-accent`, cursor pointer
- **Click:** Selects that ancestor element
- **Truncation:** If path > 4 segments, collapse middle with "..." popover

## Context Menu
- **Width:** 240px
- **Background:** `--aqb-chrome-surface`, `--aqb-elevation-2`, `--buildrick-design-radius-md`
- **Items:** 32px height, `--aqb-body` text, `--buildrick-text-secondary` for keyboard shortcuts (right-aligned)
- **Hover:** `--aqb-chrome-surface-hover` bg
- **Dividers:** 1px `--aqb-chrome-border` with 4px vertical padding
- **Submenus:** Arrow icon right-aligned, submenu opens to the right
- **Disabled items:** `--buildrick-text-tertiary`, no hover effect

## Command Palette (⌘K)
- **Width:** 480px, centered horizontally, top-third vertically
- **Background:** `--aqb-chrome-surface`, `--aqb-elevation-3`, `--buildrick-design-radius-xl`
- **Search input:** Full width, 44px height, auto-focus, `--aqb-heading-md` text
- **Results:** List below, 36px per item, fuzzy-matched characters highlighted in `--buildrick-accent`
- **Active result:** `--buildrick-accent-tint` bg
- **Sections:** "Recently Used" and "All Commands" separated by `--aqb-heading-sm` labels
- **Dismiss:** Escape or click outside
- **Keyboard:** Arrow keys navigate, Enter executes, Escape closes

## Page Tab Bar
- **Height:** 36px
- **Position:** Below top bar, full width
- **Background:** `--aqb-chrome-bg`
- **Tabs:** `--aqb-body-sm` text, `--buildrick-text-secondary`. Active: `--buildrick-text-primary` + 2px `--buildrick-accent` bottom border.
- **Add button (+):** Ghost icon button at end of tab row
- **Overflow:** Horizontal scroll with fade edges when > 8 tabs
