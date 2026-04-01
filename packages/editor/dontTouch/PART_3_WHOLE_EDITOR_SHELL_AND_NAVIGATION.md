# PART 3 — WHOLE EDITOR SHELL AND NAVIGATION

**Extracted from:** `prd_final.md` (2026-03-12)
**Scope:** Editor shell structure, information architecture, layout grid, top bar, navigation rail, tab taxonomy, panel switching logic, global regions, shell consistency rules, navigation consistency rules, required shell behaviors, anti-fragmentation rules.
**Rule:** Current capability is the FLOOR, not the ceiling.

---

## 3.1 Editor Shell Structure

The editor is a single-page React 18 application (`<AquibraStudio />` component) with 6 fixed zones arranged in a predictable desktop layout. The shell never changes structure regardless of which panel is open, which element is selected, or which mode the user is in.

**6 zones, always present:**

| # | Zone | Component | Position | Behavior |
|---|------|-----------|----------|----------|
| 1 | Top Bar | `StudioHeader.tsx` + `Topbar.tsx` | Top, full width | Fixed, never scrolls, z-index: 1000 |
| 2 | Rail | `Rail.tsx` + `tabsConfig.ts` | Left edge, below top bar | Fixed, never scrolls, z-index: 900 |
| 3 | Left Sidebar | `LeftPanel.tsx` | Right of rail, below top bar | Drawer mode: slides in/out, z-index: 800 |
| 4 | Canvas | `Canvas.tsx` | Center, fills remaining space | Zoom/pan via Viewport manager, z-index: 1 |
| 5 | Canvas Footer | `CanvasFooterToolbar.tsx` | Bottom of canvas area | Fixed at bottom of canvas zone, z-index: 100 |
| 6 | Right Inspector | `ProInspector.tsx` | Right edge, below top bar | Right panel, z-index: 800 |

**Shell invariants:**
- Top bar is ALWAYS visible — no fullscreen mode hides it.
- Rail is ALWAYS visible — even when sidebar is collapsed, rail remains.
- Canvas footer is ALWAYS visible when canvas is visible.
- Inspector collapses to 0px when no element is selected and no page properties shown — but the zone reservation exists.

---

## 3.2 Information Architecture

### Global IA Hierarchy

```
AquibraStudio
├── Top Bar (global controls, save, undo/redo, device, preview, publish)
├── Rail (8 tab icons → sidebar panels)
├── Left Sidebar (10 panels, one visible at a time)
│   ├── Add / Build (A) — element catalog
│   ├── Media (J) — file library + stock discovery
│   ├── Layers (Z) — element tree
│   ├── Templates (T) — template browser
│   ├── Pages (P) — page manager + per-page settings
│   ├── Components (⇧A) — reusable component library (keyboard-only, not in rail)
│   ├── Design (D) — design tokens (color/type/spacing)
│   ├── Settings (S) — 6 sub-screens (Site/Domains/Analytics/Export/Integrations/Advanced)
│   ├── Publish (U) — publish status, URL, checklist (keyboard-only, not in rail)
│   └── History (H) — named versions + auto-saves + activity log
├── Canvas (editing surface)
│   ├── Content area (white, user-designed pages)
│   ├── Overlays (7 types: outlines, guides, spacing, badges, grid, rulers, x-ray)
│   ├── Floating toolbar (above selected element)
│   ├── Context menu (right-click)
│   └── Canvas Footer (overlay toggles + zoom controls)
└── Inspector (right panel)
    ├── Header (element identity, breadcrumb, tabs, pseudo-states, breakpoints)
    ├── Layout tab (7 sections)
    ├── Appearance tab (3 sections: Typography, Background, Border)
    ├── Behavior tab (4 sections: Effects, Animation, Interactions, Visibility)
    ├── Shared footer (Link, Classes, Properties, All CSS — below all tabs)
    ├── Multi-select toolbar (when 2+ selected)
    └── Empty state (when nothing selected)
```

### Navigation Model

Users navigate the editor through 4 parallel mechanisms:
1. **Rail clicks** — mouse-driven panel switching (1 click)
2. **Keyboard shortcuts** — single-key tab shortcuts (A/T/Z/P/⇧A/J/D/S/U/H)
3. **Command palette** — Ctrl+K fuzzy search across all commands
4. **Direct shortcuts** — Ctrl+J (AI), Ctrl+K (palette), Ctrl+P (preview), Ctrl+Shift+E (export), ? (shortcuts)

All 4 mechanisms coexist. None is deprecated or removed.

---

## 3.3 Layout Grid

### ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOP BAR (52px height)                             │
│  Full width, fixed, z-index: 1000                                           │
├──────────┬────────────────┬───────────────────────────┬─────────────────────┤
│   RAIL   │  LEFT SIDEBAR  │          CANVAS            │    INSPECTOR        │
│  (68px)  │   (320px)      │         (flex: 1)          │     (300px)         │
│  fixed   │  [drawer mode] │                            │   [right panel]     │
│  left    │  overflow-y:   │                            │   overflow-y:       │
│  full-h  │  auto          │                            │   auto              │
│          │                │   CANVAS FOOTER (40px)     │                     │
├──────────┴────────────────┴───────────────────────────┴─────────────────────┤
│                                                                              │
│  Total minimum viewport: 1024px wide (below this, editor is not supported)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Exact Dimensions

