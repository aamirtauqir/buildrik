# Buildrick · Editor v3 · IA — design rules (established from the file, 2026-09-15)

File `g4GzQFqzNYz5sosz1QtZXC` · page `4418:45431` (ONLY page you write to). Read `BRIEF.md` in this folder first — its method rules (figma-use skill, page switch, raw reactions, type guards, light scripts, read-back, hide-don't-delete, no main-component edits, no new pages) all still apply.

## What the file already is (do not invent a new system)
- **Type:** Inter (UI) + Geist Mono (data). 16 local text styles are the scale — bind to them, never create sizes:
  `ui/11 · caption` (11 R/16) · `ui/11 · caption medium` (11 M) · `ui/11 · section header` (11 M, uppercase, +tracking) · `ui/12 · small` (12 R/18) · `ui/12 · small strong` (12 SB) · `ui/13 · row label` (13 R/20) · `ui/13 · row label medium` (13 M) · `ui/14 · body` (14 R/20) · `ui/14 · panel title` (14 M) · `ui/14 · panel title strong` (14 SB) · `ui/16 · heading` (16 SB/24) · `ui/20 · heading lg` (20 SB/30) · `ui/24 · title` (24 SB/32) · `data/11 · mono small` · `data/12 · mono` · `data/13 · mono`.
  Off-scale UI sizes seen: 10, 15, 17, 22, 28 → snap to the nearest style (10→11 caption, 15→16 heading or 14 strong by role, 17→16, 22→20 or 24). **Canvas site content is exempt** (anything inside the `site page` / `Site page` frames, hero copy, Playfair, "Wood-fired pizza…" etc. is the customer's site, not our UI).
- **Colour:** tokens in collections `Primitives` (`color/ink`, `color/ink-soft`, `color/border`, `color/bg-panel`, `color/bg-app`, `flowbite/gray|blue/*`) and `Package`. UI fills/strokes/text should be bound to them (priority Primitives/color > Primitives > Package). Muted text = gray/500 `#6B7280` (4.83:1), never `#9CA3AF` for readable copy (placeholders only). Accent `#1A56DB` = flowbite/blue/700.
- **Spacing:** 4-px grid with dense micro-steps 2/6/10 allowed inside chips, pills and toolbar groups; 3, 5, 7, 9, 13, 14, 15, 18, 22, 26 are accidental → snap to the nearest 4. Panel padding 16 · row height 28/32 · dialog card padding 24 · dialog gap 16.
- **Radius:** 4 (inputs, small chips) · 6 (buttons, cards) · 8 (panels, menus) · 12 (dialog cards) · 9999 (pills). 2, 3, 10 are strays → nearest.
- **Stroke:** 1 px `color/border`; 2 px only for selection outlines / focus; 1.5 is a stray.
- **Elevation:** effect styles `elevation/subtle | raised | popover | modal | overlay | drag | focus-ring`. Menus/popovers = `elevation/popover`; dialogs = `elevation/modal`; toasts = raised.
- **Icons:** the UI's icon language is monochrome unicode glyphs (▾ ⋯ ↶ ↷ ▭ ▤ ▦ ◈ ⛓ ✕ › ▸ ☐ ☑ ⌘) at text size — keep it. **Colour emoji are strays** (👁 🔒 📁 ✨ 💡 🎨 …): replace with the library `Icon / *` components on 🧩 Components where one exists (`eye` 91:79, `eye-off` 91:87, `lock` 91:93, `folder` 91:200, `image` 91:142, `settings` 91:135, `link` 91:155, `type` 91:149, `content` 11:28 …) at 14–16 px, tinted `color/ink-soft`; otherwise a monochrome glyph. Never draw new icons.
- **Shell:** rail 60 (set `4418:144790`) · drawer 280 (`Drawer (pinned)` → one `Panel — …` child) · canvas 800 · inspector 300; topbar 56; `Panel header` instance on every drawer (title `ui/14 · panel title`, ⛶ + ✕); page tabs row 36; status bar 32 at the bottom; canvas toolbar floating at y 796.
- **Dialog anatomy (v3):** centred card, radius 12, `elevation/modal`, padding 24, gap 16, title `ui/16 · heading`, body `ui/13 · row label` muted, footer = one HORIZONTAL row right-aligned (`primaryAxisAlignItems MAX`), order Cancel/ghost → secondary → primary; destructive primary red `#C81E1E`-class; opened as OVERLAY with scrim (`#111827` @ 0.5) when it is a top-level board.
- **Toast:** dark pill 360×43 at (560, 744), title + optional info line + [Undo] link.
- **Copy:** sentence case; labels = user nouns (Add · Layers · Pages · Assets · CMS · Brand); buttons say the outcome ("Replace Menu", "Save record"); "…" only when a dialog follows.

## Interaction-pattern rules (from the file's own good examples)
| Task | Pattern | Examples that do it right |
|---|---|---|
| Substantial workflow, many fields, its own navigation | **Full page** (1440×900, its own breadcrumb/back) — entered by NAVIGATE, or OVERLAY only if the file convention already does so (Settings / Templates / Assets library) | Full-screen Settings, Templates catalogue, Assets library, CMS table |
| Focused decision, ≤ 2 fields, must be answered | **Modal** (480–720 wide, OVERLAY + scrim, Cancel = CLOSE) | Replace Menu? 4428:149521, New page 4428:151059, Field settings |
| Editing beside the canvas, needs the canvas visible | **Drawer / panel** (280 left, 300 right) | Layers, Add, Brand, Inspector |
| ≤ 8 actions on an object | **Menu** (popover list, `elevation/popover`, ESC + click-outside) | Pages row ⋯ 4428:148290, canvas ⋯ 4428:43928 |
| Compact control set anchored to a field | **Popover** (≤ 320 wide, OVERLAY, ✕/ESC) | Fill picker 4428:142922, swatch picker 4428:149324 |
| Closely related detail | **Inline expansion** (Show all, group chevrons) | Inspector groups, Brand Advanced rows |

Defects to fix: a dialog-sized frame reached by NAVIGATE (bare card on canvas); a full-page surface used as a popover; a modal for something that is one click (use a menu/inline); a menu that changes the page instead of acting; equivalent tasks treated differently across modules (e.g. rename via inline in one place and a modal in another) — pick the file's majority pattern and align the outliers; landings on 560-px "leaves the editor" cards (`4418:124664`-class) — those need a real destination or an explicit external-link treatment.

## IA / mental-model checks per screen
Why did the user arrive → what do they expect → what happens next → how do they return/cancel/recover → what context must remain. Labels must match the rail vocabulary; breadcrumb = `Site › Page › Panel`; the selected element must read the same in Layers, canvas label, Inspector header and status bar.

## Fix priorities (do the cheap systemic ones first)
1. Bind raw UI text to the matching text style (no visual change) and raw fills/strokes to tokens (re-assign with `opacity` preserved).
2. Snap off-scale sizes, off-grid paddings, stray radii/strokes inside your sections (UI chrome only).
3. Replace colour emoji with library icons.
4. Dialog / panel-header / toast anatomy alignment.
5. Pattern and IA repairs (wiring + copy), then missing states (reuse existing STATE boards; new boards only when no state exists — clone the family base, name `STATE · …`, wire from a natural trigger + the STATES launcher).

## Report format (same folder, `<module>-v.md`)
1. Scope (sections, boards read). 2. Design-rule deviations found (table: node | rule | observed | fixed?). 3. Pattern/IA defects (table: screen | task | current pattern | right pattern | why | fix status). 4. Fixes applied with read-back. 5. Verification (UNVERIFIED unless played back). 6. Requests / blocked / ambiguities for the owner.
