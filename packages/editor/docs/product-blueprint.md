# Buildrik / Aquibra Studio — Existing App Blueprint
**Role:** Principal Product Designer + UX Architect + Product Analyst + SaaS Systems Strategist
**Date:** 2026-03-29
**Purpose:** Master reference document for future product decisions, redesign, roadmap, and feature expansion.

> This document describes the product as experienced by a user — not the code behind it.
> It captures what the product is, how it works, where it breaks, and what needs to happen before it can grow safely.

---

# A. Product Identity

## Product Name
Buildrik (editor module branded as "Aquibra Studio")

## Product Category
Visual Web Builder / No-Code Site Editor — SaaS

## Product Purpose
Allow non-technical users (and developers who want speed) to visually build, design, and publish websites without writing code. Users drag and drop elements onto a canvas, configure them visually, and publish directly to a live URL.

## Primary Users
- **Indie makers and solopreneurs** building their first business site
- **Small marketing teams** who want to create and update pages without developer dependency
- **Founders** who want a professional-looking site fast, without hiring a designer or developer
- **Freelancers** who build sites for clients using a white-labeled or hosted tool

## Core Promise / Value Proposition
> "Build a professional website visually — no code, no complexity, live in minutes."

The product competes in the space of Webflow (power), Wix (simplicity), and Framer (design fidelity). It attempts to offer design-quality output with beginner-accessible editing.

---

# B. Product Scope

## What This App Currently Covers
- Visual drag-and-drop page editor with a live canvas
- Multi-page website management
- Responsive design (mobile / tablet / desktop / wide breakpoints)
- Element-level styling: typography, layout, background, borders, shadows, effects
- Design system (color tokens, typography tokens, spacing tokens)
- Component library (reusable blocks across pages)
- Template library (pre-built page layouts)
- Media library (upload, manage, crop, optimize images/videos/fonts)
- Site settings (SEO, domains, analytics, integrations, export, billing)
- Publish to a live URL
- Version history and undo/redo
- AI-assisted design suggestions
- Real-time collaboration (multi-user cursors)
- CMS data structures (engine built, no editing UI exposed yet)

## What Its Boundaries Appear to Be
The editor is a **frontend-only canvas tool**. It does not appear to handle:
- Backend/database management (CMS is engine-level only, no product UI)
- E-commerce transaction processing (structure exists in engine, not exposed)
- Authentication/user accounts (handled outside the editor module)
- Hosting infrastructure (publish calls out to a host-side system via callbacks)
- Custom code execution (only script injection via Advanced settings)

## In-Scope vs Out-of-Scope

| In Scope | Out of Scope |
|----------|-------------|
| Visual page design | Backend logic / APIs |
| Style configuration | User authentication |
| Publishing to a URL | Payment processing |
| Design tokens | Database queries |
| Template library | Server-side rendering |
| Media management | Email / notification systems |
| Basic SEO fields | Analytics dashboards (display only, not built) |

---

# C. Role and Permission Overview

## User Types (Observed from product structure)

### 1. Owner / Admin
- Full access to all site settings, billing, domain management
- Can publish and unpublish the site
- Access to Advanced settings, Export, and Billing screens
- Can invite collaborators

### 2. Editor / Collaborator
- Access to canvas editing, media, pages, design tokens
- Real-time collaboration with cursor visibility
- Likely restricted from billing and domain management
- Conflict resolution UI exists (ConflictModal) — implies concurrent editing is expected

### 3. Free / Locked User
- A "Locked" screen exists in settings — implies certain features are paywalled
- Feature gates visible in Billing screen and LockedScreen
- Likely restricted from: custom domains, advanced export, certain integrations

## What Is Unclear (Gaps)
- No in-product role indicator — user cannot see their own permission level
- No team management UI visible in the editor
- No "view-only" mode for clients or stakeholders
- Invite flow not visible in editor scope

---

# D. Full Product Map

## All Modules

```
BUILDRIK EDITOR
│
├── WORKSPACE SHELL
│   ├── Top Bar (navigation + actions)
│   ├── Left Rail (tab navigation)
│   └── Layout (canvas + sidebar + inspector arrangement)
│
├── SIDEBAR (10 panels)
│   ├── Add Elements (element catalog)
│   ├── Templates (page templates)
│   ├── Layers (DOM tree view)
│   ├── Pages (multi-page management)
│   ├── Components (reusable blocks)
│   ├── Media (asset library)
│   ├── Design System (tokens: color, type, spacing)
│   ├── Settings (9 sub-screens)
│   ├── Publish (deploy flow)
│   └── History (undo log)
│
├── CANVAS (editing surface)
│   ├── Element rendering
│   ├── Selection system
│   ├── Drag and drop
│   ├── Inline text editing
│   ├── Multi-select and alignment
│   ├── Responsive preview
│   ├── Snap guides
│   ├── Context menu
│   ├── Command palette
│   └── Footer toolbar (overlays + zoom)
│
├── INSPECTOR (right panel)
│   ├── Layout tab (position, size, flexbox)
│   ├── Appearance tab (typography, background, border)
│   └── Effects tab (shadow, animation, interactions, raw CSS)
│
├── OVERLAYS / MODALS
│   ├── Onboarding flow (welcome, spotlight, checklist)
│   ├── Template picker (first-run + on-demand)
│   ├── Export modal
│   ├── Conflict modal (collaboration)
│   └── AI assistant bar
│
└── ENGINE (invisible to user, powers everything)
    └── Manages: elements, styles, selection, history, pages, media,
               design tokens, CMS, collaboration, components, etc.
```

## Navigation Structure

The navigation is **tab-based** within a persistent shell layout:

```
[ TOP BAR — always visible ]

[ LEFT RAIL — always visible ]
     |
     ↓ click a tab icon
[ SIDEBAR DRAWER — slides in, 280px wide ]
     |
     The drawer overlaps the left part of the canvas

[ CANVAS — fills remaining width ]
     |
     ↓ click an element
[ RIGHT INSPECTOR — always visible, updates on selection ]
```

**Key navigation rule:** The rail icon and keyboard shortcuts are the only way to switch sidebar panels. There is no other navigation pattern in the editor.

## Relationships Between Modules

```
Templates ──────────────→ Canvas (template populates canvas content)
Add Elements ───────────→ Canvas (element is inserted into page)
Layers Panel ←──────────→ Canvas (bidirectional: select in either updates both)
Pages Panel ────────────→ Canvas (page switch re-renders canvas)
Inspector ←─────────────→ Canvas (style changes update canvas instantly)
Design Tokens ──────────→ Inspector (tokens available in color/font pickers)
Media Library ──────────→ Inspector (image source picker)
Media Library ──────────→ Canvas (drag image from panel to canvas)
Publish ────────────────→ External host (deploy via callbacks)
History ────────────────→ Canvas (undo/redo restores canvas state)
Components ─────────────→ Canvas (component instances placed on canvas)
Settings (SEO) ──────────→ Publish (SEO data should feed publish checklist — currently broken)
```

