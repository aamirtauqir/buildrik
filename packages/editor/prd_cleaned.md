# Buildrik / Aquibra Studio — Product Requirement Document (Cleaned Version)

**Version:** 2.0 (Cleaned & Restructured)  
**Date:** 2026-03-23  
**Status:** Implementation-Ready PRD

---

## 1. Product Overview

### 1.1 What This Product Is
**Buildrik** (also known as **Aquibra Studio**) is a professional visual web builder — a React 18 web application (`<AquibraStudio />` component) that enables users to create, style, and publish multi-page websites without writing code.

**Core Engine:** `src/engine/Composer.ts` — central orchestrator with 29 managers handling elements, styles, CMS, AI, collaboration, and more.

**Hosting:** Published sites are hosted at `buildrik.app/{projectId}`.

### 1.2 Target Users

| User Type | Profile | Primary Use Case |
|-----------|---------|------------------|
| **Freelance Designers** (20-40%) | Professional designers building client sites | Multi-page sites, design systems, CMS bindings, keyboard-first workflows |
| **SaaS Product Teams** (30%) | Engineering teams embedding the editor | White-label integration, collaboration, plugins, version history |
| **Individual Creators** (30%) | Non-designers building personal sites | Templates, AI assistance, fast publish workflow |

### 1.3 Core UX Principles

1. **Progressive Disclosure** — Advanced features reachable in ≤2 clicks or via keyboard shortcut
2. **Zero Capability Regression** — Every existing feature remains accessible
3. **Keyboard-First, Mouse-Friendly** — Every action has a keyboard path
4. **Context Over Configuration** — UI adapts to what the user is doing
5. **Feedback at Every Action** — Visible status for save, publish, sync, errors, loading
6. **Trust Through Transparency** — Always visible: published URL, save status, version history access

---

## 2. Architecture & Layout

