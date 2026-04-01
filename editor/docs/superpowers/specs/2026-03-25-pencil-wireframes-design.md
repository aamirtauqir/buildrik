# Buildrik Wireframes in Pencil.dev — Design Spec

**Date:** 2026-03-25
**Status:** Approved by user
**Purpose:** Plan for creating lo-fi wireframes of all 18 Buildrik screens in pencil.dev

---

## Overview

Create a single `buildrik-wireframes.pen` file containing lo-fi wireframes of all 18 Buildrik (Aquibra Studio) screens. The wireframes communicate layout structure, information hierarchy, and spatial relationships between UI zones — not visual polish. They serve as the reference for developers building the React implementation.

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | All 18 screens | Complete product coverage for developer reference |
| Fidelity | Lo-fi wireframes | Boxes and placeholders — fast, focuses on structure |
| File organization | Single master `.pen` file | One file, 18 frames — see everything at once |
| Execution approach | Shell-first | Draw the outer shell once, swap sidebar/canvas content per screen |

---

## File

**Filename:** `buildrik-wireframes.pen`
**Location:** Project root (opened in pencil.dev)

---

## Canvas Grid Layout

18 frames arranged in a 6-column × 3-row grid on the pencil.dev canvas.

- **Frame size:** 1440 × 900px each
- **Gap between frames:** 80px
- **Total canvas area:** ~9440 × 2860px

### Grid Map

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 |
|-------|-------|-------|-------|-------|-------|
| 01 Base Shell | 02 Canvas | 03 Inspector | 04 Add/Build Tab | 05 Layers | 06 Pages |
| 07 Components | 08 Design System | 09 Collaboration | 10 Export Modal | 11 Templates | 12 Media |
| 13 Settings | 14 Publish | 15 History | 16 Onboarding | 17 AI Assistant | 18 CMS + Animation |

**Priority labels on each frame:**
- P0 (frames 01–10) — core editing, design first
- P1 (frames 11–17) — supporting screens
- P1/P2 (frame 18) — advanced features

---

## Authoritative Dimensions

These values come from the implementation plan (`docs/superpowers/plans/2026-03-22-editor-redesign-v2.md`, Task 0B). Use these everywhere in the wireframes — do not use older values from the original design documentation.

| Zone | Width / Height | Notes |
|------|---------------|-------|
| Top Bar | **44px** height | Reduced from 52px in redesign |
| Rail | **44px** width | Reduced from 56px in redesign |
| Sidebar | **260px** width (default) | Reduced from 280px; drag-resizable 260–360px |
| Inspector | **280px** width | Unchanged; drag-resizable 280–400px |
| Canvas | Flexible — fills remaining width | Min 400px usable |
| Canvas Footer | Unconfirmed height — annotate as `~40px` with TBC label | Fixed at bottom of canvas zone only |

---

## Rail Icon Configuration

8 icons total (reduced from 10 in redesign — `docs/superpowers/specs/2026-03-21-editor-redesign/01-shell-navigation.md`).

**Top group (Creation tools):**
1. Add / Build — shortcut: `A`
2. Media — shortcut: `J`
3. Layers — shortcut: `Z`
4. Templates — shortcut: `T`
5. Pages — shortcut: `P`

*Visual separator (1px border)*

**Bottom group (System tools):**
6. Design System — shortcut: `D`
7. Settings — shortcut: `S`
8. History — shortcut: `H`

**Removed from rail:** Publish (now a top bar primary button), Components (now a section inside the Build/Add tab).

**No CMS icon in rail.** CMS & Data Binding is accessed through the Inspector panel, not a dedicated rail tab.

---

## Execution Approach: Shell-First

### Step 1 — Frame 01: Base Shell

Draw the annotated master layout first. All subsequent frames copy this shell and modify only the sidebar content and canvas state.

**Frame 01 layout:**

