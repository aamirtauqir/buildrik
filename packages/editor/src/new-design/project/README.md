# Buildrik Design System

**Buildrik** is a drag-and-drop website builder — in the same space as Webflow, Framer, and Wix Studio. Users build sites visually on a canvas: drop blocks, edit in an inspector panel, preview across breakpoints, and publish.

This repo is a **design system snapshot** of Buildrik's editor chrome (the app UI) plus the tokens that user-built sites inherit by default. Use it to design interfaces, slides, prototypes, or marketing material that feels native to Buildrik.

---

## Sources

- **Codebase** — attached via local mount at `src/` (React + TypeScript, Vite). Canonical design system lives at `src/themes/design-system/*.css`.
- **Product spec** — `src/Buildrik Editor — Complete Feature List.md` and `src/2026-04-01-buildrik-editor-ui-zones-design.md`.
- **Analysis** — `src/code-to-prd-output/buildrik-analysis.md`.
- **Components** — `src/components/`, `src/editor/` (React component tree).
- **Icons** — `src/assets/icons/{navbar,blocks,layers}/` — local SVGs + Lucide React (imported throughout the codebase).

The reader of this readme is not assumed to have any of the above; everything needed for design work has been mirrored into this project under `reference/` and `assets/`.

---

## Product surfaces

Buildrik is essentially **one product** — a site builder editor — but it contains several distinct UI surfaces a designer will touch:

| Surface | What it is |
|---|---|
| **Editor** | The main workspace: topbar + left sidebar (Add/Layers/Pages/Components/Media/Design/Settings/Publish/History) + canvas + right inspector (Layout/Appearance/Effects/Interactions/CMS). |
| **Canvas** | The artboard where users drop blocks. Light slate wrapper with a 20px dot grid; artboards are white cards with soft shadow. |
| **Inspector** | Right-hand panel of numeric fields, color swatches, dropdowns, switches — the densest UI in the product. |
| **Published sites** | The output — user-built sites using `--buildrick-design-*` tokens. Not in scope for chrome work but tokens are documented. |

A UI kit for the Editor surface lives in `ui_kits/editor/`.

---

## CONTENT FUNDAMENTALS

Buildrik's copy voice is **direct, technical, short**. This is a builder for people who already know what a section, a flex container, and a breakpoint are. No hand-holding, no marketing fluff inside the product.

### Voice and tone
- **Neutral-professional** — not chirpy, not corporate. Factual.
- **Command-form labels** in UI ("Publish", "Add page", "Duplicate", "Revert"). Imperative, no please.
- **Short noun labels** for navigation ("Layers", "Pages", "Media", "Design"). One word when possible.
- **No exclamation marks** in product chrome. Save energy for empty states and published URLs.
- **"You"** for the user; **"we"** only in billing/legal. Never "let's".
- **Present tense** status ("Saved", "Saving…", "Unsaved changes", "Offline").
- **Sentence case** across the board. No Title Case In Buttons.
- **Numerals, not words** ("1 issue", "24 pages", "8 unsaved changes").

### Specific examples from the app
- Topbar: "Dashboard", "Undo", "Redo", "Publish", "Preview", "Saved", "Offline"
- Tabs: "Add", "Layers", "Pages", "Components", "Media", "Design", "Settings", "Publish", "History"
- Buttons: "Add page", "Delete", "Duplicate", "Apply", "Revert to this version"
- Empty states: "No pages yet. Add one to get started." — single sentence, declarative.
- Errors: "Couldn't save. Retry?" — short, question-offering-action.
- Success: "Published" (as a badge, not a sentence).

### Copy the product **avoids**
- Em dashes in UI copy (reserved for documentation like this file).
- "Awesome", "amazing", "supercharge", "unleash".
- Emoji in chrome.  Emoji appear only as **user content** (e.g. inside a block the user built) and in a couple of legacy block-registry icons (scheduled for replacement with Lucide). Treat them as non-canonical.
- Feature marketing language. The product is the interface.

### Vibe
Think "pro tool" more than "consumer app". Closer to Linear or Figma than Canva. Cobalt accent, slate neutrals, generous whitespace inside dense panels, monospace for numeric values.

---

## VISUAL FOUNDATIONS

### Color
**Single-accent system.** One brand color — **cobalt `#2D6DFF`** — used for selection, focus rings, primary buttons, active tabs, and links. No secondary accent. Semantic colors (red `#DC2626`, green `#16A34A`, amber `#D97706`) appear only for status.

