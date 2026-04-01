# Buildrik Wireframes — Pencil.dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single `buildrik-wireframes.pen` file containing lo-fi wireframes of all 18 Buildrik screens arranged in a 6×3 grid on the pencil.dev canvas.

**Architecture:** Shell-first — draw Frame 01 (base shell with all dimension annotations) once, then copy it for each of the 17 remaining screens and modify only the sidebar content, canvas state, and inspector. All frames are 1440×900px with 80px gaps.

**Tech Stack:** pencil.dev MCP tools (`mcp__pencil__*`) — batch_design for drawing, get_screenshot for validation, snapshot_layout for structure checks.

---

## Key Dimensions (from redesign spec)

| Zone | Size |
|------|------|
| Top Bar | 44px height |
| Rail | 44px width |
| Sidebar | 260px width |
| Canvas | Flexible (fills remaining ~856px) |
| Inspector | 280px width |
| Frame size | 1440 × 900px |
| Frame gap | 80px |

## Rail Icons (8 total)
Top: Add (A), Media (J), Layers (Z), Templates (T), Pages (P)
Bottom: Design (D), Settings (S), History (H)

## Frame Coordinate Reference Table

Formula: `x = (col - 1) × 1520`, `y = (row - 1) × 980`

| Frame | Screen | Col | Row | x | y |
|-------|--------|-----|-----|---|---|
| 01 | Base Shell | 1 | 1 | 0 | 0 |
| 02 | Canvas | 2 | 1 | 1520 | 0 |
| 03 | Inspector | 3 | 1 | 3040 | 0 |
| 04 | Add/Build Tab | 4 | 1 | 4560 | 0 |
| 05 | Layers | 5 | 1 | 6080 | 0 |
| 06 | Pages | 6 | 1 | 7600 | 0 |
| 07 | Components | 1 | 2 | 0 | 980 |
| 08 | Design System | 2 | 2 | 1520 | 980 |
| 09 | Collaboration | 3 | 2 | 3040 | 980 |
| 10 | Export Modal | 4 | 2 | 4560 | 980 |
| 11 | Templates | 5 | 2 | 6080 | 980 |
| 12 | Media | 6 | 2 | 7600 | 980 |
| 13 | Settings | 1 | 3 | 0 | 1960 |
| 14 | Publish | 2 | 3 | 1520 | 1960 |
| 15 | History | 3 | 3 | 3040 | 1960 |
| 16 | Onboarding | 4 | 3 | 4560 | 1960 |
| 17 | AI Assistant | 5 | 3 | 6080 | 1960 |
| 18 | CMS + Animation | 6 | 3 | 7600 | 1960 |

## Copy-Source Rule

- **Copy Frame 01** (blank shell) when the canvas should be idle/empty — use for sidebar-focused screens (04–08, 10–18)
- **Copy Frame 02** (active canvas with selected element + populated sidebar) when the canvas needs a pre-populated editing state — use for screens where canvas interaction is the focus (03, 09)

## Annotation Note

Pencil.dev wireframes are lo-fi grayscale. Color references in the spec (red arrows, orange labels) are aspirational — apply all annotations as plain text labels or dashed annotation boxes in grayscale. Do not attempt to apply colors.

---

## Task 0: Setup — Open Document & Get Guidelines

**Files:**
- Create: `buildrik-wireframes.pen` (in project root via pencil.dev)

- [ ] **Step 1:** Call `mcp__pencil__get_editor_state` to check if a .pen file is already open
- [ ] **Step 2:** If no file open, call `mcp__pencil__open_document` with `filePathOrNew: "new"` to create a fresh .pen file. Save the file as `buildrik-wireframes.pen`.
- [ ] **Step 3:** Call `mcp__pencil__get_guidelines` with `topic: "web-app"` to understand pencil.dev's wireframe conventions
- [ ] **Step 4:** Call `mcp__pencil__get_style_guide_tags` then `mcp__pencil__get_style_guide` to get a suitable lo-fi wireframe style
- [ ] **Step 5:** Call `mcp__pencil__get_screenshot` to confirm the blank canvas is open

---

## Task 1: Frame 01 — Base Shell

