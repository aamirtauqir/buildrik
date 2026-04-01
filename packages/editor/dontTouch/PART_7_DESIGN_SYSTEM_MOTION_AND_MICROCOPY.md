# PART 7 — DESIGN SYSTEM, MOTION, AND MICROCOPY

> Extracted from `prd_final.md` §22–§25 + §27.4 + scattered design-system specs from §6–§11.
> Covers: typography system, color/surface/border/shadow tokens, spacing/layout rhythm, token naming, system-level component language, motion principles, transitions, micro-interactions, reduced motion, microcopy, labeling, tone/trust, anti-noise rules.

---

## 1. Purpose

This document captures every design-system, motion, and microcopy rule defined in the Buildrik PRD. It is the single reference for:

- **Typography**: all 24 type styles used across the editor UI
- **Color / Surface / Border / Shadow**: every token, its value, contrast ratio, and usage
- **Spacing and Layout Rhythm**: panel dimensions, padding constants, gaps, and grid patterns
- **Token Naming**: the `--aqb-[category]-[variant]` convention and when to create new tokens
- **System-Level Component Language**: shared control specs (inputs, toggles, dropdowns, sliders, swatches, segmented controls) that appear identically across all panels and inspector sections
- **Motion**: 5 durations, 5 easings, 23 named animation specs, and the reduced-motion contract
- **Microcopy**: 5 principles, trust signals, labeling rules, tone/clarity rules, and anti-noise constraints

Nothing in this document is invented. Every value traces to `prd_final.md`.

---

## 2. Typography

Source: §22 (Typography System)

### 2.1 Font Stack Declarations

| Role | Font Stack | Loading |
|------|-----------|---------|
| UI font | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` | Google Fonts (`wght@400;500;600;700`), `font-display: swap` |
| Mono font | `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace` | Google Fonts (`wght@400;500;600`), `font-display: swap` |

### 2.2 Full Typography Table (24 Styles)

| # | Element | Font | Size | Line Height | Weight | Letter Spacing | Color | Transform | Usage |
|---|---------|------|------|-------------|--------|---------------|-------|-----------|-------|
| T1 | Modal title | Inter | 18px | 24px | 700 | -0.01em | #F5F5F0 | none | "Export your site", "Keyboard Shortcuts" |
| T2 | Panel header / tab name | Inter | 14px | 20px | 600 | 0 | #F5F5F0 | none | "Build", "Templates", "Media" |
| T3 | Section label (accordion) | Inter | 10px | 14px | 600 | 0.5px | #908D85 | uppercase | "POSITION", "TYPOGRAPHY", "SHADOWS" |
| T4 | Body text / control labels | Inter | 13px | 20px | 400 | 0 | #B8B5AD | none | Property labels, descriptions |
| T5 | Body text (emphasized) | Inter | 13px | 20px | 500 | 0 | #F5F5F0 | none | Selected item names, active states |
| T6 | Small text / hints | Inter | 12px | 16px | 400 | 0 | #908D85 | none | Helper text, timestamps, sub-labels |
| T7 | Extra small / badges | Inter | 10px | 14px | 600 | 0 | varies | varies | Status badges, count indicators |
| T8 | Monospace (IDs) | JetBrains Mono | 11px | 16px | 400 | 0 | #A09D96 | none | Element IDs: `#abc12` |
| T9 | Monospace (code/CSS) | JetBrains Mono | 12px | 18px | 400 | 0 | #F5F5F0 | none | CSS editor, raw code, data attributes |
| T10 | Monospace (values) | JetBrains Mono | 12px | 16px | 400 | 0 | #F5F5F0 | none | Number inputs, unit values, hex colors |
| T11 | Button (primary) | Inter | 13px | 36px | 600 | 0 | #FFFFFF | none | "Publish Site", "Apply" |
| T12 | Button (ghost) | Inter | 13px | 36px | 500 | 0 | #B8B5AD | none | "Cancel", "Skip" |
| T13 | Button (destructive) | Inter | 13px | 36px | 600 | 0 | #FFFFFF | none | "Delete", "Clear" — bg: #ef4444 |
| T14 | Button (mini) | Inter | 11px | 24px | 500 | 0 | #B8B5AD | none | Inline actions, "Restore", "Compare" |
| T15 | Tab label (active) | Inter | 13px | 32px | 600 | 0 | #F5F5F0 | none | Active tab in inspector/sidebar |
| T16 | Tab label (inactive) | Inter | 13px | 32px | 400 | 0 | #B8B5AD | none | Inactive tabs |
| T17 | Tooltip text | Inter | 11px | 16px | 400 | 0 | #F5F5F0 | none | Hover tooltips, shortcut hints |
| T18 | Keyboard shortcut badge | JetBrains Mono | 10px | 16px | 600 | 0 | #908D85 | none | `Ctrl+K`, `⌘S` — bg: `var(--aqb-surface-3)` |
| T19 | Breadcrumb text | Inter | 11px | 16px | 400 | 0 | #908D85 | none | `body > section > div` path |
| T20 | Breadcrumb current | Inter | 11px | 16px | 500 | 0 | #F5F5F0 | none | Last item in breadcrumb |
| T21 | Input placeholder | Inter | 12px | — | 400 | 0 | #5a584f | none | "Search sections...", "https://..." |
| T22 | Toast message | Inter | 13px | 20px | 500 | 0 | #F5F5F0 | none | "Site published!", "Save failed" |
| T23 | Canvas element badge | Inter | 10px | 14px | 500 | 0 | #FFFFFF | none | Element type labels on canvas hover |
| T24 | Snap line label | JetBrains Mono | 9px | 12px | 400 | 0 | #FFFFFF | none | "0px", "→ Hero Section" |

### 2.3 Typography Rules

- All 24 styles must be preserved. Redesign must not consolidate or remove any style.
- `font-display: swap` is required for both Inter and JetBrains Mono to avoid FOIT.
- Monospace (T8–T10, T18, T24) is used exclusively for code, IDs, values, keyboard shortcuts, and snap labels. Never use monospace for UI labels or body text.
- Section labels (T3) always use uppercase + letter-spacing: 0.5px. This is the only text transform in the system.

---

## 3. Color and Surface System

Source: §23.1–§23.2

### 3.1 Surface Hierarchy (8 Levels)

