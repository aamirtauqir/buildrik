# Buildrik Design System — Phase 1: Foundations

> **For agentic workers:** Use `superpowers:writing-plans` then `superpowers:executing-plans` to implement this spec.

**Goal:** Convert the existing Buildrik Pencil wireframe (`buildrik.pen`) into a token-based design system by adding missing tokens, building a Foundations documentation frame, and applying token references across all 29 existing screens.

**Approach:** Sequential — tokens first, then Foundations frame, then screen updates.

**Pencil File:** `/Users/shahg/Desktop/pencil/buildrik.pen`

**Fidelity Rule:** ALL components and token values must be extracted from existing editable frames (01–29). No visual invention. Existing screen designs are the source of truth.

---

## 1. Current State Audit

### What exists in Pencil already (keep as-is)
- **61 top-level frames**: 32 "Restored" static image frames + 29 "Editable" screen frames
- **0 reusable components** — all 29 screens built from loose static shapes
- **75 existing `--aqb-*` variables** set in Pencil:
  - Surfaces 1–5 (`#0f0f14` → `#2e2e38`)
  - Text colors (primary, secondary, tertiary, muted, disabled, inverse)
  - Border colors (default, light, subtle, hover, focus)
  - Status colors (error, success, warning, info) with light variants
  - Primary + secondary brand colors with hover/active/light/muted states
  - Radius scale (xs=3, sm=5, md=8, lg=12, xl=16, 2xl=24, full=9999)
  - Shadow scale (xs → 2xl, inner, glow)
  - Duration scale (instant=50 → slower=400ms)
  - Font families (UI: Inter, Mono: JetBrains Mono)

### What is missing from Pencil (needs to be added)
All missing tokens exist in `src/themes/default.css` — use exact same names and values:

**Unit convention:** All Pencil variable values are unitless numbers (e.g., `52` not `"52px"`). For rgba/hex colors use string type. For numeric scales (spacing, font-size, z-index, dimensions, line-height, font-weight) use number type.

**Spacing scale (11 tokens):**
```
--aqb-space-0: 0
--aqb-space-1: 4
--aqb-space-2: 8
--aqb-space-3: 12
--aqb-space-4: 16
--aqb-space-5: 20
--aqb-space-6: 24
--aqb-space-8: 32
--aqb-space-10: 40
--aqb-space-12: 48
--aqb-space-16: 64
```

**Typography — font sizes (10 tokens):**
```
--aqb-text-micro: 12
--aqb-text-xs: 12
--aqb-text-sm: 12
--aqb-text-base: 13
--aqb-text-md: 14
--aqb-text-lg: 16
--aqb-text-xl: 18
--aqb-text-2xl: 20
--aqb-text-3xl: 24
--aqb-text-4xl: 32
```

> **Note:** `--aqb-text-micro`, `--aqb-text-xs`, and `--aqb-text-sm` are all intentionally `12` — they are semantic aliases for different use-cases (caption, label, and small body text), not a data entry error.

**Typography — font weights (4 tokens):**
```
--aqb-font-normal: 400   (number type)
--aqb-font-medium: 500
--aqb-font-semibold: 600
--aqb-font-bold: 700
```

**Typography — line heights (5 tokens):**
```
--aqb-leading-none: 1.0   (number type)
--aqb-leading-tight: 1.25
--aqb-leading-snug: 1.375
--aqb-leading-normal: 1.5
--aqb-leading-relaxed: 1.625
```

**Z-index scale (9 tokens):**
```
--aqb-z-base: 0          (number type)
--aqb-z-dropdown: 100
--aqb-z-sticky: 200
--aqb-z-overlay: 300
--aqb-z-modal: 400
--aqb-z-popover: 500
--aqb-z-tooltip: 600
--aqb-z-toast: 700
--aqb-z-max: 9999
```

**Layout dimensions (8 tokens):**
```
--aqb-header-height: 52      (number type)
--aqb-footer-height: 40
--aqb-sidebar-width: 56
--aqb-sidebar-panel-width: 280
--aqb-right-panel-width: 300
--aqb-touch-min: 44
--aqb-touch-gap: 8
--aqb-panel-input-height: 30
```

**Panel-specific (3 tokens):**
```
--aqb-panel-section-gap: 8        (number type)
--aqb-panel-label-size: 12
--aqb-panel-label-weight: 500
```
> **Note:** `--aqb-panel-label-weight: 500` is a semantic alias scoped to panel label typography. It has the same numeric value as `--aqb-font-medium` but exists as a distinct token so panel label weight can be adjusted independently without affecting all medium-weight text. Add it as a separate token — do not collapse it into `$--aqb-font-medium`.

