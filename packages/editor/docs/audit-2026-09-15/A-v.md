# Module A · Editor shell · Canvas · Inspector · Layers — visual-consistency / interaction-pattern / IA pass

File `g4GzQFqzNYz5sosz1QtZXC` · page **Editor v3 · IA** `4418:45431` · 2026-09-15 (second pass; builds on `A-shell-canvas-inspector-layers.md`, none of its F-1…F-19 fixes were undone).
Method: 4 archetype screenshots (Home `4418:81300`, Style tab `4428:141170`, Returning `4418:123152`, AI pending `4418:172567`), then a per-board chrome "signature" scan (topbar breadcrumb / save pill / publish, page tabs, canvas toolbar x-y-w-h + active chips, site page + selection outline + label pill, drawer panel + header component + row highlight, Inspector profile + header + tabs/applies-to/chip-strip/footer + control widths, status bar texts + sizes) over every 1440×900 board in the six sections + the two loose boards; 9 more judgement screenshots; reactions read raw. Screenshots in `A-vshots/` (before) and `A-vshots/AFTER-*.png`.

## 1. Scope

| Section | id | 1440×900 boards scanned | Notes |
|---|---|---|---|
| Edit and navigate · Editor shell | `4418:122213` | 33 (+ 9 smaller dialogs/cards read for anatomy) | 12 REFERENCE VARIANT + 1 ARCHIVE + 1 REFERENCE scanned, not fixed |
| Work on the page · Canvas | `4418:141767` | 0 (all REFERENCE sheets < 1440×900; read for names only) | nothing to fix |
| Edit selected elements · Inspector | `4418:107427` | 38 | REFERENCE VARIANT sheets (7) read for names only |
| Select and organise · Layers | `4418:79138` | 26 | incl. Home `4418:81300` |
| v3 · Phase 2 · Inspector | `4428:141169` | 6 (+ Fill picker 280-px overlays read) | |
| v3 · Phase 5 · Canvas | `4428:43691` | 6 | |
| Loose | — | `4418:172567` AI pending, `4418:81300` Home | |

Family values established (majority across the 109 scanned boards): topbar 56, breadcrumb 14 px `Site › Page › Panel`, save pill 22 high (hug width), Publish 81×32 `#1A56DB` (disabled = `#E5E7EB` @ 0.5), page tabs row y0 h36 with 28-px tabs (active `#F3F4F6`), canvas toolbar **x0 y740 760×72** (2 rows, wraps), device chips 34×28 (active `#F3F4F6`), site page 680×520 at (60,112), selection outline 2 px accent + label pill **86×20** `#1A56DB` 11 px, drawer `Panel header` = component `2100:10963` title "LAYERS" 14 px, Layers rows 28 high 13 px, selected row `#E1EFFE` (variant `State=selected`), Inspector header row 48 with "⬚ Section" 14 px, tabs Style/Settings/Effects 36, Applies-to row 32 with two chips, section headers 11 px, rows 32, controls 172 wide at x112, footer 40 with Beginner/Pro segment, status bar y868 h32 three 11-px texts.

## 2. Design-rule / consistency deviations found

