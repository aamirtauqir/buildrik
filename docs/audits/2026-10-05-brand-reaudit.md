# Brand — re-audit against main `82b9d1c0d` (2026-10-05)

Baseline: `docs/audits/2026-09-27-module-audit/03-brand.md` (BRD-01…22, 4.1/10). Same 10 lenses, same flows.
`E/` = `packages/editor/src/editor/`. Read-only audit; no product code changed.

**Setup.** Worktree `audit/brand-2026-10-05` at main `82b9d1c0d`, dashboard dev server on :3380, headless Chromium (Playwright 1.61.1)
with `sites.publish` blocked at the route layer. Account `qa@buildrik.local`. Scratch site created for this walk:
**"Brand reaudit scratch 2026-10-05"** (`cmutd20ny00086frk2nape8gx`, blank). Viewports 1440×900 (main) and 1440×732
(Colours, picker, Inspector popover). Screenshots: scratchpad `…/scratchpad/brand-audit/NN-*.png` (numbers cited below).

**What landed since 09-27 that touches Brand**

| Change | Landed? | Effect on Brand |
|---|---|---|
| Inspector v4 popover portal (`66a35650f`, `388428d8d`, `d286dffbb` board 33) | Yes | BRD-01 fixed |
| Toast restyle (`dbba9c02c`…) | Yes | Brand toasts now bottom-right light cards; no Brand behaviour change |
| Live-preview empty-page note (`4085fbe7b`) | Yes | Empty page shows "This page is empty. Add content…" (01) |
| Settings Phase B "Brand ↗" door | Yes | Two doors (nav + Overview card); Back still lands on canvas |
| `Page / background` token seeded, new page roots bound (`057342f99`, `6109ae85f`) | Yes | 19th colour token; the only element a new site has that is token-bound |
| **R1 token-binding plan** (`packages/editor/docs/plans/2026-10-01-brand-token-binding.md`) | **No** — plan only. `defaultStyles.ts:18,147,227,238,362,368` still `THEME.primary` literal; no `shared/constants/siteRoleTokens.ts`; `blockPalette.ts` `BLOCK_COLORS.accent: "#1A56DB"` | BRD-05 still true |
| `BrandWorkspace.tsx` | Unchanged since baseline (1,319 lines, same 11-row NAV + 11 MORE_KINDS) | |

## 1. Scorecard (0–10)

| # | Lens | 09-27 | 10-05 | Why it moved (or didn't) |
|---|---|---|---|---|
| 1 | Cohesion | 4 | 4 | Same flat 11-row nav mixing tokens, presets, CSS classes, a block list, checks, AI, import/export |
| 2 | Misfit | 4 | 4 | Component styles still ejects to Add › Blocks; Add › Blocks now claims "Blocks use your Brand colours and fonts" — they don't (BRD-25) |
| 3 | Duplicate doors | 4 | 4 | Brand "All fonts ›" now reuses the Inspector's font panel (better), but type styles ×2 pages, presets ×2, 3 font homes, 2 save models remain |
| 4 | Scope leakage | 5 | **4** | ⌘Z inside Brand undoes hidden canvas work (BRD-24); Update everywhere still saves site-wide instantly |
| 5 | Discoverability | 6 | **7** | Inspector picker visible; bound chip, Issues row and Brand-checks "Open" all deep-link to the token. ⌘K still one generic "Open Brand"; "color"/"primary" find nothing |
| 6 | Information scent | 3 | 3 | "Used by" counts real var bindings now, but review says "6 places" for every change; nav labels drift from the board (BRD-28) |
| 7 | Bloat | 3 | 3 | Unchanged: 22 destinations, Z-index/Breakpoint/Grid/Imagery kinds, Tailwind export |
| 8 | Surface | 4 | **5** | Inspector colour popover above canvas (fixed), preview follows staged colour vars; but canvas still hidden and preview ≠ canvas ≠ export |
| 9 | Navigation | 5 | 5 | Settings → Brand ↗ → Back still lands on canvas; Component styles still ejects |
| 11 | Cognitive load | 3 | 3 | 19 colours (one more), 9 dark-variant "issues" (one more), 3 save verbs, double leave prompt |
| | **Overall** | **4.1** | **4.2** | One P0 fixed (BRD-01), one new P0 (BRD-23 published buttons) and one new P1 data-loss trap (BRD-24) |

## 2. Findings

### 2a. Baseline findings re-verified

Totals: **1 FIXED · 17 STILL TRUE · 3 CHANGED · 1 WORSE.**

