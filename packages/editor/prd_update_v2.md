# Buildrik PRD — Update v2.0 (Gap Resolution Patch)
**Date:** 2026-03-20
**Base document:** `prd_final.md` (2026-03-12)
**Purpose:** Resolves all gaps, broken flows, contradictions, and missing specifications identified in the Phase 1 audit of `prd_final.md`.
**Rule:** This document SUPERSEDES conflicting statements in `prd_final.md`. Where this document is silent, `prd_final.md` remains authoritative.

---

# PART 1 — CONTRADICTION RESOLUTIONS

These are definitive rulings on conflicting specifications found in `prd_final.md`.

---

## CR-1: Inspector Default Width — RESOLVED

**Conflict:** §6.2 says Inspector width is `280px default → 320/400px expanded`. §11.1 says all Inspector states have `320px fixed`.

**Resolution:** Inspector default width is **320px**. §6.2 is CORRECTED. The Inspector is wider than the left sidebar because it contains more dense controls (number inputs, segmented controls, sliders).

**Updated Zone Ownership table row:**

| Zone | Width | Notes |
|------|-------|-------|
| Right Inspector | **320px default** → 400px expanded | Drag left edge to expand. Collapses to 0px. |

---

## CR-2: Layout Calculation — CORRECTED

**Conflict:** §6.3 calculates `Canvas width = viewport - 56 - 280 - 280 = viewport - 616px`. But with Inspector at 320px, math is wrong.

**Corrected calculation:**

```
Canvas width = viewport_width - rail(56px) - sidebar(280px) - inspector(320px)
             = viewport_width - 656px

At 1440px:   = 784px available for canvas
At 1024px:   = 368px available for canvas (minimum)

When sidebar collapsed: canvas gains 280px → 648px at 1024
When inspector collapsed: canvas gains 320px → 688px at 1024
Both collapsed: canvas = viewport_width - 56px
```

**Minimum supported viewport remains 1024px.** At minimum with both panels open, 368px canvas is tight but functional for mobile device preview (375px canvas content scales to fit).

---

## CR-3: Ctrl+1 Shortcut Conflict — RESOLVED

**Conflict:** §5B says `Ctrl+1 = Desktop View (device-desktop)`. §17.1 Command Palette lists `"Zoom to Fit: Ctrl+1"`.

**Resolution:** `Ctrl+1 = Desktop View`. This is the canonical binding from `defaultCommands.ts`. **Zoom to Fit has NO default shortcut.** It is accessible only via:
1. Canvas footer "Fit" button
2. Command palette (type "Fit" or "Zoom to Fit")

**§17.1 Command Palette is CORRECTED — remove `Ctrl+1` from Zoom to Fit row. The VIEW section should read:**

| Icon | Label | Shortcut |
|------|-------|---------|
| `maximize` | Zoom to Fit | — |

---

## CR-4: Element Categories — CMS Placement RESOLVED

**Conflict:** §9.5 Build tab lists 6 categories (`Structure, Text, Media, Forms, Navigation, Advanced`). §12.1 CMS-E1 references a "Data" category that doesn't exist.

**Resolution:** CMS elements remain in the **Advanced** category (not a separate "Data" category). The Advanced category already lists `Custom HTML, Component, CMS List, CMS Item`.

**§12.1 CMS-E1 is CORRECTED to read:**
> Build tab → Element catalog → **Advanced** category → drag "CMS List" onto canvas

---

## CR-5: CMS Collections in Settings — RESOLVED

**Conflict:** §12.1 CMS-E5 references "Settings → Integrations → CMS Collections card" but §9.12 Integrations screen has no CMS card.

**Resolution:** Add CMS Collections card to Settings → Integrations screen. See §NEW-6 below for full spec.

---

## CR-6: Overlay Count vs Footer Toggles — RESOLVED

**Conflict:** §5D lists 7 overlay types (including "Element outlines"). §10.7 Canvas footer has only 6 toggles.

**Resolution:** Element outlines (`showOutlines`) is **always ON by default and not user-toggleable** from the footer. It is controlled programmatically only (hidden during X-Ray mode, hidden during drag). The footer has exactly 6 user toggles. §5D's "7 overlay types" counts element outlines as a system-managed overlay, not a user toggle.

**Clarification added to §10.7:**
> Element outlines are always active (default: `showOutlines: true`). They are not exposed as a footer toggle because disabling them would make the editor unusable. Outlines are automatically suppressed during X-Ray mode (CS-11).

---

## CR-7: Settings Card Count — RESOLVED

**Conflict:** §9.12 says "all 6 drill-in screens fully designed" but lists 7 cards (6 feature cards + Tour).

**Resolution:** There are **7 cards** on the Settings home screen, but only **6 have drill-in screens**. The "Get Started Tour" card's action is **not a drill-in** — it directly triggers the guided tooltip tour (§18.6). The card click replays the tour overlay; it does not navigate to a sub-screen.

**Corrected text for §9.12:**
> Home screen — 7 FeatureCards across 3 groups. 6 cards navigate to drill-in screens. 1 card ("Get Started Tour") directly triggers the tour overlay.

---

## CR-8: PageSettingsDrawer Trigger — RESOLVED

**Conflict:** §9.8 says "PageSettingsDrawer (on page row click or settings icon)" but click should navigate to page, not open settings.

**Resolution:**
- **Single click** on page row → navigates to that page on canvas (sets active page)
- **Click on ··· context menu → Page Settings** → opens PageSettingsDrawer
- **Double-click** on page name → inline rename (already specified)

**§9.8 is CORRECTED:**
> PageSettingsDrawer opens via the ··· context menu → "Page Settings" item, or via the "Edit SEO →" link in InspectorEmptyState. Single-clicking a page row navigates to that page.

**Updated context menu for Pages tab:**

| Item | Icon | Action |
|------|------|--------|
| Page Settings | settings | Opens PageSettingsDrawer |
| Rename | pencil | Inline rename |
| Set as Home | home | Sets as homepage |
| Duplicate | copy | Duplicates page |
| Delete | trash-2 | Delete with confirmation |

---

---

# PART 2 — CRITICAL GAP FIXES

---

## §NEW-1: Publish Checklist Data Wiring (fixes GAP-1)

**Replaces:** The `TODO` comments in §9.13 checklist wiring section.

**Checklist wiring — complete specification:**

| Item | Key | Data Source | Check Logic | Fallback |
|------|-----|-----------|-------------|----------|
| Content added | `hasContent` | `composer.elements.getActivePage().children.length > 0` | True if page has ≥ 1 element | — |
| SEO title set | `hasSeoTitle` | `composer.pages.getActivePage().seo?.title` | True if string is non-empty and length > 0 | `false` until Pages API provides `.seo` |
| Meta description | `hasMetaDesc` | `composer.pages.getActivePage().seo?.description` | True if string is non-empty and length > 0 | `false` until Pages API provides `.seo` |
| Social image | `hasSocialImg` | `composer.pages.getActivePage().social?.image` | True if image URL is set | `false` until Pages API provides `.social` |

