# T7 — Design-system reality + engine/gap/bug traceability

Extractor T7 · 2026-10-18 · AUDIT ONLY (read-only on everything except this file).
Abbreviations: E = `packages/editor`, D = `E/docs/audit-and-design-2026-10-16`, P = `D/panels`, INV = `E/docs/editor-feature-inventory-2026-10-16.md`, PDB = `D/PRODUCT-DESIGN-BRIEF.md`, RIH = `D/REMAINING-IA-HANDOFF.md`, EVMS = `D/evidence/ia-final-2026-10-16/module-specifications.md`, FDDYN = `D/CMS-DYNAMIC-BINDING-DESIGN.md`, TOK = `E/src/themes/tokens.generated.css`, CUI = `E/src/editor/chrome-ui/`. Panel files cited by number (`00:65` = `P/00-SHARED-CONTRACTS.md:65`).

## Scope read

| File | Lines | How |
|---|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | 1–46 | full |
| `/DESIGN.md` (root) | 1–558 | full |
| INV | 1882–2275 | full (B1 components, B2 tokens, PART A/B/C, Not verified, Status counts) |
| TOK | 1–249 | every non-ramp `--bk-*` line (23–203) read; the 45 ramp values (`--bk-gray/blue/green/yellow/red/purple-*`) skipped — not used by DESIGN.md roles beyond what the role tokens map |
| CUI `index.ts` | full (comments stripped) | read |
| CUI `*.tsx` (53 files) | grep for state words (disabled/selected/hover/focus-visible/aria-*/error/loading/expanded) and size utilities on every file; excerpts read: `PanelFrame.tsx:24-31`, `RightPanel.tsx:14-22`, `Button.tsx:24-50`, `buttonTheme.ts:18-34`, `Row.tsx:48-66`, `PanelHeader.tsx:100-135,200`, `Icon.tsx:39-125`, `Tabs.tsx:46`, `TextField.tsx:45`, `textInputTheme.ts:64-69`, `Popover.tsx:44,342`, `tooltipTheme.ts:2-8`, `Tooltip.tsx:11`, `Drawer.tsx:33` | read-only |
| `P/00-SHARED-CONTRACTS.md` | 1–360 | full |
| RIH | 85–144 (NAV-02/03, GEO-01, NAV-04, CTRL-01–04) | full range |
| PDB | 305–330 (surface table), 585–600 (Inspector geometry), 700–755 (INS-D03…D08) | full ranges |
| `P/22-GLOBAL-STATES.md` | 56–215 | full range |
| `P/18-COMMAND-PALETTE-AND-HELP.md` | 135–200 | full range |
| `P/02-LEFT-RAIL.md` | 20–33, 72–140 | full ranges |
| All `P/*.md`, PDB, RIH, FDDYN, `IMPROVEMENT-PLAN.md`, `BATCH-01A.md`, EVMS | grep passes: (1) dimension/token grep (`--bk-`, `NNpx`, 28/32/…/1366 with geometry words) — 279 hit lines read; (2) type/radius/shadow/focus/motion/dark/WCAG/emoji grep — all hit lines read; (3) UI-pattern grep (21 patterns, counts + files); (4) Part 2 per-row keyword grep (≈195 queries, ≥2 synonyms each) with spot-reads of the cited lines | grep + spot-read |

**Skipped:** `AS-IS-REVIEW.html`, `BATCH-01A-REVIEW.html`, `workflow-sketch.html` (HTML renderings), `REPORT.md` (one grep hit only), `ARCHITECTURE-DECISION.md` (SUPERSEDED per brief), `evidence/*` PNG/JSON, `evidence/inspector-2026-10-16/*` (file-name grep only). Panels 01, 03–17, 19–21, 23–25, BKLG, REVIEW were **not read end-to-end** — only grep hits and cited lines. Coverage claims that rest on a grep miss are labelled OMITTED only after ≥2 synonyms.

---

## Design system inventory

### a) Foundations

| Category | What DESIGN.md says | What tokens actually define (TOK) | What panel docs specify | Gap / conflict |
|---|---|---|---|---|
| Colour palette | Flowbite gray + one accent `#1A56DB`; ramp values "ARE the live generated token" (DESIGN.md:153-157) | 45 ramp + 29 role tokens (INV:1946) | none (docs defer to tokens; PDB:737 "No palette/type-token edits are required") | **Value drift:** DESIGN `--bk-border-input/-strong #9CA3AF` (DESIGN.md:180-181) vs TOK `#868C97` (TOK:30-31); DESIGN `--bk-ink-muted #6B7280` (DESIGN.md:192, also A1.4 DESIGN.md:523) vs TOK `#6C7079` (TOK:34). DESIGN claims to be a transcription — it is stale |
| Semantic colours | success/warning/error triads; `--info` = accent (DESIGN.md:217-224) | 9 tokens (TOK:43-51); no `--bk-info` | tone pairs for banners: "error tint 1–3, warning 4–7, info 8–10" (22 §4.2); live dot green/grey/amber (01:233) | Panel 22 "info" tone has no token (DESIGN says info=accent; no tint/text pair defined for info banners). Amber for "Changes not published" (01:233) = warning used as non-status? acceptable (status). |
| Dark mode (chrome) | Light chrome only (DESIGN.md:107) | none — 0 dark rules (INV:1955) | Dark only for **customer** Brand tokens (09:34,79,99,111,118) | Consistent: chrome dark mode is not specified anywhere. Gap only if owner wants it (UNKNOWN) |
| Type scale | ui/11…ui/24 ramp; "Panel/drawer headers = 11/500 UPPERCASE ink-soft" (DESIGN.md:149) | sizes 11/12/13/14/16/20/24; leading 16/18/20/21/24/30/32 + 1.25/1.5 (TOK:142-174) | base 13, section title 14–16, workspace title 20 (RIH:95); site name 14/500 (01:84); crash title 16/600 (22:83); Inspector tabs 12 (PDB:743); rail label 11/500 (02:134) | **DESIGN.md internal conflict:** "ui/14 panel title (14/20, 600)" vs "Panel/drawer headers = 11/500 UPPERCASE" (same line 149). Code `PanelHeader` drawer size = 14/500 (`PanelHeader.tsx:128`). "Section title 14–16" (RIH:95) is a range, not a token. Leading 18/21/30 not in DESIGN ramp |
| Weights | cap 600, no 700 (DESIGN.md:149) | 400/500/600 (TOK:158-160) | 500/600 only where stated | Consistent |
| Line heights | per ramp step | 9 leading tokens | not specified in panels | Panels give sizes without line height (e.g. 01:84 14/500) |
| Spacing | 4px base; 2/4/8/12/16/24/32/48/64 (DESIGN.md:227-229) | adds 20/28/36/40 (TOK:55-67) | 12 padding / 8 gaps / 12 between fields (PDB:745); 24 gutter + 20 content padding (05:140); 16 splitter steps (03:153); 12 inset (RIH:102) | 20 used in 05:140 is a token but not in DESIGN scale. DESIGN scale stale vs TOK |
| Grid | "Grid-disciplined" (DESIGN.md:232) — no column grid defined | none | Add 2 col at 260–360 (03:124); Assets cells 120–160 auto-fill (08:127); Templates cards 226 + 16 gap (15:141); picker 2 col at 300 (19:191) | No layout grid / card-size tokens; each panel picks its own card width |
| Borders | hairline gray-200 default; medium/input/strong (DESIGN.md:175-182) | 4 tokens | none | Value drift above |
| Radius | sm4/md6/lg8/full (DESIGN.md:233); A1.3 panel chrome ≤4; form-atom tier lists `--buildrick-radius-*` sm4/md8/lg12/xl16 (DESIGN.md:512) | xs2/sm4/md6/lg8/xl12/2xl16/card12/full (TOK:71-78) | page frame radius 12 (05:140); nothing else | **DESIGN.md self-conflict:** form-atom tier (DESIGN.md:512) names a dead namespace and different values (md 8, lg 12) vs §Layout (md 6, lg 8). Panels specify no radius for popovers, sheets, task tray, cards |
| Elevation | 3 steps raised/drag/overlay (DESIGN.md:169-173); anti-slop #10 "Only modals get elevation shadow" (DESIGN.md:410); A1.2 lists `--buildrick-shadow-*` (DESIGN.md:519) | raised/drag/overlay/focus (TOK:178-181); z-index 10 steps (TOK:115-124) | none — overlays named (Inspector overlay ≤1366, task overlay, tray, sheet, banner slot, toast) without elevation or z level | **Conflict:** §Color assigns `drag` shadow to menus/popovers, anti-slop #10 allows shadow on modals only. A1.2 token list is a dead namespace. Panels never assign elevation/z to the new overlay types |
| Icons | inherit currentColor; Lucide; no emoji (DESIGN.md:119, 406) | icon xs12/sm16/md20/lg24 (TOK:99-102) | rail icon 20 (02:134); bind icon 24 slot (06:35); sketches use 🖥/📱, 🗄, ✦, 💬 (05:66, 06:18, 00:61) | Emoji glyphs in spec text/sketches (05:66 device segments; 06:18 "🗄 N bindings" chip) vs anti-slop #6; INV A4.6 already flags 🖥️📱 presets. No icon-size rule per control |
| Density | Compact; rows 28/32/48, "Never 40px" (DESIGN.md:356-362) | row-dense 28, row 32, row-nav 36, row-table 40, row-2line 52, row-tall 64, menu-item 30 (TOK:82-106) | controls min 32; resource list rows 40; dense tool rows 32 (Layers compact 28); compound 48 (RIH:95) | **Conflict:** GEO-01 40px resource rows (RIH:95; 07:69,84; 08:127; 13:63; 21:175) vs DESIGN "Never 40px". Layers 28 (DESIGN.md:358) vs Layers default 32 (04:133; SC-10 00:160) |
| Panel dims | Topbar 56, rail 60, drawer 280 all panels, inspector 300 (DESIGN.md:232,294,343) | rail 60, drawer 280, inspector 300, panel-right 300, nav 240, sidebar 256 (TOK:84-93) | see table (c) | Rail 56 vs 60; Add/Layers 284 (260–360) vs 280; resource nav 240 vs as-built 256; task 360 vs 300 — all declared "change via Figma" (RIH:95) but tokens not yet changed |
| Control dims | not stated (only A1.4 min 20 hit target, DESIGN.md:523) | control xs28/sm32/md36/lg40/xl44 (TOK:94-98) | min 32 (RIH:95); Undo/Redo 32×32 (05:87); Comments/Bell 32×32 (01:101,107); Preview 76×32 (01:113); **Site menu trigger 28×28** (01:125); Play 24×24 (19:191); row actions 24×24 (04:89) | 01:125 28×28 trigger violates GEO-01 "controls minimum 32". `TextField` h-9 (36) vs `TextInput` h-8 (32) in code — two input heights |
| Motion | 100/160/240 ms, house curve; A3 "100–150ms only; fade ≤150ms" (DESIGN.md:276, 542-543) | motion 100/160/240; 3 easings; 2 transitions (TOK:128-167) | palette 120 ms fade (18:227); preview card after 300 ms delay (03:124); pill pulse (16:174 implies one); banner slide (22:208) | **DESIGN.md self-conflict:** 160/240 tokens vs A3 cap 150. 120 ms (18:227) is off-token. A pulse on the Getting-started pill (16:174) is decorative motion vs "no decorative" (DESIGN.md:524) |
| Focus | accent border + soft 2px ring `rgba(26,86,219,.30)` (DESIGN.md:184); Decision log 2026-07-26 "2px accent with **no halo**" (DESIGN.md:438) | `--bk-shadow-focus`, ring width 2 / offset 2 (TOK:134-135,181) | "Focus ring 2px accent (existing)" (02:127); handle ring 2px (05:141); "visible focus" (PDB:743) | DESIGN §Borders vs Decision log contradict (halo vs no halo). Panels say "2px accent" without saying border+ring or offset |
| Selection | accent on "selection outlines and selected-row tint" (DESIGN.md:213); accent-subtle = "selected-row fill" (DESIGN.md:204); Content rule 5 "Selection … background accent-tint" (DESIGN.md:370); hover "accent-subtle or aqb-bg-subtle" (DESIGN.md:369) | accent-subtle #E1EFFE, accent-tint #EBF5FF | rail active = accent tint + 3px bar (02:94); remote selection 2px in person's tone, "my blue ring wins" (21:82) | **DESIGN.md self-conflict:** selected row = subtle (l.204) vs tint (l.370); hover may use the selection colour (l.369) → hover and selected indistinguishable; `--aqb-*` dead namespace |

