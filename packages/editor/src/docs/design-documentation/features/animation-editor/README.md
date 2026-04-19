---
title: Animation Editor — GSAP-Powered Animations
description: Design specification for the animation editor with GSAP presets, triggers, timeline controls, and preview
feature: animation-editor
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../inspector/README.md
dependencies:
  - Canvas (preview mode renders animations)
  - Inspector (animation section in Effects tab)
status: approved
priority: P2
---

# Animation Editor — GSAP-Powered Animations

## Overview

The Animation Editor lets users add motion to elements using GSAP presets without writing code. Users select from preset animations (fade, slide, scale, bounce, rotate, flip), configure a trigger (load, scroll, hover, click), and fine-tune duration, easing, and delay. A preview mode plays the animation in context on the canvas. This feature is P2 priority — functional but not the primary editing experience.

**Primary User Goal:** Add polished animations to elements in under 30 seconds per element.
**Success Criteria:** Animation preview matches the final published result exactly.
**Key Pain Points Addressed:** No GSAP knowledge required; visual controls replace code-based animation setup.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px (Inspector)
│ ▼ Animation                  │ Effects tab section
├──────────────────────────────┤
│ Preset                       │
│ ┌────┐┌────┐┌────┐┌────┐   │
│ │fade││slide││scale││bounce│  │ Preset grid
│ └────┘└────┘└────┘└────┘   │
│ ┌────┐┌────┐                │
│ │rot.││flip │                │
│ └────┘└────┘                │
├──────────────────────────────┤
│ Trigger      [On Load    ▾]  │ Trigger selector
├──────────────────────────────┤
│ Duration     [0.6  ][s ▾]   │ Number + unit
│ Easing       [ease-out  ▾]   │ Easing dropdown
│ Delay        [0    ][s ▾]   │ Number + unit
├──────────────────────────────┤
│ Direction                    │
│ [↑ Up] [↓ Down] [← Left]   │ Direction buttons
│ [→ Right]                    │ (for slide/flip)
├──────────────────────────────┤
│ [▶ Preview Animation]        │ Preview button
│ [✕ Remove Animation]         │ Remove button
└──────────────────────────────┘
```

---

## Screen States

### State 1: No Animation (Default)

- **Section collapsed** in Inspector Effects tab.
- **Expand:** Shows preset grid with "Select an animation" prompt.
- **All controls disabled** until a preset is selected.

### State 2: Preset Selection

- **Preset cards:** 56x48px each, `--aqb-chrome-surface` bg, `--buildrick-design-radius-md`. Icon or mini-animation preview inside.
- **Hover:** Card border becomes `--buildrick-accent`, shows a micro-animation preview (200ms loop).
- **Selected:** `--buildrick-accent` bg, white icon. Other controls become enabled.
- **Presets available:**

| Preset | GSAP Properties | Default Duration |
|--------|----------------|-----------------|
| Fade | `opacity: 0 → 1` | 0.6s |
| Slide | `x/y: ±100px → 0, opacity: 0 → 1` | 0.8s |
| Scale | `scale: 0.5 → 1, opacity: 0 → 1` | 0.6s |
| Bounce | `y: -20px → 0` with bounce ease | 1.0s |
| Rotate | `rotation: -90 → 0, opacity: 0 → 1` | 0.8s |
| Flip | `rotationY: 90 → 0` with perspective | 0.8s |

### State 3: Trigger Configuration

- **Dropdown options:**
  - **On Load:** Plays when page loads (or element enters viewport).
  - **On Scroll:** Plays when element scrolls into view. Additional controls: offset threshold (0-100%).
  - **On Hover:** Plays when user hovers the element. Reverse on mouse-leave toggle.
  - **On Click:** Plays when user clicks the element. Toggle or one-shot selector.
- **Scroll-specific:** Threshold slider appears when "On Scroll" selected.

### State 4: Fine-Tuning Controls

- **Duration:** Number input, 0.1-10s range, step 0.1. Unit selector (s/ms).
- **Easing:** Dropdown with visual curve previews. Options: ease-in, ease-out, ease-in-out, linear, bounce, elastic, back, power1-4.
- **Delay:** Number input, 0-5s range, step 0.1.
- **Direction:** Button group, only visible for directional presets (slide, flip). Options depend on preset.

### State 5: Preview Mode

- **Trigger:** Click "Preview Animation" button.
- **Canvas:** Selected element plays the configured animation once.
- **Button changes:** "Preview Animation" becomes "Replay" during/after preview.
- **Reset:** Element returns to its animated end-state after preview. Click "Replay" to see again.
- **Full preview:** Use canvas Preview Mode (Ctrl+P) to test trigger-based animations in context.

### State 6: Multiple Animations (Sequence)

- **List:** If element has multiple animations, shown as ordered list with drag handles.
- **Each entry:** Preset name + trigger + duration. Click to expand and edit.
- **Sequencing:** Animations play in order, each starting after the previous completes (unless delay is set).
- **Add:** [+ Add Animation] button below the list.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click preset card | Selects animation, enables controls | Card highlights, micro-preview plays |
| Change trigger | Updates animation trigger | Instant, no canvas change until preview |
| Adjust duration/easing | Updates animation config | Instant |
| Click "Preview Animation" | Plays animation on canvas element | GSAP animation plays |
| Click "Remove Animation" | Clears animation from element | Confirmation if complex setup |
| Drag animation in sequence | Reorder multiple animations | 60fps drag |
| Hover preset card | Micro-animation preview | 200ms loop on the card itself |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Animation preview start | < 100ms after click |
| GSAP animation frame rate | 60fps |
| Preset selection → controls enable | < 50ms |
| Animation config save | < 100ms (auto-save to element data) |
| Page with 20+ animated elements | 60fps on load sequence |

---

## Accessibility

- **Preset grid:** `role="radiogroup"`, each card `role="radio"`, arrow keys to navigate
- **Trigger dropdown:** Standard `<select>` semantics, keyboard navigable
- **Duration/delay inputs:** Arrow keys increment by 0.1, Shift+arrow by 1.0
- **Preview button:** `aria-label="Preview animation on selected element"`
- **Reduced motion:** When `prefers-reduced-motion` is set, animations are instant (duration: 0). Preview shows a "Reduced motion active" notice.
- **Easing dropdown:** Each option has `aria-label` describing the curve feel (e.g., "ease-out: starts fast, ends slow")

---

## Implementation Notes

- Animation data stored as element metadata: `{ preset, trigger, duration, easing, delay, direction }`
- GSAP imported dynamically only when animations are present (code-split for bundle size)
- Preview uses `gsap.fromTo()` on the actual DOM element with `overwrite: true`
- Scroll trigger uses GSAP ScrollTrigger plugin with configurable threshold
- Published output: GSAP CDN link + inline script generated per animated element
- Export: animation config translated to GSAP code in the exported output
- P2 priority: core editing (P1) takes precedence in development timeline

---

## Related Documentation
- [Canvas](../canvas/README.md) — Preview mode renders animations
- [Inspector](../inspector/README.md) — Animation section in Effects tab
- [Export Modal](../export-modal/README.md) — Animations exported as GSAP code
- [Style Guide](../../design-system/style-guide.md) — Control and button specs
