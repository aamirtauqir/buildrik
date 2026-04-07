# Pencil Prompts — Buildrik Current-State Replication

> **Goal:** Replicate the current Buildrik editor exactly as it exists today in Pencil. This is Phase 1 — faithful current-state replication. Phase 2 (redesign) is a separate effort.
>
> **Rules:**
> 1. Use Pencil MCP tools: `batch_design`, `set_variables`, `batch_get`, `get_guidelines`, `get_screenshot`, `snapshot_layout`, `find_empty_space_on_canvas`
> 2. **PROMPT 0 (Design Tokens) MUST be executed first** via `set_variables` before any screens
> 3. Each prompt = one Pencil frame/artboard
> 4. All specs come from PART 1–9 files — no invention, no redesign changes
> 5. Known issues are replicated faithfully (annotated with ⚠️)
> 6. Dark theme throughout: surfaces from `#0f0f14` to `#2e2e38`

---

## PROMPT 0: DESIGN TOKENS & VARIABLES

**Frame name:** `00 — Design Tokens`
**Source:** PART 7 §2–§6, PART 8 §7
**Pencil tool:** `set_variables`

Set ALL of the following tokens via `set_variables` before creating any screens. These are the `--aqb-*` CSS custom properties that define the entire visual system.

### Surface/Background Tokens
```
--aqb-surface-1: #0f0f14       (primary panels: rail, sidebar, inspector, top bar)
--aqb-surface-2: #16161d       (elevated: cards, context menu, floating toolbar, modals)
--aqb-surface-3: #1e1e26       (interactive: inputs, hover states, toggle off)
--aqb-surface-4: #26262f       (active/pressed: selected items, active toggle)
--aqb-surface-5: #2e2e38       (highest elevation: tooltips, popovers)
--aqb-bg-canvas: #ffffff        (canvas background)
--aqb-bg-dark: (from default.css)
--aqb-bg-darker: #08080e
--aqb-bg-panel: (alias of surface-1)
--aqb-bg-hover: (alias of surface-3)
--aqb-bg-active: (alias of surface-4)
--aqb-bg-elevated: (alias of surface-2)
```

### Primary Colors
```
--aqb-primary: #6366f1          (CTAs, active states, focus rings, selected outlines)
--aqb-primary-hover: #818cf8    (hover on primary buttons)
--aqb-primary-active: #4f46e5   (pressed on primary)
--aqb-primary-light: rgba(99,102,241,0.12)  (subtle bg tints, badges, AI cards)
--aqb-primary-muted: (subtle variant)
--aqb-primary-subtle: (very subtle)
--aqb-secondary: #8b5cf6        (component boundaries, secondary badges)
--aqb-secondary-hover: (hover variant)
```

### Semantic Colors
```
--aqb-success: #22c55e          (saved, published, online)
--aqb-warning: #f59e0b          (pseudo-state indicator, draft chip, degraded connection)
--aqb-error: #ef4444            (errors, delete actions, invalid drop zones)
--aqb-info: #3b82f6             (info toasts)
--aqb-success-light: (light variant)
--aqb-warning-light: (light variant)
--aqb-error-light: (light variant)
--aqb-info-light: (light variant)
```

### Text Colors
```
--aqb-text-primary: #F5F5F0     (headings, active labels)
--aqb-text-secondary: #B8B5AD   (body text, control labels)
--aqb-text-muted: #908D85       (hints, timestamps, section labels)
--aqb-text-tertiary: #A09D96    (tertiary text)
--aqb-text-disabled: #6B6963    (disabled text)
--aqb-text-inverse: #1A1A1A     (text on light backgrounds)
```

### Border Tokens
```
--aqb-border: rgba(255,255,255,0.08)          (default structural borders)
--aqb-border-light: rgba(255,255,255,0.12)    (more visible borders, hover)
--aqb-border-subtle: rgba(255,255,255,0.06)   (very subtle separators)
--aqb-border-focus: rgba(59,130,246,0.5)       (input focus border — blue, not indigo)
--aqb-border-hover: (hover variant)
```

### Border Radius
```
--aqb-radius-xs: 3px
--aqb-radius-sm: 5px
--aqb-radius-md: 8px
--aqb-radius-lg: 12px
--aqb-radius-xl: 16px
--aqb-radius-2xl: 24px
--aqb-radius-full: 9999px
```

### Shadows
```
--aqb-shadow-xs: 0 1px 2px rgba(0,0,0,0.2)
--aqb-shadow-sm: 0 2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.2)
--aqb-shadow-md: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.25)
--aqb-shadow-lg: 0 8px 24px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.3)
--aqb-shadow-xl: 0 16px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.35)
--aqb-shadow-2xl: 0 24px 56px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.4)
--aqb-shadow-inner: inset 0 1px 2px rgba(0,0,0,0.25)
--aqb-shadow-glow: 0 0 20px rgba(59,130,246,0.25)
```

### Duration
```
--aqb-duration-instant: 50ms
--aqb-duration-fast: 100ms
--aqb-duration-normal: 150ms
--aqb-duration-moderate: 200ms
--aqb-duration-slow: 300ms
--aqb-duration-slower: 400ms
```

### Typography
```
UI font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif
Mono font: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace
```

---

## PROMPT 1: EDITOR SHELL (6-Zone Layout)

**Frame name:** `01 — Editor Shell`
**Source:** PART 3 §3.1–§3.3
**Pencil tool:** `batch_design` — create main layout frame

