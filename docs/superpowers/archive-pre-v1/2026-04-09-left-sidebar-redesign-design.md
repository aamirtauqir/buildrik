# Left Sidebar Redesign — Add Tab, Templates Tab, Media Tab

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pixel-perfect implementation of the Add, Templates, and Media tabs from the `new.left.pen` design file — all states, all screens, no exceptions.

**Architecture:** Light-theme-first. Remove `aqb-dark` class from demo. All three tabs get new CSS with `--ls-*` light tokens. Existing component files are refactored in-place under `editor/sidebar/tabs/`. No new routing layers. All CSS uses BEM-style class prefixes: `bld-*` (Build/Add), `tpl-*` (Templates), `med-*` (Media).

**Design source:** `/Users/shahg/Desktop/codex/new.left.pen`

**Tech stack:** React 18, TypeScript, Vite, Emotion/CSS-in-JS, Lucide React icons, Inter font

---

## Design Tokens

```css
/* Light theme — panel shell */
--ls-panel-bg: #F8FAFC;
--ls-panel-border: #D1D9E6;       /* inside right stroke */
--ls-panel-border-alt: #E2E8F0;   /* outside right stroke (8h/8i/8j/8l variants) */
--ls-content-bg: #F1F5F9;
--ls-surface: #FFFFFF;

/* Brand */
--ls-primary: #1D4ED8;
--ls-primary-dark: #1E40AF;
--ls-primary-bg: #DBEAFE;

/* Text */
--ls-text-primary: #0F172A;
--ls-text-secondary: #334155;
--ls-text-muted: #475569;
--ls-text-faint: #64748B;
--ls-text-placeholder: #94A3B8;

/* Borders */
--ls-border: #E2E8F0;
--ls-border-strong: #D1D9E6;
--ls-border-cancel: #CBD5E1;
--ls-border-dialog: #D8E0EA;

/* Status */
--ls-success-bg: #dcfce7;
--ls-success-text: #166534;
--ls-warning-bg: #FEF3C7;
--ls-warning-text: #92400E;
--ls-error-bg: #FEE2E2;
--ls-error-text: #FCA5A5;
--ls-amber-bg: #FEF2F2;
--ls-destructive: #EF4444;
--ls-destructive-light: #FCA5A5;
--ls-green-check: #22C55E;
--ls-green-check-dark: #4ADE80;

/* Overlays */
--ls-overlay: rgba(0,0,0,0.4);
--ls-shadow-menu: rgba(0,0,0,0.25);
--ls-shadow-dialog: rgba(0,0,0,0.2);
```

---

## Section 1: Global Theme — Remove Dark Class

Remove `aqb-dark` from `<html>` in `demo/main.tsx`. This switches the entire editor to light theme, using the `--ls-*` tokens already defined in `LeftSidebar.css` (unconditional `:root` block).

---

## Section 2: Add Tab — 8 Screens

### Panel Shell (all 8 screens)

- Width: 280px, fill `#F8FAFC`, right border 1px `#D1D9E6` (inside)
- Header (P5fr0): "Add" at 14px/600/`#0F172A`, padding `[0,12]`, bottom border 1px `#E2E8F0`
  - In fsI8j + GmdOe screens: pin icon (lucide `pin`, 16×16 `#64748B`) and close icon (lucide `x`, 16×16 `#64748B`) visible in header
- Content area: fill `#F1F5F9`, padding 16px all sides, gap 12px, layout vertical

### Mode Switch (pill container)

- Container: cornerRadius 999, fill `#F1F5F9`, padding 2px, gap 4px
- Active pill: fill `#FFFFFF`, stroke 1px `#D1D9E6` inside, cornerRadius 999, text 13px/500/`#0F172A`
- Inactive pill: fill `#F1F5F9`, no stroke, cornerRadius 999, text 13px/400/`#64748B`
- Exception — RzB6V: plain row, gap 8px, no container fill/cornerRadius/padding

### Search Bar

