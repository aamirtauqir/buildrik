# Build Tab — Full Prototype Design Spec (v2)

**Date:** 2026-04-18
**Branch:** `feat/page-tab-phase-2-visuals`
**Source:** HTML wireframe `build-tab-prototypes.html`
**Changes from v1:** Quick Picks removed, AI Suggestions removed, Footer pinned to bottom

---

## Changelog from v1

### Removed: Quick Picks
- `QuickPicks.tsx` component deleted
- `useBuildTab.ts` — remove `picks`, `ftueSeen`, `addPick`, `removePick`, `togglePick`, `dismissFtue` state and handlers
- `BuildTab.tsx` — remove `<QuickPicks>` JSX
- `BuildTab.css` — remove `.bld-qp*`, `.bld-ftue*`, `.chip*`, `.bld-pin-popover*` selectors
- Storage keys `BUILD_PICKS`, `BUILD_FTUE_SEEN` no longer needed
- Elements are pinned directly from category grids via right-click context menu (existing behavior)

### Removed: AI Suggestions
- `AISuggestions.tsx` component deleted
- `AISuggestions.css` deleted
- `BuildTab.tsx` — remove `<AISuggestions>` JSX
- No AI handoff card in no-results state (Screen 4)

### Changed: Tips inside scrollable area
- Tips carousel is now **inside** `.panel-scroll` — scrolls with content
- Tips and My Components are both inside the scrollable region
- Footer is `margin-top: auto` — always at the absolute bottom of the panel

### Changed: Footer pinned to bottom
- Footer `.panel-footer-hint` is now `margin-top: auto` inside a flex column
- Always visible regardless of scroll position
- Not sticky (no `position: fixed`)

---

## 1. Concept & Vision

The Build Tab is the primary content insertion surface — the "creative inventory" of the editor. It lives in the left sidebar and gives users two modes: **Elements** (53 atomic blocks) and **Sections** (54 page-level templates). The tone is fast, discoverable, and frictionless: find or search any element and have it on canvas in under 3 seconds.

The visual language is **dark chrome + cobalt accent** — matching the rest of the editor's Phase 2 design system. Everything is dense but breathable: compact type, tight spacing, with just enough hierarchy to separate sections.

---

## 2. Design Language

### Aesthetic Direction
Dark sidebar chrome (`surface-elevated #1c1c2a`) with the canvas radiating through. The tab is a command palette — fast, information-dense, keyboard-first.

### Color Palette

| Token | Hex | Use |
|---|---|---|
| `--accent` | `#2D6DFF` | Cobalt — active states, hover, borders |
| `--accent-bg` | `#DBEAFE` | Accent tint — card hover fill |
| `--surface` | `#14141f` | Rail background |
| `--surface-elevated` | `#1c1c2a` | Panel background |
| `--surface-subtle` | `#1a1a26` | Search bar bg, tip card bg |
| `--surface-card` | `#ffffff` | Chips, cards, section content (light) |
| `--text-primary` | `#f4f4f5` | Active labels |
| `--text-secondary` | `#a1a1aa` | Secondary labels, cat names |
| `--text-tertiary` | `#52525b` | Muted icons, kbd hints |
| `--border` | `#27272a` | Subtle dividers |
| `--border-card` | `#d1d9e6` | Chip/card borders |

### Typography
- **UI:** Inter Tight, 400/500/600 weights
- **Mono:** Geist Mono — kbd hints, search counts, tip counters
- **Base size:** 13px panel title, 12px card labels, 11px metadata
- **Section labels:** 10px, 600 weight, 0.06em letter-spacing, uppercase

### Spatial System
- **Rail width:** 60px (fixed)
- **Panel width:** 320px (compact) / 360px (wide)
- **Padding:** 16px horizontal, 8px between sections
- **Grid gap:** 6px element cards
- **Radius:** 4px cards, 999px pills, 6px sections/cards

### Motion Philosophy
- **Accordion:** `max-height` 0→600px, 250ms `cubic-bezier(0.4, 0, 0.2, 1)` — snappy
- **Card hover:** `translateY(-1px)` + shadow, 120ms — subtle lift
- **Mode pill:** 120ms background transition — instant feel

---

## 3. Layout & Structure

### Visual Hierarchy (top → bottom)

```
┌─ Rail ─┬─── Panel ─────────────────────────────────┐
│         │  Panel Header: "Add" + pin + close         │
│  [+] A  │  ────────────────────────────────────────  │
│  [⊞] T │  Mode Switch: [Elements] [Sections]          │
│  [⊟] Z │  ────────────────────────────────────────  │
│  [📄] P │  Search: 🔍 Search elements...  [/]          │
│          │  ────────────────────────────────────────  │
│  ────  │  [💡] Pro Tips    1/5  ‹ › ˄ ✕              │
│  [🕐] H │  "Drag to canvas — ..."                     │
│          │  • • • • •                                  │
│  [?]    │  ────────────────────────────────────────  │
│         │  ▼ My Components  (accordion)               │
│         │  ────────────────────────────────────────  │
│         │  [scrollable]                                │
│         │  CATEGORIES                                  │
│         │  ▶ Layout                                    │
│         │  ▼ Text & Buttons     ← accordion open       │
│         │    [grid: 6 cards]                         │
│         │  ▶ Media                                    │
│         │  ▶ Forms                                    │
│         │  ▶ Page Sections                             │
│         │  ▶ E-Commerce                               │
│         ├────────────────────────────────────────────┤
│         │  ℹ Drag or click to insert    ← pinned     │
└─────────┴──────────────────────────────────────────────┘
```

