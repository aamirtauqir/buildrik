---
title: Spacing Tokens
description: 4px-base spatial system, layout dimensions, and radius scale
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Spacing Tokens

## Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-to-label gap, tight groups |
| `space-2` | 8px | Button padding, list item gap |
| `space-3` | 12px | Form field spacing, section inner padding |
| `space-4` | 16px | Panel padding, between sections |
| `space-5` | 20px | Between major groups |
| `space-6` | 24px | Sidebar section separation |
| `space-8` | 32px | Modal padding, major breaks |
| `space-10` | 40px | Page-level padding |
| `space-12` | 48px | Hero spacing |

## Fixed Layout Dimensions

| Token | Value |
|-------|-------|
| Rail | 56px |
| Sidebar | 280px |
| Inspector | 280px |
| Header | 52px |
| Page Tab Bar | 36px |
| Footer Toolbar | 40px |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, tags, chips |
| `radius-md` | 6px | Buttons, inputs, cards |
| `radius-lg` | 8px | Panels, large cards |
| `radius-xl` | 12px | Modal containers |
| `radius-full` | 9999px | Avatars, pills, toggles |

## Rules
1. All spacing values are multiples of 4px. No arbitrary values.
2. Sidebar and Inspector are fixed 280px. Canvas flexes.
3. Internal panel padding is `space-4` (16px) on all sides.
4. Gap between sidebar sections is `space-6` (24px).