Neutrals are **slate** (Tailwind slate family). Surfaces: `#FFFFFF` cards on `#F8FAFC` panels on a `#F8FAFC` canvas wrapper with `rgba(15,23,42,0.08)` dot grid. Text: `#334155` primary / `#64748B` secondary / `#94A3B8` muted.

**Avoid:** gradients (the app uses exactly zero decorative gradients — only the canvas grid has a single flat dotted pattern), tinted backgrounds beyond slate, colored left-border accent cards, multi-stop color mixing.

### Type
Two display-ish families + mono. **Inter Tight** is the workhorse (all UI, headings, body). **General Sans** is reserved for rare large display moments (marketing pages; not editor chrome). **Geist Mono** for numeric values, CSS selectors, code, keyboard shortcuts, and command palette output.

Compact scale: `11 · 12 · 13 · 14 · 16 · 18 · 20 · 24 · 32 · 48`. Editor UI lives mostly in 11–14px. 13px is the **default body size inside the editor** (not 14); 14 is used for canvas-adjacent text.

Tracking is **tight** on headings (`-0.02em`) and **slightly wide** on micro-labels (`0.02em`–`0.08em`). Never all-caps without extra tracking.

### Spacing
4-pt grid. Tokens: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`. Minimum touch target `44px`. Panel section padding `12px`; section gap `16px`.

### Corner radii
Subtle. `sm:4 · md:8 · lg:12 · xl:16 · full:9999`. Buttons and inputs use **8px**. Cards use **8–12px**. The CTA (Publish) uses a full pill (`9999px`) to stand out. Never rounded-xl-with-border-accent; never 24px+ soft blobs.

### Shadows
Restrained. Five-step scale from `xs` (hairline) to `xl` (modal). Modals: `0 8px 32px rgba(15,23,42,0.08)`. Cards: `0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)`. Shadows are always **cool-tinted slate** (`rgba(15,23,42,...)`), never warm grey or black.

Focus rings: 3px cobalt at 8–12% alpha. Selection glow: 4px cobalt at 8%. No inset glows, no neon.

### Borders
Three weights: `#E2E8F0` default / `#CBD5E1` medium / `#94A3B8` strong. All slate. Focus border swaps to cobalt `#2D6DFF`. **1px everywhere** — no 2px borders in normal chrome (2px appears only under `prefers-contrast: high`).

### Backgrounds
- Editor shell: flat slate-50 (`#F8FAFC`).
- Canvas wrapper: slate-50 with 20×20px dotted pattern (`rgba(15,23,42,0.08)` dots).
- Cards: pure white.
- **No hero images in chrome.** No illustrations. No patterns other than the canvas grid. No photography.

### Animation
**Minimal and fast.** Durations: 80/120/180/240ms. Default easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material "standard"). Transitions are applied to `background-color`, `border-color`, `color`, `transform`, and `opacity` only. **No bounces, no spring physics, no entrance animations on load.** Hover-lift is a 1px translateY; hover-scale is `1.02`. `prefers-reduced-motion` drops all durations to 0.01ms.

### Hover states
- Surfaces: tint with `rgba(15, 23, 42, 0.04)` (`--bd-bg-hover`).
- Buttons: lighten accent (`#2D6DFF` → `#4B8DFF`).
- Secondary buttons: border goes `medium → strong`, bg goes `card → subtle`.
- Icons: text color shifts `secondary → primary`.
- Never opacity-only hovers.

### Pressed states
- Accent button darkens (`#2D6DFF` → `#1E58D9`).
- Neutral surfaces get `rgba(15, 23, 42, 0.06)` (`--bd-bg-pressed`).
- No shrink transforms. No inset shadow.

### Transparency & blur
Used **sparingly and only semantically**:
- Selection/focus rings: color at 5–12% alpha.
- Hover/press overlays on neutrals: slate-900 at 4–6% alpha.
- Semantic tints: each status color has a `*-bg` (5–10% alpha) and `*-border` (30% alpha) variant.
- **No backdrop-filter blur** in the editor chrome. Modals use solid surfaces with a 40% slate-900 overlay. This is intentional — blur is reserved for user-site effects, not the app itself.

### Layout rules
Editor shell is fixed-pixel and deterministic:
- Header: 48px tall
- Left rail (icons only): 56px wide
- Left panel: 320px wide
- Right inspector: 280px wide
- Footer: 32px tall
- Canvas: fills remainder

Within panels, **12px horizontal padding, 16px section gap**. Inputs are 32px tall, labels are 12px/500.

### Cards
White (`--bd-bg-card`), 1px `--bd-border`, 8 or 12px radius, `--bd-shadow-md` when elevated / no shadow when flush. Header → thin hairline divider → body. No header-tinted cards; no left-accent-bar cards.

