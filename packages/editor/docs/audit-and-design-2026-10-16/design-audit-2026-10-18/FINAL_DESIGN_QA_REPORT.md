# FINAL_DESIGN_QA_REPORT

Date 2026-10-18 · Mode AUDIT (design-only) · Scope: every Buildrick editor design document (35 docs, ~10,200 lines) against the 1,238-row code inventory, 40 design principles and the shared design system.

## 1. Verdict

**PARTIALLY VERIFIED / BLOCKED. Not DESIGN COMPLETE. Not FINAL.**

- The **documentation audit is largely complete**: every panel/brief doc read in full, every inventory row traced, every principle evaluated at spec level. The FD-INS annex and IA-final registers were read **by citation only** — rows resting only on them are now counted PARTIAL.
- The **design is not complete**. No hi-fi or editable screens exist, so the brief's steps 6–7 (design system as built artefact, all screens) and the visual half of every principle cannot pass.
- The written specs are strong on behaviour, ownership, navigation and recovery. They are weak on the visual layer and carry ~20 internal contradictions created by the override-precedence model.

## 2. Deliverables

| File | Content | Status |
|---|---|---|
| DOCUMENTATION_AUDIT.md | Read scope, precedence, 10 headline findings, document register, review-fix check, **284-row gap register**, open questions, decision register | Complete for the audit |
| PRODUCT_FEATURE_INVENTORY.md | 1,179 FIDs (1,238 INV rows) by module + merge map | Complete (code-read source, not walked) |
| PRODUCT_INFORMATION_ARCHITECTURE.md | Object model, hosts, navigation diagram, builder-category evaluation, width budgets | Records approved IA; 4 PROPOSALs |
| DESIGN_SYSTEM_SPECIFICATION.md | One value per foundation, measured contrast, geometry, rows, targets, motion, overlays, component map with states, DESIGN.md correction list | **PROPOSAL** — 10 owner decisions (radius and focus ring turned out to be existing founder decisions: G13 2026-09-02, DESIGN.md 2026-07-29) |
| SCREEN_DESIGN_SPECIFICATIONS.md | 31-screen index with verdicts + per-screen audit | Index complete; **screens not designed** |
| INTERACTION_AND_STATE_MATRIX.md | Contract conformance, canvas interactions, screen × state matrix, 14–25 interaction matrix | Complete for the audit |
| 40_PRINCIPLE_AUDIT.md | 40 rows, spec + design status | 2 PASS-SPEC · 37 NEEDS REVISION · 1 BLOCKED · design BLOCKED ×40 |
| FEATURE_TRACEABILITY_MATRIX.md | 1,179 rows with design home, controls, states, coverage | 49% covered (UI) + 8% engine rules · 25% partial · 3% conflict · 3% omitted |
| CROSS_SCREEN_CONSISTENCY_AUDIT.md | 23 consolidated violations, DS compliance per screen, pattern matrices | 22 of 23 specified screens deviate |
| FINAL_DESIGN_QA_REPORT.md | this file | — |
| Figma file | — | **BLOCKED** — see below |

**Why no Figma file:** (1) `packages/editor/AGENTS.md` sets the current mode to AUDIT_AND_DESIGN with "do not use Figma as an input, reference or dependency for this audit"; (2) the Figma MCP needs re-authentication in this environment (CLAUDE.md §Figma) and is budgeted at 200 calls/day; (3) building screens before the contradictions below are resolved would freeze them into boards. Creating the file needs an explicit go-ahead and follows §6 step 3.

## 3. Completion gates (from the brief)