- fill `#FFFFFF`, stroke 1px `#D1D9E6`, cornerRadius 4px, height 36px, padding `[0,10]`, gap 8px
- Search icon: lucide `search`, 14×14, `#64748B`
- Placeholder: 12px/normal/`#94A3B8`
- Focus state: stroke `#1D4ED8` 1px (blue ring)
- Active search (QFUVG): typed text fill `#0F172A`, X clear button (lucide `x`, 14×14, `#64748B`)

### Section Labels (ref c47Z3)

- Uppercase, labels used: "QUICK PICKS", "QUICK INSERT", "RECENT", "CATEGORY BROWSE", "SECTION FAMILIES", "READY TO INSERT"

### Quick Pick Chips (refs PcGJY / dMgOj)

- Pill shape, cornerRadius 999
- Active (dMgOj): fill `#FFFFFF`, stroke 1px `#D1D9E6`
- Inactive (PcGJY): fill `#F1F5F9`, no stroke
- Arranged in rows of 3, gap 6px per row

### Category Accordion

- Row height: 20px
- Text: 13px, active category weight 600, inactive 500, color `#0F172A`
- Chevron: lucide `chevron-right`, 14×14, `#94A3B8`
- Accordion items (oIjNm): width 248px fixed
- Categories: Basic, Layout, Forms, Media, Navigation, Interactive

### The 8 Screens

| Screen | Mode | Quick Zone Label | Special |
|--------|------|-----------------|---------|
| **asCNI** — Elements browse (no AI) | Elements active | "QUICK PICKS" | 2×3 chips: Heading, Text, Button / Image, Input, Grid. Basic category expanded. |
| **RzB6V** — Elements root | Elements active | "QUICK INSERT" | Same 6 chips. Mode switch is plain row (gap 8px, no pill container). |
| **nTVi6** — Elements expanded | Elements active | "RECENT" | 3 chips: Heading, Button, Image. Cat/Basic expanded showing sub-element rows. |
| **SDgR2** — Sections | **Sections active** | "SECTION FAMILIES" | Hero chip (active=white), Features, Pricing / FAQ, CTA, Footers. "READY TO INSERT": 3 section cards (86px tall each): "Hero split"/"Two-column intro with CTA", "Feature band"/"Three feature cards with icons", "Pricing stack"/"Tiered pricing with comparison cards". Bottom hint: "Sections insert into the current page." 11px/600/`#0F172A` + "Use New Page > Templates for full-page starts." 10px/normal/`#64748B`. |
| **fsI8j** — Pin popover | Elements active | "QUICK PICKS" | Header shows pin+close icons. Popover overlay for customizing pinned picks. |
| **GmdOe** — FTUE tooltip | Elements active | "QUICK PICKS" | Header shows pin+close icons. First-time tooltip for Quick Picks zone. |
| **QFUVG** — Search results | Elements active | _(hidden)_ | Blue focus ring on search. Mode tabs full-width. Results grouped by category. Empty state: "Not seeing the right block? / Use Browse tab or clear the query." |
| **gnyrB** — No results + AI | Elements active | _(hidden)_ | Sparkle icon 28px/`#94A3B8`. "No matching block in Add" 13px/600/`#0F172A` centered. AI suggestion card: `#FFFFFF`, stroke `#E2E8F0`, cornerRadius 8, padding 12px. Shortcut: "/ opens AI outside the sidebar." 10px/`#94A3B8`. |

---

## Section 3: Templates Tab — 16 Screens

### Panel Shell (all screens)