### b) Components

States legend: D default · H hover · A active/pressed · F focus · S selected · Di disabled · E error · L loading · X expanded. "Code" = state words found in the CUI file; "Docs" = where a design doc defines the state.

| Component / pattern | In chrome-ui? | States defined (code / docs) | Where specified | Gap |
|---|---|---|---|---|
| Button (primary/secondary/ghost/link/danger) | Yes `Button.tsx` (wrapper) | Code: variant colours, `disabled:` (buttonTheme.ts:18-34). Docs: "disabled with reason" pattern (00:82, 00:293) | DESIGN.md:39 (accent hover/pressed); INV:1886 | No size scale in docs (button heights only ad hoc: 76×32, 32); no L state (spinner on Preview only, 01:113) |
| Icon button | Yes `IconButton` (Icon.tsx) 32 / sm 24 | Code: pressed, disabled, H, F | 01:101,107 (32×32, `aria-pressed`); 05:87 | 28×28 trigger (01:125) below the 32 min; no S/active spec beyond aria-pressed |
| Text input | Yes `TextInput` (h-8 32) + `TextField` (h-9 36) | Code TextField: E/invalid/Di; TextInput none in file (theme) | PDB INS-D04 (draft/invalid stays with message); CTRL-01 (RIH:130) | Two input components, two heights (INV:1889 overlap). Error visual not specified in DESIGN (only auth/onb) |
| Search | Yes `PanelSearch` | Code: none | 03:155 (32 field, sticky); SC-2 Esc clear→blur (00:29); 18 §5.8 `/` | No empty/no-match visual spec shared; per panel |
| Select | Yes `Select` (wrapper; bare-unit / bare-value themes) | Code: none in file | PDB INS-D04 enum rows | No states in docs |
| Checkbox / radio / toggle | flowbite re-exports | none in CUI | Mixed = indeterminate (PDB:713); 00:236 single-key toggle | No visual spec |
| Slider | Yes `Slider` + unused `RangeSlider` | Code: Di | "slider bounds are convenience only" (PDB:712) | Duplicate component (INV:1892); no states |
| Numeric / dimension | **No** chrome-ui primitive | — | PDB:712 (units, finite, signed/non-negative); 05:91 width field strict parsing, error draft | No shared numeric/unit control spec (scrub, unit menu, Mixed, invalid) |
| Tabs | Yes `Tabs` (h-8) | Code: S, Di, H, F | Inspector 4 equal tabs, 32 min, 12px text, 2×2 fallback (PDB:743); INS-D08 arrows | Covered for Inspector only |
| Segmented control | Only `BreakpointSwitcher` (h-6 w-8 cells) | Code: pressed/S/H/F | 05:66,139 segments 3×32 icon-only (3×72 with labels) | Doc 32-wide cells vs code 24h×32w; no generic segmented primitive |
| Tooltip | Yes `Tooltip` (wrapper), `HintTooltip`, `HelpTooltip` | dark bubble; owner lifted NO BLACK for tooltip (tooltipTheme.ts:8, decision #25) | 02:126 label+shortcut on hover **and focus** | 3 tooltip components (INV:1897). DESIGN.md:118 still says tooltips follow NO BLACK — contradicts code decision #25 |
| Popover / menu | Yes `Popover`, `Menu*` (min-w 180/200, h-8 items) | Code: S, Di, danger, checked, F | widths 240 Help (18:224), 260 site menu (01:44), 320 People (21:175), 360 status/"N more" (11:125, 22:205); clamp viewport−16/−24 | No popover width tokens; `menu-item` token 30 vs code h-8 (32) |
| Dialog / confirm | Yes `Modal`, `ModalParts`, `ConfirmDialog` (aria-busy, destructive, E) | Code: busy/destructive/error | Sizes 480 question / 720 conflict (22:62,205); 720/480/960 import/export (RIH:110); confirm only for SC-15 list (00:275-276) | **720 has no token** (TOK dialog 480/560/640/960; `ModalParts.tsx` literal 720/520/360). Two modal APIs (INV:1900) |
| Context menu | via `Popover`/`Menu` | keyboard submenus (INV C4.1) | SC-3 registry (00:39-66) | Content specified; visual (width, submenu, disabled-reason row) not |
| Accordion / collapsible section | **No** primitive (`SectionHeader` h-7 only) | — | Inspector section summary (PDB:745); Add group header 32 + chevron (03:156) | No shared section/accordion state spec (X state) |
| Tree row | `TreeRow` exists, **0 consumers** (INV:1920) | Code: aria-expanded | Layers row anatomy 04:84-89, ARIA 04:135 | Layers spec does not say to use TreeRow; dead primitive |
| Inspector controls | No dedicated set | — | PDB INS-D04 table, INS-D07 dims | Behavioural contract complete; no visual control spec |
| Colour picker | **Not in chrome-ui** (Brand `ColorPicker` elsewhere, 09:29) | — | PDB:715 local/shared colour; 09:99 Light/Dark pickers | No visual/state spec |
| Spacing (box model) | No | — | DESIGN.md:130 label Inter 11/500, values mono | Only the typography rule exists |
| Alignment | No | — | not found (grep "alignment" → PDB/IMP generic) | OMITTED |
| Layer controls (eye/lock) | No | — | 24×24 inside 28/32 row, overlay markers on hover (04:85-89); DESIGN A1.4 20px target (DESIGN.md:523) | Two different target sizes (20 vs 24) |
| Panel header | Yes `PanelHeader` sizes drawer 44 / panel 48 / column 44 (+`PanelBackRow` 36) | Code: pressed (expand) | DESIGN 44 + 3 variants 56/page/72 (DESIGN.md:235-239); task header 48 (12:60) | Task header 48 is not one of DESIGN's variants; code has it as `panel` size |
| Toolbar | Yes `Toolbar` | none | DESIGN 36 optional toolbar (DESIGN.md:323); canvas toolbar 44h, two rows 88h <720 (RIH:116) | 36 vs 44 toolbar heights |
| Toast | Yes `Toast` (w 460) | Code: E, H, F | 22 §5.10 (counts, durations, position, live pipe); 00:186 Undo ≥8 s | Covered behaviourally; tone visuals implied |
| Empty state | Yes `EmptyState` (max 34ch) | none | DESIGN rule 6 (13 title / 12 body / one action) (DESIGN.md:371); CTRL-02 distinct empty/no-match/failed (RIH:134) | Panels name states; few give copy+layout |
| Loading / skeleton | Yes `SkeletonBlock/ListItem/StudioSkeleton`, `Spinner` | Code: loading | one shell skeleton 56/rail/32 (22:96) | Per-panel skeleton shapes unspecified |
| Badge / chip | `Badge` (flowbite) + `Chip` | Chip: S, F | one Pro chip, purple ramp (23:91) | Duplicate pill components (INV:1893) |
| Rail item | `Rail/RailItem` (w-11 h-11) — **unused by live shell** (INV:1924) | Code: active, aria-current | 48×52 item, 56 rail (02:134) | Primitive 44×44 vs spec 48×52 |
| Row family | `Row` dense 28/default 32/header 44/stack 44/tall 56/comment ≥64 + 7 variants | Code: S, Di, invalid, H, F | rows 28/32/40/48 (RIH:95) | `Row` tall = 56 (`Row.tsx:63`) vs token `--bk-size-row-tall` 64 (TOK:86). No 40px Row size although GEO-01 needs it |
| Breadcrumb | Yes (h-6) | aria-current, H, F | canvas breadcrumbs, overflow keep first+last two (05:88) | — |
| Drawer / PanelFrame / RightPanel | Yes | — | widths in (c) | `RightPanel` wide = literal 360 ("no token yet", RightPanel.tsx:20); `PanelFrame` wide 360 literal; Drawer expand 320↔700 comment (PanelFrame.tsx:26) vs 280 token and SC-10 removal of 700 |
| Save status / status dot | `SaveStatus`, `StatusDot` (internal) | Code: E | SC-4 priority (00:69); bottom status max 280 (11:65) | Moves from topbar to bottom bar; primitive is topbar-shaped |
| Upgrade / plan | `UpgradeModal` | — | 480 dialog (23 §4.5) | — |

### c) Panel geometry (every stated value)

| Surface | Value(s) | Source | Conflict |
|---|---|---|---|
| Topbar | 56h | DESIGN.md:234; TOK:85; 01:170; RIH:99 | none |
| Rail | 60 | DESIGN.md:232; TOK:87; 22:27 (as-built skeleton) | **56** selected (02:133; RIH:100; 07:133 etc.) — token unchanged |
| Rail item | 48×52 | 02:134 | `Rail.tsx` 44×44 |
| Left drawer (all) | 280 | DESIGN.md:232,294,343; TOK:88; 02:23; 08:28; 11:28; 13:26 | **Add/Layers 284 / 260 / 360** (03:153; 04:133; RIH:101) |
| Drawer expand | 700 | 04:43; 11:28; 13:26; PanelFrame.tsx:26 ("320↔700") | Removed by BD-15 (00:195; 04:153) — 11:28 and 13:26 still list it as-is |
| Temporary Asset picker (left) | 284 | 06:36; RIH:104 | — |
| Inspector | 300 fixed | DESIGN.md:232; TOK:90; PDB:594,737; 12:30 | none; overlay ≤1366 + 12 inset = 312 (05:142; RIH:102) |
| Right task host | 360 / 320 / 420 | RIH:103; 12:84; 14:13; 17:177 | as-built 300 (12:30) ; `--bk-size-panel-right` 300 (TOK:89); PDB:313 says "Inspector 300 fixed; task 360" OK |
| Task overlay (1281–1366) | 360 + 12 inset (372) | 12:85; RIH:114 | — |
| Task sheet (≤1280) | min(560, available−24) | 12:86; RIH:103 | — |
| Task peek strip (≤1280) | 48 | 00:356 | Not in Panel 12 geometry |
| Resource local nav | 240 / 200 / 280 | RIH:106; 07:133; 08:126; 09:139; 10:116; 13:115; 15:141 | as-built Brand 256 (09:39), Settings 256 (10:30), Assets 256 (08:30); DESIGN `--bk-size-nav` 240, `--bk-size-sidebar` 256 |
| Resource detail | 320 / 300 / 400 | RIH:107; 07:49; 08:58; 13:51 | — |
| Workspace header | 56 min | 00:10; DESIGN.md:236; RIH:108 | Brand as-built 30 (09:39); Settings as-built 112 (10:30) |
| Form footer | 48 min | RIH:108; 10:116 | DESIGN panel footer 32 (DESIGN.md:325); TOK `--bk-size-footer` 32 and `--bk-size-panel-footer` 44; as-built Settings 44 (10:30) |
| Drawer header | 44 | DESIGN.md:235; TOK:84; 03:154; 04:63 | — |
| Task header / footer | 48 / 48 | 12:60,64; 14:60,79; 17:91 | not a DESIGN.md header variant (44/56/page/72) |
| Inspector header | 72 (DESIGN.md:238) | — | PDB:740 defines padding + rows (natural height), no 72 |
| Drawer search | 32 | 03:155; 04:133 | DESIGN toolbar 36 |
| Drawer footer | 32 | 04:74,133; 08:126 | — |
| Canvas toolbar | 44h; 88h two rows when column <720 | 05:66; RIH:116 | DESIGN toolbar 36 |
| Bottom bar | 32h | 11:124; 22:73,96; RIH:99 | as-built skeleton 24 (22:27,299); old tab bar 36 (11:126) |
| Bottom status | max 280; popover 360 | 11:65,125 | — |
| Pages manager sheet | 560 default / 720 max; h min(vh−48, work−24) | 11:73,125; RIH:111 | 560 = token dialog-md; 720 no token |
| Page settings | 720 max (was 560×520) | 11:89,125 | — |
| CMS record / component subview | 720–960 | 07:133; 13:115; RIH:109 | — |
| CMS preview column | 420 | 07:144 | — |
| Brand live preview | 360–520, default 468, fixed | 09:57,118,139 | "fixed width with min 360, no splitter" (09:118) vs "360–520" (09:57,139) — range or fixed? |
| Brand body title block | max 700 | 09:139 | — |
| Settings content | max 960; forms 720; stack <640 | 10:48,116 | — |
| Templates | header 56, nav 240, cards 226 + 16 | 15:50,141 | — |
| Command palette | 640w, top 48, max-h min(800, vh−96), input 48, rows 32 | 18:222 | 640 = token dialog-lg |
| Shortcuts sheet | 720w, header 56, max-h 80vh | 18:223; 02:79 | — |
| Help popover | 240w, rows 32 | 18:224; 16:92 | — |
| ⋯ site menu | 260 | 01:44 | — |
| Notification panel | ~360 NOT MEASURED | 01:41 | — |
| People popover | 320 × max(vh−24), rows 40 | 21:175 | — |
| Global banner | 40 min, full width | 22:205 | — |
| Full-screen state card | 480 | 22:62,205 | — |
| Dialogs (global) | 480 / 720 | 22:205 | — |
| Upgrade dialog | 480 | 23:106,277 | — |
| Asset picker dialog | 720 / 480 / 960 | 08:81; RIH:105 | — |
| Import/export dialog | 720 / 480 / 960; full sheet <528 vw | 13:98-99; RIH:110 | — |
| Toast | 460 max | 22:205; Toast.tsx | — |
| Getting-started pill | 32h; 32×32 at ≤1366; list max 360h | 16:85 | — |
| Client review | header 56 (phone 48), side 360, footer 64 | 17:52,177 | — |
| Add preview card / description | 320 / 264 | 03:124,160 | — |
| Source picker (Inspector) | 280w, opens left over canvas | 06:35 | — |
| Canvas frame | Desktop 1440; presets 1920/1440/1280/1024/768/375; custom 240–2560; gutter 24; radius 12 | 05:90-91,140; 00:261 | as-built Desktop 100% ≥1024; Preview 1320 (INV A4.5) |
| Assets library (as-built) | 256 / 1fr / 320, details hidden <1320 | 08:30 | target 240 nav |

---

## Traceability — INV lines 1970–2275

Coverage vocabulary per brief. "Doc" column cites the strongest addressing statement.

### PART A — Engine rules

| FID | Item | INV status | INV line | Design doc that addresses it | Coverage | Note |
|---|---|---|---|---|---|---|
| F-EN-A1.1 | Element type registry (55) | ✅🆕 | 1976 | SC-11 "69 types" (00:206); PDB BIC-01 "69 registered blocks" (PDB:221); Add "54 rows" (03:31) | CONFLICT | Docs say 69, Add says 54, code says 55 |
| F-EN-A1.2 | Types refined on load/paste | ✅🆕 | 1977 | none (grep refine / refineElementTypes / "real type") | OMITTED | Layers/Inspector may show a type different from stored — no doc says so |
| F-EN-A1.3 | Types that cannot have children | ✅ | 1978 | generic refusal "Can't go inside Heading — will add after it" (03:171) | PARTIAL | per-type list and video-accepts-children not reflected |
| F-EN-A1.4 | Restricted parents (gallery, product-grid) | ✅ | 1979 | 03:171 generic; 04:33 "invalid nesting (named error)" | PARTIAL | no copy for restricted-parent case |
| F-EN-A1.5 | HTML5 forbidden pairs | 🟡 | 1980 | 04:33; 03:171 | PARTIAL | error copy per pair not specified |
| F-EN-A1.6 | Drop depth limit 50 | ✅ | 1981 | none (grep nesting depth / Max depth / MAX_NESTING: only FDDYN D11 CMS reference) | OMITTED | overlay copy "Max depth reached" not designed |
| F-EN-A1.7 | Tree-audit depth messages | ❌ | 1982 | — | REMOVED-N/A | |
| F-EN-A1.8 | Lock gate | ✅🆕 | 1983 | SC-14 (00:269-271); 04 LY-14 | COVERED | |
| F-EN-A1.9 | Multi-delete confirmation | ✅🆕 | 1984 | SC-3 "Delete of one or many … never asks for confirmation" (00:65) | COVERED (Change) | Contradicts INV "Decision #17. Needs a confirm design" → T7-21 |
| F-EN-A1.10 | Page root protections | ✅ | 1985 | Esc at root (05:102,107); "Page root" noun (00:226); root move refused (04:33) | PARTIAL | not-deletable / excluded from ⌘A / arrow refusal not stated |
| F-EN-A2.1 | Undo depth 100 | ✅ | 1991 | 24:186, 24:310 (OD-U6) | COVERED | |
| F-EN-A2.2 | Coalesce 500 ms | ✅ | 1992 | 24:46 UN-03; 24:87 | COVERED | |
| F-EN-A2.3 | Checkpoint every 10 patches | ✅ | 1993 | 24:175 (checkpoint rows → dividers) | PARTIAL | interval not user-facing; label handled |
| F-EN-A2.4 | Undo/redo/restore autosaved | ✅ | 1994 | 24 UN-13 safety version (24:56) | PARTIAL | no doc states undo triggers a save / status |
| F-EN-A2.5 | Unrecorded change toast | ✅ | 1995 | 24:51, 24:167 | COVERED | |
| F-EN-A2.6 | Spurious undo step on load | ✅🆕 | 1996 | none | OMITTED | fixed; low design need |
| F-EN-A2.7 | Brand ⌘Z ignores read-only/full-page (bug) | 🐞 | 1997 | U-1 interim guard (00:128); 00:184; Brand Undo disabled when read-only (09:93) | COVERED | |
| F-EN-A2.8 | Version cap 50; named never pruned | ✅ | 1998 | History › Saves (12:37) | PARTIAL | cap / pruning not shown to user anywhere |
| F-EN-A2.9 | Time-Travel scrubber | ✅ | 1999 | dedicated area (05:128); key ⌃⇧T / Alt+Shift+T (00:248); viewer read-only (00:90) | COVERED | |
| F-EN-A3.1 | ⌘S save | ✅ | 2007 | 01:205; 11:91 | COVERED | |
| F-EN-A3.2 | ⌘Z undo | ✅ | 2008 | 05:87; SC-17 (00:287) | COVERED | |
| F-EN-A3.3 | ⌘⇧Z / ⌘Y redo | ✅ | 2009 | 05:87 | COVERED | |
| F-EN-A3.4 | ⌘P preview | ✅ | 2010 | 00:254 (+⌘↵ alias) | COVERED | |
| F-EN-A3.5 | ⌘K palette | ✅ | 2011 | 00:256; 18 §5.1 | COVERED | |
| F-EN-A3.6 | ⌘⇧P alias | ✅🆕 | 2012 | 00:256 | COVERED | |
| F-EN-A3.7 | ? and ⌘/ sheet | ✅🆕 | 2013 | 00:253; 18 §5.9 | COVERED | |
| F-EN-A3.8 | ⌘J AI | ✅ | 2014 | 00:252 | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.9 | I AI | ✅ | 2015 | 00:252, 00:340 | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.10 | ⌘, settings | ✅ | 2016 | 01:93,132 "⌃, / Ctrl+,"; 10:23 "⌃,/⌘," | PARTIAL | ⌃ vs ⌘ ambiguity under SC-12 platform mapping → T7-24 |
| F-EN-A3.11 | ⌘H history | ✅ | 2017 | 00:240 (removed; H only) | COVERED (Change) | |
| F-EN-A3.12 | C comment mode | 🔒 | 2018 | 01:101; OD-R1 agency_layer on for all (00:344) | COVERED | |
| F-EN-A3.13 | F6 / ⇧F6 | ✅ | 2019 | SC-5 (00:74-76) + ⌃` fallback | COVERED | |
| F-EN-A3.14 | Esc | ✅ | 2020 | SC-2 (00:19-37); 05:107 | COVERED | |
| F-EN-A3.15 | Panel letter keys | ✅ | 2021 | 00:236; 02:124 | COVERED (Change) | P → Pages manager; DESIGN.md:293,417 key lists stale → T7-10 |
| F-EN-A3.16 | ⇧A components | ✅ | 2022 | 02:124; 13:26 | COVERED | |
| F-EN-A3.17 | Delete / Backspace | ✅ | 2023 | 00:45,65 | COVERED | |
| F-EN-A3.18 | ⌘C/⌘X/⌘V | ✅ | 2024 | 00:46 | COVERED | |
| F-EN-A3.19 | ⌘⇧V paste HTML | ✅🆕 | 2025 | 00:249 (Canvas scope); 03:28 | COVERED | |
| F-EN-A3.20 | ⌘D duplicate | ✅ | 2026 | 00:44 | COVERED | |
| F-EN-A3.21 | ⌘G / ⌘⇧G | ✅ | 2027 | 00:49 | COVERED | |
| F-EN-A3.22 | ⌘⌥C / ⌘⌥V | ✅ | 2028 | 00:47 | COVERED | |
| F-EN-A3.23 | Arrange chords | ✅ | 2029 | 00:59, 00:247 (front/back → ⌘⌥]/[) | COVERED (Change) | |
| F-EN-A3.24 | ⌘A select all (root excluded) | ✅ | 2030 | 05:47 (as-is); 04:108 Layers Select all | PARTIAL | root exclusion not stated |
| F-EN-A3.25 | ⌘⇧E exporter | ✅ | 2031 | 01:133 "Export site…" kept | PARTIAL | chord not stated |
| F-EN-A3.26 | ⌘\ toggle inspector | ✅🆕 | 2032 | PDB:594,737 hide/reveal | PARTIAL | chord not stated |
| F-EN-A3.27 | ⌘⇧A AI | ✅ | 2033 | 00:252 | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A3.28 | ⌘⇧C component view | ❌ | 2034 | — | REMOVED-N/A | |
| F-EN-A3.29 | Tab / ⇧Tab cycling (bug BK-28) | 🐞 | 2035 | "Tab cycles elements" (05:47) vs "Tab from selection box enters handles" (05:109); flagged REV:77 | CONFLICT | correct scope of Tab from canvas-column controls not defined |
| F-EN-A3.30 | Arrow / Home / End navigation | ✅ | 2036 | 05:47; 04 tree keys (04:135) | COVERED | |
| F-EN-A3.31 | ⇧/⌘ + arrow nudge | ✅ | 2037 | 05:39 (positioned only; toast for in-flow) | COVERED | |
| F-EN-A3.32 | ⌥↑↓ reorder | ✅ | 2038 | 00:58; 05:39 | COVERED | |
| F-EN-A3.33 | ⇧F10 context menu | ✅ | 2039 | context menu kept (05:168) | PARTIAL | ⇧F10 keyboard door not named (grep ⇧F10 / Shift+F10: none) |
| F-EN-A3.34 | Zoom chords | ✅ | 2040 | 00:241-243; 05:92 | COVERED (Change) | ⇧0/⇧1/⇧2 |
| F-EN-A3.35 | View toggles chords | ✅ | 2041 | 00:244-246; 05:93 | COVERED (Change) | |
| F-EN-A3.36 | / or ⌘F focus Add search | ✅🆕 | 2042 | `/` (00:257; 18 §5.8) | PARTIAL | ⌘F alias silently dropped |
| F-EN-A3.37 | ⌘↵ post comment / run generate | ✅🆕 | 2043 | 17:68 (comment ⌘↵); 00:254 (⌘↵ = Preview alias) | COVERED | double meaning; scope rule (Field vs Global) must resolve → T7-25 |
| F-EN-A3.38 | ⌘K inside media library | ✅🆕 | 2044 | 00:170; 18 §5.8 | COVERED (Change) | |
| F-EN-A3.39 | Enter/Esc inline text | ✅ | 2045 | SC-2 step 1 (00:20); 05:107 | COVERED | |
| F-EN-A3.40 | No device chords | ✅ | 2046 | none | OMITTED | nothing to design; listed for completeness |
| F-EN-A3.41 | Global guard rules | ✅ | 2047 | SC-12 scopes (00:234); 02:124; 18:144 | COVERED | |
| F-EN-A4.1 | Breakpoint ranges | ✅ | 2053 | SC-13 (00:261) | COVERED | |
| F-EN-A4.2 | Legacy 991/575 | ❌ | 2054 | — | REMOVED-N/A | |
| F-EN-A4.3 | Device frames (Wide palette-only) | ✅ | 2055 | 05:90-91; 00:261 | COVERED (Change) | |
| F-EN-A4.4 | Breakpoint switcher hidden (UX-06) | 🐞 | 2056 | visible segments (05:66,93,160) | COVERED | |
| F-EN-A4.5 | Three Desktop widths | 🟡 | 2057 | SC-8 1440 (00:99); 05:90; 01:115 | COVERED | |
| F-EN-A4.6 | Emoji device presets | 🟡 | 2058 | sketch "[🖥 ▭ 📱]" device segments (05:66) | PARTIAL | no icon spec; sketch reproduces emoji → T7-14 |
| F-EN-A4.7 | Preview always Desktop (UX-11) | 🐞 | 2059 | SC-8 current breakpoint + width (00:99) | COVERED | |
| F-EN-A5.1 | Zoom 10–400 + presets | ✅ | 2065 | 05:92 | COVERED | |
| F-EN-A5.2 | Drag thresholds | ✅ | 2066 | Layers zones 30/40/30 (04:33) | PARTIAL | canvas drop feedback values not stated |
| F-EN-A5.3 | Marquee min 3 px | ✅ | 2067 | "marquee (5px …)" (05:34) | CONFLICT | doc as-is value disagrees with code → T7-26 |
| F-EN-A5.4 | Element size min/max | ✅ | 2068 | none | OMITTED | |
| F-EN-A5.5 | Canvas max 20000 | ✅ | 2069 | none | OMITTED | |
| F-EN-A5.6 | Components per project 100 | ✅ | 2070 | 00:117, 00:328 | COVERED | |
| F-EN-A5.7 | Slug history 100 | ✅ | 2071 | none (redirect offer only, 11:37) | OMITTED | |
| F-EN-A5.8 | Recents (8/3/12) | 🟡 | 2072 | Templates Recent (15:65); palette Recent ≤5 (18:297) | PARTIAL | Add 8 / icons 12 not stated |
| F-EN-A5.9 | Media upload limits | ✅ | 2073 | 08:34,91-92 | COVERED | |
| F-EN-A5.10 | Storage quota thresholds | ✅ | 2074 | quota bar (08:40,126); SC-20 quota (08:92) | PARTIAL | 80 % / 95 % warning states not specified |
| F-EN-A5.11 | Plan limits | ✅ | 2075 | SC-18 / SC-20 (00:293, 00:315) | COVERED | |
| F-EN-A5.12 | AI rate limit | ✅ | 2076 | 00:294 | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A5.13 | AI prompt payload | ✅🆕 | 2077 | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-A5.14 | API timeout/retries | ✅ | 2078 | none | OMITTED | not user-facing |
| F-EN-A6.1 | Single sanitizer | ✅ | 2084 | Paste HTML strip report + sanitized insert (03:40); PDB:714 | COVERED | |
| F-EN-A6.2 | URL schemes | ✅ | 2085 | PDB:714 "accepted URL … follows existing sanitization" | PARTIAL | rejection message not specified |
| F-EN-A6.3 | Session blob: URLs dropped | ✅🆕 | 2086 | FI-03 interim guard (00:135); 08:95 | COVERED | |
| F-EN-A6.4 | Head-code allowlist | ✅ | 2087 | code-field Esc (00:28); Custom code screen (10) | PARTIAL | stripped-tag feedback not designed |
| F-EN-A6.5 | Plain text purified server-side (bug) | 🐞 | 2088 | none | OMITTED | |
| F-EN-A6.6 | Form wiring loses attributes (bug) | 🐞 | 2089 | Behaviour › form after-submit (PDB:586; INS-D05 PDB:723) | PARTIAL | |
| F-EN-A7.1 | Autosave debounce 1 s | ✅ | 2095 | bottom status L4 (22:63) | PARTIAL | timing not user-facing |
| F-EN-A7.2 | Save retry backoff | ✅🆕 | 2096 | Reconnecting / Retry now (22 §5.3, §7) | COVERED | |
| F-EN-A7.3 | Failure toasts | ✅🟡 | 2097 | 22 §5.4, §7; SC-4 (00:69) | COVERED (Change) | persistent ones → banners |
| F-EN-A7.4 | Conflict state | 🟡 | 2098 | 22 §5.4 (720 dialog) | COVERED | |
| F-EN-A7.5 | Reload recovery | 🟡❌ | 2099 | 22 §7 Recovery offer; 22 §4.2 | COVERED | |
| F-EN-A7.6 | False exit prompt / "Not saving" | 🐞 | 2100 | exit guard risky variant (22 §5.2) | PARTIAL | false prompt on clean load not addressed |
| F-EN-A8.1 | Brand Light/Dark preview-only | ✅🆕 | 2106 | 09:34, 09:118 | COVERED | |
| F-EN-A8.2 | Settings plan locks | 🔒🟡 | 2107 | 00:304; 10:29; 23 PL-15 | COVERED | |
| F-EN-A8.3 | Upgrade modal triggers | 🔒 | 2108 | 23 §4.5 (480); one Pro chip (23:91) | COVERED (Change) | |

### PART B — Gap register

| FID | Item | INV status | INV line | Design doc | Coverage | Note |
|---|---|---|---|---|---|---|
| F-EN-B1 | Publish flow (flag) | 🚩 | 2116 | Panel 14 (whole); 16:82 | COVERED | PLANNED |
| F-EN-B2 | Real-time collaboration | 🚩 | 2117 | Panel 21; SC-9 MP-1…MP-12 (00:138-145) | COVERED | blocked by ⛔ MP-3/4/5 |
| F-EN-B3 | DS AI client | 🚩 | 2118 | 00:337 "Brand DS-AI entries" hidden | DEFERRED-BY-DECISION | SC-21 |
| F-EN-B4 | Brand "AI component styles" CTA | 🚩⏳ | 2119 | 00:337 | DEFERRED-BY-DECISION | not named individually |
| F-EN-B5 | Brand "From logo or URL" | 🚩 | 2120 | 09:33 (listed under AI) vs 20:26 ("Not AI … never labelled ✦") | CONFLICT | visible in this version or not? → T7-22 |
| F-EN-B6 | Export Vue / Next "Soon" | ⏳ | 2121 | Export dialog kept (01:133) | PARTIAL | "Soon" pills not addressed |
| F-EN-B7 | CMS import Sheets/Airtable | ⏳ | 2122 | 07:25, 07:63 | COVERED | label "Coming soon" vs "Planned" → consistency note |
| F-EN-B8 | CMS source dialog Sheets/Airtable rows | ⏳ | 2123 | 07:63 (collection ⋯ only); D8 live sources "Coming soon" (00:137) | PARTIAL | second surface not named |
| F-EN-B9 | Add-panel "Soon" rows | ⏳ | 2124 | disabled-reason rows (03:171) | PARTIAL | "Soon" tag pattern not specified |
| F-EN-B10 | IntegrationRow "COMING SOON" (unmounted) | ⏳ | 2125 | Integrations → dashboard door (10:29,32) | COVERED | primitive dead (INV:1940) |
| F-EN-B11 | Upload element hidden | ⏳ | 2126 | none (grep upload element / file input / multipart) | OMITTED | |
| F-EN-B12 | Comment C / Review panel gated | 🔒 | 2127 | OD-R1 (00:344); 01:101; SC-6 | COVERED | |
| F-EN-B13 | Custom code Pro | 🔒 | 2128 | 00:304; 10 | COVERED | |
| F-EN-B14 | Password protection Pro | 🔒 | 2129 | 00:304, 00:320; 10:26 | COVERED | |
| F-EN-B15 | Premium templates | 🔒 | 2130 | 00:353; 15:133 | COVERED | |
| F-EN-B16 | Settings "Upgrade" | 🔒 | 2131 | SC-18 (00:293); 23 | COVERED | |
| F-EN-B17 | Viewer disabled doors | 🟡 | 2132 | SC-6 matrix (00:78-91) | COVERED | |
| F-EN-B18 | Read-only view | ✅ | 2133 | OD-18-2 (00:345); 02 LR-09 | COVERED | |
| F-EN-B19 | Presence mock users | 🧪 | 2134 | "Demo" label (21:72) | COVERED | |
| F-EN-B20 | Agentation overlay | 🧪 | 2135 | none | OMITTED | dev-only; no design need |
| F-EN-B21 | Exit-reason instrumentation | 🧪 | 2136 | none | OMITTED | dev-only |
| F-EN-B22 | Dev console warnings | 🧪 | 2137 | none | OMITTED | dev-only; behaviour.tsx gap (missing get/setInteractions) not reflected in Panel 19 |
| F-EN-B23 | Preset binding row inert | ⏳ | 2138 | EVMS:519,565 | PARTIAL | not in any panel |
| F-EN-B24 | Brand Figma export row | ❌ | 2139 | — | REMOVED-N/A | |
| F-EN-B25 | Media "Trash" row | ❌ | 2140 | Assets Recently deleted 30 d (00:185) | REMOVED-N/A | revived as Recently deleted |
| F-EN-B26 | Brand unmounted pieces | ❌ | 2141 | — | REMOVED-N/A | |
| F-EN-B27 | Plugins | ❌ | 2142 | — | REMOVED-N/A | |
| F-EN-B28 | Snap-to-grid command | ❌ | 2143 | grid pane 1–100 kept (05:29,93) | REMOVED-N/A | |
| F-EN-B29 | Watch device | ❌ | 2144 | — | REMOVED-N/A | |
| F-EN-B30 | Wide device palette-only | 🟡 | 2145 | Wide 1920 preset in width field (05:91,160) | COVERED (Change) | |
| F-EN-B31 | Hover levels | 🟡 | 2146 | CV-09 hover, Alt parent chain, Alt+Shift box model (05:35) | PARTIAL | no level toggle door |
| F-EN-B32 | Forms submissions inbox | ✅🆕 | 2147 | SC-7 (00:95); 22 §5.11 | COVERED | |
| F-EN-B33 | Site/Page SEO arc | ⏳ | 2148 | reserved "SEO analysis · Planned" card (10:100) | PARTIAL | "detailed design is a separate task" |
| F-EN-B34 | Review v2 | ⏳ | 2149 | Panel 17; 00:174 | COVERED | |
| F-EN-B35 | Activity off-rail | ✅🆕 | 2150 | 00:83, 00:90; 12 | COVERED | |
| F-EN-B36 | CMS off-rail | 🟡 | 2151 | rail CMS → workspace (02:78); BD-05 (PDB:207) | COVERED (Change) | |
| F-EN-B37 | Purple gradients in templates | 🐞 | 2152 | none (grep purple / #667eea / gradient → only Pro chip 23:91) | OMITTED | needs owner call → T7-15 |
| F-EN-B38 | Onboarding progress key global | 🐞 | 2153 | seeding silent (16:86); dismissal per user (16:106) | PARTIAL | per-site progress not stated |

### PART C — Open known bugs ("COVERED" = a doc specifies the correct user-visible behaviour)

| FID | Item | INV status | INV line | Design doc | Coverage | Note |
|---|---|---|---|---|---|---|
| F-EN-C1.1 | L1-002 export drops own text with child | ✅ fixed | 2165 | none | OMITTED | |
| F-EN-C1.2 | L2-001 save page as template | ✅ fixed | 2166 | saved templates "Styles captured with it" (15:31,119-121) | PARTIAL | |
| F-EN-C1.3 | L3-002 insert lands on previous page | ✅ fixed | 2167 | target subtitle + stale-target message (03:195,208) | COVERED | |
| F-EN-C1.4 | L4-001 media drag wrote src onto section | ✅ fixed | 2168 | picker header names target (08:79) | PARTIAL | drag-to-canvas target not specified |
| F-EN-C2.1 | L1-001 click-insert inside heading | ✅ fixed | 2174 | 03:171 | COVERED | |
| F-EN-C2.2 | L1-003/L2-007 selection toolbar covers small elements | ✅ fixed | 2175 | 05:37,106 ("buttons unchanged") | PARTIAL | UX-07 crowding not addressed |
| F-EN-C2.3 | L1-004 Tablet resize wrote Desktop | ✅ fixed | 2176 | SC-13 cascade (00:262) | COVERED | |
| F-EN-C2.4 | L1-007 undo jumped to first page | ✅ fixed | 2177 | "Undo keeps the current page" (24:48) | COVERED | |
| F-EN-C2.5 | L2-002/L3-001 duplicate slug | ✅ fixed | 2178 | slug-taken on Restore (00:116) | PARTIAL | page-slug collision copy not specified |
| F-EN-C2.6 | L2-003 Layers Delete removed locked | ✅ fixed | 2179 | SC-14 (00:269) | COVERED | |
| F-EN-C2.7 | L2-004 Layers Delete removed instance child | ✅ fixed | 2180 | 04:34 (as-is Group refusal only) | PARTIAL | |
| F-EN-C2.8 | L2-005 instance overrides lost | ✅ fixed | 2181 | "retain supported overrides by identity" (PDB:727) | COVERED | |
| F-EN-C2.9 | L2-006 saved component nested in same instance | ✅ fixed | 2182 | none | OMITTED | |
| F-EN-C2.10 | L2-008 :hover not shown on canvas | ✅ fixed | 2183 | authored state preserved (12:56; PDB:570) | PARTIAL | canvas display of state not stated |
| F-EN-C2.11 | L2-009 Pro templates on Business | ✅ fixed | 2184 | effective-plan lock (00:353) | COVERED | |
| F-EN-C2.12 | L2-010 component delete undo | ✅ fixed | 2185 | 00:278; 13:83 | COVERED | |
| F-EN-C2.13 | L3-015 field-key rename stripped rich text | ✅ fixed | 2186 | none in P (EVMS:377 hit unverified) | OMITTED | UNKNOWN for EVMS |
| F-EN-C2.14 | L3-016 stale bound text | ✅ fixed | 2187 | FDDYN:344,355 | PARTIAL | empty-bound 0 px collapse "design call" unresolved |
| F-EN-C2.15 | L3-024 repeated field names | ✅ fixed | 2188 | none | OMITTED | |
| F-EN-C2.16 | L3-025 upload element | 🟡 hidden | 2189 | none | OMITTED | = B11 |
| F-EN-C2.17 | L4-002 library drag re-upload | ✅ fixed | 2190 | none | OMITTED | |
| F-EN-C2.18 | L4-003 replace kept old alt | ✅ fixed | 2191 | local alt override → Inspector (08:15) | PARTIAL | |
| F-EN-C2.19 | L4-018 token rename bindings | ✅ fixed | 2192 | Rename on card (09:99) | PARTIAL | rename-moves-bindings not stated |
| F-EN-C2.20 | L4-019 delete-and-replace token | ✅ fixed | 2193 | PDB:526 | PARTIAL | |
| F-EN-C2.21 | L4-020 token usage reset | ✅ fixed | 2194 | "Used by N" (09:99) | PARTIAL | persistence not stated |
| F-EN-C2.22 | L4-021 Light/Dark global | ✅ fixed | 2195 | session toggle (09:118) | COVERED | |
| F-EN-C2.23 | L4-022 contrast fix direction | ✅ fixed | 2196 | Issues Fix › (12:40) | PARTIAL | |
| F-EN-C2.24 | L4-033 missing alt error vs warning | ✅ fixed | 2197 | Missing alt = Tip (14:148) | COVERED | |
| F-EN-C2.25 | L4-034 issue selected invisible element | ✅ fixed | 2198 | jump to element (12:40); "Hidden everywhere" (00:265) | PARTIAL | |
| F-EN-C2.26 | L5-001 dev AI / Ollama | 🟡 | 2199 | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.27 | L5-002 element AI id only | ✅ fixed | 2200 | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.28 | L5-003 AI edits locked | ✅ fixed | 2201 | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.29 | L5-004 Undo all | ✅ fixed | 2202 | 00:294 "Undo this run's N changes" | DEFERRED-BY-DECISION | SC-21 (spec exists) |
| F-EN-C2.30 | L5-007 Stop still inserted | ✅ fixed | 2203 | — | DEFERRED-BY-DECISION | SC-21 |
| F-EN-C2.31 | L5-030 team comments before round | ✅ fixed | 2204 | Client/Team filter (17:160-162) | COVERED | |
| F-EN-C2.32 | L5-070 failed autosave retry | ✅ fixed | 2205 | 22 §5.3, §7 | COVERED | |
| F-EN-C2.33 | L5-074 contradictory recovery | ✅ fixed | 2206 | one surface per severity (22 §4.1) | COVERED | |
| F-EN-C2.34 | L5-075 Restore/Keep didn't save | ✅ fixed | 2207 | 22 §7 recovery offer | COVERED | |
| F-EN-C2.35 | FG-001 Review v2 | 🐞 open | 2208 | Panel 17 | COVERED | |
| F-EN-C2.36 | FG-002 two Review designs in Figma | 🐞 open | 2209 | Panel 17 is the single design | COVERED | Figma not updated (out of doc scope) |
| F-EN-C2.37 | FG-007 Page SEO | 🐞 open | 2210 | 11 PG-10 kept; 10:100 reserved card | PARTIAL | readability/keyphrase not designed |
| F-EN-C2.38 | FG-009 Site SEO | 🐞 open | 2211 | 10:100 | PARTIAL | |
| F-EN-C3.1 | UX-01 empty-page intro clips 1280×720 | ❓ | 2217 | empty canvas (16 §4.1; 05:122) | PARTIAL | no 1280×720 fit rule |
| F-EN-C3.2 | UX-04 page creation stacks modals | ❓ | 2218 | achievement non-modal toast (16:89); silent seeding (16:86) | PARTIAL | "one surface at a time" not stated |
| F-EN-C3.3 | UX-06 breakpoint hidden | 🐞 | 2219 | 05:93,160 | COVERED | |
| F-EN-C3.4 | UX-09 mobile font override missing in Preview | 🟡 | 2220 | SC-8 (00:99); width parity (05:198) | PARTIAL | content-rule parity not stated |
| F-EN-C3.5 | UX-10 line-height field vs render | 🟡 | 2221 | PDB:707 unitless preserved; Source/reset (PDB:714) | COVERED | |
| F-EN-C3.6 | UX-12 starter nav at 375 | 🐞 | 2222 | none | OMITTED | template content |
| F-EN-C3.7 | UX-22 full-page Settings not inert | 🐞 | 2223 | "Editor behind inert" (10:117); tray inert (12:87) | COVERED | |
| F-EN-C4.1 | IA-01 context submenus keyboard | ✅ fixed | 2229 | SC-3 menus (00:39) | PARTIAL | submenu keyboard not restated |
| F-EN-C4.2 | IA-07 full-page not focus isolation | 🐞 | 2230 | 10:117; RIH:87 | COVERED | |
| F-EN-C4.3 | IA-08 Preview not interaction runtime | 🐞 by design | 2231 | OD-I1 / IXD-3 (00:177; 19 §5.4) | COVERED | ⛔ IXD-3 |
| F-EN-C4.4 | IA-10 effective value + origin | 🟡 | 2232 | INS-D04 Source/reset (PDB:714) | COVERED | |
| F-EN-C4.5 | IA-14 richness > verified coverage | 🐞 process | 2233 | SC-16 VERIFIED gate (00:283) | PARTIAL | process, not UI |
| F-EN-C5.1 | BK-06 duplicate loses breakpoint/:state styles | 🐞 branch | 2239 | SC-13 cascade (00:262) | PARTIAL | duplicate/paste rule not stated |
| F-EN-C5.2 | BK-05 ⌘Z ignores gates | 🐞 branch | 2240 | U-1 (00:128) | COVERED | |
| F-EN-C5.3 | BK-11 save claims in-flight edits | 🐞 branch | 2241 | "Never Saved before the server receipt" (22 §5.3); SC-9 receipt | COVERED | |
| F-EN-C5.4 | BK-40/51 content rule differs canvas/Preview/export | 🐞 branch | 2242 | width parity (05:198) | PARTIAL | |
| F-EN-C5.5 | Live deploy recorded failed | 🐞 branch | 2243 | Publish outcomes (14 PB-12/13 as-is) | PARTIAL | |
| F-EN-C5.6 | Server authz by target site | 🐞 branch | 2244 | none in P (BKLG only) | OMITTED | security; no UI |
| F-EN-C5.7 | Load-time damage scan / repair | ⏳ branch | 2245 | none (grep damage / repair) | OMITTED | INV says "New Issues rows" — undesigned |

---

## Principle observations

| PID | Module/panel | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P10 | Whole shell | Specs name controls and sizes but defer all visual treatment to an outdated DESIGN.md; no hi-fi | Polish judged per implementer | PDB:737 "No palette/type-token edits are required" | NEEDS REVISION (spec relies on a DS doc with self-conflicts) |
| P11 | Headers | Five header heights (44 drawer, 48 task, 56 workspace, 72 inspector, 30/112 as-built) with different type sizes | Hierarchy between header kinds undefined | DESIGN.md:235-239; 12:60; PanelHeader.tsx:128-132 | NEEDS REVISION |
| P13 | Brand workspace | 56 + 240 + 468 + 96 leaves body ≈580; preview toggles below 1280 | Body squeezed; acknowledged | 09:120-121 | PASS-SPEC |
| P14 | Inspector | Explicit padding/gaps (12/8/12) | — | PDB:745 | PASS-SPEC |
| P15 | DS type | Panel header type contradicts itself (11/500 caps vs 14/600) and code (14/500) | Inconsistent header type across panels | DESIGN.md:149; PanelHeader.tsx:128 | NEEDS REVISION |
| P16 | Spacing | DESIGN scale lacks 20/28/36/40 tokens that exist and are used (05:140 padding 20) | Off-scale values look legitimate | DESIGN.md:229; TOK:55-67 | NEEDS REVISION |
| P17 | Grid | No column grid or card-width token; Add 120w cards, Assets 120–160, Templates 226 | Card grids diverge per area | 03:124; 08:127; 15:141 | NEEDS REVISION |
| P18 | Text contrast | ink-muted documented #6B7280 vs token #6C7079; DESIGN claims muted 3.7:1 "AA large" only | Muted text used for 11–12 px captions may fail 4.5:1 | DESIGN.md:192,416; TOK:34 | NEEDS REVISION (state contrast per token at body sizes) |
| P19 | Rows | 28/32/40/48/52/56/64 row heights in play | Uneven list rhythm between drawers and workspaces | RIH:95; TOK:82-106; Row.tsx:55-66 | NEEDS REVISION |
| P20 | Geometry | Same surface specified at two widths (rail 56/60, drawer 280/284, nav 240/256, task 300/360) | Implementers pick either | table (c) | BLOCKED until tokens regenerated or docs pick one |
| P31 | Status/labels | "Coming soon" vs "Planned" vs "Soon" for the same not-built state | Mixed signals | 07:25 vs 07:63; 10:100; INV B6/B9 | NEEDS REVISION |
| P35 | Components | Specs never name chrome-ui components for new UI (TreeRow, Row 40, segmented, numeric); 8 row variants, 3 tooltips, 2 modals, 2 inputs persist | Parallel components grow | INV:1930-1940; 04:84-89 | NEEDS REVISION |
| P36 | Tokens | New values (720 dialog, 360 task, 284 panel, 56 rail, 48 footer, 120 ms fade, popover widths) have no token; RIH says "change via Figma" but no token list is given | Hard-coded literals (already: RightPanel.tsx:20) | RIH:95; 18:227 | NEEDS REVISION |
| P39 | Accessibility | Good: disabled-with-reason focusable, single-key toggle 2.1.4, 200 % text growth, glyph+text tones, reduced motion | — | 02:127; 00:236; 22:205-208 | PASS-SPEC |
| P39 | Targets | 28×28 site-menu trigger; 24×24 row actions vs DESIGN 20 min; GEO-01 32 min | Contradictory minimums | 01:125; 04:89; DESIGN.md:523; RIH:95 | NEEDS REVISION |
| P39 | Focus | Focus ring defined two ways (halo vs no halo) | Inconsistent focus visibility | DESIGN.md:184 vs 438 | NEEDS REVISION |

## Contradictions & gaps

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T7-1 | contradiction | Rail 60 (DESIGN.md:232; TOK:87) | Rail 56 (02:133; RIH:100) | Major | Pick one; regenerate token via Figma before build; update DESIGN.md §Layout |
| T7-2 | contradiction | Drawer 280 "all six panels" (DESIGN.md:232,294) | Add/Layers 284 / 260–360 resizable (03:153; 04:133); other drawers removed (Assets, CMS, Components → workspaces) | Major | DESIGN.md §Layout must adopt GEO-01; add min/max tokens |
| T7-3 | contradiction | Inspector/right column 300 (DESIGN.md:232; TOK:89-90) | Task host 360 (320–420) in the same column (RIH:103; 12:84) | Major | Add a task-width token; DESIGN.md names both |
| T7-4 | contradiction | Row density "Never 40px" (DESIGN.md:362) | 40px resource rows (RIH:95; 07:69; 08:127; 13:63) | Major | Owner decides; if 40 stays, DESIGN.md Row Density adds a "resource list 40" row and `Row` gains a 40 size |
| T7-5 | contradiction | Layers rows 28 (DESIGN.md:358, 380) | Layers default 32, compact 28 (04:133; 00:160) | Minor | Update DESIGN.md |
| T7-6 | contradiction | DESIGN.md colour values are "the live generated token" (DESIGN.md:155) | border-input/strong #9CA3AF vs #868C97; ink-muted #6B7280 vs #6C7079 (TOK:30-34) | Major | Re-transcribe §Color from TOK; recompute contrast claims (DESIGN.md:416) |
| T7-7 | contradiction | Panel header 11/500 UPPERCASE (DESIGN.md:149) | ui/14 panel title 14/600 (same line); code 14/500 (PanelHeader.tsx:128) | Major | One header type spec per header kind |
| T7-8 | contradiction | Focus = accent border + soft 2px ring (DESIGN.md:184) | "2px accent with no halo" (DESIGN.md:438) | Minor | Mark decision-log row superseded |
| T7-9 | contradiction | Selected row = accent-subtle (DESIGN.md:204) | Selection = accent-tint; hover = accent-subtle (DESIGN.md:369-370) | Major | One hover token, one selected token; drop `--aqb-*` |
| T7-10 | stale | Shortcuts A/T/M/Z/P/⇧A/D/S/U/H (DESIGN.md:417); rail "Insert·Layers·Pages·Media·Content·Brand" (DESIGN.md:290-293) | SC-12 + 02:124 key set; rail Add·Layers·Assets·CMS·Brand + Help (RIH:100) | Major | Point DESIGN.md to SC-12 as shortcut SSOT |
| T7-11 | contradiction | Motion 160/240 ms tokens (DESIGN.md:276; TOK:128-130) | A3 "100–150 ms only; fade ≤150 ms" (DESIGN.md:542-543); palette 120 ms (18:227) | Minor | Retire A3 numbers or token values; use tokens in panels |
| T7-12 | contradiction | Anti-slop #10 "Only modals get elevation shadow" (DESIGN.md:410) | `drag` shadow for menus/popovers (DESIGN.md:171-172) | Minor | Align rule #10 with the 3-step scale |
| T7-13 | stale | Form-atom radius `--buildrick-radius-*` sm4/md8/lg12/xl16; shadow `--buildrick-shadow-*` (DESIGN.md:512,519) | TOK radius md6/lg8/xl12; shadows raised/drag/overlay | Minor | Rewrite Chrome Axioms with `--bk-*` |
| T7-14 | contradiction | No emoji as design elements (DESIGN.md:406) | Spec sketches/chips use 🖥 📱 🗄 (05:66; 06:18); INV A4.6 emoji presets | Minor | Replace with named Lucide icons in spec |
| T7-15 | missing | DESIGN bans purple (DESIGN.md:41) | Built-in templates ship purple gradients (INV B37); no doc decides | Minor | Owner call: customer output exempt or recolour |
| T7-16 | contradiction | Tooltips follow NO BLACK (DESIGN.md:118) | Owner lifted it for tooltips, decision #25 (tooltipTheme.ts:8; Tooltip.tsx:11) | Minor | Record decision #25 in DESIGN.md |
| T7-17 | stale | Closed 3-wrapper set TextInput/Select/Button (E/CLAUDE.md) | index.ts calls Tooltip "third member of the closed wrapper set" | Minor | Fix the comment or the manifest statement |
| T7-18 | contradiction | `--bk-size-row-tall` 64 (TOK:86) | `Row` tall = 56 "per board 8:29 — NOT 64" (Row.tsx:61-63) | Minor | Regenerate token or rename size |
| T7-19 | missing | Dialog tokens 480/560/640/960 (TOK:108-111) | 720 used for conflict, picker, import/export, page settings, sheet (22:62; RIH:105,110; 11:89; 18:223) | Major | Add 720 token or move to 640 |
| T7-20 | contradiction | GEO-01 controls minimum 32 (RIH:95) | Site menu trigger 28×28 (01:125); DESIGN A1.4 20 px min (DESIGN.md:523) | Minor | One minimum per control class |
| T7-21 | contradiction | INV A1.9 "Decision #17 … Needs a confirm design" (INV:1984) | SC-3: Delete never asks for confirmation (00:65) | Minor | SC-3 wins (R-1017); log that it overrides decision #17 |
| T7-22 | contradiction | Brand "From logo or URL" listed under AI (09:33) and SC-21 hides "Brand DS-AI entries" (00:337) | "Not AI … never labelled ✦" (20:26) | Major | State whether it ships this version (it shares `dsAi`) |
| T7-23 | ambiguity | Brand preview "360–520, default 468" (09:57,139) | "fixed width with min 360 (no splitter)" (09:118) | Minor | Choose range or fixed |
| T7-24 | ambiguity | ⌘, opens Settings (INV A3.10) | Panels print "⌃," (01:93,132,205); SC-12 maps ⌃ → Ctrl, not ⌘ | Minor | Add an SC-12 row for Site settings |
| T7-25 | ambiguity | ⌘↵ = Preview alias, Global (00:254) | ⌘↵ = Send comment (17:68), run Generate (INV A3.37) | Minor | SC-12 row stating Field scope wins |
| T7-26 | stale | Marquee "5px" (05:34) | Marquee min 3 px; drag start 5 px (INV A5.2-A5.3) | Minor | Correct as-is row |
| T7-27 | contradiction | Drawer expand 700 removed (00:195; 04:153) | As-is rows still list "(widens to 700)" / "(expand 700)" (11:28; 13:26); PanelFrame.tsx:26 comment "320↔700" | Minor | Label as-is rows "removed under BD-15" |
| T7-28 | missing | Header heights: DESIGN variants 44/56/page/72 (DESIGN.md:235-239) | Task header 48 (12:60) not listed; Inspector 72 not restated in PDB:740 | Minor | Add task header as 4th named variant |
| T7-29 | missing | New overlay types (Inspector overlay, task overlay, tray, sheet, peek strip, banner slot) | No elevation or z-index level assigned in any doc; TOK has 10 z steps | Major | Map each overlay to `--bk-z-*` + shadow token |
| T7-30 | missing | Numeric/unit, colour picker, box-model, alignment controls | No chrome-ui primitive and no visual/state spec (PDB:712 is behaviour only) | Major | Add control specs before Inspector visual design |
| T7-31 | contradiction | SC-11 "69 types" (00:206) | Add "54 rows" (03:31); code 55 types (INV:1976) | Minor | Restate the number from code |
| T7-32 | missing | Engine limits users hit: depth 50, element size 10–10000, canvas 20000, slug history 100 | No doc gives refusal copy or state (A1.6, A5.4, A5.5, A5.7) | Minor | Add refusal rows to Panel 05 / 11 |
| T7-33 | missing | Footer heights 32 (DESIGN.md:325; TOK footer) | 44 (TOK panel-footer), 48 (RIH:108; 12:64) | Minor | Name footer variants |

## Consistency notes

- **Panel headers:** 44 drawer (03:154), 48 task (12:60), 56 workspace (00:10), 72 Inspector (DESIGN.md:238), Brand as-built 30, Settings as-built 112; code sizes 44/48/44 (+36 back row).
- **Back labels:** SC-1 single pattern "‹ Back to {origin}" (00:17) — panels comply where checked (15:64, 13:61).
- **Menus/popover widths:** 240 / 260 / 264 / 320 / 360, all literal; `Popover` min 180/200; token menu-item 30 vs code item h-8.
- **Modals:** 480 / 560 / 640 / 720 / 960; two modal APIs (Modal vs ModalParts, INV:1900).
- **Not-built labels:** "Coming soon" (07:25; 10:100; B4/B7/B8), "Planned" (07:63; 10:100 card title), "Soon" (B6/B9).
- **Empty/loading/error:** CTRL-02 (RIH:134) requires distinct states; Panels 08 (08:40) and 22 list them; Panels 03/04/13 list without layout. DESIGN rule 6 (typographic empty state) is the only visual rule.
- **Confirmations:** SC-15 exception list (00:275-276) vs as-is confirms still described in 04:34 (N>1), 11 (page delete), 15 (template create until T-4).
- **Undo:** toasts ≥8 s (00:186; 22 §5.10) consistent.
- **Shortcuts:** SC-12 is the SSOT; DESIGN.md:293 and :417 are stale; 02:124 restates letters.
- **Widths:** see table (c) — 6 surfaces carry two values (rail, drawer, nav, task, header, footer).
- **Pro marker:** one chip, purple ramp (23:91) — consistent with DESIGN.md:41 allowance.
- **Selection colour:** rail active tint + 3px bar (02:94); canvas blue ring (21:82); row selection colour not stated in any panel.

## Counts

| Measure | n |
|---|---|
| Foundations rows (a) | 18 |
| Component/pattern rows (b) | 33 |
| Geometry rows (c) | 49 |
| Traceability rows | 195 (A 96 · B 38 · C 61) |
| — COVERED (incl. "(Change)") | 95 |
| — PARTIAL | 52 |
| — OMITTED | 23 |
| — DEFERRED-BY-DECISION | 12 |
| — REMOVED-N/A | 9 |
| — CONFLICT | 4 (A1.1, A3.29, A5.3, B5) |
| Principle observations | 16 |
| Contradictions & gaps (T7-) | 33 (Critical 0 · Major 12 · Minor 21) |