| Zone | Width | Height | Resizable | Collapsible | Background | z-index |
|------|-------|--------|----------|------------|------------|---------|
| Top Bar | 100% viewport | 52px fixed | No | No | `--aqb-surface-1` (`#0f0f14`) | 1000 |
| Rail | 68px fixed (CSS `--aqb-sidebar-width: 56px` → `LayoutShell.css` fallback `68px`) | viewport − 52px | No | No | `--aqb-surface-1` (`#0f0f14`) | 900 |
| Left Sidebar | 320px default (280px compact) → 400px expanded | viewport − 52px | Yes (drag right edge, 280→400px) | Yes (closes to 0px, rail remains) | `--aqb-surface-1` (`#0f0f14`) | 800 |
| Canvas | flex: 1 (fills remaining) | viewport − 52px − 40px footer | Yes (zoom/device changes content size) | No | `--aqb-bg-canvas: #ffffff` (canvas content) | 1 |
| Canvas Footer | same as Canvas | 40px fixed | No | No | `--aqb-surface-1` (`#0f0f14`) | 100 |
| Inspector | 300px fixed (`--aqb-right-panel-width: 300px`) | viewport − 52px | No | Yes (collapses to 0px) | `--aqb-surface-1` (`#0f0f14`) | 800 |

### Canvas Width Calculation

```
Canvas width = viewport_width - rail(68px) - sidebar(320px) - inspector(300px)
             = viewport_width - 688px
At 1440px:   = 752px available for canvas
At 1024px:   = 336px available for canvas (minimum)

When sidebar collapsed: canvas gains 320px
When inspector collapsed: canvas gains 300px
Both collapsed: canvas = viewport_width - 68px
```

### Reference and Minimum Viewports

- **Reference viewport:** 1440 × 900px (design target)
- **Minimum supported:** 1024 × 768px
- **Below minimum:** Full-screen message: `"Buildrik is designed for desktop. Open on a computer for the best experience."` with desktop icon illustration

### Scrollable vs Fixed Zones

| Zone | Scroll Behavior |
|------|----------------|
| Top Bar | Fixed, never scrolls |
| Rail | Fixed; if viewport too short for all 8 icons, bottom zone scrolls independently |
| Left Sidebar | Panel header fixed at top (48px); panel content scrolls independently (`overflow-y: auto`) |
| Canvas | Zoom/pan via Viewport manager; no browser scroll — canvas handles its own scroll via transform |
| Canvas Footer | Fixed at bottom of canvas area |
| Inspector | Inspector header fixed (element identity + tabs, ~140px); section content scrolls independently |

---

## 3.4 Top Bar Architecture

### Anatomy

```
LEFT ZONE (flex)           CENTER ZONE (auto)            RIGHT ZONE (flex)
┌─────────────────────────┬──────────────────────┬─────────────────────────────────────┐
│ [Logo][ProjectName]     │  [D] [T] [M]         │  [Preview] [Publish]                │
│ [SaveDot] [↶] [↷]      │  device switcher     │  [SyncDot] [Issues] [👤][👤][+3]    │
└─────────────────────────┴──────────────────────┴─────────────────────────────────────┘
Height: 52px | Background: --aqb-surface-1 (#0f0f14) | Border-bottom: 1px solid rgba(255,255,255,0.08)
```

### Top Bar ARIA

- Container: `role="toolbar"`, `aria-label="Editor toolbar"`

---

## 3.5 Top Bar Zones

### Always-Visible Controls (9 total)

| # | Control | Type | Size | Shortcut | Visual Spec |
|---|---------|------|------|---------|-------------|
| 1 | Logo + Project Name | Clickable text | Logo: 20px icon, Name: 14px semibold | — | Click → Project Settings modal. Logo: Buildrik icon. Name: truncated at 160px with ellipsis. Color: `--aqb-text-primary` (`#F5F5F0`) |
| 2 | Undo | Icon button | 32×32px | Ctrl+Z | Lucide `undo-2` icon. Disabled: 30% opacity when `!canUndo`. Tooltip: "Undo — Ctrl+Z" |
| 3 | Redo | Icon button | 32×32px | Ctrl+Y | Lucide `redo-2` icon. Disabled: 30% opacity when `!canRedo`. Tooltip: "Redo — Ctrl+Y" |
| 4 | Device switcher (BreakpointDropdown) | Segmented control | 3 segments, each 40×28px | Ctrl+1-3 | Segments: Desktop 1440px (monitor), Tablet 768px (tablet), Mobile 375px (smartphone). Active: `--aqb-primary` bg, white icon. Inactive: transparent bg, muted icon. |
| 5 | Save Status (SaveStatusIndicator) | Status indicator | Dot: 8px, Text: 12px | — | States: "Saved ✓" (green `#22c55e`), "Saving…" (blue `#4b8dff`, pulsing), "Save failed" (red `#ef4444`). |
| 6 | Sync status (SyncIndicator) | Status dot | 8px circle | — | Green: synced. Amber: syncing. Red: offline/error. Tooltip: "Cloud sync: Active/Syncing/Error". |
| 7 | Issues badge (IssuesBadge) | Icon button | 32×32px | — | Shows issue count. |
| 8 | Preview | Button (outlined) | auto × 32px, padding 12px 16px | Ctrl+P | Text: "Preview", 13px semibold. Border: `1px solid rgba(255,255,255,0.12)`. Hover: bg `--aqb-surface-3`. |
| 9 | Publish | Button (filled) | auto × 32px, padding 12px 16px | U (opens panel) | Text: "Publish", 13px semibold white. Background: `--aqb-primary` (`#6366f1`). Hover: `--aqb-primary-hover` (`#818cf8`). |

