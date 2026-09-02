# BLOCKERS — what stops a design job

From `LEDGER.jsonl` (113 lines: coordinator 6, requirements 68, duplicates 27, verifier-brand 12) + `jobs.json`. One line per blocker; owner clears it; classes per PROTOCOL.md. `NN:line` = `docs/prd/editor/NN-*.md`. `D2` here ≠ jobs.json `D-02`.

## Counts

| class | blockers | jobs stopped |
|---|---|---|
| A | 10 | 26 |
| B | 9 | 16 |
| C | 8 | 20 |
| D | 13 | 15 |
| E | 6 | 29 (10 M-jobs ≈ 48 states) |
| F | 6 | 8 |
| G | 5 | 11 |
| H | 11 | 32 (10 shared with C1) |

Biggest three: **H3/C1** client sign-off on two pages (10 jobs) · **E6** shipped code with no board (10 M-jobs) · **H5** Backups vs Versions (7). Then G1 Templates, B8 unboarded Brand chrome, E5 (6 each).

## A · product cannot produce the state

- A1 · P2 · static catalogs drawn async; skeletons have 0 renders · stops: J-775:4053, J-781:4154, J-778:4102, J-774:4044 · owner: designer · evidence: 07:7; InsertStateBlocks.tsx:37,61 · fix: retire 4 boards, delete skeletons
- A2 · P2 · composer:ready precedes payload — canvas/Layers/Components skeletons never render · stops: J-65:412, J-778:4173, J-775:4130 · owner: product · evidence: 11:24-31 · fix: one payload-pending producer, or draw StudioSkeleton
- A3 · P2 · no autofix producer; only contrastFix.ts in the colour list · stops: J-154:2, J-164:42, J-164:57 · owner: product · evidence: LintSection.tsx:10; 11:177 · fix: 154:2 draws contrast fix; 164:42/57 → E
- A4 · P2 · local synchronous ops drawn with submitting/loading/error · stops: J-183:31, J-183:43, J-295:1989, J-295:1994 · owner: designer · evidence: 05:12; 14:41-43 · fix: retire 4 boards; strike 14:41
- A5 · P2 · no producer: Brand empty, Insert disabled-item, Compare restore · stops: J-1138:13376, J-138:198, J-169:60 · owner: designer · evidence: 06:68,89; catalog.ts:4; 11:129,239 · fix: retire 3 boards; strike 14:163
- A6 · P2 · Components error: setError only in initial-load catch · stops: J-781:4433 · owner: product · evidence: useComponentsState.ts:60,153 · fix: route IDB failure + title prop, or strike 14:189
- A7 · P2 · not-connected unreachable: canPublish tests callback presence · stops: J-784:4480 · owner: founder (parked — Vercel out of scope 08-25) · evidence: PublishTab.tsx:159 · fix: prePublishChecks on panel open when re-scoped
- A8 · P2 · activity log: 8 of 10 row types never recorded · stops: J-817:5114 · owner: product · evidence: activity_logs 96% site.settings.updated · fix: PRD row naming producers, or trim board to 2
- A9 · P2 · built, no door: font upload; AI-entry selection clear unlocated · stops: J-153:57, J-160:512 · owner: coordinator · evidence: FontManager.ts:291; 11:104 · fix: wire uploadFont; locate the clear
- A10 · P2 · fixture cannot reach: Pro tier (cards CUT), no published versions, would-mutate, shared fixture · stops: J-640:3488, J-949:4474, J-807:6694, J-1138:13394 · owner: coordinator · evidence: 14:517-519; jobs.json evidence strings · fix: LockedScreen half only; server-backed fixture per state

## B · feature SHAPE differs board vs code (product decision)