| Gate | Result | Evidence |
|---|---|---|
| Documentation fully audited | **PARTIAL** — panel/brief docs in full; FD-INS annex + IA-final registers by citation only | DOCUMENTATION_AUDIT §1 |
| Every documented feature has design coverage | **FAIL** — 577 UI rows + 95 engine rules covered of 1,179; 293 partial; 33 conflict; 33 omitted | FEATURE_TRACEABILITY_MATRIX |
| Every required screen addressed | **FAIL** — Export has no spec; Forms partial; E-commerce blocked on scope; 0 screens drawn | SCREEN_DESIGN_SPECIFICATIONS §1 |
| Relevant interaction states covered | **FAIL** — offline missing in 10 screens, loading in 7, long content in 17, many items in 12 | INTERACTION_AND_STATE_MATRIX §3 |
| Every applicable principle evaluated | **PASS** (evaluated) / **FAIL** (satisfied) — 40/40 evaluated; 2 PASS-SPEC | 40_PRINCIPLE_AUDIT |
| No unresolved mandatory consistency violations | **FAIL** — 23 open (CS-01…23) | CROSS_SCREEN_CONSISTENCY_AUDIT §1 |
| All known gaps documented | **PASS** | 284-row gap register + omitted list |
| Traceability report complete | **PASS** | 1,179 rows, every INV row accounted for |

Product-design-guard gates (object = this audit):

| Gate | Result |
|---|---|
| G1 Evidence & coverage | PASS with limits — sources cited; INV is code-read, not runtime; annexes by citation (stated) |
| G2 Task & ownership | PASS-SPEC — strategy exists as hypothesis; Forms/Export unowned (FAIL for those) |
| G3 Placement & architecture | PASS-SPEC with 4 proposals |
| G4 Geometry | FAIL — two values per surface; nothing measured (NOT RUN) |
| G5 Navigation & continuity | PASS-SPEC — URL state missing |
| G6 Interaction & accessibility | FAIL — canvas conflicts; contrast/targets/focus unspecified in 01–13 |
| G7 Capability preservation | PASS-SPEC — preservation maps exist; legal line dropped without decision |
| G8 Implementation | NOT RUN — design-only |
| G9 Handoff | FAIL — developer would invent row anatomy, numeric control, overlay colours, confirm class |

## 4. Fix list (doc amendments, in order)

**P0 — data safety and permissions (before any further design)**
1. P/22 §5.2/§7: "Restore my edits" compares kept-copy time with server revision; server newer → Download copy + Compare; add ⛔ SC-9 row (T5-01).
2. The three site-scope authz holes are decided in the brief (P1-D20, FI-05 / T-FI-05) but are not release-blocking: add SC-9 ⛔ rows and backlog tickets with the "server refuses cross-site" acceptance (T5-02, Major).
3. Forms: password field rule, `pageId`/`sourceUrl` dependency, 365-day retention line, conflict "Keep mine" rebase in CMS (T4-7, T4-8, T4-21, T4-17).
4. Correct false feedback claims: Assets synthetic progress, spam toggle "applies on next publish" (T4-3, T4-2).

**P1 — contradictions (one decision each, then mechanical edits)**
5. CS-01 SC-15 three-class rewrite, then edit ~20 panel confirms.
6. CS-02 one guard dialog · CS-04 override/reset wording · CS-08/09/10 notices, toasts, offline · CS-12 save vocabulary · CS-14 nouns.
7. Canvas: amend P05 to SC-17; menu group order + type-context group; Enter vs Tab; Shift+Enter; marquee start; hide multi-resize; drag-feedback state table; FI-02 acceptance; cancelled clone (T2-1…11, T2-38).
8. Inspector row anatomy + Mixed visual + numeric/unit, colour, box-model, alignment control specs (T6-9, T7-30).
9. Relabel PDB + HANDOFF to SPEC COMPLETE; add "SUPERSEDED — historical" banners to REPORT, IMPROVEMENT-PLAN, BATCH-01A (+ REVIEW.html), workflow-sketch, improvement-progress.json; disposition column in the redesign list (D1-1, D1-6, D1-13).
10. AI leaks: annotate PDB/HANDOFF AI rows inactive; P12 T-RT-09; P23 benefit-row exclusion (D1-4, D3-7, D3-9).
11. P10 T-ST-04b rewritten to the read-compare-write guard (D2-7). P25 `publish_blocked` enum gains the motion row (D3-1). P15 offline aligned to P22 (D3-2).

