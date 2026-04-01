---
title: Component Library Overview
description: Index of all UI component specifications for the Buildrik editor
last-updated: 2026-03-25
version: 1.0.0
status: approved
---

# Component Library

## Overview
All components use the Buildrik design token system (dark chrome, 4px spacing, Inter font). Components are built with Emotion CSS-in-JS and Lucide React icons.

## Component Index

| Component | File | Variants | Key Usage |
|-----------|------|----------|-----------|
| [Buttons](./buttons.md) | buttons.md | Primary, Secondary, Ghost, Danger, Icon-only | CTAs, actions, toggles |
| [Forms](./forms.md) | forms.md | Text input, Number input + unit, Select, Toggle, Color picker, Slider, 4-value box | Inspector controls, settings fields |
| [Navigation](./navigation.md) | navigation.md | Rail, Tabs, Breadcrumb, Context menu, Command palette | Editor navigation, feature access |
| [Cards](./cards.md) | cards.md | Settings card, Template card, Asset card, Element tile | Content browsing, settings entry |
| [Modals](./modals.md) | modals.md | Dialog, Drawer, Popover, Toast, Confirmation, Side-by-side | Overlays, confirmations, popovers |

## Shared Patterns

### States (All Components)
Every interactive component supports: Default, Hover, Active/Pressed, Focus, Disabled, Loading.

### Dark Theme
All components render on `--aqb-chrome-bg` (#0F1117) or `--aqb-chrome-surface` (#161922). Text uses `--aqb-text-primary` (#F1F3F9) by default.

### Accessibility
Every component has keyboard support, ARIA attributes, and meets WCAG AA contrast ratios.