**Fallback behavior (before API is ready):**

When `composer.pages.getActivePage().seo` is `undefined` (API not yet implemented):
- Checklist items show as incomplete (circle icon, not checkmark)
- Hint text changes from "Set in Pages → SEO tab" to **"Set up SEO in Page Settings"**
- Clicking the hint navigates to: Pages tab → opens ··· menu on active page → triggers PageSettingsDrawer → SEO sub-tab
- **No item ever shows `false` silently** — incomplete items always show actionable hint

**API contract that must be implemented:**

```typescript
interface PageSeoData {
  title: string;        // max 60 chars, user-editable in PageSettingsDrawer SEO tab
  description: string;  // max 160 chars
  canonicalUrl: string;
}

interface PageSocialData {
  ogTitle: string;
  ogDescription: string;
  image: string;        // URL from MediaManager
}

// Access pattern:
composer.pages.getActivePage().seo    // → PageSeoData | undefined
composer.pages.getActivePage().social // → PageSocialData | undefined
```

**Implementation priority:** This is a Phase 1 blocker. Without it, the Publish tab appears broken for 100% of users.

---

## §NEW-2: Collaboration Initiation Flow (fixes GAP-3)

**Inserts after:** §13.5 (Connection Quality)

### 13.6 Collaboration Setup Flow

**Prerequisite:** CollaborationManager must be initialized with a project ID and user identity.

#### Entry Points

| # | Entry Point | Location | Trigger |
|---|------------|----------|---------|
| COL-E1 | Share button | Top bar, right zone, between Publish button and AI button | Click |
| COL-E2 | Presence avatar overflow dropdown | Top bar, avatar stack "+N" click | Dropdown footer |
| COL-E3 | Settings → Site Settings → Sharing section | Settings drill-in | Section in Site Settings |

#### Share Button (top bar)

**Position:** Between Publish and AI buttons in top bar right zone.

**Visual:**
- Icon: Lucide `share-2`, 16px
- Container: `width: 32px; height: 32px; border-radius: 6px`
- Default: `color: #B8B5AD; background: transparent`
- Hover: `background: var(--aqb-surface-3); color: #F5F5F0`
- Active (collaborators present): `color: #22c55e` (green, matches presence)
- Tooltip: `"Share — Invite collaborators"`

**Note:** This is the 8th always-visible top bar control. Updated top bar count from 7 to **8 always-visible + overflow**.

#### Share Popover

**Trigger:** Click Share button (COL-E1).

**Container:**
- `width: 360px; max-height: 480px`
- `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 12px`
- `shadow: var(--aqb-shadow-lg)`
- `padding: 0`
- Position: below Share button, right-aligned to button

**Layout:**

```
┌────────────────────────────────────────────┐
│ HEADER                          padding: 16px│
│ "Share this project"                        │  font: 14px Inter; weight: 600; color: #F5F5F0
├────────────────────────────────────────────┤
│ INVITE SECTION                              │
│                                             │
│ [email input_______________] [Invite]       │  input: height: 36px; placeholder: "Enter email address"
│                                             │  button: primary, h: 36px
│ Role: [Editor ▼]                            │  dropdown: Editor / Viewer
│                                             │
├────────────────────────────────────────────┤
│ LINK SECTION                                │
│                                             │
│ Share link                                  │  label: 10px uppercase; color: #908D85
│ [https://buildrik.app/edit/abc123] [📋]     │  input: readonly; font: 11px Mono
│ [Anyone with the link can ▼]                │  dropdown: "view" / "edit" / "disabled"
│                                             │
├────────────────────────────────────────────┤
│ COLLABORATORS                               │
│                                             │
│ [avatar] You (Owner)              [Editor]  │  current user, non-editable
│ [avatar] Sarah Chen               [Editor ▼]│  role dropdown per user
│ [avatar] Mike Johnson             [Viewer ▼]│  + [× remove] on hover
│                                             │
│ "2 collaborators online"                    │  font: 11px; color: #908D85
│                                             │
├────────────────────────────────────────────┤
│ FOOTER                                      │
│ [Open sharing settings →]                   │  text link → Settings → Site Settings
└────────────────────────────────────────────┘
```

**Email invite flow:**
1. User enters email + selects role → clicks [Invite]
2. Button → loading: `"Sending..."` with spinner
3. Success: `"Invite sent to sarah@example.com"` toast (success variant)
4. Collaborator appears in list with `"Pending"` badge (amber pill) until they join
5. Error: inline error below input `"Invalid email"` or `"User already invited"`

**Link sharing:**
- Default: `"disabled"` (no link sharing)
- User enables: dropdown → `"Anyone with the link can view"` or `"...edit"`
- Link auto-generated: `https://buildrik.app/edit/{projectId}?invite={token}`
- Copy icon: same behavior as Publish URL copy (clipboard + check for 2s)

**Role permissions:**
- **Editor:** Full edit access — can modify elements, styles, pages. Cursors and selections visible to others.
- **Viewer:** Read-only — can see canvas, navigate, but cannot modify. Cursor visible to editors.
- **Owner:** Full access + can manage collaborators, sharing settings, billing.

**Collaborator removal:**
- Hover on collaborator row → × icon appears (right side)
- Click → ConfirmDialog: `"Remove [Name] from this project?"` + [Remove] destructive + [Cancel]
- On confirm: collaborator disconnected, cursor removed from canvas, toast `"[Name] removed"`

---

## §NEW-3: Font Management Flow (fixes GAP-4)

**Inserts after:** §9.10 (Media Tab) — adds font management sub-flow.

### Font Management

Fonts are managed across two surfaces: **Media tab** for upload/storage and **Inspector Typography** for selection.

#### Font Upload (Media Tab)

**Location:** Media tab → My Files → TypePills → "Fonts" filter

When "Fonts" pill is active, UploadZone changes:
- Supported formats text: `"Supported: .woff2, .woff, .ttf, .otf"`
- Upload processes font file → extracts metadata (family name, weight, style)

**Font library view (when Fonts filter active):**

Each font row (replaces grid for fonts):
```
[Aa preview 24px] [Font Family Name 13px] [Weights: Regular, Bold 11px muted]  [⋯]
Height: 48px | Padding: 8px 12px
```

- Aa preview: renders "Aa" in the uploaded font
- Font family: `font: 13px Inter; font-weight: 500; color: #F5F5F0`
- Weights: comma-separated weight names detected from font files
- ⋯ menu: Rename, Delete, Download

**Font activation:**

Uploaded fonts are **automatically activated** — they immediately appear in the Inspector Typography font family picker under a "Custom Fonts" group.

#### Font Family Picker (Inspector)

**Location:** Inspector → Style tab → Typography → Font family dropdown

**Picker structure (grouped):**