**Note:** There is NO overflow menu (···) in the top bar. Features that might have been in an overflow menu are distributed to: Canvas Footer (overlay toggles, dev mode, x-ray), sidebar tabs (Templates, Export via Settings), and inspector (AI suggestions). This was a deliberate IA Redesign 2026 decision.

### Device Switcher Behavior (BreakpointDropdown.tsx)

| Aspect | Specification |
|--------|--------------|
| Layout | 3 pill segments, 1px gap, rounded container (radius: 6px) |
| Active segment | Background: `--aqb-primary` (`#6366f1`), icon: white, font-weight: 600 |
| Inactive segment | Background: transparent, icon: `--aqb-text-muted`, hover: `--aqb-surface-3` |
| Label | Shows current device name + icon |
| On switch | `composer.viewport.setDevice(device)`, canvas resizes, inspector BreakpointIndicator updates |
| Breakpoints | Desktop (1440px), Tablet (768px), Mobile (375px). No Watch breakpoint. |
| Keyboard | Ctrl+1 = Desktop, Ctrl+2 = Tablet, Ctrl+3 = Mobile |

### Top Bar State Variations

| State | Visual Change |
|-------|-------------|
| Idle (saved) | Save dot: green, "Saved" text, timestamp "2:45 PM" |
| Dirty (unsaved changes) | **No distinct visual state in code** — StatusIndicators.tsx has 3 states only (idle/saving/error). Dirty state is conceptual, not visually distinct from idle. |
| Saving | Save dot: blue `#4b8dff` (spinning), "Saving..." text |
| Save error | Save dot: red (`#ef4444`), "Save failed" text, tooltip "Click to retry" |
| Publishing | Publish button: disabled, text "Publishing...", spinner icon |
| Collaborators present | Presence avatars visible, sync dot green |
| Offline | Sync dot: red, tooltip "Offline — changes will sync when reconnected" |

### Presence Avatars (Collaboration)

- Avatar stack: `display: flex; flex-direction: row-reverse` (newest on left, stack overlaps right)
- Max 4 avatars visible + overflow count badge (maxVisible = 4 in PresenceIndicators.tsx)
- Each avatar: `width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--aqb-surface-1)`
- Content: user's first initial, centered — `font: 11px Inter; font-weight: 700; color: #FFFFFF`
- Background: unique color per user from palette: User 1: `#6366f1` (indigo), User 2: `#ec4899` (pink), User 3: `#14b8a6` (teal), User 4: `#f59e0b` (amber), User 5+: `#8b5cf6` (purple), cycling
- Online indicator: `width: 8px; height: 8px; border-radius: 50%; background: #22c55e; border: 1.5px solid var(--aqb-surface-1); position: absolute; bottom: -1px; right: -1px`
- Overflow badge (when > 4 users): `width: 28px; height: 28px; border-radius: 50%; background: var(--aqb-surface-3)`; shows "+2", "+5" etc.
- Hover tooltip: name (12px semibold) + current activity ("Editing Hero Section" 11px muted)

### Connection Quality Indicator

| State | Dot Color | Tooltip | Condition |
|-------|-----------|---------|-----------|
| Good | `#22c55e` (green) | "Connection quality: Good" | Latency < 200ms, no packet loss |
| Degraded | `#f59e0b` (amber) | "Connection quality: Degraded — changes may be delayed" | Latency 200–1000ms or minor packet loss |
| Poor | `#ef4444` (red) | "Connection quality: Poor — some features may not sync" | Latency > 1000ms or significant packet loss |
| Offline | `#6b7280` (gray) | "Offline — changes saved locally, will sync on reconnect" | No connection |

- Dot size: `8×8px; border-radius: 50%`
- Position: immediately right of save status indicator in top bar
- Pulsing animation on Degraded/Poor: `animation: pulse 2s ease-in-out infinite` (opacity cycles 0.5–1.0)
- Click on dot → popover with: latency value (ms), last sync time, "Reconnect" button (if Poor/Offline)

---

## 3.6 Navigation Rail

### 8-Icon Rail (RAIL_SLOTS in tabsConfig.ts)