| # | Token | Value | RGB | Contrast vs #F5F5F0 | Usage |
|---|-------|-------|-----|---------------------|-------|
| S1 | `--aqb-app-bg` | `#0A0A0A` | 10,10,10 | 17.1:1 | HTML body, outermost shell background — **⚠️ `--aqb-app-bg` does NOT exist in `default.css`. Closest match: `--aqb-bg-darker: #08080e`.** |
| S2 | `--aqb-surface-1` | `#0f0f14` | 15,15,20 | 15.7:1 | Primary panel backgrounds — rail, sidebar, inspector, top bar |
| S3 | `--aqb-surface-2` | `#16161d` | 22,22,29 | 14.2:1 | Elevated cards/sections — element cards, context menu, floating toolbar, modals |
| S4 | `--aqb-surface-3` | `#1e1e26` | 30,30,38 | 12.8:1 | Interactive backgrounds — input fields, hover states, toggle off, segmented control bg |
| S5 | `--aqb-surface-4` | `#26262f` | 38,38,47 | 11.5:1 | Active/pressed states — selected items, active toggle, pressed button |
| S6 | `--aqb-surface-5` | `#2e2e38` | 46,46,56 | 10.4:1 | Highest elevation overlays — tooltips, dropdown menus, popovers |
| S7 | `--aqb-bg-canvas` | `#ffffff` | 255,255,255 | — | Canvas background — **⚠️ Token name is `--aqb-bg-canvas` (not `--aqb-canvas-bg`), value is `#ffffff` (not `#F2F2F2`)** |
| S8 | `--aqb-canvas-content` | `#FFFFFF` | 255,255,255 | — | Editable canvas page (white content area) — **⚠️ `--aqb-canvas-content` does NOT exist in `default.css`** |

**Elevation hierarchy rule:** S1 (base) → S2 (card) → S3 (interactive) → S4 (active) → S5 (popover). Each step is approximately +8 lightness in HSL. This progression must be preserved.

### 3.2 Primary Action Colors (5 Tokens)

| # | Token | Value | RGB | Usage |
|---|-------|-------|-----|-------|
| C1 | `--aqb-primary` | `#6366f1` | 99,102,241 | Primary CTAs, active states, focus rings, links, selected outlines |
| C2 | `--aqb-primary-hover` | `#818cf8` | 129,140,248 | Hover state on primary buttons |
| C3 | `--aqb-primary-active` | `#4f46e5` | 79,70,229 | Pressed/active state on primary |
| C4 | `--aqb-primary-light` | `rgba(99,102,241,0.12)` | — | Subtle background tints — badges, info boxes, AI suggestion cards, overlay toggle on-state |
| C5 | `--aqb-secondary` | `#8b5cf6` | 139,92,246 | Secondary accent — component boundaries, secondary badges |

### 3.3 Semantic Colors (5 Tokens)

| # | Token | Value | Usage |
|---|-------|-------|-------|
| SC1 | `--aqb-success` | `#22c55e` | Success states, published badge, online indicator |
| SC2 | `--aqb-warning` | `#f59e0b` | Warning states, pseudo-state editing indicator, draft chip, degraded connection |
| SC3 | `--aqb-error` | `#ef4444` | Error states, delete actions, invalid drop zones, poor connection |
| SC4 | `--aqb-info` | `#3b82f6` | Info states, info toasts — **⚠️ Breakpoint override dots do NOT use `--aqb-info`; they use `var(--aqb-primary, #6366f1)` per `InputControls.tsx`** |
| SC5 | `--aqb-teal` | `#14b8a6` | Canvas hover outlines, snap lines, valid drop zones — **⚠️ `--aqb-teal` does NOT exist in `default.css`; teal `#14b8a6` is used as inline color** |

### 3.4 Text Colors (5 Tokens)

| # | Token | Value | Usage |
|---|-------|-------|-------|
| TC1 | `--aqb-text-primary` | `#F5F5F0` | Primary text, headings, active labels |
| TC2 | `--aqb-text-secondary` | `#B8B5AD` | Body text, control labels, inactive items |
| TC3 | `--aqb-text-muted` | `#908D85` | Hints, timestamps, section labels, disabled text |
| TC4 | `--aqb-text-dim` | `#5a584f` | Placeholder text, breadcrumb separators, inherited values — **⚠️ `--aqb-text-dim` does NOT exist in `default.css`; code uses `--aqb-text-disabled: #6B6963` and hardcoded `#5a584f`** |
| TC5 | `--aqb-text-on-primary` | `#FFFFFF` | Text on primary-colored backgrounds — **⚠️ `--aqb-text-on-primary` does NOT exist in `default.css`; code uses `--aqb-text-inverse: #1A1A1A` for inverse and hardcoded `#FFFFFF`** |

> **Note:** Code also defines `--aqb-text-tertiary: #A09D96` and `--aqb-text-disabled: #6B6963` which are not listed in this table.

---

## 4. Border, Radius, and Elevation

Source: §23.3–§23.4

### 4.1 Border System (5 Tokens)

| # | Token | Value | Contrast on S2 | Usage |
|---|-------|-------|---------------|-------|
| B1 | `--aqb-border` | `rgba(255,255,255,0.08)` | ~1.3:1 | Default structural borders — panel edges, card borders, section separators |
| B2 | `--aqb-border-light` | `rgba(255,255,255,0.12)` | ~1.5:1 | More visible borders — hover states on cards, ghost button borders |
| B3 | `--aqb-border-subtle` | `rgba(255,255,255,0.06)` | ~1.2:1 | Very subtle — section separators within panels, toolbar dividers |
| B4 | `--aqb-border-focus` | `rgba(99,102,241,0.5)` | — | Input focus border-color |
| B5 | Focus ring (global) | `outline: 2px solid #6366f1; outline-offset: 2px` | 4.6:1 on S1 | Keyboard focus indicator on all focusable elements |

**WCAG 1.4.11 Warning (A5):** B1 at `rgba(255,255,255,0.08)` does NOT meet 3:1 contrast for non-text elements. For interactive component borders that must be perceivable (input fields, buttons), use B2 (`0.12`) minimum. B1 is acceptable for decorative/structural separators only. This is AT RISK and must be addressed.

