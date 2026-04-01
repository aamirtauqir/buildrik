---
title: Form Components
description: Input fields, selectors, toggles, and specialized editor controls
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Form Components

## Text Input
- **Height:** 32px
- **Background:** `--aqb-chrome-surface`
- **Border:** 1px `--aqb-chrome-border`
- **Text:** `--aqb-body` (13px), `--aqb-text-primary`
- **Placeholder:** `--aqb-text-tertiary`
- **Hover:** Border `--aqb-chrome-border-strong`
- **Focus:** Border `--aqb-primary`, 2px `--aqb-primary-glow` outline
- **Error:** Border `--aqb-error`, error message below in `--aqb-error` `--aqb-body-sm`
- **Disabled:** 40% opacity
- **Border radius:** `--aqb-radius-md` (6px)
- **Padding:** 0 8px

## Number Input with Unit Selector
```
┌──────────┬──────┐
│  320     │ px ▾ │
└──────────┴──────┘
```
- Same base as Text Input
- Number field: 60px width, right-aligned text
- Unit dropdown: 40px, attached right, `--aqb-chrome-border` left border
- Up/Down arrows: increment by 1 (Shift: 10)
- Scroll: adjust value (when focused)

## Select / Dropdown
- **Closed:** Same visual as Text Input with chevron icon right-aligned
- **Open:** Popover below with option list
- **Options:** 32px height each, full width, hover `--aqb-chrome-surface-hover`
- **Selected:** `--aqb-primary-subtle` bg, `--aqb-primary` text

## Toggle Switch
- **Track:** 36px × 20px, `--aqb-chrome-border` bg (off), `--aqb-primary` bg (on)
- **Thumb:** 16px circle, white
- **Transition:** 100ms ease-out
- **Label:** To the left, `--aqb-body` text

## Color Picker (Inline)
```
┌──────────────────┐
│ ■ #2563EB   [🎨] │
│ Token: Primary    │  ← Shows if value matches a design token
└──────────────────┘
```
- Swatch: 16x16px, `--aqb-radius-sm`
- Hex input: editable text
- Picker button: opens full color popover (HSL wheel + sliders)
- Token label: `--aqb-caption`, `--aqb-text-tertiary`

## Slider
- **Track:** 4px height, `--aqb-chrome-border` bg
- **Fill:** `--aqb-primary` from left to thumb position
- **Thumb:** 12px circle, white, `--aqb-elevation-1` shadow
- **Hover:** Thumb grows to 14px
- **Value label:** Above thumb during drag, `--aqb-caption` in `--aqb-primary` pill

## 4-Value Box Control (Spacing)
```
      ┌──[16]──┐
      │        │
 [8]  │ MARGIN │  [8]
      │        │
      └──[16]──┘
```
- Outer box: margin (tinted `--aqb-warning-subtle`)
- Inner box: padding (tinted `--aqb-info-subtle`)
- 4 number inputs positioned on edges
- Center label: MARGIN or PADDING in `--aqb-caption` `--aqb-text-tertiary`
- Link icon: chains all 4 values

## Search Input
- Same as Text Input with search icon (🔍) left-aligned
- Clear button (×) appears when text is entered
- Debounced: 150ms before firing search

## Code Editor
- **Font:** `--aqb-code` (JetBrains Mono, 12px)
- **Background:** `--aqb-chrome-bg` (darkest)
- **Line numbers:** `--aqb-text-tertiary`
- **Syntax highlighting:** Standard dark theme (keywords blue, strings green, comments gray)
- **Min height:** 120px, resizable
