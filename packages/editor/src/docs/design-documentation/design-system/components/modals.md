---
title: Modal & Dialog Components
description: Dialogs, drawers, popovers, toasts, and confirmation patterns
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../tokens/animations.md
  - ../style-guide.md
status: approved
---

# Modals & Dialogs

## Types

### Dialog (Centered Modal)
- **Backdrop:** Black at 60% opacity, `backdrop-filter: blur(4px)`
- **Container:** `--aqb-chrome-surface` bg, `--aqb-elevation-3` shadow, `--buildrick-design-radius-xl` corners
- **Width:** 480px (small), 640px (medium), 800px (large), 1200px (Export Modal)
- **Padding:** `--buildrick-design-space-8` (32px)
- **Entry:** Fade in backdrop (200ms) + scale dialog from 95% to 100% (300ms, ease-out)
- **Exit:** Escape key or click backdrop → fade out (200ms)
- **Focus:** Trapped inside. First focusable element receives focus. Tab cycles.
- **Used by:** Export Modal, Welcome Modal, CMS Setup, Confirmation dialogs

### Drawer (Side Panel)
- **Direction:** Slides from right (Settings drill-in, Page Settings)
- **Width:** Same as sidebar (280px)
- **Entry:** Slide from right (300ms, ease-in-out)
- **Exit:** Slide out right (200ms) or back button
- **Header:** Back arrow (←) + title
- **Used by:** Settings sub-screens, Template comparison drawer

### Popover
- **Container:** `--aqb-chrome-surface` bg, `--aqb-elevation-2` shadow, `--buildrick-design-radius-md`
- **Width:** 240-320px
- **Position:** Below or beside trigger element, auto-flips if near viewport edge
- **Entry:** Fade + scale from 95% (150ms, ease-out)
- **Dismiss:** Click outside, Escape, or select an option
- **Used by:** Color picker, CMS binding selector, font selector, dropdown menus

### Toast
- **Position:** Bottom-right, 24px from edges, stacks vertically (max 3 visible)
- **Container:** `--aqb-chrome-surface` bg, `--aqb-elevation-2` shadow, `--buildrick-design-radius-md`, 360px width
- **Left border:** 3px solid semantic color (success=green, error=red, warning=amber, info=blue)
- **Content:** Icon + message + optional action link + dismiss ×
- **Auto-dismiss:** 5 seconds (errors persist until dismissed)
- **Entry:** Slide up from bottom (200ms, ease-out)
- **Exit:** Fade right (150ms)
- **Accessibility:** `role="status"`, `aria-live="polite"`

### Confirmation Modal
- **Variant of Dialog** at 480px width
- **Structure:** Icon + title + description + action buttons
- **For delete:** `--buildrick-error` icon, "Delete [Item Name]?" title, description of impact, [Cancel] + [Delete] (danger) buttons
- **For template apply:** Side-by-side visual comparison (see Templates Tab feature)

### Side-by-Side Comparison
- **Variant of Dialog** at 800px width
- **Split:** 50/50 left (current) / right (new)
- **Header:** "Current Page" / "Template Preview" labels
- **Content:** Rendered visual previews (not text descriptions)
- **Footer:** [Cancel] + [Replace Current Page] + [Add to New Page]
- **Used by:** Template apply confirmation

## Z-Index Layers
| Type | Z-Index |
|------|---------|
| Popover | 400-499 |
| Dialog/Drawer | 500-599 |
| Toast | 600-699 |
| Onboarding Spotlight | 700-799 |