### 4.2 Border Radius Scale (5 Tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `--aqb-radius-xs` | `3px` | Extra small — micro elements |
| `--aqb-radius-sm` | `5px` | Small controls — badges, chips, inline tags — **⚠️ was 4px in PRD, actual is 5px** |
| `--aqb-radius-md` | `8px` | Buttons, inputs, segmented controls, menu items — **⚠️ was 6px in PRD, actual is 8px** |
| `--aqb-radius-lg` | `12px` | Cards, panels, context menus, tab bars — **⚠️ was 8px in PRD, actual is 12px** |
| `--aqb-radius-xl` | `16px` | Modals, floating toolbar, large cards — **⚠️ was 12px in PRD, actual is 16px** |
| `--aqb-radius-2xl` | `24px` | Extra large — special containers |
| `--aqb-radius-full` | `9999px` or `50%` | Avatars, dots, circular buttons |

### 4.3 Shadow System (5 Tokens + Glow)

| # | Token | Value | Usage |
|---|-------|-------|-------|
| SH0 | `--aqb-shadow-xs` | `0 1px 2px rgba(0,0,0,0.2)` | Minimal elevation — not in PRD but exists in code |
| SH1 | `--aqb-shadow-sm` | `0 2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.2)` | Subtle elevation — tooltips, presence avatar stack — **⚠️ composite shadow (two layers), PRD listed only single layer** |
| SH2 | `--aqb-shadow-md` | `0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.25)` | Medium elevation — context menu, floating toolbar, dropdowns — **⚠️ composite** |
| SH3 | `--aqb-shadow-lg` | `0 8px 24px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.3)` | High elevation — floating panels, sidebar, color picker — **⚠️ composite** |
| SH4 | `--aqb-shadow-xl` | `0 16px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.35)` | Maximum elevation — full-screen modals, command palette — **⚠️ composite** |
| SH5 | `--aqb-shadow-2xl` | `0 24px 56px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.4)` | Extra maximum — not in PRD but exists in code |
| SH6 | `--aqb-shadow-inner` | `inset 0 1px 2px rgba(0,0,0,0.25)` | Inset shadow — not in PRD but exists in code |
| SH7 | `--aqb-shadow-glow` | `0 0 20px rgba(59,130,246,0.25)` | Focus/active glow — active drag targets, connection quality pulsing |

**Shadow direction rule:** All shadows use `y > 0` (light source from top). No upward shadows.

---

## 5. Spacing and Layout Rhythm

Source: §6.1–§6.4, §9.1–§9.4, §11.2–§11.3

### 5.1 Shell Dimensions

| Zone | Width | Height | Background | z-index |
|------|-------|--------|------------|---------|
| Top Bar | 100% viewport | **48px** (`HEADER_HEIGHT`) / CSS fallback 52px | `--aqb-surface-1` | 1000 |
| Rail | **60px** (`RAIL_WIDTH`) / CSS `var(--aqb-sidebar-width, 68px)` | viewport - topbar | `--aqb-surface-1` | 900 |
| Left Sidebar | **320px** default (`DRAWER_WIDTH`) / 280px compact / 400px extended | viewport - topbar | `--aqb-surface-1` | 800 |
| Canvas | flex: 1 | viewport - topbar - 40px footer | `--aqb-bg-canvas: #ffffff` | 1 |
| Canvas Footer | same as Canvas | 40px fixed | `--aqb-surface-1` | 100 |
| Right Inspector | **300px** (`INSPECTOR_WIDTH`) | viewport - topbar | `--aqb-surface-1` | 800 |

> **⚠️ Dimension source conflicts:** TypeScript constants in `layout.ts` (HEADER_HEIGHT: 48, RAIL_WIDTH: 60) differ from CSS fallbacks in `LayoutShell.css` (topbar: 52px, rail: `var(--aqb-sidebar-width, 68px)`). CSS custom properties in `default.css` add a third source: `--aqb-sidebar-width: 56px`. TypeScript constants take precedence in layout calculations.

**Canvas width calculation (using TypeScript constants):**
```
canvas_width = viewport_width - 60px (RAIL_WIDTH) - 320px (DRAWER_WIDTH) - 300px (INSPECTOR_WIDTH)
At 1440px = 760px
At 1024px = 344px (minimum)
Both collapsed = viewport_width - 60px
```

**Reference viewport:** 1440 × 900px. **Minimum supported:** 1024 × 768px.

### 5.2 Panel Spacing Constants

| Area | Padding |
|------|---------|
| Panel header | `0 16px` (horizontal only), height: 48px |
| Panel content | `16px` (all sides) |
| Section headers within content | `0` (flush with content padding) |
| Cards (Settings home) | `8px` gap between cards |

### 5.3 Inspector Spacing

| Element | Value |
|---------|-------|
| Inspector header (all 8 rows) | `padding: 12px 14px` — **⚠️ PRD said 16px horizontal, actual is 14px per `inspector/styles/index.ts`** |
| Section accordion header | `height: 32px; padding: 0 16px` |
| Section accordion body | `padding: 8px 16px 12px 16px` |
| Border between sections | `1px solid var(--aqb-border-subtle)` (`rgba(255,255,255,0.06)`) |

### 5.4 Common Gap Values

| Context | Gap | Source |
|---------|-----|-------|
| Rail icon vertical gap | 4px | §8.1 |
| Element card grid gap (Build tab) | 8px | §9.5 — 4 columns in 280px panel |
| Media library grid gap | 4px | §9.10 — 3 columns |
| Template grid gap | 8px | §9.6 — 2 columns |
| Filter chip gap | 6px | §9.6, §9.10 |
| Floating toolbar button gap | 2px | §10.3 |
| Context menu item gap | 0 (items are flush, separated by padding) | §10.8 |
| Inspector control gap (segmented) | 2px | §11.2 |

---

## 6. Token Logic and Naming

Source: §27.4

### 6.1 Naming Convention

**Pattern:** `--aqb-[category]-[variant]`

| Category | Examples | When to Create |
|----------|---------|---------------|
| `surface` | `--aqb-surface-1` through `--aqb-surface-5` | New background layer needed |
| `primary` | `--aqb-primary`, `--aqb-primary-hover` | New primary color variant |
| `border` | `--aqb-border`, `--aqb-border-focus` | New border style |
| `shadow` | `--aqb-shadow-sm` through `--aqb-shadow-xl` | New elevation level |
| `radius` | `--aqb-radius-sm` through `--aqb-radius-xl` | New corner radius |
| `duration` | `--aqb-duration-instant` through `--aqb-duration-slower` | New animation speed — **⚠️ uses semantic names (instant/fast/normal/moderate/slow/slower), NOT numeric suffixes** |
| `text` | `--aqb-text-primary`, `--aqb-text-muted` | New text color role |
| `success`, `warning`, `error`, `info` | `--aqb-success`, `--aqb-error` | New semantic state |

