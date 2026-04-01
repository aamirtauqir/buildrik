---
title: Animation Tokens
description: Motion system — easing functions, duration scale, and critical rules
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Animation Tokens

## Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-out` | `cubic-bezier(0.0, 0, 0.2, 1)` | Entrances, expansions |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State transitions, drill-in |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful: achievements, selection bounce |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, things leaving view |

## Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 0ms | **Core editing loop — NO animation** |
| `micro` | 100ms | Hover states, toggles |
| `short` | 200ms | Dropdowns, tooltips, tab switch |
| `medium` | 300ms | Panel slide, drill-in, modal appear |
| `long` | 500ms | Page transitions, export progress |

## Critical Rule

**The core editing loop (Canvas ↔ Inspector ↔ Layers) uses 0ms transitions.** Selection, property population, style application, layer highlighting — all instant. Animation is ONLY for UI chrome (tab switches, modal opens, drill-ins). This is non-negotiable for the < 16ms performance target.

## Reduced Motion
All animations respect `prefers-reduced-motion: reduce`. When set, all durations become 0.01ms.