- B1 · P2 · Compare drawn 1080, mounted in the 280 drawer (~140px/pane) · stops: J-168:2, J-168:48 · owner: product · evidence: ReviewTab.tsx:517; ApprovedCompareView.tsx:149 · fix: recommend OverlayMount at 1080; list stays in-drawer
- B2 · P2 · AI transcript (board) vs prompt-in-input (code); no PRD transcript state · stops: J-170:29 · owner: product · evidence: 12:247-252 · fix: fix-figma unless product adds the state
- B3 · P2 · save-pill states: PRD 4 / board 5 / code 6 · stops: J-813:4836 · owner: product · evidence: 01:23; SaveStatus.tsx:18 · fix: pick N once; precedence favours code (6)
- B4 · P2 · 'bound' = property→token (PRD) vs element→preset (boards) · stops: J-306:2111, J-306:2136 · owner: product · evidence: 06:17; 14:308-310 · fix: define 'bound' once
- B5 · P2 · applying: 6 per-section phases vs 4 generic — both theater over one import · stops: J-642:2832 · owner: product · evidence: 07:29 · fix: one 'Applying…' state or real progress
- B6 · P2 · Layers empty unreachable: root row always seeded · stops: J-143:355 · owner: product · evidence: 04:7; census '1 layer' · fix: exclude root → 0 layers, else retire
- B7 · P2 · ⌘P preview has no device frame; board draws one · stops: J-807:8663 · owner: product · evidence: 04:13 DeviceFramePreview · fix: reuse it in overlay, or redraw frameless
- B8 · P1 · Brand chrome no board draws: Beginner/Pro toggle, first-load banner, 'More token kinds' + note, colour toolbar/group heads, 'unused' chip, stats + Preview card, 'Your saved components', clean-state footer, variant counts · stops: J-1333:7162, J-152:52, J-152:83, J-153:29, J-153:120, J-154:132 · owner: product · evidence: DesignSystemTab.tsx:627-632,764; TokensSection.tsx:395,496; ColorTokenList.tsx:316-345; ExportSection.tsx:311,328 · fix: board each or delete; mode toggle needs a home first
- B9 · P2 · add token: board draws a status pill on the list (333:2348), code opens a modal form · stops: J-306:2049 · owner: product · evidence: AddTokenModal.tsx:47-70; scrim z200 vs Gate 22 · fix: board the modal (→E) or inline add row + badge

## C · board contradicts board / prototype unwired

- C1 · P1 · client sign-off NEW ×10 in=0 out=0 (see H3) · stops: 10 Client sign-off jobs · owner: designer · evidence: flow-audit 09-02; 1339:7162 family · fix: wire the winning page's set
- C2 · P1 · scope chip: 170:2 idle omits it, 170:17 draws it; behaviour → code · stops: J-170:2 · owner: coordinator · evidence: 02:31,48; ScopeChip.tsx · fix: fix-figma add idle chip
- C3 · P2 · 144:7 band double-bordered; siblings 137:7/141:212 border inner box only · stops: J-144:2 · owner: coordinator · evidence: SlimLauncher.tsx:181 · fix: fix-figma strip stroke+radius on 144:7
- C4 · P2 · 164:22 filter-note position conflicts between boards · stops: J-164:22 · owner: designer · evidence: jobs.json 'BOARD-CONFLICT' · fix: pick one, redraw the other
- C5 · P2 · 169:92 re-send drawn in Compare; door is the Review panel · stops: J-169:92 · owner: designer · evidence: 11:259,310 · fix: re-point hotspot
- C6 · P2 · Brand roots 154:132 / 154:78 draw the SUPERSEDED shape (32px rows from y44, no preview) vs 1333:7162 (52px from y126 + preview) · stops: J-154:132, J-154:78 · owner: designer · evidence: verifier-brand 05:33:16Z, 05:36:53Z · fix: redraw both on the 1333:7162 root
- C7 · P2 · Brand board defects: 1334:7162 header 13/500 #111827 not a 16:6 instance (siblings 11/500 #4b5563); 152:147/154/161 rows 288 wide in a 280 frame; 152:83 foot rows act on no selected token; 153:2 ⋯ glyph with no menu; badge 333:2348 y59 overlaps crumb 306:2052 · stops: J-1333:7162, J-152:137, J-152:83, J-153:2, J-306:2049 · owner: coordinator (152:83: designer) · evidence: verifier-brand 05:33:16Z, 05:36:53Z · fix: swap header for 16:6; cards → 116; name the token; drop ⋯; badge → y84
- C8 · P3 · prototype: 784:4250→4326 no edge; 7 NEW boards orphaned, SUPERSEDED 152:2 has 35 edges; 66:441 duplicate AFTER_TIMEOUT; 0 BACK, 152 forward-only · stops: prototype walk · owner: designer · evidence: flow-audit 09-02 · fix: re-point edges after H4; add BACK

## D · board contradicts PRD / DESIGN.md, or asks the product to lie