- Full-width panel: 1380px (1440 − 60px rail), fill `#FFFFFF`, layout vertical
- Header: h=48, padding `[0,24]`, bottom border 1px `#E2E8F0`
- Search wrapper: h=40, padding `[2,24]`. Input: fill `#F1F5F9`, stroke `#E2E8F0` 1px, cornerRadius 4, h=36, padding `[0,10]`, search icon 16×16 `#94A3B8`, placeholder 13px/normal/`#94A3B8`
- Category pills row: h=48, padding `[10,24]`, gap 8, bottom border 1px `#E2E8F0`. Pill: h=28, cornerRadius 20, padding `[0,16]`, text 12px/500. Active=fill `#1D4ED8` text `#FFFFFF`. Inactive=fill `#FFFFFF` stroke `#E2E8F0` text `#475569`.
- Sub-category tags row (when present): h=44, padding `[10,24]`, gap 8, bottom border 1px `#E2E8F0`. Tag: h=24, cornerRadius 14, padding `[0,12]`, text 12px. Active tag=fill `#DBEAFE` text `#1E40AF` weight 600. Inactive=fill `#F1F5F9` text `#475569`.
- Grid: 2×4 cards, padding 24, gap 16. Cards: fill `#FFFFFF`, stroke `#E2E8F0` 1px, cornerRadius 8, clip true, layout vertical.
- Pagination bar: h=48, fill `#F8FAFC`, top border 1px `#E2E8F0`, padding `[0,24]`, gap 6, centered. Buttons 32×32, cornerRadius 6. Prev/Next: fill `#FFFFFF`, stroke `#E2E8F0`, chevron 16×16 `#94A3B8`. Active page: fill `#1D4ED8`, text `#FFFFFF`, 13px/500. Inactive: fill `#FFFFFF`, stroke `#E2E8F0`, text `#475569`.
- Icon buttons in header (Search, Close): 32×32, fill `#F1F5F9`, cornerRadius 6.
- All CTAs/dialogs: buttons h=36, cornerRadius 6, padding `[0,16]`.
- Detail panel: 420px wide, cornerRadius 8, padding 20, gap 16, stroke `#E2E8F0` 1px.

### Browse Flow (Screens 4 → 5 → 6 → 7)

**Screen 4 — Templates Root (2ihz1):**
- Header title: "Templates" 18px/600/`#0F172A`. Search + Close buttons in header.
- 8 category pills: All (active `#1D4ED8`), Landing Page, Portfolio, Blog, E-commerce, Coming Soon, Dashboard, SaaS.
- 2 rows × 4 template cards.
- Pagination: 3 pages.

**Screen 5 — Filtered View (foBlu):**
- Same header. Pills switch to 2 primary tabs: "Page Templates" / "Section Templates".
- Sub-category tags row below pills (Landing Page, Portfolio, Blog, **E-commerce** active).
- 1 row × 4 filtered cards.

**Screen 6 — Card Detail (cV3OT):**
- Header becomes breadcrumb: `arrow-left` 14×14 `#64748B` + "Back to grid" 11px/500/`#64748B` + `chevron-right` 12×12 `#94A3B8` + "Landing Page" 11px/600/`#0F172A`.
- Grid dims to opacity 0.4.
- Detail panel slides in from right (420px): preview image h=240 fill `#F1F5F9`, info block, action buttons.

**Screen 7 — Apply States (3pR56):** 4 dialog states, all 420×360, cornerRadius 8, padding 20, gap 16, stroke `#D8E0EA`:
- **Confirm:** "Apply Template?" 16px/600. Amber block fill `#FEF3C7` text `#92400E`: "This will replace your current page content. This action cannot be undone." Cancel (stroke `#CBD5E1`, text `#475569`) + Replace (fill `#1D4ED8`, text `#FFFFFF`).
- **Progress:** loader icon 32×32 `#1D4ED8`, "Applying template…" 15px/600, progress bar (h=4, track `#F1F5F9`, fill `#1D4ED8`, ~58%, cornerRadius 2), subtitle 13px/`#475569`.
- **Error:** circle-alert 32×32 `#FCA5A5`, "Couldn't apply template." Error block fill `#FEE2E2`. Try Again: stroke `#1D4ED8`, text `#1D4ED8`.
- **Success Toast:** Page preview + toast 300×48 fill `#1E293B`, cornerRadius 8: circle-check 18×18 `#4ADE80` + "Template applied successfully!" 13px/500/`#F8FAFC`.

