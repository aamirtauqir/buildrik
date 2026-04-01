---
title: Buildrik Design Documentation
description: Complete UX/UI design system and feature specifications for the Buildrik visual web builder
last-updated: 2026-03-25
version: 1.0.0
status: approved
---

# Buildrik (Aquibra Studio) — Design Documentation

## Overview

This is the comprehensive design documentation for Buildrik, a collaborative visual web builder for design teams of 2-5 people. Every design decision traces back to user needs identified in the [Product Manager Specification](../project-documentation/product-manager-output.md).

**Design Philosophy:** Bold simplicity with breathable whitespace. A professional dark-themed editor that fades into the background so the user's design takes center stage. Inspired by the precision of Figma, the approachability of Notion, and the power of VS Code.

---

## Navigation

### Design System
- [Style Guide](./design-system/style-guide.md) — Complete visual language: colors, typography, spacing, elevation, motion
- **Tokens**
  - [Colors](./design-system/tokens/colors.md) — Full color palette with semantic mapping
  - [Typography](./design-system/tokens/typography.md) — Type scale, weights, responsive rules
  - [Spacing](./design-system/tokens/spacing.md) — Spatial system and layout grid
  - [Animations](./design-system/tokens/animations.md) — Motion system, easing, durations
- **Components**
  - [Buttons](./design-system/components/buttons.md) — All button variants and states
  - [Forms](./design-system/components/forms.md) — Input fields, selectors, toggles
  - [Navigation](./design-system/components/navigation.md) — Tabs, rail, breadcrumbs, menus
  - [Cards](./design-system/components/cards.md) — Card patterns and templates
  - [Modals](./design-system/components/modals.md) — Dialogs, drawers, popovers
- [Web Platform](./design-system/platform-adaptations/web.md) — Browser-specific guidelines

### Feature Designs (18 Screens)
Each feature has: README, user journey, screen states, interactions, accessibility, implementation notes.

| # | Feature | Priority | Link |
|---|---------|----------|------|
| 1 | Canvas | P0 | [→](./features/canvas/README.md) |
| 2 | Inspector | P0 | [→](./features/inspector/README.md) |
| 3 | Add/Build Tab | P0 | [→](./features/add-build-tab/README.md) |
| 4 | Templates Tab | P1 | [→](./features/templates-tab/README.md) |
| 5 | Layers Tab | P0 | [→](./features/layers-tab/README.md) |
| 6 | Pages Tab | P0 | [→](./features/pages-tab/README.md) |
| 7 | Components Tab | P0 | [→](./features/components-tab/README.md) |
| 8 | Media Tab | P1 | [→](./features/media-tab/README.md) |
| 9 | Design System Tab | P0 | [→](./features/design-system-tab/README.md) |
| 10 | Settings Tab | P1 | [→](./features/settings-tab/README.md) |
| 11 | Publish Tab | P1 | [→](./features/publish-tab/README.md) |
| 12 | History Tab | P1 | [→](./features/history-tab/README.md) |
| 13 | Export Modal | P0 | [→](./features/export-modal/README.md) |
| 14 | Onboarding | P1 | [→](./features/onboarding/README.md) |
| 15 | AI Assistant | P1 | [→](./features/ai-assistant/README.md) |
| 16 | CMS & Data Binding | P1 | [→](./features/cms-data-binding/README.md) |
| 17 | Collaboration | P0 | [→](./features/collaboration/README.md) |
| 18 | Animation Editor | P2 | [→](./features/animation-editor/README.md) |

### Accessibility
- [Guidelines](./accessibility/guidelines.md) — WCAG 2.1 AA compliance standards
- [Testing](./accessibility/testing.md) — QA procedures
- [Compliance](./accessibility/compliance.md) — Audit documentation

---

## Design Principles

### 1. The Canvas Is King
The canvas is where the user's work lives. Every UI element around it — rail, sidebar, inspector, header — exists to serve the canvas. They should recede when not needed and respond instantly when called upon. The canvas background, selection colors, and overlays define the product's visual identity more than any sidebar.