Draw the annotated master layout. Every subsequent frame is copied from this one.

**Frame position:** Column 1, Row 1 — top-left of the canvas grid

- [ ] **Step 1:** Call `mcp__pencil__find_empty_space_on_canvas` to find the starting position
- [ ] **Step 2:** Call `mcp__pencil__batch_design` to create the Frame 01 container (1440×900px frame/artboard) labeled "01 — Base Shell [P0]"
- [ ] **Step 3:** Inside the frame, draw the Top Bar zone:
  - Rectangle: full width (1440px) × 44px, labeled `TOP BAR — 44px`
  - Inside: 7 control placeholders — `[Logo + Project Name]`, `[● Save]`, `[⟲][⟳]`, `[Device▾]`, `[▶ Preview]`, `[Publish]`, `[Avatars]`
- [ ] **Step 4:** Draw the Rail zone:
  - Rectangle: 44px wide × remaining height (856px), left-aligned, labeled `RAIL — 44px`
  - Inside: 8 icon boxes (top 5: Add, Media, Layers, Templates, Pages; separator line; bottom 3: Design, Settings, History)
- [ ] **Step 5:** Draw the Sidebar zone:
  - Rectangle: 260px wide × 856px, labeled `SIDEBAR — 260px`
  - Annotation: `Content changes per screen`
  - Annotation: `Drag-resizable: 260–360px`
- [ ] **Step 6:** Draw the Canvas zone:
  - Rectangle: remaining width (~856px) × 856px, labeled `CANVAS — flexible`
  - Inside: centered page viewport box (roughly 70% of canvas area), labeled `Page Viewport`
  - Footer bar at bottom: ~40px, labeled `Canvas Footer ~40px TBC` — contains `[Grid][Guides][Spacing][X-ray][Rulers]` on left, `[Zoom% ][+][-]` on right, sparkle AI icon center
- [ ] **Step 7:** Draw the Inspector zone:
  - Rectangle: 280px wide × 856px, right-aligned, labeled `INSPECTOR — 280px`
  - Inside: `[Element Name]`, `[Breadcrumb]`, `[Layout][Appearance][Effects]` tabs, collapsible section placeholders
  - Annotation: `Drag-resizable: 280–400px`
- [ ] **Step 8:** Add dimension annotation arrows/labels on the outside edges of each zone
- [ ] **Step 9:** Call `mcp__pencil__get_screenshot` to validate Frame 01 visually
- [ ] **Step 10:** Fix any layout issues, then proceed

---

## Task 2: Frame 02 — Canvas (Active Editing State)

**Frame position:** Column 2, Row 1

- [ ] **Step 1:** Copy Frame 01 shell via `mcp__pencil__batch_design` (C operation), place at x=1520, y=0
- [ ] **Step 2:** Update frame label to `02 — Canvas [P0]`
- [ ] **Step 3:** Update Rail — highlight Add icon as active
- [ ] **Step 4:** Update Sidebar — replace placeholder content with Add/Build panel: search bar + sections grid (Hero, Nav, Features, CTA, Footer tiles)
- [ ] **Step 5:** Update Canvas — add inside the page viewport:
  - 3 stacked section blocks (Hero, Features, Footer)
  - Selection bounding box on middle section (dashed rectangle)
  - 8 resize handle dots (corners + edges)
  - Smart guide lines (horizontal + vertical crossing the selection)
  - Spacing label pill: `16px`
  - Breadcrumb overlay top-left: `Page › Hero Section`
  - Floating quick actions bar above selection: `[Copy][Paste][Duplicate][Delete][Lock]`
- [ ] **Step 6:** Update Inspector — show populated Layout tab (basic filled sections)
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 3: Frame 03 — Inspector (Detailed)

**Frame position:** Column 3, Row 1