---

# E. End-to-End Journey Map

All 20 user flows — every path a user can take inside the editor.

## Entry Points
- **New user:** Opens app → no content → first-run template picker appears automatically
- **Returning user:** Opens app → last canvas state restored
- **Direct link:** Specific page in an existing project

## 1. Onboarding Entry (New User)
```
Land on app
  → WelcomeModal (intro, value prop)
  → Template picker opens (choose a starting layout)
  → Template applied to canvas
  → SpotlightOverlay highlights key areas (guided tour optional)
  → OnboardingChecklist persists in corner (complete key actions)
  → AchievementPrompt fires after first key action
```

## 2. Canvas Entry (Returning User)
```
Land on app
  → Canvas shows last edited page
  → Last active sidebar tab remembered
  → Inspector empty (no element selected)
```

## 3. Creation Flow (Building from Scratch)
```
Open Add tab (or shortcut A)
  → Browse element categories
  → Drag element to canvas (or click to insert)
  → Element appears with default styles
  → Inspector auto-opens on right with that element's properties
  → User edits: typography, colors, layout, spacing
  → Repeat for all elements
  → Open Pages tab → add new pages as needed
  → Switch between pages via Pages tab
```

## 4. Template Flow (Building from Template)
```
Open Templates tab (shortcut T — no visible button)
  → Browse template grid
  → Click template → preview modal
  → Click "Use this template" → confirm drawer
  → Progress overlay (applying...)
  → Canvas populated with template content
  → User customizes elements
```

## 5. Editing Flow (Element Customization)
```
Click element on canvas
  → Selection handles appear
  → Inspector updates on right
  → Choose tab: Layout / Appearance / Effects
  → Change properties → canvas updates live
  → Double-click text → inline edit mode
  → Right-click → context menu (duplicate, delete, move)
  → Drag to reposition
  → Drag corner handle to resize
```

## 6. Responsive Flow (Multi-Breakpoint)
```
Click device in top bar (or canvas footer — same control duplicated)
  → Canvas resizes to that breakpoint width
  → Inspector shows styles for this breakpoint
  → User adjusts styles (overrides apply only to this breakpoint)
  → Changes are layered: base styles + breakpoint overrides
```

## 7. Configuration Flow (Site Setup)
```
Open Settings tab (rail icon, shortcut S)
  → Site Settings: name, logo, favicon, language
  → SEO: global meta, robots.txt, sitemap
  → Domains: connect custom domain
  → Analytics: add tracking codes
  → Integrations: connect third-party tools
  → Advanced: inject custom scripts
  → Billing: manage plan
```

## 8. Publish Flow
```
Open Publish tab (shortcut U — NO visible rail button)
  → See pre-publish checklist (3 items are always broken — see gaps)
  → Click [Publish]
  → Host-side deploy fires (requires host integration)
  → Status badge changes to "Published"
  → Site live at [slug].buildrik.com
```

**Current state:** This flow has critical blockers. Users who don't know the keyboard shortcut cannot find the Publish feature at all.

## 9. Return / Edit / Update Flow
```
User returns to edit published site
  → Comes back to canvas in last state
  → Makes edits
  → Changes are drafts (no "live" indicator on canvas)
  → User must re-publish for changes to go live
  → No "unpublished changes" banner visible anywhere
```

**Gap:** User has no way to know if their edits are live or draft. There is no "You have unpublished changes" warning.

---

## Flow 10: Design Tokens Edit

```
Open Design panel (rail icon or shortcut D)
  ↓
Three sections: COLORS / TYPOGRAPHY / SPACING
  ↓
Edit token: Click row → inline edit → DraftChip appears (unsaved indicator)
  ↓
[Review] → ReviewModal (preview all changes)
  ↓
Save → tokens update → ALL elements using this token update instantly

Add token: [+ Add] → AddTokenModal → name + value → save

Leave tab with unsaved changes: TabGuardModal → "Save changes?" confirm
```

**Gap:** No token usage count ("12 elements use this color"). No undo within Design panel.

---

## Flow 11: Settings Screens

```
Open Settings panel (rail icon or shortcut S)
  ↓
Card list view (card-drill-in pattern):
  ├── Site Settings — name, favicon, language, logo
  ├── SEO — global meta, robots.txt, sitemap
  ├── Domains — custom domain connect
  ├── Analytics — GA/GTM codes
  ├── Integrations — third-party apps
  ├── Export — download HTML/CSS/ZIP
  ├── Advanced — custom code injection
  ├── Billing — plan + payment
  └── Locked — feature-gated upsell screen
  ↓
Click any card → detail screen slides in (back button to return)
```

**Gap:** No global "unsaved changes" indicator. SEO data entered here does NOT feed the Publish checklist (broken connection).

---

## Flow 12: Publish *(Most Critical — Currently Broken)*

```
Open Publish panel (shortcut U — NO RAIL BUTTON)
  ↓
Pre-publish checklist:
  ✓ Page title set        (computed correctly)
  ✓ Favicon uploaded      (computed correctly)
  ✓ Pages exist           (computed correctly)
  ✗ SEO title             ← ALWAYS FAILS (hardcoded bug)
  ✗ Meta description      ← ALWAYS FAILS (hardcoded bug)
  ✗ Social image          ← ALWAYS FAILS (hardcoded bug)
  ↓
Click [Publish]
  → Fires host-app callback (if not provided → SILENT FAILURE, nothing happens)
  → On success → StatusBadge changes to "Published"
  → URL: [slug].buildrik.com

Click [Unpublish] → host-app callback → site taken down
```

**Critical Bugs:**
1. 3 checklist items permanently fail regardless of actual data
2. No rail button — users cannot find Publish by clicking
3. Requires external callbacks — no default behavior (silent failure)
4. No publishing progress state (spinner)
5. No publish error state with retry

---

## Flow 13: History / Undo

```
Quick undo (always available):
  Ctrl+Z → undo last action → toast "Undone: [action]"
  Ctrl+Y → redo

History panel (shortcut H — NO RAIL BUTTON):
  ActivityView → list of all past actions with timestamps
  Click entry → DiffRow shows before/after comparison
  (Cannot actually revert — view only)
```

**Gap:** Can SEE history but cannot JUMP to a past version. "Revert to this point" is missing.

---

## Flow 14: Template Apply

```
First run (automatic):
  App opens fresh → Templates panel auto-opens → user picks template
  → TemplatePreviewModal → confirm → ApplyProgressOverlay → canvas populated

On-demand (existing project):
  Open Templates panel (shortcut T — NO RAIL BUTTON)
  → Browse grid → preview → confirm drawer → progress overlay → canvas updated
```

**Gap:** No error state if template fails. No success confirmation. Return access hidden (no rail button).

---

## Flow 15: Component Create + Reuse

```
Create:
  Open Components panel (shortcut ⇧A — NO RAIL BUTTON)
  → [+ New Component] → modal → master component created on canvas
  → ComponentDetailScreen → edit master

Use:
  Components panel → [Use] button → instance placed on canvas
  (linked — editing master updates ALL instances everywhere)
```