| ID | Sev | Status | Fresh evidence (10-05) |
|---|---|---|---|
| BRD-01 | P0 | **FIXED** | Button › Fill swatch opens the colour popover at rect 851,541 280×351 (900) / 851,373 280×351 (732); `elementFromPoint` at top, centre, bottom-left = inside the popover ×3. "Use" on Primary wrote `background-color: var(--buildrick-design-color-primary)` → computed `rgb(185,28,28)`. 10, 11, 62 |
| BRD-02 | P0 | STILL TRUE | Starters › Notion Warm (staged): Colours 19 → 9, Fonts "0 roles · 0 active fonts", Spacing "0 tokens". Review: "Review 9 staged changes" listing 9 colour diffs only — the wiped heading font (Playfair Display, saved earlier) and 9 spacing tokens are not listed. Discarded with "Discard all". 41, 42-*, 43 |
| BRD-03 | P0 | CHANGED (partly better) | Preview now takes staged colour vars: primary staged `#B91C1C` → preview `:root` `#B91C1C` before Save (was: only after Apply). Still: canvas hidden by `fixed inset-0` overlay (z 50, 1440×900); staged `color-text #B91C1C` repainted the hidden canvas h2 `rgb(185,28,28)` but preview h2 stayed `rgb(0,0,0)`; staged heading font reached the hidden canvas (`"Playfair Display"`) but not the preview (Inter) until "Apply 1 change". 05, 17, 36 |
| BRD-04 | P1 | STILL TRUE (shape changed) | Before any edit: preview h2 `rgb(0,0,0)` vs canvas `rgb(51,65,85)`; preview button 24px tall, 0 padding, 0 radius vs canvas 40 / 16 / 8 (preview `--buildrick-design-btn-height-md` = empty). Button no longer browser-grey — it is blue but unshaped. 03 |
| BRD-05 | P0 (R1) | STILL TRUE | Add › Button `background-color: rgb(26,86,219)`, Link `color: rgb(26,86,219)`, Text `color: rgb(51,51,51)` — literals. After Primary → `#B91C1C` saved: button and link stay `rgb(26,86,219)`. Add › CTA block: section `background: rgb(26,86,219)`, inner button `color: rgb(26,86,219)`. Only the page root is bound (`var(--buildrick-design-color-page-background)`). 02, 08, 52 |
| BRD-06 | P1 | CHANGED | "Used by" now counts explicit `var()` bindings: color-primary "used 1× / 1 element" after binding the button; color-page-background "used 1×". Still "unused / 0 elements" for color-text and font-heading, which paint every heading. Count is stale after undo: binding undone (button style back to literal) yet color-primary still "used 1×". 16, 32, 61 |
| BRD-07 | P1 | STILL TRUE | Picker **Apply** (stages, footer "Unsaved brand changes") → footer **Save** → modal **Apply 1 change**. 05, 06 |
| BRD-08 | P1 | STILL TRUE | Back to canvas with a staged edit → "Discard brand changes?" → **Discard changes** → second dialog "Unsaved changes — You have unsaved brand changes. Switching away may discard some of them. Leave anyway / Keep editing" while toast says "1 change discarded". 18, 19 |
| BRD-09 | P1 | STILL TRUE | Styles = "Reusable · 26" (8 type styles + 18 button/card/form/link/badge presets); Fonts & type styles repeats the 8 type styles; Presets repeats the presets as 11 groups. `BrandWorkspace.tsx:22-28` header still says Styles is not a nav row; `:124` makes it one. 21, 22, 25 |
| BRD-10 | P1 | STILL TRUE | Component styles › Hero closes Brand and opens Add › Blocks (rows still say "Default appearance"). 23, 31 |
| BRD-11 | P1 | STILL TRUE | All 11 kinds (Radius … Imagery, 1–2 tokens each) only via the "Spacing ▾" select; nav keeps "Spacing" lit on every kind. 28, 56-* |
| BRD-12 | P1 | STILL TRUE (+1) | 19 colours: action = primary = brand-500 = `#1A56DB`; surface = background = slate-50; text = text-primary = slate-700; error = feedback-error = red-500. Inspector popover lists all 19 swatches (Brand 500, Slate 50, Slate 700, Red 500, Action, Surface, Text Primary, Feedback Error included). 01, 10 |
| BRD-13 | P2 | **WORSE** | Fresh site: Brand checks "9 issues" (was 8), all "No dark variant", now including `color-page-background` whose value is `transparent`. The same 9 sit in Issues › **This page** as "Warning · should fix" (Open issues: 14 on a 5-element page). 26, 53 |
| BRD-14 | P1 | STILL TRUE (now measured live) | Inspector › Edit Primary → `#047857` → "Update everywhere (1×)": one `sites.saveProject` POST, no review, toast only "Saved". ⌘Z on canvas reverts it (one step). 14, 15 |
| BRD-15 | P1 | CHANGED | Brand › Fonts › Heading › Change still offers only Inter / Geist Mono + "Manage site fonts ›" (Assets modal) + "All fonts ›". "All fonts ›" now opens the Inspector's own font panel (26 Google + 6 system, tabs) instead of a native dropdown — but beside a free-text field, and only after 6 clicks. Inspector Font row writes a literal family ("Playfair Display"), not the Heading/Body slot; its picker shows no Brand fonts section. 33–35, 49, 50 |
| BRD-16 | P2 | STILL TRUE | Starters list colours only ("#635BFF on #FFFFFF", "#5E6AD2 on #F4F5F8" = indigo family, "Linear Dark" on a light background); third-party brand names. 27 |
| BRD-17 | P2 | STILL TRUE | Colour mode › Dark sets `localStorage buildrik:colorMode=dark` and flips the canvas too (h2 → `rgb(226,232,240)`); export declares `:root` light values only. 55 |
| BRD-18 | P2 | STILL TRUE | Settings › Brand ↗ → Brand (Colours) → Back to canvas → canvas, not Settings. 46, 47 |
| BRD-19 | P2 | STILL TRUE (+) | ⌘K "font", "colour", "token", "brand" → one "Open Brand" landing on Colours; "color" (US spelling) and "primary" → "Nothing matches". 45 |
| BRD-20 | P2 | STILL TRUE | Styles / Component styles "✦ Generate with AI" rendered, `aria-disabled="true"`, click does nothing. 30 |
| BRD-21 | P2 | STILL TRUE | Import / export: "Dark strategy ▾ media-query", "Tailwind · theme.extend config · 10 dropped", "14 kinds · 57 tokens · 4 alias edges · 10 dark variants"; raw ids everywhere. (Pro-forced density not re-checked.) 29 |
| BRD-22 | P2 | STILL TRUE | Import / export is still a top-level nav row. 29 |

