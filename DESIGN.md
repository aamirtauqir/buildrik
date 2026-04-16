# Design System — Buildrik

## Product Context
- **What this is:** AI-powered drag-and-drop website builder editor. Three creation modes (drag, templates, AI generate) sharing one element vocabulary.
- **Who it's for:** Solo designers currently billing clients on Webflow or Framer. Time-constrained power users, not beginners.
- **Space / industry:** Designer-grade web builders. Peers: Webflow, Framer, Webstudio. Not peers: Wix, Squarespace, Durable (different wedge).
- **Project type:** Desktop web app with separate marketing site. Editor chrome is the primary surface.

## Aesthetic Direction
- **Direction:** Industrial / Utilitarian crossed with Editorial restraint. "Webflow + Linear had a child."
- **Decoration level:** Minimal. Surfaces communicate depth through layered tone. No gradients, no blobs, no grain, no decorative texture.
- **Mood:** A quiet tool a professional reaches for. Confidence without showmanship. Trust-building through restraint.
- **Reference points (in-distribution, not copied):** Linear, Arc browser, Raycast, Figma (minus playful accents).

## Typography

**No default stacks. Never fall back to Arial, Helvetica, Roboto, or system-ui.**

- **Display / Hero (marketing site only):** `General Sans` (Fontshare, free). Industrial sans with character. Use 600–700 weight for hero copy.
- **Body + Editor UI (primary workhorse):** `Inter Tight` OR `Geist`. Tight letter-spacing, slightly condensed feel, reads as "tool" not "document." Pick one and commit; do not mix.
- **Data / Inspector values:** `Geist Mono` with `font-variant-numeric: tabular-nums`. Required for dimensions like `1024 × 768` to align column-wise.
- **Code (template JSON viewers, anywhere user sees code):** `Geist Mono` (same family keeps type system coherent).
- **Loading:** Use Fontshare / Bunny Fonts CDN with `font-display: swap`. Self-host in production.
- **Type scale (px):** 11 / 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48. Editor chrome lives mostly at 12–14.

## Color

**Approach:** Restrained. One accent. Everything else neutral. Color is rare and meaningful.

### Removed (AI-slop — purge from `themes/default.css`)
- `--aqb-primary: #6366f1` (indigo) → replace with cobalt token below
- `--aqb-primary-hover: #818cf8` → replace
- `--aqb-primary-active: #4f46e5` → replace
- `--aqb-primary-light / muted / subtle` indigo tints → replace
- `--aqb-secondary: #8b5cf6` (violet) → **delete, no secondary accent**
- `--aqb-secondary-hover: #7c3aed` → delete
- `--aqb-secondary-light: rgba(139, 92, 246, 0.12)` → delete

### Accent (single)
- **`--accent: #2D6DFF` (cobalt)** — already present as `--blue2`. Promote to the primary accent token.
- **`--accent-hover: #4B8DFF`** — present as `--blue`. Keep.
- **`--accent-pressed: #1E58D9`** — new, darker step for `:active`.
- **`--accent-tint: rgba(45, 109, 255, 0.12)`** — selection rings, hover backgrounds.
- **`--accent-subtle: rgba(45, 109, 255, 0.06)`** — focus glows.

**Usage rules:** accent appears on (a) the one primary CTA per screen, (b) selection outlines, (c) the active rail/tab indicator. Nowhere else. If you are tempted to use it on a secondary surface, pick a neutral instead.

### Neutrals (keep — these are already tuned)
- Dark surfaces: `--aqb-surface-1: #0f0f14` through `--aqb-surface-5: #2e2e38`. Five-layer depth hierarchy is correct.
- Backgrounds: `--aqb-bg-dark: #0c0c14`, `--aqb-bg-panel: #14141f`, `--aqb-bg-canvas: #ffffff`.
- Text: `--aqb-text-primary: #F5F5F0` (14.1:1), `--aqb-text-secondary: #B8B5AD` (6.5:1), `--aqb-text-tertiary: #A09D96`, `--aqb-text-muted: #908D85`. All WCAG-AA. Keep as-is.
- Borders: `--aqb-border: rgba(255,255,255,0.08)` through `--aqb-border-hover: rgba(255,255,255,0.15)`. Keep.