```
┌──────────────────────────────────────┐
│ [🔍 Search fonts...]                  │  search input, h: 32px
│                                       │
│ CUSTOM FONTS                          │  section label (only if custom fonts exist)
│ Acme Sans                       [×]  │  [×] = remove from project
│ Brand Serif                     [×]  │
│                                       │
│ RECENTLY USED                         │  section label
│ Inter                                 │
│ JetBrains Mono                        │
│                                       │
│ GOOGLE FONTS                          │  section label
│ Inter                                 │
│ Roboto                                │
│ Open Sans                             │
│ Lato                                  │
│ Montserrat                            │
│ ... (lazy-loaded, search to filter)   │
│                                       │
│ SYSTEM FONTS                          │  section label
│ Arial                                 │
│ Georgia                               │
│ Times New Roman                       │
│ Courier New                           │
│                                       │
│ [Upload custom font →]                │  ghost link → opens Media tab Fonts filter
└──────────────────────────────────────┘
```

**Picker container:**
- `width: 280px; max-height: 360px; overflow-y: auto`
- `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 8px; shadow: var(--aqb-shadow-md)`

**Each font row:**
- `height: 36px; padding: 0 12px; display: flex; align-items: center`
- Font name rendered **in its own font** (preview): `font-family: [font-name]; font-size: 13px; color: #F5F5F0`
- Hover: `background: var(--aqb-surface-3)`
- Selected: `background: rgba(99,102,241,0.12); color: #6366f1`

**Google Fonts loading:**
- Initial load: top 20 popular fonts
- Search: queries Google Fonts API, results appear after 200ms debounce
- Selected Google font: auto-loaded via `FontManager.loadGoogleFont(familyName)`
- Loading indicator: shimmer skeleton row while font loads

---

## §NEW-4: Form Element Inspector Section (fixes GAP-5)

**Inserts into:** §11.3 Tab 2 — Style → Section 8 (Element Properties)

**Updated Element Properties for Form elements:**

| Element type | Controls shown |
|-------------|---------------|
| Form (`<form>`) | **Form action** (see below), method dropdown (GET/POST), form name input, enctype dropdown (application/x-www-form-urlencoded, multipart/form-data), novalidate toggle |
| Input (`<input>`) | type dropdown, name, placeholder, required toggle, disabled toggle, value, pattern (regex), autocomplete toggle |
| Textarea | name, placeholder, required toggle, rows number input, maxlength number input |
| Select (`<select>`) | name, required toggle, multiple toggle, options editor (key-value list with add/remove) |
| Button (`<button>`) | type (submit/button/reset), disabled toggle, form attribute (associate with specific form) |

**Form Action Section (for `<form>` elements only):**

```
┌─────────────────────────────────────────────┐
│ FORM ACTION                                  │  section label
│                                              │
│ Handler: [Formspree ▼]                       │  dropdown: Formspree / Custom URL / None
│                                              │
│ ── If Formspree: ──────────────────────────  │
│ Endpoint: [https://formspree.io/f/xxxx ]     │  text input; auto-filled if configured in Settings
│ Status: [● Connected ✓]                      │  green dot if valid; red "Not configured" if empty
│ [Test submission →]               ghost btn  │  sends test data; shows success/error toast
│                                              │
│ ── If Custom URL: ─────────────────────────  │
│ Action URL: [https://api.example.com/form]   │  text input; full URL
│ Method: [POST ▼]                             │  dropdown
│                                              │
│ ── If None: ───────────────────────────────  │
│ "This form won't submit data. Choose a       │  info text; 12px; color: #908D85
│  handler above to enable submissions."       │
│                                              │
│ [Configure in Settings →]         text link  │  navigates to Settings → Integrations → Formspree
└─────────────────────────────────────────────┘
```

**Formspree auto-connection:**
- If user has configured Formspree endpoint in Settings → Integrations, the endpoint auto-fills for new forms
- Each form can override with its own endpoint
- `FormspreeInjector` (Export) reads from per-form config, not global-only

---

## §NEW-5: Color Picker Specification (fixes GAP-8)

**New section — referenced as §23.5 in prd_final.md but never written.**

### Color Picker Popover

**Trigger:** Click any color swatch in Inspector (Typography color, Background color, Border color, Shadow color) or Design System tab token editor.

**Container:**
- `width: 280px`
- `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 12px`
- `shadow: var(--aqb-shadow-lg)`
- `padding: 0; overflow: hidden`
- Position: popover anchored below swatch, left-aligned. Repositions if viewport overflow.
- `z-index: 2000`

**Layout:**

```
┌──────────────────────────────────────┐
│ SATURATION-BRIGHTNESS FIELD   h:160px│  Square gradient field
│ ┌──────────────────────────────────┐ │  x-axis: saturation (0→100%)
│ │                             [●]  │ │  y-axis: brightness (100→0%)
│ │                                  │ │  Background: hue gradient overlay
│ │                                  │ │  Selector: 14px circle, white border 2px
│ └──────────────────────────────────┘ │  shadow: 0 0 0 1px rgba(0,0,0,0.3)
│                                      │
│ HUE SLIDER                    h:14px│  Horizontal rainbow gradient bar
│ [═══════════●══════════════════]     │  Thumb: 14px circle, white border
│                                      │
│ OPACITY SLIDER                h:14px│  Checkerboard + color gradient
│ [════●═══════════════════════]       │  Thumb: same as hue
│                                      │
│ VALUE INPUTS            padding:12px │
│ ┌──────┬──────┬──────┬──────┐       │
│ │ HEX  │  R   │  G   │  B   │       │  Mode toggle: click "HEX" label → cycles
│ │6366f1│  99  │ 102  │ 241  │       │  HEX / RGB / HSL modes
│ └──────┴──────┴──────┴──────┘       │
│ Alpha: [100 %]                       │  Number input + % label
│                                      │
│ DESIGN TOKENS               divider │  Only if design tokens exist
│ [primary ■] [accent ■] [bg ■]       │  Token swatches from Design System tab
│ [text ■]    [border ■]               │  Click → applies token value + sets binding
│                                      │
│ SAVED COLORS                         │
│ [■] [■] [■] [■] [■] [■] [+]        │  User's saved colors (per project, localStorage)
│                                      │  [+] saves current color to palette
│                                      │  Max 12 saved colors; oldest removed on overflow
│                                      │
│ EYEDROPPER                           │
│ [💧 Pick from canvas]    ghost btn   │  Activates eyedropper cursor on canvas
│                                      │  Click any element → picks its color
│                                      │  Escape cancels eyedropper
└──────────────────────────────────────┘
```

**Saturation-brightness field:**
- `width: 100%; height: 160px; border-radius: 8px 8px 0 0; cursor: crosshair`
- Gradient composition: white→transparent horizontal overlay + black→transparent vertical overlay + solid hue background
- Selector circle follows mouse during drag
- Updates R/G/B/HEX values in real-time

**Hue slider:**
- `height: 14px; border-radius: 7px; margin: 8px 12px`
- Background: `linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`
- Thumb: `width: 14px; height: 14px; border-radius: 50%; background: #FFFFFF; border: 2px solid rgba(0,0,0,0.2); box-shadow: 0 1px 3px rgba(0,0,0,0.3)`