```
┌──────────┐
│          │  TOP ZONE (5 items, top-aligned)
│  [+]     │  1. Add          — A         (Lucide: SvgPlus)
│  [img]   │  2. Media        — J         (Lucide: SvgImage)
│  [stack] │  3. Layers       — Z         (Lucide: SvgLayers)
│  [tmpl]  │  4. Templates    — T         (Lucide: SvgLayoutTemplate)
│  [file]  │  5. Pages        — P         (Lucide: SvgFileText)
│          │
│  (flex)  │  SPACER (flex-grow: 1)
│          │
│  [pal]   │  BOTTOM ZONE (3 items, bottom-aligned)
│  [set]   │  6. Design       — D         (Lucide: SvgPalette)
│  [clk]   │  7. Settings     — S         (Lucide: SvgSettings)
│          │  8. History      — H         (Lucide: SvgClock)
└──────────┘

Width: 68px (CSS: --layout-rail-width: var(--aqb-sidebar-width, 68px))
Background: --aqb-surface-1 (#0f0f14)
Border-right: 1px solid rgba(255,255,255,0.08)
Icon size: 20px | Icon container: 40×40px (centered in 68px rail)
Vertical gap between icons: 4px

Note: Components (⇧A) and Publish (U) are NOT in the rail — they are
keyboard-shortcut-only tabs defined in GROUPED_TABS_CONFIG but excluded
from RAIL_SLOTS. Total tab definitions: 10. Visible rail icons: 8.
```

### Rail Icon States (LeftRail.css)

| State | Visual | Background | Border | Transition |
|-------|--------|------------|--------|-----------|
| Default | Muted color (`--aqb-text-muted`) | transparent | none | — |
| Hover | Brighter color | transparent | none | color transition |
| Active (panel open) | White icon | Indigo background (`--aqb-primary` pill, border-radius: 8px) | none | background 150ms ease |
| Focused (keyboard) | Teal outline | transparent | `2px solid teal`, offset 2px | instant |

**Note:** There is NO disabled icon state in the rail. All 8 icons are always interactive.

### Rail Tooltip Spec

- **Trigger:** Mouse hover after 200ms delay (0.2s in LeftRail.css)
- **Position:** Right of rail icon, 8px gap
- **Content:** `[Tab Label] — [Shortcut]` + subtitle
- **Visual:** Background: `--aqb-surface-5` (`#2e2e38`), text: 11px, shortcut: 10px mono, padding: 6px 10px, border-radius: 6px, shadow: `--aqb-shadow-sm`, max width: 200px, arrow: 6px triangle pointing left

**Examples:**
- "Add — A" / "Add elements and sections"
- "Components — ⇧A" / "Create and use reusable components"
- "Publish — U" / "Publish and deploy your site"

### Rail Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Role | `role="navigation"`, `aria-label="Editor panels"` on rail container |
| Buttons | Each icon: `role="button"`, `aria-label="[Tab Name] panel"`, `aria-pressed="true/false"` |
| Keyboard nav | Arrow Up/Down navigates between rail buttons within each zone. Home/End jumps to first/last in zone. |
| Activation | Enter/Space opens panel (equivalent to click) |
| Tab exit | Tab key exits rail → focus moves to sidebar content (if open) or canvas |
| Focus indicator | `2px solid #6366f1`, 2px offset (global focus ring spec) |
| Tooltips | `aria-describedby` links to tooltip content; tooltip includes shortcut |

### Rail Compact Mode

When viewport height < 700px and all 8 icons don't fit:
- TOP zone scrolls independently (`overflow-y: auto`, scrollbar hidden)
- BOTTOM zone remains fixed at bottom
- Minimum rail height for all icons: ~(8 × 44px) + spacer = ~392px

---

## 3.7 Tab Taxonomy

### Complete Tab Table

| # | Tab Name | Shortcut | Rail Zone | Rail Position | Lucide Icon | Panel Content Summary |
|---|----------|---------|-----------|---------------|-------------|----------------------|
| 1 | Add / Build | A | TOP | 1 | `SvgPlus` | Element catalog (6 categories), favorites, my components, search, drag-to-canvas |
| 2 | Media | J | TOP | 2 | `SvgImage` | Upload zone, library grid, stock discovery, type filter pills, multi-select, asset detail overlay |
| 3 | Layers | Z | TOP | 3 | `SvgLayers` | Full element tree, drag-to-reorder, canvas sync, visibility toggles |
| 4 | Templates | T | TOP | 4 | `SvgLayoutTemplate` | Template grid, filter chips, preview modal, apply progress, save as template |
| 5 | Pages | P | TOP | 5 | `SvgFileText` | Page list, add page, per-page settings drawer (SEO/Social/Advanced), context menu |
| 6 | Components | ⇧A | — (keyboard-only) | — | `SvgComponent` | Component library, detail screen, create from selection, usage count |
| 7 | Design | D | BOTTOM | 1 | `SvgPalette` | Color/typography/spacing tokens, export (CSS/JSON/SCSS), draft workflow, review modal |
| 8 | Settings | S | BOTTOM | 2 | `SvgSettings` | 6 sub-screens: Site, Domains, Analytics, Export, Integrations, Advanced |
| 9 | Publish | U | — (keyboard-only) | — | `SvgRocket` | Status badge, URL, pre-publish checklist, publish/update/unpublish actions |
| 10 | History | H | BOTTOM | 3 | `SvgClock` | Named versions, auto-saves, restore, compare, activity view |

### Rail vs Keyboard-Only Tabs