### Semantic (keep)
- Success `#22c55e`, warning `#f59e0b`, error `#ef4444`. Already tuned.

### Dark / Light
- Editor chrome is dark-only. Desktop-only product, power user context.
- Canvas (the site being designed) is always light OR whatever the designer chooses for their output. Editor chrome does not follow canvas theme.

## Spacing
- **Base unit:** 4px.
- **Density:** Compact. Designers want screen real estate for the canvas.
- **Scale:** 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Layout
- **Editor:** Grid-disciplined. Left rail (64px), left sidebar panel (280px, Add/Templates/etc.), canvas (flex), right inspector (320px). No creative layout in editor chrome — predictability is the feature.
- **Marketing site:** Hybrid. Hero can break the grid; section content stays disciplined. Full-bleed hero, single composition, brand-first hierarchy.
- **Max content width (marketing):** 1200px for text blocks, full-bleed for hero / image sections.
- **Border radius scale:** `sm: 4px` (inputs, cards inside inspector), `md: 8px` (panels, modals), `lg: 12px` (cards in marketing), `full: 9999px` (pills, avatars).

## Motion
- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Easing:** `enter: ease-out`, `exit: ease-in`, `move: ease-in-out`.
- **Duration:** hover `150ms`, panel open `200ms`, drag preview fade `250ms`, modal enter `200ms`. No spring physics. No scroll choreography. No entrance animations on first paint.
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — disable all non-essential transitions.

## Anti-Slop Rules (enforce in QA and code review)
1. No purple, violet, indigo gradients. Ever.
2. No 3-column feature grid with icons in colored circles.
3. No centered-everything sections.
4. No decorative blobs, wavy SVG dividers, floating circles.
5. No emoji as design elements (rockets, sparkles as bullets).
6. No colored left-border card treatment.
7. No default font stacks as fallbacks.
8. Cards earn their existence. If it's not interactive, don't wrap it in a card.

## Accessibility
- WCAG AA minimum on all body text (already met by the neutral token math).
- Keyboard navigable: `/` focuses Add tab search, `↑/↓` for card grid, `Enter` to add-at-selection, `Esc` to close drawers.
- Touch targets ≥ 44×44 (editor is desktop-only, but marketing site must comply on mobile).
- ARIA landmarks on main editor regions (rail, sidebar, canvas, inspector).
- Respect `prefers-reduced-motion`, `prefers-color-scheme` (marketing site only — editor is always dark).

## Implementation Notes
- Tokens live in `packages/editor/src/themes/default.css`. Migration from the indigo/violet tokens to cobalt accent should be a single PR.
- Marketing site likely has its own theme file. Keep the token names consistent across both (`--accent`, not `--aqb-primary` in marketing).
- `packages/editor/src/features/design-system/` should export these tokens as TypeScript constants for anywhere inline-styled code needs them.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-16 | DESIGN.md created | /design-consultation run after /plan-design-review flagged purple as AI slop. First formal design system for Buildrik. |
| 2026-04-16 | Rip `--aqb-primary` (indigo) and `--aqb-secondary` (violet) | Existing tokens are the exact AI-slop accents the design review banned. |
| 2026-04-16 | One accent = cobalt `#2D6DFF` | User-selected from a list that included electric yellow and mint. Reuses existing `--blue2`. Safest option — Webflow/Framer/v0 all in blue territory, so less differentiated, but ships immediately without token churn. |
| 2026-04-16 | Typography: General Sans / Inter Tight or Geist / Geist Mono | No default stacks. Geist Mono required for tabular numbers in inspector. |
| 2026-04-16 | Editor is desktop-only, dark-only | Matches wedge user (solo designer on laptop), matches the "Buildrik works best on desktop" call in the design doc. |
| 2026-04-16 | Marketing site uses hybrid layout, display font (General Sans) | Separates "marketing Buildrik" from "editor Buildrik" visually without a second type family. |