- [ ] **Step 1:** Copy Frame 02 (active canvas state — per copy-source rule), place at x=3040, y=0
- [ ] **Step 2:** Update label to `03 — Inspector [P0]`
- [ ] **Step 3:** Update Rail — highlight Layers icon as active
- [ ] **Step 4:** Update Sidebar — Layers panel with tree: `Page › Section (selected) › Container › H1, P, Button`
- [ ] **Step 5:** Update Inspector (focus of this frame) — fully detailed:
  - Element name: `Hero Heading`
  - Breadcrumb: `Section › Container › H1`
  - 3 tabs: `[Layout ●][Appearance][Effects]`
  - **Display & Position section (expanded):** Display: Block▾, Position: Relative▾, Z-index: auto, Overflow: Visible▾
  - **Size section (expanded):** W [auto][px▾] H [auto][px▾] + `▸ More settings`
  - **Spacing section (expanded):** box model diagram — outer box (margin), inner box (padding), 4 number inputs per box
  - **Flexbox section (collapsed):** `▸ Flexbox`
  - **Responsive Constraints (expanded):** Flex Grow [0], Shrink [1], Behavior [Scale▾]
  - Pseudo-state bar: `[Normal●][Hover][Focus][Active]`
  - Breakpoint indicator: `[🖥 Desktop▾]`
  - Delete button: `[🗑 Delete Element]` at bottom
- [ ] **Step 6:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 4: Frame 04 — Add / Build Tab

**Frame position:** Column 4, Row 1

- [ ] **Step 1:** Copy Frame 01 shell, place at x=4560, y=0
- [ ] **Step 2:** Update label to `04 — Add / Build Tab [P0]`
- [ ] **Step 3:** Update Rail — highlight Add icon as active
- [ ] **Step 4:** Update Sidebar (focus):
  - Search bar: `[🔍 Search sections and elements...]`
  - Sub-tabs: `[Sections ●][Elements][Favorites]`
  - 2-column tile grid (Sections): Hero, Navigation, Features, Pricing, Testimonials, CTA, Footer, Gallery, Blog, Contact — each ~64×64px box with icon + label
  - Note label: `Components now inside this panel (no separate rail tab)`
  - Favorites row: 3 starred tiles
- [ ] **Step 5:** Update Canvas — blank page with dashed drop zone border and label `Drop sections here`
- [ ] **Step 6:** Update Inspector — empty state box: `Select an element to inspect`
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 5: Frame 05 — Layers Tab

**Frame position:** Column 5, Row 1

- [ ] **Step 1:** Copy Frame 01 shell, place at x=6080, y=0
- [ ] **Step 2:** Update label to `05 — Layers Tab [P0]`
- [ ] **Step 3:** Update Rail — highlight Layers icon (Z)
- [ ] **Step 4:** Update Sidebar (focus):
  - Panel header: `Layers`
  - Tree with indent levels and icons:
    ```
    ▼ Page: Home
      ▼ Navigation [👁][🔒]
      ▼ Hero ← [SELECTED badge] [👁][🔒]
        ▼ Container
            H1 Heading text
            P Paragraph text
            Button Get Started
      ▸ Features [👁][🔒]
      ▸ Footer [👁][🔒]
    ```
  - Drag handle dots on left of each row
- [ ] **Step 5:** Canvas — page with Hero section highlighted by selection bounding box
- [ ] **Step 6:** Inspector — populated Layout tab (hero section properties)
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 6: Frame 06 — Pages Tab

**Frame position:** Column 6, Row 1

- [ ] **Step 1:** Copy Frame 01 shell, place at x=7600, y=0
- [ ] **Step 2:** Update label to `06 — Pages Tab [P0]`
- [ ] **Step 3:** Update Rail — highlight Pages icon (P)
- [ ] **Step 4:** Update Sidebar (focus):
  - Panel header: `Pages` + `[+ Add Page]` button top right
  - Page list rows (thumbnail + name + status dot):
    - `■ Home ●` (active)
    - `■ About`
    - `■ Services`
    - `■ Blog`
    - `■ Contact`
  - Small hint label: `Right-click to rename, duplicate, or delete`
- [ ] **Step 5:** Canvas — home page content (3 section blocks, no selection)
- [ ] **Step 6:** Inspector — empty state: `Select an element to inspect`
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 7: Frame 07 — Components Tab

**Frame position:** Column 1, Row 2 (x=0, y=980px)

