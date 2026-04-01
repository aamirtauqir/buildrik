# Buildrik (Aquibra Studio) — Product Requirements Document

> **Generated:** 2026-03-25
> **Updated:** 2026-03-25 (v2 — Design Team Edition)
> **Codebase:** React 18 + TypeScript + Vite + Emotion CSS-in-JS
> **Version:** 1.0.0

---

## System Overview

Buildrik (internally **Aquibra Studio**) is a visual web builder and editor purpose-built for **design teams (2-5 people)** who need to design, build, and publish multi-page websites collaboratively — without fragmenting their workflow across Figma, Webflow, a CMS, and Slack. The application provides a desktop-class editing experience with a drag-and-drop canvas, rich property inspector, 10-tab sidebar system, real-time collaboration, AI-powered assistance, a built-in CMS, and multi-format code export (HTML, React, Vue, Next.js).

**Primary User:** Design team leads and team members at agencies or in-house teams building client/product websites.

**Core Promise:** The entire workflow — from brand setup to design, content management, collaboration, and code export — happens in ONE tool, replacing the 3-4 tool chain teams use today.

The core architecture centers on a **Composer engine** — a central orchestrator managing 30 specialized managers for elements, styles, history, media, collaboration, CMS, animations, and more. The UI layer (React) subscribes to engine events and renders state changes, never mutating engine internals directly.

---

## Target User & Design Principles

### Primary Persona: Design Team (2-5 people)

| Role | Uses Most | Success Metric |
|------|----------|----------------|
| **Team Lead** | Design System, Components, Settings, Publish | Brand consistency across all pages |
| **Designer** | Canvas, Inspector, Add Tab, Layers, Templates | Time from concept to styled page < 45 min |
| **Content Manager** | CMS, Pages, Media | Content published without designer help |
| **Developer (handoff)** | Export Modal, Inspector (dev mode) | Exported React/Vue code passes ESLint + senior review |

### Design Principles for v1

1. **The Core Triangle must be instant** — Canvas ↔ Inspector ↔ Layers response < 16ms (one frame). No loading states in the editing loop.
2. **Sections-first, not elements-first** — Design teams think in Hero/CTA/Pricing, not div/text/button. Surface section-level building blocks prominently.
3. **Shared everything in collaboration mode** — Assets, favorites, tokens, components sync across team members via SyncManager by default.
4. **Export quality is the moat** — Generated code must satisfy a senior React developer. Component structure, CSS custom properties, proper file organization.
5. **Show, don't tell** — Visual diffs, visual token palettes, side-by-side previews. Designers are visual; text warnings are insufficient.

---

## Module Overview

| Module | Screens / Panels | Core Functionality |
|--------|-----------------|-------------------|
| **Studio Shell** | Top bar, page tabs, status indicators | Project-level controls: save, undo/redo, device preview, zoom, AI, export |
| **Canvas** | Main editing surface | Drag-drop element placement, inline text editing, selection, resize, alignment guides, overlays |
| **Add (Build) Tab** | Element catalog | Browse 150+ element types organized sections-first, drag onto canvas, team favorites, search |
| **Templates Tab** | Template browser | Browse/apply pre-built page templates with visual side-by-side comparison |
| **Layers Tab** | DOM tree view | Hierarchical element tree, reorder, visibility/lock toggles |
| **Pages Tab** | Page manager | Create/duplicate/delete pages, inline SEO score badges, homepage assignment |
| **Components Tab** | Component library | Create from selection or from scratch, manage variants, instances with overrides |
| **Media Tab** | Shared asset library | Upload/manage images, videos, fonts; stock discovery; team-synced library |
| **Design System Tab** | Visual token editor | Manage global design tokens as visual palette/grid; colors, typography, spacing; multi-format export |
| **Settings Tab** | 7 drill-in screens | Site settings, domains, analytics, export, integrations, SEO, advanced |
| **Publish Tab** | Deploy controls | Publish/unpublish (Owner + Editor roles), live URL, connect-hosting first-run |
| **History Tab** | Version timeline | Undo/redo stack, version snapshots, per-user activity filtering |
| **Inspector** | Right property panel | 3-tab inspector (Layout, Appearance, Effects) with responsive constraints, pseudo-states, CMS binding |
| **Export** | Export modal | Generate HTML, React, Vue, Next.js with code quality score, component file structure, asset bundling |
| **Onboarding** | Welcome + guided tour | Solo onboarding + team onboarding variant for members joining existing projects |
| **Collaboration** | Presence indicators | Remote cursors, visual conflict diffs, 15s soft locks, offline queue |
| **CMS** | Content management | Create collections, 17 field types, bind elements, repeaters, live preview |
| **Animation** | Animation editor | GSAP animations with presets and triggers |
| **AI Assistant** | AI sidebar | Content generation, layout suggestions, accessibility checks, per-user rate limiting |

---

## Screen Inventory