**Gap:** No rail button — feature invisible to most users. No canvas indicator that an element is a component instance.

---

## Flow 16: Inline Text Edit

```
Double-click text element on canvas
  ↓
Inline edit mode: text cursor appears
  ↓
Keyboard shortcuts: Bold (Ctrl+B), Italic (Ctrl+I), Link (Ctrl+K)
  ↓
Click outside → edit mode exits → changes saved to draft
```

---

## Flow 17: Multi-Select + Align

```
Option A — Marquee: Click empty canvas + drag → selects all elements in rectangle
Option B — Shift+click: Click first element → Shift + click others
  ↓
AlignmentToolbar appears above selection
MultiSelectBadge shows count ("3 selected")
  ↓
Align: Left / Center / Right / Top / Middle / Bottom
Distribute: Horizontally / Vertically
```

---

## Flow 18: Context Menu (Right-Click)

```
Right-click any canvas element
  ↓
Context menu:
  Edit | Duplicate | Copy | Paste | Delete
  Move: Up / Down / To Front / To Back
  AI Request → AI assistant for this element
  Lock → prevent accidental editing
```

---

## Flow 19: Command Palette

```
Press Cmd+K (or canvas footer button)
  ↓
CommandPalette modal opens → type to filter commands → Enter to run
Covers: add element, open panel, publish, undo, zoom, settings, etc.
```

---

## Flow 20: Export

```
Settings → Export card
  ↓
ExportModal: Format (HTML+CSS / ZIP), include assets, minify
  ↓
[Export] → CodePreview shows generated output → Download
```

---

## Flow 21: Real-Time Collaboration

```
Multiple users open same project
  ↓
Each user's cursor visible on canvas in real-time (different colors)
  ↓
One user edits → all others see change live
  ↓
Conflict (two users edit same element):
  ConflictModal → "Accept theirs / Keep mine / Merge"
  SyncStatusIndicator shows connection status
```

---

## All Flows Status Summary

| # | Flow | Status | Key Gap |
|---|------|--------|---------|
| 1 | App open / onboarding | ✅ Works | No loading indicator |
| 2 | Return to editor | ✅ Works | No "unpublished changes" warning |
| 3 | Build from scratch | ✅ Complete | — |
| 4 | Apply template | ✅ Works | No rail button; no error state |
| 5 | Select → style edit (core) | ✅ Core flow | No breakpoint indicator |
| 6 | Responsive / breakpoints | ✅ Works | Dual switcher; no style diff |
| 7 | Site configuration | ✅ 9 screens | SEO not wired to publish |
| 8 | Publish site | ⛔ Broken | 3 bugs; hidden; silent failure |
| 9 | Return / edit published site | ⚠️ No draft indicator | No "unpublished changes" banner |
| 10 | Design tokens | ✅ Complete | No usage count; no undo in panel |
| 11 | Settings | ✅ 9 screens | No unsaved indicator |
| 12 | Publish (detailed) | ⛔ Broken | See Flow 8 |
| 13 | History / Undo | ⚠️ Partial | Cannot revert to version |
| 14 | Template apply (detailed) | ✅ Works | Hidden; no error state |
| 15 | Component create/reuse | ⚠️ Hidden | No rail button |
| 16 | Inline text edit | ✅ Complete | — |
| 17 | Multi-select + align | ✅ Complete | — |
| 18 | Context menu | ✅ Complete | — |
| 19 | Command palette | ✅ Complete | — |
| 20 | Export | ✅ Complete | — |
| 21 | Real-time collaboration | ✅ Infrastructure | Conflict UX depth unclear |

---

# F. Screen-Level Documentation

## F.1 — Top Bar

**Why it exists:** Global actions, project context, device preview control.

**What users expect:** Project name, save status, preview, publish — the "action bar" of the editor.

**Actions available:**
- Edit project name
- Undo / Redo
- Switch device breakpoint (mobile/tablet/desktop/wide)
- Preview site
- Publish site

**What seems weak:**
- No "Saved" / "Saving..." indicator — users don't know if their work is safe
- No breadcrumb back to dashboard/project list
- Device switcher appears here AND in canvas footer — duplicated, confusing
- Publish is a button here but the full Publish flow lives in a hidden sidebar tab
- 5 props in the API are deprecated but still visible to developers — suggests interface has not been cleaned after restructuring

---

## F.2 — Left Rail

**Why it exists:** Primary navigation — switch between sidebar panels.

**What users expect:** Icons for all major sections. Click an icon to open that panel.

**Critical Gap:** Only 6 of 10 panels have visible icons. 4 panels are keyboard-shortcut only:

| Hidden Panel | Why It Matters |
|-------------|---------------|
| Templates | Core creation flow — users need this to start |
| Components | Power feature — completely undiscoverable |
| Publish | THE most important action — invisible |
| History | Recovery tool — invisible |