**Input tokens (6 tokens):**
```
--aqb-input-bg: "rgba(0,0,0,0.25)"      (string type)
--aqb-input-bg-hover: "rgba(0,0,0,0.3)"
--aqb-input-bg-focus: "rgba(0,0,0,0.35)"
--aqb-input-border: "rgba(255,255,255,0.1)"
--aqb-input-border-hover: "rgba(255,255,255,0.15)"
--aqb-input-border-focus: "rgba(59,130,246,0.5)"
```

**Color tokens — verify before adding (up to 4 tokens):**

> **IMPORTANT:** Start by calling `get_variables()`. Check each token name below. Only add tokens that are genuinely absent.

```
--aqb-bg-darker: "#08080e"           (color type) — darkest bg / canvas bg
--aqb-secondary-light: "rgba(139,92,246,0.12)"   (color type)
--aqb-bg-panel-secondary: "#1c1c2a"
--aqb-bg-panel-tertiary: "#24243a"
```

> **Also verify border token names:** The existing 75 tokens include border colors. Confirm their exact names from `get_variables()` output before using the replacement map. The replacement map assumes: `--aqb-border` (default, `rgba(255,255,255,0.08)`), `--aqb-border-light`, `--aqb-border-subtle`. If actual names differ (e.g., `--aqb-border-default`), adjust the map accordingly.

**Discrepancy to fix (Pencil-only — CSS value is already correct):**
- `--aqb-primary-muted`: from the `get_variables()` call above, check its current value. If it is `rgba(99,102,241,0.18)`, update to `rgba(99,102,241,0.08)`. If already `0.08`, skip.

**Token count:** 56 confirmed new tokens (11 spacing + 10 text-size + 4 font-weight + 5 line-height + 9 z-index + 8 layout + 3 panel + 6 input) + up to 4 color tokens pending verification = **56–60 new tokens**. Total variable count will be **131–135** depending on how many color tokens are already present.

---

## 2. Foundations Frame

**Frame:** `🏗️ Foundations` · 5600 × 4800px · fill `#08080e` · `layout: "none"` · position: below all existing content. To find y-position: call `batch_get` on root (depth 1), then for each top-level frame compute `frame.y + frame.height`, take the maximum, and place the Foundations frame at `y = that_max + 200`.

**Editable frame identification:** The 29 editable screens are the frames whose names do NOT contain "Restored" (the 32 Restored frames are static image thumbnails). Use `batch_get` on the root to list all top-level frames, filter to those without "Restored" in the name, and process them in ascending name order 01–29.

**8 sections — 3-column grid layout inside the Foundations frame (dimensions are exact requirements, not suggestions):**
- Frame: 5600px wide, 60px padding on all sides → usable width = 5480px
- Row 1 (top, y=60): Sections 01 · 02 · 03 — each **1800px wide**, height **1400px** — x positions: 60 · 1900 · 3740 (each = prev + 1800 + 40; right edge of col3 = 3740+1800=5540, right padding = 60 ✓)
- Row 2 (middle, y=1500): Sections 04 · 05 · 06 — each **1800px wide**, height **1000px** — same x positions as Row 1
- Row 3 (bottom, y=2540): Sections 07 · 08 — **2720px each**, height **900px** — x positions: 60 · 2820 (right edge of sec08 = 2820+2720=5540, right padding = 60 ✓)
- All x/y positions are relative to the Foundations frame's origin (0,0)
- Each section: frame with fill `#0f0f14`, 1px border `rgba(255,255,255,0.08)`, cornerRadius 8, label text at top (12px, font-semibold, letter-spacing 1px)

### Section 01 — Color System
- **Subsections:** Surfaces (1–5 + darker + canvas), Text (primary → disabled), Borders (subtle → focus), Status (error/success/warning/info + lights), Primary scale (subtle → active), Secondary scale
- **Each swatch:** 40×40px color rect + token name below + hex value
- **Label style:** 10px, font-semibold, letter-spacing 1px, color `--aqb-text-muted`

### Section 02 — Spacing Scale
- **Visual:** Horizontal bars of increasing width, each bar height = its own value (capped at 64px)
- **Labels:** Token name + px value below each bar
- **Color:** `--aqb-success` at 40% opacity
- **Steps:** space-0 through space-16 (11 bars — tokens are: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16)

### Section 03 — Typography
- **Subsections:** Font sizes (live text "Aa Sample Text" at each size), Font weights (same string at 400/500/600/700), Line heights (paragraph blocks), Font families (Inter + JetBrains Mono samples)
- **Background behind each sample:** `--aqb-surface-2`

