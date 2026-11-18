# DESIGN_SYSTEM_SPECIFICATION

Date 2026-10-18 · Status **PROPOSAL** — resolves the conflicts found in the audit into one value per decision. Rows marked **OWNER** change an approved rule (DESIGN.md, GEO-01 or a panel value) and need sign-off before Figma — CLAUDE.md requires explicit approval to deviate from DESIGN.md. Every such row is listed in §7.

## 1. Authority and how values change

| Layer | Source of truth | Rule |
|---|---|---|
| Chrome token values | `src/themes/tokens.generated.css` (generated from Figma variables, `gate:tokens-generated`) | Never hand-edit. New value → Figma variable → `node scripts/tokens/generate.mjs`. |
| Visual rules (how tokens are used) | root `DESIGN.md` | **Stale**: its colour table no longer matches the tokens and it contradicts itself in 4 places (§6). Must be re-synced to this spec once approved. |
| Geometry decisions | GEO-01 in `audit-and-design-2026-10-16/REMAINING-IA-HANDOFF.md` (approved BD-21) + panel docs | Newer than DESIGN.md §Layout; tokens not yet regenerated. |
| Components | `src/editor/chrome-ui/` (+ flowbite-react via its barrel) | One component per pattern (§4). |
| Customer-site tokens (Brand) | `src/editor/design-system/` | Separate domain. Never merged with chrome tokens. Dark mode exists **only** here. |

Light chrome only. No chrome dark theme is documented or requested (INV 1955, DESIGN.md:107); not designed here.

## 2. Foundations

### 2.1 Colour roles (existing tokens — no new hues)