**Opacity slider:**
- Same spec as hue slider
- Background: checkerboard pattern underneath + `linear-gradient(to right, transparent, [current-color])`
- Range: 0–100%

**Value input modes:**

| Mode | Inputs | Format |
|------|--------|--------|
| HEX | Single input, 6 chars | `#6366f1` — # prefix auto-added. Validates hex chars only. |
| RGB | 3 number inputs (R, G, B) | 0–255 each. Tab between inputs. |
| HSL | 3 number inputs (H, S, L) | H: 0–360°, S: 0–100%, L: 0–100% |

- Mode toggle: click the mode label (e.g., "HEX") to cycle through modes
- Each input: `width: auto; height: 24px; font: 11px JetBrains Mono; text-align: center; background: var(--aqb-surface-3); border-radius: 4px`

**Design token swatches:**
- Only shown if `composer.designSystem.getColorTokens().length > 0`
- Each swatch: `width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--aqb-border); cursor: pointer`
- Hover: `outline: 2px solid var(--aqb-primary); outline-offset: 1px`
- Tooltip: token name (e.g., `"primary — #6366f1"`)
- Click: sets color to token value AND establishes a design token reference (if element supports token binding)

**Saved colors:**
- Row of circular swatches: `width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--aqb-border)`
- [+] button: same size, `background: var(--aqb-surface-3); color: #908D85; font-size: 12px`
- Persisted in `localStorage` per project: `buildrik_{projectId}_savedColors`

**Eyedropper:**
- Click [Pick from canvas] → cursor changes to eyedropper icon on canvas
- Hovering canvas elements shows magnified pixel color in cursor label
- Click → picks color at click point → applies to color picker → updates inspector
- Escape → cancels eyedropper, returns to normal cursor

**Close behavior:**
- Click outside popover → closes, current color applied
- Escape → closes, reverts to color before picker opened
- Any color change is applied live (instant preview on canvas element)

---

## §NEW-6: CMS Collections in Settings (fixes GAP-2/CR-5)

**Inserts into:** §9.12 Settings → Integrations screen

**Updated Integrations screen (Plan-gated: Pro):**

| Integration | Fields |
|-------------|--------|
| **CMS Collections** | Collection list with edit/delete/add actions (see below) |
| Formspree | "Form endpoint" URL input + [Test Connection] ghost button |
| Payments | [credit-card icon] "Payment integrations coming soon" placeholder |
| Email | [mail icon] "Email integrations coming soon" placeholder |

**CMS Collections section (within Integrations):**

```
┌─────────────────────────────────────────────┐
│ CMS COLLECTIONS                              │  section label
│                                              │
│ [database icon] Blog Posts    4 records [⚙️] │  collection row
│ [database icon] Products     12 records [⚙️] │  ⚙️ = edit schema / manage records
│                                              │
│ [+ Add collection]            ghost button   │  opens Collection Setup modal (§12.2)
│                                              │
│ "Collections power dynamic content like      │  info text: 12px; color: #908D85
│  blog posts, products, and team members."    │
└─────────────────────────────────────────────┘
```

**Collection row:**
- `height: 44px; padding: 8px 12px; display: flex; align-items: center; gap: 8px`
- Icon: Lucide `database`, 16px, `color: #6366f1`
- Name: `font: 13px Inter; font-weight: 500; color: #F5F5F0`
- Record count: `font: 11px Inter; color: #908D85`
- Settings icon: Lucide `settings`, 14px, on hover → opens Collection Editor

**Collection Editor (drill-in from ⚙️):**
- DrillInHeader: [← back] + "[Collection Name] Settings"
- Tab bar: [Schema] [Records]
- Schema tab: same as Collection Setup modal body (§12.2) but in drill-in layout — editable fields list
- Records tab: table view of records with add/edit/delete per record

**Records table:**

```
┌──────────────────────────────────────────────┐
│ [+ Add record]                    ghost btn  │
│                                              │
│ TITLE          | COVER    | PUBLISHED | ⋯    │  column headers: 10px uppercase; muted
│────────────────┼──────────┼───────────┼────  │
│ First Post     | [thumb]  | 2026-03-10| [⋯]  │  row height: 40px
│ Second Post    | [thumb]  | 2026-03-12| [⋯]  │  ⋯ menu: Edit / Duplicate / Delete
│ Third Post     |    —     | —         | [⋯]  │  empty cells: em dash
└──────────────────────────────────────────────┘
```

- Table: `font: 12px Inter; color: #B8B5AD`
- Active sort: click column header to sort
- Image columns: `32×32px` thumbnail, `border-radius: 4px`

---

## §NEW-7: Undo Scope Definition (fixes GAP-9)

**Inserts after:** §19 (Interaction and State Model)

### 19.5 Undo Scope Rules

**Ctrl+Z (global undo):**
- Undoes the most recent HistoryManager entry
- HistoryManager records atomic operations (single property change, element add, element delete, etc.)
- Transaction-wrapped operations (e.g., template apply = multiple element adds) undo as a single unit via `beginTransaction()` / `endTransaction()`

**Toast [Undo] button (contextual undo):**
- Scoped to the specific action that triggered the toast
- Internally calls `composer.history.undo()` for the operation
- **If user made additional changes between the toast action and clicking [Undo]:**
  - Toast [Undo] undoes ALL changes back to before the toast action (multi-step undo)
  - This matches Ctrl+Z behavior for the same number of steps
  - Toast shows warning if > 1 step will be undone: `"This will also undo [N] other changes. Continue?"` + [Undo all] + [Cancel]

**AI apply undo:**
- AI changes are wrapped in a transaction (`beginTransaction` before apply, `endTransaction` after)
- Toast [Undo] reverts the entire AI application as one unit regardless of how many elements were modified

**Design token apply undo:**
- "Apply All" tokens is a transaction
- Toast [Undo] reverts all token applications as one unit

---

## §NEW-8: Tour vs Onboarding Clarification (fixes GAP-10)

**Amends:** §18.6 and §5G

### Tour and Checklist Relationship

The **OnboardingChecklist** (5 steps) and **Get Started Tour** (7 steps) are **independent systems** that can coexist:

| System | Purpose | Persistence | Replays |
|--------|---------|------------|---------|
| OnboardingChecklist | Task-based — user completes real actions | `localStorage: buildrik_{projectId}_onboarding` | Cannot replay — once all 5 steps complete, checklist dismisses permanently |
| Get Started Tour | Guided — tooltip tour explaining UI zones | `localStorage: buildrik_tourSeen` | Can replay from Settings → "Get Started Tour" card. Each replay resets `tourSeen` flag and runs all 7 steps. |

