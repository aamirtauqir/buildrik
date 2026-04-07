---
title: Design System Tab — Visual Token Editor
description: Design specification for the visual design token editor with color palettes, typography, spacing, and export
feature: design-system-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../inspector/README.md
  - ../media-tab/README.md
dependencies:
  - Inspector (color pickers show matching tokens)
  - Media Tab (font uploads register here)
status: approved
---

# Design System Tab — Visual Token Editor

## Overview

The Design System Tab is where users define and manage their project's visual language: colors, typography, spacing, and effects. Tokens are presented as visual, editable elements — not code. A 3-column color palette grid, font previews with live text, proportional spacing bars, and effect preview boxes make abstract design decisions tangible. First-time users get a Brand Setup Wizard that seeds 30+ tokens from a logo or brand colors.

**Primary User Goal:** Define a consistent visual language once, then reference it everywhere via tokens.
**Success Criteria:** Changing a token value updates all referencing elements in < 200ms.
**Key Pain Points Addressed:** Eliminates hardcoded hex values scattered across elements; makes design consistency enforceable.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ Design System       [Export ▾]│ Header + export menu
├──────────────────────────────┤
│ [Colors][Type][Space][Effects]│ 4-tab navigation
├──────────────────────────────┤
│ 🔒 Lock Tokens  [toggle]    │ Lock toggle
├──────────────────────────────┤
│ ▼ Brand Colors               │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ P  │ │ S  │ │ A  │       │ 3-column palette
│ │    │ │    │ │    │       │ grid
│ └────┘ └────┘ └────┘       │
│ Primary Secondary  Accent    │
│ #2563EB #7C3AED   #F59E0B   │
├──────────────────────────────┤
│ ▼ Neutral Colors             │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │    │ │    │ │    │       │
│ └────┘ └────┘ └────┘       │
│ bg-50   bg-100  bg-200      │
├──────────────────────────────┤
│ ▼ Semantic Colors            │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ ✓  │ │ ⚠  │ │ ✕  │       │
│ └────┘ └────┘ └────┘       │
│ Success Warning  Error       │
│                [+ Add Color] │
└──────────────────────────────┘
```

---

## Screen States

### State 1: Colors Tab (Default)

- **Palette grid:** 3-column layout. Each swatch: 72x56px, `--aqb-radius-md`, displays the color fill.
- **Token name:** `--aqb-caption`, `--aqb-text-secondary`, centered below swatch.
- **Hex value:** `--aqb-caption`, `--aqb-text-tertiary`, below name.
- **Click swatch:** Opens color picker popover with hex, RGB, HSL inputs + design token name editor.
- **Add color:** "+" button at end of group, `--aqb-chrome-border` dashed border.
- **Groups:** Brand Colors, Neutral Colors, Semantic Colors. Each collapsible.

### State 2: Typography Tab

- **Font entries:** Full-width cards showing font preview in the actual font face.
- **Preview text:** "The quick brown fox jumps over the lazy dog" rendered in each font at its defined size.
- **Properties per entry:** Font family, size, weight, line-height, letter-spacing. Inline editable.
- **Categories:** Headings (H1-H6), Body, Caption, Code.
- **Add font:** Opens font picker (system fonts + uploaded fonts from Media Tab).

### State 3: Spacing Tab

- **Proportional bars:** Horizontal bars where length represents the spacing value.
- **Scale:** Base unit 4px. Default scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Each entry:** Token name ("space-xs") + bar visual + value in px.
- **Edit:** Click value to edit. Bar updates proportionally.
- **Visual reference:** Shows which spacing value maps to which CSS variable.

### State 4: Effects Tab

- **Preview boxes:** 80x60px boxes demonstrating the effect (shadow, blur, border-radius).
- **Shadow tokens:** Box with the shadow applied visually. Click to edit x/y/blur/spread/color.
- **Border radius tokens:** Rounded rectangle demonstrating the radius value.
- **Transition tokens:** Animated dot showing the easing curve.

### State 5: Brand Setup Wizard (First Use)

- **Trigger:** First time opening Design System Tab (or from Settings → Advanced → Reset)
- **Step 1:** Upload logo or enter brand colors manually (up to 3 primary colors)
- **Step 2:** AI generates a full palette: primary shades (50-900), neutrals, semantic colors
- **Step 3:** Typography suggestions based on brand style (modern/classic/playful)
- **Step 4:** Review + apply. Seeds 30+ tokens across all categories.
- **Skippable:** "Skip, I'll set up manually" link.

### State 6: Lock Tokens

- **Toggle on:** All token values become read-only. Swatches show lock badge. Prevents accidental changes.
- **Inspector integration:** When locked, Inspector color pickers can only pick from existing tokens (no free-form hex).
- **Override:** Users with Owner role can unlock. Editors see "Tokens are locked by [Owner Name]".

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click color swatch | Opens color picker popover | Popover fade-in, 150ms |
| Edit token value | All referencing elements update live | Instant propagation, < 200ms |
| Toggle Lock Tokens | All swatches gain/lose lock badge | Badge fade, 200ms |
| Click Export | Dropdown: CSS Variables, JSON, Tailwind Config | Dropdown appears, 150ms |
| Run Brand Setup Wizard | Multi-step modal | Step slide transitions, 200ms |
| Drag to reorder tokens | Changes display order within category | 60fps drag |
| Delete token | Confirmation if token is referenced by elements | Modal with reference count |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Token change → element update | < 200ms across all referencing elements |
| Tab switch (Colors/Type/Space/Effects) | < 100ms |
| Brand Setup Wizard AI generation | < 3s |
| Export generation | < 500ms for any format |
| Initial load (30+ tokens) | < 100ms |

---

## Accessibility

- **Color swatches:** `role="button"`, `aria-label="[Token Name], [hex value]"`. Focus ring visible.
- **Color picker:** Hex input is primary keyboard path. Sliders have `aria-valuemin`/`aria-valuemax`.
- **Typography previews:** `aria-label` includes font name, size, weight
- **Lock toggle:** `role="switch"`, `aria-checked`, announces "Tokens locked/unlocked"
- **Contrast check:** Color picker shows WCAG contrast ratio when editing text/bg color pairs

---

## Implementation Notes

- Tokens stored in `Composer.designSystem` as a flat map of `{ name, category, value, references[] }`
- Token changes emit `designSystem:tokenUpdated` event; all subscribed elements re-render
- Export formats generated client-side: CSS `var()`, JSON object, or Tailwind `theme.extend` config
- Brand Setup Wizard calls `ai/` utilities for palette generation from seed colors
- Font uploads from Media Tab call `Composer.designSystem.registerFont()` to add typography tokens
- Lock state stored per-project, synced via SyncManager

---

## Related Documentation
- [Inspector](../inspector/README.md) — Color pickers show matching design tokens
- [Media Tab](../media-tab/README.md) — Font uploads auto-register as typography tokens
- [Style Guide](../../design-system/style-guide.md) — Token naming conventions and values
- [AI Assistant](../ai-assistant/README.md) — Powers Brand Setup Wizard palette generation