### 6.2 Token Rules

- All tokens must be defined in `src/themes/default.css` ONLY.
- No inline hex values for established design tokens.
- Every pixel value, color, shadow, and radius must reference a token or be documented in the PRD.
- Components read tokens via `var(--aqb-token-name)`.

---

## 7. System-Level Component Language

Source: §11.3 (shared control specs), §9.1 (panel header), §8.3 (tooltip), §10.8 (menu item), various

These are the shared UI primitives that appear identically across all panels and inspector sections.

### 7.1 Panel Header (SSOT — All 10 Panels)

```
[Tab icon 16px] [Tab Name 14px semibold]    [📌 pin] [✕ close]
Height: 48px | Padding: 0 16px
Background: --aqb-surface-1
Border-bottom: 1px solid rgba(255,255,255,0.08)
```

- Tab icon: 16px Lucide, `--aqb-text-secondary`, 8px gap to title
- Tab Name: T2 style (14px, weight 600, `--aqb-text-primary`)
- Pin icon: 16px Lucide `pin`/`pin-off`, `--aqb-text-muted`, hover: `--aqb-text-secondary`
- Close icon: 16px Lucide `x`, `--aqb-text-muted`, hover: `--aqb-text-secondary`
- Gap between pin and close: 4px

### 7.2 Number Input

- `width: 64px; height: 28px; border-radius: 6px`
- `background: var(--aqb-surface-3); border: 1px solid var(--aqb-border)`
- `font: 12px JetBrains Mono; color: #F5F5F0; padding: 0 6px; text-align: right`
- Focus: `border-color: var(--aqb-border-focus)`

### 7.3 Unit Selector

- `width: 32px; height: 28px; font: 10px Inter; color: #908D85; border-radius: 0 6px 6px 0`
- Appended right of number input
- Options: px, %, rem, em, vw, vh, auto

### 7.4 Dropdown

- `height: 28px; border-radius: 6px; background: var(--aqb-surface-3); border: 1px solid var(--aqb-border)`
- `font: 12px Inter; color: #F5F5F0; padding: 0 8px`
- Chevron right

### 7.5 Toggle Switch

- `width: 36px; height: 20px; border-radius: 10px`
- Off: `background: var(--aqb-surface-4)`
- On: `background: var(--aqb-primary)`
- Thumb: `width: 16px; height: 16px; border-radius: 50%; background: #FFFFFF`

### 7.6 Color Swatch

- `width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--aqb-border)`
- Shows current color fill
- Click → opens color picker popover

### 7.7 Segmented Control

- `height: 28px; border-radius: 6px; background: var(--aqb-surface-3); display: flex`
- Each option: `padding: 0 8px; font: 11px Inter`
- Active: `background: var(--aqb-surface-4); color: #F5F5F0`
- Inactive: `color: #908D85`

### 7.8 Slider

- Track: `height: 4px; border-radius: 2px; background: var(--aqb-surface-4)`
- Filled portion: `background: var(--aqb-primary)`
- Thumb: `width: 14px; height: 14px; border-radius: 50%; background: #FFFFFF; border: 2px solid var(--aqb-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.3)`

### 7.9 Section Accordion

- Header: `height: 32px; padding: 0 16px; cursor: pointer`
- Header label: T3 style (10px, weight 600, uppercase, letter-spacing 0.5px, `#908D85`)
- Chevron: Lucide `chevron-right`/`chevron-down`, 12px, `#908D85`, transition `transform 150ms ease`
- Body: `padding: 8px 16px 12px 16px`
- Hover header: `background: var(--aqb-surface-3)`
- Border: `1px solid var(--aqb-border-subtle)`
- Default: **6+ sections have `defaultOpen` set** (Display, Spacing, CSSClasses, Grid, Link, ElementProperties, plus conditional ones) — **⚠️ PRD said "first 3 expanded", actual is more**

### 7.10 Tooltip

