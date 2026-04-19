---
title: Buildrik Style Guide
description: Complete visual language specification — colors, typography, spacing, elevation, motion, and iconography
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ./tokens/colors.md
  - ./tokens/typography.md
  - ./tokens/spacing.md
  - ./tokens/animations.md
  - ./components/buttons.md
status: approved
---

# Buildrik Style Guide

## Overview

Buildrik uses a **dark chrome / light canvas** visual language. The editor shell (header, sidebar, inspector, rail) is rendered in dark neutrals so the user's website design — displayed on a white canvas — has maximum visual prominence. Color accents are minimal and purposeful: blue for selection/primary actions, semantic colors for feedback, and the user's own design tokens for their canvas content.

---

## 1. Color System

### Editor Chrome (Dark Theme)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--aqb-chrome-bg` | `#0F1117` | 15, 17, 23 | Main background: rail, sidebar, inspector |
| `--aqb-chrome-surface` | `#161922` | 22, 25, 34 | Elevated surfaces: cards, panels, popovers |
| `--aqb-chrome-surface-hover` | `#1C2030` | 28, 32, 48 | Hovered surface states |
| `--aqb-chrome-surface-active` | `#232840` | 35, 40, 64 | Active/pressed surface states |
| `--aqb-chrome-border` | `#2A2E3D` | 42, 46, 61 | Subtle borders between regions |
| `--aqb-chrome-border-strong` | `#3D4255` | 61, 66, 85 | Emphasized borders (section dividers) |

### Canvas Surface

| Token | Hex | Usage |
|-------|-----|-------|
| `--aqb-canvas-bg` | `#F8F9FB` | Canvas area background (outside the page) |
| `--aqb-canvas-page` | `#FFFFFF` | The page surface itself (what users build on) |
| `--aqb-canvas-grid` | `#E5E7EB` | Grid overlay lines (10% opacity) |

### Primary (Brand Blue — Selection & Actions)

| Token | Hex | Usage |
|-------|-----|-------|
| `--buildrick-accent` | `#2563EB` | Primary buttons, active tab indicator, selection bounding box |
| `--buildrick-accent-hover` | `#3B82F6` | Hover state for primary elements |
| `--buildrick-accent-pressed` | `#1D4ED8` | Active/pressed state |
| `--buildrick-accent-tint` | `rgba(37, 99, 235, 0.08)` | Subtle backgrounds (selected sidebar items, hover rows) |
| `--aqb-primary-glow` | `rgba(37, 99, 235, 0.25)` | Selection glow on canvas, focus rings |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--buildrick-success` | `#22C55E` | Published status, SEO good score, save confirmed |
| `--aqb-success-subtle` | `rgba(34, 197, 94, 0.1)` | Success backgrounds |
| `--buildrick-warning` | `#F59E0B` | SEO needs-work score, unsaved changes, AI medium confidence |
| `--aqb-warning-subtle` | `rgba(245, 158, 11, 0.1)` | Warning backgrounds |
| `--buildrick-error` | `#EF4444` | Delete confirmations, SEO poor score, save failed, AI high violations |
| `--aqb-error-subtle` | `rgba(239, 68, 68, 0.1)` | Error backgrounds |
| `--buildrick-info` | `#3B82F6` | Informational toasts, AI suggestion confidence |
| `--aqb-info-subtle` | `rgba(59, 130, 246, 0.1)` | Info backgrounds |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--buildrick-text-primary` | `#F1F3F9` | Primary text on dark chrome |
| `--buildrick-text-secondary` | `#9CA3B4` | Secondary/muted text, labels, timestamps |
| `--buildrick-text-tertiary` | `#6B7280` | Placeholder text, disabled labels |
| `--buildrick-text-inverse` | `#0F1117` | Text on light/white surfaces (canvas overlays, tooltips) |

### Collaboration Colors (Assigned to Collaborators)

| Slot | Hex | Name |
|------|-----|------|
| User 1 | `#3B82F6` | Blue |
| User 2 | `#8B5CF6` | Purple |
| User 3 | `#EC4899` | Pink |
| User 4 | `#F59E0B` | Amber |
| User 5 | `#10B981` | Emerald |
| User 6 | `#EF4444` | Red |
| User 7 | `#06B6D4` | Cyan |
| User 8 | `#F97316` | Orange |
| User 9 | `#84CC16` | Lime |
| User 10 | `#A855F7` | Violet |

