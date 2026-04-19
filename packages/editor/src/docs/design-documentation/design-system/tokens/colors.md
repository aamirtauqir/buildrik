---
title: Color Tokens
description: Complete color palette documentation with semantic mapping, accessibility verification, and usage guidelines
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Color Tokens

## Overview
Buildrik uses a dark chrome / light canvas color strategy. The editor UI chrome is dark (Neutral-900 to Neutral-800) so the user's website design pops on a white canvas. All colors are defined as CSS custom properties prefixed with `--aqb-`.

## Editor Chrome Palette

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--aqb-chrome-bg` | `#0F1117` | Base background (rail, sidebar, inspector) |
| `--aqb-chrome-surface` | `#161922` | Raised surfaces (cards, panels, menus) |
| `--aqb-chrome-surface-hover` | `#1C2030` | Hovered surface |
| `--aqb-chrome-surface-active` | `#232840` | Active/pressed surface |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `--aqb-chrome-border` | `#2A2E3D` | Default subtle borders |
| `--aqb-chrome-border-strong` | `#3D4255` | Section dividers, emphasized borders |

### Canvas
| Token | Hex | Usage |
|-------|-----|-------|
| `--aqb-canvas-bg` | `#F8F9FB` | Canvas area outside the page |
| `--aqb-canvas-page` | `#FFFFFF` | The page surface (white like a browser) |
| `--aqb-canvas-grid` | `#E5E7EB` | Grid overlay lines |

## Brand & Interactive

### Primary Blue
| Token | Hex | Usage |
|-------|-----|-------|
| `--buildrick-accent` | `#2563EB` | CTAs, active states, selection |
| `--buildrick-accent-hover` | `#3B82F6` | Hover on primary elements |
| `--buildrick-accent-pressed` | `#1D4ED8` | Active/pressed |
| `--buildrick-accent-tint` | `rgba(37,99,235,0.08)` | Selected rows, hover backgrounds |
| `--aqb-primary-glow` | `rgba(37,99,235,0.25)` | Focus rings, selection glow |

### Semantic
| Token | Hex | Pairs With | Usage |
|-------|-----|-----------|-------|
| `--buildrick-success` | `#22C55E` | `--aqb-success-subtle` `rgba(34,197,94,0.1)` | Published, save confirmed, SEO good |
| `--buildrick-warning` | `#F59E0B` | `--aqb-warning-subtle` `rgba(245,158,11,0.1)` | Unsaved, SEO needs work, AI medium |
| `--buildrick-error` | `#EF4444` | `--aqb-error-subtle` `rgba(239,68,68,0.1)` | Delete, SEO poor, save failed |
| `--buildrick-info` | `#3B82F6` | `--aqb-info-subtle` `rgba(59,130,246,0.1)` | Informational, AI suggestion |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--buildrick-text-primary` | `#F1F3F9` | Primary text on dark chrome |
| `--buildrick-text-secondary` | `#9CA3B4` | Muted text, labels, timestamps |
| `--buildrick-text-tertiary` | `#6B7280` | Placeholders, disabled |
| `--buildrick-text-inverse` | `#0F1117` | Text on white/light surfaces |

## Collaboration Colors
10 distinct colors assigned to collaborators on session join. See [Style Guide](../style-guide.md) for full list.

## Accessibility Compliance
All text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Critical combinations meet AAA (7:1). See [Style Guide](../style-guide.md) for verification table.

## Do's and Don'ts

**Do:**
- Use semantic colors for feedback (success/warning/error), not arbitrary greens/reds
- Use `--buildrick-accent-tint` for hover backgrounds, not raw opacity hacks
- Use `--buildrick-text-secondary` for non-essential text, keeping `--buildrick-text-primary` for actionable content

**Don't:**
- Use `--buildrick-accent` for destructive actions (use `--buildrick-error` instead)
- Use `--aqb-chrome-bg` on the canvas area (canvas has its own lighter palette)
- Create new grays — all neutrals come from the defined chrome and text token sets