| Node(s) | Rule / family value | Observed | Fixed? |
|---|---|---|---|
| Canvas toolbar on `4418:123152, 124730, 124938, 125919, 122932, 126653, 4428:140088` | x0 y740 760×72 | y715 (25 px higher); 800 wide on 123152/124730/124938/125919 | ✅ all → y740 760×72 |
| Canvas toolbar `4418:172629` (AI pending) | 760×72 wrapping | 760×40, `layoutSizingVertical FIXED`, clipped bottom row (zoom group cut) | ✅ WRAP + HUG → 760×72 |
| Canvas toolbar `4418:123620` (drawer closed, 1080-px canvas) | bottom flush with canvas (812) | 1080×40 at y715 | ✅ y772 |
| Layers `Panel header` on 20 Layers-section boards (`4418:79145, 79361, 79552, 79806, 80048, 80256, 80495, 80703, 80990, 81542, 81760, 81978, 82197, 82415, 82635, 82872, 83080, 83301, 83504, 83705, 83917, 84119, 84416`) | component `2100:10963`, title `ui/14 · panel title` "LAYERS" | old component `16:6` (3× `2100:10968`), title "Layers" 11 px unstyled | ✅ swapped + title "LAYERS" 14 (read back ×20) |
| Layers highlight on `4428:139921` (drop indicator), `4428:140088` (breakpoints) | selected row `#E1EFFE` = status bar element | no row highlighted while status bar / Inspector say Section · Hero | ✅ `4570:139632`, `4570:139661` State=selected |
| Layers panel on `4418:125919, 126318, 126485, 126653, 172567` | v3 `Panel — Layers` vocabulary (Page · Home / Section · Hero …) | generic html rows (body / section / container / heading-that-is-long …) with "heading-that-is-long" highlighted while status bar says Section · Hero | ✅ Home panel `4418:81305` cloned in (`4757:150137, 150164, 150191, 150237, 150252`), old panels hidden + renamed |
| Inspector profile on `4418:123152` (Returning = default landing), `4418:125919`, `4418:172567` | v3 profile (tabs + Applies-to + Beginner/Pro footer) | Clone-era three-chip strip (Element Selected ▾ / Breakpoint ▾ / State ▾), no tabs | ✅ Home profile `4418:81405` cloned in (`4762:55702, 55821, 55940`), old hidden + renamed |
| Inspector Fill row on `4418:126318, 126485, 126653` | swatch/hex = selected Hero fill (`#F3F4F6`, token-bound) | `#1A56DB` (blue) while Hero is grey | ✅ swatch paint copied from Home `4418:81480`, hex text set |
| Inspector Fill row on AI pending `4418:172567` | = canvas Hero fill | Hero `#FFF1DF` (AI-applied), Inspector `#F3F4F6` + token chip | ✅ `4762:56029` swatch `#FFF1DF`, hex `4762:56031`, binding chip `4762:56032` hidden (detached custom colour) |
| Breadcrumb on `4418:123152, 124730, 124938, 122932, 125919` | `Site › Page › Panel` ("Layers" when the Layers drawer is open, as on Home + all v3 boards) | "› Editor" | ✅ "Bella Cucina › Home › Layers" |
| Breadcrumb `4418:126059` VIEWER | `Site › Page › Panel` | "Bella Cucina › Home · Workspace viewer" (mode glued to the crumb) | ✅ "› Layers"; viewer cue already carried by `pill/in` "Viewer · cannot edit" |
| Breadcrumb `4418:172567` | `Site › Page › Panel` | "Bella Cucina › Home › AI › Hero" (4 segments) | ✅ "› Layers" |
| Exit dialogs `4418:125416`, `4418:125427` | modal 480–720 wide | 420 | ✅ 480 (foot rows FILL, buttons unchanged) |
| Conflict inline modal `4418:123137` + scrim `4418:123136` | radius 12, 480+, scrim `#111827` @ 0.5 | 440 wide, radius 8, scrim `#111827` @ 1.0 at read time | ✅ 480, r12, centred x480; scrim opacity 0.5 |
| Site menu popover `4418:126035` | menu/popover radius 8 + `elevation/popover` | frame radius 0 (white square corners behind the rounded rect), no effect | ✅ r8 + `elevation/popover`, clips |
| STATE · Inspector · no-selection `4418:111890` | empty Inspector ⇒ nothing selected everywhere | canvas Heading outlined + labelled, Layers Heading highlighted, status "Text · Heading · 396 × 30", crumb "› Text · Heading" | ✅ outline `4418:111946` cleared, label hidden, row `4418:111911` deselected, status "Page · Home · 4 sections" (matches hover board `4428:43692`), crumb "› Layers" |
| Status bar third slot, Heading family (28 boards in Inspector section: `4418:107674, 109376, 109525, 109686, 110025, 110182…115173`) | Hero family (≈80 boards): "Desktop · 100%" (breakpoint · zoom) | "Desktop · 992px" / "Wide · 1440px" / "Tablet · 768px" / "Mobile · 375px" (breakpoint · width) | ❌ not accidental — two semantics; owner decision A-1 |
| Inspector header, Heading-family profiles (`4418:107674` TEXT, `107916` MEDIA, `108108` BUTTON, `111145` FLEX, `111365` GRID, `111563` INPUT, `114017`, `114712`, `114966`) | row 48 "⬚ Section" 14 px | 48-row with a "Text"/"Media"/"Button" 12-px pill instead of a title | ❌ profile generation, not accidental — A-2 |
| Inspector FORM profile `4418:108302`, `108491` | v3 header row + tabs + Applies-to + footer | bare "⬚ Form" 12-px text, no tabs/chips/footer | ❌ generation — A-2 |
| Inspector control width 160 at x120 (label 96) on `4418:108695, 108916, 109146, 112166, 112330, 112556, 112784, 113006, 113785, 114523` | 172 at x112 (label 88) | Clone-era row anatomy | ❌ systematic per generation, listed |
| Inspector `4418:112556`, `113785` (breakpoint-override) | one header generation | v3 tabs **and** Clone-era chip strip on the same panel | ❌ listed |
| Layers row vocabulary: (a) v3 "Type · Name" on Home/Phase 2/Phase 5/shell CD boards (~30); (b) glyph + name "▤ Hero / □ Content / T Heading" on the 20 Layers-section boards + Heading-family boards (~45); (c) generic html names with only the selected row relabelled on the STATE · Inspector boards (~15) | one vocabulary; the selected element must read the same in Layers, canvas label, Inspector, status bar (all of which say "Section · Hero" / "Text · Heading") | three vocabularies | ❌ generation, not accidental — A-3 / X-6 |
| Menu row height: Site menu `4418:126035` rows 24 px / 280 wide vs canvas ⋯ menu `4428:143742` rows 30 px / 224 wide, pad 6 | one menu anatomy | two | ❌ listed (Templates/Pages menus not mine) |
| Dialog title/body sizes: Exit dialogs 13/11, Duplicate site 18/13, Move to page 24/14, Conflict 16/13, Replace Menu 15/12 | `ui/16 · heading` / `ui/13 · row label` | mixed | ❌ left to the concurrent dialog-anatomy pass (see §6 Blocked) |
| Empty About page `4428:44164` Layers | Page · About only | scanner flagged Home rows — false positive (rows 2–10 were already hidden) | — no visible change (hidden Hero row set to rest) |