- Trigger: mouse hover after **500ms default delay** (`Tooltip.tsx` default `delay = 500`) — **⚠️ PRD claimed 400ms rail / 300ms toolbar, but code uses a generic 500ms for all tooltips. Rail CSS shows `transition-delay: 0.2s` (200ms) for rail-specific tooltip CSS.**
- Position: context-dependent (right of rail, above/below controls)
- Background: `--aqb-surface-5` (#2e2e38)
- Text: T17 style (11px, `--aqb-text-primary`). Shortcut: T18 style (10px mono, `--aqb-text-muted`)
- Padding: 6px 10px
- Border-radius: 6px
- Shadow: `--aqb-shadow-sm`
- Max width: 200px
- Arrow: 6px triangle pointing toward trigger

### 7.11 Menu Item (Context Menu / Dropdown)

- `height: 32px; padding: 0 12px; border-radius: 6px`
- `display: flex; align-items: center; gap: 8px`
- `font: 13px/32px Inter; weight: 400; color: #F5F5F0`
- Shortcut label: `font: 11px JetBrains Mono; color: #908D85; margin-left: auto`
- Hover: `background: var(--aqb-surface-3)`
- Disabled: `opacity: 0.4; pointer-events: none`
- Destructive: `color: #ef4444` on hover
- Separator: `1px solid var(--aqb-border-subtle)`, 4px vertical margin

### 7.12 Search Bar

- Width: 100% (panel width - 32px padding)
- Height: 32px
- Background: `--aqb-surface-3`
- Border: `1px solid var(--aqb-border)`
- Border-radius: 6px
- Font: 13px, `--aqb-text-secondary`
- Icon: Lucide `search` 14px left, 8px padding
- Clear button: Lucide `x` 14px right, visible when value not empty
- Focus: `border-color: var(--aqb-border-focus)`, ring 2px

### 7.13 Filter Chips / Pills

- Height: 28px, font: 12px, padding: 4px 12px
- Active: `--aqb-primary` bg, white text
- Inactive: `--aqb-surface-3` bg, `--aqb-text-secondary`
- Horizontal scroll if overflow, gap: 6px

### 7.14 Ghost Button

- Height: 36px, padding: 0 20px, border-radius: 8px
- Background: transparent
- Border: `1px solid var(--aqb-border-light)` (`rgba(255,255,255,0.12)`)
- Font: T12 style (13px, weight 500, `#B8B5AD`)
- Hover: `background: var(--aqb-surface-3); color: #F5F5F0`

### 7.15 Primary Button

- Height: 36px, padding: 0 20px, border-radius: 8px
- Background: `var(--aqb-primary)` (#6366f1)
- Font: T11 style (13px, weight 600, #FFFFFF)
- Hover: `var(--aqb-primary-hover)` (#818cf8)
- Active: `var(--aqb-primary-active)` (#4f46e5)

### 7.16 Destructive Button

- Same dimensions as primary
- Background: `--aqb-error` (#ef4444)
- Font: T13 style (13px, weight 600, #FFFFFF)

---

## 8. Motion Principles

Source: §24.1–§24.2

### 8.1 Duration Scale (6 Levels)

| # | Token | Duration | CSS Variable | Usage | Examples |
|---|-------|---------|-------------|-------|---------|
| D1 | instant | **50ms** | `--aqb-duration-instant` | State toggles, checkbox, radio, segmented control | Toggle on/off, tab content swap — **⚠️ PRD said 0ms, actual is 50ms** |
| D2 | fast | 100ms | `--aqb-duration-fast` | Micro-interactions, color changes | Tooltip fade, hover background, toast appear/dismiss, hover outline |
| D3 | normal | 150ms | `--aqb-duration-normal` | Panel transitions, modal entry | Panel slide in/out, modal scale+fade, accordion expand/collapse |
| D4 | moderate | 200ms | `--aqb-duration-moderate` | Larger movements | Sidebar slide, overlay fade, AIAssistantBar slide up |
| D5 | slow | 300ms | `--aqb-duration-slow` | Complex transitions, full-screen changes | Copilot modal, full-screen overlays, X-Ray mode transition |
| D6 | slower | 400ms | `--aqb-duration-slower` | Multi-step complex transitions | Not in PRD but exists in code |

> **⚠️ PRD claimed 5 levels with numeric CSS variable names (`--aqb-duration-0` through `--aqb-duration-300`). Actual code has 6 levels with semantic names (`instant`, `fast`, `normal`, `moderate`, `slow`, `slower`).**

### 8.2 Easing Curves (5 Types)

| # | Name | CSS Value | Usage |
|---|------|----------|-------|
| E1 | Default (ease-in-out) | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions — symmetric feel. Panel open/close, modal, accordion. |
| E2 | Enter (decelerate) | `cubic-bezier(0, 0, 0.2, 1)` | Elements appearing — fast start, gentle stop. Toast slide in, modal enter, dropdown open. |
| E3 | Exit (accelerate) | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving — gentle start, fast end. Toast dismiss, modal exit, panel close. |
| E4 | Spring | GSAP `elastic.out(1, 0.5)` | Canvas element interactions only — drag release snap-back, resize bounce. NOT used in UI chrome. |
| E5 | Linear | `linear` | Progress bars, continuous animations (marquee dash offset, loading spinner rotation). |

### 8.3 Core Motion Rules

- **Enter uses E2 (decelerate), Exit uses E3 (accelerate)** — this asymmetry is intentional and must be preserved
- **E4 (Spring) is canvas-only** — never apply spring easing to UI chrome (panels, modals, menus)
- **E5 (Linear) is for continuous/indeterminate animations only** — never for discrete state transitions
- **Tab content switches are instant (0ms)** — no crossfade, no slide
- **Element selection outline is instant (0ms)** — no animation on outline-color change

---

## 9. Motion Behavior — Complete Transition Table

Source: §24.4

### 9.1 All 23 Named Animations

| # | Interaction | Property | From | To | Duration | Easing | Notes |
|---|-----------|----------|------|-----|---------|--------|-------|
| M1 | Panel open | `transform` | `translateX(-100%)` | `translateX(0)` | 150ms | E1 | Slide from left |
| M2 | Panel close | `transform` | `translateX(0)` | `translateX(-100%)` | 150ms | E3 | Slide to left |
| M3 | Modal enter | `opacity`, `transform` | `0`, `scale(0.96)` | `1`, `scale(1)` | 150ms | E2 | Fade + scale up |
| M4 | Modal exit | `opacity`, `transform` | `1`, `scale(1)` | `0`, `scale(0.96)` | 100ms | E3 | Fade + scale down |
| M5 | Modal backdrop enter | `opacity` | `0` | `1` | 150ms | E1 | Background overlay |
| M6 | Toast enter | `transform`, `opacity` | `translateY(16px)`, `0` | `translateY(0)`, `1` | 100ms | E2 | Slide up from bottom |
| M7 | Toast dismiss | `opacity` | `1` | `0` | 100ms | E3 | Fade out only |
| M8 | Element selected | `outline-color` | `transparent` | `#6366f1` | 0ms | — | Instant (no animation) |
| M9 | Element hover outline | `opacity` | `0` | `1` | 100ms | E1 | Outline overlay fades in |
| M10 | Accordion expand | `max-height` | `0` | `auto` (measured) | 150ms | E1 | Uses measured content height |
| M11 | Accordion collapse | `max-height` | measured | `0` | 150ms | E1 | — |
| M12 | Tab content switch | — | — | — | 0ms | — | Instant (no animation) |
| M13 | Tooltip enter | `opacity` | `0` | `1` | 100ms | E2 | After 500ms hover delay — **⚠️ PRD said 300ms, actual `Tooltip.tsx` default is 500ms** |
| M14 | Tooltip exit | `opacity` | `1` | `0` | 100ms | E3 | On mouse leave |
| M15 | Dropdown open | `opacity`, `transform` | `0`, `translateY(-4px)` | `1`, `translateY(0)` | 100ms | E2 | — |
| M16 | Dropdown close | `opacity` | `1` | `0` | 100ms | E3 | — |
| M17 | AIAssistantBar enter | `transform` | `translateY(100%)` | `translateY(0)` | 200ms | E2 | Slides up from bottom |
| M18 | AIAssistantBar exit | `transform` | `translateY(0)` | `translateY(100%)` | 150ms | E3 | Slides down |
| M19 | Color swatch change | `background-color` | old color | new color | 100ms | E1 | Smooth color transition |
| M20 | Toggle switch | `transform` (thumb) | `translateX(0)` | `translateX(16px)` | 100ms | E1 | Thumb slides left/right |
| M21 | Progress bar (indeterminate) | `transform` | `translateX(-100%)` | `translateX(100%)` | 2000ms | E5 | Infinite loop |
| M22 | Cursor fade (collab idle) | `opacity` | `1` | `0.4` then `0` | 500ms | E3 | After 3s idle → 0.4; after 10s → 0 |
| M23 | Command palette enter | `opacity`, `transform` | `0`, `translateY(-8px)` | `1`, `translateY(0)` | 150ms | E2 | — |

---

## 10. Micro-Interactions and Feedback

Source: §24.4, §7.2, §9.5–§9.13, §10.1–§10.8, §11.2

### 10.1 Hover Feedback

| Element | Hover Response |
|---------|---------------|
| Rail icon | opacity 0.4 → 0.7, `100ms ease` |
| Panel row / list item | bg → `--aqb-surface-3` |
| Element card (Build tab) | bg → `--aqb-surface-3`, border → `--aqb-border-light` |
| Canvas element | teal outline appears (`2px solid rgba(20,184,166,0.6)`), M9 fade-in 100ms |
| Canvas element type badge | appears above top-left, `10px Inter` on teal bg |
| Floating toolbar button | bg → `--aqb-surface-3`, color → `#F5F5F0` |
| Context menu item | bg → `--aqb-surface-3` |

### 10.2 Active/Press Feedback

| Element | Press Response |
|---------|---------------|
| Rail icon (active) | `--aqb-primary` pill bg, icon at 100% opacity white |
| Primary button | bg → `--aqb-primary-active` (#4f46e5) |
| Floating toolbar button | bg → `--aqb-surface-4` |

### 10.3 Selection Feedback

| Context | Visual |
|---------|--------|
| Element selected (canvas) | `2px solid #6366f1` outline, 8 resize handles, floating toolbar |
| Multi-select | Each element: `2px solid #6366f1`. Group: `1px dashed rgba(99,102,241,0.4)` bounding box |
| Layer node selected | bg: `--aqb-primary-light`, left border: `2px solid --aqb-primary` |
| Page row active | Left border: `2px solid --aqb-primary`, bg: `--aqb-primary-light` |

### 10.4 Drag Feedback

| Context | Visual |
|---------|--------|
| Drag from sidebar | Ghost at cursor (opacity 0.7), source card at 0.3 opacity. Valid drop: teal dashed border. Invalid: red dashed + "Cannot drop here" label. |
| Drag within canvas | Element at 0.5 opacity, original position ghost outline `1px dashed rgba(99,102,241,0.2)`. Snap lines appear at 6px threshold. |
| Layer drag-to-reorder | Node at 0.5 opacity, drop indicator line: `2px solid --aqb-primary` |

### 10.5 State Change Indicators

| Indicator | Visual |
|-----------|--------|
| Save status dot | Green (#22c55e) = saved/idle, **Blue (#4b8dff) = saving**, Red (#ef4444) = error — **⚠️ No amber "dirty" dot exists; saving uses blue not amber per `StatusIndicators.tsx`** |
| Sync status dot | Green = synced, **Blue (#4b8dff) = syncing**, Red = offline/error — **⚠️ Syncing uses blue not amber per `StatusIndicators.tsx`** |
| DraftChip (Design tab) | Amber pill, pulsing amber dot (opacity 0.5→1.0, 1.5s infinite), "N unsaved" text |
| Breakpoint override dot | `6px` **indigo** dot (`var(--aqb-primary, #6366f1)`) left of overridden property label — **⚠️ uses `--aqb-primary` (indigo), not `#3b82f6` (blue) per `InputControls.tsx`** |
| Pseudo-state override dot | `6px` amber dot (#f59e0b) top-right of pseudo-state button |
| Publishing state | Button disabled, text "Publishing..." + spinner, bg at 0.7 opacity |

---

## 11. Reduced Motion and Accessibility

Source: §24.3

### 11.1 Media Query

```css
@media (prefers-reduced-motion: reduce) { ... }
```

### 11.2 Reduced Motion Behavior Map

| Behavior | Normal | Reduced Motion |
|----------|--------|---------------|
| CSS transitions | Per duration scale | `transition-duration: 0ms !important` (all) |
| CSS animations | Keyframe animations run | `animation-duration: 0ms !important; animation-iteration-count: 1 !important` |
| GSAP animations | Full animation | **⚠️ `gsap.globalTimeline.timeScale(999)` is NOT implemented in codebase.** Reduced motion uses CSS: `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important` + `useReducedMotion()` hook |
| Panel open/close | Slide animation (M1/M2) | Instant show/hide (no slide) |
| Modal enter/exit | Scale + fade (M3/M4) | Instant show/hide |
| Toast enter/exit | Slide up + fade (M6/M7) | Instant show/hide |
| ApplyProgressOverlay | Animated progress bar + cycling text | Static spinner (no animation) + fixed "Applying..." |
| Marquee dash animation | Animated `stroke-dashoffset` | Static dashed border (no animation) |
| AI sparkle pulse | Opacity pulse | Static opacity (no pulse) |
| Loading spinner | Rotation animation | Static icon (no rotation) |

### 11.3 Rules

- Reduced motion must never break functionality — all state transitions still occur, just instantly.
- `!important` overrides are acceptable here because reduced motion is a user-level accessibility preference.
- **⚠️ GSAP's `globalTimeline.timeScale(999)` is NOT implemented in the codebase.** Reduced motion for GSAP is handled via CSS `animation-duration: 0.01ms !important` + `useReducedMotion()` hook, not via GSAP's timeline API.
- The DraftChip pulsing amber dot (§10.5) must also stop pulsing under reduced motion — use static opacity 1.0.

---

## 12. Microcopy Principles

Source: §25.1

### Principle 1 — Always Say What Will Happen (Not Just What the Button Is)

| Bad | Good | Why |
|-----|------|-----|
| "Submit" | "Publish Site" | User knows the outcome |
| "Restore" | "Restore to v1.2 — color system update" | User knows which version |
| "Cancel" | "Discard changes and go back" | User knows the cost |
| "OK" | "Got it" or "Continue" | "OK" is ambiguous |
| "Apply" | "Apply to 12 elements" | User knows the scope |
| "Remove" | "Remove from favorites" | User knows what is removed |

### Principle 2 — Error Messages Explain Why + What to Do

| Bad | Good |
|-----|------|
| "Save failed" | "Could not save — check your connection and try again" |
| "Error" | "Template could not load. The file may be corrupted. [Try another template]" |
| "Feature locked" | "This feature requires a Pro plan — [Upgrade to unlock]" |
| "Invalid" | "Font file must be .woff, .woff2, .ttf, or .otf" |
| "Upload failed" | "Image exceeds 10 MB limit. Resize or compress before uploading." |

### Principle 3 — Destructive Actions Require Confirmation with Stated Consequence

| Action | Confirmation Text | Buttons |
|--------|------------------|---------|
| Delete element | "Delete this [type]? This cannot be undone." | [Delete] destructive + [Keep] ghost |
| Delete multiple | "Delete [N] elements? This cannot be undone." | [Delete All] destructive + [Keep] ghost |
| Clear history | "Clear all history? Auto-saves will also be removed. This cannot be undone." | [Clear] destructive + [Cancel] ghost |
| Unpublish site | "Unpublish your site? It will no longer be accessible at [URL]." | [Unpublish] destructive + [Keep Published] ghost |
| Replace page (Copilot) | "Replace current page? Your current content will be saved as a version." | [Replace] destructive + [Cancel] ghost |
| Restore version | "Restore to [version name]? Your current changes will be saved as an auto-save first." | [Restore] primary + [Cancel] ghost |

### Principle 4 — Progress Always Communicates Status (Never Silent Loading)

| Context | Loading Text | Completion Text |
|---------|-------------|----------------|
| Save | "Saving..." | "Saved at 2:45 PM" |
| Publish | "Publishing..." | "Site published!" |
| Template apply | "Applying template..." (with progress stages) | "Template applied" |
| Export | "Preparing download..." | "Download complete" |
| AI generate | "Generating..." (with substage text) | "Result ready" |
| Upload | "Uploading [filename]..." with % progress | "Upload complete" |

### Principle 5 — Success Is Acknowledged with Next Action

| Action | Success Text | Next Action |
|--------|-------------|-------------|
| Save | "Saved at 2:45 PM" (timestamp in top bar) | — (implicit) |
| Publish | "Site published!" toast | [Open site →] link in toast |
| Upload | "Upload complete" toast | Asset appears in media library |
| Version saved | "Version saved: [name]" toast | Version appears in History |
| AI applied | "AI changes applied" toast | [Undo] button in toast |
| Export | "Download complete — [file].zip" toast | File auto-downloads |

---

## 13. Labeling, Button Copy, and Helper Text

Source: §25.1, §9.5–§9.13, §10.2–§10.8, §11.2

### 13.1 Button Label Patterns

| Pattern | Example | Rule |
|---------|---------|------|
| Action + object | "Publish Site", "Delete All", "Save Version" | Primary actions state outcome |
| Action + context | "Apply to 12 elements", "Restore to v1.2" | Include scope or version when relevant |
| Escape action | "Keep", "Keep Editing", "Keep Published" | Ghost buttons in destructive dialogs name the safe choice |
| Neutral dismiss | "Got it", "Continue" | Replace "OK" — always |
| Navigation | "Open site →", "Edit SEO →" | Arrows indicate navigation to another view |

### 13.2 Helper Text / Hint Patterns

| Location | Pattern | Example |
|----------|---------|---------|
| Publish checklist incomplete item | 11px hint link, `--aqb-primary`, underline | "Set in Pages → SEO tab" |
| Settings Coming Soon | Description + email capture | "Custom domains are coming soon. Get notified when this feature launches." |
| Empty state | Icon + heading + description + action button | "No elements on this page" + "Add elements from the Build tab." + [Open Build Tab] |
| Tip footer | 12px muted centered | "Tip: Drag to canvas or click to insert. Press A to open." |
| Upload zone | Main text + format strip | "Drop files here or click to upload" + "Supported: Images, Videos, Fonts" |

### 13.3 Placeholder Text Convention

All placeholder text uses T21 style (12px Inter, #5a584f). Placeholders must describe what to enter, not just the field name:

| Field | Placeholder |
|-------|-----------|
| Search (Build tab) | "Search elements..." |
| Search (Media) | "Search my files..." / "Search stock photos..." |
| Search (Inspector) | "Search sections..." |
| Search (Command Palette) | "Search commands, actions, elements..." |
| URL input | "https://..." |
| Page title (SEO) | "Enter page title for search engines" |
| Meta description | "Describe this page in 155 characters" |
| Version name | "e.g., Before header redesign" |
| GA Measurement ID | "G-XXXXXXXXXX" |
| Custom data attribute | Key: "data-", Value: "value" |

---

## 14. Tone, Trust, and Clarity

Source: §25.1–§25.2

### 14.1 Trust Signals (6 Defined)

| # | Signal | Location | Spec |
|---|--------|----------|------|
| TS1 | Security badge | Publish tab | Lucide `shield-check`, 16px, #22c55e + "Your site data is encrypted and stored securely" — 11px Inter, #908D85 |
| TS2 | Auto-save indicator | Top bar | "Auto-saved 2m ago" — always visible after auto-save. 11px Inter, #908D85. Green dot when saved. |
| TS3 | Version history always accessible | Rail History icon (H key) | Users always know they can undo to any point. No "are you sure?" on exploration — only on destructive restore. |
| TS4 | Error boundary recovery | Full-screen error overlay | "Something went wrong" — T1 style + "Your work was auto-saved. Reload to continue." — T4 style + [Reload] primary button |
| TS5 | Undo availability | Throughout UI | Destructive actions from toolbar always include [Undo] in toast. 3000ms duration. |
| TS6 | Offline indicator | Connection quality dot + top bar | "Offline — changes saved locally" badge. No data loss messaging. |

### 14.2 Tone Rules

- **Direct, not casual:** "Could not save" not "Oops, something went wrong!"
- **Specific, not vague:** "Image exceeds 10 MB limit" not "File too large"
- **Actionable, not dead-end:** Every error message must include a path forward (retry button, guidance, alternative)
- **Respectful of expertise:** Don't over-explain to power users. Tooltips provide depth, not labels.
- **Honest about limitations:** "Coming Soon" with email capture, not hidden features

### 14.3 Clarity Rules

- Never use bare "OK" — always "Got it", "Continue", or a specific action label
- Never use bare "Error" — always include what went wrong and what to do
- Never use bare "Cancel" in destructive dialogs — use "Keep" or "Keep [thing]" to name the safe choice
- Toast duration: 3000ms for info/success, 5000ms for warnings, persistent until dismissed for errors with retry

---

## 15. Anti-Noise, Anti-Gimmick, and Anti-Drift Rules

Source: §24, §25, §27.3–§27.4, §30

### 15.1 Anti-Noise Rules

- **Tab content switches are instant (M12 = 0ms)** — no crossfade, no slide animation between tabs
- **Element selection is instant (M8 = 0ms)** — no animated outline transition
- **No sound effects** — the PRD specifies no audio feedback anywhere
- **No loading skeletons for instant operations** — only show loading states for operations that genuinely take time (AI generation, upload, publish)
- **Tooltip delay is 500ms default** — prevents tooltip flicker during normal mouse movement — **⚠️ PRD said 300ms, actual `Tooltip.tsx` default is 500ms**
- **Rail tooltip delay is 200ms** — CSS `transition-delay: 0.2s` in `LeftRail.css` — **⚠️ PRD said 400ms, actual is 200ms**

### 15.2 Anti-Gimmick Rules

- **E4 (Spring easing) is canvas-only** — never apply spring/bounce to UI chrome
- **No parallax, no 3D transforms on UI elements** — the editor is a tool, not a showcase
- **No auto-playing animations in panels** — DraftChip pulse is the only persistent animation in panel content, and it stops under reduced motion
- **No confetti, celebration screens, or gamification beyond AchievementPrompt** — onboarding achievements use a "celebratory micro-animation" (per §5G) but this is the only instance

### 15.3 Anti-Drift Rules (Token Discipline)

- Every pixel value, color, shadow, and radius MUST reference a token or be explicitly documented in the PRD — no magic numbers
- All `--aqb-*` tokens live in `src/themes/default.css` ONLY — no token definitions elsewhere
- Inline `style` attribute is ONLY for values computed at runtime (drag position, zoom transform, element dimensions) — never for static design tokens
- No Tailwind, no CSS modules, no styled-components — Emotion only (`@emotion/react`, `@emotion/styled`)
- The editor UI is NOT responsive (fixed desktop layout, min 1024px) — only canvas content is responsive

---

## 16. Plain-English Summary + Source Notes + Unclear Items

### 16.1 Plain-English Summary

Buildrik's design system is a dark-theme professional editor UI built on:
- **Two fonts**: Inter for all UI text (24 named styles), JetBrains Mono for code/values/shortcuts
- **8 surface levels** from near-black (#0A0A0A) to white (#FFFFFF canvas), stepping up ~8 HSL lightness per level
- **Indigo primary** (#6366f1) for all interactive accents, with green/amber/red/blue/teal semantic colors
- **5 border tokens** (the weakest, B1, is below WCAG 3:1 for interactive elements — use B2 minimum)
- **5 shadow levels** plus a glow, all casting downward
- **7 radius levels** from 3px (xs) to 9999px (full) — **⚠️ PRD said 5, actual code has 7 (xs/sm/md/lg/xl/2xl/full)**
- **6 motion durations** from 50ms (instant) to 400ms (slower), with enter/exit easing asymmetry — **⚠️ PRD said 5 from 0ms–300ms, actual code has 6 semantic levels from 50ms–400ms**
- **23 named animations** covering every panel, modal, toast, tooltip, dropdown, accordion, and canvas interaction
- **Full reduced-motion support** that makes everything instant without breaking functionality
- **5 microcopy principles** that demand specific, actionable, consequence-stating language everywhere
- **6 trust signals** that reassure users their work is safe

### 16.2 Source Notes

| Section | PRD Source |
|---------|-----------|
| §2 Typography | §22 (lines ~3805–3842) |
| §3 Color/Surface | §23.1–§23.2 (lines ~3845–3893) |
| §4 Border/Radius/Shadow | §23.3–§23.4 (lines ~3894–3927) |
| §5 Spacing | §6.1–§6.4, §9.1–§9.4, §11.2–§11.3 |
| §6 Token Naming | §27.4 (lines ~4166–4181) |
| §7 Component Language | §11.3 control specs, §9.1 panel header, §8.3 tooltip, §10.8 menu item |
| §8 Motion Principles | §24.1–§24.2 (lines ~3930–3951) |
| §9 Transition Table | §24.4 (lines ~3969–3996) |
| §10 Micro-Interactions | §24.4, §7.2, §9.5–§9.13, §10.1–§10.8, §11.2 |
| §11 Reduced Motion | §24.3 (lines ~3952–3968) |
| §12 Microcopy Principles | §25.1 (lines ~3999–4056) |
| §13 Labeling | §25.1, §9.5–§9.13, §10.2, §11.2 |
| §14 Tone/Trust | §25.1–§25.2 (lines ~4057–4067) |
| §15 Anti-Noise/Drift | §24, §25, §27.3–§27.4, §30 |

### 16.3 Unclear / Ambiguous Items

| # | Item | Issue | PRD Reference |
|---|------|-------|---------------|
| U1 | **B1 border contrast (WCAG A5)** | B1 at `rgba(255,255,255,0.08)` has ~1.3:1 contrast — below WCAG 1.4.11 minimum of 3:1 for interactive component boundaries. PRD acknowledges this ("AT RISK") but does not specify a resolution. Must decide: raise B1 to 3:1 (breaking visual subtlety), or formally document B1 as decorative-only and audit all uses. | §23.3 |
| U2 | **Tooltip delay inconsistency** | **⚠️ Actual code: `Tooltip.tsx` default delay = 500ms; Rail CSS `transition-delay: 0.2s` (200ms).** PRD said rail 400ms and general 300ms — both wrong. Actual: rail 200ms, general 500ms. | §8.3 vs §24.4 M13 |
| U3 | **DraftChip pulse under reduced motion** | §24.3 does not explicitly list DraftChip among reduced-motion items. The pulse animation (opacity 0.5→1.0, 1.5s infinite) should stop, but this is not confirmed in the PRD. | §9.11, §24.3 |
| U4 | **Canvas overlay toggle count** | **⚠️ Actual `CanvasFooterToolbar` has 5 toggles: Snap Guides, Spacing, Grid, Badges, X-Ray. NO Rulers toggle exists in code.** PRD §10.7 said 6, §30 AR9 said 7 — both overclaim. | §10.7 vs §30 AR9 |
| U5 | **T8 color discrepancy** | T8 uses `#A09D96` for monospace IDs, but this hex does not appear as a named token (`--aqb-text-*`). It falls between `--aqb-text-muted` (#908D85) and `--aqb-text-secondary` (#B8B5AD). Should this be a new token or should T8 use `--aqb-text-muted`? | §22 T8 |
| U6 | **Inspector width inconsistency** | **⚠️ Actual code: `INSPECTOR_WIDTH = 300` in `shared/constants/layout.ts`.** Neither PRD value (320px fixed or 280px default) is correct. Code uses 300px consistently. | §6.2 vs §11.1 |
