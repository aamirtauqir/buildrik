---
title: Accessibility Guidelines
description: WCAG 2.1 AA compliance standards and implementation requirements
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../design-system/style-guide.md
status: approved
---

# Accessibility Guidelines

## Standard
WCAG 2.1 Level AA compliance for all editor UI. The built-in AI Accessibility Checker helps users make their WEBSITE designs accessible. This document covers the EDITOR UI accessibility.

## Color Contrast
- All text/background: minimum 4.5:1 (normal text), 3:1 (large text ≥18px or ≥14px bold)
- Critical interactive elements: 7:1 enhanced contrast
- Color-blind friendly: no information conveyed by color alone. Selection uses color + pattern (handles, labels). SEO badges use color + position (dot placement). Status uses color + icon.

## Keyboard Navigation
- **Global shortcuts:** Each sidebar tab has a single-key shortcut (A, T, Z, P, Shift+A, J, D, S, U, H)
- **Canvas:** Arrow keys to move elements (1px / 10px with Shift). Delete/Backspace to delete. Ctrl+K for command palette.
- **Modals:** Focus trapped inside. Tab cycles through controls. Escape closes.
- **Inspector:** Tab moves between controls. Arrow keys adjust number inputs. Enter/Space toggles.
- **Sidebar lists:** Arrow keys navigate items. Enter to select. Escape to dismiss.

## Screen Reader Support
- All interactive elements have ARIA labels
- Live regions (`aria-live`) for: save status changes, toast notifications, collaboration presence updates
- Canvas announces selected element: "Selected: [type], [name]. Use arrow keys to move."
- Section headers use `aria-expanded` for collapsible sections
- Tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"` pattern

## Focus Management
- Visible focus rings on ALL interactive elements (2px `--aqb-primary-glow` outline)
- Focus moves logically: top bar → rail → sidebar → canvas → inspector
- Opening a modal moves focus to first interactive element inside
- Closing a modal returns focus to the trigger element
- Drill-in (Settings sub-screens) moves focus to back button

## Touch Targets
- Minimum 44x44px for all clickable elements
- Rail icons: 44px hit area (icon is 20px, padding provides the rest)
- Sidebar list items: full-width clickable row, minimum 36px height
- Inspector controls: minimum 32px height, 44px touch target with padding

## Reduced Motion
- `prefers-reduced-motion: reduce` disables all CSS transitions and GSAP animations
- Drag operations work without animation (instant position updates)
- Skeleton loaders replaced with static loading text

## Content & Labels
- All icons have accompanying text labels or ARIA labels
- Form inputs have associated `<label>` elements
- Error messages are linked to their fields via `aria-describedby`
- Toast notifications use `role="status"` for screen reader announcement

## Testing Procedures
See [Testing](./testing.md) for QA checklist and tools.
