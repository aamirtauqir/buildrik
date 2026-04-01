---
title: Components Tab — Reusable Components
description: Design specification for creating, managing, and instancing reusable components with variants
feature: components-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../layers-tab/README.md
  - ../design-system-tab/README.md
dependencies:
  - Canvas (component instances render here, variant switching via context menu)
  - Layers Tab (instances shown with component badge)
status: approved
---

# Components Tab — Reusable Components

## Overview

The Components Tab enables users to create reusable UI components with variants (Primary/Secondary/Outline). Instances placed on the canvas auto-sync when the main component is edited, while still allowing per-instance overrides. Two creation paths exist: "From Selection" (select elements on canvas, convert) and "From Scratch" (blank component shell).

**Primary User Goal:** Build once, reuse everywhere — edit the main component and all instances update.
**Success Criteria:** Editing a main component propagates changes to all instances in < 100ms.
**Key Pain Points Addressed:** Eliminates copy-paste drift; enforces consistency across pages.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Components (12)    [+ Create]│ Header + create button
├──────────────────────────────┤
│ [All] [In Use] [Unused]     │ Filter tabs
├──────────────────────────────┤
│ 🔍 Search components...      │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ ┌────┐  Button           │ │
│ │ │ Btn│  3 variants       │ │ Thumbnail + info
│ │ └────┘  Used 14×         │ │ Instance count
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌────┐  Card             │ │
│ │ │Card│  2 variants       │ │
│ │ └────┘  Used 8×          │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌────┐  Nav Bar          │ │
│ │ │Nav │  1 variant        │ │
│ │ └────┘  Used 5×          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Component List

- **Component cards:** 64px height, `--aqb-chrome-surface` bg, `--aqb-radius-md`. Thumbnail (40x40px) left, name + metadata right.
- **Name:** `--aqb-body`, `--aqb-text-primary`.
- **Metadata:** `--aqb-caption`, `--aqb-text-tertiary`. Shows variant count and usage count.
- **Filter tabs:** All (default), In Use (instances exist), Unused (zero instances). Active: `--aqb-primary` text + underline.
- **Hover:** `--aqb-chrome-surface-hover` bg, drag handle appears.

### State 2: Create Component — From Selection

- **Trigger:** Select elements on canvas → right-click → "Create Component", or click [+ Create] → "From Selection"
- **Modal:** Name input, initial variant name (default: "Default"). Selected elements become the component body.
- **Result:** Selected elements wrapped in component instance. Main component added to list.

### State 3: Create Component — From Scratch

- **Trigger:** [+ Create] → "From Scratch"
- **Modal:** Name input, size (width/height), initial variant name.
- **Result:** Empty component shell created. Opens in isolated editing canvas.

### State 4: Component Detail (Drill-In)

- **Trigger:** Click component card
- **View:** Slides in, replacing list. Back arrow + component name header.
- **Variant list:** Each variant as a row — name, thumbnail, [Edit] button
- **Actions:** [+ Add Variant], [Edit Main], [Detach All Instances], [Delete Component]
- **Instance list:** Shows all pages/locations where instances exist, clickable to navigate

### State 5: Variant Editing

- **Isolated canvas:** Main component renders in a focused view (no page context)
- **Variant switcher:** Tab bar at top of canvas showing all variants. Click to switch.
- **Properties panel:** Shows which properties differ from base variant (highlighted in `--aqb-primary`)
- **Exit:** "Back to Page" button returns to normal canvas

### State 6: Empty State

- **Visual:** Illustration + "Create your first component" + two paths: "From Selection" and "From Scratch" as side-by-side cards.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Drag component to canvas | Creates new instance at drop point | Ghost preview, standard drag flow |
| Click component card | Opens detail drill-in | Slide-in from right, 200ms |
| Right-click instance on canvas | Context menu includes "Switch Variant" submenu | Instant popup |
| Edit main component | All instances update automatically | Instances flash briefly (200ms `--aqb-primary` outline) |
| Override instance property | Instance diverges from main for that property | Override indicator dot on property |
| Reset override | Instance property reverts to main value | Instant |
| Detach instance | Converts to regular elements (breaks link) | Confirmation modal |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Component list render | < 50ms |
| Instance propagation (edit main) | < 100ms across all instances |
| Variant switch | < 50ms |
| Drag to canvas (create instance) | < 16ms |
| Component search/filter | < 100ms |

---

## Accessibility

- **Component list:** `role="listbox"`, arrow keys navigate, Enter opens detail
- **Filter tabs:** `role="tablist"`, arrow keys switch between All/In Use/Unused
- **Variant switcher:** `role="tablist"` in isolated editing canvas
- **Create modal:** Focus trapped, Escape to cancel, auto-focus on name input
- **Context menu (Switch Variant):** Keyboard accessible via right-click equivalent (Shift+F10)

---

## Implementation Notes

- Components stored as serialized element trees with variant overrides as diff objects
- Instance rendering: base variant + override patches applied at render time
- Propagation: editing main triggers `component:updated` event; all instances re-render
- Variant switching updates the active diff object, not the DOM structure
- "Unused" filter checks instance count across all pages via `Composer.components.getUsageCount()`

---

## Related Documentation
- [Canvas](../canvas/README.md) — Instances render here, variant switching in context menu
- [Layers Tab](../layers-tab/README.md) — Instances show component badge in tree
- [Design System Tab](../design-system-tab/README.md) — Components can reference design tokens
- [Style Guide](../../design-system/style-guide.md) — Card and modal specs