## 3. Pattern / IA defects

| Screen | Task | Current pattern | Right pattern | Why | Fix status |
|---|---|---|---|---|---|
| Exit · Editor `4418:125151` (btn/exit on every shell, Exit guards "Leave anyway", Saving-before-leaving timer) | leave to the dashboard | NAVIGATE to a bare 560×216 card | real destination page with explicit "leaving the editor" treatment | a card floating on the prototype canvas reads as a broken screen; user cannot tell they left | ✅ converted in place (same id): 1440×900 page, `color/bg-app`, placeholder dashboard topbar `4762:55453` ("Buildrick › Your sites"), card `4762:55416` centred (dialog anatomy pad 24 / gap 16); "Back to the editor" → NAVIGATE Returning kept |
| Exit · Workspace `4418:124664` (Site menu Invite/Account/Site health ↗, Duplicate site modal) | leave to workspace settings | NAVIGATE to a 560-px card whose only link goes to **Site settings** (`4418:127313`) — not where the user came from | same page treatment; return = BACK | user arrived from the editor (Site menu) or a modal; "Back to Site settings" changes context | ✅ page + topbar `4762:55456` ("Buildrick › Workspace settings"); link `4418:124674` → `BACK`, label "← Back to where you were" |
| Site menu `4418:126034` (btn/more on every shell) | ≤ 8 actions on the site | 1440×900 transparent click-catcher containing a 280×320 popover at (1148,56), opened as OVERLAY | menu/popover | container is a legitimate click-outside technique (rect `4611:45013` → CLOSE, board-level NAVIGATE already removed last pass); anatomy was the defect | ✅ radius 8 + `elevation/popover` on the popover; row height 24 vs 30 listed |
| Site menu › Duplicate site `4418:127239` → "Duplicate site" | duplicate then leave | modal → NAVIGATE Exit · Workspace | modal → placeholder page | fine now that the destination is a page | ✅ via the page fix |
| S3.4 responsive-viewport `4418:126653` (chip/W and chip/T on ~40 boards in my sections) | switch canvas breakpoint | a Desktop board with a **second breakpoint bar** (Base/Desktop/Tablet/Mobile L/Mobile), dead chips, Fill `#1A56DB`, generic Layers, selection toolbar remnants | toolbar W/D/T/M is the only breakpoint control; T needs a real editor-at-width board (like `4428:140088` for M) | owner decision 2026-09-15 | ✅ converted in place into **`CURRENT DESIGN · Canvas · breakpoints · Tablet`** (id kept, so every existing chip/T already lands right): bar `4418:126673` hidden, site page `4418:126703` 768×520 at (16,112) — its own bar defined Tablet as 768–991 px —, width indicator "768px" `4418:126723` absolute at (340,638), status "768 × 250 · Tablet · 100%", chip/T active / chip/D rest, chip/D → Home, chip/M → `4428:140088`, chip/W → `4418:166009`, selection box + toolbar hidden, Fill `#F3F4F6`, v3 Layers panel, crumb "› Layers" |
| chip/W on Hero-selected shells | switch to Wide | → S3.4 (now Tablet) | Heading Wide board `4418:166009` (owner: "if the Heading-selected boards exist for W/T use them") | no Hero-family Wide board; cloning only if unavoidable | ✅ 12 chips in my v3 shells: `4418:81370, 4428:141240, 141476, 141712, 141948, 142520, 142756, 43762, 43998, 44234, 44470, 4570:139616` → `4418:166009` (transition kept). Remaining ~28 Layers-section + shell boards still → Tablet: X-2 |
| Shell state dialogs — Unsaved changes `4418:125416` / Offline `4418:125427` (modal, OVERLAY), Conflict `4418:123137` (inline modal), Save failed `4418:125144` (inline banner 760×88) | blocking decision vs non-blocking failure | modal for the two "must answer before leaving" states + conflict; banner for save-failed (retained draft, retry later) | same — modal = blocking, banner = non-blocking | consistent by intent; only anatomy differed | ✅ anatomy aligned (§2); scrim on OVERLAY dialogs is `overlayBackground NONE` file-wide (Replace Menu reference too) — listed, not changed |
| Motion editor chain (`4418:109376/109525/109686/110025`, 1440×900 boards opened as OVERLAY over the Effects tab; SWAP chain fixed last pass) | edit interactions beside the canvas | full boards as overlays whose right column is "Motion · list/edit/add" | drawer/panel-in-place (300 right) | what the user sees is the right pattern (panel replaces the Inspector); the overlay-of-a-full-board is a prototype mechanism | ✅ no change; Heading-context leak stays X-5 |
| Rail › Layers (rail instance child `…;4418:144842` on every shell) | open the Layers panel | NAVIGATE `4418:79139` "Organize layers": Clone-era tree (glyph rows, old header), Section · Hero not readable as such | land on a v3 Layers-panel shell (Home `4418:81300` is exactly that: crumb "› Layers", Hero selected, v3 rows) | mental model: every v3 shell already shows the v3 panel; the rail click swaps generations | ❌ reaction lives on the rail master `4418:144790` (LIBRARY) → **X-6**; header of `4418:79139` aligned meanwhile |
| Inspector empty state | nothing selected | `Inspector — 300 · nothing selected` on hover `4428:43692` + empty About `4428:44164` (status "Page · Home / About · n sections") ✅; STATE board `4418:111890` contradicted itself | same | — | ✅ `4418:111890` fixed (§2) |
| Applies-to chips | scope / state | present on every v3 board (Home, Phase 2, Layers/Inspector STATE boards); absent on Clone-era profiles (breakpoint-override, multi-select-with-context) | present | generation | listed (A-2) |
| Settings · Form `4428:141878`, Settings · Slider `4428:142450` | Settings tab for a form / slider | Layers + Inspector + status bar say Form · Reservation / Slider · Gallery; canvas has no form/slider and nothing outlined (stale "Section · Hero" label is hidden) | canvas shows the selected element | reached only from the STATES launcher (walkthrough) — spec boards | ❌ not changed: would need the form site page from `4418:108302` cloned in (Form) and an invented slider element (Slider) — A-4 |
| Hover-click → ⋯ menu, Start blank → Home, Publish on transitional states | — | unchanged from last pass | — | A-1…A-4 of the previous report still open | — |

