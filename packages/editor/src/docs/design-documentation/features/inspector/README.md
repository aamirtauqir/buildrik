---
title: Inspector — Property Editing Panel
description: Design specification for the right-side property inspector with 3 tabs, pseudo-states, and responsive constraints
feature: inspector
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../design-system-tab/README.md
status: approved
---

# Inspector — Property Editing Panel

## Overview

The Inspector is the right-side panel (280px) where users edit the visual properties of whatever element is selected on the canvas. It transforms the abstract concept of CSS into visual, touchable controls. It has 3 tabs — Layout, Appearance, Effects — each with collapsible sections that auto-expand based on the selected element type.

**Primary User Goal:** Change any visual property of an element without writing CSS.
**Success Criteria:** A property change reflects on canvas within one frame (< 16ms).
**Key Pain Points Addressed:** Eliminates guessing CSS values; makes responsive design visual; integrates design tokens directly.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Hero Heading                 │ Element name
│ Section > Container > H1     │ Breadcrumb (clickable)
├──────────────────────────────┤
│ [Layout] [Appearance] [Effects]│ 3-tab navigation
├──────────────────────────────┤
│ ▼ Display & Position         │ ← Collapsible section
│   Display   [Block ▾]        │
│   Position  [Relative ▾]     │
│   Z-index   [auto    ]       │
│   Overflow  [Visible ▾]      │
├──────────────────────────────┤
│ ▼ Size                       │
│   W [auto    ][px▾] H [auto    ][px▾] │
│   ▸ More settings            │ ← Advanced toggle
├──────────────────────────────┤
│ ▼ Spacing                    │
│   ┌───[16]───┐               │ ← Visual box model
│   [8]        [8]             │    Margin (outer)
│   └───[16]───┘               │    Padding (inner)
├──────────────────────────────┤
│ ▸ Flexbox                    │ ← Collapsed (not a flex container)
├──────────────────────────────┤
│ ▼ Responsive Constraints     │
│   Flex Grow  [0]  Shrink [1] │
│   Behavior   [Scale ▾]       │
├──────────────────────────────┤
│ [Normal][Hover][Focus][Active]│ Pseudo-state selector
│ [🖥 Desktop ▾]               │ Breakpoint indicator
├──────────────────────────────┤
│ [🗑 Delete Element]          │
└──────────────────────────────┘
```

---

## Screen States

### State 1: No Element Selected (Empty State)

```
┌──────────────────────────────┐
│                              │
│           🎯                 │
│                              │
│   Select an element          │
│   to edit its properties     │
│                              │
│   Click any element on the   │
│   canvas, or select one in   │
│   the Layers panel            │
│                              │
└──────────────────────────────┘
```

- **Visual:** Centered vertically. Icon `--buildrick-text-tertiary`, heading `--aqb-heading-sm` `--buildrick-text-secondary`, body `--aqb-body-sm` `--buildrick-text-tertiary`.
- **No tabs visible** — the 3-tab navigation is hidden when nothing is selected.

### State 2: Single Element Selected

- **Element header:** Name + breadcrumb (see Layout Architecture above)
- **Tabs visible:** Layout, Appearance, Effects. Active tab: `--buildrick-accent` text + 2px bottom border.
- **Sections:** Auto-expanded based on element type:
  - Text element: Size + Spacing + Typography expanded
  - Container: Display + Size + Spacing + Flexbox/Grid expanded
  - Image: Size + Spacing + Background expanded
  - Button: Size + Spacing + Typography + Background + Border expanded

### State 3: Multi-Select (2+ Elements)

- **Header:** "3 elements selected" (no breadcrumb)
- **Sections:** Only properties common to ALL selected elements shown
- **Mixed values:** When selected elements have different values for a property, show "Mixed" placeholder in `--buildrick-text-tertiary` italic
- **Editing:** Changing a "Mixed" value applies to ALL selected elements

### State 4: Pseudo-State Editing

- **Pseudo-state bar:** 4 pill buttons below sections: Normal (default), :hover, :focus, :active, :disabled
- **Active pseudo-state:** `--buildrick-accent` background + white text
- **Visual indicator on canvas:** When editing :hover, canvas shows a subtle "HOVER" badge on the selected element

### State 5: Dev Mode

- **Toggle:** Switch in section header area
- **Visual:** Raw CSS textarea appears alongside (or replacing) visual controls
- **Bidirectional sync:** Editing CSS text updates visual controls; editing visual controls updates CSS text
- **Font:** `--aqb-code` (JetBrains Mono, 12px)

---

## Control Specifications

### Number Input with Unit Selector

```
┌──────────┬──────┐
│  320     │ px ▾ │
└──────────┴──────┘
```

- **Input:** 60px width, `--aqb-chrome-surface` bg, `--aqb-chrome-border` border, `--buildrick-design-radius-md`
- **Unit dropdown:** 40px width, attached right. Options: px, %, em, rem, vw, vh, auto
- **Interaction:** Click to focus + type. Up/down arrows increment by 1 (Shift+arrow: 10). Scroll to adjust.
- **Hover:** Border becomes `--aqb-chrome-border-strong`
- **Focus:** Border becomes `--buildrick-accent`, glow ring `--aqb-primary-glow`

### Color Picker

```
┌──────────────────┐
│ ■ #2563EB   [🎨] │
└──────────────────┘
```

- **Swatch:** 16x16px color preview square, `--buildrick-design-radius-sm`
- **Hex input:** Editable text field
- **Picker button:** Opens full color picker popover
- **Token integration:** When a design token matches the current color, show token name below hex: "Primary" in `--aqb-caption` `--buildrick-text-tertiary`

### 4-Value Box Control (Spacing)

```
         ┌──[16]──┐
         │        │
    [8]  │ PADDING│  [8]
         │        │
         └──[16]──┘