### 2b. New findings

| ID | Lens | Sev | Finding | Evidence |
|---|---|---|---|---|
| BRD-23 | 2, 8 | **P0** | **Exported (and by code-read, published) buttons lose their size, padding and radius.** Element defaults write `var(--buildrick-design-btn-*)`, but the export declares only the project's `designTokens` (19 colours, fonts, font sizes, 9 spacing) — `btn-*` live only in `DEFAULT_TOKENS` + editor `design.css`. Exported page: button height 24px, padding 0, radius 0; canvas 40px / 16px / 8px. The Brand preview shows the same broken button. | `export-1.html`: 0 declarations of `--buildrick-design-btn-height-md`; rendered 40; `engine/export/ExportHelpers.ts:95-108` `siteTokensCSS`; `themes/design-system/design.css:102`. Publish uses the same helper (R1 plan §1.5) — not measured |
| BRD-24 | 4, 11 | **P1** | **⌘Z inside Brand deletes canvas work you can't see.** With one staged edit, one ⌘Z discarded the edit **and** undid the last canvas action (13 → 9 elements; the CTA block vanished); a second ⌘Z removed another button. The canvas is covered, so nothing shows it; only "Redo" on canvas brought them back. | `w61`: staged `{sec:#B91C1C,n:13}` → ⌘Z `{sec:#64748B,n:9}` → ⌘Z `{n:8}`. 63, 64 |
| BRD-25 | 2, 6 | P1 | Add › Blocks footer says "Blocks use your Brand colours and fonts." CTA block inserts literal `rgb(26,86,219)`; it never follows Primary. | 51, 52; `blocks/blockPalette.ts` `BLOCK_COLORS.accent` |
| BRD-26 | 6, 11 | P1 | Review modal always says "Applying updates every element bound to these tokens — 6 places." — for Primary with "Used by 0 elements" and for the heading font alike. The number is not the token's usage. | 06 (primary), font review text in `w31` log |
| BRD-27 | 6 | P2 | Usage count stale after undo (see BRD-06). | 16 |
| BRD-28 | 6 | P2 | Nav labels drift from the current board `7315:80955`: board = Colours · Colour mode · Fonts & roles · Shared styles · Component defaults · CSS classes · Variant library · Brand checks · Starters · Spacing · Import / export (11, no "Styles"); live = Fonts & type styles · Styles · Component styles · Classes · Presets (+ Styles row the board marks "NOT IMPLEMENTED · G3-142"). | board-7315_80955.png vs 01 |
| BRD-29 | 11 | P2 | Import conflict card › **Cancel** raises an error toast "Import failed — Nothing was imported — the errors are listed in the card." | 67, 68 (toast text in `w68` log) |
| BRD-30 | 6 | P2 | Export labels its JSON "Design tokens format", but it is a bespoke array; a standard W3C/DTCG `{color:{primary:{$value,$type}}}` paste is refused ("Unrecognized format — expected token array or { schemaVersion, tokens }"). Round-trip of Buildrik's own JSON works and previews "57 valid · 1 ID collision" before applying. | 65–67 |
| BRD-31 | 8 | P2 | In the Inspector colour popover the bound token row has no selected state, and "Edit Primary" is `opacity: 0` until hover — the only way to the token from the Inspector is invisible. | 13; `w15` log (`opacity 0`) |
| BRD-32 | 8 | P2 | Colour mode's Light/Dark segmented control floats over the preview page (absolute, left 98px) on top of the page heading. | 20 |