## 4. Fixes applied (page `4418:45431`; every write read back in-call, all matched)

| # | Node(s) | Before → After | Read-back |
|---|---|---|---|
| V-1 | toolbars `4418:123214, 124792, 125000, 125981, 122994, 4428:140175` | y715 (800 or 760 wide) → y740 760×72 | 6/6 |
| V-2 | toolbar `4418:172629` | 760×40 FIXED → WRAP/HUG 760×72 | ✓ |
| V-3 | toolbar `4418:123620` | y715 → y772 (1080×40) | ✓ |
| V-4 | rows `4570:139632` (139921), `4570:139661` (140088) | State rest → selected, fill `#E1EFFE` | ✓ |
| V-5 | Drawer of `4418:125919, 126318, 126485, 126653, 172567` | old `Panel — Layers` hidden (renamed "… · HIDDEN 2026-09-15 (generic vocabulary; replaced by v3 panel clone)"); clones `4757:150137, 150164, 150191, 150237, 150252` appended (280×812, 10 rows, Home's 5 row reactions carried) | ✓ + screenshot |
| V-6 | Fill swatches `4418:126459, 126626, 126857` + hex texts in `4418:126460, 126627, 126858` | `#1A56DB` bound → Home's grey token paint, "#F3F4F6" | ✓ |
| V-7 | AI pending: old profile `4418:172675` hidden, clone `4762:55940`; Fill `4762:56029` `#FFF1DF`, hex `4762:56031`, chip `4762:56032` hidden; crumb `I4418:172568;4418:144992` "› Layers" | ✓ + screenshot |
| V-8 | Inspector of Returning `4418:123152` (old `4418:123258` hidden, clone `4762:55702`), Exit-saving `4418:125919` (clone `4762:55821`) | Clone-era strip → v3 profile (tabs, Applies-to, footer, Fill `#F3F4F6`) | ✓ + screenshot |
| V-9 | S3.4 `4418:126653` → Tablet board (see §3 row) — bar `4418:126673` H, site page 768 @ (16,112), indicator `4418:126723`, status texts, crumb, chips `4418:126747 W→166009 / 126749 D→81300 / 126751 T active / 126753 M→140088`, `4418:126718` + `126721` hidden, board renamed | ✓ (script landed on first attempt and re-ran; state read back) + screenshot `AFTER-tablet-126653.png` |
| V-10 | chip/W ×12 (ids in §3) | `4418:126653` → `4418:166009` | 12/12 |
| V-11 | Exit · Editor `4418:125151` | 560×216 card → 1440×900 page (`color/bg-app` VariableID:2:9), card `4762:55416`, topbar `4762:55453` (+ texts `4762:55454/55455` bound `ui/14 · panel title strong` / `ui/14 · body`, `color/ink` / `color/ink-soft`) | ✓ + screenshot; **merged with a concurrent edit** (another agent's `4762:55429` foot + `4762:55430` Button → Returning, title/body texts) |
| V-12 | Exit · Workspace `4418:124664` | same page treatment: card `4762:55427`, topbar `4762:55456`; link `4418:124674` "← Back to Site settings" → OVERLAY `4418:127313` ⇒ "← Back to where you were" → `BACK` | ✓ + screenshot `AFTER-exitworkspace-124664.png` |
| V-13 | `4418:125416`, `4418:125427` | 420 → 480 wide | ✓ |
| V-14 | Conflict modal `4418:123137` 440→480, r8→12, x500→480; scrim `4418:123136` → `#111827` @ 0.5 | ✓ |
| V-15 | Site menu popover `4418:126035` | r0/no effect → r8 + `elevation/popover` | ✓ |
| V-16 | Breadcrumbs `4418:123152, 124730, 124938, 122932, 125919, 126059` | "› Editor" / "· Workspace viewer" → "Bella Cucina › Home › Layers" | 6/6 |
| V-17 | `4418:111890` no-selection: `4418:111946` strokes cleared, label `4418:111940` hidden (+ hidden duplicates `4418:111939` stroke, `4418:111905` row also reset), row `4418:111911` Selected=false, status `4418:112016/112017` "Page · Home" / "4 sections", crumb "› Layers" | ✓ + screenshot |
| V-18 | 20 Layers-section `Panel header` instances (ids in §2) | `16:6` / `2100:10968` "Layers" 11 → `2100:10963` "LAYERS" 14 (instance swap; no reactions were on the old headers per D-29) | 20/20 + screenshot `AFTER-org-79139.png` |

Hidden, never deleted: `4418:125924, 126323, 126490, 126658, 172572` (old Layers panels), `4418:123258, 172675` + the un-named Exit-saving profile (old Inspectors), `4418:126673` (breakpoint bar), `4418:126718/126721` (demo selection remnants), `4418:111940` (label), `4762:56032`/`4418:172753` (binding chips).

## 5. Verification

- Read back: every node in §4 re-read in the same call after the write (reactions, visibility, characters, geometry, component ids, properties) — values match. Final cross-check call: both Exit pages 1440×900 with card + topbar visible, Home `chip/W → 4418:166009`, all five panel clones + Returning's profile clone visible in their drawers/columns, Returning toolbar y740 760×72, Workspace link `BACK`, Tablet board renamed.
- Screenshots (0.5, in `A-vshots/`): `AFTER-tablet-126653`, `AFTER-returning-123152`, `AFTER-org-79139`, `AFTER-exitworkspace-124664`; inline: S3.1 dragging `4418:126318`, AI pending `4418:172567`, Exit · Editor `4418:125151`, no-selection `4418:111890`.
- **UNVERIFIED (no prototype playback run):** (a) `BACK` from Exit · Workspace returning to the shell beneath the Site-menu overlay; (b) that chip/T on the ~28 untouched boards renders the Tablet board correctly at 100 % (geometry read back only); (c) W → Heading Wide → chip/D on that board lands on Home Heading Desktop, i.e. the Hero selection is lost on the round trip (owner accepted); (d) the cloned Layers/Inspector panels' carried reactions (rows → Heading board etc.) inside their new boards; (e) hidden old panels are excluded from the auto-layout drawers (read back: clones sit at 0,0 280×812).
- Three MCP calls timed out (≥300 s) while another agent was writing; each had landed and was read back before continuing.

## 6. Requests / blocked / ambiguities
Shell cwd was reset to /Users/shahg
## 6. Requests / blocked / ambiguities

### Ambiguities for the owner
- **A-1 · Status-bar third slot semantics.** Hero family "Desktop · 100%" (breakpoint · zoom) vs Heading family "Desktop · 992px" (breakpoint · width). Not accidental, so not batch-edited. Recommendation: keep the majority (`· 100%`; zoom is not shown anywhere else while width is now shown under the page as "768px"/"390px") and change the 28 Heading-family boards in my sections + the 4 Builder-completion Heading boards — 32 text edits, one batch.
- **A-2 · Inspector profile generations.** Heading-family TEXT/MEDIA/BUTTON/FLEX/GRID/INPUT profiles use a 12-px type pill as header (no "⬚ Type" title), 96/160 row anatomy; FORM profiles have no header row/tabs/Applies-to/footer at all; breakpoint-override boards carry both v3 tabs and the Clone-era chip strip. Decide the profile template (v3 Style/Settings/Effects + Applies-to is the master per the IA plan) — then it is a rebuild of ~15 profile boards, not a consistency fix.
- **A-3 · Layers vocabulary.** Three encodings coexist (Type · Name / glyph + name / generic html names). The rest of the UI (canvas label, status bar, breadcrumb, Inspector) speaks "Section · Hero", so Type · Name is the coherent choice; the 20 Layers-section boards carry state (filtered, renaming, locked, dimmed…) so they must be relabelled in place (~180 text edits) — batch, once decided.
- **A-4 · Settings · Form / Slider boards** (`4428:141878`, `142450`): borrow the form site page from `4418:108302` for Form; Slider has no canvas element anywhere — draw one, or retitle the board as a spec sheet.
- **A-5 · Exit · Editor vs Exit · Workspace card anatomy** now differ (Editor got a dialog-style title/body/button from the concurrent pass; Workspace keeps header-band + link). Both are pages now; pick one card anatomy (I suggest the dialog one) and apply to `4762:55427`.
- Still open from the previous report: A-1 hover-click → ⋯ menu, A-2 Start blank → Home, A-4 Publish on transitional states.

### Cross-module requests
- **X-2 (revised).** chip/T is now right everywhere it points at `4418:126653` (Tablet). Retarget **chip/W → `4418:166009`** on the remaining boards that still send W to `4418:126653`: 20 Layers-section boards (`4418:79220, 79427, 79665, 79887, 80115, 80354, 80562, 80849, 81165, 81616, 81834, 82053, 82272, 82491, 82709, 82939, 83160, 83363, 83564, 83776, 83978, 84208, 84510`) + shell CD boards + the ~300 page-wide (chip/M there still → Preview `4418:120075`, see previous X-2).
- **X-6 (new).** Rail master `4418:144790` › `rail/Layers` → `4418:81300` (Home, v3 Layers panel) instead of `4418:79139`; then wire Home's search field / rows to the Layers STATE boards (already partly true: search → filtered `4418:79355`).
- **X-7 (new).** `overlayBackground` is `NONE` on every OVERLAY dialog I read (Exit dialogs, Replace Menu reference, Move to page, Duplicate site) — the "scrim `#111827` @ 0.5" rule is met only by inline scrims. Set `overlayBackground = {type:'SOLID_COLOR', color #111827 @ 0.5}` + `overlayBackgroundInteraction = CLOSE_ON_CLICK_OUTSIDE` on the dialog boards file-wide (coordinator batch; touches other modules' dialogs).
- X-1, X-3, X-4, X-5 from the previous report unchanged.

### Variable requests
- None new (V-1…V-5 from the previous report still stand).

### Blocked / concurrency
- Another agent restructured `4418:125151` while I was converting it (their nodes `4762:55429/55430` and the title/body pulled to board level, board re-HUGged to 1440×270). I merged: their children moved into my card, page restored to 1440×900 centred, their Button keeps `NAVIGATE → 4418:123152`. Re-read at the end: stable. Dialog title/body text-style alignment (Exit dialogs 13/11, Duplicate site 18, Move to page 24) was therefore **left to that pass** to avoid double edits.
- A `get_parent` error on a Layers tree row inside `4418:111890` ("node 4762:5207 does not exist") showed the emoji → icon sweep running inside those rows; I avoided the row internals and used instance properties only.
- Masters on 🧩 Components / LIBRARY untouched; no new pages; no deletions.