- [ ] **Step 1:** Copy Frame 01 shell, place at x=0, y=980
- [ ] **Step 2:** Update label to `07 — Components [P0]`
- [ ] **Step 3:** Update Rail — highlight Add icon (Components is inside Add/Build tab)
- [ ] **Step 4:** Add annotation on rail: `Components is inside Add tab — no separate rail icon`
- [ ] **Step 5:** Update Sidebar — Add/Build panel with Components section visible:
  - Section header: `My Components` + `[+ Create Component]` button
  - Component cards (full-width, thumbnail + name + badge): `Navbar — Used in 3 pages`, `Hero Banner — Used in 1 page`, `Footer — Used in 3 pages`
  - Section header: `Shared with Team`
  - Cards: `Button Library`, `Card Grid`
- [ ] **Step 6:** Canvas — page with one element selected, selection box labeled `⬡ Navbar` (component badge)
- [ ] **Step 7:** Inspector — populated, component properties
- [ ] **Step 8:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 8: Frame 08 — Design System Tab

**Frame position:** Column 2, Row 2

- [ ] **Step 1:** Copy Frame 01 shell, place at x=1520, y=980
- [ ] **Step 2:** Update label to `08 — Design System [P0]`
- [ ] **Step 3:** Update Rail — highlight Design icon (D)
- [ ] **Step 4:** Update Sidebar (focus):
  - Panel header: `Design System`
  - **Colors section:** Token swatches row — Primary ■, Secondary ■, Success ■, Warning ■, Error ■ — each with name + value below. `[+ Add Token]` button.
  - **Typography section:** Scale rows — Heading XL (24px), Heading LG (18px), Body (13px), Caption (11px). `[+ Add Token]`
  - **Spacing section:** Strip of boxes — 4px, 8px, 12px, 16px, 24px, 32px. `[+ Add Token]`
- [ ] **Step 5:** Canvas — idle (no selection)
- [ ] **Step 6:** Inspector — empty state: `No element selected. Select an element to edit its properties.`
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 9: Frame 09 — Collaboration

**Frame position:** Column 3, Row 2

- [ ] **Step 1:** Copy Frame 02 (canvas active state — per copy-source rule), place at x=3040, y=980
- [ ] **Step 2:** Update label to `09 — Collaboration [P0]`
- [ ] **Step 3:** Update Top Bar — add 3 avatar circles next to Publish button. Add annotation: `Collaboration presence shown here`
- [ ] **Step 4:** Update Canvas (focus):
  - Remote cursor 1: arrow shape + `👆 Sarah` name label (on top-right of canvas)
  - Remote cursor 2: arrow shape + `👆 Tom` name label (on hero section)
  - Soft lock overlay on hero section: tinted border + badge `🔒 Tom editing`
- [ ] **Step 5:** Add annotation box: `No dedicated Collaboration rail tab — presence shown in top bar and canvas only`
- [ ] **Step 6:** Inspector — populated for locally selected element
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 10: Frame 10 — Export Modal

**Frame position:** Column 4, Row 2

- [ ] **Step 1:** Copy Frame 01 shell, place at x=4560, y=980
- [ ] **Step 2:** Update label to `10 — Export Modal [P0]`
- [ ] **Step 3:** Add semi-transparent dim overlay over entire canvas area (not sidebar/rail)
- [ ] **Step 4:** Draw modal box centered (~640×480px):
  - Title: `Export Project`
  - Format tabs: `[HTML][React ●][Vue][Next.js]`
  - Code Quality Score: horizontal progress bar + `84 / 100` + `Passes senior dev review`
  - Page selector: checkboxes — Home ☑, About ☑, Services ☑, Blog ☑, Contact ☑
  - Options row: `☐ Include assets` `☐ Minify output`
  - Actions row: `[Cancel]` `[Download ZIP ↓]`
- [ ] **Step 5:** Inspector — visible but idle (modal overlays canvas, not inspector)
- [ ] **Step 6:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 11: Frames 11–12 — Templates & Media

**Positions:** Column 5 Row 2 (Frame 11), Column 6 Row 2 (Frame 12)

