# Code ↔ Figma feature-gap audit — REPORT (2026-09-21)

Owner: Saqib · Author: Claude · Branch `audit/code-figma-gap-2026-09-21` · Figma `g4GzQFqzNYz5sosz1QtZXC` page **Editor v3 · IA** `4418:45431` · Code `packages/editor` (zero `src/` edits).
Designer page: https://claude.ai/artifact/E9qB9nkEeY6eiKEp2cuojo (private until shared).
Files: `BRIEF.md` · `01-code-inventory.md` · `02-figma-inventory.md` · `03-gap-matrix.md` · `04-integration-plan.md` · `05-figma-build-log.md` · `06-second-pass.md` · `07-traceability.md` · `dump/` · `screenshots/`.

## 1. Executive audit summary

- The code can do **1,020** user-facing things (775 shipped, 86 with a documented ceiling, 32 behind a planned flag, 67 unreachable, 27 stubs, 33 duplicates). The live design had **1,098** boards in 105 families before this arc.
- Capability-level comparison (**459 rows**): 167 match (A), **52 code-only (B)**, 25 Figma-only (C), 163 partial (D), 22 duplicate (E), 26 obsolete (F). Priority: **P0 13 · P1 24** · P2 22 · P3 111.
- The biggest holes were not features but *flows that could not complete in the design*: recovery (save-failed → restore, crash banner, conflict backup/overwrite, offline, load errors), comment posting, the third publish-gate reason, folder deletion, the Brand migration modal. Comments (six shipped capabilities) had **no door at all** on the topbar.
- Built on the owner's go (defaults in 04 §2): **40 boards** in a new section `v3 · Code-only features` (`7563:197895`) — 33 committed (P0 17 · P1 16) + 7 waterfall — a launcher wired into the STATES index, **11 entry-point edits** (Comments toggle on the topbar master, propagated to 503 live boards; view-mode and collaboration rows in the site menu; Reopen; Mark all read; four context-menu rows; shortcut legend; toast Undo; CMS Conditions; copy fixes; Brand hex/Light-Dark; Detach/Listings), **28 annotation cards** on Figma-only controls, and **42 hides** of already-orphaned clones.
- Static verification: every write read back; the new section re-dumped; graph **0 dangling · 0 dead ends · 0 Close-first · 40/40 reachable**; four families screenshotted (one caught a clipped popover, fixed). Independent second pass: §18.
- Traceability: all 1,020 code rows carry a Phase-19 status; **2 ✗ Missing**, both owner-gated (CTA verbs → plan §15; viewer pins → dashboard). All 1,138 Figma rows carry one of the four statuses; 108 are ✗ Dummy (annotated or hidden), 617 △ Partial.
- Not copied from code: none of the code's chrome. Every board is a clone of a v3 shell composed from the 🧩 Components library (Toast · Banner · Tooltip · dialog/header+footer · Button · Input · Presence · Segmented); one new component (`pin/comment`).

## 2. Codebase feature inventory
`01-code-inventory.md` — 1,020 rows across 12 modules (SH shell · EN engine · CV canvas · CI canvas-interaction · PG pages/layers/history · AD add/AI · AS assets/CMS · ST settings/publish/review/sync · IN inspector · BR brand). Every SHIPPED/LIMITED row cites `file:line`; flags are FLAGGED-VIABLE (owner order: planned, never dead). Notable: comments are backend-real but saved-site-only, no @mentions, no count badge; Issues auto-fix and "Replace across pages…" are unreachable; Form settings section is unmounted; the migration modal's failed-state buttons only close.

## 3. Figma feature inventory
`02-figma-inventory.md` — 1,098 live boards (751 CURRENT · 165 STATE · 29 launchers) dumped in 36 calls (`dump/live-all.json`, technique in memory `figma-page-dump-technique`); 714 parked frames indexed in `dump/parked-index.txt` — which is how we know Comment mode `4418:123762` and Presence `4418:124184` were ARCHIVE references, not design. The rail's Brand item now opens a full-screen workspace (`7315:80955`) built the same day by another session while the plan's v3 drawer sits parked — the largest single owner decision (04 OD-1).

