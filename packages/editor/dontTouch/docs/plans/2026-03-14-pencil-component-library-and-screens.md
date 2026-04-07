# Pencil Component Library + Screens 1–32 Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully component-based Pencil design file for Buildrik — reusable components first, then assemble all 32 static screens from those components so any token/style change propagates everywhere automatically.

**Architecture:** One dedicated `🧩 Component Library` frame holds all `reusable:true` components. Each screen (01–32) is built by inserting `{type:"ref", ref:"componentId"}` instances. Design tokens (`--aqb-*`) are already set in the .pen file — all component fills/colors reference these variables.

**Pencil File:** `/Users/shahg/Desktop/pencil/buildrik.pen`
**Spec Files:** `pencil_prompts.md` (screens 0–32), `pencil_wireframing.md` (flows 33–46)
**Token Status:** ✅ All `--aqb-*` variables already set via `set_variables`

**Verification method (replaces unit tests):** After each task, call `mcp__pencil__get_screenshot` on the created frame/component and visually confirm it matches the spec.

---

## Component → Screen Dependency Map

```
PanelHeader ─────────────────────────────────────── used by Screens 05–14
RailIcon ────────────────────────────────────────── used by Screen 03
TopBarSection ───────────────────────────────────── used by Screen 02
Button (primary/ghost/destructive) ──────────────── used by ALL screens
InputField ──────────────────────────────────────── used by Screens 05,06,09,12,21,22,27
FilterPill ──────────────────────────────────────── used by Screens 06,08
AssetCard ───────────────────────────────────────── used by Screen 06
SettingsCard ────────────────────────────────────── used by Screen 12
AccordionSection ────────────────────────────────── used by Screens 05,11,21,22,23
PropertyRow ─────────────────────────────────────── used by Screens 21,22,23
InspectorTabBar ─────────────────────────────────── used by Screen 20
StatusBadge ─────────────────────────────────────── used by Screens 02,13
Toast ───────────────────────────────────────────── used by Screens 31,46
ModalBase ───────────────────────────────────────── used by Screen 25
ContextMenuItem ─────────────────────────────────── used by Screen 18
EmptyState ──────────────────────────────────────── used by Screens 06,07,10,15,20,31
Tooltip ─────────────────────────────────────────── used by Screens 03,18
KeyboardBadge ───────────────────────────────────── used by Screen 27
ColorSwatch ─────────────────────────────────────── used by Screens 11,22
```

---

## Chunk 1: Component Library Foundation

**Target frame:** `🧩 Component Library` (new frame, 3200×2400px, dark bg `#08080e`)

All components must have `reusable:true` so they can be referenced with `{type:"ref", ref:"id"}`.

### Task 1: Create Component Library Frame + Shell Components

**Components to build:**
- `PanelHeader` — 320×48px, used by all 10 panels (SSOT)
- `RailIconSlot` — 56×52px, single rail icon with 4 states
- `TopBar` — 1440×52px shell

**Steps:**
- [ ] Find empty space on canvas (bottom of existing content)
- [ ] Create `🧩 Component Library` frame: 3200×2400, `layout:"none"`, fill `#08080e`
- [ ] Add section label: "SHELL COMPONENTS"

**PanelHeader component:**
```
reusable:true, name:"PanelHeader", 320×48px
fill: #0f0f14 (--aqb-surface-1)
border-bottom: 1px rgba(255,255,255,0.08) → simulate with thin rect at bottom
Children:
  - TabIcon: rectangle 16×16, fill:#B8B5AD, x:12, y:16
  - TabName: text "Panel Title", 14px, weight:600, fill:#F5F5F0, x:36, y:16
  - PinIcon: rectangle 16×16, fill:#908D85, x:268, y:16
  - CloseIcon: rectangle 16×16, fill:#908D85, x:292, y:16
```

- [ ] Insert PanelHeader via `batch_design` with `reusable:true`
- [ ] Screenshot PanelHeader and verify: header 48px, icons right-aligned, correct colors
- [ ] Add section divider line

**RailIconSlot component:**
```
reusable:true, name:"RailIconSlot", 56×52px
fill: transparent
Children:
  - IconBg: rectangle 40×40, cornerRadius:8, fill:#00000000 (transparent), x:8, y:6
  - Icon: rectangle 20×20, fill:#908D85 (--aqb-text-muted), x:18, y:10
  - Label: text "Label", 10px, fill:#908D85, x:0, y:36, width:56, align:center
  - ActiveBar: rectangle 3×24, fill:#7c6dfa, x:0, y:14 (left indicator)
```

- [ ] Insert RailIconSlot with `reusable:true`
- [ ] Screenshot and verify

---

### Task 2: Button Components (4 variants)

**Components:** `BtnPrimary`, `BtnGhost`, `BtnDestructive`, `IconBtn`

**BtnPrimary spec:**
```
reusable:true, name:"BtnPrimary", auto×32px
fill: #6366f1 (--aqb-primary), cornerRadius:6, padding:12px horizontal
Children:
  - Label: text "Button", 13px, weight:500, fill:#FFFFFF
```

**BtnGhost spec:**
```
reusable:true, name:"BtnGhost", auto×32px
fill: transparent, cornerRadius:6
border: simulate with 1px rgba(255,255,255,0.12) outline rect
Children:
  - Label: text "Button", 13px, weight:500, fill:#B8B5AD
```

**BtnDestructive spec:**
```
reusable:true, name:"BtnDestructive", auto×32px
fill: #ef4444 (--aqb-error), cornerRadius:6
Children:
  - Label: text "Delete", 13px, weight:500, fill:#FFFFFF
```

**IconBtn spec:**
```
reusable:true, name:"IconBtn", 24×24px
fill: transparent, cornerRadius:6
Children:
  - Icon: rectangle 12×12, fill:#B8B5AD, centered (x:6, y:6)
```

**Steps:**
- [ ] Create all 4 button components in component library frame
- [ ] Screenshot button row, verify sizes and colors match spec
- [ ] Label each with correct name and usage note

---

### Task 3: Input + Filter Components

**Components:** `InputField`, `InputSearch`, `FilterPill`

**InputField spec:**
```
reusable:true, name:"InputField", 240×32px
fill: #1e1e26 (--aqb-surface-3), cornerRadius:6
border: 1px rgba(255,255,255,0.08)
Children:
  - Placeholder: text "Enter value...", 13px, fill:#908D85, x:10, y:8
```