## 3. Flows (a)–(f): steps from canvas, nothing open

| Task | 09-27 | 10-05 | §5 target | Today's path / traps |
|---|---|---|---|---|
| (a) Set primary | 8 | **8** | 3 | Brand · `color-primary` row (of 19, not `color-action`) · Change · hex · picker Apply · Save · Apply 1 change · Back. Then nothing inserted moves (BRD-05). Inspector shortcut = 5 (select · swatch · hover-reveal Edit Primary · hex · Update everywhere), instant save, only for an element already bound |
| (b) Set fonts | 7–10 | **8 / 10** | 3 | 8 for Inter or Geist Mono (Brand · Fonts · Heading · Change · pick · Save · Apply · Back); 10 for any other (…Change · All fonts › · Choose font family · pick…). Canvas repaints (measured `"Playfair Display"`); a Starter later wipes it (BRD-02) |
| (c) Apply starter | 5–6 | **5–6** | 3 | Brand · Starters · click (stages; preview shows it) · Save · Apply 9 changes · Back. Still wipes fonts + spacing silently |
| (d) See on canvas | impossible; +3 to leave | **impossible; +1 to leave (+3 with a staged edit)** | 0 | Preview follows staged colours but not text colour, unapplied fonts or button shape; Back with a staged edit = Back · Discard changes · Leave anyway |
| (e) Bind element to token | 3 → stuck | **3** | 2 | Select · swatch · Use. Works; chip "Jump to token" deep-links to the token in Brand (verified) |
| (f) Undo / revert | footer/toast/double prompt; ⌘Z on canvas | **⌘Z works on canvas; ⌘Z in Brand is dangerous** | ⌘Z | Canvas ⌘Z undid Update everywhere, the binding, and the Brand apply as three steps (measured). Inside Brand, ⌘Z drops the staged edit *and* hidden canvas work (BRD-24). Footer Discard + toast Undo; leave guard still double |

## 4. Doors, pages and side paths walked

| Path | Result |
|---|---|
| Rail "Brand" | Opens full page, Colours |
| `B` | Opens Brand (from canvas focus) |
| ⌘K | See BRD-19 |
| Settings "Brand ↗" (nav + Overview "Site" card) | Opens Colours; Back → canvas (BRD-18) |
| Inspector bound chip "Jump to token color-primary in Brand" | Opens Brand with `color-primary` selected ✓ |
| Inspector "Edit Primary" → Update everywhere / Only this element | Works; instant save (BRD-14); hidden until hover (BRD-31) |
| Issues › "Color token … missing darkValue" | Opens Brand on that token ✓ (noise: BRD-13) |
| Brand checks › Run checks / Open | Open → token on Colours ✓ |
| Every nav row (11) | All open inside Brand except Component styles rows (eject) — 20–29 |
| Hidden kinds (11) | All reachable only via Spacing ▾ — 56 |
| Import / export | Export copy/download present; import previews before apply ✓; BRD-29/30 |
| Inspector font family | Same 32-font panel as Brand's "All fonts ›"; writes literal; no Brand slots |
| Brand change repaints real canvas? | Yes for token-bound things (page root, heading font via `h1–h6{font-family}`, a button after manual binding); no for anything inserted (BRD-05) |
| Add-panel elements token-bound (R1)? | No — Button, Link, Text, Checkbox, CTA block literal |
| Published output (via Export site… › HTML, not Publish) | Heading font + body colour carried; button shape lost (BRD-23); light values only |