```
+------------------------------------------------------------------+
|  TOP BAR (44px)                                                  |
|  [Logo + Project Name] [● Save] [⟲][⟳] | [Device▾] | [▶ Preview] [Publish] [Avatars] |
+-------+----------+------------------------------+-----------------+
| RAIL  | SIDEBAR  |         CANVAS               |   INSPECTOR     |
| 44px  | 260px    |       (flexible)              |    280px        |
|       |          |                               |                 |
|[Add]  | Content  |   ┌────────────────────┐      | [Element name]  |
|[Media]| changes  |   │   Page Viewport    │      | [Breadcrumb]    |
|[Layers| per      |   │                   │      | [Layout][App.][Eff.] |
|[Templ]| screen   |   └────────────────────┘      | [Sections...]   |
|[Pages]|          |   [Canvas Footer ~40px TBC]   |                 |
|  ─── |          |                               |                 |
|[Desig]|          |                               |                 |
|[Sett.]|          |                               |                 |
|[Hist.]|          |                               |                 |
+-------+----------+------------------------------+-----------------+
```

**Annotations on Frame 01 (dimension labels drawn on the frame):**
- Rail: `44px` label + arrow
- Sidebar: `260px` label + arrow (note: drag-resizable 260–360px)
- Inspector: `280px` label + arrow (note: drag-resizable 280–400px)
- Top Bar: `44px` height label
- Canvas: `flexible — fills remaining width` label
- Footer: `~40px TBC` label

**Top Bar controls (7 total, per redesign spec):**
- Logo + project name (clickable → project settings)
- Save dot + status text
- Undo / Redo
- Device switcher pill
- Preview button (ghost)
- Publish button (primary)
- Collaboration avatars

**Note:** AI button, export, overflow menu actions are NOT in the top bar — they are in the Command Palette (Ctrl+K).

---

### Step 2 — Frames 02–10: P0 Core Screens

Each frame = Frame 01 shell + specific sidebar content + specific canvas state.

#### Frame 02 — Canvas

- **Rail:** Add tab icon active (highlighted)
- **Sidebar:** Add/Build panel — sections grid visible
- **Canvas:** Page with 2–3 stacked section blocks. Middle section has:
  - Selection bounding box (dashed rectangle)
  - 8 resize handles (corner + edge dots)
  - Breadcrumb overlay top: `Page › Hero Section`
  - Smart guide lines (horizontal + vertical)
  - Spacing label pill: `16px`
  - Quick actions toolbar floating above selection: `[Copy][Paste][Duplicate][Delete][Lock]`
- **Inspector:** Populated — Layout tab open, basic sections visible

#### Frame 03 — Inspector

- **Rail:** Layers tab icon active
- **Sidebar:** Layers panel — tree expanded: `Page › Section › Container › H1`
- **Canvas:** Same as Frame 02 (element selected)
- **Inspector (focus of this frame):** Fully detailed
  - Element name: `Hero Heading`
  - Breadcrumb: `Section › Container › H1`
  - 3 tabs: `[Layout]` active, `[Appearance]`, `[Effects]`
  - **Layout tab sections:**
    - `▼ Display & Position` — Display: Block▾, Position: Relative▾, Z-index: auto, Overflow: Visible▾
    - `▼ Size` — W: [auto][px▾], H: [auto][px▾], + More settings toggle
    - `▼ Spacing` — visual box model diagram (margin outer, padding inner, 4 edge inputs each)
    - `▸ Flexbox` — collapsed
    - `▼ Responsive Constraints` — Flex Grow: [0], Shrink: [1], Behavior: [Scale▾]
  - Pseudo-state selector: `[Normal][Hover][Focus][Active]`
  - Breakpoint indicator: `[🖥 Desktop▾]`
  - Delete button: `[🗑 Delete Element]` bottom

#### Frame 04 — Add / Build Tab