**InputSearch spec:**
```
reusable:true, name:"InputSearch", 240×32px
fill: #1e1e26, cornerRadius:6
Children:
  - SearchIcon: rectangle 14×14, fill:#908D85, x:10, y:9
  - Placeholder: text "Search...", 13px, fill:#908D85, x:30, y:8
```

**FilterPill spec (inactive):**
```
reusable:true, name:"FilterPill", auto×28px, pad:4px 12px
fill: #1e1e26 (--aqb-surface-3), cornerRadius:14
Children:
  - Label: text "Filter", 12px, fill:#B8B5AD
```

**FilterPill Active variant — add as separate component:**
```
reusable:true, name:"FilterPillActive"
fill: #6366f1 (--aqb-primary), cornerRadius:14
Children:
  - Label: text "Filter", 12px, fill:#FFFFFF
```

**Steps:**
- [ ] Create InputField, InputSearch, FilterPill, FilterPillActive
- [ ] Screenshot, verify placeholder colors, correct fills

---

### Task 4: Feedback Components (Toast, Badge, StatusDot, EmptyState)

**Toast spec (4 variants — create 4 separate reusable components):**
```
ToastSuccess:
  reusable:true, 320×56px, fill:#16161d (surface-2), cornerRadius:8
  border-left simulation: 4px × 56px rect, fill:#22c55e at x:0
  Children:
    - CheckIcon: 16×16 rect, fill:#22c55e, x:16, y:20
    - Message: text "Action completed", 13px, weight:500, fill:#F5F5F0, x:40, y:20
    - DismissX: rect 16×16, fill:#908D85, x:292, y:20

ToastError: same but border fill:#ef4444, icon fill:#ef4444
ToastWarning: same but border fill:#f59e0b, icon fill:#f59e0b
ToastInfo: same but border fill:#3b82f6, icon fill:#3b82f6
```

**StatusBadge variants:**
```
BadgeDraft: 64×22px, fill:#26262f, cornerRadius:11
  - Dot: 8×8 ellipse, fill:#908D85, x:8, y:7
  - Text: "Draft", 12px, fill:#908D85, x:22, y:4

BadgePublished: same but dot fill:#22c55e, text "Published", fill:#22c55e

BadgeAmber: dot fill:#f59e0b, text fill:#f59e0b
```

**EmptyState (generic):**
```
reusable:true, name:"EmptyState", 280×180px, fill:transparent
Children:
  - Icon: 32×32 rect, fill:#908D85 at 0.3 opacity, x:124, y:20
  - Heading: text "Nothing here", 14px, weight:600, fill:#B8B5AD, centered, y:68
  - Body: text "Description text", 12px, fill:#908D85, centered, y:92
  - ActionBtn: ref to BtnGhost, y:128, centered
```

**Steps:**
- [ ] Create all 4 Toast variants
- [ ] Create BadgeDraft, BadgePublished, BadgeAmber
- [ ] Create EmptyState component
- [ ] Screenshot all, verify border-left on toasts, dot colors on badges

---

### Task 5: Inspector Components (AccordionSection, PropertyRow, InspectorTabBar, ColorSwatch)

**AccordionSection:**
```
reusable:true, name:"AccordionSection", 268×32px (header only, expanded via U())
fill: #0f0f14, cornerRadius:0
Children:
  - Chevron: rect 12×12, fill:#908D85, x:12, y:10
  - Label: text "SECTION", 10px, weight:600, uppercase, fill:#908D85, letterSpacing:0.5, x:32, y:10
  - DividerBottom: rect 268×1, fill:rgba(255,255,255,0.06), x:0, y:31
```

**PropertyRow:**
```
reusable:true, name:"PropertyRow", 268×32px
fill: transparent
Children:
  - Label: text "Property", 12px, fill:#B8B5AD, x:16, y:8
  - ValueInput: rect 80×24, fill:#1e1e26, cornerRadius:4, x:172, y:4
  - ValueText: text "auto", 12px, fill:#F5F5F0, x:180, y:8 (mono font)
```

**InspectorTabBar (3 tabs: Layout, Style, Behavior):**
```
reusable:true, name:"InspectorTabBar", 268×36px
fill: #0f0f14
Children:
  - Tab1: text "Layout", 13px, weight:600, fill:#F5F5F0, x:16, y:10
  - Tab1Underline: rect 40×2, fill:#6366f1, x:16, y:32
  - Tab2: text "Style", 13px, weight:400, fill:#B8B5AD, x:76, y:10
  - Tab3: text "Behavior", 13px, weight:400, fill:#B8B5AD, x:124, y:10
```

**ColorSwatch:**
```
reusable:true, name:"ColorSwatch", 28×28px
fill: #6366f1, cornerRadius:6
border: 1px rgba(255,255,255,0.08) via thin overlay rect
```

**Steps:**
- [ ] Create AccordionSection, PropertyRow, InspectorTabBar, ColorSwatch
- [ ] Screenshot, verify typography: section labels 10px uppercase, property labels 12px

---

### Task 6: Modal + Context Menu Components

**ModalBase:**
```
reusable:true, name:"ModalBase", 520×400px
fill: #0f0f14 (surface-1), cornerRadius:12
border: 1px rgba(255,255,255,0.12)
shadow simulation: slightly larger bg rect behind
Children:
  - Backdrop: rect 1440×900, fill:#00000080, cornerRadius:0 (positioned behind)
  - TitleBar: rect 520×56px, fill:#0f0f14 at y:0
  - TitleText: text "Modal Title", 16px, weight:600, fill:#F5F5F0, x:24, y:18
  - CloseBtn: rect 24×24, fill:#1e1e26, cornerRadius:6, x:480, y:16
  - CloseX: text "×", 16px, fill:#908D85, x:486, y:16
  - Divider: rect 520×1, fill:rgba(255,255,255,0.08), y:56
  - ContentArea: rect 520×288, fill:#0f0f14, y:57
  - Footer: rect 520×56, fill:#0f0f14, cornerRadius:0, y:344
  - FooterDivider: rect 520×1, fill:rgba(255,255,255,0.08), y:344
```

**ContextMenuItem (normal):**
```
reusable:true, name:"ContextMenuItem", 200×32px
fill: transparent, cornerRadius:0
Children:
  - Icon: rect 14×14, fill:#908D85, x:12, y:9
  - Label: text "Menu Item", 13px, fill:#F5F5F0, x:34, y:8
  - Shortcut: text "Ctrl+C", 11px, fill:#5a584f, x:154, y:9 (mono)
```

**ContextMenuItem (destructive):**
```
reusable:true, name:"ContextMenuItemDestructive"
same but Label fill:#ef4444, Icon fill:#ef4444
```