| Tab | Access | Note |
|-----|--------|------|
| Components (⇧A) | Keyboard-only | Not in RAIL_SLOTS; defined in GROUPED_TABS_CONFIG but excluded from rail icon row |
| Publish (U) | Keyboard-only | Not in RAIL_SLOTS; `// publish: removed from rail` comment in tabsConfig.ts |

---

## 3.8 Panel Switching Logic (State Machine)

### Panel States

4 states: `closed`, `open-unpinned`, `open-pinned`, `expanded`

Default width: `320px` (all states except expanded). Expanded max: `400px`.

### Panel State Transitions

| # | Current State | Trigger | Next State | Side Effects |
|---|--------------|---------|-----------|-------------|
| P1 | `closed` | Rail icon click | `open-unpinned` | Panel slides in from left (`150ms ease`). Focus moves to panel header. Keyboard shortcut also triggers this. |
| P2 | `open-unpinned` | Same rail icon click | `closed` | Panel slides out (`150ms ease`). Focus returns to canvas. |
| P3 | `open-unpinned` | Different rail icon click | `open-unpinned` | Tab content swaps (instant, no animation). Panel stays open. |
| P4 | `open-unpinned` | Pin icon click | `open-pinned` | Pin icon: Lucide `pin` → `pin-off`. Panel border changes: adds `border-right: 2px solid var(--aqb-primary)` to indicate pinned. Canvas area width reduces by panel width. |
| P5 | `open-pinned` | Pin icon click | `open-unpinned` | Reverse of P4. Canvas width restores. |
| P6 | `open-unpinned` | Click outside panel (canvas or inspector) | `closed` | Panel closes. |
| P7 | `open-pinned` | Click outside panel | `open-pinned` | No change — pinned panels stay open. |
| P8 | `open-pinned` | Close icon (×) click | `closed` | Panel closes and unpins. |
| P9 | `open-unpinned` | Close icon (×) click | `closed` | Panel closes. |
| P10 | `open-unpinned` or `open-pinned` | Drag panel right edge | `expanded` | Panel width increases up to `400px`. Cursor: `ew-resize`. Min width: `280px`. |
| P11 | `expanded` | Release drag | `expanded` | Width persists at dragged value. |
| P12 | `expanded` | Double-click resize handle | `open-pinned` | Width resets to default `320px`. |
| P13 | Any open state | Escape key (panel focused) | `closed` | Panel closes. |

### Panel Persistence

Panel state persisted in `localStorage` under key `aqb-panel-state` (see `usePanelState.ts`). Stored fields: `leftPanelTab`, `leftPanelSubTabs`, `rightPanelTab`, `isLeftPanelOpen`, `panelPinned`, `panelSizeMode`. Restored on next session.

### Panel Header Pattern (SSOT)

ALL 10 panels use the identical header pattern. No exceptions.

```
┌────────────────────────────────────────────────────────┐
│ [Tab icon 16px] [Tab Name 14px semibold]    [📌] [✕]  │
│                                                        │
│ Height: 48px | Padding: 0 16px                         │
│ Background: --aqb-surface-1                            │
│ Border-bottom: 1px solid rgba(255,255,255,0.08)        │
└────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Tab icon | 16px Lucide icon, `--aqb-text-secondary` color, 8px gap to title |
| Tab Name | 14px, font-weight: 600, `--aqb-text-primary` (`#F5F5F0`) |
| Pin icon | 16px Lucide `pin` (unpinned) / `pin-off` (pinned), `--aqb-text-muted`, hover: `--aqb-text-secondary`. Click: toggles pinned state. |
| Close icon | 16px Lucide `x`, `--aqb-text-muted`, hover: `--aqb-text-secondary`. Click: collapses panel. |
| Gap between pin and close | 4px |
| Pin + Close alignment | Right-aligned, vertically centered |

### Panel Navigation Patterns

**Pattern A — Standalone:** Header → scrollable content. No drill-in navigation.
Used by: Add, Media, Layers, Pages, Components, Design, Publish, History

**Pattern B — Card Drill-In:** Header → card grid (home) → sub-screen with DrillInHeader.
Used by: Settings (6 sub-screens)

DrillInHeader spec:
```
[← back arrow] [Sub-screen title]     [action buttons]
Height: 44px
Back arrow: Lucide arrow-left, 16px
Title: 14px semibold
```
DrillInHeader includes SettingsNavGuard (unsaved-changes check on back navigation).

### Panel Width States

| State | Width | Trigger | Transition |
|-------|-------|--------|-----------|
| Compact | 280px (DRAWER_WIDTH_COMPACT) | panelSizeMode = compact | slide-in from left, 150ms, ease-in-out |
| Default / Normal | 320px (DRAWER_WIDTH / --layout-drawer-width) | Default on open | slide-in from left, 150ms, ease-in-out |
| Extended | 400px (max) | panelSizeMode = extended | instant |
| Collapsed | 0px (rail only visible) | Close button, active rail icon, or outside click (if unpinned) | slide-out to left, 150ms |

### Panel Content Padding

| Area | Padding |
|------|---------|
| Panel header | 0 16px (horizontal only) |
| Panel content | 16px (all sides) |
| Section headers within content | 0 (flush with content padding) |
| Section content | 0 (flush with content padding) |
| Cards (Settings home) | 8px gap between cards |

