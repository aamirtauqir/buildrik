# Buildrik / Aquibra Studio — MVP PRD

**Version:** 1.0 (MVP)
**Date:** 2026-03-21
**Status:** Ready for Development

---

## Executive Summary

Buildrik/Aquibra Studio is a **drag-and-drop web builder** delivered as an embeddable React component (`<AquibraStudio />`). This PRD defines the MVP scope: the minimum viable product that demonstrates core value while being shippable within a focused sprint window.

**Core Promise:** Build professional websites visually — no code required — and publish them instantly.

---

## 1. Product Definition

### 1.1 What We Are Building

**Name:** Aquibra Studio
**Type:** Visual drag-and-drop website builder
**Delivery:** React 18 component (`<AquibraStudio />`)
**Target Host:** `buildrik.app/{projectId}`

### 1.2 What We Are NOT Building (MVP)

The following are explicitly deferred to Phase 2+:

| Feature | Reason for Deferral |
|---------|-------------------|
| Real-time collaboration (OT) | Complex infrastructure, low immediate value |
| CMS/Collections | Requires backend data layer |
| AI features (PageGenerator, ContentWriter) | AI integration is a separate effort |
| Version History diff view | Nice-to-have for power users |
| Design System tokens | Advanced feature, not core flow |
| Plugin system | Engine-level, no user-facing need |
| Multi-page routing | Single-page MVP first |
| Export formats (React/Vue/Next) | HTML export is sufficient |
| Component variants | Component basics are MVP |
| Pseudo-state editing | Edge case for MVP |
| Breakpoint-specific overrides | Single breakpoint for MVP |

### 1.3 MVP Scope

**What IS in MVP:**

| Category | Features |
|----------|----------|
| Canvas | Drag-and-drop elements, selection, move, resize, inline text edit |
| Elements | Basic set: Text, Image, Button, Container, Section, Link |
| Inspector | Position, Size, Spacing, Typography, Background, Border |
| Sidebar | Build tab (add elements), Layers tab, Pages tab |
| Templates | Pre-built templates to start from |
| Publishing | Save and publish to buildrik.app |
| Undo/Redo | Full history stack |
| Keyboard shortcuts | Essential subset (10-15 shortcuts) |
| Device preview | Desktop only (Phase 2: responsive) |

---

## 2. Target Users

### 2.1 Primary Persona: The Quick Starter

**Profile:** Solopreneur or small business owner who needs a website fast.

**Goals:**
- Get a professional-looking site live in under 30 minutes
- Customize colors and text to match their brand
- Publish and iterate without technical help

**Pain Points:**
- Can't code
- Overwhelmed by WordPress/Wix complexity
- Needs it done today

**Success Metric:** First publish in < 30 minutes

### 2.2 Secondary Persona: The SaaS Integrator

**Profile:** Developer embedding Aquibra Studio in their own SaaS product.

**Goals:**
- Embed `<AquibraStudio />` with minimal configuration
- Customize branding (CSS variables)
- Handle publish events programmatically

**Success Metric:** Integration working in < 2 hours

---

## 3. Core User Flows

### 3.1 First-Time User Flow

```
[Landing] → [Welcome Modal] → [Choose: Blank or Template] → [Canvas Editor] → [Add Element] → [Edit Content] → [Publish]
```

**Steps:**

1. **Welcome Modal** (first visit only)
   - Two options: "Start with a template" / "Start blank"
   - If template: Opens template browser
   - If blank: Opens editor with empty canvas

2. **Canvas Editor** (main workspace)
   - Left sidebar with Build tab active
   - Empty canvas with "Add your first element" prompt
   - Right inspector (empty state)

3. **Add Element**
   - Click element card in Build tab → inserted at center
   - OR drag element card → drop on canvas at specific position

4. **Edit Content**
   - Click element → selected (blue outline)
   - Double-click text → inline edit mode
   - OR use inspector fields

5. **Publish**
   - Click Publish button (top bar)
   - "Publishing..." loading state
   - Success: "Your site is live at [URL]"
   - Error: "Something went wrong. Try again."

### 3.2 Returning User Flow

```
[App Load] → [Load Last Project] → [Canvas Editor] → [Edit] → [Save/Publish]

[Save] = Auto-save every 5 seconds, status shown in top bar
[Publish] = Manual publish action
```