**Steps:**
- [ ] Create ModalBase, ContextMenuItem, ContextMenuItemDestructive
- [ ] Screenshot ModalBase, verify: dark bg, border, close button position

---

### Task 7: Utility Components (Tooltip, KeyboardBadge, Divider, ConfirmDialog)

**Tooltip:**
```
reusable:true, name:"Tooltip", auto×28px
fill: #2e2e38 (surface-5), cornerRadius:6
Children:
  - Label: text "Tooltip label", 11px, fill:#F5F5F0, x:10, y:7
  - Shortcut: text "Ctrl+Z", 10px, fill:#B8B5AD, x:auto, y:8 (mono)
  - Arrow: rect 6×6, fill:#2e2e38, x:-3, y:11 (rotated 45deg — simulate with small rotated rect)
```

**KeyboardBadge:**
```
reusable:true, name:"KeyboardBadge", auto×20px, pad:2px 6px
fill: #1e1e26, cornerRadius:3
border: 1px rgba(255,255,255,0.08)
Children:
  - Key: text "Ctrl", 10px, weight:600, fill:#F5F5F0 (mono font)
```

**Divider:**
```
reusable:true, name:"Divider", 268×1px
fill: rgba(255,255,255,0.06)
```

**ConfirmDialog:**
```
reusable:true, name:"ConfirmDialog", 400×200px
fill: #0f0f14, cornerRadius:12
border: 1px rgba(255,255,255,0.12)
Children:
  - Title: text "Are you sure?", 16px, weight:600, fill:#F5F5F0, x:24, y:24
  - Body: text "This action cannot be undone.", 13px, fill:#B8B5AD, x:24, y:56
  - CancelBtn: ref BtnGhost, x:212, y:152
  - ConfirmBtn: ref BtnDestructive, x:296, y:152
```

**Steps:**
- [ ] Create Tooltip, KeyboardBadge, Divider, ConfirmDialog
- [ ] Screenshot component library full frame
- [ ] Verify: 20+ components visible, grouped by category, correct labels

---

## Chunk 2: Screens 01–08 (Shell + Left Panel Tabs)

All screens: `1440×900px`, `layout:"none"`, dark bg `#0f0f14`

### Task 8: Screen 01 — Editor Shell

**Frame:** `01 — Editor Shell`, 1440×900px

Layout using component refs where possible:
```
TopBar zone:    rect 1440×52, fill:#0f0f14, y:0
Rail zone:      rect 56×848, fill:#0f0f14, x:0, y:52 + right border
Sidebar zone:   rect 280×848, fill:#0f0f14, x:56, y:52
Canvas zone:    rect 804×808, fill:#FFFFFF, x:336, y:52
CanvasFooter:   rect 804×40, fill:#0f0f14, x:336, y:860 + top border
Inspector zone: rect 300×848, fill:#0f0f14, x:1140, y:52
```