### 2. Dark Chrome, Light Canvas
The editor chrome (header, sidebar, inspector, rail) uses a dark neutral palette (Neutral-900 to Neutral-800) so the user's website design on the canvas — which may use any colors — pops with full vibrancy. The canvas itself defaults to white (#FFFFFF) to match a real browser viewport.

### 3. Instant Feedback, Zero Ambiguity
Every user action must produce a visible result within one animation frame (16ms) for the core editing loop. Selection highlights appear on mousedown. Style changes reflect on canvas before the user lifts their finger. History records silently. The system should feel like a direct extension of the user's hand.

### 4. Progressive Complexity
Show the simple thing first. Hide the advanced thing behind one click. Never show everything at once. The path from "drag a Hero section" to "edit flexbox gap with responsive constraints" should feel like natural skill progression, not information overload.

### 5. Visual Over Textual
This is a product for designers. Show color swatches instead of hex codes in lists. Show side-by-side previews instead of "Are you sure?" text. Show rendered diffs instead of changelogs. Every confirmation, every token, every conflict should be resolved visually.

---

## Global Layout Specification

```
+----------------------------------------------------------------+
|                    TOP BAR (52px)                               |
| [Logo] [File▾] [Undo][Redo] [Save] [Device▾] [Zoom] [AI][▶][Export] |
+------+----------+-------------------------------+--------------+
| RAIL | SIDEBAR  |          CANVAS               |  INSPECTOR   |
| 56px | 280px    |        (flexible)              |   280px      |
|      |          |                                |              |
| [A]  | Content  |   ┌──────────────────┐         | [Layout]     |
| [T]  | changes  |   │  User's website  │         | [Appear.]    |
| [Z]  | per      |   │  design renders  │         | [Effects]    |
| [P]  | active   |   │  here at current │         |              |
| [⇧A] | tab      |   │  device width    │         | Sections     |
| [J]  |          |   │  and zoom level  │         | expand/      |
|      |          |   └──────────────────┘         | collapse     |
| [D]  |          |                                | based on     |
| [S]  |          | [Breadcrumb] [Quick Actions]   | selected     |
| [U]  |          | [Smart Guides] [Spacing Labels]| element      |
| [H]  |          | [Remote Cursors]               | type         |
+------+----------+-------------------------------+--------------+
|              PAGE TAB BAR (below top bar)                       |
| [Home] [About] [Services] [Blog] [Contact] [+]                |
+----------------------------------------------------------------+
```

### Spatial Rules
- **Rail**: Fixed 56px. Never collapses. Always visible.
- **Sidebar**: 280px default. Collapses to 0px when a tab is deselected (clicking active tab again).
- **Canvas**: Fills remaining space. Minimum usable width: 400px.
- **Inspector**: 280px. Hides entirely when no element is selected (empty state message shown instead).
- **Top Bar**: Fixed 52px. Always visible. Never scrolls.
- **Page Tab Bar**: 36px below top bar. Scrollable horizontally when > 8 pages.

---

## Persona-to-Screen Mapping

| Persona | Primary Screens (80% of time) | Secondary Screens (20%) |
|---------|------------------------------|------------------------|
| **Sarah (Lead)** | Design System, Components, Canvas | Settings, Publish, History, Export |
| **Tom (Designer)** | Canvas, Add Tab, Inspector, Layers | Templates, Components, Media |
| **Maya (Content Mgr)** | CMS, Pages, Media, Publish | Canvas (preview only) |
| **Dev (Handoff)** | Export Modal, Inspector (dev mode) | Canvas (X-ray mode), Design System |

---

## Related Documentation
- [Product Manager Specification](../project-documentation/product-manager-output.md)
- [Raw PRD](../code-to-prd-output/README.md)
- [Engine API Reference](../code-to-prd-output/appendix/engine-api-reference.md)
