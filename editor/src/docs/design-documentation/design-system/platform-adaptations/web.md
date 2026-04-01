---
title: Web Platform Guidelines
description: Browser-specific guidelines, responsive behavior, and progressive enhancement
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Web Platform Guidelines

## Browser Support
- Chrome 100+, Firefox 100+, Safari 16+, Edge 100+
- No mobile editing in v1 (desktop-class experience only)
- Minimum viewport: 1024px width (below this, show "Use a desktop browser" message)

## Responsive Behavior (Editor Chrome)
The editor itself is NOT responsive in the traditional sense — it's a fixed-layout desktop application. The CANVAS renders responsive previews of the user's website.

| Viewport Width | Behavior |
|---------------|----------|
| < 1024px | Show "Buildrik requires a desktop browser" message |
| 1024-1279px | Sidebar collapses to icon-only; inspector auto-hides; canvas fills space |
| 1280-1919px | Full layout: rail + sidebar + canvas + inspector |
| 1920px+ | Canvas gains extra width; panels stay fixed |

## Performance Budget
- **Initial load:** < 3s on 3G connection
- **Lighthouse score:** > 80 performance
- **Bundle size:** < 500KB initial JS (lazy-load sidebar tabs)
- **Fonts:** Inter Variable (subset: Latin, 35KB), JetBrains Mono (subset: Basic Latin, 20KB)
- **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1

## Keyboard-First Design
This is a productivity tool. Every action must be keyboard-accessible:
- Single-key shortcuts for sidebar tabs (no modifier needed when canvas focused)
- Ctrl/Cmd+K command palette for everything else
- Tab navigation through all controls
- Arrow keys for element movement and value adjustment

## Progressive Enhancement
- Core editing works without WebSocket (collaboration degrades to manual sync)
- IndexedDB stores all data locally (works offline for single-user)
- AI features gracefully degrade to manual workflows when API unavailable
- Export works without cloud connection (local generation + download)

## Clipboard Integration
- Ctrl+C/V uses browser Clipboard API for rich content (elements with styles)
- Cross-tab paste supported (copy in one Buildrik tab, paste in another)
- External paste: plain text → creates text element; image → creates image element

## Drag-and-Drop
- Uses native HTML5 Drag and Drop API for sidebar → canvas transfers
- Custom drag implementation for canvas element movement (for precise control)
- File drop zone in Media Tab uses `dragenter`/`dragleave`/`drop` events