- [ ] Create 01 frame (1440×900, `layout:"none"`, fill:#0f0f14)
- [ ] Add 6 zones with correct dimensions (see spec table)
- [ ] Add zone labels as annotations (10px, muted)
- [ ] Add dimension callouts for each zone
- [ ] Screenshot and verify 6-zone layout

---

### Task 9: Screen 02 — Top Bar

**Frame:** `02 — Top Bar`, 1440×200px (enough for 5 states)

Show 5 states stacked vertically (40px gap):
1. **Idle/Saved** — green dot + "Saved 2:45 PM"
2. **Saving** — blue pulsing dot + "Saving..."
3. **Save Error** — red dot + "Save failed"
4. **Collaborators** — presence avatars stack visible
5. **Offline** — gray sync dot

Each state row = 1440×52px bar

For presence avatars (State 4):
```
3 avatar circles, 28×28px, border-radius:50%, border:2px #0f0f14
Colors: #6366f1, #ec4899, #14b8a6
Initials: 11px, weight:700, white
Online dot: 8×8 ellipse, #22c55e, bottom-right
Stack: row-reverse flex (overlap 8px each)
```

- [ ] Create 02 frame
- [ ] Build State 1 (idle): 5-section layout, logo+name left, undo/redo, device dropdown center, save status, preview+publish right
- [ ] Build States 2–5 as variations below State 1
- [ ] Screenshot, verify: device switcher is dropdown NOT segmented control, no overflow menu (⚠️KI-8)

---

### Task 10: Screen 03 — Navigation Rail

**Frame:** `03 — Navigation Rail`, 280×900px (rail + 4 state columns)

Show rail + 4 icon state examples:

**Rail structure:**
- 56×848px container, surface-1
- TOP group (5 icons, 4px gap): Add, Media, Layers, Templates, Pages
- SPACER: flex-grow simulation
- BOTTOM group (3 icons): Design, Settings, History
- Each RailIconSlot: 56×52px

**4 state examples (show inline next to rail):**
- Default: icon #908D85, no bg
- Hover: icon brighter
- Active: left bar 3×24 #7c6dfa + bg rgba(124,109,250,0.12)
- Focused: teal outline 2px offset 2px

**Tooltip example:**
- Right of icon, 8px gap
- "Add Elements — A" + subtitle
- Bg #2e2e38, radius 6px, arrow 6px left-pointing

- [ ] Create 03 frame
- [ ] Build rail column with all 8 icons (use RailIconSlot refs + override labels)
- [ ] Add state examples with annotations
- [ ] Screenshot, verify: 8 icons (NOT 9, Components + Publish absent ⚠️KI-1, KI-2), active state left bar visible

---

### Task 11: Screen 04 — Panel Header & States

**Frame:** `04 — Panel Header & States`, 1440×400px

Show PanelHeader component in 4 width/state variants side by side:
1. Closed (0px) — just rail, no panel content
2. Open-unpinned (320px) — standard header, pin icon
3. Open-pinned (320px) — pin-off icon, border-right 2px #6366f1
4. Expanded (400px) — wider, resize handle on right edge

**Panel width reference callouts:**
- Compact 280px / Default 320px / Extended 400px

- [ ] Create 04 frame
- [ ] Build 4 states using PanelHeader refs with overrides
- [ ] Add resize handle on State 4 (4px rect on right edge)
- [ ] Screenshot, verify pinned state has 2px indigo right border

---

### Task 12: Screen 05 — Build Tab

**Frame:** `05 — Build Tab`, 320×900px (full panel view)

Structure (top to bottom):
```
PanelHeader: [Plus 16px] "Add" [pin] [close] — h:48
InputSearch: full width 288px, h:32, pad:16px — y:64
OnboardingTip: 288×52px, bg rgba(99,102,241,0.08), border rgba(99,102,241,0.2), radius:8 — y:108
Category sections (accordion): Basic, Layout, Forms, Media, Sections, E-commerce, Advanced
  Each category header: AccordionSection ref (h:32)
  Element grid: 4 cols, 8px gap, each cell 60×60px
    Cell: bg surface-2, radius:8, pad:8
    Icon: 24×24 centered rect, fill:#908D85
    Label: 10px, fill:#B8B5AD, centered
```

- [ ] Create 05 frame
- [ ] Add PanelHeader (ref), InputSearch (ref)
- [ ] Add OnboardingTip banner (unique content)
- [ ] Build "Basic" accordion open (showing 7 element cards in grid)
- [ ] Build "Layout", "Forms", "Media" accordions collapsed
- [ ] Screenshot, verify: 4-col element grid, correct accordion pattern

---

### Task 13: Screen 06 — Media Tab

**Frame:** `06 — Media Tab`, 320×900px

Structure:
```
PanelHeader: [Image 16px] "Media" [pin] [close] — h:48
UploadZone: 288×80px, dashed border rgba(255,255,255,0.12), "Drop files here or click to upload", radius:8 — y:64
FilterPills row (horizontal): All/Images/Videos/Documents/Audio/SVG — y:156, h:28
Library grid (3 cols, 4px gap): — y:196
  Each cell: 88×88px, bg surface-3, radius:6
  Hover state (1 cell): overlay bg rgba(0,0,0,0.5), filename + size + type text
EmptyState: centered below grid for "No images yet" case (show as alternate)
```

- [ ] Create 06 frame
- [ ] Add PanelHeader ref + upload zone
- [ ] Add filter pills: FilterPill refs (All = FilterPillActive, rest = FilterPill)
- [ ] Build 3×4 thumbnail grid with 12 placeholder cells (colored rects)
- [ ] Add 1 hover state cell with overlay
- [ ] Screenshot, verify: filter pills, 3-col grid, upload zone dashed border

---

### Task 14: Screen 07 — Layers Tab

**Frame:** `07 — Layers Tab`, 320×900px

Structure:
```
PanelHeader: [Layers 16px] "Layers" [pin] [close]
Element tree (vertical list):
  Row 0 (depth 0): [grip 12px] [type-icon 14px] "body" — h:32, indent:0, bg rgba(99,102,241,0.12) (selected)
  Row 1 (depth 1): [grip] [icon] "section.hero" — indent:16px
  Row 2 (depth 2): [grip] [icon] "div.hero-content" — indent:32px
  Row 3 (depth 3): [grip] [icon] "h1 — Hero Title" — indent:48px
  Row 4 (depth 3): [grip] [icon] "p — Subtitle" — indent:48px
  Row 5 (depth 2): [grip] [icon] "img — Hero Image" — indent:32px
  ...more rows...
Each row: 32px height, eye/eye-off icon right side 14px #908D85
Selected row: bg rgba(99,102,241,0.12)
Hover row: bg surface-3
```

- [ ] Create 07 frame
- [ ] Build layer tree with 8 rows showing nesting
- [ ] Screenshot, verify: indentation levels (16px per level), selection highlight, eye icons

---

### Task 15: Screen 08 — Templates Tab

**Frame:** `08 — Templates Tab`, 320×900px

Structure:
```
PanelHeader: [Templates 16px] "Templates" [pin] [close]
FilterPills: All/Pages/Sections/Landing Pages/E-commerce
Template grid (2 cols, 8px gap):
  Each card: 136×160px, bg surface-2, radius:8
    Thumbnail: 136×120px bg surface-3 (colored placeholder)
    Name: 13px semibold, fill:#F5F5F0, y:130, pad:0 8px
  Hover card: border rgba(255,255,255,0.16), shadow-sm
```

- [ ] Create 08 frame
- [ ] Add PanelHeader ref + filter pills
- [ ] Build 2×3 template card grid (6 cards)
- [ ] Add 1 hover state card
- [ ] Screenshot, verify: 2-col grid, card hover state

---

## Chunk 3: Screens 09–14 (Remaining Panel Tabs)

### Task 16: Screen 09 — Pages Tab

**Frame:** `09 — Pages Tab`, 320×900px

Structure:
```
PanelHeader: [Pages 16px] "Pages" [pin] [close]
Page list:
  Row 1 (active): 40px, bg rgba(99,102,241,0.12), [page-icon 14px] "Home" bold
  Row 2: 40px, bg transparent, [page-icon] "About"
  Row 3: 40px, bg transparent, [page-icon] "Contact"
  Row 4: 40px, bg transparent, [page-icon] "Blog"
  Hover Row 2: bg surface-3
Add Page btn: bottom, full-width ghost btn "[+ Add Page]"

Per-page settings drill-in (show as alternate state, same frame):
DrillInHeader: [← 16px] "Home – SEO Settings" [h:44]
SEO section: Title, Meta Desc, Canonical URL fields
Social section: OG Title, OG Desc, OG Image
Advanced section: Custom CSS, Slug
```

- [ ] Create 09 frame
- [ ] Build page list (4 pages, first active)
- [ ] Add drill-in state as second column in frame
- [ ] Screenshot, verify: active page highlight, drill-in header back arrow

---

### Task 17: Screen 10 — Components Tab

**Frame:** `10 — Components Tab`, 320×900px

**⚠️ KI-1: Components tab is keyboard-only (⇧A) — NOT in rail**

Structure:
```
PanelHeader: [Component icon 16px] "Components" [pin] [close]
KI annotation banner: amber bg, "⚠️ KI-1: Keyboard-only — ⇧A. Not in rail."
EmptyState (primary content):
  Icon: component 32px, opacity:0.3, centered
  Heading: "No components yet"
  Body: "Select an element and right-click → Create Component"
  Btn: [Create Component] ghost
```

- [ ] Create 10 frame
- [ ] Add known issue annotation
- [ ] Use EmptyState ref + override text

---

### Task 18: Screen 11 — Design System Tab

**Frame:** `11 — Design System Tab`, 320×900px

Structure:
```
PanelHeader: [Palette 16px] "Design" [pin] [close]
DraftChip: amber dot 8px + "2 drafts" — h:28, top
Colors accordion (open):
  Title row: "COLORS" section header
  Swatch grid (6 cols): 8 ColorSwatch refs (6 main colors)
  [+ Add color] ghost btn
Typography accordion (collapsed)
Spacing accordion (collapsed)
Export dropdown: [CSS ▾] button
Review Changes btn: primary [Review Changes]
```

- [ ] Create 11 frame
- [ ] Add DraftChip with subtle amber dot (⚠️KI-5: subtle appearance)
- [ ] Build color swatch grid using ColorSwatch refs
- [ ] Screenshot, verify: accordion pattern, DraftChip is subtle

---

### Task 19: Screen 12 — Settings Tab

**Frame:** `12 — Settings Tab`, 320×900px (home + drill-in)

**Home view:**
```
PanelHeader: [Settings 16px] "Settings" [pin] [close]
6 SettingsCards (2-col grid, 8px gap):
  Site | Domains (LockedScreen) | Analytics (LockedScreen) | Export | Integrations | Advanced
  Each card: 136×80px, bg surface-2, radius:8, pad:16px
    Icon: 20×20 rect, fill:#908D85
    Title: 13px semibold, fill:#F5F5F0
    Desc: 11px, fill:#908D85
    Locked cards: 🔒 badge overlay, "Coming Soon"
```

**Drill-in view (separate column):**
```
DrillInHeader: [← 16px] "Site Settings" [h:44]
Form: Site name input, Favicon upload, Language dropdown
```

- [ ] Create 12 frame
- [ ] Build SettingsCards grid (6 cards, 2 locked: Domains, Analytics ⚠️)
- [ ] Add drill-in view for Site Settings
- [ ] Screenshot, verify: locked cards have Coming Soon badge

---

### Task 20: Screen 13 — Publish Tab

**Frame:** `13 — Publish Tab`, 320×900px (multiple states)

**⚠️ KI-2: Publish tab is keyboard-only (U) — NOT in rail**

4 states (show as columns or stacked):
1. **Draft** — BadgeDraft, checklist all ☐, [Publish Site] btn
2. **Publishing** — disabled btn "Publishing... ⟳"
3. **Published** — BadgePublished, URL visible with copy btn, [Update Site] + [Unpublish]
4. **Checklist detail** — all 5 items shown (first 2 checkable, last 3 hardcoded ☐ ⚠️KI-4)

Checklist items:
- ☐ Has content
- ☐ Has SEO title
- ☐ Has meta description
- ☐ Has social image
- Navigation hint per item: "Go to Pages → SEO"

- [ ] Create 13 frame
- [ ] Build all 4 states
- [ ] Add KI-2, KI-4 annotations
- [ ] Screenshot, verify: checklist hardcoded items clearly annotated

---

### Task 21: Screen 14 — History Tab

**Frame:** `14 — History Tab`, 320×900px

Structure:
```
PanelHeader: [Clock 16px] "History" [pin] [close]
[Save current version] ghost btn — full width, top
Named Versions accordion (open):
  Row: [current badge #22c55e] "Homepage Draft" — "Just now" — avatar
  Row: "Header fix" — "2 hours ago" — avatar
  Hover row: [Restore] btn appears
Auto-saves accordion (open):
  Row: "Auto-saved" — "5m ago"
  Row: "Auto-saved" — "20m ago"
  Row: "Auto-saved" — "1h ago"
Restore flow (inline annotation):
  ConfirmDialog ref shown with "Restore to Homepage Draft?"
  Warning text: "Your current changes will be saved as auto-save first."
KI-11 annotation: "⚠️ Compare versions NOT implemented"
```

- [ ] Create 14 frame
- [ ] Build named versions + auto-saves sections
- [ ] Add hover state showing Restore button
- [ ] Add ConfirmDialog ref for restore flow
- [ ] Screenshot, verify: accordion pattern, current badge green

---

## Chunk 4: Screens 15–19 (Canvas States + Overlays)

### Task 22: Screen 15 — Canvas Default & Empty States

**Frame:** `15 — Canvas Default States`, 1440×1200px (3 states stacked)

**State 1 (New Project — Blank):**
- Full shell layout (use Screen 01 as reference)
- Canvas area shows CanvasEmptyCTA:
  - bg rgba(248,250,252,0.85), border 3px dashed #e2e8f0, radius 16px
  - Icon 48×48 #818cf8 opacity 0.7
  - "Your Canvas is Empty" — 20px, #1e293b
  - "Start with a template or build from scratch" — 13px
  - [Browse Templates] primary gradient btn + [Start Blank] ghost

**State 2 (Template Applied):**
- Canvas shows colored template placeholder
- No CanvasEmptyCTA

**State 3 (Returning User):**
- Save status: "Auto-saved 2m ago"
- Sidebar visible

- [ ] Create 15 frame
- [ ] Build 3 state columns at 1440×380px each
- [ ] CanvasEmptyCTA with correct light-theme bg (⚠️ light against dark canvas)
- [ ] Screenshot, verify: dashed border, centered CTA

---

### Task 23: Screen 16 — Canvas Selection States

**Frame:** `16 — Canvas Selection States`, 1440×600px

Show 5 selection states on canvas (each as 200×200px canvas area mockup):
1. **Hover (CS-2):** Teal outline 2px rgba(20,184,166,0.6) + type badge
2. **Single Selected (CS-3):** Indigo outline 2px #6366f1 + 8 resize handles (8×8px circles) + floating toolbar above
3. **Multi-selected (CS-5):** Multiple elements each with indigo outline + group dashed bounding box rgba(99,102,241,0.4)
4. **Inline Edit (CS-6):** Lighter outline #818cf8 + blinking cursor + formatting toolbar
5. **Marquee (CS-9):** Dashed rect 1px #6366f1, bg rgba(99,102,241,0.08)

Resize handles spec:
- 8×8px, radius:50%, bg:white, border:1.5px #6366f1
- 8 positions: TL TC TR ML MR BL BC BR

- [ ] Create 16 frame
- [ ] Build all 5 state mockups
- [ ] Annotation: "Selection color is #6366f1 (indigo), NOT #3B82F6"
- [ ] Screenshot, verify: 8 resize handles visible on CS-3

---

### Task 24: Screen 17 — Canvas Overlays & Guides

**Frame:** `17 — Canvas Overlays`, 1440×600px

5 overlay examples side by side:
1. **Snap Guides** — teal outlines on all elements
2. **Spacing** — pink/purple distance indicators
3. **Grid** — dot grid or line grid
4. **Badges** — type labels on elements
5. **X-Ray** — dark bg #1a1a2e, wireframe white outlines 1px

**Snap lines:** magenta #FF00FF, opacity 0.85, spanning full canvas

**Drop zones:**
- Valid: 2px dashed rgba(20,184,166,0.6), bg rgba(20,184,166,0.04)
- Invalid: 2px dashed rgba(239,68,68,0.4), bg rgba(239,68,68,0.04) + "Cannot drop here"

**Annotation:** "⚠️ No Rulers toggle in CanvasFooterToolbar — only 5 overlays"

- [ ] Create 17 frame
- [ ] Build 5 overlay examples
- [ ] Screenshot, verify: X-Ray dark bg correct, snap lines magenta

---

### Task 25: Screen 18 — Floating Toolbar & Context Menu

**Frame:** `18 — Floating Toolbar & Context Menu`, 800×600px

**Floating toolbar (top half):**
- h:28px, 8 icon buttons 24×24px + 2 dropdowns
- bg surface-2, border rgba(255,255,255,0.12), radius:8
- Show regular state + delete hover state (red icon, red bg)
- Positioned 12px above a sample element

**Context menu (bottom half):**
- min-width:200px, bg surface-2, border border-light, radius:8, shadow-md
- 4 group items with ▸ chevron: Edit, Insert, Layout, Quick Style
- Separator line
- "Select from Stack ▸" — submenu
- Separator
- "Delete" — destructive (red on hover)

- [ ] Create 18 frame
- [ ] Build floating toolbar using IconBtn refs
- [ ] Build context menu using ContextMenuItem refs
- [ ] Screenshot, verify: toolbar 28px height (not 36px), icon buttons 24×24px (not 28px)

---

### Task 26: Screen 19 — Canvas Footer

**Frame:** `19 — Canvas Footer`, 800×100px

Single 804×40px footer bar:
```
Left side (5 toggle buttons, h:28px each):
  [Snap Guides ●] [Spacing] [Grid] [Badges] [X-Ray]
  ON state: surface-3 + checkmark prefix
  OFF state: transparent, #908D85

Right side:
  [−] [100%] [+] [⤢] [?]
  Each: 24×24px
  100%: 11px mono, click → dropdown [10/25/50/75/100/125/150/200/300%]
```

**Annotation:** "⚠️ NO Rulers toggle — only 5 toggles exist in code"

- [ ] Create 19 frame
- [ ] Build footer with 5 left toggles + 5 right controls
- [ ] Show toggle ON state for "Snap Guides"
- [ ] Screenshot, verify: all controls 24×24px zoom buttons, NOT 28×28px

---

## Chunk 5: Screens 20–24 (Inspector)

### Task 27: Screen 20 — Inspector Header & States

**Frame:** `20 — Inspector Header`, 300×600px

**6 header elements stacked:**
```
Row 1 (h:44): [ElementType icon 16px] [Element Name 14px semibold] — right: [</> DevMode 12px] [× 16px]
Row 2 (h:28): [div tag badge 10px #6366f1] [#hero-section 12px mono #908D85]
Row 3 (h:28): [body > section > div.hero] — breadcrumb, 12px, each segment clickable
Row 4 (h:36): [Layout] [Style] [Behavior] tabs — InspectorTabBar ref
Row 5 (h:28): [Tablet pill] [Mobile pill] — BreakpointIndicator (only 2 pills, no Desktop pill)
Row 6 (h:28): [Normal] [Hover] [Focus] [Active] [Disabled] — PseudoStateSelector
```

**Empty state (second column in frame):**
- "Nothing Selected" 14px semibold, centered
- [Open Build Panel] ghost + [Browse Templates] ghost

**⚠️ KI-3 annotation:** "Label says 'Behavior' but internal ID is 'effects'"

- [ ] Create 20 frame
- [ ] Build 6-row inspector header
- [ ] Build empty state column
- [ ] Screenshot, verify: only Tablet + Mobile pills (NO Watch, NO Desktop pill)

---

### Task 28: Screen 21 — Inspector Layout Tab

**Frame:** `21 — Inspector Layout Tab`, 300×700px

3 always-visible + 2 conditional sections:
```
[AccordionSection: DISPLAY]  h:32 header + 48px content
  - display dropdown: "block ▾" — rect 200×28, fill:surface-3
[AccordionSection: SIZE]     h:32 header + 80px content
  - w: [PropertyRow ref] h: [PropertyRow ref]
  - min-w / max-w / min-h / max-h rows
[AccordionSection: SPACING]  h:32 header + 80px content
  - Box model visual: nested rects (margin/padding visual)
[AccordionSection: FLEXBOX]  h:32 header + 80px content (conditional label: "when display=flex")
  - Direction / Wrap / Justify / Align / Gap rows
[AccordionSection: POSITION] h:32 header (searchable, collapsed)
[AccordionSection: OVERFLOW] h:32 header (searchable, collapsed)
```

**Breakpoint override dot:** 6×6 circle #6366f1, right of property label when overridden

- [ ] Create 21 frame
- [ ] Build 7 accordion sections (5 visible + 2 collapsed)
- [ ] Add override dot example on one property row
- [ ] Screenshot, verify: section headers 10px uppercase, 32px height

---

### Task 29: Screen 22 — Inspector Appearance Tab

**Frame:** `22 — Inspector Appearance Tab`, 300×600px

3 sections:
```
[AccordionSection: TYPOGRAPHY]  (conditional: text elements only)
  - Font family dropdown, size input, weight dropdown
  - Color: ColorSwatch ref
  - Text-align segmented: 4 icons
[AccordionSection: BACKGROUND]
  - ColorSwatch ref + "rgba(0,0,0,0)" text
  - Gradient option, image upload
[AccordionSection: BORDER]
  - Width inputs (4 sides), style dropdown, color swatch
  - Radius inputs (4 corners) + link toggle
```

**Number input spec:**
- 64×28px, bg surface-3, radius 6px, 12px JetBrains Mono, pad 0 6px, text-right

**Unit selector:**
- 32×28px, 10px Inter, #908D85, appended to right of number input

- [ ] Create 22 frame
- [ ] Build 3 sections with number inputs using proper mono font rects
- [ ] Screenshot, verify: number inputs 64×28px with unit selectors

---

### Task 30: Screen 23 — Inspector Effects Tab

**Frame:** `23 — Inspector Effects Tab`, 300×700px

**⚠️ KI-3: UI label says "Behavior" not "Effects" — replicate as-is**

4 sections:
```
[AccordionSection: EFFECTS]
  Shadow row: X Y Blur Spread (4× PropertyRow) + ColorSwatch + Inset toggle
  [+ Add shadow] ghost btn
  Transform: translate/rotate/scale/skew inputs
  Opacity: slider rect
[AccordionSection: ANIMATION]
  Preset dropdown + duration/delay inputs
[AccordionSection: INTERACTIONS]
  Trigger dropdown (Click/Hover/Scroll)
  Action dropdown (Show/Hide/Toggle/Navigate)
[AccordionSection: VISIBILITY]
  Display condition toggles per breakpoint
```

- [ ] Create 23 frame
- [ ] Build 4 sections
- [ ] Add Tab header showing "Behavior" label (with KI-3 annotation)
- [ ] Screenshot

---

### Task 31: Screen 24 — Inspector Multi-Select

**Frame:** `24 — Inspector Multi-Select`, 300×600px

Show 3 states:
1. **Multi-select toolbar** (2+ elements): "3 elements selected" + align/distribute/size/actions
2. **Pseudo-state editing** (hover): amber banner "Editing Hover state" + amber override dots on properties
3. **Dev Mode**: raw CSS editor visible, JetBrains Mono 12px

**MultiSelect layout:**
```
Header: "3 elements selected" — 13px, #F5F5F0
ALIGN (6 icon buttons 28×28px, 2 rows)
Separator Divider
DISTRIBUTE (2 buttons)
Separator
SIZE (Match Width / Match Height)
Separator
ACTIONS (Group / Align to Parent / Delete All — destructive)
```

- [ ] Create 24 frame
- [ ] Build all 3 states
- [ ] Screenshot, verify: amber banner color for pseudo-state

---

## Chunk 6: Screens 25–32 (Modals, Overlays, Utility Screens)

### Task 32: Screen 25 — Modals Catalog

**Frame:** `25 — Modals Catalog`, 1440×1200px

Show 13 modal thumbnails in a grid (4 cols, 3 rows):
Each thumbnail: ~300×200px showing modal at reduced scale

Key modals to show accurately:
1. **WelcomeModal** (640px): "Welcome to Buildrik!" + 3 template cards
2. **TemplatePreviewModal**: full-screen scaled preview + Use This Template btn
3. **ExportModal** (520px): page checkboxes + [Download HTML + CSS]
4. **ProjectSettingsModal** (600px): name, favicon, language
5. **KeyboardShortcuts** (640px): 4 categories (General/Edit/View/Panels) NOT 5
6. **ConfirmDelete** (400px): "Delete this element?" + [Delete] destructive + [Keep] ghost
7. **CreateComponentModal** (440px): name input + preview
8. **CollectionSetupModal** (520px): field definitions, drag handle rows
9. **SaveTemplate** (440px): name + category dropdown
10. **ConflictModal** (440px): OT conflict resolution
11. **BlockPicker** (520px), **IconPicker** (520px), **ImageEditor** (640px)

Standard modal specs:
- bg: surface-1, border: 1px rgba(255,255,255,0.12), radius: 12px
- Backdrop: rgba(0,0,0,0.5) blur(2px)

- [ ] Create 25 frame
- [ ] Build 4 most important modals at full detail (1, 2, 6, 7)
- [ ] Build remaining 9 as simplified thumbnails
- [ ] Screenshot, verify: modal bg is surface-1 (not surface-2), radius 12px

---

### Task 33: Screen 26 — Onboarding Flow

**Frame:** `26 — Onboarding Flow`, 1440×600px (4 steps side by side)

Step 1: WelcomeModal (full detail)
Step 2: OnboardingChecklist floating panel + editor bg
Step 3: SpotlightOverlay — dark bg with cut-out hole, arrow pointer
Step 4: AchievementPrompt toast (bottom-right, green border-left 4px)

Checklist (7 steps):
1. name-project ☑
2. pick-start ☑
3. add-element ☐
4. edit-text ☐
5. change-style ☐
6. preview ☐
7. publish ☐

SpotlightOverlay:
- rgba(0,0,0,0.6) bg
- Cut-out: transparent rect in target area + 8px padding
- Instruction text max-width 280px
- "Explore freely →" escape link: 12px, #B8B5AD

- [ ] Create 26 frame
- [ ] Build all 4 onboarding steps
- [ ] Screenshot, verify: SpotlightOverlay dark bg with lighter cut-out area

---

### Task 34: Screen 27 — Command Palette & Shortcuts

**Frame:** `27 — Command Palette & Shortcuts`, 1440×600px

**Command Palette:**
- 520×60vh, surface-1 bg, border rgba(255,255,255,0.12), radius 12px
- Search input: h:52px, 16px font, auto-focus, border-bottom 1px
- Groups: RECENT / NAVIGATION / EDIT / VIEW / AI / EXPORT
- Each result: h:40px, icon 16px + label 13px + shortcut 11px mono
- Show fuzzy match state: typed "add he" → "Add Heading ⌘" highlighted

**Keyboard Cheat Sheet (640px, 4 categories NOT 5):**
- GENERAL / EDIT / VIEW / PANELS
- Two-column layout
- Keyboard badges: bg surface-3, pad 2px 6px, radius 3px, mono 10px weight 600

**⚠️ Annotation:** "Trigger: Ctrl+Shift+P (NOT Ctrl+K)"
**⚠️ Annotation:** "Panel shortcuts: Ctrl+Shift+[key], NOT single-key A/T/Z etc."

- [ ] Create 27 frame
- [ ] Build command palette with search state + results
- [ ] Build keyboard cheat sheet (4 categories)
- [ ] Screenshot, verify: search input 52px, result rows 40px

---

### Task 35: Screen 28 — CMS Surfaces

**Frame:** `28 — CMS Surfaces`, 800×600px

**3 existing CMS surfaces (what actually exists in code):**
1. **CollectionSetupModal** (520px): name input + field rows with grip/name/type/required/delete
2. **CMS Binding** concept: chain icon on inspector field + dropdown "Bind to data"
3. **Record Navigator**: "Record 1 of 24" + prev/next arrows (above CMS list)

**NOT implemented annotation box:**
- "Does NOT exist: Data category in Build catalog, Chain icon in inspector (not wired), CMS card in Settings"

- [ ] Create 28 frame
- [ ] Build 3 existing surfaces
- [ ] Add "NOT implemented" annotation box with ⚠️KI-10

---

### Task 36: Screen 29 — AI Surfaces

**Frame:** `29 — AI Surfaces`, 800×600px

**3 AI surfaces:**
1. **AIAssistantBar** (Ctrl+J): h:56px, 720px wide, slides from bottom
   - Sparkles icon 20px #818cf8 pulsing
   - Prompt input
   - Quick suggestion chips below (h:24, radius:12, rgba(99,102,241,0.1))

2. **AI Copilot Modal** (640×85vh):
   - "What would you like to build?" 22px weight:700
   - Textarea for prompt
   - Template chips: Landing Page, About, Portfolio etc.
   - [Generate Full Page] primary + [Generate Section] ghost

3. **AI Suggestions in Inspector**:
   - "AI SUGGESTIONS" accordion at BOTTOM of inspector (across all tabs)
   - 3 suggestion cards: sparkles 12px + text + [Apply] ghost
   - [↻ New suggestions] full-width ghost btn

**⚠️KI-12 annotation:** "No discoverable trigger for Copilot — only programmatic openCopilot()"

- [ ] Create 29 frame
- [ ] Build all 3 AI surfaces
- [ ] Screenshot, verify: AIAssistantBar rounded only top corners (radius:12 12 0 0)

---

### Task 37: Screen 30 — Collaboration UI

**Frame:** `30 — Collaboration UI`, 800×500px

4 collaboration elements:
1. **Presence Avatars** (top bar area): avatar stack row-reverse, 28×28px circles
2. **Remote Cursor**: SVG arrow 18×24px in user color + name label below-right
3. **Selection Awareness**: element with foreign user's color outline + name badge
4. **Connection Quality dots** — 4 states: Excellent #4ade80 / Good #facc15 / Poor #f87171 / Disconnected #9ca3af

**⚠️ Marching ants border** for inline edit awareness (dashed border animation annotation)

- [ ] Create 30 frame
- [ ] Build 4 collaboration elements
- [ ] Screenshot

---

### Task 38: Screen 31 — Error, Loading, Empty States

**Frame:** `31 — Error, Loading, Empty States`, 1440×600px

**Per-panel empty states (5 panels — show each):**
- Layers, Components, Media, Inspector, Canvas — all using EmptyState ref + text overrides

**Loading states:**
- Spinner: loader-2 icon 24px #6366f1
- Skeleton shimmer rows (3 rects with shimmer bg animation annotation)

**Error states:**
- Save error: red dot + "Save failed" + Toast ref (error variant)
- AI error: muted icon + "AI temporarily unavailable"
- Upload error: Toast warning variant

**Toast spec correction (vs frames 33-46):**
- Position: **top-right** (NOT bottom-right — this was wrong in wireframing frames)
- Duration: **5000ms** (NOT 3000ms)
- Style: border-left: 4px solid [color] (NOT filled bg)

- [ ] Create 31 frame
- [ ] Build all 5 empty states using EmptyState refs
- [ ] Build loading + error states
- [ ] Screenshot, verify: toasts are top-right, border-left style

---

### Task 39: Screen 32 — Known Issues Annotation Frame

**Frame:** `32 — Known Issues`, 800×700px

Documentation frame (not a screen). List all 13 known issues in a structured annotation table.

| # | Issue | Where | Detail |
|---|-------|-------|--------|
| KI-1 | Components not in rail | Rail | Keyboard-only ⇧A |
| KI-2 | Publish not in rail | Rail | Keyboard-only U |
| KI-3 | Inspector "Behavior" label | Inspector tab 3 | Internal ID is `effects` |
| KI-4 | Publish checklist hardcoded false | Publish tab | All items always incomplete |
| KI-5 | DraftChip subtle | Design tab | Hard to notice |
| KI-6 | Settings Coming Soon no path | Settings → Domains/Analytics | No ETA |
| KI-7 | DevModeToggle buried | Inspector | Not prominent |
| KI-8 | Top bar layout issues | Top bar | Dropdown not segmented, no overflow menu |
| KI-9 | Border contrast below WCAG | Borders | ~1.3:1 ratio |
| KI-10 | CMS UI entry points missing | Build, Inspector | Engine exists, no frontend |
| KI-11 | Compare versions not implemented | History tab | No split view |
| KI-12 | AI Copilot no trigger | AI | Only programmatic |
| KI-13 | Watch breakpoint engine only | Breakpoints | Not in UI |

- [ ] Create 32 frame with amber/red annotation boxes
- [ ] List all 13 issues with source reference
- [ ] Screenshot, verify: all 13 issues documented

---

## Chunk 7: Final Validation

### Task 40: Full File Verification

- [ ] Take screenshot of each frame (01–32) and confirm visible content
- [ ] Verify Component Library: 20+ components exist, grouped by category
- [ ] Run verification checklist from `pencil_prompts.md`:
  - [ ] All 6 shell zones correct dimensions
  - [ ] Device switcher is dropdown NOT segmented
  - [ ] All 8 rail icons in correct order
  - [ ] All 10 sidebar tabs represented
  - [ ] PanelHeader SSOT used by all panel screens
  - [ ] Inspector 3 tabs with correct section counts
  - [ ] All 13 modals thumbnailed in Screen 25
  - [ ] All known issues annotated (KI-1 through KI-13)
  - [ ] No redesign changes — current state only
- [ ] Update wireframing frames (33-46): add note "Built from scratch — rebuild properly using C() from screens 01-32"

---

## Key Design Decisions (Lock These In)

| Decision | Rationale |
|----------|-----------|
| Component Library in separate frame | Changes propagate to all screens automatically |
| Screens assembled via `ref` instances | Enables overriding specific properties per screen |
| Dark theme throughout (#0f0f14 base) | Matches actual Buildrik CSS |
| Token values hardcoded as comments | Pencil variables already set — use color values |
| Each screen = 1 frame at 1440×900px | Consistent viewport, matches spec |
| Known issues annotated inline | Faithful replication — not fixing, documenting |

---

## Execution Order Summary

```
Phase 1 (Component Library) → Tasks 1–7  → ~20 reusable components
Phase 2 (Shell Screens)     → Tasks 8–11 → Screens 01–04
Phase 3 (Panel Tabs)        → Tasks 12–21→ Screens 05–14
Phase 4 (Canvas)            → Tasks 22–26→ Screens 15–19
Phase 5 (Inspector)         → Tasks 27–31→ Screens 20–24
Phase 6 (Modals+Utility)    → Tasks 32–39→ Screens 25–32
Phase 7 (Validation)        → Task 40    → Full verification
```

**Total estimated batch_design calls:** ~80–100 (split into ≤25 ops each)
**Prerequisite:** Design tokens already set ✅

---

*Plan saved: 2026-03-14*
*Pencil file: /Users/shahg/Desktop/pencil/buildrik.pen*
*Spec: pencil_prompts.md + pencil_wireframing.md*