**Screen 7c+d — Cancel+Success CTA (WUJbY):** 2 more dialog states (420×360, stroke `#D8E0EA`):
- **Stop dialog:** "Stop applying?" 16px/600. Warning block fill `#FEF2F2` text `#FCA5A5`: "Your page is being updated. Stopping now may leave it in an incomplete state." Buttons: "Continue applying" (fill `#1D4ED8`) + "Stop" (fill `#EF4444`).
- **Success+CTA:** circle-check 40×40 `#22C55E`, "Template applied!" 16px/600, subtitle `#64748B`, page preview thumb fill `#F1F5F9` cornerRadius 6 with "Your page" label 11px/`#94A3B8`. Buttons: "View Page" (fill `#1D4ED8`) + "Close" (stroke `#CBD5E1`).

### Loading + Empty States (4c, 5c)

**Screen 4c — Loading (l5Zoz):**
- Header has spinner: loader icon 18×18 `#64748B` in place of action buttons.
- Pills shown as skeleton blocks (fixed-width, fill `#1D4ED8`/`#F1F5F9`, cornerRadius 20). No text.
- Grid replaced by skeleton card placeholders + 200px side skeleton panel.

**Screen 5c — No Results (XLKtB):**
- Search input has blue focus ring `#1D4ED8`.
- Grid area replaced by empty state (centered): "No templates match your search" + "Try different keywords or clear the search" + "Clear search" btn (h=32, fill `#FFFFFF`, stroke `#E2E8F0`, cornerRadius 6, padding `[0,12]`).
- Pagination bar shows no page numbers.

### New Page Flow (4b → 5b → 6b → 7b → 7b-s/7b-e)

**Screen 4b — New Page Context (DYk2w):**
- Header title: "Choose a template for your new page" 15px/600/`#0F172A` (smaller than default 18px).
- Context chip in header: cornerRadius 999, fill `#DBEAFE`, h=28.
- Same grid+pills as Screen 4.

**Screen 5b — New Page Filtered (v6Jqj):**
- Same as Screen 5 but header has "Choose a template…" + context chip "New Page" fill `#DBEAFE`.

**Screen 6b — Template Detail New Page (oj2MI):**
- Same as Screen 6 but breadcrumb uses new-page context.
- Third pill in row is amber (fill `#FEF3C7`) indicating "Creating" state.

**Screen 7b — Create Confirm (fiLNZ):** Dialog 420×300, shadow blur=24 `#00000033` offset y=4, cornerRadius 8, padding 20, stroke `#D1D9E6`:
- "Create page?" 16px/600/`#0F172A`.
- Row: layout-template icon 14×14 `#64748B` + "Using: Landing Page — Modern" 13px/normal/`#64748B`.
- Buttons: Cancel (stroke `#CBD5E1`) + "Create page" (fill `#1D4ED8`).

**Screen 7b-s — Post-Confirm Success (uMJFZ):** Dialog 420×300, same shadow:
- circle-check 36×36 `#166534`, "Page created!" 18px/600/`#0F172A`.
- "Your new page has been created from the template and is ready to edit." 13px/`#64748B`.
- Buttons: Close (stroke `#CBD5E1`) + "Go to page" (fill `#1D4ED8`).

**Screen 7b-e — Post-Confirm Error (9NalZ):** Dialog 420×300:
- circle-alert 36×36 `#FCA5A5`, "Couldn't create page" 18px/600/`#0F172A`.
- Error block fill `#FEE2E2`. Buttons: Cancel + "Try again" (fill `#1D4ED8`).

### Additional Detail States (6c, 6d, 6e)

**Screen 6c — Card Detail Preview Loading (Ba4uo):** Standard card detail layout. Detail panel (420px) shows preview pane in loading state (spinner inside).

**Screen 6d — Card Detail Preview Error (Onr0C):** Detail panel shows error state for preview pane with retry affordance inside.

**Screen 6e — Section Templates Tab (A3VFy):** "Section Templates" pill active (fill `#1D4ED8`). "Page Templates" inactive. Detail panel shows section template info.

---

## Section 4: Media Tab — 23 Screens

### Panel Shell (all screens)