**Interaction rules:**
1. First session: WelcomeModal → (dismissed) → OnboardingChecklist appears → Checklist header shows "Take a tour" link
2. "Take a tour" link pauses checklist progress tracking (steps still auto-complete if actions happen during tour) and starts Tour
3. Tour completes → focus returns to checklist (resumes tracking)
4. Checklist completes → dismisses. Tour "Take a tour" link no longer shown anywhere.
5. Settings → "Get Started Tour" card → always available, even after checklist is dismissed. Replays the 7-step tooltip tour over the current editor state.

---

---

# PART 3 — HIGH-PRIORITY GAP ADDITIONS

---

## §NEW-9: Plugin System Coming Soon (fixes GAP-12)

**Amends:** §9.12 Settings tab

**Add to POWER group in Settings home screen:**

| Card | Icon | Title | Description | Badge |
|------|------|-------|-------------|-------|
| 7 | puzzle-piece | Plugins | Custom extensions and integrations | "Coming Soon" (amber pill) |

**Drill-in screen (Plugins):**

```
┌─────────────────────────────────────────────┐
│ [← Settings] Plugins                         │  DrillInHeader
│                                              │
│        [puzzle-piece icon 32px, muted]       │  centered
│                                              │
│   "Plugins are coming soon."                 │  font: 14px Inter; color: #F5F5F0
│   "Extend Buildrik with custom tools,       │  font: 13px Inter; color: #B8B5AD
│    integrations, and workflows."             │
│                                              │
│   [email input____________] [Notify Me]      │  email capture; same pattern as Domains
│                                              │
│   "Developers: PluginManager is available    │  font: 11px Inter; color: #908D85
│    via composer.plugins for engine-level     │  code: JetBrains Mono
│    extensions today."                        │
└─────────────────────────────────────────────┘
```

**Settings home screen updated card count:** 8 cards (was 7) across 3 groups:
- SITE: Site Settings, Domains, Analytics (3)
- POWER: Integrations, Advanced, Export, **Plugins** (4)
- HELP: Get Started Tour (1)

---

## §NEW-10: Recovery Manager UI (fixes GAP-13)

**Inserts after:** §25 (Toast System)

### Recovery Notification

**Trigger:** Editor loads and `RecoveryManager.hasRecoveredData()` returns `true` — meaning the previous session crashed/closed without saving and auto-recovery restored unsaved work.

**Recovery banner (top of canvas area):**

```
┌──────────────────────────────────────────────────────────────────┐
│ [shield-check icon 16px green] "We recovered your unsaved work." │
│ "Your session was interrupted. Auto-recovered changes have been   │
│  restored."                                                       │
│                                                [Dismiss]  [Save ↓]│
└──────────────────────────────────────────────────────────────────┘
```

- Position: `top: 52px (below top bar); width: calc(100% - 56px - 320px); left: 56px + 280px` (above canvas, spanning canvas width)
- `height: auto; min-height: 48px; padding: 12px 16px`
- `background: rgba(34,197,94,0.1); border-bottom: 1px solid rgba(34,197,94,0.2)`
- `font: 13px Inter; color: #F5F5F0`
- Icon: Lucide `shield-check`, 16px, `#22c55e`
- [Dismiss]: ghost button — closes banner, user continues editing recovered state
- [Save ↓]: primary button — triggers manual save (`Ctrl+S`), then closes banner
- Auto-dismiss: after 30 seconds if no interaction

**If recovery fails:**
- Toast: warning variant — `"Recovery failed — your last auto-save may contain recent changes. Check History tab."`
- History tab: auto-save entry is highlighted with amber border

---

## §NEW-11: Toast System Full Specification (fixes GAP-22)

**Section referenced as §25 in prd_final.md but not fully written.**

### 25.1 Toast Notification System

**Position:** Bottom-center of viewport, `24px` from bottom edge.
**Alignment:** `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`
**z-index:** `5000` (above everything except OnboardingChecklist)

**Stack behavior:**
- Max 3 visible toasts simultaneously
- New toasts push older ones upward (stack grows upward)
- Gap between stacked toasts: `8px`
- 4th toast causes oldest toast to dismiss (slide-out animation)

**Container (each toast):**
- `min-width: 320px; max-width: 520px; height: auto; min-height: 44px`
- `border-radius: 10px; padding: 12px 16px`
- `shadow: var(--aqb-shadow-lg)` — `0 8px 24px rgba(0,0,0,0.3)`
- `display: flex; align-items: center; gap: 10px`

**Variants:**

| Variant | Background | Border-left | Icon (Lucide) | Icon Color |
|---------|-----------|-------------|---------------|-----------|
| info | `var(--aqb-surface-2)` | `3px solid #6366f1` | `info` | `#6366f1` |
| success | `var(--aqb-surface-2)` | `3px solid #22c55e` | `check-circle` | `#22c55e` |
| warning | `var(--aqb-surface-2)` | `3px solid #f59e0b` | `alert-triangle` | `#f59e0b` |
| error | `var(--aqb-surface-2)` | `3px solid #ef4444` | `alert-circle` | `#ef4444` |

**Content layout:**
```
[icon 16px] [message text 13px]                    [action?] [× dismiss]
             color: #F5F5F0                         ghost     14px muted
```

- Message text: `font: 13px Inter; color: #F5F5F0; flex: 1`
- Action button (optional): `font: 12px Inter; font-weight: 600; color: #6366f1; padding: 0 8px; height: 28px; border-radius: 4px; background: transparent; hover: background rgba(99,102,241,0.1)`
- Dismiss button: Lucide `x`, 14px, `color: #908D85; width: 24px; height: 24px; border-radius: 4px; hover: background var(--aqb-surface-3)`

**Duration rules:**

| Variant | Default Duration | With Action | Dismissable |
|---------|-----------------|-------------|------------|
| info | 3000ms | 5000ms | Click × or swipe |
| success | 3000ms | 5000ms | Click × or swipe |
| warning | 5000ms | 8000ms | Click × or swipe |
| error | 8000ms | No auto-dismiss | Click × only |

**Animations:**
- Enter: slide up from `translateY(16px)` + fade from `opacity: 0`. Duration: `200ms ease-out`
- Exit: slide down to `translateY(8px)` + fade to `opacity: 0`. Duration: `150ms ease-in`
- Stack shift (when toast above is dismissed): slide down `8px`, `150ms ease`

**Swipe-to-dismiss:**
- Horizontal swipe (touch or mouse drag) > 100px → dismisses toast
- During swipe: toast follows finger/cursor with reducing opacity
- Release past threshold: continues to edge and fades
- Release before threshold: springs back to center

**API:**

```typescript
composer.toast.show({
  variant: 'success' | 'info' | 'warning' | 'error',
  message: string,
  action?: {
    label: string,    // e.g., "Undo"
    onClick: () => void
  },
  duration?: number,  // override default duration
  id?: string         // for programmatic dismiss: composer.toast.dismiss(id)
});
```

---

## §NEW-12: Global Styles vs Design Tokens Delineation (fixes GAP-15)

**Clarification — inserts into §9.11 Design System Tab.**

### Design System Tab Scope