| # | Screen / Panel | Location | Module | Doc Link |
|---|---------------|----------|--------|----------|
| 1 | Studio Shell & Top Bar | Top bar + page tabs | Shell | [->](./pages/01-studio-shell.md) |
| 2 | Canvas | Center workspace | Canvas | [->](./pages/02-canvas.md) |
| 3 | Add / Build Tab | Left sidebar tab 1 | Sidebar | [->](./pages/03-add-build-tab.md) |
| 4 | Templates Tab | Left sidebar tab 2 | Sidebar | [->](./pages/04-templates-tab.md) |
| 5 | Layers Tab | Left sidebar tab 3 | Sidebar | [->](./pages/05-layers-tab.md) |
| 6 | Pages Tab | Left sidebar tab 4 | Sidebar | [->](./pages/06-pages-tab.md) |
| 7 | Components Tab | Left sidebar tab 5 | Sidebar | [->](./pages/07-components-tab.md) |
| 8 | Media Tab | Left sidebar tab 6 | Sidebar | [->](./pages/08-media-tab.md) |
| 9 | Design System Tab | Left sidebar tab 7 | Sidebar | [->](./pages/09-design-system-tab.md) |
| 10 | Settings Tab | Left sidebar tab 8 | Sidebar | [->](./pages/10-settings-tab.md) |
| 11 | Publish Tab | Left sidebar tab 9 | Sidebar | [->](./pages/11-publish-tab.md) |
| 12 | History Tab | Left sidebar tab 10 | Sidebar | [->](./pages/12-history-tab.md) |
| 13 | Inspector (Right Panel) | Right panel | Inspector | [->](./pages/13-inspector.md) |
| 14 | Export Modal | Overlay | Export | [->](./pages/14-export-modal.md) |
| 15 | Onboarding Flow | Overlay system | Onboarding | [->](./pages/15-onboarding.md) |
| 16 | AI Assistant | Sidebar / toolbar | AI | [->](./pages/16-ai-assistant.md) |
| 17 | CMS & Data Binding | Modal + preview bar | CMS | [->](./pages/17-cms-data-binding.md) |
| 18 | Collaboration | Canvas overlays + header | Collaboration | [->](./pages/18-collaboration.md) |

---

## Global Notes

### Layout Structure

```
+-------+----------+----------------------------+----------+
| Rail  | Sidebar  |         Canvas             | Inspector|
| 56px  | 280px    |       (flexible)           | 280px    |
+-------+----------+----------------------------+----------+
| Left icon bar    | Top Bar (52px height)                  |
| with 10 tab      +----------------------------+----------+
| shortcuts        | Page Tab Bar (multi-page)  |          |
|                  +----------------------------+          |
|                  | Canvas editing surface     | Property |
|                  | with overlays, guides,     | editor   |
|                  | selection handles          | for      |
|                  |                            | selected |
|                  |                            | element  |
+------------------+----------------------------+----------+
```

### Permission Model

| Role | Edit Elements | Edit Pages | Edit Media | Edit Settings | Publish | Manage Billing |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Owner** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Editor** | Yes | Yes | Yes | No | Yes | No |
| **Viewer** | No | No | No | No | No | No |

- Owner + Editor can publish/unpublish. Viewers have read-only access with cursor visibility.
- Element-level locking is supported: locked elements cannot be edited by collaborators regardless of role.

### Common Interaction Patterns

1. **All destructive actions require confirmation** — Delete elements, pages, media, versions all show a confirmation modal
2. **Undo/redo is global** — Ctrl+Z / Ctrl+Shift+Z works from any context; history is diff-based (JSON patches)
3. **Auto-save** — Project auto-saves on changes with debounce; save indicator shows status (idle/saving/saved/error)
4. **Keyboard shortcuts** — Extensive shortcut system; each sidebar tab has a single-key shortcut (A, T, Z, P, etc.)
5. **Toast notifications** — Success/error/info toasts for all async operations
6. **Responsive preview** — Three device modes: Desktop (1280px), Tablet (768px), Mobile (375px)
7. **Drag-and-drop** — Elements can be dragged from sidebar onto canvas, or within canvas to reorder
8. **Context menus** — Right-click on canvas elements shows context-specific actions
9. **Visual over textual** — Diffs, token palettes, conflict resolution, and template comparisons are shown visually (side-by-side), not as text descriptions

### Performance Targets

| Interaction | Max Latency | Notes |
|-------------|------------|-------|
| Canvas selection → Inspector populate | < 16ms | One frame; no loading state |
| Style edit → Canvas re-render | < 16ms | Live preview must be instant |
| Sidebar tab switch | < 100ms | May show skeleton for data-heavy tabs |
| Export generation | < 5s for typical project | Progress bar for larger projects |
| Collaboration cursor sync | ~60fps | Throttled but visually smooth |

### Technology & Integration Points

| Integration | Purpose | Status |
|-------------|---------|--------|
| OpenAI API | AI content generation, layout suggestions | Integrated (via `/api/ai` proxy) |
| Google Fonts API | Font browsing and loading | Integrated |
| Sentry | Error tracking and reporting | Integrated |
| GSAP | Animation engine | Integrated |
| IndexedDB | Local storage for media, versions, components, CMS | Integrated |
| Cloud Sync | Project persistence and sync | Integrated (via SyncManager) |
| Formspree | Form submission backend | Export-time injection |
| Stripe | Payment processing | Export-time injection |
| Google Analytics | Analytics tracking | Export-time injection |
| Meta Pixel | Marketing analytics | Export-time injection |

### Upload Limits

| Asset Type | Max File Size | Accepted Formats |
|-----------|--------------|------------------|
| Images | 10 MB | JPEG, PNG, GIF, SVG, WEBP |
| Videos | 50 MB | MP4, WEBM |
| Fonts | 5 MB | WOFF, WOFF2, TTF, OTF |
| Favicon | 512 KB | ICO, PNG (32x32 or 64x64) |

---

## Appendix

| Document | Contents |
|----------|----------|
| [Enum Dictionary](./appendix/enum-dictionary.md) | All enums, status codes, element types, event names |
| [Screen Relationships](./appendix/screen-relationships.md) | Navigation map and data coupling between screens |
| [Engine API Reference](./appendix/engine-api-reference.md) | Complete Composer + manager method inventory |