### Section 04 — Radius Scale
- **Visual:** 32×32px squares with each corner radius value applied
- **Order:** xs(3), sm(5), md(8), lg(12), xl(16), 2xl(24), full(9999→circle)
- **Fill:** `--aqb-primary` at 60% opacity

### Section 05 — Shadows & Elevation
- **Visual:** Floating cards (80×60px, fill `--aqb-surface-3`) with each shadow applied
- **Labels:** shadow name + CSS value
- **Order:** xs → 2xl, then inner, then glow

### Section 06 — Borders
- **Visual:** Full-width horizontal lines (1px height) for each border token
- **Labels:** Token name + rgba value
- **Background:** `--aqb-surface-1` behind each line for visibility

### Section 07 — Motion & Easing
- **Durations:** Row of labeled boxes showing each duration (instant→slower)
- **Easing:** Named list with cubic-bezier values annotated
- **Note:** "Animation values for reference — apply in code via CSS variables"

### Section 08 — Layout Dimensions
- **3 subsections:**
  - Shell dimensions: annotated diagram showing TopBar(52), Rail(56), Panel(280), Inspector(300), Footer(40)
  - Z-index stack: vertical stack of layers with z-values labeled
  - Touch targets: 44×44 min target demo, panel-input-height(30) demo

---

## 3. Screen Token Updates

**Pre-flight (run once before processing any screen):** Call `get_variables()` and confirm that `$--aqb-bg-darker` and the exact border token names (`--aqb-border`, `--aqb-border-light`, `--aqb-border-subtle`) exist. If `--aqb-bg-darker` is absent, add it before proceeding — the replacement map references it unconditionally. If border names differ from the map, update the map entries.

**Frame filter — IMPORTANT:** Only process the 29 editable screens (frames whose names do NOT contain "Restored"). Skip all 32 Restored frames — they are static image thumbnails and cannot be token-updated.

**Method for each screen:**
0. `get_screenshot(screenId)` — capture **before** screenshot as baseline
1. `batch_get(screenId, readDepth:3)` — read all nodes
2. Identify hardcoded values that match a token
3. `batch_design` with `U()` operations to replace with `$--aqb-*` references
4. `get_screenshot(screenId)` — capture **after** screenshot and confirm visual unchanged

**`batch_design` U() syntax for token replacement:**
```
U("nodeId", { fill: "$--aqb-surface-2" })
U("nodeId", { stroke: "$--aqb-border" })
U("nodeId", { fontSize: "$--aqb-text-base" })
U("nodeId", { fontWeight: "$--aqb-font-medium" })
U("nodeId", { cornerRadius: "$--aqb-radius-md" })
U("nodeId", { gap: "$--aqb-space-2" })
U("nodeId", { paddingLeft: "$--aqb-space-4", paddingRight: "$--aqb-space-4" })
```
For nested nodes: `U("parentId/childId", { fill: "$--aqb-surface-1" })`

**Replacement map (most common):**

| Hardcoded value | Replace with |
|----------------|-------------|
| `#0f0f14` | `$--aqb-surface-1` |
| `#16161d` | `$--aqb-surface-2` |
| `#1e1e26` | `$--aqb-surface-3` |
| `#26262f` | `$--aqb-surface-4` |
| `#2e2e38` | `$--aqb-surface-5` |
| `#08080e` | `$--aqb-bg-darker` |
| `#F5F5F0` | `$--aqb-text-primary` |
| `#B8B5AD` | `$--aqb-text-secondary` |
| `#908D85` | `$--aqb-text-muted` |
| `#6B6963` | `$--aqb-text-disabled` |
| `rgba(255,255,255,0.08)` | `$--aqb-border` |
| `rgba(255,255,255,0.12)` | `$--aqb-border-light` |
| `rgba(255,255,255,0.06)` | `$--aqb-border-subtle` |
| `#6366f1` | `$--aqb-primary` |
| `#22c55e` | `$--aqb-success` |
| `#ef4444` | `$--aqb-error` |
| `#f59e0b` | `$--aqb-warning` |
| `#3b82f6` | `$--aqb-info` |
| `cornerRadius:3` | `$--aqb-radius-xs` |
| `cornerRadius:5` | `$--aqb-radius-sm` |
| `cornerRadius:8` | `$--aqb-radius-md` |
| `cornerRadius:12` | `$--aqb-radius-lg` |
| `fontSize:12` | `$--aqb-text-xs` *(default — micro/xs/sm all equal 12; use xs as the canonical replacement in the map)* |
| `fontSize:13` | `$--aqb-text-base` |
| `fontSize:14` | `$--aqb-text-md` |
| `fontSize:16` | `$--aqb-text-lg` |
| `fontWeight:400` | `$--aqb-font-normal` |
| `fontWeight:500` | `$--aqb-font-medium` |
| `fontWeight:600` | `$--aqb-font-semibold` |
| `fontWeight:700` | `$--aqb-font-bold` |
| `gap:8` | `$--aqb-space-2` |
| `gap:16` | `$--aqb-space-4` |
| `padding:8` | `$--aqb-space-2` |
| `padding:12` | `$--aqb-space-3` |
| `padding:16` | `$--aqb-space-4` |