**What seems weak:**
- A user who has never used keyboard shortcuts will never publish their site
- No notification badges on icons (the code has a badge system built — it just isn't used)
- No label text visible next to icons (labels exist in code but are tiny, secondary)
- No indicator of "which tab was last open" when drawer is collapsed

---

## F.3 — Add Elements Panel

**Why it exists:** Entry point for adding new content to the page.

**What users expect:** A categorized list of all available elements they can drag/click onto canvas.

**What's available:** Search, Favorites zone, Category accordions (Text & Buttons, Layout, Media, Forms, Interactive), My Components section, onboarding tip.

**What seems weak:**
- My Components section has no empty state (just disappears when empty)
- No preview of what an element looks like before adding
- Category names are generic — a first-time user may not know "Interactive" contains scroll triggers

---

## F.4 — Templates Panel

**Why it exists:** Let users start fast with pre-built page designs.

**What users expect:** Browse templates, preview, apply. Standard pattern.

**What's available:** Template grid, preview modal, confirm drawer, progress overlay during application.

**What seems weak:**
- No error state if a template fails to apply
- No success confirmation after apply (user just sees canvas change)
- Panel has no rail button — must use keyboard shortcut T
- No template categories or filters visible from source (cannot confirm)
- No way to "re-apply" or "switch" template on an existing page without overwriting

---

## F.5 — Layers Panel

**Why it exists:** Let users navigate and manage the page structure visually as a tree.

**What users expect:** See all elements in a hierarchy, click to select, drag to reorder.

**What's available:** Full DOM tree, visibility/lock per layer, rename, duplicate, delete, multi-select, search, keyboard navigation, context menu, bidirectional sync with canvas.

**Assessment:** The most complete and mature panel in the product. Does not appear to have significant gaps.

---

## F.6 — Pages Panel

**Why it exists:** Manage all pages in a multi-page site.

**What users expect:** See pages, add/remove pages, open page settings (SEO, social).

**What's available:** Page list with status (Published/Draft), context menu per page, Page Settings drawer with SEO / Social / Advanced tabs, Add Page button.

**What seems weak:**
- No visual thumbnail of pages (just a text list)
- No drag-to-reorder pages
- No bulk operations
- "Published" status per page may not reflect actual live state accurately (unclear)

---

## F.7 — Components Panel

**Why it exists:** Allow users to save a design element as a reusable "master component" — change once, update everywhere.

**What users expect:** See saved components, create new ones, edit masters, drop instances on canvas.

**What's available:** Component list, create modal, component detail editor, use button.

**What seems weak:**
- No rail button — this feature is effectively hidden from most users
- No component categories or search (implied by current structure)
- No visual indicator on canvas showing "this element is a component instance"
- No "detach instance" option documented/visible

---

## F.8 — Media Panel

**Why it exists:** Central asset library — upload and manage all visual assets.

**What users expect:** Grid of images/videos, upload button, click-to-use, basic editing.

**What's available:** Asset grid, upload, image editor (crop, optimize), video preview, icon picker.

**What seems weak:**
- No upload progress visible in the panel
- No "used on X pages" metadata per asset
- No bulk operations (delete multiple assets)
- No folder/album organization
- No drag from panel directly to canvas visually confirmed (available but UX unclear)

---

## F.9 — Design System Panel

**Why it exists:** Maintain a consistent visual identity across the site via reusable tokens (colors, fonts, spacing).

**What users expect:** See and edit all design tokens. Changes propagate everywhere.

**What's available:** Color tokens, typography tokens, spacing tokens, add token modal, review-before-save modal, tab guard (warns on unsaved changes), export dropdown, draft chip.

**What seems weak:**
- No token usage count ("this color is used in 12 elements")
- No undo within the panel (must leave and use global undo)
- Draft state is a chip label — easy to miss/ignore
- Export dropdown exists but export destination/format unclear
- No "apply all" to fix elements not using tokens

---

## F.10 — Settings Panel

**Why it exists:** All site-level configuration — SEO, domains, analytics, billing.

**What users expect:** Organized categories, click to enter a section, save changes.

**What's available:** 9 screens via card-drill-in: Site Settings, SEO, Domains, Analytics, Integrations, Export, Advanced, Billing, Locked (feature gate).

**What seems weak:**
- No global "unsaved changes" indicator across screens
- SEO settings here should feed the Publish checklist — but they don't (broken connection)
- "Locked" screen placement: users encounter a wall without seeing the upsell value first
- Billing lives in the same panel as functional settings — feels intrusive

---

## F.11 — Publish Panel

**Why it exists:** The end goal — make the site live.

**What users expect:** Clear status, a checklist to verify readiness, a big Publish button.

**What's available:** Status badge (Draft/Published), pre-publish checklist, Publish/Unpublish button, live URL display with copy button, error display, privacy footer.

**Critical Failures:**
1. 3 checklist items (SEO title, meta description, social image) always show as failed — data wiring is broken
2. No rail button — users cannot see or find this panel
3. Publish button requires external system callbacks — standalone, it does nothing
4. No publishing progress state
5. No publish error state with retry
6. No "you have unpublished changes" warning anywhere in the app

**Assessment:** The most broken and highest-stakes screen in the product.

---

## F.12 — History Panel

**Why it exists:** Let users see and recover from past actions.

**What users expect:** A list of recent actions, ability to undo to a specific point.

**What's available:** Activity log of actions, before/after diff view per entry, undo/redo buttons.

**What seems weak:**
- Cannot actually revert to a specific point — can only view the diff
- No rail button
- No named snapshots ("save this version as Milestone 1")
- No time-based view (calendar / date filter)

---

## F.13 — Canvas

**Why it exists:** The primary work surface. Everything the user creates is here.

**What users expect:** See my page, click elements, move things, see changes instantly.

**What's available:** Full element rendering, selection with handles, drag/drop, inline text editing, multi-select, rubber-band select, snap guides, context menu, command palette (Cmd+K), footer toolbar (overlays + zoom), real-time collaborator cursors, smart suggestions.

**What seems weak:**
- No visual indicator of which breakpoint is active (other than the switcher selection)
- Empty canvas is passive — CTA exists but could be more prominent
- No "read-only" visual mode when another collaborator is editing the same element
- Draft vs live state not visible anywhere on canvas

---

## F.14 — Inspector (Right Panel)

**Why it exists:** Control the selected element's visual properties.

**What users expect:** All styling options for the selected element, organized logically.

**What's available:** 3 tabs (Layout / Appearance / Effects). Breadcrumb navigation. Pseudo-state selector (:hover, :focus, :active). Dev Mode (raw CSS). Multi-select simplified view. Scroll position memory per element.

**What seems weak:**
- No visual indication of which breakpoint's styles are being edited
- No diff indicator ("this property is overridden from base breakpoint")
- Pseudo-state selector UI is small and easy to miss — users may accidentally style :hover without realizing
- Inspector has no search ("where is the shadow setting?")
- "All CSS" tab in Effects is raw code — jarring for non-technical users sharing the product with developers

---

# G. Drag-and-Drop / Builder System Blueprint

## Canvas Behavior
The canvas renders a page at a selected breakpoint width. It is not a pixel-precise artboard — it is a live HTML-like rendering of the real page, styled with the actual CSS the site will use. What you see is what gets published.

## Layout Hierarchy
The page is structured as a tree:
```
Page
  └── Section (full-width row)
        └── Container (max-width wrapper)
              └── Block / Component
                    └── Element (text, image, button, etc.)
```
Users can nest elements. The hierarchy is visible in the Layers panel.

## Block Insertion Logic
1. User opens Add panel → browses catalog → drags element card
2. Canvas highlights valid drop zones as the drag moves
3. Drop inserts element at the nearest valid position
4. Alternatively: click to insert (places at end of active section)
5. Inserted element gets default styles + inherits design tokens

## Section / Component Behavior
- **Sections** are full-width containers that divide the page vertically
- **Components** are reusable design blocks — editing the "master" updates all instances
- Component instances show on canvas like normal elements, but are linked

## Dragging Rules
- Elements can be repositioned by dragging
- Elements snap to guides (smart snap lines appear during drag)
- Drag handle appears on hover, not click
- Drag from sidebar to canvas = insert
- Drag within canvas = reposition
- Drag in Layers panel = reorder

## Drop Zones
- Between existing elements (horizontal/vertical indicator line)
- Into empty containers
- Between sections
- Canvas shows visual feedback (highlight + indicator) during drag

## Editing Controls
- **Click** → select (blue handles appear)
- **Double-click** → inline text edit
- **Right-click** → context menu
- **Drag handle** → move
- **Corner/edge handles** → resize
- **Context menu** → duplicate, delete, move up/down/front/back, lock, AI Request

## Inline Editing vs Side-Panel Editing
| Mode | What Changes |
|------|-------------|
| Inline (double-click text) | Text content only |
| Side panel (Inspector) | All visual properties |
| Context menu | Position, structure, AI |

## Responsive Modes
4 breakpoints: Mobile (375px) / Tablet (768px) / Desktop (1280px) / Wide (1440px)

Breakpoint logic:
- Base styles apply at all breakpoints
- Overrides at a specific breakpoint layer on top
- Changing breakpoint in editor changes which overrides are shown in Inspector
- Inspector currently shows no visual diff between base and overridden properties

## Toolbar Logic
- **Unified Selection Toolbar** — floats above selected element. Quick actions: duplicate, delete, AI.
- **Alignment Toolbar** — appears with multi-select. Align left/center/right/top/middle/bottom, distribute.
- **Canvas Footer Toolbar** — always visible. Toggle: Guides, Spacing, Grid, Badges, X-Ray. Zoom controls.
- **Quick Add Bar** — appears on empty sections. CTA to insert first element.

## Right-Panel Configuration Logic
Inspector tabs are contextual:
- No selection → empty state
- Text element selected → Typography section prominent
- Image element selected → Image source + alt text prominent
- Container selected → Flexbox section prominent
- Multi-select → only alignment options

## State Changes While Editing
- Every property change is immediately reflected on canvas (live preview)
- Undo stack records each change
- No explicit "Save" step — changes auto-accumulate in the draft state

## Save / Autosave / Draft Handling
**This is a major gap.** The product appears to have autosave behavior, but:
- No "Saving..." indicator anywhere in the UI
- No "Saved ✓" confirmation visible
- No "Last saved X minutes ago" timestamp
- No "You have unsaved changes" warning
- Users have no feedback on save state

## Preview / Edit / Publish Relationship
```
EDIT mode → Draft state (user is editing, not live)
  ↓
[Preview] button → Preview mode (fullscreen render, no editing)
  ↓
[Publish] button → Live state (site is deployed)
```
Problem: There is no visual difference between "editing a published site" and "editing an unpublished site." The canvas looks identical regardless of publish status. Users may not know if their changes are live.

---

# H. Product Object Model (Non-Technical)

## Workspace
The top-level container for a user's account. Contains multiple Projects. Not visible inside the editor — the editor opens within a Project context.

## Project / Site
A complete website. Contains multiple Pages, a Media Library, a Design System, and Site Settings. The unit that gets published to a domain.

## Page
One URL within a site (e.g. Home, About, Blog). Has its own canvas content, SEO settings, and social sharing settings. Pages can be Published or Draft.

## Section
A full-width horizontal band on a page. The primary structural unit. Users think in sections: "Hero section," "Features section," "Footer." Sections stack vertically to form the page.

## Block / Element
The basic visual units inside a section. Includes: Heading, Paragraph, Button, Image, Video, Divider, Form, Map, etc. Elements have styles, layout properties, and interactions.

## Component
A user-defined reusable design pattern (e.g. a Navbar, a Card pattern). Components have a "master" and "instances." Editing the master propagates changes to all instances. Components live in the Components Library.

## Template
A complete pre-built page design. Applying a template replaces the canvas with pre-designed sections and elements. Templates are read-only starting points — once applied, they become editable content.

## Asset / Media
Files uploaded to the project: images, videos, fonts, icons. Stored in the Media Library. Referenced by elements on the canvas (e.g. a background image, a logo). Assets belong to the project, not a specific page.

## Design Token
A named style value (e.g. "Primary Blue = #2563EB", "Body Font = Inter 16px"). Tokens are the design system layer — when a token is changed, all elements using that token update. Three token types: Color, Typography, Spacing.

## User / Team
A user account with editor access. Multiple users can be in a project simultaneously (collaboration). Roles: Owner, Editor (with likely more granularity handled outside the editor module). Team management not visible within the editor.

## Domain / Publish Entity
The live URL where the site is accessible. Can be the default subdomain ([slug].buildrik.com) or a custom domain (configured in Settings → Domains). Publishing deploys the current draft to this domain. The publish action is handled by an external host system — the editor only triggers the request.

---

# I. Feature Audit

## I.1 — Visual Canvas Editor

| Attribute | Value |
|-----------|-------|
| What it does | Renders the live page for editing; elements are click/drag/drop interactive |
| Who uses it | Every user, every session |
| Why it matters | It IS the product — everything else supports this |
| Where it lives | Center of the screen |
| Maturity | High — 20+ hooks, complex interaction model |
| Limitations | No save state indicator; duplicate device switcher |

## I.2 — Inspector (Right Panel)

| Attribute | Value |
|-----------|-------|
| What it does | Control all style/layout properties of selected element |
| Who uses it | Every user who wants to style anything |
| Why it matters | Primary design control surface |
| Where it lives | Right side, always visible |
| Maturity | High — 16+ sections, pseudo-states, breakpoint-aware |
| Limitations | No breakpoint diff indicator; no property search |

## I.3 — Add Elements Panel

| Attribute | Value |
|-----------|-------|
| What it does | Catalog of all elements users can add to their page |
| Who uses it | Early in creation; power users building new sections |
| Why it matters | Entry point for content creation |
| Where it lives | Sidebar — Add tab |
| Maturity | Medium-High — search, favorites, categories, components |
| Limitations | No element preview before adding; no empty state for My Components |

## I.4 — Template Library

| Attribute | Value |
|-----------|-------|
| What it does | Pre-built page layouts users can apply as starting points |
| Who uses it | New users (first run), users starting new pages |
| Why it matters | Reduces time-to-first-result dramatically |
| Where it lives | Sidebar — Templates tab (hidden, shortcut only) |
| Maturity | Medium — preview + apply flow complete, no error states |
| Limitations | No rail button (hidden); no error recovery |

## I.5 — Layers Panel

| Attribute | Value |
|-----------|-------|
| What it does | Tree view of all elements; visibility, lock, reorder |
| Who uses it | Users with complex pages; users who can't click tiny elements |
| Why it matters | Escape hatch when canvas interaction is difficult |
| Where it lives | Sidebar — Layers tab |
| Maturity | High — most complete panel in the product |
| Limitations | None significant observed |

## I.6 — Pages Management

| Attribute | Value |
|-----------|-------|
| What it does | Add/remove/configure pages; per-page SEO settings |
| Who uses it | Users building multi-page sites |
| Why it matters | Core to any real website |
| Where it lives | Sidebar — Pages tab |
| Maturity | Medium-High — list, settings drawer, SEO/Social/Advanced |
| Limitations | No thumbnails; no bulk operations |

## I.7 — Component Library

| Attribute | Value |
|-----------|-------|
| What it does | Save/reuse design patterns; master-instance propagation |
| Who uses it | Power users building consistent multi-page sites |
| Why it matters | Professional-grade feature; huge time saver |
| Where it lives | Sidebar — Components tab (hidden, shortcut only) |
| Maturity | Medium — create/use flow exists; detail editing |
| Limitations | No rail button (effectively hidden); no canvas indicator for instances |

## I.8 — Media Library

| Attribute | Value |
|-----------|-------|
| What it does | Upload and manage images, videos, fonts; basic image editing |
| Who uses it | All users who add any visual content |
| Why it matters | Essential for any real site |
| Where it lives | Sidebar — Media tab (has rail button) |
| Maturity | High — upload, crop, optimize, video preview, icon picker |
| Limitations | No upload progress in panel; no asset usage tracking |

## I.9 — Design System (Tokens)

| Attribute | Value |
|-----------|-------|
| What it does | Color, typography, spacing tokens with propagation to all elements |
| Who uses it | Design-conscious users; users managing brand consistency |
| Why it matters | The difference between a "site" and a "designed brand" |
| Where it lives | Sidebar — Design tab (has rail button) |
| Maturity | High — full CRUD, draft workflow, export, review modal |
| Limitations | No usage count per token; no undo within panel |

## I.10 — Settings (9 screens)

| Attribute | Value |
|-----------|-------|
| What it does | All site-level config: name, SEO, domains, analytics, integrations, billing |
| Who uses it | Owner/Admin, usually once per site |
| Why it matters | Makes the site findable, branded, and connected |
| Where it lives | Sidebar — Settings tab (has rail button) |
| Maturity | Medium — 9 screens exist, depth within each unknown |
| Limitations | No global unsaved changes indicator; SEO data not wired to publish checklist |

## I.11 — Publish Flow

| Attribute | Value |
|-----------|-------|
| What it does | Deploy the site to a live URL |
| Who uses it | Every user — the end goal of the entire product |
| Why it matters | THE most important action in the product |
| Where it lives | Sidebar — Publish tab (NO RAIL BUTTON) |
| Maturity | Low — checklist broken, callback-dependent, no rail button |
| Limitations | 3 hardcoded failures; no progress/error state; completely hidden |

## I.12 — History / Undo

| Attribute | Value |
|-----------|-------|
| What it does | Activity log + undo/redo |
| Who uses it | Users recovering from mistakes |
| Why it matters | Safety net — users will break things |
| Where it lives | Sidebar — History tab (no rail button) + topbar undo/redo buttons |
| Maturity | Low-Medium — log exists but no revert-to-version |
| Limitations | No rail button; can view diff but cannot restore to a point |

## I.13 — AI Assistant

| Attribute | Value |
|-----------|-------|
| What it does | AI-powered design suggestions, element generation, copy writing (implied) |
| Who uses it | Users who want speed or inspiration |
| Why it matters | Differentiator in competitive market |
| Where it lives | Persistent bottom bar + context menu → "AI Request" |
| Maturity | Unclear — bar exists but depth of features not verified |
| Limitations | Entry points are not prominent (bottom bar, right-click menu) |

## I.14 — Real-Time Collaboration

| Attribute | Value |
|-----------|-------|
| What it does | Multi-user editing with live cursors, conflict detection |
| Who uses it | Teams or agencies with multiple editors |
| Why it matters | Required for any professional team workflow |
| Where it lives | Canvas (cursors visible); ConflictModal for conflicts |
| Maturity | Infrastructure complete; UX depth of conflict resolution unclear |
| Limitations | No explicit role indicators during collaboration; no element locking UI |

## I.15 — Export

| Attribute | Value |
|-----------|-------|
| What it does | Download the site as HTML/CSS/ZIP |
| Who uses it | Developers who want to take code elsewhere; backup use case |
| Why it matters | Escape hatch; also used for client handoff |
| Where it lives | Settings → Export + ExportModal |
| Maturity | Medium — modal with options and code preview |
| Limitations | Depth of export output quality not verified |

## I.16 — Onboarding

| Attribute | Value |
|-----------|-------|
| What it does | Guide new users to first success: welcome, tour, checklist, achievements |
| Who uses it | New users in first session |
| Why it matters | Reduces drop-off; gets users to the "aha moment" faster |
| Where it lives | WelcomeModal, SpotlightOverlay, AchievementPrompt, OnboardingChecklist |
| Maturity | Medium — structure complete; effectiveness of content not verified |
| Limitations | If skipped, user is dropped on canvas with no recovery path back to tutorial |

---

# J. Interaction Model

## Click Behaviors

| Target | Result |
|--------|--------|
| Canvas element | Select (blue handles) |
| Canvas empty space | Deselect all |
| Canvas element (double-click) | Inline text edit |
| Canvas element (right-click) | Context menu |
| Rail icon | Open/close sidebar panel |
| Rail icon (active tab) | Toggle sidebar drawer |
| Layers row | Select element on canvas |
| Inspector property | Immediate live update on canvas |
| Page in Pages panel | Switch canvas to that page |
| History entry | Show diff (does not revert) |
| Template card | Open preview modal |
| Asset card | Open image editor |
| Settings card | Drill into detail screen |
| Topbar device | Switch breakpoint |

## Hover Behaviors

| Target | Result |
|--------|--------|
| Canvas element | Blue hover ring + drag handle appears |
| Canvas element | Corresponding Layers row highlights |
| Rail icon | CSS tooltip with label + keyboard shortcut |
| UnifiedSelectionToolbar button | Tooltip |

## Selection States
- **No selection:** Inspector shows empty state
- **Single selection:** Full inspector, blue handles on canvas, breadcrumb updates
- **Multi-select:** AlignmentToolbar appears, inspector simplifies, count badge shows

## Drag States
- **Drag from sidebar:** Canvas shows drop zones, snap guides appear
- **Drag on canvas:** Element ghost follows cursor, snap lines show alignment
- **Drag in Layers:** Reorder indicator between rows

## Loading States
- **App init:** No visible loader (blank screen gap)
- **Template apply:** Progress overlay blocks interaction
- **Page switch:** Not visibly indicated

## Empty States
- **Canvas empty:** CanvasEmptyCTA (Add / Template CTAs)
- **Layers empty:** "Add your first block" CTA
- **Search no results:** "No results" message (in Add panel)
- **Components empty:** Missing — panel just disappears

## Error States
- **Publish error:** Error message in Publish panel
- **Drop error:** Toast notification ("Cannot drop here")
- **Sync conflict:** ConflictModal
- **Template load fail:** Missing — no error state

## Confirmations
- **Element delete:** Confirmation modal (showDeleteConfirm)
- **Template apply:** Confirm drawer (TemplateUseDrawer) — warns it overwrites
- **Design tab leave with unsaved changes:** TabGuardModal
- **Site publish:** No confirmation (direct action)
- **Page delete:** Context menu confirm (implied)

## Destructive Action Warnings
| Action | Warning? |
|--------|---------|
| Delete element | ✅ Confirmation modal |
| Apply template (overwrites canvas) | ✅ Confirm drawer |
| Leave Design tab with unsaved tokens | ✅ TabGuardModal |
| Publish to live site | ❌ No warning |
| Delete page | Unclear |
| Clear all history | Unknown |

## Success Feedback
- **Element insert:** Toast "Inserted: [element name]" (2 sec)
- **Favorites first star:** Toast "Favorites saved in this browser only"
- **Undo/Redo:** Toast notification (via useHistoryFeedback)
- **Publish success:** Status badge changes to "Published"
- **Copy URL:** Visual feedback (copy button state)
- **Save:** ❌ No feedback — autosave is silent

## Locked / Disabled Conditions
- Undo button: disabled when stack is empty
- Redo button: disabled when nothing to redo
- Feature-gated settings: "Locked" screen with upsell

---

# K. UX Audit Layer

## Clarity
**Score: 6/10**
The canvas and inspector are clear. Navigation structure is unclear — many panels are invisible unless you know keyboard shortcuts. Terminology is mostly standard ("Pages," "Layers," "Publish") but "Design" tab name is vague (could mean page design OR design system).

## Hierarchy
**Score: 5/10**
The 4-zone layout (rail + sidebar + canvas + inspector) is logical. But within the UI, not all actions feel prioritized correctly. Publish — the end goal — has no visible button. AI, a secondary feature, has a persistent bottom bar.

## Discoverability
**Score: 4/10**
Critical gap. 4 of 10 sidebar panels are invisible unless you know keyboard shortcuts:
- Most important: **Publish** (a new user cannot find this)
- Power feature: **Components** (hidden from 80% of users)
- Utility: **Templates** (hidden; first-run is automatic, but return access is invisible)
- Safety: **History** (hidden)

## Consistency
**Score: 7/10**
Panel structure is consistent (header + content + footer pattern). Inspector tabs are consistent. Tooltip pattern is consistent. Inconsistencies: device switcher exists in two places; some panels have rail buttons, others don't; no consistent approach to "unsaved changes" across different panels.

## Learnability
**Score: 5/10**
The onboarding flow exists and covers the basics. But after onboarding, the product relies heavily on keyboard shortcuts for critical paths. New users who explore by clicking will get stuck before ever publishing.

## Cognitive Load
**Score: Medium-High**
The canvas + inspector combination is powerful but dense. The inspector has 3 tabs with 16+ sections. A user styling a simple button must navigate multiple sections. Positive: Inspector sections are collapsible and contextual.

## Friction Points
1. Publishing requires finding a hidden panel
2. Checklist on Publish always shows failures (broken data wiring)
3. No save indicator = constant anxiety about lost work
4. Device switcher in two places = confusion about which is authoritative
5. Pseudo-state styling easy to activate by accident
6. Inspector has no search — users scroll to find properties

## Trust and Safety Cues
**Weak.** Users cannot:
- Confirm their work is saved
- Know if they're editing a live or draft version
- Know which changes will affect the live site
- Recover to a specific past version

The product lacks the "save safety net" that breeds trust in tools like Notion, Figma, Google Docs.

## Workflow Efficiency
**For experienced users:** High — keyboard shortcuts, fast inspector, live preview, command palette.
**For new users:** Low — key actions hidden, no progressive disclosure, publish flow broken.

## Beginner vs Advanced User Experience
The product is optimized for **advanced users who know keyboard shortcuts**. It punishes beginners who explore by clicking. The core loop (design → publish) is incomplete for click-only users.

---

# L. Pain Points and Structural Risks

## L.1 — Publish Flow Is Broken and Hidden
The most important action in the product cannot be discovered by clicking. The checklist shows false failures. The button does nothing without external integration. This is a P0 product risk.

## L.2 — Navigation Asymmetry
6 panels have rail buttons. 4 do not. There is no pattern or logic to explain which panels get rail buttons and which don't. This creates an inconsistent navigation model that users cannot learn.

## L.3 — No Save Safety Net
Users have no indication of save state. This is not a minor UX issue — it is a trust destroyer. In a web builder, where work has real monetary value, silence on save state causes anxiety and complaints.

## L.4 — Device Switcher Duplication
The device switcher exists in the topbar and the canvas footer. Both appear functional. This creates confusion: "Which one is the real one? Did changing one change the other?" This is a classic "feature was moved but not removed" smell — suggests the product has been refactored mid-development.

## L.5 — SEO → Publish Disconnection
The user fills in SEO details in Settings → SEO. The Publish panel has a checklist that checks for SEO completion. These two systems are not connected. The checklist always fails. This means a core product promise ("publish a well-optimized site") is broken.

## L.6 — CMS Has No Product UI
The underlying engine supports a CMS (collections, entries). No UI is exposed to the user. This means a major capability is invisible. If/when it's added, it will need to be integrated into navigation — which is already at capacity (10 tabs, 6 rail buttons).

## L.7 — Inspector Has No Breakpoint Awareness
When editing at mobile breakpoint, the inspector looks identical to desktop. There is no indicator of "you are now editing mobile-specific styles" and no diff visualization showing which properties are overridden. Users can make changes thinking they're editing the base and only realize later they've broken their desktop layout.

## L.8 — History Cannot Actually Restore
The History panel is named "History" and shows past actions. But clicking an entry only shows a diff — it does not restore the canvas to that state. Users who expect "click to undo to here" will be confused and frustrated.

## L.9 — Topbar API Has Dead Props
The topbar's interface includes 5 deprecated props that formerly controlled features now moved elsewhere. This is a code smell but also a product signal: the topbar has been restructured multiple times, and the current version may not reflect the final intended structure.

## L.10 — Adding More Features Will Make Navigation Worse
The rail currently has 6 icons. 4 more tabs are already hidden. If CMS, E-commerce, Animations, or other features get added as tabs, the navigation will either break or become even more invisible. The navigation model must be redesigned before the product expands.

---

# M. Extension Readiness

## Stable Areas (Safe to Extend)

| Area | Why Stable |
|------|-----------|
| Canvas editing | Deeply built, hook-based, well-structured |
| Inspector | Modular sections — easy to add new section |
| Layers panel | Complete feature set |
| Media library | Complete with editing tools |
| Design tokens | Full CRUD + draft workflow |
| Settings screens | Card-drill-in pattern is extensible |
| Onboarding | Hook-based orchestration — easy to add steps |
| Export | Modal-based, isolated |

## Unstable Areas (Fix Before Extending)

| Area | Why Unstable |
|------|-------------|
| Publish flow | Broken data wiring + no rail button + host-callback dependency |
| Navigation model | 4 tabs already hidden — at capacity |
| Save state feedback | No infrastructure for save indicators |
| Breakpoint editing UX | No diff visualization — extending responsive features risks confusion |
| SEO data flow | Disconnected from publish checklist |
| History | Cannot revert — extending features here misleads users |

## Where New Features Can Plug In Safely

1. **New Inspector section** → Add to Effects tab, follows existing collapsible section pattern
2. **New Settings screen** → Add a card to the settings list, create a screen file
3. **New element type** → Add to element catalog in Add panel
4. **New design token type** → Add a new list to Design System tab
5. **New template** → Add to template grid, follows existing card + preview pattern
6. **New overlay/modal** → Add to modal system in shell

## Where Redesign Is Required First

1. **Rail navigation** → Must be redesigned to accommodate 10 tabs visibly before adding more
2. **Publish flow** → Requires fixing data wiring + adding rail button before enhancing
3. **Save state** → Requires a universal save indicator system before adding more auto-save features
4. **Breakpoint inspector** → Needs diff visualization before adding more responsive features
5. **CMS** → Requires a navigation slot before the UI can be added

## What Must Be Standardized Before Scale

1. **Unsaved changes pattern** — Three panels handle this differently (Design tab has TabGuardModal, Settings has none, Publish has none). One standard pattern needed.
2. **Empty states** — Inconsistent across panels. Components panel has none.
3. **Error states** — Template load errors missing. Publish errors incomplete.
4. **Rail button allocation rules** — What gets a rail button and what doesn't needs a policy.
5. **Toast notification system** — Exists but coverage is inconsistent. When does a toast fire vs silent success?

---

# N. Prioritized Recommendations

## Critical (Fix Before Any New Feature)

| # | Issue | Impact |
|---|-------|--------|
| N-C1 | Add Publish tab to rail navigation | Users cannot find the most important action |
| N-C2 | Fix publish checklist data wiring | 3 items permanently broken — users can't trust it |
| N-C3 | Add autosave indicator (Saving / Saved / Unsaved changes) | No save state = no trust |
| N-C4 | Add "You have unpublished changes" banner | Users don't know if their live site is current |
| N-C5 | Fix publish button to work without host callbacks (or show clear error) | Silent failure is unacceptable |

## High Priority

| # | Issue | Impact |
|---|-------|--------|
| N-H1 | Redesign rail navigation to show all 10 tabs | 4 features are invisible |
| N-H2 | Add breakpoint indicator in inspector | Users break responsive layouts accidentally |
| N-H3 | Add "you are editing :hover" prominent indicator | Pseudo-state edits made by accident |
| N-H4 | Remove device switcher from one location (keep topbar only) | Duplicate control creates confusion |
| N-H5 | Connect SEO settings data to publish checklist | Core product promise is broken |
| N-H6 | Add "Revert to this version" in History panel | Current history panel is misleading |

## Medium Priority

| # | Issue | Impact |
|---|-------|--------|
| N-M1 | Add empty state to Components panel | Confusing when no components exist |
| N-M2 | Add upload progress to Media panel | Users don't know if upload is complete |
| N-M3 | Add token usage count to Design System | Users afraid to edit tokens |
| N-M4 | Add global unsaved changes indicator to Settings | Users lose settings changes |
| N-M5 | Add template error state | Silent failure is confusing |
| N-M6 | Add "applied successfully" confirmation after template apply | No feedback after major action |
| N-M7 | Add component instance indicator on canvas | Users don't know which elements are components |
| N-M8 | Inspector property search | Users scroll to find properties in long panel |
| N-M9 | Add page thumbnail to Pages panel | Text-only list is hard to navigate |

## Low Priority

| # | Issue | Impact |
|---|-------|--------|
| N-L1 | Remove deprecated props from Topbar API | Developer DX / maintenance |
| N-L2 | Asset usage count per media item | Nice to have |
| N-L3 | Named version snapshots in History | Power user feature |
| N-L4 | Bulk operations in Pages panel | Power user QoL |
| N-L5 | Undo within Design System panel | Inconsistent with global undo |

---

# O. Missing Information

The following could not be confidently verified and should be confirmed before planning:

| # | Unknown | Why It Matters |
|---|---------|---------------|
| O-1 | AI Assistant actual feature scope | Is it copy, design, code, all three? Entry points are weak — depth unclear |
| O-2 | CMS UI status | Is it planned, in development, or abandoned? A CMS without UI is a liability |
| O-3 | E-commerce feature status | Engine has structure — is it roadmap or removed? |
| O-4 | Template library content | How many templates exist? Are they maintained? |
| O-5 | Collaboration role permissions | What can Editors do vs Owners inside the editor? |
| O-6 | Publish infrastructure | What does `onPublish` actually call? Custom backend, Netlify, Vercel, internal? |
| O-7 | Auto-save implementation | Does autosave actually work? Is there a save interval? What triggers a save? |
| O-8 | Domain connection flow | Does custom domain setup actually work end-to-end? |
| O-9 | Analytics integration depth | Does Google Analytics actually connect, or is it a settings field with no wiring? |
| O-10 | Export output quality | Is the exported HTML usable, or is it Emotion-compiled CSS that breaks outside the app? |
| O-11 | "Locked" features list | What specific features are behind the paywall? Needed for monetization clarity |
| O-12 | Mobile publishing behavior | Can users build and publish a mobile-first site, or is desktop the base? |
| O-13 | Team invitation flow | How do collaborators get added? Is invite UI external to the editor? |
| O-14 | History retention limit | How many history entries are kept? Is there a cap? |
| O-15 | Canvas max page size | Is there a performance limit on page complexity? |

---

# P. Executive Blueprint Summary

## What Buildrik Is Today

Buildrik (Aquibra Studio) is a **mid-maturity visual web builder** with a strong technical foundation but a product presentation layer that is incomplete in several critical areas.

The core editing experience — canvas, inspector, design tokens, media, layers — is well-built and functionally deep. The underlying engine is sophisticated, with 28+ managers handling elements, styles, history, collaboration, CMS, and more.

However, the **product as experienced by a new user is broken at the most critical moment**: getting something published.

---

## The Core Problem in One Sentence

> The product is optimized for developers who know keyboard shortcuts — but sold to non-technical solopreneurs who navigate by clicking.

---

## The 3 Things That Must Happen Before Expansion

### 1. Fix the Publish Flow (P0)
The publish flow is the end goal of the entire product. It is hidden (no rail button), has broken data wiring (3 checklist items always fail), and silently fails without external integration. Before any new feature is added, every user must be able to find and successfully use the Publish feature by clicking alone.

### 2. Fix Navigation (P0)
4 of 10 panels are invisible. Templates, Components, Publish, and History require keyboard shortcuts that most target users don't know. The rail navigation model must be redesigned to make all major panels visible. At current capacity (10 panels), a redesign is required before adding anything new.

### 3. Add Save State Feedback (P1)
The product has no autosave indicator. Users have no idea if their work is saved. In a web builder where users invest hours of creative work, this is a fundamental trust gap. A "Saving... / Saved / Unsaved changes" indicator must be implemented before users can confidently use the product for real projects.

---

## What's Actually Strong

- The canvas interaction model is mature and responsive
- The inspector is contextual, deep, and well-organized
- The design token system is production-grade (draft workflow, review modal, export)
- The media library includes editing tools (crop, optimize) — above market standard for this tier
- The layers panel is exceptionally complete (12 features)
- The engine architecture supports features (CMS, e-commerce, animation) not yet in UI
- Real-time collaboration infrastructure is in place

---

## Product Architecture Verdict

The product has **strong depth, weak surface**. The features that exist are good. But the shell that presents them to users — navigation, discoverability, save state, publish confidence — is incomplete. A user's first 10 minutes will likely end in confusion before they discover the product's actual quality.

Fix the surface first. The depth can wait.

---

*End of Product Blueprint — Buildrik / Aquibra Studio — 2026-03-29*