---

## 3.9 Global Regions (ARIA Landmarks)

| Region | ARIA | Label |
|--------|------|-------|
| Rail | `role="navigation"` | `aria-label="Editor panels"` |
| Sidebar panel | `role="complementary"` | `aria-label="[Tab name] panel"` |
| Canvas | `role="application"` | `aria-label="Canvas editing area"` (Note: `role="application"` because canvas has custom keyboard handling) |
| Inspector | `role="complementary"` | `aria-label="Element properties"` |
| Top bar | `role="toolbar"` | `aria-label="Editor toolbar"` |
| Canvas footer | `role="toolbar"` | `aria-label="Canvas controls"` |

### Skip Link

- `"Skip to canvas"` — visually hidden, appears on focus
- `position: absolute; top: -40px; focus: top: 8px; left: 8px; z-index: 5000`
- First focusable element when Tab is pressed

---

## 3.10 Shell Consistency Rules

### Surface Token Usage

ALL shell zones use `--aqb-*` CSS custom properties from `src/themes/default.css`. No inline hex values for established tokens.

| Surface | Token | Value |
|---------|-------|-------|
| Top bar background | `--aqb-surface-1` | `#0f0f14` |
| Rail background | `--aqb-surface-1` | `#0f0f14` |
| Sidebar background | `--aqb-surface-1` | `#0f0f14` |
| Inspector background | `--aqb-surface-1` | `#0f0f14` |
| Canvas content | `--aqb-bg-canvas` | `#ffffff` |

### Border Consistency

| Location | Token | Value |
|----------|-------|-------|
| Top bar bottom | `--aqb-border` | `rgba(255,255,255,0.08)` |
| Rail right | `--aqb-border` | `rgba(255,255,255,0.08)` |
| Sidebar section separators | `--aqb-border-subtle` | `rgba(255,255,255,0.06)` |
| Inspector section separators | `--aqb-border-subtle` | `rgba(255,255,255,0.06)` |
| Pinned panel indicator | `--aqb-primary` | `2px solid #6366f1` right border |

### Typography Consistency (Shell)

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Panel header title | Inter | 14px | 600 | `--aqb-text-primary` (`#F5F5F0`) |
| Section label (accordion) | Inter | 10px | 600 | `--aqb-text-muted` (`#908D85`), uppercase, letter-spacing: 0.5px |
| Body text / control labels | Inter | 13px | 400 | `--aqb-text-secondary` (`#B8B5AD`) |
| Small text / hints | Inter | 12px | 400 | `--aqb-text-muted` (`#908D85`) |
| Tooltip text | Inter | 11px | 400 | `--aqb-text-primary` (`#F5F5F0`) |
| Keyboard shortcut badge | JetBrains Mono | 10px | 600 | `--aqb-text-muted` (`#908D85`) |

### Styling Rules (Engineering Handoff)

| Rule | Details |
|------|---------|
| CSS-in-JS library | Emotion only (`@emotion/react`, `@emotion/styled`). No Tailwind, no CSS modules. |
| Global tokens | All `--aqb-*` variables defined in `src/themes/default.css`. Components read via `var(--aqb-token-name)`. |
| Component styles | Use Emotion `styled()` for component definitions, `css` prop for one-off overrides. |
| Dynamic values | Inline `style` attribute ONLY for values computed at runtime (drag position, zoom transform). |
| No magic numbers | Every pixel value, color, shadow, radius MUST reference a token or be documented in the PRD. |
| Responsive (editor UI) | Editor UI is NOT responsive (fixed desktop layout, min 1024px). Only the canvas content is responsive. |

---

## 3.11 Navigation Consistency Rules

### Single-Key Tab Shortcuts (All 10 preserved)

| Key | Tab | Command |
|-----|-----|---------|
| A | Add / Build | Open Build panel |
| T | Templates | Open Templates panel |
| Z | Layers | Open Layers panel |
| P | Pages | Open Pages panel |
| ⇧A (Shift+A) | Components | Open Components panel |
| J | Media | Open Media panel |
| D | Design | Open Design System panel |
| S | Settings | Open Settings panel |
| U | Publish | Open Publish panel |
| H | History | Open History panel |

### Global Navigation Shortcuts (Always available)

| Shortcut | Action |
|---------|--------|
| Ctrl+K | Open command palette (from anywhere) |
| Ctrl+S | Save (from anywhere) |
| Ctrl+Z | Undo (from anywhere except text input focused) |
| Ctrl+Y | Redo (from anywhere except text input focused) |
| Ctrl+P | Preview |
| Ctrl+J | Toggle AI Assistant Bar |
| ? or Ctrl+/ | Keyboard Shortcuts cheat sheet |

### Tab Order (Global)

```
[Skip to canvas link] → Rail → Sidebar → Canvas → Inspector → (cycle)
```

| Zone | Key | Behavior |
|------|-----|----------|
| Global | Tab | Move focus to next zone (Rail → Sidebar → Canvas → Inspector) |
| Global | Shift+Tab | Move focus to previous zone |
| Global | Escape | Context-dependent: close modal → close context menu → deselect → close panel (priority order) |