- D1 · P1 · board tokens fail AA: ink-muted/bg-subtle 4.39, success/white 3.39; code matches board · stops: H-03, J-430:2348 · owner: designer · evidence: tokens.generated.css:70,79,88; board 430:2348 · fix: darken variables (≥#5F6673, ≥#057A55), regenerate; never raise baseline
- D2 · P1 · Templates drawer drawn at x=1120 · stops: J-807:4299 · owner: coordinator · evidence: DESIGN.md:231 · fix: fix-figma drawer at x=60
- D3 · P1 · template preview full-page; PRD says modal · stops: J-813:4489 · owner: coordinator · evidence: 14:177 · fix: fix-figma to modal
- D4 · P1 · new-page 3-way draws the CUT AI-draft path · stops: J-295:1972 · owner: coordinator · evidence: 14:73-83 · fix: redraw 2-way, or AI tile → onboarding (14:80)
- D5 · P1 · conflict modal 2 buttons; PRD walks Reload/Save backup/Overwrite · stops: J-66:640 · owner: coordinator · evidence: 01:26; 11:56-58 · fix: keep 3; attribution needs lastEditedBy (10:7) → E
- D6 · P1 · multi-select hides mixed fields; PRD shows 'Mixed' · stops: J-66:4 · owner: coordinator · evidence: 03:41 · fix: fix-figma show Mixed
- D7 · P1 · Link section on MEDIA profile; gate is link/button/cta · stops: J-807:8521 · owner: coordinator · evidence: 03:11; LinkSection.tsx:78 · fix: fix-figma remove, or extend gate + 03:11 together
- D8 · P1 · 171:67 promises one ⌘Z for 3 steps; PRD documents per-step + Undo all · stops: J-171:67 · owner: coordinator · evidence: 11:111-112; AgentPlan.tsx:29-32,226 · fix: fix-figma per-step copy; (b) outer txn needs 11:111 first
- D9 · P2 · 170:41 plan-level approve gate absent from FSM; 170:97 is per-step · stops: J-170:41 · owner: coordinator · evidence: 02:48 · fix: redraw per-step unless product adds the state
- D10 · P1 · model-picker board; tiering is flat by founder note · stops: J-1345:7162 · owner: designer · evidence: PRODUCT-OVERVIEW.md:115; AITab.tsx:46 · fix: retire; strike 02:31, 12:91
- D11 · P2 · cookie consent in General LEGAL card; PRD: Analytics · stops: J-638:2378 · owner: coordinator · evidence: 14:489,500 · fix: fix-figma
- D12 · P2 · copy that lies: 294:1976 'Your work is saved'; 807:7000 'Syncing…' from an online-only banner · stops: J-294:1976, J-807:7000 · owner: designer · evidence: jobs.json 807:7000 'syncing-claim-unbacked' · fix: redraw copy to the true state
- D13 · P2 · 153:152 'Drop .css or .json' — code accepts json/ts/js · stops: J-153:120 · owner: coordinator · evidence: ImportCard.tsx:267 accept · fix: fix-figma '.json or .ts'

## E · design-ahead — no code exists

- E1 · P2 · publish theater: perf audit ×4 + deploy pipeline draw a no-op · stops: J-817:4950, J-879:6896, J-879:6901, J-1157:4593, J-817:5220 · owner: product · evidence: 10:19 lighthouseScore null, DEPLOYING never written · fix: park; pipeline draws QUEUED→BUILDING→COMPLETED|FAILED only
- E2 · P2 · scheduled publish ×4 — no PRD row, router or job · stops: J-817:5262, J-878:4518, J-878:4543, J-1156:4593 · owner: product · evidence: grep 'schedul' PRD = PageStatus only (02:52) · fix: PRD row + cron producer first
- E3 · P1 · multiplayer presence/cursor boards for a demo-only feature · stops: J-642:3696, J-817:5195 · owner: product · evidence: PRODUCT-OVERVIEW.md:185; 05:63 · fix: park until OT/CRDT
- E4 · P2 · unbuilt detail: 641:2599 styled props + 'used on' (◆); 168:26 change highlights (code is an opacity blend) · stops: J-641:2599, J-168:26 · owner: designer · evidence: 14:188,192; ApprovedCompareView.tsx:99,222 · fix: redraw to built shape or mark E
- E5 · P2 · no PRD row/producer: 433:2391 migration modal, 813:4888 force-refresh, 807:6965 Review-both (CONFLICT carries no rival snapshot), 817:4899 a11y checker, 1339:7221 client conflict, 294:1992 retrying · stops: 6 · owner: product · evidence: 11:28,34; 10:7; 09:14 cites deleted files; 14:448,63 · fix: PRD row + producer first; strike 09:7,11-14, 12:152
- E6 · P3 · inverse — shipped code with no board, ~48 states · stops: M-01…M-10 · owner: designer · evidence: jobs.json missing-screen file:line list · fix: draw; M-10 first delete StructurePopover (14:533), wire-or-delete AIPromptModal (06:84)

## F · harness / tooling

- F1 · P2 · shell-default STATE LEAK run 3; measured file stale · stops: H-03 · owner: coordinator · evidence: coordinator 05:17:46Z, runs 1-2 clean · fix: capture leak diffs run 4; gate AchievementPrompt in fixture
- F2 · P2 · fixture localStorage carries onboarding state — 'coach never mounts', 'floor 3' are harness readings · stops: J-297:1972, J-296:1972, J-65:2 · owner: coordinator · evidence: OnboardingMount.tsx:60-66,240-241 · fix: re-verify on a cleared profile
- F3 · P2 · exit guard 'did not fire' — beforeunload likely undrivable · stops: J-1172:4804 · owner: coordinator · evidence: 12:18 records the fix · fix: verify by hand once
- F4 · P3 · recipe/fixture mismatch: media-drawer 'panel' misses the Drawer.tsx outline; media-card fixture 108 vs 116 · stops: H-07, H-04 · owner: coordinator · evidence: surfaces/media-drawer.json; jobs.json H-04 · fix: retarget recipe; fix fixture
- F5 · P2 · harness covers 6/355 boards · stops: H-06 · owner: coordinator · evidence: jobs.json H-06 · fix: recipes per family
- F6 · P3 · dead frame 396:2338 shares signature 1b6f3757 with live 170:41/170:70 · stops: AI image diffs · owner: coordinator · evidence: duplicates check2 · fix: archive it (H4)

## G · founder decisions pending (no PRD/DESIGN.md line settles these)

- G1 · P1 · Templates: dissolved (DESIGN.md:286, 14:174) vs shipped ✅ (12:77), 'F2 collapse still open' (12:177) · stops: J-807:7252, J-1138:13413, J-1169:4713, J-1169:4725, J-1169:4753, J-1169:4764 · owner: founder · evidence: 12:77,177 · fix: pick the target chapter first
- G2 · P2 · inspector header 5 vs 2; PRD verifies pick/parent/bind (14:232) but homes Ask AI on the canvas toolbar (14:529) · stops: J-32:2 (D-01) · owner: founder · evidence: ProInspector.tsx:345,359,373 · fix: keep 5 + redraw, or 2 + PRD home for three
- G3 · P2 · eye/lock hit box 20px (code) vs 10px glyph (board); no editor click-target minimum · stops: J-1082:4739 (D-02) · owner: founder · evidence: layers-v2.css:162-168; DESIGN.md:413 · fix: decide; add one DESIGN.md line
- G4 · P2 · site DS has no warning token; Alert 'warning' binds the green accent · stops: D-04 · owner: founder · evidence: constants.ts:36,41; catalog.ts:315 · fix: add color-warning (+4.5:1 pair) or drop variant
- G5 · P2 · checklist flat 30px rows (board) vs accordion with CTA (code) · stops: J-296:1999, J-296:2030 · owner: founder · evidence: 14:50-51 'CTA routing' · fix: flat + place the CTA, or redraw both

Moved out of G — a doc line settles it, coordinator applies: **D-03** → fix-code, DESIGN.md:192 + :208-210 (see Cleared) · **D-06** → delete, CLAUDE.md rule 6, 0 renders (canvas/controls/index.ts:24) · **J-641:2546** → drop ComponentsTab.tsx:72, visual → board, door survives standaloneActions.ts:14 · **J-297:2139** → fix-code banner position, 14:59 is the stale side · **D-05**'s 22 jobs → C2, D2–D9, B1–B3, E4, H1, G1, G5, F2.

## H · duplicates (two boards or two code paths for one thing)

- H1 · P1 · two boards for one create-component modal · stops: J-642:3112, J-1170:4777 · owner: founder · evidence: StudioModals.tsx:226-240; 14:188 · fix: keep 1170:4777, supersede 642:3112, conform once
- H2 · P1 · identical boards awarded 'match' as different states: 130:2≡130:997≡131:2, 130:400≡131:415 · stops: J-130:997, J-131:2, J-131:415 · owner: designer · evidence: struct-hash b21ea315, 741a1136 · fix: redraw each state, or supersede
- H3 · P1 · client sign-off on two pages, neither superseded: 1:3 NEW ×10 vs 1:6 ×16; census sees 1:3 only · stops: 10 Client sign-off jobs · owner: founder · evidence: duplicates check2 · fix: pick page; rename losers SUPERSEDED; census scope
- H4 · P2 · 17 SUPERSEDED frames top-level on 1:3, outside Archive 957:4474 · stops: C8, F6 · owner: coordinator · evidence: 152:2 … 396:2371 id list · fix: one appendChild batch; read parents back
- H5 · P2 · Backups ×7 boards duplicate Versions · stops: J-950:4474, J-879:4536, J-879:4518, J-879:4531, J-879:4526, J-1156:4620, J-1156:4665 · owner: product · evidence: 01:17 cap 50; 11:127-129 · fix: retire or rename Versions; no second store
- H6 · P2 · editor boards duplicating dashboard: share 817:4774/817:5069, health 817:5289/1157:4649 · stops: 4 · owner: product · evidence: 08:25 ShareDraftModal; PRODUCT-OVERVIEW.md:48 · fix: retire or re-home
- H7 · P2 · Commerce ×3 labelled [not-implemented]; surface EXISTS (1170:4713 driven) · stops: J-304:2048, J-304:2081, J-304:2103 · owner: designer · evidence: 14:268-272; CollectionSetupModal.tsx · fix: relabel or retire
- H8 · P2 · Figma tokens: two spacing scales + a third naming in CSS; 973:* size twins; 45 paint styles mirror variables; 21 raw colour groups; icons in 3 naming conventions · stops: token regen · owner: designer · evidence: 524:94-101, 973:2-4, 1044:5214/5219, 91:49/681:4343 · fix: one scale; alias; retire styles; one icon set
- H9 · P2 · dead exports, 0 renders: ReplaceAcrossModal, CatalogSection, DSStatusChip, SmartSuggestions +5 canvas controls, 12 barrel-only exports, ColorModeIconCycle/DSLintMount/BindingRow; chrome-ui shell primitives unused · stops: D-06 · owner: coordinator · evidence: duplicates check9 file:line · fix: safe-delete; shell primitives adopt-or-delete; ExportDropdown.tsx:26 only with J-153:120
- H10 · P3 · written twice: delete-page confirm (drifted copy), NoResults ×9, Retry ×20, error ×3, discard ×3, unlink-token, browse-media, GuideLine; tokens re-declared (layout.ts:48-68, config.ts:136-138, #1A56DB ×15) · stops: none · owner: coordinator · evidence: duplicates check6/7 · fix: one primitive each; delete constants
- H11 · P3 · CMSRecordsModal vs Content records view; media modals on two hosts · stops: M-03, J-1170:4749 · owner: product · evidence: CMSRecordsModal.tsx:339; ContentViews.tsx:890 · fix: decide if the modal is a door; one media host

## Cleared

- F1 Figma timeout · duplicates ran getInstancesAsync 05:20:09Z; raw-figma/ refreshed 09-02 10:00; verifier-brand read 12 boards 05:33-05:36Z
- F2 / H-01 raw cache · 8 files dated 2026-09-02 10:00-10:01 (jobs.json still `fix`)
- H-02 fixture widths · probe.tsx:453-486 six hosts at 280 (comments :67,:135,:204,:391 still say 320)
- H-05 skeleton-row 264 · probe.html:9 `body{margin:0}` (coordinator 05:17:46Z)
- D-03 disabled opacity · coordinator 05:31:01Z live: opacity 1, #F3F4F6/#6B7280, h28, 0 dimmed; DESIGN.md:192,208-210; ux-fixes.css:95-102 cursor-only. jobs.json D-03 `decide` and 781:4489/784:4250 'REMAINS opacity 0.5' are stale
- C7 (skeleton) drawer side · DESIGN.md:231 settles it → D2

## Unclassified

- J-1082:5004, J-66:225, J-775:4305 — `unbuildable`, empty evidence, no ledger line
- J-817:4856, J-912:4520, J-807:8787, J-817:5006 — name tag only, no measurement
- stale-PRD lines (PRD-ch01/02/03/11/14/overview; 14:59,163; 09:7-14) — doc debt, owner product; 02:9-23 still says 320 drawers
- requirements `ts` 11:10-11:21Z on a file written 05:20Z — clock not UTC; do not sort by `ts`