- [ ] **Step 1:** Copy Frame 01 shell, place at x=6080, y=980 (Frame 11)
- [ ] **Step 2:** Copy Frame 01 shell, place at x=7600, y=980 (Frame 12)
- [ ] **Step 3:** Frame 11 — Templates Tab:
  - Label: `11 — Templates Tab [P1]`
  - Rail: Templates icon (T) active
  - Sidebar: search bar + category pills (All, Business, Portfolio, Blog, Landing, E-commerce) + 4 template cards **1 column, full width** (each: 16:10 thumbnail box + name + category badge + `[Use Template]` button)
  - Canvas: idle. Inspector: empty state.
- [ ] **Step 4:** Frame 12 — Media Tab:
  - Label: `12 — Media Tab [P1]`
  - Rail: Media icon (J) active
  - Sidebar: 2-tabs `[My Library ●][Discovery]` + search bar + upload drop zone `[↑ Drop files or click to upload]` + 3-column asset grid (square thumbnails + filename below; one tile showing hover overlay with `[Edit][Delete][Insert]`)
  - Canvas: image element selected on page
  - Inspector: populated — image properties (src, alt, object-fit)
- [ ] **Step 5:** Call `mcp__pencil__get_screenshot` targeting Frame 11 to validate
- [ ] **Step 6:** Call `mcp__pencil__get_screenshot` targeting Frame 12 to validate

---

## Task 12: Frames 13–15 — Settings, Publish, History

**Positions:** Columns 1–3, Row 3 (y = 1960px)

- [ ] **Step 1:** Copy Frame 01 shell, place at x=0, y=1960 (Frame 13)
- [ ] **Step 2:** Copy Frame 01 shell, place at x=1520, y=1960 (Frame 14)
- [ ] **Step 3:** Copy Frame 01 shell, place at x=3040, y=1960 (Frame 15)
- [ ] **Step 4:** Frame 13 — Settings Tab:
  - Label: `13 — Settings Tab [P1]`
  - Rail: Settings icon (S) active
  - Sidebar: panel header `Settings` + 2-column card grid (6 cards: SEO ⚙, Analytics 📊, Fonts 🔤, Integrations 🔗, Domain 🌐, Custom Code </>)
  - Canvas: idle. Inspector: empty state.
- [ ] **Step 5:** Frame 14 — Publish Tab:
  - Label: `14 — Publish Tab [P1]`
  - Rail: **no icon active** (all 8 icons in default/inactive state) + annotation near rail: `Publish panel opens from top bar [Publish] button, not from rail`
  - Sidebar: status badge `● Unpublished changes` + domain `mysite.buildrik.io` + `[Connect custom domain]` + SEO score bar 72/100 `Needs improvement` + `Last published: 2 hours ago` + `[▶ Publish Now]` primary button + `[Preview in browser ↗]` ghost button
  - Canvas: idle. Inspector: empty state.
- [ ] **Step 6:** Frame 15 — History Tab:
  - Label: `15 — History Tab [P1]`
  - Rail: History icon (H) active
  - Sidebar: 2-tabs `[Versions ●][Activity]` + timeline list (5 rows: timestamp + action + avatar; one row showing `[Restore]` button on hover) + `● Now` badge on top entry
  - Canvas: page with slightly different content (version snapshot state)
  - Inspector: empty state.
- [ ] **Step 7:** Call `mcp__pencil__get_screenshot` targeting Frame 13 to validate
- [ ] **Step 8:** Call `mcp__pencil__get_screenshot` targeting Frame 14 to validate
- [ ] **Step 9:** Call `mcp__pencil__get_screenshot` targeting Frame 15 to validate

---

## Task 13: Frames 16–17 — Onboarding & AI Assistant

**Positions:** Columns 4–5, Row 3

- [ ] **Step 1:** Frame 16 — Onboarding:
  - Copy Frame 01 shell, place at x=4560, y=1960
  - Label: `16 — Onboarding [P1]`
  - Add full-frame spotlight dim overlay (semi-transparent mask)
  - Cut out a circle spotlight around the Rail zone
  - Draw tooltip box pointing to Rail:
    - Step indicator: `Step 2 of 4`
    - Title: `Add elements from the Rail`
    - Body: `Click any icon to open that panel`
    - Buttons: `[Skip]` `[Next →]`
  - Progress dots bar (4 dots, dot 2 filled): below tooltip
  - Annotation: `Rail, Sidebar, Inspector hidden behind overlay during onboarding`
