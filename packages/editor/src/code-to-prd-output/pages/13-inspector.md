# Inspector (Right Panel)

> **Module:** Inspector
> **Source:** `src/editor/inspector/`
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Inspector is the right-side property panel (280px) that displays and edits all properties of the currently selected element. It has 3 tabs — Layout, Appearance, and Effects — each containing collapsible sections with property-specific controls. It supports pseudo-state editing, responsive breakpoint overrides, multi-select editing, CMS data binding, and **responsive constraints** for controlling element behavior across breakpoints.

## Layout

```
+-------------------------------+
| [Element: "Hero Heading"]     |
| [Breadcrumb: Section > Div >] |
+-------------------------------+
| [Layout] [Appearance] [Effects]|
+-------------------------------+
| ▼ Display & Position          |
|   Display: [Flex ▾]           |
|   Position: [Relative ▾]     |
+-------------------------------+
| ▼ Size                        |
|   Width:  [auto   ] [px ▾]   |
|   Height: [auto   ] [px ▾]   |
|   Min W:  [—      ] [px ▾]   |
|   Max W:  [—      ] [px ▾]   |
+-------------------------------+
| ▼ Spacing                     |
|   +---[16]---+                |
|   |[8]   [8]|                |
|   +---[16]---+                |
|   (margin/padding box)        |
+-------------------------------+
| ▼ Flexbox / Grid              |
|   Direction: [Row ▾]         |
|   Justify:   [⬅ ↔ ➡ ↕]     |
|   Align:     [⬆ ↕ ⬇]       |
|   Gap:       [8px]           |
+-------------------------------+
| ▼ Responsive Constraints      |
|   Flex Grow:   [0]           |
|   Flex Shrink: [1]           |
|   Min Width:   [—]           |
|   Max Width:   [—]           |
|   Behavior:    [Scale ▾]     |
+-------------------------------+
| [Pseudo: Normal|Hover|Focus]  |
| [Breakpoint: 🖥 Desktop]      |
+-------------------------------+
| [🗑 Delete Element]           |
+-------------------------------+
```

## Tabs

### Layout Tab
Sections for controlling element positioning, sizing, and spatial relationships.

| Section | Properties |
|---------|-----------|
| **Display & Position** | display (block/flex/grid/inline/none), position (static/relative/absolute/fixed/sticky), z-index, overflow |
| **Size** | width, height, min-width, max-width, min-height, max-height (with unit selector: px, %, em, rem, vw, vh, auto) |
| **Spacing** | margin (4 sides), padding (4 sides) — visual box model control |
| **Flexbox** | flex-direction, justify-content, align-items, flex-wrap, gap, flex-grow, flex-shrink, flex-basis |
| **Grid** | grid-template-columns, grid-template-rows, grid-gap, grid-auto-flow |
| **Responsive Constraints** | flex-grow, flex-shrink, min-width, max-width constraints for controlling element behavior across breakpoints. Behavior presets: Scale (proportional), Fixed (constant size), Fill (expand to container), Shrink-to-fit (content-based) |
| **Visibility** | display, visibility, opacity, clip |

### Appearance Tab
Sections for visual styling — colors, typography, borders, backgrounds.

| Section | Properties |
|---------|-----------|
| **Background** | background-color, background-image, background-gradient, background-size, background-position |
| **Typography** | font-family, font-size, font-weight, line-height, letter-spacing, text-align, text-decoration, text-transform, color |
| **Border** | border-width (4 sides), border-color, border-style (solid/dashed/dotted/none), border-radius (4 corners) |
| **CSS Classes** | Add/remove custom CSS classes |
| **All CSS** | Dev mode: raw CSS editor for power users |

### Effects Tab
Sections for animations, transforms, and visual effects.

| Section | Properties |
|---------|-----------|
| **Shadows** | box-shadow (multiple), text-shadow (multiple) — offset, blur, spread, color |
| **Filters** | blur, brightness, contrast, grayscale, hue-rotate, invert, opacity, saturate, sepia |
| **Transforms** | translate (X, Y, Z), rotate, scale (X, Y), skew (X, Y) |
| **Animation** | GSAP animation presets + custom: trigger (load/scroll/hover/click), duration, easing, delay |
| **Interactions** | Click handlers, hover effects, scroll triggers — bind to InteractionManager |
| **Link** | href, target (_blank/_self), rel (nofollow/noopener) |
| **AI Suggestions** | AI-powered design improvement recommendations with confidence levels (High/Medium/Suggestion) |