---

## 3.12 Required Shell Behaviors

### Focus Management Rules

| Event | Focus behavior |
|-------|---------------|
| Modal opens | Focus moves to modal's first focusable element. Focus trapped within modal via `inert` on background content. |
| Modal closes | Focus returns to the element that triggered the modal (stored in `previousFocusRef`). |
| Panel opens (rail click) | Focus moves to panel header (tab title or search input). |
| Panel closes | Focus moves to the rail icon that was just deactivated. |
| Tab switch (inspector) | Focus moves to first focusable control in new tab's first expanded section. |
| Toast appears | No focus change. Screen reader announces via `role="alert"` or `aria-live`. |

### Screen Reader Announcements (Shell-level)

| Event | aria-live Region | Announcement Text |
|-------|-----------------|-------------------|
| Save success | `polite` | `"Project saved"` |
| Save failure | `assertive` | `"Save failed. Check connection and retry."` |
| Panel opened | `polite` | `"[Tab name] panel opened"` |
| Panel closed | `polite` | `"Panel closed"` |
| Toast (error) | `assertive` (via `role="alert"`) | Toast message text |
| Toast (info/success) | `polite` (via `role="status"`) | Toast message text |
| Breakpoint change | `polite` | `"Switched to [breakpoint] view"` |

### Save State Machine

5 states: `idle`, `dirty`, `saving`, `auto-saving`, `error`

| # | Current State | Trigger | Next State | UI Change |
|---|--------------|---------|-----------|-----------|
| SV1 | `idle` | User makes any change | `dirty` | **Note:** StatusIndicators.tsx only has 3 visual states (idle/saving/error). No distinct "dirty" visual — idle shows "Saved [timestamp]" until save is triggered. Auto-save timer starts (5000ms). |
| SV2 | `dirty` | Ctrl+S | `saving` | "Saving..." + spinner. `composer.save()` called. |
| SV3 | `saving` | Success | `idle` | "Saved" + timestamp. Dot: green. |
| SV4 | `saving` | Failure | `error` | "Save failed" in red. Toast with `[Retry]` button. |
| SV5 | `error` | Retry or Ctrl+S | `saving` | Same as SV2. |
| SV6 | `error` | Another change | `error` (stays) | Changes queued. Error persists. |
| SV7 | `dirty` | Auto-save timer (5000ms inactivity) | `auto-saving` | Subtle spinner. `composer.autoSave()` called. |
| SV8 | `auto-saving` | Success | `dirty` | "Auto-saved [timestamp]" in muted text. History: new auto-save entry. Auto-save does NOT reset dirty flag. |
| SV9 | `auto-saving` | Failure | `dirty` | Silent — no toast. Retries on next timer. Console warning. |
| SV10 | `dirty` | More changes | `dirty` | Timer restarts. No save during active editing. |
| SV11 | Any state | Browser beforeunload | — | If `dirty` or `error`: browser shows "You have unsaved changes" confirmation. |

### Command Palette (Ctrl+K)

**Always available regardless of current panel/modal state.**

- Container: `width: 520px; max-height: 60vh; position: fixed; top: 20%; left: 50%; transform: translateX(-50%)`
- Background: `var(--aqb-surface-1)` (`#0f0f14`), border: `1px solid rgba(255,255,255,0.12)`, border-radius: 12px, shadow: `--aqb-shadow-xl`
- Backdrop: `background: rgba(0,0,0,0.5); backdrop-filter: blur(2px)`, z-index: 4000 (Z_LAYERS.modal)
- Search input: `height: 52px; font: 16px Inter; color: #F5F5F0; border-bottom: 1px solid var(--aqb-border)`, auto-focused on open
- Search behavior: fuzzy match, results update on each keystroke (50ms debounce), empty query shows Recent + all groups
- Result groups: RECENT, NAVIGATION, EDIT, VIEW, AI, EXPORT
- Each result row: `height: 40px; padding: 0 16px; icon 16px + label 13px + shortcut 11px mono`
- Hover: `var(--aqb-surface-3)`. Focused (keyboard): `rgba(99,102,241,0.12)`
- Keyboard: Arrow Down/Up to navigate, Enter to execute, Escape to close
- Entry animation: `opacity: 0; translateY(-8px)` → `opacity: 1; translateY(0)`, 150ms ease-out

### Keyboard Cheat Sheet (? key)

- Modal: `width: 640px; max-height: 80vh`
- Two-column layout with categories: EDITING, CANVAS, NAVIGATION (SIDEBAR), ZOOM, ADVANCED
- Each shortcut row: `height: 28px; action label 13px + keyboard badges 10px mono`
- Keyboard badges: `background: var(--aqb-surface-3); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--aqb-border)`

---

## 3.13 Anti-Fragmentation Rules

These are the most likely failure modes for the shell and navigation. Each MUST be verified.