### 2.1 Editor Shell Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOP BAR (52px)                              │
├──────┬──────────────────────────┬──────────────┬─────────────────┤
│ RAIL │    LEFT SIDEBAR         │   CANVAS     │   INSPECTOR     │
│ 56px │      280px              │   (flex)     │    280px        │
│      │   [collapsible]        │              │  [collapsible]  │
│      │                         │              │                 │
│      │                         │  FOOTER     │                 │
│      │                         │   40px      │                 │
└──────┴──────────────────────────┴──────────────┴─────────────────┘
```

**Minimum supported viewport:** 1024×768px  
**Reference viewport:** 1440×900px

### 2.2 Rail Navigation (10 Icons)

| Zone | Icon | Label | Shortcut | Panel |
|------|------|-------|----------|-------|
| TOP | + | Add | A | Build / Element Catalog |
| TOP | 🖼 | Media | J | Media Library |
| TOP | 📋 | Layers | Z | Element Tree |
| TOP | 📄 | Templates | T | Template Browser |
| TOP | 📑 | Pages | P | Page Manager |
| TOP | 🔧 | Components | ⇧A | Component Library |
| BOTTOM | 🎨 | Design | D | Design System |
| BOTTOM | ⚙️ | Settings | S | Settings |
| BOTTOM | 🚀 | Publish | U | Publish Panel |
| BOTTOM | 🕐 | History | H | Version History |

### 2.3 Top Bar Controls

| Zone | Controls |
|------|----------|
| LEFT | Logo + Project Name + Save Status + Undo + Redo |
| CENTER | Device Switcher (Desktop/Tablet/Mobile/Watch) |
| RIGHT | Preview + Publish + AI + Overflow Menu + Sync Status + Presence Avatars |

---

## 3. Core Features

### 3.1 Canvas System

**Canvas States:**
- Empty — CanvasEmptyCTA with "Start building" / "Browse Templates" CTAs
- Default (idle) — White content area, no selection
- Element Hovered — Teal outline + element type badge
- Element Selected — Indigo outline + 8 resize handles + floating toolbar
- Multi-Selected — Group bounding box + MultiSelectToolbar
- Inline Editing — Contenteditable mode with text formatting toolbar
- Dragging — Ghost element + drop zone highlighting
- Marquee Selecting — Animated dashed rectangle

**Canvas Overlays (Toggleable):**
1. Element outlines (default: on)
2. Ruler guides (default: on)
3. Spacing indicators (default: off)
4. Element badges (default: off)
5. Grid overlay (default: off)
6. X-Ray mode (default: off)

### 3.2 Inspector Panel

**Three Tabs:**

| Tab | Sections |
|-----|----------|
| **Layout** | Position, Display, Size, Spacing, Flexbox, Grid, Variants |
| **Style** | Typography, Background, Border, CSS Classes, Link, Visibility, Data Attributes |
| **Effects** | Shadows, Transforms, Animation, Interactions, AI Suggestions, Dev Mode |

**Inspector States:**
- Empty (no selection) — Page info + Quick tips
- Single element — Full property editor
- Multi-select — Alignment/distribution toolbar
- CMS-bound element — Binding indicators
- Component instance — Variants section
- Dev Mode — Raw CSS editor

### 3.3 Keyboard Shortcuts

| Category | Shortcut | Action |
|----------|----------|--------|
| **Editing** | Ctrl+Z | Undo |
| | Ctrl+Y / Ctrl+Shift+Z | Redo |
| | Ctrl+S | Save |
| | Delete | Delete element |
| | Ctrl+D | Duplicate |
| | Ctrl+C/X/V | Copy/Cut/Paste |
| | Arrow keys | Nudge 1px |
| | Shift+Arrow | Nudge 10px |
| | Ctrl+] / Ctrl+[ | Move up/down |
| **View** | Ctrl+P | Preview |
| | Ctrl+=/- | Zoom in/out |
| | Ctrl+0 | Reset zoom |
| | Ctrl+1-4 | Device: Desktop/Tablet/Mobile/Watch |
| **Navigation** | Ctrl+K | Command Palette |
| | Ctrl+J | AI Assistant |
| | ? | Keyboard shortcuts |

### 3.4 Sidebar Panels

#### Build Tab (A)
- Search elements
- Favorites zone
- My Components zone
- Element categories accordion (Structure, Text, Media, Forms, Navigation, Advanced)
- Drag-to-canvas or click-to-insert

#### Templates Tab (T)
- Template grid with filter chips
- Template preview modal
- Template use drawer (replace page / add as section)
- Apply progress overlay

#### Layers Tab (Z)
- Full element tree with expand/collapse
- Visibility toggle per element
- Drag-to-reorder
- Context menu (rename, duplicate, wrap, delete)

#### Pages Tab (P)
- Page list with add/rename/duplicate/delete
- Page settings drawer (SEO, Social, Advanced tabs)

#### Components Tab (⇧A)
- Component library list
- Component detail screen
- Create component modal

#### Media Tab (J)
- My Files / Stock Photos toggle
- Upload zone with drag-drop
- Library grid with selection
- Asset detail overlay
- Stock photo discovery

#### Design Tab (D)
- Color tokens
- Typography tokens
- Spacing tokens
- Export dropdown (CSS/JSON/SCSS/Tailwind)
- Draft chip for unsaved changes

#### Settings Tab (S)
- Site Settings (name, favicon, language, logo, social links)
- Domains (Coming Soon)
- Analytics (GA, Meta Pixel, custom tracking)
- Export (HTML+CSS available, others Coming Soon)
- Integrations (Formspree)
- Advanced (Custom CSS/JS)
- Plan-gated features with LockedScreen

#### Publish Tab (U)
- Status badge (Published/Draft)
- Published URL with copy
- Pre-publish checklist
- Trust badge
- Publish/Unpublish actions
- Publishing progress states

#### History Tab (H)
- Versions / Activity toggle
- Named versions with save/restore/compare
- Auto-saves with restore
- Activity timeline
- Undo/redo buttons

---

## 4. Modal System

| Modal | Trigger | Purpose |
|-------|---------|---------|
| Command Palette | Ctrl+K | Fuzzy search all commands |
| AI Assistant Bar | Ctrl+J | Inline AI for selected element |
| AI Copilot | Overflow menu | Full page generation |
| Templates | Ctrl+Shift+T | Browse/apply templates |
| Export | Ctrl+Shift+E | Download source code |
| Keyboard Shortcuts | ? | Full shortcut reference |
| Media Library | Inspector background | Select media assets |
| Image Editor | Double-click image | Crop/adjust/filters |
| Icon Picker | Inspector icon field | Browse 1000+ icons |
| Collection Setup | Drag CMS List | Define data schema |
| Create Component | Context menu | Save selection as component |
| Project Settings | Logo click | Site-wide settings |
| Upgrade Modal | Plan-gated action | Upgrade to Pro |

---

## 5. CMS System

### 5.1 Collection Management
- Define schema with fields: Text, Image, Number, Boolean, Date, URL, Richtext
- Manage records (add/edit/delete)
- Collection list in Settings

### 5.2 Binding Types
- **StyleDataBinding** — Bind CMS data → element CSS properties
- **TraitDataBinding** — Bind CMS data → element HTML attributes
- **TextDataBinding** — Bind CMS data → element text content

### 5.3 Binding Flow
1. Click chain icon on inspector field
2. Select collection → field
3. Field shows bound value ("Collection.field")
4. Canvas shows live preview with record navigator
5. Unbind removes binding

---

## 6. Collaboration

### 6.1 Presence
- User avatars in top bar (max 3 + overflow)
- Unique colors per user
- Hover shows name + current action

### 6.2 Live Cursors
- Colored arrow cursor with name label
- Fade behavior (idle after 3s, hidden after 10s)
- Selection awareness (other users' selections visible)

### 6.3 Conflict Resolution
- OT (Operational Transform) automatic resolution
- Toast notification on rebase
- Edge case handling for concurrent delete

---

## 7. AI System

### 7.1 AIAssistantBar (Ctrl+J)
- Context-aware placeholder
- Quick suggestion chips
- Generate with result preview
- Apply/Reject/Edit actions

### 7.2 AI Copilot
- Full-screen modal with prompt textarea
- Template suggestions
- Generate Full Page / Generate Section
- Preview with Accept/Reject

### 7.3 AI Suggestions (Inspector)
- Context-aware style suggestions
- Apply individual suggestions
- Regenerate option
- Loading state

### 7.4 AI Modules (Engine Layer)
- **PageGenerator** — Full page HTML from prompts
- **ContentWriter** — Text generation and rewriting
- **LayoutAnalyzer** — Style improvement suggestions
- **CodeGenerator** — Framework code export

---

## 8. Onboarding

### 8.1 Welcome Modal
- First visit only
- "Browse Templates" / "Start Blank" CTAs

### 8.2 Onboarding Checklist
- 5-step checklist (pick-start, add-element, edit-text, change-style, preview)
- Progress ring
- Minimize/restore
- Achievement prompts on completion

### 8.3 Spotlight Overlay
- Dims everything except target
- "Explore freely →" escape link
- Auto-dismiss on action completion

---

## 9. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All features accessible via keyboard |
| Focus indicators | 2px solid #6366f1 outline |
| Screen reader support | aria-live announcements |
| Color contrast | 4.5:1 minimum for text |
| Focus management | Focus trap in modals, restore on close |
| Skip links | "Skip to canvas" on focus |

---

## 10. Design Tokens

### 10.1 Colors

| Token | Value | Usage |
|-------|-------|-------|
| --aqb-primary | #6366f1 | Primary CTAs, selection |
| --aqb-primary-hover | #818cf8 | Hover states |
| --aqb-success | #22c55e | Success states |
| --aqb-warning | #f59e0b | Warning states |
| --aqb-error | #ef4444 | Error states |
| --aqb-text-primary | #F5F5F0 | Primary text |
| --aqb-text-secondary | #B8B5AD | Body text |
| --aqb-text-muted | #908D85 | Hints, labels |

### 10.2 Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| --aqb-surface-1 | #0f0f14 | Rail, panels |
| --aqb-surface-2 | #16161d | Cards, modals |
| --aqb-surface-3 | #1e1e26 | Interactive bg |
| --aqb-canvas-bg | #F2F2F2 | Canvas surrounding |
| --aqb-canvas-content | #FFFFFF | Canvas page |

### 10.3 Typography

- **UI Font:** Inter
- **Mono Font:** JetBrains Mono
- **Scale:** 10px (badges) to 22px (titles)

---

## 11. Edge Cases & States

### 11.1 Empty States
- CanvasEmptyCTA — No content
- LayersEmptyState — No elements
- MediaEmptyState — No uploads
- ComponentsEmptyState — No components
- InspectorEmptyState — No selection

### 11.2 Loading States
- Saving → "Saving..." with spinner
- Publishing → "Publishing..." progress
- Template apply → "Applying template..."
- Upload → Progress bar per file
- AI generate → "Generating..." with stages

### 11.3 Error States
- Save error → "Save failed" + retry
- Publish error → Error message + retry
- Upload error → File-specific error + retry
- AI unavailable → Muted state + retry

### 11.4 Plan Gating
- Hard gate → UpgradeModal blocks action
- Soft gate → Lock icon + badge
- Limit gate → Toast warning then gate
- LockedScreen → Inline locked content

---

## 12. Dependencies & Assumptions

### 12.1 Tech Stack
- React 18.3 + TypeScript 5.3
- Vite 7.2
- Emotion (@emotion/react, @emotion/styled)
- Lucide React (icons)
- GSAP (animations)
- Zod (validation)

### 12.2 Assumptions
- User has modern browser with CSS custom properties support
- Minimum viewport 1024×768px
- Auto-save interval: 5000ms
- Collaboration via WebSocket/real-time sync

---

## 13. Acceptance Criteria

### 13.1 Core Functionality
- [ ] All 10 sidebar tabs accessible and functional
- [ ] Canvas element selection, multi-select, drag, resize working
- [ ] Inspector shows all 20+ sections across 3 tabs
- [ ] All 30+ keyboard shortcuts functional
- [ ] Save/publish flows complete with proper states

### 13.2 Feature Coverage
- [ ] CMS collection creation and binding working
- [ ] AI Assistant Bar and Copilot functional
- [ ] Collaboration presence and cursors visible
- [ ] Version history save/restore/compare working
- [ ] Template browse and apply working
- [ ] Media upload and selection working

### 13.3 UX Quality
- [ ] All states (empty, loading, error, success) handled
- [ ] Keyboard navigation complete
- [ ] Focus management proper
- [ ] WCAG 2.1 AA compliant
- [ ] Reduced motion preference respected

---

## Appendix A: File Structure Reference

```
src/
├── engine/          # Composer.ts + 29 managers
├── editor/          # UI components (new code)
│   ├── shell/       # Main shell + top bar
│   ├── canvas/      # Canvas rendering
│   ├── sidebar/     # Left panel tabs
│   ├── inspector/   # Right properties panel
│   └── ...
├── shared/          # Types, utils, hooks
├── components/      # Legacy (don't add new code)
└── themes/          # CSS tokens
```

---

## Appendix B: Quick Reference

| Shortcut | Action |
|----------|--------|
| A | Build tab |
| T | Templates |
| Z | Layers |
| P | Pages |
| ⇧A | Components |
| J | Media |
| D | Design |
| S | Settings |
| U | Publish |
| H | History |
| Ctrl+K | Command Palette |
| Ctrl+J | AI Assistant |
| ? | Shortcuts |

---

*End of PRD*