## 4. Full gap matrix
`03-gap-matrix.md` §A (459 rows, 13 columns per Phase 14) + §B capability-depth tables (Review, Comments, Collaboration, Publish, History, Recovery; Inspector, Templates, Add, Components, AI, Canvas overlays, Pages; Assets, Image editor, CMS, Settings, Brand, Export, Commerce) + §C per-family lens blocks + §A2 index of the 49 per-item clones. Coverage: 1,020/1,020 code rows owned exactly once, 1,098/1,098 boards covered.

## 5. Code-only features (B · 52)
Recovery family (save-failed restore, crash banner, sync-failure toasts, stranded exit), comment posting (pin → popover → post/fail), comment pins and mode toggle, re-pin on canvas, "Publish with N errors", collaboration (flag: presence, cursors, start row), delete-folder guard, project-update modal, spacing/radius/shadow token kinds, canvas overlays (snap guides, rulers, grid, spacing spots, inline-edit toolbar), full shortcut sheet, Group/Lock/AI/Bind rows on the canvas menu, "Detach instance", "Listings". 24 of the 52 are now boards or entry-point edits (04 §4/§5); the rest are P3 node-ready specs (03 rows).

## 6. Figma-only features (C · 25)
Activity drawer, Duplicate/Delete site, Backups tab, Permissions explainer, ⌘K JUMP TO + stock fallback, a11y checker, custom preview width, Add "Soon"/loading/error rows, "N left today", Form/Slider/Custom-attributes editors, "Replace across pages…", media view-only role, Collection settings, Google Sheets source, Collection-list element, Integrations (13 boards), Translate dialogs, Duplicate token, Styles page, Workspace themes. All carry `AUDIT · NOT IMPLEMENTED / DESIGN-ONLY` chips (05 Batch 4) — none renamed or hidden for status (Q12).

## 7. Partial capability mismatches (D · 163)
Headline deltas: publish confirm (Figma deploys on click; code confirms) · conflict dialog (2 vs 3 actions) · orphan comments (announcement vs reattach picker) · notifications scope (site vs workspace) · viewer feedback (located pins vs notes) · review sending (inline email vs 3-field popover + link modal) · Brand: four designs · delete pattern (instant + Undo vs confirm modal) · page-settings save (autosave vs Done/Cancel) · shortcut legend prints unbound chords · typed-DELETE policy · export scope copy. Owner decisions in 03 §E (39) and 04 §2 (15 with defaults).

## 8. Dummy / prototype-only features
`07-traceability.md` Figma → Code: **108 ✗ Dummy** (annotated C rows, obsolete F boards, 42 hidden clones), **8 ○ Planned** (3 PLANNED collab boards + Add composer / flag-gated rows), 617 △ Partial (boards that mix implemented and design-only controls, or per-file clones). Prototype value pickers (`4418:154648…`) and "representative values" boards are harness, not product.

## 9. Navigation issues
From 03 §C: the status *dot* opens History (a passive glyph as a door); exit interstitials add a hop the code lacks; Site settings row fires CLOSE + SV + NAV; History Backups rows NAVIGATE while Saves rows OVERLAY; Style ▸ submenu was a dead end inside the ⋯ overlay; two mis-labelled STATES cards (Templates); Brand launchers pointed at parked boards (retargeted `4428:149324`; `4418:71408` deferred); superseded Layers board `4418:80697` still had four live openers (retargeted, hidden). Post-build section graph: 0/0/0/0.

## 10. Cognitive-load issues
Code exposes six always-on footer overlay toggles where Figma uses one View menu; two command palettes (⌘K, ⌘⇧P) and two help screens; three "more" menus with different rows; the Inspector as one long profile-ordered list vs Figma's tab strip; Brand as a 3-deep drawer vs one page. Recommended tiers per family in 03 §C (PRIMARY … RARE); the Figma direction wins in every case above (04 Batches 5–6 build the Figma-side affordances, code changes are Tier 2/3 rows).