- Width: 280px, fill `#F8FAFC`, right border 1px `#D1D9E6` inside (most screens) or 1px `#E2E8F0` outside (8h/8i/8j/8l).
- Header (P5fr0): "Media" 14px/600/`#0F172A`, x=12 y=13.5, pin icon at x=236, close icon at x=252. Bottom border 1px `#E2E8F0`.
- Content area: layout vertical, gap 10, padding 16.

### Persistent Component Refs

| Ref | Spec |
|-----|------|
| **7miex** Search | h=36, fill `#FFFFFF`, stroke 1px `#D1D9E6`, cornerRadius 4, padding `[0,10]`, gap 8. Icon: search 14×14 `#64748B`. Placeholder: "Search…" 12px/`#94A3B8`. Focused: stroke `#1D4ED8`. |
| **RM6ol** Upload Zone | w=248, h=80, fill `#F1F5F9`, stroke 2px `#CBD5E1` inside, cornerRadius 8. Upload icon 20×20 `#475569` + "Drag files or click to browse" 10px/normal/`#475569` centered. |
| **deowH** Failure Strip | w=280, h=40, fill `#FEE2E2`, stroke 1px `#D1D9E6` inside, cornerRadius 6, padding `[0,10]`. Text "3 uploads failed" 13px/500/`#92400E` + spacer + "Retry All" btn (h=28, cornerRadius 4, stroke 1px `#92400E`, text 12px/`#92400E`). |
| **wwumi** Drag-Active Zone | Drag-over variant of upload zone (highlighted state). Used in jwG0u + Z2INT. |
| **dWjtV** Thumbnail | Normal thumbnail card. |
| **sw8Zi** Thumbnail Selected | Selected thumbnail variant. |
| **d2o8e** Thumbnail Unsupported | Unsupported file thumbnail variant. |
| **Al9jG** Selection Banner | Bottom selection/action banner component. |

### Root + Loading + Empty (4 screens)

**Screen 8 Root (aPaxB):** Search + Upload Zone (w=248) + Failure Strip (w=248) + Media Grid (3 rows, gap 8). Baseline populated library view.

**Screen 8d Loading Skeleton (zo5Gr):** Panel Content: search + skeleton loader (ref 2ucnc, fill_container). No grid, no upload zone.

**Screen 8e Empty State (FbIuN):** Search + Upload Zone + empty state component (ref 0TW7B, fill_container). No grid.

**Media/Empty (JMoMN):** Search + Upload Zone + `mediaEmptyClean` frame (layout vertical, padding `[28,16]`, gap 10, centered):
- image-plus icon 30×30 `#94A3B8`
- "Media library is empty" 13px/600/`#0F172A`
- Description 11px/normal/`#475569` centered (fixed-width)
- CTA buttons frame (collapsed)
- Hint: "Uploaded assets appear here as selectable thumbnails after the first import." 10px/normal/`#94A3B8` centered

### Upload Flow (6 screens)

**Screen 8b Upload Progress (HBPfb):** Search + Upload Zone (fill_container) + 2-row grid. Plus absolute overlay pinned at bottom of panel: upload progress bar (ref PJ4Aa) at x=60, y=852, w=280. Text: "3 files uploading…"

**Screen 8c Upload Error (QMOZP):** Failure Strip elevated to panel level (between header and Panel Content). Override text: "Upload failed: photo-03.jpg". Panel Content: search + Upload Zone + 2-row grid.

**Screen 8f Drag Active (Z2INT):** Panel Content: drag-active zone (ref wwumi, fill_container, **h=120**) + single horizontal ThumbRow with 3 `dWjtV` thumbnail refs. No search bar inside content.

**Media/Upload-DragActive (jwG0u):** Earlier drag variant. Search + drag-active zone (ref wwumi, fill_container) + Failure Strip + 3-row grid.

**Screen 8m Upload Complete (hoPrk):** Success banner at top of content:
- Frame: h=36, fill `#dcfce7` (green-100), cornerRadius 6, padding `[0,10]`, gap 8, alignItems center
- check-circle-2 icon 16×16 fill `#166534` + "3 files uploaded" 12px/600/`#166534` + spacer + "View newest" 11px/600/`#166534`
- Below: thumbnail row + annotation text 10px/`#64748B`