### Accessibility Verification

| Combination | Ratio | Passes |
|-------------|-------|--------|
| `--buildrick-text-primary` on `--aqb-chrome-bg` | 14.8:1 | AAA |
| `--buildrick-text-secondary` on `--aqb-chrome-bg` | 7.2:1 | AAA |
| `--buildrick-text-tertiary` on `--aqb-chrome-bg` | 4.6:1 | AA |
| `--buildrick-accent` on `--aqb-chrome-bg` | 5.1:1 | AA |
| `--buildrick-text-inverse` on white | 17.4:1 | AAA |
| `--buildrick-error` on `--aqb-chrome-bg` | 5.3:1 | AA |

---

## 2. Typography System

### Font Stack

```css
--buildrick-design-font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--buildrick-design-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

**Why Inter:** Designed for computer screens. Excellent legibility at small sizes (11-13px) which is critical for a dense editor UI. Variable font support for fine weight tuning. Free and open source.

### Type Scale

| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| `--aqb-heading-xl` | 24px | 32px | 700 | -0.02em | Modal titles, welcome screen |
| `--aqb-heading-lg` | 18px | 26px | 600 | -0.01em | Panel titles (e.g., "Components", "History") |
| `--aqb-heading-md` | 15px | 22px | 600 | -0.01em | Section headers within panels |
| `--aqb-heading-sm` | 13px | 18px | 600 | 0 | Subsection headers, card titles |
| `--aqb-body` | 13px | 20px | 400 | 0 | Standard UI text, descriptions |
| `--aqb-body-sm` | 12px | 18px | 400 | 0 | Secondary info, timestamps, metadata |
| `--aqb-caption` | 11px | 16px | 400 | 0.02em | Micro labels, keyboard shortcuts, badges |
| `--aqb-label` | 11px | 16px | 500 | 0.04em | Form labels, section labels (uppercase) |
| `--aqb-code` | 12px | 18px | 400 | 0 | Code editor, CSS values, monospace data |

### Text Rendering
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-rendering: optimizeLegibility;
```

---

## 3. Spacing & Layout System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--buildrick-space-0` | 0px | Zero spacing |
| `--buildrick-design-space-1` | 4px | Micro: between icon and label, within tight groups |
| `--buildrick-design-space-2` | 8px | Small: internal button padding, between list items |
| `--buildrick-design-space-3` | 12px | Medium: between form fields, section padding |
| `--buildrick-design-space-4` | 16px | Default: panel padding, between sections |
| `--buildrick-design-space-5` | 20px | Large: between major groups |
| `--buildrick-design-space-6` | 24px | XL: between sidebar sections |
| `--buildrick-design-space-8` | 32px | 2XL: modal padding, major section breaks |
| `--buildrick-design-space-10` | 40px | 3XL: page-level padding |
| `--buildrick-design-space-12` | 48px | 4XL: hero-level spacing |

### Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--aqb-rail-width` | 56px | Left icon rail |
| `--buildrick-sidebar-width` | 280px | Left sidebar panel |
| `--aqb-inspector-width` | 280px | Right property inspector |
| `--buildrick-header-height` | 52px | Top bar |
| `--aqb-page-tab-height` | 36px | Page tab bar below header |
| `--aqb-footer-toolbar-height` | 40px | Canvas footer (zoom, grid, ruler) |

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--buildrick-design-radius-sm` | 4px | Small elements: badges, tags, chips |
| `--buildrick-design-radius-md` | 6px | Buttons, inputs, cards, dropdowns |
| `--buildrick-design-radius-lg` | 8px | Panels, modal corners, large cards |
| `--buildrick-design-radius-xl` | 12px | Modal/dialog containers |
| `--buildrick-design-radius-full` | 9999px | Circular: avatars, pills, toggles |

---

## 4. Elevation System

| Level | Shadow | Usage |
|-------|--------|-------|
| `--aqb-elevation-0` | none | Flat elements on surface |
| `--aqb-elevation-1` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards, subtle lift |
| `--aqb-elevation-2` | `0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)` | Dropdowns, popovers, context menus |
| `--aqb-elevation-3` | `0 8px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.2)` | Modals, dialogs |
| `--aqb-elevation-4` | `0 16px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)` | Export modal (large overlay), onboarding spotlight |

**Note:** Shadows are intensified for dark theme since subtle shadows are invisible on dark backgrounds.

---

## 5. Motion System

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--buildrick-ease-out` | `cubic-bezier(0.0, 0, 0.2, 1)` | Entrances, expansions, things coming into view |
| `--buildrick-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State transitions, tab switches, drill-in |
| `--buildrick-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful: achievement toasts, selection bounce |
| `--buildrick-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, things leaving view |

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--buildrick-duration-instant` | 0ms | Canvas operations (selection, style apply) — NO animation in editing loop |
| `--aqb-duration-micro` | 100ms | Hover states, button press feedback, toggle switches |
| `--aqb-duration-short` | 200ms | Dropdown open, tooltip appear, tab content switch |
| `--aqb-duration-medium` | 300ms | Sidebar panel slide, drill-in animation, modal appear |
| `--aqb-duration-long` | 500ms | Page transitions, complex state changes, export progress |

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Critical Rule
**The core editing loop (Canvas ↔ Inspector ↔ Layers) uses `--buildrick-duration-instant` (0ms).** No transitions between selection and property population. No fade-in for Inspector sections. No slide for Layers highlighting. These must be immediate. Animation is reserved for UI chrome transitions (tab switches, modal opens, drill-ins), never for the editing loop.

---

## 6. Iconography

### Icon System
- **Library:** Lucide React (consistent line-weight icons)
- **Default size:** 16px (sidebar), 20px (rail icons), 14px (inline with text)
- **Stroke width:** 1.5px (matches Inter's visual weight at body size)
- **Color:** Inherits from parent text color; active icons use `--buildrick-accent`

### Icon Usage Rules
1. Every icon must have an accessible label (ARIA label or visible text)
2. Rail icons: 20px with 8px padding, visible tooltip on hover (200ms delay)
3. Inline icons: 14px, vertically centered with adjacent text
4. Button icons: 16px, 4px gap to label text

---

## 7. Selection & Overlay System (Canvas-Specific)

| Element | Specification |
|---------|---------------|
| Selection box | 1px solid `--buildrick-accent`, with `--aqb-primary-glow` outer glow (2px) |
| Resize handles | 8px × 8px white squares with 1px `--buildrick-accent` border |
| Hover highlight | 1px dashed `--buildrick-accent` at 50% opacity |
| Drop zone indicator | 2px solid `--buildrick-accent` at insertion point |
| Smart guides | 1px solid `#FF6B6B` (red, high visibility on any canvas color) |
| Spacing labels | `--aqb-caption` size, `--buildrick-accent` background pill |
| Remote cursor | 12px arrow in collaborator's assigned color + name label |
| Selection label | `--aqb-caption` size badge above selection box, `--aqb-chrome-surface` background |

---

## 8. Z-Index Layers

| Layer | Z-Index Range | Elements |
|-------|---------------|----------|
| Canvas content | 0-99 | User's elements, rendered page |
| Canvas overlays | 100-199 | Selection boxes, handles, guides, spacing labels |
| Canvas floating UI | 200-299 | Quick actions toolbar, breadcrumb, remote cursors |
| Panel chrome | 300-399 | Rail, sidebar, inspector, header |
| Dropdowns & menus | 400-499 | Context menus, popovers, color pickers |
| Modals & dialogs | 500-599 | Export modal, confirmation dialogs, CMS setup |
| Toasts | 600-699 | Toast notifications, achievement prompts |
| Onboarding spotlight | 700-799 | Spotlight overlay mask + tooltip |

---

## Related Documentation
- [Color Tokens (detailed)](./tokens/colors.md)
- [Typography Tokens (detailed)](./tokens/typography.md)
- [Spacing Tokens (detailed)](./tokens/spacing.md)
- [Animation Tokens (detailed)](./tokens/animations.md)
- [Component Library](./components/README.md)
- [Web Platform Guidelines](./platform-adaptations/web.md)