## 5. Board coverage (Figma `g4GzQFqzNYz5sosz1QtZXC`, page 4418:45431; 5 MCP calls: 3 `get_metadata`, 2 `get_screenshot`)

**Have boards** — section `4428:143803` "v3 · Phase 3 · Brand": Colours `7315:80955`, Colours · unsaved (dirty) `7842:194805`,
Colour mode `7316:80949`, Fonts & type styles `7316:81551`, Styles `7316:82153` (with "AUDIT · AN-22 · NOT IMPLEMENTED · G3-142"
`7578:195318`), Component styles `7316:82755`, Classes `7316:83357`, Presets `7316:83953` + Buttons / secondary / ghost details
(`7801:192998`, `7832:193464`, `7832:193729`), Brand checks `7316:84555`, Starters `7316:85139`, Import / export `4418:168885`,
STATES · v3 · Brand `4428:150081`. Overlays section `6771:61079`: Discard confirm `7317:80979`, Swatch picker `7318:80959`, Set dark
value `7318:80995`, Font picker `7318:81029`, Where the token is used `7318:81049`, token ⋯ `7318:81104`, draft tooltip `7318:81119`,
Edit item `7318:81125`, Generate with AI `7318:81146`, Spacing ⋯ `7783:192979`, Token kind menu `7832:193363`, plus the older Brand
overlays (rename / delete / in-use / token deleted / workspace theme / export-ready + copied toasts / dark-strategy menu / Brand
inspector font picker `4418:160610`). Inspector side: Fill picker `4428:142922`, Fill picker · Edit Primary `4428:142968`, Fill
picker · Advanced `6823:59790`, Inspector v4 board 33 `7995:209771`. Settings pointer `4418:128908`.

**No board** on the current page: the Spacing page itself; all 11 hidden-kind pages; the Review changes modal (only archived
`1172:4840` on 1:3); a starter's applied/preview state (archived `306:2186`); import parsed / conflict card (archived `306:2265`);
the live-preview empty-page note; the second leave dialog (should not exist); any "Update everywhere saved" feedback; Brand at 732.

**Compared** (by eye + text): Colours and Colours · dirty only. Layout grid matches (256 nav / 620 pane / 468 preview, footer bar);
nav labels drift (BRD-28); board has no "No brand set" banner state.

## 6. Top 5 problems by user pain

1. **Changing the brand doesn't change the site** (BRD-05, BRD-25). Buttons, links, text and blocks insert literal colours; the Add
   panel says the opposite. R1 is still a plan.
2. **You can't see what you're changing, and the three views disagree** (BRD-03, BRD-04, BRD-23). Canvas hidden; preview shows black
   headings and shapeless buttons; the exported page ships those shapeless buttons.
3. **Starters silently wipe fonts and spacing** (BRD-02) — review shows "9 changes" and none of the removals.
4. **⌘Z inside Brand deletes canvas work out of sight** (BRD-24).
5. **Two save models and a double leave prompt** (BRD-07, BRD-08, BRD-14): Apply → Save → Apply N changes in Brand; instant
   "Update everywhere" in the Inspector; Discard then "Leave anyway".

Honourable mention: noise — 19 colours with four duplicate sets (BRD-12) and 9 fake "should fix" issues on a fresh page (BRD-13).

## 7. NOT verified

- Multi-page **publish** output (blocked by design); BRD-23 is measured on single-file HTML export, publish by code-read only. ZIP export not opened.
- Inputs / textarea / select exported sizes (same `input-*` var pattern; not measured).
- 5 of 6 starters (only Notion Warm staged; never saved); starter Save + reload.
- AI with the flag on; Brand forcing Pro density (BRD-21 part).
- "Only this element", Unlink / Relink chip buttons; preset / class detail editing; Brand checks fixes other than Open.
- Templates (R6) colours; dark mode on published output beyond the export's `:root`.
- 1440×732 beyond Colours, the Brand picker (flips up, fits: 1109,314 282×411, Apply bottom 712) and the Inspector popover.
- Board compare beyond Colours / Colours dirty; no other board screenshot taken.
- Only the Home page of one blank scratch site; no collab; not the owner's sites.

**State left behind:** scratch site `cmutd20ny00086frk2nape8gx` keeps the 13 test elements (one button bound to Primary). Its Brand
was reverted to defaults (primary `#1A56DB`, heading Inter, re-verified after reload), but it now has saved `designTokens`, so the
"No brand set" banner no longer shows there. No other site touched; nothing published.