### 3.3 Template User Flow

```
[Templates Tab] → [Browse Grid] → [Hover: Preview] → [Click: Use Template] → [Confirm: Replace/Create] → [Canvas with Template Content]
```

---

## 4. Layout Architecture

### 4.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOP BAR (52px)                                                     │
│  [Logo] [ProjectName] ... [Device] ... [Preview] [Publish]          │
├──────┬───────────────────────────────┬──────────────────────────────┤
│      │                               │                              │
│ RAIL │      LEFT SIDEBAR             │         CANVAS               │
│(56px)│        (280px)                │        (flex: 1)            │
│      │                               │                              │
│ [A]  │  ┌─────────────────────────┐ │    ┌────────────────────┐    │
│ [T]  │  │ Panel Header (48px)     │ │    │                    │    │
│ [Z]  │  ├─────────────────────────┤ │    │   Website Canvas   │    │
│ [P]  │  │                         │ │    │   (1440x900 base)  │    │
│      │  │ Panel Content           │ │    │                    │    │
│      │  │ (scrollable)            │ │    │                    │    │
│      │  │                         │ │    │                    │    │
│      │  │                         │ │    │                    │    │
│      │  └─────────────────────────┘ │    └────────────────────┘    │
│      │                               │                              │
│      │                               ├──────────────────────────────┤
│      │                               │   CANVAS FOOTER (40px)      │
│      │                               │   [Zoom] [Device] [Snap]    │
├──────┴───────────────────────────────┴──────────────────────────────┤
│                              NOT IN MVP: Right Inspector            │
│                         (Simplified: contextual toolbar only)       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Zone Definitions

| Zone | Width | Behavior |
|------|-------|----------|
| Top Bar | 100% × 52px | Fixed, always visible |
| Rail | 56px × calc(100vh - 52px) | Fixed, left edge |
| Left Sidebar | 280px × calc(100vh - 52px) | Drawer mode, scrollable content |
| Canvas | flex: 1 × calc(100vh - 52px - 40px) | Main editing area |
| Canvas Footer | flex: 1 × 40px | Fixed, bottom of canvas |

### 4.3 Responsive Strategy

**MVP: Desktop-only (1440px design target)**
- Minimum supported: 1024px
- Below 1024px: "Please use a larger screen" message

---

## 5. Top Bar

### 5.1 Anatomy

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo] [ProjectName ▼] │ ··· │ [Desktop] │ [Preview] [Publish]    │
│           ↑            │      ↑           ↑           ↑             │
│        Dropdown       Spacer    Device    Undo/Redo  Actions       │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Elements

| Element | Type | Behavior |
|---------|------|----------|
| Logo | Static | Links to dashboard (out of scope) |
| Project Name | Dropdown | Click to rename project |
| Spacer | — | Flex spacer |
| Device Switcher | Pill group | Desktop (active) / Tablet / Mobile |
| Undo | Icon button | Ctrl+Z, disabled when nothing to undo |
| Redo | Icon button | Ctrl+Y, disabled when nothing to redo |
| Preview | Button | Toggle preview mode (canvas shows published state) |
| Publish | Primary button | Publishes site to buildrik.app |

### 5.3 Save Status Indicator

Integrated into top bar, near project name:

| State | Indicator |
|-------|-----------|
| Saved | Green dot (subtle) |
| Saving | Amber dot + "Saving..." |
| Error | Red dot + "Save failed" + retry link |

---

## 6. Rail (Left Navigation)

### 6.1 MVP Tabs

| Icon | Label | Shortcut | Tab |
|------|-------|----------|-----|
| [+] | Build | A | Add elements to canvas |
| [T] | Templates | T | Browse and apply templates |
| [Z] | Layers | Z | Element hierarchy tree |
| [P] | Pages | P | Manage pages |

**Deferred to Phase 2:** Media, Design, Settings, History, Components, Publish

### 6.2 Behavior

- Active tab: Highlighted background
- Hover: Subtle highlight
- Click: Opens corresponding tab in left sidebar

---

## 7. Left Sidebar — Build Tab

### 7.1 Purpose

Element palette for adding new elements to the canvas.

### 7.2 Structure