Create the 6-zone editor shell at **1440×900px** (reference viewport):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOP BAR (52px height)                             │
│  Full width, fixed, z-index: 1000                                           │
├──────────┬────────────────┬───────────────────────────┬─────────────────────┤
│   RAIL   │  LEFT SIDEBAR  │          CANVAS            │    INSPECTOR        │
│  (56px)  │   (280px)      │         (flex: 1)          │     (300px)         │
│  fixed   │  [drawer mode] │                            │   [right panel]     │
│  left    │  overflow-y:   │                            │   overflow-y:       │
│  full-h  │  auto          │                            │   auto              │
│          │                │   CANVAS FOOTER (40px)     │                     │
└──────────┴────────────────┴───────────────────────────┴─────────────────────┘
```

**Exact dimensions:**

| Zone | Width | Height | Background | z-index | Border |
|------|-------|--------|------------|---------|--------|
| Top Bar | 1440px (100%) | 52px | `--aqb-surface-1` (#0f0f14) | 1000 | border-bottom: 1px solid rgba(255,255,255,0.08) |
| Rail | 56px (CSS var) / 60px (TS) / 68px (CSS fallback) | 848px (900-52) | `--aqb-surface-1` (#0f0f14) | 900 | border-right: 1px solid rgba(255,255,255,0.08) |
| Left Sidebar | 280px (CSS var) / 320px (TS) | 848px | `--aqb-surface-1` (#0f0f14) | 800 | — |
| Canvas | 752px (1440-68-320-300) | 808px (848-40) | `#ffffff` | 1 | — |
| Canvas Footer | 752px | 40px | `--aqb-surface-1` (#0f0f14) | 100 | border-top: 1px solid rgba(255,255,255,0.08) |
| Inspector | 300px | 848px | `--aqb-surface-1` (#0f0f14) | 800 | — |

**Canvas width formula:**
`viewport_width − 56 (rail) − 280 (sidebar) − 300 (inspector) = 804px at 1440`
> **⚠️ Note:** CSS vars say rail=56px, sidebar=280px. TS constants say rail=60px, sidebar=320px. CSS fallback says rail=68px. Use CSS var values as runtime truth.

**Minimum viewport:** 1024×768. Below this → full-screen message: "Buildrik is designed for desktop. Open on a computer for the best experience."

---

## PROMPT 2: TOP BAR

**Frame name:** `02 — Top Bar`
**Source:** PART 3 §3.4–§3.5
**Pencil tool:** `batch_design`

**Container:** 1440×52px, bg: `--aqb-surface-1` (#0f0f14), border-bottom: 1px solid rgba(255,255,255,0.08)

**5-section layout (actual code structure):**

```
SECTION 1 (left)    SECTION 2       SECTION 3 (center)     SECTION 4        SECTION 5 (right)
┌───────────────┬──────────────┬──────────────────────┬───────────────┬─────────────────────────┐
│ [Logo][Name]  │ [↶] [↷]     │ [Device Dropdown ▾]  │ [Save Status] │ [Preview] [Publish]     │
│               │              │                      │ [Sync] [Issues]│ [👤][👤][+3]           │
└───────────────┴──────────────┴──────────────────────┴───────────────┴─────────────────────────┘
```

**8 primary controls (not 9 — actual codebase):**

| # | Control | Size | Visual |
|---|---------|------|--------|
| 1 | Logo + Project Name | Logo: 20px icon, Name: 14px semibold, truncated 160px | Color: #F5F5F0. Click → Project Settings modal |
| 2 | Undo | 32×32px icon button | Lucide `undo-2`. Disabled: 30% opacity. Tooltip: "Undo — Ctrl+Z" |
| 3 | Redo | 32×32px icon button | Lucide `redo-2`. Disabled: 30% opacity. Tooltip: "Redo — Ctrl+Y" |
| 4 | Device Switcher | **Dropdown** (not segmented control) | Desktop / Tablet / Mobile options. Dropdown select, not tabs. |
| 5 | Save Status | Dot 8px + Text 12px | Green #22c55e "Saved ✓" / Blue #4b8dff pulsing "Saving…" / Red #ef4444 "Save failed" |
| 6 | Sync Status | 8px dot | Green=synced, Amber=syncing, Red=offline/error |
| 7 | Issues Badge | 32×32px icon button | Shows count |
| 8 | Preview + Publish | auto×32px, pad 12px 16px | Preview: ghost. Publish: bg #6366f1, white text |

**⚠️ Note:** There is NO overflow menu (···). Device switcher is a dropdown, NOT a segmented 3-button control.

**Top bar states to show:**
1. Idle (saved) — green dot, "Saved 2:45 PM"
2. Saving — blue pulsing dot, "Saving..."
3. Save error — red dot, "Save failed"
4. Collaborators present — presence avatar stack visible
5. Offline — gray sync dot

**Presence avatars (right side):**
- Stack: `flex-direction: row-reverse`, max 4 + overflow "+N" badge
- Each: 28×28px, border-radius: 50%, border: 2px solid #0f0f14
- User initials centered, 11px Inter weight 700, white
- Colors cycle: #6366f1, #ec4899, #14b8a6, #f59e0b, #8b5cf6
- Online dot: 8×8px green #22c55e, bottom-right

---

## PROMPT 3: NAVIGATION RAIL

**Frame name:** `03 — Navigation Rail`
**Source:** PART 3 §3.6
**Pencil tool:** `batch_design`

**Container:** 56px wide (CSS var `--aqb-sidebar-width`), full height below top bar, bg: `--aqb-surface-1` (#0f0f14), border-right: 1px solid rgba(255,255,255,0.08)

**8 icons in 2 zones with flex spacer:**

```
┌──────────┐
│  TOP (5) │
│  [+]     │  1. Add          — A         (Lucide: SvgPlus)
│  [img]   │  2. Media        — J         (Lucide: SvgImage)
│  [stack] │  3. Layers       — Z         (Lucide: SvgLayers)
│  [tmpl]  │  4. Templates    — T         (Lucide: SvgTemplates)
│  [file]  │  5. Pages        — P         (Lucide: SvgPages)
│          │
│  (flex)  │  SPACER (flex-grow: 1)
│          │
│ BOTTOM(3)│
│  [pal]   │  6. Design       — D         (Lucide: SvgPalette)
│  [set]   │  7. Settings     — S         (Lucide: SvgSettings)
│  [clk]   │  8. History      — H         (Lucide: SvgClock)
└──────────┘
```

- Icon size: 20px, label: 12px below icon
- RailTab height: 52px (not 44px)
- Rail width: 56px (CSS var `--aqb-sidebar-width`)
- Vertical gap: 4px between icons

**⚠️ Known issue:** Components (⇧A) and Publish (U) are NOT in the rail — keyboard-only tabs.

**Icon states (show all 4):**

| State | Background | Icon Color | Extra |
|-------|-----------|------------|-------|
| Default | transparent | #908D85 (muted) | — |
| Hover | transparent | brighter | color transition |
| Active (panel open) | `rgba(124,109,250,0.12)` bg + 3px left indicator bar `#7c6dfa` | `#7c6dfa` icon color | NOT a pill — it's a left-border bar + subtle bg |
| Focused (keyboard) | transparent | — | 2px solid teal outline, offset 2px |

**Tooltip spec (show example):**
- Position: right of icon, 8px gap
- Content: "[Tab Label] — [Shortcut]" + subtitle
- Bg: #2e2e38, text 11px, shortcut 10px mono, pad 6px 10px, radius 6px, shadow-sm
- Arrow: 6px triangle pointing left
- Delay: 200ms

---

## PROMPT 4: PANEL HEADER & SWITCHING

**Frame name:** `04 — Panel Header & States`
**Source:** PART 3 §3.8
**Pencil tool:** `batch_design`

**Standard panel header (SSOT for ALL 10 panels):**

```
┌────────────────────────────────────────────────────────┐
│ [Tab icon 16px] [Tab Name 14px semibold]    [📌] [✕]  │
└────────────────────────────────────────────────────────┘
Height: 48px | Padding: 0 10px 0 12px
Background: --aqb-surface-1
Border-bottom: 1px solid rgba(255,255,255,0.08)
```

| Element | Spec |
|---------|------|
| Tab icon | 16px Lucide, #B8B5AD, 8px gap to title |
| Tab Name | 14px Inter, weight 600, #F5F5F0 |
| Pin icon | 16px Lucide `pin`/`pin-off`, #908D85, hover: #B8B5AD |
| Close icon | 16px Lucide `x`, #908D85, hover: #B8B5AD |
| Pin↔Close gap | 4px |

**Show 4 panel states:**

| State | Width | Visual |
|-------|-------|--------|
| Closed | 0px (rail only visible) | Rail icons visible, no sidebar content |
| Open-unpinned | 320px | Standard panel. Closes on outside click. |
| Open-pinned | 320px | Border-right: 2px solid #6366f1. Stays open on outside click. Pin icon: `pin-off` |
| Expanded | 400px (max) | Wider panel via drag. Resize handle on right edge. |

**Panel widths:**
- Compact: 280px
- Default: 320px
- Extended: 400px (max)
- Collapsed: 0px

**Panel content padding:** 16px all sides
**Section headers:** flush with content padding

---

## PROMPT 5: BUILD TAB (Add)

**Frame name:** `05 — Build Tab`
**Source:** PART 3 §3.7, PART 2 §3
**Pencil tool:** `batch_design`

**Panel header:** [SvgPlus 16px] "Add" [pin] [close] — 48px, standard pattern

**Content structure:**

1. **Search bar** — full width, 32px height, bg: surface-3, border: 1px solid border, radius 6px, placeholder: "Search elements...", Lucide `search` 14px left

2. **Element catalog — 6 categories** (accordion sections):
   - Basic (Heading, Text, Image, Button, Link, Divider, Spacer)
   - Layout (Section, Container, Columns, Grid)
   - Forms (Form, Input, Textarea, Select, Checkbox, Radio, Label)
   - Media (Video, Audio, Map, Embed)
   - Sections (Hero, Feature, CTA, Footer, Navbar, Testimonial)
   - E-commerce (Product Card, Cart, Pricing)
   - Advanced (Custom Code, HTML Embed)

3. **Element card grid:** 4 columns, 8px gap in 280px-wide content area
   - Each card: bg surface-2, border 1px border, radius 8px, pad 8px
   - Icon: 24px Lucide, centered
   - Label: 10px Inter, centered below icon, #B8B5AD
   - Hover: bg surface-3, border-light
   - Draggable: cursor grab

4. **Favorites section** (hidden if 0 favorites)
5. **My Components section** (hidden if 0 components)

**OnboardingTip (first-time):** "Start by adding elements to your canvas. Drag from above or click to insert." + dismiss × button

---

## PROMPT 6: MEDIA TAB

**Frame name:** `06 — Media Tab`
**Source:** PART 2 §3, PART 3 §3.7, PART 8 §4.1
**Pencil tool:** `batch_design`

**Panel header:** [SvgImage 16px] "Media" [pin] [close]

**Content:**

1. **Upload zone** — dashed border area, "Drop files here or click to upload"

2. **Type filter pills** (horizontal scroll, 6px gap):
   - [All] [Images] [Videos] [Documents] [Audio] [SVG]
   - Active pill: #6366f1 bg, white text
   - Inactive: surface-3 bg, #B8B5AD text
   - Height: 28px, font: 12px, pad: 4px 12px

3. **Library grid** — 3 columns, 4px gap
   - Each thumbnail: square, border-radius 6px, object-fit cover
   - Hover: overlay with filename, size, type

4. **Stock discovery tab** — search stock photos

5. **Multi-select** — Shift+click to select multiple, action bar appears

6. **Asset detail overlay** — click asset for full preview + metadata

**Empty state (per type filter):**
- Center: [type icon 32px, #908D85 at 0.3 opacity]
- "No images yet"
- "Upload your first image or browse stock photos."
- [Upload] button + [Browse Stock] link

**Supported formats:** JPEG, PNG, SVG, GIF, WebP, AVIF (no PDF)

---

## PROMPT 7: LAYERS TAB

**Frame name:** `07 — Layers Tab`
**Source:** PART 2 §3, PART 3 §3.7, PART 8 §4.1
**Pencil tool:** `batch_design`

**Panel header:** [SvgLayers 16px] "Layers" [pin] [close]

**Content:**

1. **Element tree** — hierarchical list showing page structure
   - Each row: 32px height, indent per nesting level (16px per level)
   - Icon: element-type Lucide icon 14px
   - Label: element name or type, 13px Inter
   - Visibility toggle: Lucide `eye`/`eye-off` 14px, right side
   - Selected row: bg rgba(99,102,241,0.12)
   - Hover: bg surface-3

2. **Drag-to-reorder** — grip handle on left, drag between rows to reorder

3. **Canvas sync** — clicking a layer item selects it on canvas; selecting on canvas highlights in layers

4. **Nesting indicators** — indent lines showing parent-child relationships

**Empty state:**
- Center: [layers icon 32px, #908D85 at 0.3 opacity]
- "No elements on this page"
- "Add elements from the Build tab."
- [Open Build Tab] ghost button

---

## PROMPT 8: TEMPLATES TAB

**Frame name:** `08 — Templates Tab`
**Source:** PART 2 §3, PART 3 §3.7, PART 8 §3
**Pencil tool:** `batch_design`

**Panel header:** [SvgTemplates 16px] "Templates" [pin] [close]

**Content:**

1. **Filter chips** (horizontal scroll):
   - [All] [Pages] [Sections] [Landing Pages] [E-commerce]
   - Same pill style as media filters

2. **Template grid** — 2 columns, 8px gap
   - Each card: screenshot thumbnail, border-radius 8px, bg surface-2
   - Below thumbnail: template name 13px semibold
   - Hover: border-light, shadow-sm
   - Click → TemplatePreviewModal

3. **Save as template** — entry from Build tab overflow or canvas context menu

**Template application flow:**
1. Click card → TemplatePreviewModal (full-screen, scaled preview)
2. "Use This Template" primary button
3. If existing content → TemplateUseDrawer: "Replace entire page" / "Add as new section"
4. ApplyProgressOverlay: spinner + "Applying template..." on rgba(0,0,0,0.6) bg
5. Complete: template rendered, zoom-to-fit

---

## PROMPT 9: PAGES TAB

**Frame name:** `09 — Pages Tab`
**Source:** PART 2 §3, PART 3 §3.7
**Pencil tool:** `batch_design`

**Panel header:** [SvgPages 16px] "Pages" [pin] [close]

**Content:**

1. **Page list** — vertical list
   - Each row: 40px height, page name 13px Inter, page icon
   - Active page: bg rgba(99,102,241,0.12), bold text
   - Hover: bg surface-3
   - Right-click → context menu (Rename, Duplicate, Delete, Set as Home)

2. **Add page button** — bottom of list, ghost button "[+ Add Page]"

3. **Per-page settings drawer** (drill-in when clicking page settings icon):
   - **SEO section:** Title, Meta Description, Canonical URL
   - **Social section:** OG Title, OG Description, OG Image
   - **Advanced section:** Custom CSS, Custom JS, Slug

**Always has at least 1 page (home) — no true empty state.**

---

## PROMPT 10: COMPONENTS TAB

**Frame name:** `10 — Components Tab`
**Source:** PART 2 §3, PART 3 §3.7, PART 8 §4.1
**Pencil tool:** `batch_design`

**⚠️ Known issue:** Components tab is keyboard-only (⇧A) — NOT in rail. Replicate this.

**Panel header:** [SvgComponents 16px] "Components" [pin] [close]

**Content:**

1. **Component library grid** — similar to Build tab layout
   - Each component card: icon + name + usage count badge
   - Click → component detail screen

2. **Detail screen:**
   - Component preview
   - "Create from selection" action
   - Usage count ("Used 5 times")
   - Edit / Delete actions

3. **Create from selection:** select element on canvas → right-click → "Create Component" → modal with name input + preview

**Empty state:**
- Center: [component icon 32px, muted at 0.3 opacity]
- "No components yet"
- "Select an element on the canvas and click Create, or right-click → Create Component."
- [Create Component] ghost button

---

## PROMPT 11: DESIGN SYSTEM TAB

**Frame name:** `11 — Design System Tab`
**Source:** PART 2 §3, PART 3 §3.7
**Pencil tool:** `batch_design`

**Panel header:** [SvgPalette 16px] "Design" [pin] [close]

**Content — 3 token sections (accordion pattern):**

1. **Colors section:**
   - Color token swatches in a grid
   - Each: 28×28px swatch + name + hex value
   - [+ Add color] button
   - Click swatch → color picker popover

2. **Typography section:**
   - Type scale list showing font/size/weight combos
   - [+ Add type style] button

3. **Spacing section:**
   - Spacing token values
   - [+ Add spacing] button

4. **Export dropdown:** [CSS] [JSON] [SCSS/Tailwind] format options

5. **Draft workflow:**
   - DraftChip: pulsing amber dot + "N drafts" count
   - [Review Changes] button → Review modal
   - Review modal: diff view (old → new), affected elements count
   - [Apply All] / [Discard] actions

**⚠️ Known issue:** DraftChip is visually subtle — replicate current subtle appearance.

---

## PROMPT 12: SETTINGS TAB

**Frame name:** `12 — Settings Tab`
**Source:** PART 2 §3, PART 3 §3.7–§3.8
**Pencil tool:** `batch_design`

**Panel header:** [SvgSettings 16px] "Settings" [pin] [close]

**Pattern B — Card Drill-In:**

**Home view — 6 cards grid:**

| # | Card | Icon | Description |
|---|------|------|-------------|
| 1 | Site | globe | Site name, favicon, language |
| 2 | Domains | link | Coming Soon — LockedScreen |
| 3 | Analytics | bar-chart | Coming Soon — LockedScreen |
| 4 | Export | download | HTML/CSS download, format options |
| 5 | Integrations | plug | Formspree, Netlify, Stripe, etc. |
| 6 | Advanced | code | Custom code, SEO defaults |

- Each card: bg surface-2, radius 8px, pad 16px, gap 8px between cards
- Click → drill into sub-screen

**DrillInHeader spec:**
```
[← arrow-left 16px] [Sub-screen title 14px semibold]     [action buttons]
Height: 44px
```

**LockedScreen (Coming Soon):**
- Feature description text
- [Notify Me] email capture or ETA text
- Disabled state visual

**⚠️ Known issue:** "Coming Soon" gives no path forward — replicate as-is.

---

## PROMPT 13: PUBLISH TAB

**Frame name:** `13 — Publish Tab`
**Source:** PART 2 §3, PART 5 §5
**Pencil tool:** `batch_design`

**⚠️ Known issue:** Publish tab is keyboard-only (U) — NOT in rail. Replicate this.

**Panel header:** [SvgRocket 16px] "Publish" [pin] [close]

**Content:**

1. **Status badge:**
   - Draft: gray badge "Draft"
   - Published: green badge "Published" with checkmark
   - Updated needed: amber badge

2. **Published URL:** `buildrik.app/{projectId}` with copy button (Lucide `copy`)

3. **Pre-publish checklist:**
   - ☐ Has content
   - ☐ Has SEO title
   - ☐ Has meta description
   - ☐ Has social image
   - Each with navigation hint ("Go to Pages → SEO")

4. **Action buttons:**
   - [Publish Site] — primary, bg #6366f1
   - [Update Site] — primary (when already published)
   - [Unpublish] — destructive ghost

5. **Publishing state:** button disabled, "Publishing..." with spinner

**⚠️ Known issue:** Pre-publish checklist items are hardcoded `false` — all show incomplete regardless of actual state. Replicate this.

---

## PROMPT 14: HISTORY TAB

**Frame name:** `14 — History Tab`
**Source:** PART 2 §3, PART 5 §4
**Pencil tool:** `batch_design`

**Panel header:** [SvgClock 16px] "History" [pin] [close]

**Content:**

1. **[Save current version]** button — top of panel, ghost button

2. **Named versions section** (accordion):
   - Each row: version name, timestamp, user avatar
   - "Current" badge on active version (green)
   - Hover → [Restore] button appears
   - Max 64 chars for version name

3. **Auto-saves section** (accordion):
   - Each row: "Auto-saved" + relative timestamp
   - Lighter visual weight than named versions

4. **Activity view** — log of changes

**Restore flow:**
- Click [Restore] → ConfirmDialog: "Restore to [name]? Your current changes will be saved as an auto-save first."
- [Restore] destructive + [Cancel] ghost

**⚠️ Note:** Compare versions is NOT implemented — do not show compare UI.

---

## PROMPT 15: CANVAS — DEFAULT & EMPTY STATES

**Frame name:** `15 — Canvas Default States`
**Source:** PART 4 §4.1–§4.2, PART 8 §2
**Pencil tool:** `batch_design`

**Show 3 canvas states:**

### State 1: New Project — Blank Canvas
- Canvas bg: #ffffff
- CanvasEmptyCTA centered (see below)
- Sidebar: closed
- Inspector: empty state

### State 2: Template Applied
- Canvas shows template content
- No CanvasEmptyCTA
- Zoom: auto-fit

### State 3: Returning User
- Canvas restored from auto-save
- Sidebar restored from localStorage
- Save status: "Auto-saved 2m ago"

### CanvasEmptyCTA Spec:
- Position: absolute, inset 0, margin 20px
- Bg: rgba(248,250,252,0.85) (light translucent)
- Border: 3px dashed #e2e8f0
- Radius: 16px
- Padding: 40px, text-align center
- Icon: custom inline SVG, 48×48px, color #818cf8, opacity 0.7
- Heading: "Your Canvas is Empty" — 20px, color #1e293b
- Description: "Start with a template or build from scratch"
- [Browse Templates] — primary button with gradient
- [Start Blank] — ghost/underline button

---

## PROMPT 16: CANVAS — SELECTION & INTERACTION STATES

**Frame name:** `16 — Canvas Selection States`
**Source:** PART 4 §4.3–§4.6
**Pencil tool:** `batch_design`

**Show these states on canvas elements:**

### Hover (CS-2):
- Teal outline: 2px solid rgba(20,184,166,0.6)
- Type badge: 10px Inter weight 500, white on teal bg, pad 1px 6px, radius 3px
- Badge position: absolute, top -16px, left 0
- Fade in: 100ms ease

### Single Selected (CS-3):
- Indigo outline: 2px solid #6366f1
- 8 resize handles (see below)
- Floating toolbar above element
- Outline: instant (0ms)

### Multi-selected (CS-5):
- Each element: 2px solid #6366f1 (no individual handles)
- Group bounding box: 1px dashed rgba(99,102,241,0.4)
- MultiSelectToolbar replaces floating toolbar

### Inline Edit (CS-6):
- Lighter outline: #818cf8
- Blinking cursor inside text
- Text formatting toolbar

### Marquee Select (CS-9):
- Rect: 1px dashed #6366f1, bg rgba(99,102,241,0.08), animated dash offset

### Resize Handles (8 points):
- Each: 8×8px, radius 50%, bg white, border 1.5px solid #6366f1
- Positions: TL, TC, TR, ML, MR, BL, BC, BR
- Cursors: nw/n/ne/w/e/sw/s/se-resize
- During drag: dimension tooltip "320 × 240" — 11px JetBrains Mono, bg rgba(0,0,0,0.75), white, pad 2px 8px, radius 4px

---

## PROMPT 17: CANVAS — OVERLAYS & GUIDES

**Frame name:** `17 — Canvas Overlays`
**Source:** PART 4 §4.7–§4.8
**Pencil tool:** `batch_design`

**5 overlay types (no Rulers toggle in actual code):**

| # | Overlay | Visual When Active |
|---|---------|-------------------|
| 1 | Snap Guides | Teal outlines on all elements |
| 2 | Spacing | Pink/purple distance indicators between elements |
| 3 | Grid | Dot grid or line grid over canvas |
| 4 | Badges | Small type labels on each element |
| 5 | X-Ray | Wireframe: bg #1a1a2e, elements as 1px solid rgba(255,255,255,0.3), type labels 9px JetBrains Mono |

> **⚠️ Rulers overlay does NOT have a toggle in CanvasFooterToolbar.** Only 5 toggles exist.

**Snap lines:**
- Threshold: 6px
- Color: magenta #FF00FF, opacity 0.85, shadow: 0 0 3px rgba(255,0,255,0.4)
- Horizontal + vertical spanning full canvas
- Zoom-aware thickness: 1/(zoom/100) px

**Drop zones:**
- Valid: 2px dashed rgba(20,184,166,0.6), bg rgba(20,184,166,0.04)
- Invalid: 2px dashed rgba(239,68,68,0.4), bg rgba(239,68,68,0.04) + "Cannot drop here"
- Insert indicator: 2px solid #6366f1, animated pulse

---

## PROMPT 18: FLOATING TOOLBAR & CONTEXT MENU

**Frame name:** `18 — Floating Toolbar & Context Menu`
**Source:** PART 4 §4.5, §4.9
**Pencil tool:** `batch_design`

### Floating Toolbar (above selected element):

**Container:**
- height: **28px** (not 36px), inline-flex, gap 2px, pad 4px
- bg: #16161d (surface-2)
- border: 1px solid rgba(255,255,255,0.12)
- radius: 8px
- shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.25)
- Position: 12px above element top, centered. Flips below if near top bar.
- z-index: 200

**8 buttons + 2 dropdown menus (each button 24×24px, icons 12×12px, radius 6px):**

| # | Icon (Lucide) | Tooltip | Shortcut |
|---|---------------|---------|----------|
| 1 | `arrow-up-from-dot` | "Select Parent" | — |
| 2 | `copy-plus` | "Duplicate — Ctrl+D" | Ctrl+D |
| 3 | `chevron-up` | "Move Up — Ctrl+]" | Ctrl+] |
| 4 | `chevron-down` | "Move Down — Ctrl+[" | Ctrl+[ |
| 5 | `clipboard-copy` | "Copy — Ctrl+C" | Ctrl+C |
| 6 | `square-dashed-bottom` | "Wrap in Container" | — |
| 7 | `trash-2` | "Delete — Del" | Delete |
| 8 | `more-horizontal` (⋯) | "More" | — (dropdown submenu) |
| D1 | Layout dropdown | Layout options | — |
| D2 | Style dropdown | Quick style options | — |

- Default: transparent bg, #B8B5AD icon
- Hover: surface-3 bg, #F5F5F0 icon
- Delete hover: #ef4444 icon, bg rgba(239,68,68,0.12)
- Button size: **24×24px** (not 28×28px). Icon size: **12×12px** (not 16px).

### Context Menu (right-click):

**Container:** min-width 200px, max-width 280px, pad 4px 0, bg surface-2, border 1px border-light, radius 8px, shadow-md, z-index 5000

**4 group submenus + standalone items (actual code structure — NOT 15 flat items):**

| Group | Items |
|-------|-------|
| **Edit** submenu | Cut (Ctrl+X), Copy (Ctrl+C), Paste (Ctrl+V), Duplicate (Ctrl+D) |
| **Insert** submenu | Add element options |
| **Layout** submenu | Bring to Front, Bring Forward, Send Backward, Send to Back, Wrap in Container |
| **Quick Style** submenu | Style presets |
| Standalone | Select from Stack → (submenu via `elementStack` context), Delete (destructive) |

- "Select from Stack" uses `elementStack` tracked in context state to show overlapping elements
- Each item: h 32px, pad 0 12px, gap 8px
- Icon: 14px, #908D85 | Label: 13px Inter, #F5F5F0 | Shortcut: 11px JetBrains Mono, #5a584f
- Hover: bg surface-3 | Destructive hover: bg rgba(239,68,68,0.12), color #ef4444
- Separator: 1px solid rgba(255,255,255,0.06), margin 4px 8px

---

## PROMPT 19: CANVAS FOOTER TOOLBAR

**Frame name:** `19 — Canvas Footer`
**Source:** PART 4 §4.8, PART 3 §3.3
**Pencil tool:** `batch_design`

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Snap Guides ●] [Spacing] [Grid] [Badges] [X-Ray]     [-] 100% [+] [Fit] [?] │
└───────────────────────────────────────────────────────────────────────────┘
Height: 40px | Background: --aqb-surface-1 | Border-top: 1px solid rgba(255,255,255,0.08)
```

**5 overlay toggle buttons (left side) — NO Rulers toggle in actual code:**

Each button:
- h 28px, pad 0 10px, radius 6px, font 11px Inter weight 500, no border
- OFF: transparent bg, #908D85. Hover: surface-3, #B8B5AD
- ON: bg **surface-3 + checkmark** (not indigo bg)
- Toggles: **Snap Guides**, Spacing, Grid, Badges, X-Ray

**Zoom controls (right side):**

| Control | Size | Spec |
|---------|------|------|
| Zoom out [-] | **24×24px** | icon button, Lucide `minus` |
| Zoom level [100%] | text | 11px mono, click → zoom dropdown **[10/25/50/75/100/125/150/200/300%]** |
| Zoom in [+] | **24×24px** | icon button, Lucide `plus` |
| Zoom to fit | **24×24px** | Lucide `maximize-2` |
| Help [?] | **24×24px** | Lucide `help-circle` → keyboard shortcuts modal |

---

## PROMPT 20: INSPECTOR — STRUCTURE & HEADER

**Frame name:** `20 — Inspector Header`
**Source:** PART 4 §4.10–§4.11
**Pencil tool:** `batch_design`

**Container:** 300px wide, full height below top bar, bg: surface-1

**Inspector header (6 structural elements, fixed — does not scroll):**

```
ELEMENT 1: [ElementType icon 16px] [Element Name 14px semibold]  [</> DevMode] [× delete]
ELEMENT 2: [Tag badge + ID display]
ELEMENT 3: [Breadcrumb: body > section > div.hero]  — click any to select
ELEMENT 4: [Layout] [Style] [Behavior]  — 3 tab buttons
ELEMENT 5: [Tablet] [Mobile]  — BreakpointIndicator (only 2 pills, NOT 4)
ELEMENT 6: [Normal] [Hover] [Focus] [Active] [Disabled]  — PseudoStateSelector
```

> **⚠️ Actual code has 6 header elements, not 8 rows.** No separate [Search sections...] or [Collapse All/Expand All] rows in header.

**ELEMENT 4 — Tab buttons:**
- Internal IDs: `layout`, `appearance`, `effects`
- Display labels: "Layout", "Style", **"Behavior"** ← ⚠️ Known issue: label says "Behavior" but should be "Effects"
- Active tab: 13px weight 600, #F5F5F0, underline
- Inactive: 13px weight 400, #B8B5AD

**ELEMENT 5 — BreakpointIndicator:** Only **Tablet** (768) + **Mobile** (375) pills. Desktop is the default (no pill). **Watch is NOT in the UI** (exists in engine only).

**ROW 6 — Pseudo-state buttons:** Normal + 4 pseudo-states. Active button has amber dot when overrides exist.

**Empty state (IS-1 — nothing selected):**
- "Nothing Selected" heading
- [Open Build Panel] ghost button
- [Browse Templates] ghost button

---

## PROMPT 21: INSPECTOR — LAYOUT TAB (3 base + conditionals)

**Frame name:** `21 — Inspector Layout Tab`
**Source:** PART 4 §4.12
**Pencil tool:** `batch_design`

**3 base sections + 2 conditional + 2 searchable (actual code structure):**

| # | Section | Controls | Visibility |
|---|---------|----------|------------|
| 1 | **Display** | display dropdown (block/flex/grid/inline/none) | Always |
| 2 | **Size** | width, height, min-w, max-w, min-h, max-h — number inputs + unit selectors | Always |
| 3 | **Spacing** | margin/padding visual box model editor — 4-sided input with linked toggle | Always |
| 4 | **Flexbox** | Direction, wrap, justify, align, gap | **Conditional:** only when display=flex |
| 5 | **Grid** | Columns, rows, gap, template areas | **Conditional:** only when display=grid |
| 6 | **Position** | position dropdown (static/relative/absolute/fixed/sticky), top/right/bottom/left inputs | Searchable |
| 7 | **Overflow** | overflow-x, overflow-y dropdowns | Searchable |

> **⚠️ Not 7 fixed sections as originally documented.** 3 are always visible, 2 appear conditionally, 2 are in searchable/expanded view.

**Section accordion spec:**
- Header: 32px height, pad 0 16px, cursor pointer
- Label: 10px Inter, weight 600, uppercase, letter-spacing 0.5px, #908D85
- Chevron: 12px, #908D85, rotates on expand (150ms ease)
- Body: pad 8px 16px 12px 16px
- Border between sections: 1px solid rgba(255,255,255,0.06)
- Hover header: bg surface-3

**Breakpoint override dot:** 6px circle, #6366f1, appears next to property label when overridden at non-desktop breakpoint. Hover tooltip: "Overridden at [breakpoint]. Desktop value: [value]"

---

## PROMPT 22: INSPECTOR — APPEARANCE TAB (3 Sections)

**Frame name:** `22 — Inspector Appearance Tab`
**Source:** PART 4 §4.12
**Pencil tool:** `batch_design`

**3 sections:**

| # | Section | Controls |
|---|---------|----------|
| 1 | **Typography** | Conditional: only for text-containing elements. Font family dropdown, size, weight, line-height, letter-spacing, color swatch, text-align segmented, text-decoration, text-transform |
| 2 | **Background** | Color swatch + picker, gradient editor, image upload, background-size/position/repeat |
| 3 | **Border** | Width (4 sides), style dropdown, color swatch, radius (4 corners + linked toggle) |

**Color swatch:** 28×28px, radius 6px, border 1px border, shows current color. Click → color picker popover.

**Number input:** 64×28px, radius 6px, bg surface-3, border 1px border, font 12px JetBrains Mono, color #F5F5F0, pad 0 6px, text-align right.

**Unit selector:** 32×28px, font 10px Inter, #908D85, appended right of number input. Options: px, %, rem, em, vw, vh, auto.

---

## PROMPT 23: INSPECTOR — EFFECTS TAB (4 Sections)

**Frame name:** `23 — Inspector Effects Tab`
**Source:** PART 4 §4.12
**Pencil tool:** `batch_design`

**⚠️ Known issue:** UI label says "Behavior" not "Effects" — replicate this.

**4 sections:**

| # | Section | Controls |
|---|---------|----------|
| 1 | **Effects** | Box shadows (multiple), transforms (translate/rotate/scale/skew), filters (blur/brightness/contrast/etc.), opacity slider |
| 2 | **Animation** | Animation presets, duration, delay, iteration, timing function |
| 3 | **Interactions** | Click/hover/scroll triggers → actions (show/hide/toggle/navigate/custom) |
| 4 | **Visibility** | Display conditions, responsive visibility toggles per breakpoint |

**Shadow editor row:**
- X offset, Y offset, Blur, Spread — 4 number inputs
- Color swatch
- Inset toggle
- [+ Add shadow] button
- Delete icon per shadow

**Transform controls:**
- translate X/Y, rotate, scale X/Y, skew X/Y
- Number inputs with unit selectors

---

## PROMPT 24: INSPECTOR — MULTI-SELECT & SPECIAL STATES

**Frame name:** `24 — Inspector Multi-Select`
**Source:** PART 4 §4.13
**Pencil tool:** `batch_design`

### IS-3: MultiSelectToolbar (when 2+ elements selected)

**Layout:**

```
┌─────────────────────────────────────────┐
│  [N] elements selected                   │
├─────────────────────────────────────────┤
│  ALIGN (6 buttons):                      │
│  [⬛⬜⬜] [⬜⬛⬜] [⬜⬜⬛]  — horizontal │
│  [⬛⬜⬜] [⬜⬛⬜] [⬜⬜⬛]  — vertical   │
├─────────────────────────────────────────┤
│  DISTRIBUTE (2 buttons):                 │
│  [↔ Horizontal] [↕ Vertical]            │
├─────────────────────────────────────────┤
│  SIZE (2 buttons):                       │
│  [Match Width] [Match Height]            │
├─────────────────────────────────────────┤
│  ACTIONS (3 buttons):                    │
│  [Group] [Align to Parent] [Delete All]  │
└─────────────────────────────────────────┘
```

- Align buttons: 6 icons for left/center/right + top/middle/bottom
- Distribute: 2 buttons for horizontal/vertical distribution
- Size: Match Width / Match Height of first-selected element
- Actions: Group, Align to Parent, Delete All (destructive)

### IS-4: Pseudo-state editing
- Amber banner at top: "Editing [Hover/Focus/Active/Disabled] state"
- Override indicators: amber dots on properties with pseudo-state overrides

### IS-5: Dev Mode
- CSS editor visible in effects area
- Raw CSS code view, JetBrains Mono 12px

---

## PROMPT 25: MODALS CATALOG

**Frame name:** `25 — Modals Catalog`
**Source:** PART 5 §8, PART 6 §12
**Pencil tool:** `batch_design`

**Standard modal container:**
- bg: surface-1 (#0f0f14)
- border: 1px solid rgba(255,255,255,0.12)
- radius: 12px
- shadow: shadow-xl
- Backdrop: rgba(0,0,0,0.5), backdrop-filter blur(2px), z-index 4000
- Entry: opacity 0 + scale(0.96) → opacity 1 + scale(1), 150ms ease-out

**13 modals to show (thumbnail per modal):**

| # | Modal | Width | Key Content |
|---|-------|-------|-------------|
| 1 | WelcomeModal | **640px** (not 520px) | "Welcome to Buildrik!" + 3 template cards + "Start with blank canvas →" |
| 2 | TemplatePreviewModal | full-screen | Scaled preview + [Use This Template] + [Cancel] |
| 3 | ExportModal | 520px | Page checkboxes + [Download HTML + CSS] + Coming Soon formats (React/Vue/Next.js) |
| 4 | CollectionSetupModal | 520px | Collection name + field definitions + [Create Collection] |
| 5 | CreateComponentModal | 440px | Name input + preview frame + [Create] |
| 6 | ProjectSettingsModal | 600px | Site name, favicon, language settings |
| 7 | KeyboardShortcuts | 640px | Two-column layout, **4 categories** (General, Edit, View, Panels) |
| 8 | ConflictModal | 440px | OT conflict resolution |
| 9 | SaveTemplate | 440px | Name + category dropdown + [Save] |
| 10 | ConfirmDelete | 400px | "Delete this [type]?" + [Delete] destructive + [Keep] ghost |
| 11 | BlockPicker | 520px | Block/element selection |
| 12 | IconPicker | 520px | Icon search and selection grid |
| 13 | ImageEditor | 640px | Crop, resize, filter tools |

---

## PROMPT 26: ONBOARDING FLOW

**Frame name:** `26 — Onboarding Flow`
**Source:** PART 5 §9, PART 6 §1.1, PART 8 §4.2
**Pencil tool:** `batch_design`

**4-step flow:**

### Step 1: WelcomeModal (first visit only, completedCount=0)
- "Welcome to Buildrik!" heading
- Project name input
- [Browse Templates] primary + [Start Blank] ghost

### Step 2: OnboardingChecklist (floating panel, bottom-right)
- **7 steps:**
  1. name-project
  2. pick-start
  3. add-element
  4. edit-text
  5. change-style
  6. preview
  7. publish
- Each step: checkbox + label + auto-complete via events
- Progress indicator

### Step 3: SpotlightOverlay
- Dims everything except target area
- Pointer/arrow toward target
- Step instruction text
- **"Explore freely →"** escape link

### Step 4: AchievementPrompt
- Celebratory micro-animation on each step completion
- "Element added!" / "Text edited!" etc.
- Confetti animation on final step (publish)

---

## PROMPT 27: COMMAND PALETTE & KEYBOARD SHORTCUTS

**Frame name:** `27 — Command Palette & Shortcuts`
**Source:** PART 3 §3.12, PART 5 §6–§7
**Pencil tool:** `batch_design`

### Command Palette (Cmd+Shift+P / Ctrl+Shift+P — NOT Ctrl+K):

**Container:**
- width: 520px, max-height: 60vh
- position: fixed, top 20%, centered horizontally
- bg: surface-1 (#0f0f14)
- border: 1px solid rgba(255,255,255,0.12)
- radius: 12px
- shadow: shadow-xl
- Backdrop: rgba(0,0,0,0.5), blur(2px), z-index 4000

**Layout:**
- Search input: h 52px, font 16px Inter, #F5F5F0, border-bottom 1px border, auto-focus
- Fuzzy match, 50ms debounce
- Result groups: RECENT, NAVIGATION, EDIT, VIEW, AI, EXPORT
- Each result row: h 40px, pad 0 16px, icon 16px + label 13px + shortcut 11px mono
- Hover: surface-3. Focused: rgba(99,102,241,0.12)
- Entry: opacity 0 + translateY(-8px) → opacity 1 + translateY(0), 150ms ease-out

### Keyboard Cheat Sheet (? key):

**Container:** width 640px, max-height 80vh

**Two-column layout, 4 categories (NOT 5):**
- GENERAL (basic app-wide shortcuts)
- EDIT (Ctrl+Z, Ctrl+Y, Ctrl+D, Ctrl+C, Ctrl+X, Ctrl+V, Delete)
- VIEW (zoom, canvas controls)
- PANELS (Ctrl+Shift+T, Ctrl+Shift+E, Ctrl+Shift+A, Ctrl+Shift+C — NOT single-key shortcuts like A/T/Z)

> **⚠️ Panel shortcuts use Ctrl+Shift+[key] combos, not the single-key shortcuts (A, T, Z, P etc.) shown in rail tooltips.**

Each row: h 28px, action label 13px + keyboard badges
Badges: bg surface-3, pad 2px 6px, radius 3px, border 1px border, font 10px JetBrains Mono weight 600

---

## PROMPT 28: CMS SURFACES

**Frame name:** `28 — CMS Surfaces`
**Source:** PART 5 §1
**Pencil tool:** `batch_design`

**⚠️ CRITICAL:** Most CMS UI entry points do NOT exist in codebase. Replicate only what exists.

### What exists:
1. **CollectionSetupModal** — 520×80vh, field definitions with drag reorder
   - Collection name input
   - Field rows: [grip handle] [name input] [type dropdown] [required toggle] [delete]
   - Field types: Text, Image, Number, Boolean, Date, URL, Richtext, Reference
   - [+ Add field] ghost button
   - [Cancel] ghost + [Create Collection] primary

2. **CMS binding concept:**
   - Chain icon (Lucide `link`, 12px) on bindable inspector fields
   - Binding dropdown: 280×320px, "Bind to data" header, search, collection groups
   - Bound state: field shows "BlogPosts.title" in 11px JetBrains Mono #6366f1

3. **CMS Preview:** Record navigator above CMS List — "Record 1 of 24" + prev/next arrows

### What does NOT exist (show as annotation):
- No "Data" category in Build catalog
- No chain icon in inspector (not wired)
- No CMS card in Settings → Integrations

---

## PROMPT 29: AI SURFACES

**Frame name:** `29 — AI Surfaces`
**Source:** PART 5 §3
**Pencil tool:** `batch_design`

### 1. AIAssistantBar (Ctrl+J):
- Slides up from bottom of canvas, above footer
- h 56px, max-w 720px, centered
- bg: surface-2, border: 1px solid rgba(99,102,241,0.25), radius: 12px 12px 0 0
- shadow: 0 -4px 20px rgba(0,0,0,0.3)
- Layout: [✨ sparkles 20px #818cf8 pulsing] [prompt input flex] [Generate btn] [× close]
- Quick suggestion chips below (hidden on typing): "Add a hero section", "Create a contact form", etc.
- Chips: h 24px, pad 0 10px, radius 12px, bg rgba(99,102,241,0.1), border rgba(99,102,241,0.2)

### 2. AI Copilot Modal:
- 640×85vh, bg surface-1, border rgba(99,102,241,0.2), radius 16px
- "What would you like to build?" — 22px weight 700
- Textarea for prompt
- Template chips: Landing Page, About, Portfolio, etc.
- [Generate Full Page] primary + [Generate Section] ghost
- Generating state: sparkles spinning + progress bar + cycling text

### 3. AI Suggestions in Inspector:
- Standalone section at BOTTOM of entire inspector (across all tabs, NOT inside Effects tab)
- "AI SUGGESTIONS" accordion label
- 3 suggestion cards: h 36px, bg rgba(99,102,241,0.06), border rgba(99,102,241,0.12)
- Each: sparkles 12px #818cf8 + text 12px + [Apply] ghost
- [↻ New suggestions] full-width ghost button

---

## PROMPT 30: COLLABORATION UI

**Frame name:** `30 — Collaboration UI`
**Source:** PART 5 §2, PART 3 §3.5
**Pencil tool:** `batch_design`

### 1. Presence Avatars (top bar):
- See PROMPT 2 for avatar stack spec
- Hover tooltip: name 12px semibold + activity "Editing Hero Section" 11px muted

### 2. Remote Cursors on Canvas:
- SVG arrow: 18×24px, filled with user color
- Drop shadow: filter drop-shadow(0 1px 2px rgba(0,0,0,0.3))
- Name label: 8px right, 20px below — 10px Inter weight 600, white on user-color bg, pad 2px 6px, radius 3px
- Fade: active → idle 3s → opacity 0.4 (500ms) → idle 10s → opacity 0 (500ms)

### 3. Selection Awareness:
- Remote user's selected element: outline 2px solid [user-color] (not indigo)
- Name badge above: 10px Inter weight 600, white on user-color, pad 1px 6px, radius 3px
- Inline editing: marching ants border + "Sarah editing..." badge

### 4. Connection Quality:
- Dot: 8px, radius 50%
- Excellent: **#4ade80** | Good: **#facc15** | Poor: **#f87171** | Disconnected: **#9ca3af**
- Pulsing on degraded/poor: 2s ease-in-out infinite (opacity 0.5–1.0)

---

## PROMPT 31: ERROR / LOADING / EMPTY STATES

**Frame name:** `31 — Error, Loading, Empty States`
**Source:** PART 6 §12, PART 8 §4.1, §10
**Pencil tool:** `batch_design`

### Per-panel empty states (show each):

| Panel | Icon | Heading | Description | Action |
|-------|------|---------|-------------|--------|
| Layers | layers 32px, 0.3 opacity | "No elements on this page" | "Add elements from the Build tab." | [Open Build Tab] ghost |
| Components | component 32px | "No components yet" | "Select an element on the canvas and click Create..." | [Create Component] ghost |
| Media | type-icon 32px | "No [type] yet" | "Upload your first [type] or browse stock." | [Upload] + [Browse Stock] |
| Inspector | — | "Nothing Selected" | — | [Open Build Panel] + [Browse Templates] ghost |
| Canvas | layout icon 48px | "Your Canvas is Empty" | "Start with a template or build from scratch" | [Browse Templates] + [Start Blank] |

### Loading states:
- Spinner: Lucide `loader-2` spinning, 24px, #6366f1
- Label below: "Loading..." 13px Inter, #B8B5AD
- Skeleton shimmer rows for content areas

### Error states:
- Save error: red dot, "Save failed", toast with [Retry]
- AI error: "AI temporarily unavailable" with muted icon and retry
- Upload error: toast with format/size guidance
- Offline: gray sync dot, "Offline — changes saved locally"

### Toast notifications:
- Position: **top-right** (not bottom-center)
- Container: bg surface-2, radius 8px, shadow-md, pad 12px 16px
- **Border-left: 4px solid [variant color]**
- Icon 16px + message 13px Inter weight 500
- Variants: success (green), error (red), warning (amber), info (blue)
- Duration: **5000ms** (5s) default (not 3000ms)
- Dismiss: × button or auto-dismiss

---

## PROMPT 32: KNOWN ISSUES ANNOTATION FRAME

**Frame name:** `32 — Known Issues (Faithful Replication)`
**Source:** PART 1 §2.4, scattered across all PARTs
**Pencil tool:** `batch_design`

Create a single annotation frame listing all known current-state issues being faithfully replicated. This frame is reference-only — not a screen to implement, but documentation for anyone reviewing the Pencil output.

### Issues faithfully replicated:

| # | Issue | Where | Details |
|---|-------|-------|---------|
| KI-1 | Components not in rail | Rail | Keyboard-only via ⇧A. Not in RAIL_SLOTS. Zero discoverability for mouse users. |
| KI-2 | Publish not in rail | Rail | Keyboard-only via U. Critical action requires knowing shortcut. |
| KI-3 | Inspector "Behavior" label | Inspector ROW 4 | Internal ID is `effects` but UI label shows "Behavior". Rename pending. |
| KI-4 | Publish checklist hardcoded false | Publish tab | All 4 checklist items (hasContent, hasSeoTitle, hasMetaDesc, hasSocialImg) hardcoded to `false`. Always show incomplete. |
| KI-5 | Design System DraftChip subtle | Design tab | DraftChip is visually subtle — hard to notice. |
| KI-6 | Settings "Coming Soon" no path forward | Settings → Domains/Analytics | LockedScreen with description but no ETA or email capture. |
| KI-7 | DevModeToggle buried | Inspector | Toggle is in inspector controls row, not prominently visible. |
| KI-8 | Top bar layout | Top bar | Current top bar has 8 controls in 5-section layout. Device switcher is dropdown not segmented control. No overflow menu exists. |
| KI-9 | Border contrast below WCAG | Borders | `rgba(255,255,255,0.08)` on `#0f0f14` = ~1.3:1 ratio. Below 3:1 minimum for non-text elements. |
| KI-10 | CMS UI entry points missing | Build tab, Inspector | Engine (CollectionManager, CMSBindingManager) is fully implemented but no frontend UI wired. |
| KI-11 | Compare versions not implemented | History tab | No compare methods, no split-view, no [Compare] button. |
| KI-12 | AI Copilot no discoverable trigger | AI | No keyboard shortcut or UI button to open Copilot. Only programmatic `openCopilot()`. |
| KI-13 | Watch breakpoint in engine only | Breakpoints | BreakpointIndicator shows only Tablet + Mobile pills (Desktop is default, no pill). Watch (196px) exists in engine but not in UI. |

---

## Verification Checklist

After generating all 32 frames, verify against PART files:

- [ ] All 6 shell zones present with correct dimensions (PART 3)
- [ ] All 8 top bar controls — device switcher is dropdown (PART 3 §3.5)
- [ ] All 8 rail icons in correct order (PART 3 §3.6)
- [ ] All 10 sidebar tabs represented (PART 3 §3.7)
- [ ] Panel header SSOT pattern used everywhere (PART 3 §3.8)
- [ ] 17 canvas states acknowledged (PART 4 §4.11)
- [ ] Inspector 3 tabs with correct section counts: Layout=3 base+conditionals, Style=3, Behavior=4 (PART 4)
- [ ] All 13 modals (PART 5 §8)
- [ ] Onboarding 4-component flow (PART 5 §9)
- [ ] All empty states per panel (PART 8 §4.1)
- [ ] All design tokens set (PART 7 §2–§6)
- [ ] All 13 known issues annotated (PART 1 §2.4 + scattered)
- [ ] No redesign changes applied — current state only