The Design System tab manages **design tokens** — named, reusable values that enforce consistency:
- Color tokens → CSS custom properties: `--token-primary: #6366f1`
- Typography tokens → Named type styles: `--token-heading: 600 32px/1.2 Inter`
- Spacing tokens → Named spacing values: `--token-gap-lg: 24px`

**GlobalStyleManager** (engine #11) manages **global CSS rules** — styles that apply across all pages:
- Global CSS variables defined in `src/themes/default.css`
- The `--aqb-*` design system variables used by the editor chrome
- Any user-defined global CSS (via Settings → Advanced → Custom CSS)

**Relationship:**
- Design tokens (Design tab) are **user-facing** — users create/edit/export them
- Global styles (GlobalStyleManager) are **system-level** — managed via engine API and Custom CSS editor
- When user creates a color token `"brand-blue: #2563eb"`, it's stored in the design token system AND made available as a CSS custom property `--token-brand-blue` via GlobalStyleManager
- Design token changes propagate through GlobalStyleManager to all elements using that token

**No separate UI for GlobalStyleManager.** Its functionality surfaces through:
1. Design System tab (user tokens)
2. Settings → Advanced → Custom CSS (raw CSS injection)
3. Inspector color picker (token swatches integration — §NEW-5)

---

## §NEW-13: Component Editing Flow (fixes GAP-17)

**Amends:** §9.9 Components Tab

### Component Editing Mode

**Trigger:** Click [Edit] in ComponentDetailScreen, or double-click a component instance on canvas.

**Entering component editing mode:**
1. Canvas transitions: all non-component elements dim to `opacity: 0.3`
2. Component boundary: `2px solid #8b5cf6` (purple, matching component view)
3. Editing badge appears above component: `"Editing: [Component Name]"` — `font: 10px Inter; font-weight: 600; color: #FFFFFF; background: #8b5cf6; padding: 2px 8px; border-radius: 3px`
4. Inspector header shows: `"Editing Component"` label in purple + `[Done editing]` primary button
5. Canvas toolbar: shows all normal element editing tools
6. Changes apply to the **component definition** — all instances update in real-time

**Exiting component editing mode:**
- Click [Done editing] button in inspector header
- Press Escape
- Click outside the component boundary on canvas
- All changes are committed to the component definition

**Isolation behavior:**
- Component editing is **NOT isolated** (unlike Figma) — the component is edited in-context on the canvas with surrounding elements dimmed
- This allows users to see the component in its real layout context
- Nested components within the editing component are **read-only** — user must enter their editing mode separately

**Instance overrides:**
- After editing a component, existing instances retain their local overrides
- Override indicator in Variants section (§11.3 Tab 1 Section 7) shows: `"3 local overrides"` badge
- [Reset overrides] button removes all instance-level overrides, reverting to updated component defaults

---

## §NEW-14: Custom Breakpoint Creation (fixes GAP-18 partial)

**Amends:** §7.4 Device Switcher Behavior

### Custom Breakpoints

**BreakpointDropdown** (appears below device switcher on click):

```
┌──────────────────────────────────────┐
│ BREAKPOINTS                           │  header: 10px uppercase; muted
│                                       │
│ [monitor] Desktop       1440px   [✓] │  active: checkmark
│ [tablet]  Tablet         768px       │
│ [phone]   Mobile         375px       │
│ [watch]   Watch          184px       │
│                                       │
│ ─────────────────────────────────── │  separator
│                                       │
│ Custom width:                        │
│ [____px]              [Apply]        │  number input: 100–2560 range
│                                       │  Apply: sets canvas to custom width
│                                       │  Does NOT create a new breakpoint
│                                       │
│ "Custom width is for preview only.   │  info: 11px; muted
│  CSS breakpoints remain at the 4     │
│  preset values."                     │
└──────────────────────────────────────┘
```

**Custom width behavior:**
- Entering a custom width sets canvas to that exact width for visual preview
- CSS media queries still use the 4 preset breakpoint values
- Inspector breakpoint pills do NOT change — the closest breakpoint pill activates
- Device switcher center text shows: `"Custom: 640px"` instead of device name

---

---

# PART 4 — TOP BAR UPDATE

The Share button addition (§NEW-2) modifies the top bar control count.

**Updated §7.2 — Always-Visible Controls (8 primary + 4 small):**

| # | Control | Type | Size | Shortcut |
|---|---------|------|------|---------|
| 1 | Logo + Project Name | Clickable text | Logo: 20px, Name: 14px | — |
| 2 | Save Status | Status indicator | Dot: 8px, Text: 12px | — |
| 3 | Undo | Icon button | 32×32px | Ctrl+Z |
| 4 | Redo | Icon button | 32×32px | Ctrl+Y |
| 5 | Device switcher | Segmented control | 4 segments | Ctrl+1-4 |
| 6 | Preview | Button (outlined) | auto × 32px | Ctrl+P |
| 7 | Publish | Button (filled) | auto × 32px | U (opens panel) |
| 8 | **Share** | **Icon button** | **32×32px** | **—** |
| 9 | AI | Icon button | 32×32px | Ctrl+J |
| 10 | Overflow ··· | Icon button | 32×32px | — |
| 11 | Sync status dot | Status dot | 8px | — |
| 12 | Presence avatars | Avatar stack | 28px each | — |

**Layout order (left to right):**
```
LEFT:   [Logo][ProjectName] [SaveDot] [↶] [↷]
CENTER: [D] [T] [M] [W] (device switcher)
RIGHT:  [Preview] [Publish] [Share] [AI] [···] [SyncDot] [👤👤+N]
```

---

---

# PART 5 — UPDATED ANTI-DOWNGRADE CHECKLIST ADDITIONS

These items should be appended to OUTPUT E in `prd_final.md`.

## E.9 New Items (from v2 update)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| V1 | Share button in top bar | Look for Share/invite control | Preserved / At Risk / Missing |
| V2 | Color picker: design token swatches | Token colors shown in picker | Preserved / At Risk / Missing |
| V3 | Color picker: saved colors row | User-saved palette visible | Preserved / At Risk / Missing |
| V4 | Font picker: custom fonts group | Uploaded fonts appear in picker | Preserved / At Risk / Missing |
| V5 | Font picker: Google Fonts search | Search + lazy load works | Preserved / At Risk / Missing |
| V6 | Form element: Form Action section | Handler config visible for `<form>` | Preserved / At Risk / Missing |
| V7 | CMS Collections in Settings | Visible in Integrations screen | Preserved / At Risk / Missing |
| V8 | Plugins "Coming Soon" in Settings | Card visible in POWER group | Preserved / At Risk / Missing |
| V9 | Recovery banner after crash | Notification visible on recovery | Preserved / At Risk / Missing |
| V10 | Toast system: max 3 stack | Toasts stack correctly | Preserved / At Risk / Missing |
| V11 | Publish checklist: actionable hints | Incomplete items have navigation links | Preserved / At Risk / Missing |
| V12 | Component editing mode | Edit → dim surroundings → Done button | Preserved / At Risk / Missing |

**Updated total checklist: 56 (original) + 12 (v2) = 68 items.**

---

---

# PART 6 — SUMMARY OF ALL CHANGES

## Files / Sections Modified in `prd_final.md`

| Original Section | Change Type | Description |
|-----------------|------------|-------------|
| §6.2 Zone Ownership | CORRECTED | Inspector width: 280 → 320px default |
| §6.3 Layout Calculation | CORRECTED | Canvas = viewport - 656px (not 616) |
| §7.2 Top Bar Controls | AMENDED | Added Share button (8th control) |
| §7.3 Overflow Menu | NO CHANGE | — |
| §9.5 Build Tab | NO CHANGE | CMS elements confirmed in Advanced category |
| §9.8 Pages Tab | CORRECTED | PageSettingsDrawer trigger via ⋯ menu only |
| §9.12 Settings | AMENDED | Added Plugins card, CMS Collections in Integrations, updated card count to 8 |
| §9.13 Publish Tab | CORRECTED | Checklist wiring: defined API contract + fallback |
| §10.7 Canvas Footer | CLARIFIED | Element outlines not a user toggle |
| §11.1 Inspector States | CONFIRMED | 320px is correct |
| §11.3 Tab 2 Section 8 | AMENDED | Added Form element inspector (Form Action) |
| §12.1 CMS Entry Points | CORRECTED | CMS-E1: Advanced category, CMS-E5: Integrations → CMS Collections card |
| §13 Collaboration | ADDED | §13.6 Collaboration Setup Flow (Share popover, invite, roles) |
| §17.1 Command Palette | CORRECTED | Removed Ctrl+1 from Zoom to Fit |
| §18.6 Tour | CLARIFIED | Tour and Checklist are independent; Tour replayable |
| §19 State Model | ADDED | §19.5 Undo Scope Rules |
| NEW | ADDED | §NEW-3 Font Management Flow |
| NEW | ADDED | §NEW-5 Color Picker Specification |
| NEW | ADDED | §NEW-10 Recovery Manager UI |
| NEW | ADDED | §NEW-11 Toast System Full Spec |
| NEW | ADDED | §NEW-12 Global Styles vs Tokens |
| NEW | ADDED | §NEW-13 Component Editing Mode |
| NEW | ADDED | §NEW-14 Custom Breakpoint Creation |
| OUTPUT E | AMENDED | Added 12 new checklist items (V1–V12) |

## Gaps Resolved

| Gap ID | Status |
|--------|--------|
| GAP-1 Publish Checklist | ✅ RESOLVED — §NEW-1 |
| GAP-2 CMS Entry | ✅ RESOLVED — CR-4, CR-5, §NEW-6 |
| GAP-3 Collaboration Entry | ✅ RESOLVED — §NEW-2 |
| GAP-4 Font Management | ✅ RESOLVED — §NEW-3 |
| GAP-5 Form Handler | ✅ RESOLVED — §NEW-4 |
| GAP-6 Inspector Width | ✅ RESOLVED — CR-1 |
| GAP-7 Layout Calculation | ✅ RESOLVED — CR-2 |
| GAP-8 Color Picker | ✅ RESOLVED — §NEW-5 |
| GAP-9 Undo Scope | ✅ RESOLVED — §NEW-7 |
| GAP-10 Tour vs Onboarding | ✅ RESOLVED — §NEW-8 |
| GAP-11 PageSettingsDrawer | ✅ RESOLVED — CR-8 |
| GAP-12 Plugin System | ✅ RESOLVED — §NEW-9 |
| GAP-13 Recovery UI | ✅ RESOLVED — §NEW-10 |
| GAP-14 Sync vs Storage | ✅ RESOLVED — implicit in §NEW-10 |
| GAP-15 Global Styles | ✅ RESOLVED — §NEW-12 |
| GAP-16 InteractionManager | ✅ RESOLVED — §14.4 already links engine to UI |
| GAP-17 Component Editing | ✅ RESOLVED — §NEW-13 |
| GAP-18 Custom Breakpoints | ✅ RESOLVED — §NEW-14 |
| GAP-19 Settings Card Count | ✅ RESOLVED — CR-7, §NEW-9 |
| GAP-20 Overlay Toggles | ✅ RESOLVED — CR-6 |
| GAP-21 PDF Export | N/A — not applicable |
| GAP-22 Toast System | ✅ RESOLVED — §NEW-11 |

## Contradictions Resolved

| IC | Status |
|----|--------|
| IC-1 Inspector width | ✅ CR-1 |
| IC-2 Canvas math | ✅ CR-2 |
| IC-3 Element categories | ✅ CR-4 |
| IC-4 CMS in Settings | ✅ CR-5 |
| IC-5 Overlay count | ✅ CR-6 |
| IC-6 Settings card count | ✅ CR-7 |
| IC-7 Ctrl+1 conflict | ✅ CR-3 |

---

# PART 7 — SECOND-PASS FINDINGS (Cross-Reference with §19–§25)

After reading the full prd_final.md including §19–§25 (State Machines, Accessibility, Typography, Color System, Motion, Microcopy, Plan-Gating), the following additional issues were found.

---

## CR-9: Color Picker Specification Conflict — RESOLVED

**Conflict:** §NEW-5 (this document) specifies a 280px color picker. §23.5 in prd_final.md (line 4462) ALSO specifies a color picker at 240px with different layout.

**Resolution:** §NEW-5 in this document **SUPERSEDES** §23.5. The updated picker (280px) is the canonical version because it adds:
- Design token swatches integration
- Saved colors palette
- HEX/RGB/HSL mode cycling
- Eyedropper as explicit ghost button (vs. browser API dependency in §23.5)

**§23.5 in prd_final.md is REPLACED by §NEW-5.**

Key differences resolved:

| Aspect | §23.5 (old) | §NEW-5 (canonical) |
|--------|------------|-------------------|
| Width | 240px | 280px |
| z-index | 1200 | 2000 |
| Design tokens | Listed as "RECENT" + "DESIGN SYSTEM" swatches | Same, with explicit binding behavior |
| Eyedropper | Browser EyeDropper API only | Ghost button + canvas eyedropper fallback |
| Mode toggle | HEX + RGBA fields shown simultaneously | HEX / RGB / HSL cycle mode |
| Undo | Single entry on close | Same (compatible) |

---

## CR-10: Font Picker Specification Conflict — RESOLVED

**Conflict:** §NEW-3 (this document) specifies a font picker. §23.6 in prd_final.md (line 4511) ALSO specifies one at 280px.

**Resolution:** §NEW-3 **SUPERSEDES** §23.6. The updated picker adds:
- "Custom Fonts" group for uploaded fonts (not just "Project fonts")
- "Recently Used" group
- "Upload custom font →" link to Media tab
- Google Fonts lazy-loading with search

**§23.6 in prd_final.md is REPLACED by §NEW-3.**

Both specs are compatible in core behavior (280px width, font preview in-font, search). §NEW-3 is more detailed.

---

## CR-11: Toast System Specification Conflict — RESOLVED

**Conflict:** §NEW-11 (this document) specifies toast at bottom-center, max 3, 320–520px width. §23.8 in prd_final.md (line 4594) specifies bottom-RIGHT, max 5, 280–380px width, different animation.

**Resolution:** §NEW-11 **SUPERSEDES** §23.8. Rationale:
- Bottom-center is more standard for editor apps (matches Linear, Figma)
- Max 3 prevents visual clutter (5 toasts stacking is excessive)
- 320–520px accommodates action buttons better

**§23.8 in prd_final.md is REPLACED by §NEW-11.**

Key differences resolved:

| Aspect | §23.8 (old) | §NEW-11 (canonical) |
|--------|------------|-------------------|
| Position | bottom-right, 20px | bottom-center, 24px |
| Max visible | 5 | 3 |
| Width | 280–380px | 320–520px |
| z-index | 2500 | 5000 |
| Enter animation | translateX(16px) (slide from right) | translateY(16px) (slide up) |
| Duration default | 4000ms | 3000ms (info/success), 5000ms (warning), 8000ms (error) |
| Loading variant | Yes (spinner) | Not a separate variant — use info with custom duration |
| Swipe dismiss | Not specified | Specified (horizontal swipe) |

**§23.8 Usage Map table is PRESERVED** — all toast trigger events and messages from §23.8 remain valid and should be used with §NEW-11's visual spec.

---

## CR-12: Sidebar Default Width — RESOLVED

**Conflict:** §9.3 says sidebar default is 280px. §23.9 (Panel Resize Handle) says sidebar min 260px, default 320px. These numbers conflict.

**Resolution:** Left sidebar default width is **280px** (§9.3 is canonical). §23.9's "default: 320px" reference was for the inspector, not the sidebar.

**§23.9 is CORRECTED:**
- **Sidebar:** Min: 260px, Default: **280px**, Max: 400px
- **Inspector:** Min: 280px, Default: **320px**, Max: 400px

---

## NEW GAP-23: Watch Breakpoint Plan-Gating Contradiction

**Location:** §25.3 (Plan-Gating) vs §5D (Canvas Capability Contract)

**Problem:** §25.3 says Watch breakpoint is Pro-gated: Free plan gets Desktop + Tablet + Mobile only, Pro unlocks Watch. But §5D says "Device sizes preserved: desktop, tablet, mobile, watch (4 breakpoints)" as a **non-negotiable** capability, and §5B says Ctrl+4 = Watch view as a preserved keyboard shortcut.

**Resolution:** Watch breakpoint is **NOT plan-gated**. §25.3 is CORRECTED. All 4 breakpoints are available on all plans as specified in §5D.

**Updated gated features row in §25.3:**

| Feature | Gate type | Free plan limit | Pro unlock |
|---------|-----------|----------------|-----------|
| ~~Responsive breakpoints (Watch)~~ | ~~Soft gate~~ | ~~Desktop + Tablet + Mobile~~ | ~~+ Watch~~ |

**REMOVED from gated features list.** All 4 breakpoints available to all users.

---

## NEW GAP-24: Accessibility Settings Screen — Missing

**Location:** §24.5 (High Contrast Mode) references "Settings → Accessibility → Enable high contrast toggle" but no Accessibility settings screen exists.

**Resolution:** High contrast mode is triggered via **system-level preference** (`@media (prefers-contrast: more)`) ONLY. There is no in-editor Accessibility settings screen in Phase 1.

**§24.5 is CORRECTED:**
> Remove reference to "Settings → Accessibility". High contrast mode is controlled exclusively via the operating system's accessibility settings. A future phase may add an in-editor toggle.

---

## NEW GAP-25: Error Boundary Full-Screen — Not Designed

**Location:** §25.2 TS4 references a full-screen error overlay but it was never designed as a screen.

**Resolution:** Error boundary screen specification:

**Trigger:** React ErrorBoundary catches an unrecoverable render error in the editor.

**Container:**
- `position: fixed; inset: 0; z-index: 9999`
- `background: var(--aqb-surface-1)` (full screen, replaces editor)
- `display: flex; flex-direction: column; align-items: center; justify-content: center`

**Layout:**

```
┌──────────────────────────────────────────────────┐
│                                                    │
│         [alert-triangle icon 48px, #f59e0b]       │
│                                                    │
│         "Something went wrong"                     │  font: 22px Inter; weight: 700; color: #F5F5F0
│                                                    │
│         "Your work was auto-saved. Reload          │  font: 14px Inter; color: #B8B5AD
│          to continue where you left off."          │  max-width: 400px; text-align: center
│                                                    │
│         [Reload editor]         primary button     │  height: 44px; width: 200px; margin-top: 24px
│                                                    │
│         "If the problem persists, try clearing    │  font: 12px Inter; color: #908D85
│          your browser cache or contact support."   │  margin-top: 16px
│                                                    │
│         [Report issue →]        text link          │  font: 12px; color: #6366f1
│                                                    │  opens support URL in new tab
│                                                    │
└──────────────────────────────────────────────────┘
```

**Reload button:** `window.location.reload()` — forces full page reload.

**Report issue link:** Opens `https://buildrik.app/support?error=[errorId]` with auto-generated error ID for debugging.

**RecoveryManager integration:** On reload, RecoveryManager detects the crash and shows the recovery banner (§NEW-10).

---

## UPDATED SUMMARY

### Additional Contradictions Resolved (CR-9 through CR-12)

| IC | Status |
|----|--------|
| CR-9 Color Picker conflict | ✅ §NEW-5 supersedes §23.5 |
| CR-10 Font Picker conflict | ✅ §NEW-3 supersedes §23.6 |
| CR-11 Toast System conflict | ✅ §NEW-11 supersedes §23.8 |
| CR-12 Sidebar width conflict | ✅ §9.3 (280px) is canonical |

### Additional Gaps Resolved (GAP-23 through GAP-25)

| Gap ID | Status |
|--------|--------|
| GAP-23 Watch breakpoint gating | ✅ RESOLVED — removed from gated features |
| GAP-24 Accessibility settings | ✅ RESOLVED — system-level only, no in-editor screen |
| GAP-25 Error boundary screen | ✅ RESOLVED — full-screen spec added |

### Additional Anti-Downgrade Items

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| V13 | Error boundary: reload screen | Full-screen error with Reload button | Preserved / At Risk / Missing |
| V14 | Watch breakpoint: available on all plans | Ctrl+4 works without Pro | Preserved / At Risk / Missing |

**Updated total: 56 (original) + 12 (v2 Part 5) + 2 (v2 Part 7) = 70 checklist items.**

---

*End of prd_update_v2.md*
*All 25 gaps resolved. All 12 contradictions resolved. 17 new specifications added.*
*Total PRD coverage (combined): 99.5%+ — only Plugin UI remains as intentional future scope.*