```
┌──────────────────────────┐
│ BUILD              [Pin] │  ← Panel header (48px)
├──────────────────────────┤
│ [🔍 Search elements...]  │  ← Search input
├──────────────────────────┤
│ STRUCTURE               ▼│  ← Category accordion
│  ┌────────────────────┐  │
│  │ ▣ Container        │  │  ← Element card
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ ▢ Section          │  │
│  └────────────────────┘  │
│                          │
│ TEXT                    ▼│
│  ┌────────────────────┐  │
│  │ T Heading          │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ " Paragraph       │  │
│  └────────────────────┘  │
│                          │
│ MEDIA                   ▼│
│  ┌────────────────────┐  │
│  │ 🖼 Image           │  │
│  └────────────────────┘  │
│                          │
│ INTERACTIVE             ▼│
│  ┌────────────────────┐  │
│  │ 🔘 Button          │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🔗 Link            │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│ Drag to canvas or click  │  ← Footer hint
└──────────────────────────┘
```

### 7.3 Element Cards

| Element | Icon | Description |
|---------|------|-------------|
| Container | ▣ | Empty box for grouping |
| Section | ▢ | Full-width container |
| Heading | T | H1-H6 text |
| Paragraph | " | Body text |
| Image | 🖼 | Image element |
| Button | 🔘 | Clickable button |
| Link | 🔗 | Anchor element |

### 7.4 Interactions

- **Click:** Insert element at canvas center
- **Drag:** Ghost element follows cursor, canvas shows drop indicator
- **Search:** Filter elements by name

---

## 8. Left Sidebar — Templates Tab

### 8.1 Purpose

Browse and apply pre-built templates.

### 8.2 Structure

```
┌──────────────────────────┐
│ TEMPLATES          [Pin] │
├──────────────────────────┤
│ [All] [Pages] [Landing]  │  ← Filter chips
├──────────────────────────┤
│ ┌─────────┐ ┌─────────┐  │
│ │ Preview │ │ Preview │  │
│ │         │ │         │  │
│ │ Name    │ │ Name    │  │
│ │ Category│ │ Category│  │
│ └─────────┘ └─────────┘  │
│ ┌─────────┐ ┌─────────┐  │
│ │ Preview │ │ Preview │  │
│ └─────────┘ └─────────┘  │
│                          │
│      ...more...          │
└──────────────────────────┘
```

### 8.3 Template Card

- **Default:** Thumbnail (2:3 ratio) + name + category tag
- **Hover:** Subtle lift + "Preview" overlay button
- **Click:** Opens preview modal

### 8.4 Template Preview Modal

```
┌──────────────────────────────────────────────────────────┐
│                                              [✕ Close]  │
│                                                          │
│              Full-size template preview                   │
│              (scrollable if needed)                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Template Name                                           │
│  Category • X elements                                   │
│                                                          │
│  [Cancel]              [Use This Template]              │
└──────────────────────────────────────────────────────────┘
```

### 8.5 Apply Template Flow

1. Click "Use This Template"
2. Confirmation: "Replace current content with this template?"
   - "Replace" → clears canvas, applies template
   - "Add as Section" → (Phase 2)
   - "Cancel" → closes modal

---

## 9. Left Sidebar — Layers Tab

### 9.1 Purpose

Visual representation of element hierarchy.

### 9.2 Structure

```
┌──────────────────────────┐
│ LAYERS             [Pin] │
├──────────────────────────┤
│ ▼ body                   │  ← Root (always present)
│   ▶ section.hero         │
│     ▶ div.container      │
│       ├─ 🖼 image        │
│       └─ T "Welcome"     │
│   ▶ section.features     │
│     ▶ div.grid           │
│       ├─ ▣ card          │
│       └─ ▣ card          │
└──────────────────────────┘
```

### 9.3 Layer Row

| Element | Icon | Label | Actions |
|---------|------|-------|---------|
| Container | ▣ | Name (editable on double-click) | ··· menu |
| Section | ▢ | Name | ··· menu |
| Text | T | Text preview | ··· menu |
| Image | 🖼 | Filename or "Image" | ··· menu |
| Button | 🔘 | Label text | ··· menu |
| Link | 🔗 | Label text | ··· menu |

### 9.4 Context Menu

- Rename
- Duplicate
- Delete
- "Show in Canvas" (scrolls to element)

### 9.5 Interactions