```

- **Layout:** Visual representation of the CSS box model
- **Inputs:** 4 number inputs positioned on top/right/bottom/left of a centered rectangle
- **Center label:** "MARGIN" (outer) or "PADDING" (inner) in `--aqb-caption` `--buildrick-text-tertiary`
- **Link all:** Clicking a link icon chains all 4 values (editing one changes all)
- **Colors:** Margin area `--aqb-warning-subtle` tint, Padding area `--aqb-info-subtle` tint

### Button Group

```
┌───┬───┬───┐
│ ⬅ │ ↔ │ ➡ │  ← Text align example
└───┴───┴───┘
```

- **Each button:** 32x32px, `--aqb-chrome-surface` bg, 1px `--aqb-chrome-border`
- **Active:** `--buildrick-accent-tint` bg, `--buildrick-accent` icon color
- **Hover:** `--aqb-chrome-surface-hover` bg

### Section Header (Collapsible)

```
┌──────────────────────────────┐
│ ▼ Display & Position         │
│ ▸ Flexbox           [?]     │  ← Collapsed, with help icon
└──────────────────────────────┘
```

- **Expanded (▼):** Section content visible below
- **Collapsed (▸):** Section content hidden; only header visible
- **Text:** `--aqb-heading-sm`, `--buildrick-text-primary`
- **Help icon (?):** Tooltip with brief explanation of the section
- **Click anywhere on header:** Toggles expand/collapse
- **Animation:** `--aqb-duration-short` (200ms) height transition, `--buildrick-ease-out`

---

## Tab Content

### Layout Tab
| Section | Auto-Expand When | Properties |
|---------|-----------------|------------|
| Display & Position | Always | display, position, z-index, overflow |
| Size | Always | width, height (with unit selector), min/max behind "More settings" |
| Spacing | Always | 4-value box for margin + padding |
| Flexbox | Element is `display: flex` | direction, justify, align, wrap, gap, grow, shrink |
| Grid | Element is `display: grid` | template-columns, template-rows, gap, auto-flow |
| Responsive Constraints | Element is inside flex/grid parent | flex-grow, flex-shrink, min-width, max-width, behavior presets |
| Visibility | Never (behind "More settings") | display toggle, visibility, opacity, clip |

### Appearance Tab
| Section | Auto-Expand When | Properties |
|---------|-----------------|------------|
| Background | Element has or commonly uses background | color, image, gradient, size, position |
| Typography | Element is text/heading/paragraph/button | font-family, size, weight, line-height, letter-spacing, align, decoration, transform, color |
| Border | Element has or commonly uses border | width (4-value), color, style, radius (4-corner) |
| CSS Classes | Behind "More settings" | Add/remove custom CSS classes |
| All CSS | Dev mode toggle | Raw CSS editor |

### Effects Tab
| Section | Auto-Expand When | Properties |
|---------|-----------------|------------|
| Shadows | Never (add manually) | box-shadow (multiple), text-shadow (multiple) |
| Filters | Never | blur, brightness, contrast, grayscale, etc. |
| Transforms | Never | translate, rotate, scale, skew |
| Animation | Never | GSAP presets, trigger, duration, easing, delay |
| Interactions | Never | Click/hover/scroll handlers |
| Link | Element is link/button | href, target, rel |
| AI Suggestions | When AI has recommendations | Confidence-tagged suggestions with "Apply" buttons |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Selection → Inspector populate | < 16ms (no loading state) |
| Property change → Canvas re-render | < 16ms (instant visual feedback) |
| Section expand/collapse | 200ms animation |
| Tab switch | < 100ms content swap |
| Property debounce for history | 500ms (rapid slider drags = one undo entry) |

---

## Accessibility

- **Tab key:** Moves focus between controls in reading order (top to bottom, left to right within sections)
- **Enter/Space:** Activates buttons, toggles, dropdowns
- **Arrow keys in number inputs:** Increment/decrement value by 1 (Shift+arrow: 10)
- **Section headers:** `role="button"`, `aria-expanded="true/false"`, Enter to toggle
- **Pseudo-state buttons:** `role="tablist"` with `role="tab"` for each state
- **Color picker:** Hex input is keyboard-accessible; color wheel is secondary (mouse-only is acceptable with hex as alternative)
- **Screen reader:** Announces "Layout tab selected, 5 sections, 3 expanded" when tab switches

---

## Related Documentation
- [Canvas](../canvas/README.md) — Selection drives inspector state
- [Design System Tab](../design-system-tab/README.md) — Color pickers show design tokens
- [Style Guide](../../design-system/style-guide.md) — Control component specifications