- **Rail:** Add tab icon active
- **Sidebar (focus):**
  - Search bar top: `[🔍 Search sections...]`
  - Sub-tabs: `[Sections]` active | `[Elements]` | `[Favorites]`
  - Sections grid (2 columns): Hero, Navigation, Features, Pricing, Testimonials, CTA, Footer, Gallery, Blog, Contact — each as a tile with icon + label
  - Note: Components section is also accessible from here (merged per redesign — no separate Components rail tab)
  - Favorites row: 3 starred tiles
- **Canvas:** Blank page, drop zone highlighted with dashed border
- **Inspector:** Empty state — `Select an element to inspect`

#### Frame 05 — Layers Tab

- **Rail:** Layers tab icon active
- **Sidebar (focus):**
  - Panel header: `Layers`
  - Tree structure:
    ```
    ▼ Page: Home
      ▼ Navigation (Section)        [👁][🔒]
      ▼ Hero (Section) ← selected  [👁][🔒]
        ▼ Container
            H1: Heading text
            P: Paragraph text
            Button: Get Started
      ▸ Features (Section)          [👁][🔒]
      ▸ Footer (Section)            [👁][🔒]
    ```
  - Selected item highlighted with subtle background
  - Drag handle dots on left of each row
- **Canvas:** Corresponding Hero section highlighted by selection box
- **Inspector:** Populated — Layout tab, hero section properties

#### Frame 06 — Pages Tab

- **Rail:** Pages tab icon active
- **Sidebar (focus):**
  - Panel header: `Pages`
  - `[+ Add Page]` button top right
  - Page list (each row: thumbnail preview + page name + status dot):
    - `Home` — active
    - `About`
    - `Services`
    - `Blog`
    - `Contact`
  - Right-click context hint label: `Right-click to rename, duplicate, delete`
- **Canvas:** Home page content
- **Inspector:** Empty state — `Select an element to inspect`

#### Frame 07 — Components Tab

- **Rail:** Add tab icon active (Components is inside the Add/Build tab, NOT a separate rail icon)
- **Sidebar:** Add/Build panel with `[Components]` sub-section visible:
  - Section header: `My Components`
  - Component cards: thumbnail + name + `Used in 3 pages` badge
    - `Navbar`, `Hero Banner`, `Footer`
  - Section: `Shared with Team`
    - `Button Library`, `Card Grid`
  - `[+ Create Component]` button
- **Canvas:** One component instance selected, component badge on selection box: `⬡ Navbar`
- **Inspector:** Populated — component properties

#### Frame 08 — Design System Tab

- **Rail:** Design System tab icon active
- **Sidebar (focus):**
  - Panel header: `Design System`
  - Section: `Colors` — token swatches grid:
    - Primary, Secondary, Success, Warning, Error
  - Section: `Typography` — type scale rows: Heading XL, Heading LG, Body, Caption
  - Section: `Spacing` — scale strip: 4, 8, 12, 16, 24, 32px
  - `[+ Add Token]` button per section
- **Canvas:** Idle, no selection
- **Inspector:** Empty state — `No element selected. Select an element to edit its properties.`

#### Frame 09 — Collaboration

- **Rail:** Any tab (e.g., Layers) — no dedicated Collaboration tab exists
- **Sidebar:** Layers panel (or whichever tab is active)
- **Canvas (focus — collaboration shows here and in top bar, not in a dedicated panel):**
  - 2 remote cursors visible:
    - `👆 Sarah` (colored arrow + name label)
    - `👆 Tom` (different color arrow + name label)
  - Hero section has soft lock badge: `🔒 Tom editing`
  - Lock overlay: subtle tinted border on locked section
- **Top bar addition (annotated):** 3 collaborator avatar circles next to Publish button
- **Inspector:** Populated for the locally selected element

#### Frame 10 — Export Modal