- **Click row:** Select element (syncs with canvas)
- **Double-click label:** Rename element
- **Drag row:** Reorder in hierarchy
- **Click chevron:** Expand/collapse

---

## 10. Left Sidebar — Pages Tab

### 10.1 Purpose

Manage multiple pages in the project.

### 10.2 Structure

```
┌──────────────────────────┐
│ PAGES              [Pin] │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ 🏠 Home          •••│ │  ← Page row (Home badge)
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 📄 About           •••│ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 📄 Contact         •••│ │
│ └──────────────────────┘ │
├──────────────────────────┤
│      [+ Add Page]         │
└──────────────────────────┘
```

### 10.3 Page Row

| State | Appearance |
|-------|------------|
| Default | File icon + name + ··· menu |
| Active | Bold name, active indicator |
| Hover | Background highlight |

### 10.4 Page Context Menu

- Rename
- Duplicate
- Set as Home
- Delete (disabled if only page)

### 10.5 Add Page

- Click "+ Add Page"
- New page created with default name "Untitled Page"
- Name becomes editable

---

## 11. Canvas

### 11.1 Purpose

The main editing surface where users build their website.

### 11.2 Canvas Container

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │                    WEBSITE CANVAS                    │  │
│  │                    (1440 × 900)                      │  │
│  │                                                      │  │
│  │   ┌──────────────────────────────────────────────┐   │  │
│  │   │                                              │   │  │
│  │   │            Element goes here                 │   │  │
│  │   │                                              │   │  │
│  │   └──────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 11.3 Canvas Background

- Color: `#F2F2F2` (surrounding)
- Website canvas: `#FFFFFF` with subtle shadow
- Rulers: Hidden in MVP

### 11.4 Empty State

When canvas has no elements:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                    ✨ Start building                        │
│                                                            │
│            Click an element in the Build tab               │
│            or start from a template                        │
│                                                            │
│                    [Browse Templates]                       │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 11.5 Element Selection

| State | Appearance |
|-------|------------|
| Default | No outline |
| Hover | Teal outline (2px) |
| Selected | Blue outline (2px) + resize handles |
| Dragging | Semi-transparent (80% opacity) |

### 11.6 Selection Handles

When element is selected:
- 8 resize handles (corners + edges)
- Corner handles: resize both dimensions
- Edge handles: resize single dimension
- Handle size: 8×8px, white fill, blue border

### 11.7 Inline Text Editing

Triggered by double-clicking a text element:

```
┌─────────────────────────────────┐
│ [Text formatting toolbar]        │  ← Floating above element
│ [B] [I] [U] [H1▼] [Color]      │
├─────────────────────────────────┤
│                                 │
│   User is editing this text     │  ← Cursor visible
│                                 │
└─────────────────────────────────┘
```

- Toolbar appears above element
- Press Escape or click outside to exit
- Changes apply immediately

### 11.8 Context Menu

Right-click on element:

```
┌─────────────────────────┐
│ Copy              Ctrl+C│
│ Cut               Ctrl+X│
│ Paste              Ctrl+V│
│ Duplicate    Ctrl+D     │
│ ───────────────────────│
│ Bring Forward      Ctrl+]│
│ Send Backward      Ctrl+[│
│ ───────────────────────│
│ Delete          Delete  │
└─────────────────────────┘
```

**NOT in MVP:**
- "Wrap in Container"
- "Create Component"
- "AI: Improve this"
- "Select from stack"

---

## 12. Canvas Footer

### 12.1 Purpose

Zoom controls and canvas utilities.

### 12.2 Structure

```
┌────────────────────────────────────────────────────────────┐
│ [−] 100% [+] │ [Desktop ▼] │ [📐 Snap]                   │
│    Zoom       │   Device    │   Toggle                    │
└────────────────────────────────────────────────────────────┘
```

### 12.3 Elements

| Element | Behavior |
|---------|----------|
| Zoom slider | Range: 25% - 200%, default 100% |
| Zoom percentage | Click to enter specific value |
| Device selector | Desktop / Tablet / Mobile (Phase 2) |
| Snap toggle | Enable/disable grid snapping |

---

## 13. Contextual Toolbar (Simplified Inspector)

### 13.1 Purpose

Quick property editing for selected element. In MVP, this is a floating toolbar, not a right panel.