**P2 — completeness**
12. Complete Forms (P06 build rows + visitor outcome states; P10 inbox already specified) and write an Export annex (P01).
13. Add missing state rows (INTERACTION_AND_STATE_MATRIX §3).
14. Add one "Job: J1/J2/J3" line to each panel §1 (D2-1).
15. Apply DESIGN_SYSTEM_SPECIFICATION once approved: token list via Figma regen; DESIGN.md corrections §6; each panel gets "Visual: DS §x".

## 5. Owner decisions needed

| ID | Decision | Recommendation |
|---|---|---|
| OD-A1 | SC-15 class (b) "consequence confirm" list | As in CS-01 |
| OD-A1b | DS-OD-1…12 (design-system deviations from DESIGN.md / panel values) | See DESIGN_SYSTEM_SPECIFICATION §7 |
| OD-A2 | 40 px resource rows vs DESIGN.md "Never 40px" | Allow for thumbnail rows only |
| OD-A3 | E-commerce: confirm P1-D15 Defer and read-only behaviour for existing product blocks | Defer; existing blocks render, not editable beyond text/image |
| OD-A4 | Brand "From logo or URL" ships this version or not (shares `dsAi`) | Hide with other DS-AI until the Build tab |
| OD-A5 | Export "Soon" tiles (Vue/Next) | Remove until planned |
| OD-A6 | Brand starters named after real brands + violet primaries; purple template gradients | Rename + recolour |
| OD-A7 | Info tone colour | Neutral |
| OD-A8 | Desktop frame 1440 at ~52% Fit on laptops | **Corrected 10-18:** keep the 1440 frame + Fit and make selection chrome zoom-independent with a one-click 100%. A frame that follows the column would change the authored layout and break WYSIWYG (decision C1 in the decision sheet) |
| OD-A9 | Components persistent door (no rail item today) | "Components ›" in Add header + Layers instance link |
| OD-A10 | Usability validation plan owner/date (00-STRATEGY §7) | Before Figma of first run, as the plan states |
| Carried | ~45 panel ODs (§10 of panels 14–25), RL decisions #1, #5, #6, #7, #9, #11, #16, #18, #19, #20 | Listed in DOCUMENTATION_AUDIT §7 Q14 |

**Decision sheet:** all 45 open decisions with option mockups and recommendations — https://claude.ai/artifact/VJc2iexSu7zeSSAfNPs4aA (answers saved there are read back before the doc amendments).

## 6. Next steps

1. Owner answers §5 (one sitting).
2. Apply P0 + P1 doc amendments (mechanical once decided). This audit did **not** edit any source doc.
3. Then Figma: foundations page from DESIGN_SYSTEM_SPECIFICATION → components with all states → workspace screens S01–S06 at 1440/1366/1280/1024 × 900/720 → areas → task host → global states. Suggested pages: 00 Coverage · 01 Foundations · 02 Components & states · 03 Builder workspace · 04 Areas · 05 Tasks & dialogs · 06 Global states · 07 Responsive · 08 Flows · 09 QA.
4. Re-run Audit A/B/C against the boards; first moment any principle can reach PASS.
5. 5-user test of the core loop (00-STRATEGY §7).

## 7. Not verified (explicit)

- No runtime walk of the product; INV is a code read.
- No hi-fi screens; no visual, geometry or contrast measurement of rendered UI (token contrast **was** computed — DS §2.2).
- FD-INS annex files and IA-final registers were read by citation, not end-to-end.
- No usability evidence exists; persona and activation are hypotheses.
- Independent design-qa-critic review of these deliverables: see §8.

## 8. Independent review