**Screen 8n Upload Partial Failure (pd04L):** Amber banner at top of content:
- Frame: h=36, fill `#FEF3C7`, cornerRadius 6, padding `[0,10]`, gap 8
- triangle-alert icon 16×16 fill `#92400E` + "2 uploaded, 1 failed" 12px/600/`#92400E` + spacer + "Retry failed" 11px/600/`#92400E`
- Below: thumbnail row + annotation text

### Search States (4 screens)

**Media/Search-Active (65ma7):** Search with blue ring `#1D4ED8` + X clear button (lucide `x`, 14×14, `#64748B`) inside input. Result count row: padding `[4,0,4,10]`, "4 results for "hero"" 9px/normal/`#475569`. 3-row thumbnail grid.

**Screen 8g Search Results (1FcWF):** Search active query "photo" — MKz2T override: content="photo", fill=`#0F172A`. No upload zone, no failure strip. Just search + 3-row ThumbGrid.

**Media/Search-NoResults (fVg54):** Search with blue ring. `mediaNoResults` frame (layout vertical, padding `[26,16]`, gap 8, centered):
- search-x icon 24×24 `#94A3B8`
- "No media for "banner2024"" 12px/600/`#0F172A` centered
- Description 10px/normal/`#475569` centered
- Recovery actions frame (collapsed)

**Screen 8h Search Empty (U5FHf):** Panel stroke outside `#E2E8F0`. Screen fill `#F8FAFC`. Content centered vertically: empty search illustration (ref HNfrz) + "No results for "mountain"" 12px/normal/`#64748B`.

### Item Interaction States (5 screens)

**Media/Item Actions (t8D67):** Search + Upload Zone + Failure Strip + 3-row grid. **Persistent action bar** pinned at bottom of panel (outside Panel Content):
- h=40, fill `#F1F5F9`, top border 1px `#E2E8F0`, padding `[0,10]`
- "photo-01.jpg" 11px/600/`#0F172A` + spacer + "Preview" 11px/500/`#1D4ED8` + "Rename" 11px/500/`#334155` + "Delete" 11px/600/`#FCA5A5`

**Media/Selected (XSWRz):** Same structure. **Multi-select bar** pinned at bottom:
- h=40, fill `#DBEAFE`, padding `[0,10]`, gap 10
- "12 selected" 12px/600/`#1D4ED8` + "Move" 11px/500/`#1E40AF` + "Download" 11px/500/`#1E40AF` + spacer + "Deselect all" 11px/500/`#334155` + "More" 11px/600/`#334155`

**Screen 8i File Selected (pABlG):** Grid gap=4, padding=8. 2 rows × 3 thumbs. Row 1 first thumb = ref sw8Zi (selected), rest = dWjtV. Selection banner (ref Al9jG) as 4th panel child. Panel stroke outside `#E2E8F0`.

**Screen 8j Multi Select (pTWTr):** 1 row × 3 thumbs, ALL ref sw8Zi. Selection banner at bottom. Panel stroke outside.

**Media/ContextMenu (kvg2l):** Normal grid. Absolute context menu overlay at x=60, y=80:
- w=140, padding 4, cornerRadius 6, fill `#FFFFFF`, stroke 1px `#D1D9E6`, shadow blur=12 `#00000040` offset y=4
- Items (26px row height each): "Copy URL" → "Copy Name" → "Rename" (all ref ZAaLo) → divider (ref RHATR) → "Delete" (ref wru5h, destructive)

### Delete Confirm (1 screen)

**Screen 8k Delete Confirm (oD3wA):** Normal panel (Failure Strip disabled). Canvas: semi-transparent overlay `#00000066` (1200×900). Dialog absolute at x=520, y=340:
- w=400, h=220, cornerRadius 8, fill `#FFFFFF`, stroke 1px `#D8E0EA`, padding 24, gap 16
- "Delete 3 files?" 16px/600/`#0F172A`
- "This action cannot be undone. These files will be permanently removed." 13px/normal/`#475569`
- Buttons (80×32 each): Cancel (fill `#F1F5F9`, stroke `#D1D9E6`) + Delete (fill `#FCA5A5`)