- [ ] **Step 2:** Frame 17 — AI Assistant:
  - Copy Frame 01 shell, place at x=6080, y=1960
  - Label: `17 — AI Assistant [P1]`
  - Rail: no dedicated AI icon. Add annotation: `AI accessed via Ctrl+K command palette or canvas footer sparkle icon`
  - Sidebar: AI panel:
    - Header: `AI Assistant`
    - Chat area: user bubble `Add a testimonials section` + AI response card with `Testimonials Section` + confidence badge `High ●` + `[Apply][Dismiss]`
    - Suggestion cards: `Improve contrast — Medium ●` and `Add alt text to 3 images — High ●`
    - Chat input bottom: `[Ask AI anything...]` `[Send]`
  - Canvas: AI-generated section highlighted with dashed outline + `AI Generated` badge
  - Inspector: populated — AI-generated section properties
- [ ] **Step 3:** Call `mcp__pencil__get_screenshot` targeting Frame 16 to validate
- [ ] **Step 4:** Call `mcp__pencil__get_screenshot` targeting Frame 17 to validate

---

## Task 14: Frame 18 — CMS + Animation (Combined)

**Position:** Column 6, Row 3

- [ ] **Step 1:** Copy Frame 01 shell, place at x=7600, y=1960
- [ ] **Step 2:** Update label to `18 — CMS + Animation [P1/P2]`
- [ ] **Step 3:** Add annotation: `No CMS rail icon — CMS binding accessed via Inspector chain → Data Binding`
- [ ] **Step 4:** Rail: Layers icon active
- [ ] **Step 5:** Sidebar: Layers panel showing element tree
- [ ] **Step 6:** Inspector — split into 2 areas:
  - **Top half — Data Binding:**
    - Header: `Data Binding`
    - Collection: `[Blog Posts ▾]`
    - Field map list: `Title → H1 text`, `Image → Hero image`, `Date → Subtitle`
    - `[+ Add field binding]`
  - **Bottom half — Animation:**
    - Header: `Animation`
    - Timeline strip: 3 element rows with keyframe dots
    - Playback controls: `[◀][▶][▶▶]` + `[0:00]` scrubber
- [ ] **Step 7:** Canvas: text element selected with CMS badge `⊞ Blog Posts: Title` + animation scrubber overlay at canvas bottom
- [ ] **Step 8:** Call `mcp__pencil__get_screenshot` to validate

---

## Task 15: Final Review & Annotation Pass

- [ ] **Step 1:** Call `mcp__pencil__snapshot_layout` to verify all 18 frames are present and correctly positioned
- [ ] **Step 2:** Call `mcp__pencil__get_screenshot` on the full canvas (zoomed out) to see all 18 frames in the 6×3 grid
- [ ] **Step 3:** Check each frame against this pass checklist:
  - ☑ Frame number and screen name label visible
  - ☑ Priority badge (P0 / P1 / P2) in top-right corner
  - ☑ Correct rail icon highlighted (or "no icon active" annotation for Publish/AI)
  - ☑ Sidebar content matches the screen's spec (not the base shell placeholder)
  - ☑ Canvas state matches spec (idle / active element / modal overlay)
  - ☑ Inspector state matches spec (empty state OR populated)
  - ☑ Dimension annotations present on Frame 01 (44px rail, 44px top bar, 260px sidebar, 280px inspector)
- [ ] **Step 4:** Fix any frames that fail the checklist above
- [ ] **Step 5:** Final screenshot of complete canvas

---

## Annotation Standards (apply consistently)

| Annotation | Format |
|-----------|--------|
| Dimension label | Arrow + `44px` text beside the zone |
| Zone label | `[ZONE NAME]` box or text inside zone |
| Empty state | Box with `Empty state: Select an element` label |
| Annotation note | Italic text in a dashed box beside the element |
| Priority badge | Corner label: `P0`, `P1`, `P2` |
| Unconfirmed value | `~40px TBC` label |

---

## Source Spec
`docs/superpowers/specs/2026-03-25-pencil-wireframes-design.md`