### 13.2 Position

Appears above the selected element, anchored to the top.

### 13.3 Structure

```
┌────────────────────────────────────────────────────────────┐
│ [↩ Undo] [↪ Redo] │ [Position ▼] │ [Size ▼] │ [⋮ More]  │
└────────────────────────────────────────────────────────────┘
```

### 13.4 Contextual Sections

Based on selected element type:

**Text Elements:**
| Section | Controls |
|---------|----------|
| Typography | Font size, Bold/Italic/Underline, Text align |
| Color | Text color picker |

**Image Elements:**
| Section | Controls |
|---------|----------|
| Size | Width, Height, Fit (cover/contain) |
| Replace | Open media library |

**Button Elements:**
| Section | Controls |
|---------|----------|
| Text | Button label |
| Link | URL input |
| Style | Primary/Secondary/Outline |

**Container/Section:**
| Section | Controls |
|---------|----------|
| Background | Color picker |
| Padding | Slider |

### 13.5 "More" Menu

Opens a drawer with additional properties:

```
┌─────────────────────────┐
│ Element: Heading         │
├─────────────────────────┤
│ Position                 │
│ Width: [____] Height: [__]│
│ Margin: [____]          │
│ Padding: [____]         │
├─────────────────────────┤
│ ─────────────────────── │
│ Delete Element          │
└─────────────────────────┘
```

---

## 14. Publishing Flow

### 14.1 Publish Button States

| State | Appearance |
|-------|------------|
| Ready | "Publish" (primary button) |
| Publishing | "Publishing..." + spinner |
| Success | "Update" (primary button) |
| Error | "Publish Failed" (red) + retry link |

### 14.2 Publish Flow

```
1. User clicks Publish
2. Button shows "Publishing..." with spinner
3. Project saved to storage
4. Site built and deployed to buildrik.app/{projectId}
5. Success: Toast "Your site is live at [URL]" with copy button
6. Error: Toast "Publish failed. [Retry]" with error details
```

### 14.3 Success State

After successful publish:

```
┌────────────────────────────────────────────────────────────┐
│  ✓  Your site is live!                                   │
│                                                            │
│  https://buildrik.app/abc123                              │
│  [📋 Copy]  [👁 Visit Site]                               │
└────────────────────────────────────────────────────────────┘
```

---

## 15. Keyboard Shortcuts (MVP Subset)