### Unsupported File (1 screen)

**Screen 8l Unsupported File (RsLjC):** Panel has 5 children: header + Failure Strip (active, default text) + search + Upload Zone + grid (1 row, gap=4, padding=8). First thumbnail = ref d2o8e (unsupported variant). Panel stroke outside `#E2E8F0`.

### Detail States (2 screens)

**Media/Detail (vSrqD):** No search bar. Panel Content = Detail View (layout vertical):
- Back button row: h=30, padding `[8,10]`
- detail_preview: h=140, fill `#FFFFFF`, cornerRadius 4
- Metadata section: layout vertical, gap 8, padding `[10,12]`
- Action buttons row: padding `[4,12,0,12]`, gap 6

**Screen 8o Detail Metadata Error (COb2m):** No grid. Panel Content:
- Detail nav bar (gap 6): `arrow-left` 14×14 `#64748B` + "Back to media grid" 11px/500/`#64748B` + spacer + "Prev" 11px/500/`#334155` + "Next" 11px/500/`#334155`
- Metadata error body (vertically centered, padding `[24,16]`, gap 10):
  - `image-off` icon 28×28 `#94A3B8`
  - "Preview metadata unavailable" 13px/600/`#0F172A` centered
  - Description 11px/normal/`#475569` centered
  - Retry button: fill `#1D4ED8`, h=34, cornerRadius 6, fill_container width

---

## Screen Inventory Summary

### Add Tab (8 screens)
| ID | Name |
|----|------|
| asCNI | Add — Elements Browse (No AI) |
| RzB6V | Add — Elements Root |
| nTVi6 | Add — Elements Expanded |
| SDgR2 | Add — Sections |
| fsI8j | Add — Pin Popover |
| GmdOe | Add — FTUE Tooltip |
| QFUVG | Add — Search Results |
| gnyrB | Add — No Results + AI Handoff |

### Templates Tab (16 screens)
| ID | Name |
|----|------|
| 2ihz1 | Templates Root |
| foBlu | Templates — Filtered View |
| cV3OT | Templates — Card Detail |
| 3pR56 | Templates Apply States (4 dialogs) |
| WUJbY | Templates Apply — Cancel+Success CTA (2 dialogs) |
| l5Zoz | Templates — Loading |
| XLKtB | Templates — No Results |
| DYk2w | Templates — New Page Context |
| v6Jqj | Templates — New Page Filtered |
| oj2MI | Templates — Template Detail New Page |
| fiLNZ | Templates — Create Confirm (New Page) |
| uMJFZ | Templates — Post-Confirm Success |
| 9NalZ | Templates — Post-Confirm Error |
| Ba4uo | Templates — Card Detail Preview Loading |
| Onr0C | Templates — Card Detail Preview Error |
| A3VFy | Templates — Section Templates Tab |

### Media Tab (23 screens)
| ID | Name |
|----|------|
| aPaxB | Media Root |
| JMoMN | Media/Empty |
| zo5Gr | Media — Loading Skeleton |
| FbIuN | Media — Empty State |
| HBPfb | Media — Upload Progress |
| QMOZP | Media — Upload Error |
| Z2INT | Media — Drag Active |
| jwG0u | Media/Upload-DragActive |
| hoPrk | Media — Upload Complete |
| pd04L | Media — Upload Partial Failure |
| 65ma7 | Media/Search-Active |
| 1FcWF | Media — Search Results |
| fVg54 | Media/Search-NoResults |
| U5FHf | Media — Search Empty |
| t8D67 | Media/Item Actions |
| XSWRz | Media/Selected |
| pABlG | Media — File Selected |
| pTWTr | Media — Multi Select |
| kvg2l | Media/ContextMenu |
| oD3wA | Media — Delete Confirm |
| RsLjC | Media — Unsupported File |
| vSrqD | Media/Detail |
| COb2m | Media — Detail Metadata Error |