- **Rail:** Visible
- **Sidebar:** Visible at default width (not collapsed — modal overlays the editor, canvas dims behind it)
- **Canvas:** Dimmed by semi-transparent modal overlay
- **Modal overlay (center, ~640×480px):**
  - Title: `Export Project`
  - Format selector tabs: `[HTML]` `[React]` `[Vue]` `[Next.js]`
  - Code Quality Score: progress bar 0–100, score: `84/100`, label: `Passes senior dev review`
  - Page selector: checkboxes for Home, About, Services, Blog, Contact — all checked
  - Options: `[☐ Include assets]` `[☐ Minify output]`
  - Actions: `[Cancel]` `[Download ZIP]`

---

### Step 3 — Frames 11–17: P1 Screens

All frames: inspector shows `Empty state — Select an element to inspect` unless noted otherwise.

#### Frame 11 — Templates Tab

- **Rail:** Templates tab icon active
- **Sidebar:** Templates panel
  - Search bar top
  - Category filter pills: `All`, `Business`, `Portfolio`, `Blog`, `Landing`, `E-commerce`
  - Template cards (1 column, full width):
    - 16:10 thumbnail placeholder
    - Template name
    - Category badge
    - `[Use Template]` button
  - 4–5 cards visible (scroll implied)
- **Canvas:** Idle
- **Inspector:** Empty state

#### Frame 12 — Media Tab

- **Rail:** Media tab icon active
- **Sidebar:** Media panel
  - 2-tabs: `[My Library]` active | `[Discovery]`
  - Search bar
  - Upload drop zone: `[↑ Drop files here or click to upload]` — top of list
  - Asset grid (3 columns):
    - Square thumbnails
    - Filename below (truncated)
    - Hover state shown on one: overlay with `[Edit][Delete][Insert]` icons
  - Selected asset: highlighted border
- **Canvas:** Image element selected on canvas
- **Inspector:** Populated — image element properties (src, alt text, object-fit)

#### Frame 13 — Settings Tab

- **Rail:** Settings tab icon active
- **Sidebar:** Settings panel
  - Panel header: `Settings`
  - 2-column card grid (each ~120×100px):
    - `⚙ SEO`
    - `📊 Analytics`
    - `🔤 Fonts`
    - `🔗 Integrations`
    - `🌐 Domain`
    - `</> Custom Code`
  - Each card: icon (24px) centered + label below — clicking drills into that setting
- **Canvas:** Idle
- **Inspector:** Empty state

#### Frame 14 — Publish Tab

- **Rail:** No dedicated Publish rail icon. This tab opens via the `[Publish]` top bar button.
  - Annotate with note: `Publish opens via top bar button, not rail icon`
- **Sidebar:** Publish panel
  - Status badge: `● Published` (green) or `● Unpublished changes` (amber)
  - Domain section: `mysite.buildrik.io` + `[Connect custom domain]` link
  - SEO score: horizontal bar, score 72/100, `Needs improvement` label
  - Last published: `2 hours ago`
  - `[▶ Publish Now]` — primary button, full width
  - `[Preview in browser ↗]` — ghost button
- **Canvas:** Idle
- **Inspector:** Empty state

#### Frame 15 — History Tab

- **Rail:** History tab icon active
- **Sidebar:** History panel
  - 2-tabs: `[Versions]` active | `[Activity]`
  - Timeline list (each row):
    - Timestamp: `Today 14:32`
    - Action: `Added Hero section`
    - Author avatar + initials
    - `[Restore]` button (shown on hover of one row)
  - Current version marked: `● Now` badge
- **Canvas:** Showing version snapshot state (slightly different content)
- **Inspector:** Empty state

#### Frame 16 — Onboarding

- **Shell:** Full screen — rail, sidebar, inspector hidden behind spotlight overlay
- **Canvas background:** Dimmed by spotlight overlay mask
- **Spotlight:** Cutout circle highlighting the Rail
- **Tooltip (pointing to Rail):**
  - Step indicator: `Step 2 of 4`
  - Title: `Add elements from the Rail`
  - Description: `Click any icon to open that panel`
  - Actions: `[Skip]` `[Next →]`
- **Progress dots:** 4 dots bottom center, dot 2 active

#### Frame 17 — AI Assistant