`design-qa-critic` (read-only, separate agent), 2026-10-18. **Verdict: ACCEPT WITH FIXES — nothing Blocking.** Confirmed: trace and principle counts recompute exactly; all token contrast ratios match `tokens.generated.css`; 5 sampled OMITTED rows truly omitted; T5-01 (Critical) and D1-1, T2-1 confirmed; no claim of screens, runtime or Figma.

21 findings, all applied in this version:

| # | Finding | Applied change |
|---|---|---|
| 1–2 | COVERED rows with no controls/states, or resting only on a register entry, broke the COVERED definition | 39 rows → PARTIAL (tagged in notes); engine rules counted separately. Covered 711 → 577 UI + 95 engine |
| 3–4 | T5-02 authz holes overstated: they are decided in PDB:173/187 and P13; missing only from SC-9 and backlog | Severity Critical → Major; three rows → PARTIAL with citations; Critical findings 2 → 1 |
| 5, 15 | PASS-SPEC given to rows with open defects; P20 BLOCKED although DS resolves it | Strict rule; 11 → 2 PASS-SPEC; P20 → NEEDS REVISION |
| 6 | "Documentation fully audited PASS" while annexes read by citation | Gate → PARTIAL |
| 7 | No INV → FID merge map | Added to PRODUCT_FEATURE_INVENTORY |
| 8–9, 12–13 | DS changed DESIGN.md/panel values without OWNER tags (radius, shadows, focus, motion, header type, tooltip, popover widths, Brand preview, area title, NO BLACK) | Tagged OWNER; DS-OD-5…12 added; 5th DESIGN.md contradiction recorded |
| 10 | CS-01 counted two confirms SC-15 already allows | Removed |
| 11 | ink-muted on accent-tint 4.499:1 unflagged | Flagged; ink-soft rule extended to hover |
| 14 | T7-1 cited wrong token line and framed GEO-01's settled choice as open | Citation fixed; reframed as drift; P02 false positive removed |
| 16 | Forms called "no spec" though P10 specifies the inbox | Forms = PARTIAL spec everywhere |
| 17–20 | Gap severity recount; P38 offline list; S15 readiness; DS path | Fixed |
| 21 | This section said "Pending" | This table |

## 9. Owner decisions applied (2026-10-18)

Owner accepted all 45 decisions (OWNER-DECISIONS-2026-10-18.md) and said apply them. Applied by 8 file-owning agents + 1 cross-file reconciliation + 1 fix pass, every change marked *(R-1018)*; pre-edit copies kept in the session scratchpad for diffing.

Independent `design-qa-critic` check against the baseline: first pass 41/45 landed (N6 missing; C2, C7, S5 contradicted) + 17 more findings; all fixed in the fix pass except F15/F16 below. No row, test ID or capability lost; JSON/HTML valid; no DESIGN READY/VERIFIED claims; DESIGN.md changed only in editor-chrome sections (+77/−42).

**Two reconciliation choices that go slightly beyond S3 — owner to confirm:**
- SC-24: Exit with unsaved page edits also offers "Save and leave" (flushes the save; P01 already had it).
- SC-24: Panel 10's "Save settings first?" prompt before Publish/Preview kept as a named variant (it is not a leave dialog).

**Still open (needs a decision nobody has made; listed in each panel's "Not applied"):** Site-settings shortcut key, ⌘\ Inspector toggle scope, preview font/color parity rule, "Bind to CMS field…" landing, canvas inherited-lock visual, dimmed-row contrast floor, Connect → restore point, shared bulk bar, Brand guard dirty state, per-form inbox filter, CMS Sources visibility, one icon picker, auto-alt toggle (likely SC-21), topbar publish over open panel (L5-061), damage-scan Issues copy, saved-template delete.

**Not done:** token regeneration via Figma (rail 56, drawer 284, task 360, footer 48, dialog 720, popovers, canvas-guide) — `tokens.generated.*` cannot be hand-edited; panels are SPEC COMPLETE, none VERIFIED; no Figma screens yet.