## Controls

### Property Input Types
| Control | Used For | Example |
|---------|----------|---------|
| Number input + unit selector | Sizes, spacing, positions | Width: `[200] [px ▾]` |
| Color picker | Colors | Background: `[#2563EB 🎨]` |
| Select dropdown | Enumerated values | Display: `[Flex ▾]` |
| Button group | Binary/ternary options | Text align: `[⬅ ↔ ➡]` |
| Slider | Ranges | Opacity: `[——●——] 80%` |
| 4-value box control | Margin, padding | Visual box with 4 input fields |
| Toggle | Boolean values | Overflow hidden: `[ON/OFF]` |
| Alignment grid | Position | 9-point visual grid selector |
| Preset grid | Quick layouts | Common grid/flex presets |
| Code editor | Raw CSS | Monospace textarea for custom CSS |

### Pseudo-State Selector
| State | Edits |
|-------|-------|
| Normal | Default element state |
| :hover | Styles when cursor hovers |
| :focus | Styles when element is focused |
| :active | Styles when element is pressed |
| :disabled | Styles when element is disabled |

### Breakpoint Indicator
Shows which responsive breakpoint is being edited. Styles set on a breakpoint only apply at that viewport width.

| Device | Width |
|--------|-------|
| Desktop | 1280px |
| Tablet | 768px |
| Mobile | 375px |

## Interactions

### Edit Property
- **Trigger:** Change any input control
- **Behavior:** Style immediately applied to element on canvas → Composer `styles.update()` called → history entry created → canvas re-renders
- **Live preview:** Changes visible in real-time as user drags sliders or types values
- **Performance target:** < 16ms from input change to canvas re-render (one frame)

### Switch Pseudo-State
- **Trigger:** Click pseudo-state button (Hover, Focus, etc.)
- **Behavior:** Inspector shows styles for that pseudo-state → edits apply to that state only → canvas may show visual indicator of which pseudo-state is active

### Multi-Select Editing
- **Trigger:** Multiple elements selected on canvas
- **Behavior:** Inspector shows only properties common to all selected elements → editing a property applies to all selected elements → mixed values shown as placeholder "Mixed"

### CMS Data Binding
- **Trigger:** Click binding icon on supported properties
- **Behavior:** Binding popover opens → select CMS collection and field → property value dynamically bound to CMS data

### Delete Element
- **Trigger:** Click delete button at bottom of inspector
- **Behavior:** Confirmation modal → element deleted from canvas and DOM tree

### Empty State
- **Trigger:** No element selected
- **Behavior:** Inspector shows "Select an element to edit its properties" message

### Toggle Advanced Settings
- **Trigger:** Click "More settings" toggle in a section
- **Behavior:** Additional rarely-used properties revealed (e.g., min/max width in Size section)

### Dev Mode Toggle
- **Trigger:** Toggle dev mode switch
- **Behavior:** Shows raw CSS editing area alongside visual controls → edits in either place sync

## Business Rules

1. Inspector always shows properties of the currently selected element (single source: SelectionManager)
2. Multi-select shows intersection of properties; "Mixed" for differing values
3. Pseudo-state styles override normal styles at runtime (CSS specificity)
4. Breakpoint-specific styles only apply at that viewport width (via media queries)
5. Property changes are debounced/coalesced for history (500ms)
6. Inspector sections auto-expand/collapse based on element type (e.g., Flexbox section only for flex containers)
7. CMS-bound properties show a "bound" indicator and cannot be manually edited while bound
8. All property edits go through Composer → StyleEngine → history (never direct mutation)
9. **Responsive Constraints section** appears for all elements inside flex/grid containers — provides min/max width, flex-grow/shrink, and behavior presets (Scale, Fixed, Fill, Shrink-to-fit)
10. **AI Suggestions include confidence levels:** High (definite fix needed), Medium (likely improvement), Suggestion (optional enhancement)

## Screen Relationships
- **From:** Canvas (element selection), Layers tab (element selection)
- **To:** Canvas (style changes reflected immediately)
- **Data coupling:** Selection state from SelectionManager; style state from StyleEngine; section visibility from contextEvaluator