### Panel Body Flex Layout
`.panel-body` uses `flex-direction: column` + `overflow: hidden`.
The scrollable `.panel-scroll` has `flex: 1` and `overflow-y: auto`.
Inside `.panel-scroll`: Tips → My Components → Categories (all scroll together).
The footer has `margin-top: auto` — always pushed to the absolute bottom of the panel.

### Section Order
1. Mode Switch — always at top (flex-shrink: 0)
2. Search Bar — always below mode switch (flex-shrink: 0)
3. Scrollable area (flex: 1, overflow-y: auto):
   - Tips carousel
   - My Components
   - Category accordion OR Search results
4. Footer — always at absolute bottom (margin-top: auto)

---

## 4. Features & Interactions

### 4.1 Mode Switch
- Pill toggle: `[Elements]` `[Sections]`
- Arrow keys + Home/End keyboard navigation
- Active pill: white fill + card border + shadow
- Switching modes: clears search query, restores accordion state

### 4.2 Search
- Full-width search bar with magnifying glass icon
- Placeholder: "Search elements..." / "Search sections..."
- `/` focuses search from anywhere on canvas
- **Escape** or `✕` clears query and restores pre-search accordion state
- 150ms debounce
- Results: categorized groups with hit counts

### 4.3 Tips Carousel
- Collapsed state (28px header): `💡 Pro Tips  1/5  ˅`
- Expanded: header + tip card + dot navigation
- 5 tips: prev/next arrows + dot click
- Dismiss → hides Tips for session
- Collapsed chevron `˅` expands; expanded `˄` collapses

### 4.4 My Components
- Accordion: chevron + "My Components" label
- Closed: chevron right
- Open: chevron rotated 90° + body content
- States: hidden (no API), closed, open+empty, open+has-items

### 4.5 Category Accordion
- Last-in-wins: opening a category closes all others
- `max-height` CSS transition for smooth expand/collapse
- Closed: only 40px row rendered (conditional mount)

### 4.6 Element Cards
- 3-column grid
- Hover: `translateY(-1px)` lift + accent tint bg + shadow
- Active/drag: `scale(0.95)`
- Click → `handleElClick(el)` → `onBlockClick?.()`
- Drag → `dataTransfer` with `block` MIME type

### 4.7 Section Cards (Sections mode)
- Vertical list of full-width cards
- Hover: accent border + shadow
- Click or drag: insert section HTML

### 4.8 Section Family Chips (Sections mode)
- Horizontal wrap of pill chips
- "All" chip active by default
- Click filters section list to that family

### 4.9 Keyboard Shortcuts
| Key | Action |
|---|---|
| `/` | Focus search input |
| `Esc` | Clear search (restores accordion state) |
| `↑↓` in mode switch | Navigate between Elements/Sections |
| `Home/End` in mode switch | Jump to first/last mode |
| `Enter/Space` on cards | Insert element |
| `Enter/Space` on accordion | Toggle category |

---

## 5. Component Inventory

### `BuildTab.tsx`
Shell — layout composition, `/` shortcut, conditional rendering

### `TipsFooter.tsx`
States: dismissed (null), collapsed (header only), expanded (header + card + dots)

### `MyComponents.tsx`
States: hidden (no API), closed, open+empty, open+has-items

### `CatAccordion.tsx`
States: closed, open. Conditional mount, not CSS hide.

### `SearchResults.tsx`
Categorized results with group headers and counts

### `SectionsMode.tsx`
Lazy-loaded (~92KB). Contains: section hint, family chips, section cards

---

## 6. CSS Selector Cleanup (v1 → v2)

### Delete from `BuildTab.css`
```
.bld-qp*           — Quick Picks container, chips, ghosts, FTUE
.bld-pin*          — Pin popover (unused after Quick Picks removal)
.chip*             — Chip variants (.chip-filled, .chip-add, .chip-ghost)
.ai-sug*           — AI Suggestions container, cards, header
```

### Keep
```
.bld-container, .bld-content, .bld-search-wrap, .bld-scroll
.bld-sec-label, .bld-divider
.bld-cat-*, .bld-el-*, .bld-search-*, .bld-mode-*
.bld-sec-chips, .bld-sec-chip, .bld-sec-card
.bld-tips-*, .bld-tip-*, .bld-mycomp-*
.bld-no-results, .bld-ai-card (no-results AI handoff — removed in v2)
.bld-footer-hint → .panel-footer-hint (renamed)
```

---

## 7. Hook State Cleanup (v1 → v2)

### Remove from `useBuildTab.ts`
- `picks: string[]` state
- `ftueSeen: boolean` state
- `addPick`, `removePick`, `togglePick`, `dismissFtue` handlers
- `picks` from return object
- `ftueSeen` from return object

### Keep
- `favs`, `openCats`, `searchQuery`, `tipDismissed`, `tipsCollapsed`
- `myCompOpen`, `favOpen`, `tipIdx`, `mode`
- All handlers except removed ones above

---

## 8. Wireframe Screens (v2)

| # | Screen | Description |
|---|---|---|
| 1 | Elements Mode — Default | Tips + My Components + first category open + footer pinned |
| 2 | Category Accordion | Layout open, others closed + footer always visible |
| 3 | Search — Results Found | "button" query → categorized results |
| 4 | Search — No Results | No AI handoff card in v2 |
| 5 | Sections Mode | Family chips + section cards + footer pinned |
| 6 | Tips Collapsed + My Components | Collapsed tips + My Components open |

All 6 screens in: `build-tab-prototypes.html`