### 15.1 Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Force save |
| Ctrl+C | Copy element |
| Ctrl+X | Cut element |
| Ctrl+V | Paste element |
| Ctrl+D | Duplicate element |
| Delete | Delete selected element |
| Escape | Deselect / Exit inline edit |
| Ctrl+A | Select all |
| Arrow keys | Nudge 1px |
| Shift+Arrow | Nudge 10px |
| Ctrl+] | Bring forward |
| Ctrl+[ | Send backward |

### 15.2 Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| A | Open Build tab |
| T | Open Templates tab |
| Z | Open Layers tab |
| P | Open Pages tab |
| Ctrl+K | Command palette (Phase 2) |

---

## 16. Error States

### 16.1 Save Error

```
┌────────────────────────────────────────────────────────────┐
│ ⚠ Save failed                                             │
│                                                            │
│ Your changes couldn't be saved.                            │
│ [Retry]                                                    │
└────────────────────────────────────────────────────────────┘
```

- Show in top bar (inline, not toast)
- Retry button attempts save again
- After 3 failures, show "Contact support" link

### 16.2 Publish Error

```
┌────────────────────────────────────────────────────────────┐
│ ✕ Publish failed                                          │
│                                                            │
│ Something went wrong while publishing.                      │
│ Your work is saved locally.                                │
│                                                            │
│ [Retry]                                                    │
└────────────────────────────────────────────────────────────┘
```

### 16.3 Element Load Error

If an element fails to render:
- Show placeholder with error icon
- Text: "This element couldn't load"
- "Remove" button

### 16.4 Offline State

When user loses internet:
- Show banner at top: "You're offline. Changes will sync when reconnected."
- All editing continues locally
- Publish disabled

---

## 17. Loading States

### 17.1 Initial Load

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                      ⏳ Loading...                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Centered spinner
- No timeout (always show until ready)

### 17.2 Template Loading

When applying template:
```
┌────────────────────────────────────────────────────────────┐
│                      ⏳ Applying template...                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Full-canvas overlay
- Auto-dismiss when complete

### 17.3 Image Upload

```
┌────────────────────────────────────────────────────────────┐
│ Uploading...  ████████████░░░░░░░░  65%                    │
│ [Cancel]                                                     │
└────────────────────────────────────────────────────────────┘
```

---

## 18. Empty States

### 18.1 Layers Tab (No Elements)

```
┌────────────────────────────────────────────────────────────┐
│ LAYERS                                                       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│              No elements yet                                │
│                                                              │
│         Add elements from the Build tab                      │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### 18.2 Pages Tab (Single Page)

```
┌────────────────────────────────────────────────────────────┐
│ PAGES                                                       │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🏠 Home                                            ••• │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│              [+ Add Page]                                    │
└────────────────────────────────────────────────────────────┘
```

---

## 19. Component Inventory

### 19.1 Buttons

| Variant | Use |
|---------|-----|
| Primary | Publish, main CTAs |
| Secondary | Cancel, secondary actions |
| Ghost | Undo, redo, icon buttons |
| Destructive | Delete actions |

### 19.2 Inputs

| Type | Use |
|------|-----|
| Text | Element names, URLs |
| Number | Dimensions, margins |
| Search | Element search |
| Color | Colors (with picker) |

### 19.3 Containers

| Type | Use |
|------|-----|
| Panel | Sidebar tabs |
| Modal | Templates, confirmations |
| Drawer | Additional properties |
| Toast | Success/error messages |
| Dropdown | Selects, device switcher |

---

## 20. Technical Constraints

### 20.1 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 20.2 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds |
| Element insert | < 100ms |
| Save operation | < 500ms |
| Publish | < 10 seconds |

### 20.3 Responsive Behavior

**MVP: Desktop-only**
- Minimum viewport: 1024px
- Below minimum: Full-screen message "Please use a larger screen (min 1024px)"

---

## 21. Out of Scope (Phase 2+)

### 21.1 Features

- [ ] Right panel Inspector (full)
- [ ] Real-time collaboration
- [ ] CMS/Collections
- [ ] AI features
- [ ] Version history with diff
- [ ] Design system tokens
- [ ] Plugin system
- [ ] Multi-page routing
- [ ] Export to React/Vue/Next
- [ ] Component variants
- [ ] Pseudo-state editing
- [ ] Responsive preview (tablet/mobile)
- [ ] Keyboard shortcut cheat sheet
- [ ] Command palette

### 21.2 Screens

- Settings screen
- Media library
- Design tokens editor
- Component library
- Version history

---

## 22. Success Metrics

### 22.1 User Metrics

| Metric | Target |
|--------|--------|
| Time to first publish | < 30 minutes |
| First-day retention | > 50% |
| Weekly active users | Growing |
| Pages per project | > 3 |

### 22.2 Technical Metrics

| Metric | Target |
|--------|--------|
| Page load time | < 3s |
| Error rate | < 1% |
| Crash rate | < 0.1% |

---

## 23. Appendix: Screen Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Aquibra Studio                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Welcome Modal (first visit only)                     │    │
│  │ - Start with template / Start blank                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Template Browser Modal                               │    │
│  │ - Grid of templates                                  │    │
│  │ - Preview on hover                                   │    │
│  │ - Use template confirmation                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Main Editor (single screen)                         │    │
│  │ ┌─────┬───────────────────────┬────────────────┐     │    │
│  │ │Rail │Left Sidebar          │    Canvas      │     │    │
│  │ │     │ - Build tab          │                │     │    │
│  │ │ [A] │ - Templates tab      │                │     │    │
│  │ │ [T] │ - Layers tab         │                │     │    │
│  │ │ [Z] │ - Pages tab          │                │     │    │
│  │ │ [P] │                      │                │     │    │
│  │ │     │                      │                │     │    │
│  │ │     │                      ├────────────────┤     │    │
│  │ │     │                      │Canvas Footer   │     │    │
│  │ └─────┴──────────────────────┴────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Contextual Toolbar (floating above selected element) │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Toast Notifications (bottom-right)                    │    │
│  │ - Publish success/error                               │    │
│  │ - Save status                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 24. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-21 | Initial MVP scope |