## 11. Progressive-disclosure issues
Hidden-by-default rows that ship in code: ✦ Improve with AI and Bind to CMS field were *drawn but invisible* on both ⋯ menus (unhidden, EP-5). Figma reveals Effects/Settings via tabs — code should follow. Beginner/Pro fold (Brand, Inspector) exists in both; Pro-gating a structural action (Detach) is code-only. Flag-gated features are now visible as `PLANNED ·` boards and one PLANNED menu row, never as live controls.

## 12. Discovery issues
Comments had no door (fixed: topbar toggle, `C`); view mode had no menu row (fixed); collaboration had no entry (PLANNED row); Listings and Detach instance had no Figma entry (added); the ⌘K-only CMS records table is invisible from the drawer (Figma's table-as-home is right); Issues chip lives on the topbar in code but only in menu/⌘K in Figma (owner: 04 OD list, G1-006/010). Launcher-only boards (no shell door by design): the recovery states (system-initiated), the review-chip and notification state sheets, the toast catalogue, PLANNED collab boards.

## 13. Consistency issues
Same job → different pattern: delete (instant+Undo vs modal), save (autosave vs Done/Cancel; pill vs Save button), confirm copy ("Reload saved version" vs "Reload latest"), success feedback (toast vs modal in Settings), typed-DELETE scope, "Hidden from publish" vs "Won't publish", three prefixes for the image editor, "Assets" vs "Media" vs "Content/CMS" labels, three wrappers (Wrap in container / section / Group), size copy 10 MB vs 50 MB (fixed), n/p chords printed but unbound (fixed). Library gaps: no warning/dark toast tone, no chip tone variant, IconButton has no pressed state.

## 14. Recommended architecture changes
1. One Brand design — **decided by the owner 2026-09-21 (artifact thread): the full-screen workspace `7315:80955`**; the old launcher is archived, the three v3 launcher cards hidden, four back-links retargeted (05 "OD-1 resolved"). Code rebuild = plan doc §16 Tier 3.
2. One confirm before deploy; one delete pattern (instant + Undo on canvas/Layers, modal only for masters / N > 1); one save model per surface (autosave in editors, Done/Cancel in Settings and page settings).
3. Fold the review bar into chip + panel; one ⌘K (merge ⌘⇧P), one shortcut sheet (W-3), one Brand colour picker (swatches + hex + alpha).
4. Comments as a first-class topbar mode with canvas re-pin; orphan announcement as a modal (code) — toast variant only if the owner prefers.
5. Notifications scoped to the site until a workspace inbox exists; Activity stays a dashboard page (annotated).
6. Code Tier 2/3 rows (243 non-none "Required code change" cells in 03) appended to `docs/plans/2026-09-14-editor-v3-ia.md` §16.

## 15. Implemented Figma changes
`05-figma-build-log.md`: 40 boards (ledger with ids), launcher `7563:197896` + index card `7577:196802`, EP-1…EP-11, 28 annotation chips, 42 hides + 4 retargets, one new component `pin/comment` `7566:186556`. Corrections made while building: B1-10/B1-11 source ids (parked-index beats the agent's citation), presence needs no master edit (component `692:472` already has five states), `btn/publish-to-production` had been re-componentised into `Panel footer/primary`.

## 16. Remaining code implementation gaps
From 03 "Required code change" (Tier 2/3, none written this arc): in-editor share modal + Preview share button · pill click → History · merge ⌘⇧P into ⌘K, JUMP TO entities · merge the two shortcut sheets · Copy-link row in Review ⋯ · collapse the two publish confirms · render the Offline presence pill · read the crash sentinel back · wire `inspectFolder` + delete-folder confirm · wire Restore snapshot / Retry in the migration modal · Inspector "Edit text on canvas" · persist guides in project meta · fold snap-to-grid into Grid · one AltText service · one image picker (drawer pick mode + upload modal) · one record editor · one colour picker · fold Animation into Interactions · Settings inline search · viewer banner + permission explainer · Activity tab on `activity.recent` · retire `ReviewBar` (owner). Plus the annotated Figma-only controls (§6) as backlog candidates, never as promises.

## 17. Traceability matrix
`07-traceability.md`: code 1,020 → ✓ Represented 670 · ✓ Combined 152 · ✓ Internal 81 · ✓ Planned for later 61 · ✓ Deprecated 32 · ✓ Hidden 22 · **✗ Missing 2** (SH-24 CTA verbs — plan §15 decision; ST-64 viewer pins — dashboard surface); Figma 1,138 → ✓ Code 405 · △ Partial 617 · ✗ Dummy 108 · ○ Planned 8.

## 18. Final QA report

### Acceptance criteria (Phase 20)
| # | Criterion | State |
|---|---|---|
| 1–2 | Both inventories exist | ✓ 01 (1,020) · 02 (1,098) |
| 3–6 | Code-only, Figma-only, partial, dummy identified | ✓ 03: B 52 · C 25 · D 163; ✗ Dummy 108 in 07 |
| 7 | Code features designed into Figma | ✓ 40 boards + 11 entry-point edits (05) |
| 8 | Bad code UX not copied | ✓ every board is a v3 shell clone + library components; code chrome never reproduced |
| 9–12 | Cognitive load, disclosure, navigation, discovery | ✓ per-family lenses (03 §C) → Batches 5–6; §9–12 above |
| 13 | No dead ends in important workflows | ✓ new section 0 dead ends; page-wide re-scan not repeated (below) |
| 14 | Components/patterns consistent | ✓ library components only; three library gaps recorded (§13) |
| 15 | Conditional states represented | ✓ inherited CONDITIONAL gates kept verbatim; SET_VARIABLE chains preserved on the three retargets |
| 16 | Prototype connections complete | ✓ 40/40 reachable from the index via L-1; entry + return on every board |
| 17–18 | Traceability both ways | ✓ 07 (2 ✗ Missing, both listed with owner path) |
| 19 | Second-pass verification | see below |
| 20 | Remaining issues documented, not hidden | ✓ this section + 05 "NOT verified" + 06 §G |

### Second pass (Phase 18, fresh agent)
`06-second-pass.md` (fresh agent, local evidence only): plan → reality **CONFIRMED 26 · PARTIAL 14 · NOT REPRODUCED 0** (all 40 boards exist, exact names, exact launcher order); independent graph recount 0 dangling · 0 Close-first · 40/40 reachable · 3 self-loops (05 had said 1); hides re-verified zero-inbound with no survivor losing reachability (731/731 from the index, 879/879 from all launchers). **21 findings** (7 major): the EP-9 size copy contradicted the code (reverted — images are 10 MB), the two screenshots on disk predated the fixes (re-taken), six dialog boards were launched by NAVIGATE so their CLOSE returns were inert (→ OVERLAY), ten boards lacked their planned shell entry (three added: comment placement hotspot, Post → conditional on `commentSendSucceeds`, folder-trash hotspot; five stay launcher-only because their routing is variable-gated — recorded), the conflict dialog had no safe exit (Esc + backup return added), W-7 was unreachable and still carried colour rows (nav item on the Brand workspace + rows hidden), `hide-safe.json` was one id short and names-less (rewritten). Minor items fixed or recorded in 05 "Post-second-pass fixes". Graded NOT REPRODUCED in 05: one stale ledger destination, two stale screenshots, the self-loop count, the "no Soon pill" claim (the word was in a row label — now removed), the EP-9 claim, and the hide-file claim — all corrected. The second pass could not verify anything on live boards (the 503-board propagation, EP-1…11, annotation chips, masters) — §E of 06 names the one read per item that would.

### NOT verified (state it, do not count it)
- Pixels of 36 of 40 boards (4 screenshotted; the rest geometry-checked + read back).
- PLANNED boards against a flag-on running app — no such build exists.
- Prototype playback of any path (Q7: static only).
- A full-page re-dump after the 503-board propagation and the live-board entry-point edits (only the new section was re-dumped three times; edits rest on in-script read-backs) — the second pass lists the exact reads that would close each (06 §E).
- Byte-level comparison of the topbar master / rail set / 🧩 masters (inventory-level check only).
- Toast warning tone, chip amber tone, IconButton pressed state — library has none; approximated.
- The 38 deferred clone hides (`dump/hide-plan.json`) and the "Soon" pill on `4418:89490` (not found).
- Dashboard-side behaviour (viewer page, activity page, share handoff) — out of scope (Q1).