| Role | Token | Value | Use |
|---|---|---|---|
| App background | `--bk-bg-app` | #F3F4F6 | canvas surround, area background |
| Panel | `--bk-bg-panel` / `--bk-bg-card` / `--bk-bg-elevated` | #FFFFFF | panels, cards, popovers, dialogs |
| Subtle fill | `--bk-bg-subtle` | #F3F4F6 | input fill, hover on neutral rows |
| Hairline | `--bk-border` | #E5E7EB | dividers, panel edges (non-essential, decorative) |
| Medium border | `--bk-border-medium` | #D1D5DB | card outline |
| Input / strong border | `--bk-border-input`, `--bk-border-strong` | #868C97 | **interactive control boundaries** (needs 3:1) |
| Text | `--bk-ink` / `--bk-ink-soft` / `--bk-ink-muted` / `--bk-ink-disabled` | #111827 / #4B5563 / #6C7079 / #D1D5DB | primary · secondary · captions/meta · disabled |
| Accent | `--bk-accent` (+ hover #1E429F, pressed #233876) | #1A56DB | the one CTA per view, selection outline, focus, links, active state |
| Accent fills | `--bk-accent-tint` #EBF5FF · `--bk-accent-subtle` #E1EFFE | | **tint = hover on accent-family items; subtle = selected** (§2.9) |
| Status | success / warning / error × {base, tint, text} | see tokens | status only, always with icon + text |
| Info | — (no token) | — | **Use neutral (ink-soft on bg-subtle) + info icon.** DESIGN.md "info = accent" makes info banners look like CTAs. Add `--bk-info-*` only if the owner wants a blue info tone (OWNER). |
| Pro / avatar identity | purple 50–800 | | Allowlisted for the Pro chip and avatar tones only (DESIGN.md §Color). Never accent, link, CTA, gradient. |

### 2.2 Contrast — measured from token values (WCAG 2.x formula)

| Foreground | on #FFF | on #F3F4F6 | on accent-tint | on accent-subtle (selected) | Verdict |
|---|---|---|---|---|---|
| ink | 17.74 | 16.12 | 16.08 | 15.19 | pass all |
| ink-soft | 7.56 | 6.87 | 6.85 | 6.47 | pass all |
| **ink-muted** | 4.96 | 4.51 | **4.499** | **4.25** | **fails 4.5:1 on accent-tint (hover on rail/tabs) and accent-subtle (selected).** Rule: on any accent-filled row (hover or selected), meta text switches to ink-soft. On #F3F4F6 it passes by 0.01 — no further dimming allowed |
| accent-text | 6.18 | 5.62 | 5.60 | 5.29 | pass |
| success-text / error-text / warning-text | 5.36 / 5.74 / 8.93 | ≥4.87 | ≥4.85 | ≥4.58 | pass |
| white on accent (primary button) | 6.18 | | | | pass |
| status text on own tint | success 4.75 · error 4.89 · warning 8.69 | | | | pass |
| **border-input** (control boundary, needs 3:1) | 3.38 | 3.07 | 3.06 | **2.89** | **fails on selected rows** — inputs inside a selected row need `--bk-ink-muted` border or no fill change |
| ink-disabled | 1.47 | | | | exempt (disabled), but **disabled-with-reason text must use ink-muted**, not ink-disabled |
| success / warning / error base (icons, dots) | 3.39 / 3.51 / 4.72 | ≥3.08 | | 2.90 / 3.01 / 4.04 | OK as non-text ≥3:1 on white/subtle; **success dot on selected row fails** → pair with text |

Corrections: DESIGN.md claims ink-muted is "#6B7280, AA large only" — the live token is #6C7079 and passes normal-text AA on white. Opacity-dimmed text (Layers "dim" rows at 50%) is banned: use ink-muted + italic or an icon instead (50% of ink-muted ≈ 2:1).

### 2.3 Type ramp (Inter; Geist Mono for values with `tabular-nums`)

One role per size. Replaces DESIGN.md's self-contradicting "panel header 11/500 caps" vs "14/600".

| Role | Size / line / weight | Token pair | Used for |
|---|---|---|---|
| Area title | 20 / 30 / 600 **(OWNER: DESIGN.md says 20/28; no leading-28 token exists)** | text-20, leading-30 | Settings, CMS, Brand, Templates, Components area headers |
| Dialog / L1 header | 16 / 24 / 600 | text-16, leading-24 | dialog titles, full-screen state cards, task title in sheet mode |
| Panel / task header (L2) | 14 / 20 / 600 | text-14, leading-20 | drawer (Add, Layers), right task host, Inspector element name |
| Section header (L3) | 12 / 16 / 600, sentence case | text-12, leading-16 | Inspector sections, menu groups, list group headers. **No uppercase** (drop 11/500 caps) — **OWNER** |
| Body / control | 13 / 20 / 400; labels 13 / 20 / 500 | text-13, leading-20 | default UI text, inputs, rows |
| Meta / caption | 12 / 16 / 400, ink-muted | text-12, leading-16 | row subtitles, helper text, counts |
| Micro label | 11 / 16 / 500 | text-11, leading-16 | rail labels, box-model labels, badges only |
| Values / numbers | Geist Mono 12 / 16, tabular | font-mono | numeric fields, sizes, W×H pill, version numbers |

Weights 400/500/600 only. Line heights 18/21/32 tokens stay unused by chrome (reserve for customer canvas).

### 2.4 Spacing

Scale = the token scale: **2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64**. DESIGN.md's shorter list is stale. Usage rules:

| Context | Value |
|---|---|
| Inside a control (icon ↔ label) | 4–8 |
| Between fields in a section | 8 (row gap), 12 between groups |
| Section padding (Inspector, drawers) | 12 |
| Area body outer padding | 24; 16 between groups; content max-width per area (Settings 960, forms 720) |
| Canvas gutter | 24 (P05) |
| Card grid gap | 16 (8 in 260–300 px panels) |

### 2.5 Radius, elevation, z-index

| Item | Radius | Shadow | z |
|---|---|---|---|
| Panel chrome (panels, headers, toolbars, rows, inspector sections, rail) | ≤ sm 4 — **founder decision G13 (2026-09-02): radius split by surface** | none | — |
| Form atoms (buttons, inputs, selects, chips) | lg 8 (founder 2026-07-29, Flowbite rounded-lg) | none | — |
| Cards, tiles, popovers, menus | lg 8 (overlay / form-atom tier, G13) | `--bk-shadow-drag` (menus/popovers) — **OWNER** (DESIGN.md anti-slop #10) | popover 40 |
| Dialogs (modals) | xl 12 (DESIGN.md:520) | `--bk-shadow-overlay` | modal 60 |
| Sheets, task overlay, Inspector overlay (≤1366) | lg 8 | `--bk-shadow-overlay` | overlay 50 (task/Inspector overlay, tray, sheet) · modal 60 (dialogs) |
| Page frame on canvas | xl 12 (P05) | raised | canvas 0 |
| Global banner slot | 0 | none | chrome 10 |
| Toast | md 6 | overlay | toast 80 |
| Command palette | lg 8 | overlay | cmdk 70 |
| Tooltip | sm 4 | none | tooltip 90 |
| Pills, avatars | full | none | — |

Resolves T7-29 (new overlay types had no z/elevation) and DESIGN.md's conflict "only modals get shadow" vs "drag shadow on menus": **menus and popovers do get `shadow-drag`** (they float over content; without it they read as inline). DESIGN.md anti-slop #10 to be reworded to "no decorative shadows".

### 2.6 Shell geometry — one value per surface

| Surface | Docs / GEO-01 (approved) | Tokens / DESIGN.md (as-built) | **Resolved** | Token action |
|---|---|---|---|---|
| Topbar | 56 | 56 | 56 | — |
| Rail | 56 | 60 | **56** (GEO-01; labels fit 48×52 items) | change `size-rail` 60→56 |
| Add / Layers drawer | 284 (260–360 resizable) | 280 fixed | **284, min 260, max 360** | change `size-drawer` 280→284; add `size-drawer-min` 260, `-max` 360 |
| Inspector | 300 fixed | 300 | 300; overlay ≤1366 = 300 + 12 inset | — |
| Right task host | 360 (320–420) | `panel-right` 300 | **360, min 320, max 420** | change `size-panel-right` 300→360 (hard-coded today in `RightPanel.tsx:20`); add min/max |
| Resource local nav | 240 (200–280) | `nav` 240, `sidebar` 256 | **240** | retire `size-sidebar` 256 after Brand/Settings/Assets move |
| Resource detail | 320 (300–400) | — | 320 | add `size-detail` |
| Area header | 56 | header 44 | **56** | add `size-area-header` 56 |
| Drawer header | 44 | 44 | 44 | — |
| Task header / footer | 48 / 48 | panel-footer 44 | **48 / 48** | change `size-panel-footer` 44→48 |
| Form footer (Settings) | 48 | 44 | 48 | same token |
| Drawer footer, bottom bar | 32 | footer 32 | 32 | — |
| Canvas toolbar | 44 (88 two-row <720) | DESIGN toolbar 36 | **44** | add `size-toolbar` 44 |
| Dialogs | 480 / 560 / 640 / **720** / 960 | 480/560/640/960 | add 720 | add `size-dialog-lg2` 720 (used by conflict, picker, import/export, page settings, shortcuts) |
| Popovers | 240 Help, 260 ⋯ menu, 320 People, 360 status | — | **three widths: 240, 280, 360** (⋯ menu 260→280; People 320→360) — **OWNER** (changes P01/P21 values) | add `size-popover-sm/md/lg` |
| Toast | 460 | code 460 | 460 max | add token |
| Brand preview | 360–520 default 468 vs "flex" (IAF-10 F) | — | **fixed 468, min 360, hidden <1280** (P09 §8 wins over IAF-10 F "flex") — **OWNER** | — |

### 2.7 Density and row heights

Five heights only (resolves 28/32/36/40/48/52/56/64 sprawl):

| Height | Token | Use |
|---|---|---|
| 28 | row-dense | Layers compact mode only |
| 32 | row | tool lists: Add items, Layers default, menus (**menu-item token 30 → 32** to match code), Inspector rows, palette rows |
| 40 | row-table | **resource lists with thumbnail**: Pages, Assets list view, CMS records, Components, People — **OWNER**: DESIGN.md says "Never 40px"; GEO-01 (approved later) uses 40. Recommend 40 for thumbnail rows only, and `Row` gains a 40 size. |
| 48 | — (two-line compact) | bound-field rows, comments compact |
| 52 → 56 | row-2line / `Row tall` | two-line with avatar; **pick 56** (code) and retire 52/64 mismatch |

Pages list: currently 32 in P11 although it is a resource list → **40** (consistent with rule).

### 2.8 Controls and targets

| Rule | Value |
|---|---|
| Default control height | 32 (control-sm). Inputs: **one height, 32** — retire `TextField` h-9 36 for chrome |
| Primary / dialog buttons | 32; 36 only in full-screen state cards |
| Icon buttons | 32 default; 24 **only inside rows**, with ≥8 px spacing to the next target (WCAG 2.5.8). Topbar ⋯ trigger 28 → 32; review pill 24 → 32; Exit 28 → 32 |
| Page strip tabs | 28 (no shrink to 24) |
| Box-model spacing spots | owner exception 16 px kept; document as 2.5.8 exception with keyboard path (fields) |
| Icons | Lucide, 16 in rows/controls, 20 in rail and toolbars; no emoji in UI or spec sketches |

### 2.9 Selection, hover, focus

| State | Treatment |
|---|---|
| Hover (neutral rows) | `--bk-bg-subtle` |
| Hover (accent-family: rail, tabs) | `--bk-accent-tint` |
| Selected (rows, tree, cards) | `--bk-accent-subtle` fill + ink text (meta → ink-soft, §2.2) |
| Active rail item | accent-tint + 3 px accent bar (P02) |
| Canvas selection | 1 px accent outline + 8 px handles (12 hit), tag in accent; hover outline 1 px accent at 50% (`alpha-accent-30` for fill hints) |
| Remote selection (collab) | 2 px in person's avatar tone; "my blue ring wins" (P21) |
| Focus (all interactive) | **Founder decision 2026-07-29 (latest):** accent border + `--bk-shadow-focus` soft 2 px ring rgba(26,86,219,.30). The 2026-07-26 "no halo" entry is superseded by it — not an open decision. |
| Disabled | ink-disabled text, no hover; **disabled-with-reason** stays focusable, reason in ink-muted |
| Mixed (multi-select) | field shows "Mixed" in ink-muted italic, checkbox indeterminate, colour swatch diagonal split |

### 2.10 Motion

| Token | ms | Use |
|---|---|---|
| fast | 100 | hover, press, focus, tooltip in |
| base | 160 | popover/menu open, row expand, toast in |
| slow | 240 | sheet/overlay/task host slide, banner slide |

**OWNER** (replaces DESIGN.md "≤150 ms only"). Easing `ease-default` for enter, `ease-in-out` for move. **No other durations** (palette 120 → 100; DESIGN.md "≤150 only" line replaced by this table). No decorative motion: drop the Getting-started pill pulse (P16). Every animation names its `prefers-reduced-motion` result (fade → instant; slide → fade 100).

### 2.11 Canvas overlay colours

| Overlay | Token |
|---|---|
| Selection, drop target, insertion line | accent |
| Box model (margin/border/padding/content) | existing `--bk-boxmodel-*` (already tokenised) |
| Snap / alignment guides | **new** `--bk-canvas-guide` (proposal: red-500 #F05252, matches builder convention) |
| Lock badge | warning-text on warning-tint |
| Clone (⌘-drag) badge | success-text on success-tint |
| CMS-bound badge | ink-soft on bg-subtle + database icon (not accent — accent is reserved for selection) |
| W×H pill | ink on bg-panel, mono 11 |
| Comment pins | accent (pins are the selection-like target of the Comments mode) |

DESIGN.md:213 limits accent to selection-like items; the as-built Drop-here pill, CMS badge, W×H pill and reorder grip use accent and must move to the above.

### 2.12 Token addition list (Figma → regenerate)

`size-rail` 56 · `size-drawer` 284 + min 260/max 360 · `size-panel-right` 360 + min 320/max 420 · `size-panel-footer` 48 · `size-area-header` 56 · `size-detail` 320 · `size-toolbar` 44 · `size-dialog` 720 · `size-popover-sm/md/lg` 240/280/360 · `size-toast` 460 · `size-menu-item` 32 · `canvas-guide` · optional `info-*` (OWNER).

## 3. Same function → same pattern (binding rules)

| Function | One pattern |
|---|---|
| Go back from an area/subview | `‹ Back to {origin}` in the 56/48 header, left slot (SC-1) |
| Leave with unsaved edits | **one** guard dialog: title "Leave without saving?" · Keep editing (default) · Discard changes · Save and leave (only where an explicit Save exists: Settings, CMS record, page settings) |
| Delete | Undo toast ≥8 s "{Name} deleted · Undo · Recently deleted ›"; confirm only for SC-15 exceptions (see CROSS_SCREEN_CONSISTENCY_AUDIT CS-01) |
| Permanent / irreversible | Typed confirm only for site delete, unpublish, transfer; plain confirm otherwise |
| Save state | Saving… · Saved · Couldn't save — Retry · Applies on next publish · Offline — will save when back |
| Not built yet | "Planned" (never "Coming soon"/"Soon") and only for planned items |
| Role refusal | "{Action} needs {Role} access" + Request access where it exists |
| Offline | "Needs a connection" on disabled controls; one polite announcement from P22 only |
| Empty | title 13/600 + one sentence 12 + one action (EmptyState) |
| No results | "No {items} match "{query}"" + Clear search |
| Load error | "Couldn't load {thing} — Retry" (server) vs "You're offline" (network) — never blame the connection for a server error |
| Notices under topbar | P22 banner slot only |

## 4. Component library — one component per pattern

States: D default · H hover · A active/pressed · F focus · S selected · Di disabled · E error · L loading · X expanded. "Spec" = this document defines it; "Gap" = must be designed before Figma screens use it.

| Pattern | Component (chrome-ui) | Sizes | States required | Status |
|---|---|---|---|---|
| Button | `Button` (primary / secondary / ghost / link / danger) | 32 (36 state cards) | D H A F Di **L** (spinner replaces icon, width kept, `aria-busy`) | Spec; L state new |
| Icon button | `IconButton` | 32, 24 in-row | D H A F Di S (`aria-pressed`) + tooltip with shortcut | Spec |
| Text input | `TextInput` (retire `TextField` h-9 for chrome) | 32 | D H F Di E (red border + message below, value kept) | Spec |
| Search | `PanelSearch` | 32, sticky | D F + clear ✕ when filled; Esc clears then blurs (SC-2); no-results row | Spec |
| Select / dropdown | `Select` | 32 | D H F Di E X | Spec |
| Checkbox / radio / toggle | flowbite re-exports | 16 box, 32 row | D H F Di S + indeterminate (Mixed) | Spec |
| Slider | `Slider` (remove unused `RangeSlider`) | 32 row | D H F Di | Spec |
| **Numeric + unit** | **none** | 32 | D H F Di E + scrub-on-label, ↑↓ ±1 / ⇧ ±10, unit menu converts value (INS-D11), Mixed, invalid draft kept | **Gap — design first** |
| Tabs | `Tabs` | 32 | D H F S Di | Spec |
| Segmented control | generalise `BreakpointSwitcher` | 28 inside 32 | D H F S (radiogroup) + **active label always visible** | Gap (generic) |
| Tooltip | `Tooltip` only (merge `HintTooltip`; `HelpTooltip` = ⓘ trigger using it) | — | shows on hover **and** focus, 100 ms | Consolidate |
| Popover / menu | `Popover`, `Menu*` | widths §2.6, items 32 | D H F S Di + danger + checked + submenu + **disabled-with-reason row** | Spec |
| Context menu | `Menu*` via SC-3 registry | 280 | groups in fixed order; type-context group on canvas | Gap: order + type group |
| Dialog / confirm | `Modal` + `ModalParts`, `ConfirmDialog` (one API) | 480 / 560 / 640 / 720 / 960 | D L (aria-busy) E; destructive variant; typed variant | Consolidate APIs |
| Accordion / section | **none** (`SectionHeader` h-7 only) | header 32 | D H F X + "· N set" count when collapsed | **Gap** |
| Tree row | `TreeRow` (0 consumers today) — Layers must use it | 28 / 32, indent 16 | D H F S Di X + drag over/between/inside + locked / inherited-lock / hidden / dim markers | Spec (bind Layers to it) |
| Inspector field row | **none** | 32; label column **88**, gap 8, control fill; stack label above when control needs >2 inputs (box model, gradient, shadow) | D H F E Mixed + override dot + source line | **Gap** (replaces BATCH-01A 96/8/164 and INS-D07 silence) |
| Colour picker | Brand `ColorPicker` → move/compose into chrome-ui | popover 280 | D F + token/local tabs, Mixed, contrast note | Gap |
| Box-model spacing | **none** | 16 spots (exception) | D H F + field fallback | Gap |
| Alignment control | **none** | 3×3 grid 28 cells | D H F S | Gap (OMITTED everywhere) |
| Layer controls (eye / lock) | `IconButton` 24 in-row | 24 + 8 spacing | D H F S | Spec |
| Panel header | `PanelHeader` drawer 44 / task 48 / area 56 | §2.6 | — | Spec (type per §2.3) |
| Toolbar | `Toolbar` | 44 canvas; 32 in-panel | roving focus | Spec |
| Toast | `Toast` | 460 | info / success / error; ≤1 transient + ≤2 persistent (P22) | Spec |
| Banner | — (P22 slot) | min 40 full width | info / warning / error, "N more ⌄" | Gap (component) |
| Empty state | `EmptyState` | max 34ch | — | Spec |
| Skeleton | `Skeleton*` | per list row height | L | Spec |
| Badge / chip | `Chip` (merge flowbite `Badge` use) | 20 / 24 | D S F | Consolidate |
| Rail item | `Rail/RailItem` → 48×52 | — | D H F S (`aria-current`) | Update primitive (44→48×52) |
| Row family | `Row` 28/32/40/48/56 | §2.7 | D H F S Di E | Add 40, fix tall 56 |
| Save status | `SaveStatus` → bottom-bar shape | max 280 | the five save states §3 | Update primitive |

## 5. Density by region

| Region | Density |
|---|---|
| Inspector, Layers, Add, menus | compact: 32 rows, 12 padding, 13 body |
| Resource areas (CMS, Assets, Components, Templates) | comfortable: 40 rows / cards, 24 padding |
| Settings forms | form: 32 controls, 12 between fields, 720 max |
| Dialogs and state cards | 16–24 padding, 16 titles |
| Client review page (external) | its own scale (phone targets ≥44) per P17 |

## 6. DESIGN.md corrections required (on approval)

1. §Color: re-transcribe from tokens (`border-input/strong` #868C97, `ink-muted` #6C7079) and replace contrast claims with §2.2.
2. §Typography line 149: delete "Panel/drawer headers = 11/500 UPPERCASE"; adopt §2.3.
3. Selection: one hover token, one selected token (§2.9); drop `--aqb-*`.
4. Focus: DESIGN.md §Borders (soft ring) is current per the 2026-07-29 entry; mark the 2026-07-26 "no halo" wording superseded.
5. Radius: keep G13's surface split; only rename the dead `--buildrick-radius-*` names in the form-atom tier to `--bk-radius-*`.
6. Motion: replace "≤150 ms" with §2.10.
7. Layout: rail 56, drawer 284, task 360, area header 56 (§2.6); Row density adds 40 (OWNER).
8. Shortcuts and rail list: point to SC-12 and P02 instead of restating (stale).
9. Tooltips: record decision #25 (dark tooltip allowed) — line 118 still says NO BLACK.
10. NO BLACK text rule (DESIGN.md:117 caps text at #334155) contradicts the live `--bk-ink` #111827 used everywhere. Record which one governs (5th self-contradiction).

## 7. Open owner decisions for the design system

| ID | Decision | Recommendation |
|---|---|---|
| DS-OD-1 | 40 px resource rows vs DESIGN.md "Never 40px" | Allow 40 for thumbnail rows only |
| DS-OD-2 | Blue info tone (`--bk-info-*`) or neutral info | Neutral |
| DS-OD-3 | Snap-guide colour | red-500 (builder convention) |
| DS-OD-4 | Brand starters named after real brands, two violet primaries (L4-028) and purple template gradients (B37) | Rename generically; recolour to pass banned-hue rule |
| DS-OD-6 | Shadows on menus/popovers vs anti-slop #10 "only modals" | Allow `shadow-drag` on floating menus |
| DS-OD-8 | Motion 100/160/240 tokens vs "≤150 ms" | Token set |
| DS-OD-9 | Header type: drop 11/500 caps; area title 20/30 | Adopt §2.3 |
| DS-OD-10 | Popover widths 240/280/360 (⋯ menu 260→280, People 320→360) | Adopt |
| DS-OD-11 | Brand preview fixed 468 vs IAF-10 F flex | P09 §8 fixed |
| DS-OD-12 | Ink colour: NO BLACK #334155 vs token #111827 | Keep token; reword rule |