**Screen groups (execution order):**

### Group 1 — App Shell (screens 01–04) · Priority: Critical
- 01 · Editor Shell — 6-zone layout colors, zone borders, dimension annotations
- 02 · Top Bar — 52px height ref, bg, text colors, button colors
- 03 · Navigation Rail — 56px width ref, icon colors, active/hover states
- 04 · Panel Header — 48px height, border-bottom, font sizes

### Group 2 — Left Panel Tabs (screens 05–14) · Priority: High
- 05 · Build Tab
- 06 · Media Tab
- 07 · Layers Tab
- 08 · Templates Tab
- 09 · Pages Tab
- 10 · Components Tab
- 11 · Design System Tab
- 12 · Settings Tab
- 13 · Publish Tab
- 14 · History Tab

### Group 3 — Canvas & Toolbar (screens 15–19) · Priority: High
- 15 · Canvas Default States
- 16 · Canvas Selection States — selection highlight color is `#3B82F6`; use `$--aqb-info` (same value) for these nodes
- 17 · Canvas Overlays
- 18 · Floating Toolbar & Context Menu
- 19 · Canvas Footer Toolbar — 40px height ref

### Group 4 — Inspector (screens 20–24) · Priority: Medium
- 20 · Inspector Header
- 21 · Inspector Layout Tab — `$--aqb-input-bg`, `$--aqb-input-border`
- 22 · Inspector Appearance Tab
- 23 · Inspector Effects Tab
- 24 · Inspector Multi-Select

### Group 5 — Overlays & Surfaces (screens 25–29) · Priority: Medium
- 25 · Modals Catalog
- 26 · Onboarding Flow
- 27 · Command Palette & Shortcuts
- 28 · CMS Surfaces
- 29 · AI Surfaces — apply standard surface, text, and border token replacements using the replacement map; no AI-specific tokens are defined in this phase

---

## 4. Fidelity Rule

> **Components must match existing frame designs exactly.**

**Scope of this rule:** Applies to screens 01–29 token replacement and all Phase 2 component building. The `🏗️ Foundations` frame is documentary — it visualizes extracted token values, not new design decisions. The Foundations frame is explicitly exempt from this rule.

When building components in Phase 2 (Component Library):
- Before creating any component, `batch_get` the source screen and extract exact values
- Use `get_screenshot` to capture reference visual
- Component must visually match the source frame — no style changes
- If same element appears in multiple screens with slight variation, document the variation and build a variant — do not average or compromise

---

## 5. What This Phase Does NOT Include

- Building reusable components (Phase 2)
- Building patterns / app shell layouts (Phase 3)
- Rebuilding screens from components (Phase 4)
- Any visual redesign
- Any UX changes

---

## 6. Success Criteria

- [ ] All 56 confirmed missing tokens added to Pencil; 3 color tokens added only if not already present (verified via `get_variables()`)
- [ ] `--aqb-primary-muted` Pencil value confirmed as `rgba(99,102,241,0.08)` — updated if it was `0.18`
- [ ] `🏗️ Foundations` frame exists with all 8 sections, visually verified
- [ ] All 29 editable screens have all hardcoded values listed in the replacement map replaced with `$--aqb-*` references (hardcoded values not in the map are out of scope for this phase)
- [ ] Screenshots of all 29 screens show no visual change after token replacement
- [ ] File structure clean — Foundations frame clearly labeled, positioned below screens

---

## 7. Next Phase (after this spec is implemented)

**Phase 2: Component Library**
- Extract all repeated UI elements from the 29 tokenized screens
- Build `reusable: true` components with exact visual fidelity to source frames
- Add variants and states per component
- Target: ~27 components

**Phase 3: Patterns**
- App shell, panel layouts, inspector layout, modal patterns
- Built from Phase 2 components

**Phase 4: Screen Rebuilds**
- Reconstruct 29 screens using components + patterns
- Token references propagate automatically