- **Rail:** No dedicated AI rail icon (AI moved to Command Palette per redesign). Annotate: `AI accessed via Ctrl+K or canvas footer sparkle icon`
- **Sidebar:** AI panel triggered from canvas footer:
  - Panel header: `AI Assistant`
  - Chat area (upper 60%): previous exchange visible
    - User bubble: `Add a testimonials section`
    - AI response card: `Testimonials Section` + confidence badge `High` + `[Apply]` `[Dismiss]`
  - Suggestion cards:
    - `Improve contrast` — Medium confidence
    - `Add alt text to 3 images` — High confidence
  - Chat input (bottom): `[Ask AI anything...]` + `[Send]`
- **Canvas:** AI-generated section highlighted with dashed blue outline + `AI Generated` badge
- **Inspector:** Populated — AI-generated section properties

---

### Step 4 — Frame 18: CMS + Animation (Combined)

- **Rail:** No dedicated CMS rail tab (CMS binding accessed through Inspector). Annotate: `CMS accessed via Inspector chain → Data Binding`
- **Sidebar:** Layers panel (showing element tree)
- **Inspector (focus — split into 2 areas):**
  - **Top area — CMS Binding:**
    - Header: `Data Binding`
    - Collection selector: `[Blog Posts ▾]`
    - Field mapping list:
      - `Title → H1 text`
      - `Image → Hero image`
      - `Date → Subtitle`
    - `[+ Add field binding]` button
  - **Bottom area — Animation:**
    - Header: `Animation`
    - Timeline strip: element rows + keyframe dots
    - Playback: `[◀][▶][▶▶]` + `[0:00]` scrubber
- **Canvas:** Text element selected with:
  - CMS badge: `⊞ Blog Posts: Title`
  - Animation scrubber overlay at bottom of canvas

---

## Annotation Standards

All frames share consistent annotation labels:

| Annotation type | Format |
|----------------|--------|
| Dimension | Red measurement line + `44px` label |
| Token name | Gray italic label: `--aqb-chrome-bg` |
| Component name | Bracket label: `[Rail]`, `[Sidebar]`, `[Inspector]` |
| State label | Pill badge: `SELECTED`, `HOVER`, `EMPTY STATE` |
| Priority | Top-right corner badge: `P0`, `P1`, `P2` |
| Unconfirmed value | Orange label: `~40px TBC` |

---

## Execution Order

1. **Frame 01** — Base Shell (foundation — all others copy from this)
2. **Frames 02–10** — P0 screens (core editing, highest priority)
3. **Frames 11–17** — P1 screens (supporting features)
4. **Frame 18** — P1/P2 combined (CMS + Animation)

---

## What the Wireframes Are NOT

- Not pixel-perfect — exact pixel values don't matter at lo-fi stage
- Not colored — no design token colors applied, grayscale boxes only
- Not interactive — static frames, no prototyping links needed
- Not exhaustive of all states — one representative state per screen

---

## Source Documentation

All wireframe content derived from:
- `docs/superpowers/specs/2026-03-21-editor-redesign/01-shell-navigation.md` — shell layout, rail icons, top bar controls
- `docs/superpowers/specs/2026-03-21-editor-redesign/02-canvas-interactions.md` — canvas states, overlays
- `docs/superpowers/specs/2026-03-21-editor-redesign/03-inspector-properties.md` — inspector tabs and sections
- `docs/superpowers/specs/2026-03-21-editor-redesign/04-cms-data-binding.md` — CMS binding panel
- `docs/superpowers/specs/2026-03-21-editor-redesign/05-ai-surfaces.md` — AI assistant panel
- `docs/superpowers/specs/2026-03-21-editor-redesign/06-collaboration.md` — collaboration presence
- `docs/superpowers/specs/2026-03-21-editor-redesign/07-export-publish.md` — export modal, publish panel
- `docs/superpowers/plans/2026-03-22-editor-redesign-v2.md` — authoritative dimensions (Task 0B, line 132)