### Protection gradients vs capsules
The system uses **capsules** (`border-radius: 9999`) sparingly — one per topbar context (Publish CTA) and for status pills (Draft / Published). It never uses protection gradients over images (there are no chrome images to protect).

### Imagery color vibe
Not applicable to chrome — there is no photography or illustration in the editor. Any user-uploaded imagery is presented as-is on neutral backgrounds. If marketing imagery is needed, lean cool/neutral to match the slate palette; avoid warm/saturated photography.

---

## ICONOGRAPHY

Buildrik uses a **mixed system**, weighted toward Lucide:

1. **Lucide React** (primary) — ~80% of icons are `lucide-react` components imported directly in TSX (`Heading`, `Square`, `Columns2`, `Grid3x3`, `Rows3`, `Type`, `Image`, `Video`, `Upload`, `Sparkles`, `Megaphone`, …). Outline style, 1.5 stroke. Use via CDN:

   ```html
   <script src="https://unpkg.com/lucide@latest"></script>
   <!-- or React: import { Heading } from 'lucide-react' -->
   ```

2. **Local SVGs** (secondary) — under `assets/icons/{navbar,blocks,layers}/` — hand-authored outline icons used in the sidebar nav and some block cards. Also outline, 1.5 stroke, matches Lucide visually. Copied from `src/assets/icons/`.

3. **Inline SVG** (tertiary) — small JSX-inlined icons in `Topbar.tsx`, `StatusIndicators.tsx`, etc. for icons not in Lucide (custom arrow shapes, status dots). Same style.

**No icon font.** No FontAwesome. No Phosphor, no Heroicons.

**Emoji usage:** a handful of block-registry entries in the codebase have emoji icons (e.g. map-embed `🗺️`). These are legacy and being migrated to Lucide. **Don't use emoji in new chrome design.**

**Unicode chars as icons:** only `⌘` (keyboard command glyph in Command Palette) and `↗` (external link). Both are valid in-chrome; treat them as typography.

### Icon sizing
- Rail nav: 18–20px
- In-button: 14–16px
- Inline labels: 14px
- Inspector value-indicators: 12px
- Stroke weight: **1.5** universally.

### Copied assets
All local SVGs live at `assets/icons/` (identical to the source tree). Key logos/brand marks **do not exist** in the codebase — Buildrik uses a text wordmark only. Flag to user: **brand logo SVG missing.**

---

## Substitutions & flags to user

- **General Sans** (display font) → substituted with **Inter Tight** (tight tracking). Not on Google Fonts. ❗ Please attach the `.ttf`/`.woff2` for General Sans so we can swap it in.
- **Brand logo / wordmark** → not found in the codebase. Currently rendering the text "Buildrik" in Inter Tight semibold. ❗ Please share an official logo asset (SVG preferred).
- **Lucide icons** → loaded via `lucide-react` at runtime in the codebase; in this design system we rely on CDN and local SVG copies. No substitutions.

---

## Index

```
/
├── README.md                   ← you are here
├── SKILL.md                    ← Agent SKills manifest
├── colors_and_type.css         ← primary tokens (import this)
├── reference/                  ← verbatim CSS from src/themes/design-system/
│   ├── color.css
│   ├── typography.css
│   ├── spacing.css
│   ├── radius.css
│   ├── shadow.css
│   ├── motion.css
│   ├── z-index.css
│   ├── layout.css
│   ├── design.css              ← user-site (canvas) tokens
│   └── a11y.css
├── assets/
│   └── icons/
│       ├── navbar/             ← rail + topbar icons (16 svgs)
│       ├── blocks/             ← element-palette icons (37 svgs)
│       └── layers/             ← layer-tree icons (5 svgs)
├── fonts/                      ← empty; Inter Tight + Geist Mono load from Google
├── preview/                    ← Design System tab cards
└── ui_kits/
    └── editor/
        ├── README.md
        ├── index.html          ← interactive editor recreation
        └── *.jsx               ← topbar, sidebar, canvas, inspector, etc.
```

---

## Using this system

For production Buildrik design work:

```html
<link rel="stylesheet" href="colors_and_type.css">
<!-- or -->
<link rel="stylesheet" href="reference/color.css">
<link rel="stylesheet" href="reference/typography.css">
<!-- ... -->
```

For prototyping: the UI kit in `ui_kits/editor/` has copy-pasteable React components (Topbar, LeftRail, SidebarPanel, Canvas, Inspector, Button, InputField, Card, Badge, Tabs).