| # | Risk | What could go wrong | Verification | Pass criteria | PRD source |
|---|------|--------------------|--------------|--------------|----|
| AR3 | Components tab accessibility | Components only accessible via keyboard shortcut ⇧A — not in rail | Verify ⇧A shortcut opens Components panel | Panel opens and shows component library | §8.1 |
| AR4 | Publish tab accessibility | Publish only accessible via keyboard shortcut U — not in rail | Verify U shortcut opens Publish panel | Panel opens and shows publish status | §8.1 |
| AR7 | Keyboard shortcuts changed or removed | Shortcuts conflict with new UI or silently dropped | Run automated shortcut test | All 30+ shortcuts from §5B produce correct action | §5B, §17.2 |
| AR12 | Settings sub-screens collapsed | Settings home shows fewer than 6 cards | Count settings cards | Site, Domains, Analytics, Export, Integrations, Advanced — all 6 accessible | §9.11 |
| AR22 | Command palette keyboard navigation broken | Arrow keys/Enter don't work | Open Ctrl+K → type → navigate with arrows → Enter | Arrow Down/Up moves focus, Enter executes, Escape closes | §17.1 |

### Anti-Downgrade Checklist Items (Navigation-specific, from Output E)

| # | Feature | Check |
|---|---------|-------|
| N1 | Rail has exactly 8 icons total | Count: 5 TOP + 3 BOTTOM |
| N2 | TOP zone: Add, Media, Layers, Templates, Pages | Name each icon |
| N3 | BOTTOM zone: Design, Settings, History | Name each icon |
| N4 | Active rail icon has distinct visual state | Look for pill/badge behind icon |
| N5 | Rail icon tooltip shows shortcut key | Hover any icon |
| N6 | All 10 tabs have keyboard shortcuts | Check shortcut table |

---

## Plain-English Summary

The Buildrik editor shell is a fixed 6-zone desktop layout: a 52px top bar across the top, a 68px icon rail on the left, a 320px collapsible sidebar next to the rail, a flexible canvas in the center with a 40px footer bar, and a 300px inspector on the right.

The rail has exactly 8 icons split into two groups separated by a spacer: 5 in the top group (Add, Media, Layers, Templates, Pages) and 3 in the bottom group (Design, Settings, History). Components (⇧A) and Publish (U) are keyboard-shortcut-only tabs — they exist in GROUPED_TABS_CONFIG but are NOT in the rail icon row.

The top bar has 9 controls: Logo/project name, undo, redo, device switcher (3 breakpoints: Desktop/Tablet/Mobile — no Watch), save status indicator, sync indicator, issues badge, preview button, and publish button. There is NO overflow menu (···) — features are distributed to Canvas Footer, sidebar tabs, and inspector.

Panels open in drawer mode by default (unpinned) — clicking outside closes them. Users can pin panels to keep them open. The panel state machine has 13 transitions across 4 states. All 10 panels share an identical header pattern with title, pin icon, and close icon.

Navigation happens through 4 parallel mechanisms: rail clicks, single-key shortcuts (A/T/Z/P/⇧A/J/D/S/U/H), the Ctrl+K command palette, and direct shortcuts. None of these are deprecated.

All surfaces use `--aqb-*` CSS custom properties from `src/themes/default.css`. The editor uses Emotion CSS-in-JS exclusively. The editor UI is not responsive — it requires a minimum 1024px viewport.

---

## Source Traceability

| Part 3 Section | PRD Source Section(s) |
|---------------|----------------------|
| 3.1 Editor Shell Structure | §6.2 Zone Ownership |
| 3.2 Information Architecture | §6 whole section, §8, §9 |
| 3.3 Layout Grid | §6.1, §6.2, §6.3, §6.4 |
| 3.4 Top Bar Architecture | §7.1 |
| 3.5 Top Bar Zones | §7.2, §7.3, §7.4, §7.5, §13.1, §13.5 |
| 3.6 Navigation Rail | §8.1, §8.2, §8.3, §8.4, §8.5 |
| 3.7 Tab Taxonomy | §5E, §8.1 |
| 3.8 Panel Switching Logic | §19.1, §9.1, §9.2, §9.3, §9.4 |
| 3.9 Global Regions | §20.4 ARIA landmarks |
| 3.10 Shell Consistency Rules | §23.1, §23.3, §22.1, §27.3 |
| 3.11 Navigation Consistency Rules | §5B, §20.2 |
| 3.12 Required Shell Behaviors | §20.3, §20.4, §19.3, §17.1, §17.2 |
| 3.13 Anti-Fragmentation Rules | §30, Output E §E.1 |

---

## Unclear or Ambiguous Items

| # | Item | Note |
|---|------|------|
| 1 | ~~Watch breakpoint~~ RESOLVED | BreakpointDropdown.tsx only has 3 breakpoints: Desktop (1440px), Tablet (768px), Mobile (375px). There is NO Watch breakpoint in the codebase. PRD references to Watch are aspirational/not implemented. |
| 2 | Inspector collapse trigger | §6.2 says inspector "collapses to 0px" but no explicit collapse toggle or state machine is defined for the inspector panel (only for the left sidebar). The inspector appears to always show IS-1 empty state when nothing is selected, rather than truly collapsing. |
| 3 | ~~Rail icon for Publish~~ RESOLVED | Publish is NOT in the rail at all. It is a keyboard-only tab (U shortcut). The `// publish: removed from rail` comment in tabsConfig.ts confirms this. |
