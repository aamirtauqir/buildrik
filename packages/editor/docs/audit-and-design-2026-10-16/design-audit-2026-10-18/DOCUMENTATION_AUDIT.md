# DOCUMENTATION_AUDIT

Date 2026-10-18 · Mode AUDIT (design-only; no app code, no panel doc edited) · Auditor role: Principal Product Designer (AGENTS.md).

## 1. What was read

| Set | Files | Lines | Read by |
|---|---|---|---|
| Panel specs | `panels/00-SHARED-CONTRACTS`, `00-STRATEGY`, `01`…`25`, `REVIEW-2026-10-17`, `ENGINEERING-BACKLOG-2026-10-17` | ~6,600 | D2 (00–13, full), D3 (14–25, full), T1–T7 (targeted per feature) |
| Authority / IA docs | `PRODUCT-DESIGN-BRIEF`, `REMAINING-IA-HANDOFF`, `ARCHITECTURE-DECISION`, `IMPROVEMENT-PLAN`, `REPORT`, `BATCH-01A`, `CMS-DYNAMIC-BINDING-DESIGN`, `improvement-progress.json`, 3 HTML galleries (text) | ~3,600 | D1 (full) |
| Feature inventory | `docs/editor-feature-inventory-2026-10-16.md` (1,238 rows, code read) | 2,275 | T1–T7 (every row) |
| Redesign list | `docs/editor-redesign-list-2026-10-16.md` (PROPOSAL) | 400 | D1 |
| Design system | root `DESIGN.md`, `src/themes/tokens.generated.css`, `src/editor/chrome-ui/*` (read-only) | 558 + tokens | T7 + orchestrator (token values + measured contrast) |
| IA-final evidence registers | `evidence/ia-final-2026-10-16/` (CP, MS, REG) | — | T1–T6 by grep, not end-to-end |

Not read: FD-INS annex files beyond what T6 cited; 466 evidence screenshots/snapshots (as-built captures — not design documentation). Not used: Figma (AGENTS.md: no Figma input in audit mode), live app (not authorised to walk this pass).

Method: 10 parallel read-only extraction passes with one shared brief (`_extraction/EXTRACTION-BRIEF.md`), each citing `file §` / `file:line`; orchestrator merged, re-counted and spot-checked token facts. Full findings stay in `_extraction/` (durable; resume point).

## 2. Precedence the doc set declares (applied in this audit)

1. `00-SHARED-CONTRACTS` rules *(R-1017)* override panel text.
2. SC-21 — no AI in this version's UI (Panel 20 DEFERRED, backend untouched).
3. SC-22 — all other designer recommendations accepted 2026-10-17.
4. SC-16 — "DESIGN READY" retired; labels are SPEC COMPLETE / VERIFIED.
5. ARCHITECTURE-DECISION is SUPERSEDED.
6. Code establishes what exists (INV); docs establish intent.

**Structural weakness found:** precedence-by-override means stale panel text is left in place on purpose (D2 P31). An implementer must merge two sources for ~20 rules. This is the single biggest source of contradictions in §6.

## 3. Headline findings

| # | Finding | Severity | Evidence |
|---|---|---|---|
| H1 | **P0 data loss with no panel fix:** "Restore my edits" / Retry ⌘S overwrite a teammate's newer server work; P/22 keeps the action unchanged while IAF-22 requires a server-revision check | Critical | T5-01 |
| H2 | **Three site-scope permission holes** (cross-site review revoke, resolve ignoring site role, library/theme scope) are decided at brief level (PDB:173 P1-D20, PDB:187 FI-05 + T-FI-05; P13 FI-05) but have **no SC-9 ⛔ row and no backlog ticket**, so nothing blocks release on them | Major *(was Critical; corrected after independent review)* | T5-02 |
| H3 | **SC-15 "Undo over confirm" is contradicted ~20 times** across P01, P10, P13, P14, P15, P22, P23, FD-INS, Forms | Major (systemic) | D2-8, D3-6, T1-04, T3-2, T5-03, T6-28, T4-22 |
| H4 | **Visual layer is unowned**: no panel 01–13 cites DESIGN.md; DESIGN.md has drifted from tokens and contradicts itself in 4 places; 6 surfaces have two sizes | Major (systemic) | D2-29, T7-1…10 |
| H5 | **Three modules lack a complete design home**: Forms (23 rows — inbox specified in P10, build + visitor states not), Export (7, no spec), E-commerce (scope undecided) | Major | T4-1, T5-09, T5-04 |
| H6 | **Canvas interaction gaps**: one generic context menu with no order; multi-select toolbar contradiction; drag feedback unspecified; Tab and Enter conflicts | Major | T2-1…11, T2-38 |
| H7 | **False feedback written into specs**: Assets progress "real" (synthetic), spam toggle "live" (next publish), Restore success while overwriting | Major | T4-3, T4-2, T5-01 |
| H8 | **Stale authority labels and unmarked historical docs**: PDB + HANDOFF still "DESIGN READY"; REPORT, IMPROVEMENT-PLAN, BATCH-01A, workflow-sketch, progress.json, redesign list carry superseded directions without banners | Major | D1-1, D1-6, D1-13 |
| H9 | **AI leaks despite SC-21**: PDB/HANDOFF IA tree, P12 T-RT-09, P23 upgrade benefit rows | Major | D1-4, D3-7, D3-9 |
| H10 | **No panel names the job it serves**; strategy validation plan has no owner/date | Major | D2-1, D1-19 |

## 4. Document register (authority and staleness)

| File | Purpose | Declared status (quote) | Date | Authority | Stale? (cite) |
|---|---|---|---|---|---|
| PDB | Authority brief: role, IA, BD/IA decisions, Inspector closure, panel index | "Phase 1 IA decision-complete … FD-DYN-01 is DESIGN READY …" (PDB:7) | 2026-10-16, edited to 10-17 | **approved** (BD-*, IA-*) | **Yes** — still "DESIGN READY" (PDB:7,15,157,220–225,1160) though retired by 00:284 and by PDB:1014 itself; D7/D8 "next work"/"Resolve" (PDB:1037,1046) though decided (DYN:53–54); "Not covered: Templates workspace interior" (PDB:1033) though Panel 15 exists (PDB:1014); no mention of SC-20/21/22 |
| HANDOFF (FD-IA-09) | Annex: object model, NAV-01–04, GEO-01, CTRL-01–07, DEC-IA-01–07, BD20 overlay | "DESIGN READY for bounded existing-product IA …" (HANDOFF:3) | 2026-10-16 (+10-17 edits) | **approved** (BD-21) | **Yes** — "DESIGN READY" (HANDOFF:3,13,55,189) vs 00:284; "open: D7 members, D8 live-source runtime" (HANDOFF:66) vs its own :3; primary-user = roles (HANDOFF:9) vs 00-STRATEGY §1 |
| ARCH | 3 structural alternatives (A/B/C) | "**SUPERSEDED (2026-10-17)** … Kept as history only" (ARCH:1) | 2026-10-16 | **superseded** | Correctly labelled |
| IMPROVEMENT-PLAN | Staged Figma batch plan 00–13 | "Batch01a … PARTIALLY VERIFIED"; "Later batches: PLANNED" (:179–180) | 2026-10-16 | **historical** (no marker) | **Yes** — Figma-first mode (:4,:15) vs BD-03/PDB:72 "Do not use Figma"; geometry rail60/drawer280 (:141) vs GEO-01 56/284; never referenced by PDB/HANDOFF/panels |
| REPORT | First audit + design spec M01–M38, issue register I01–I24, FA01–FA13 | "proposed design and frontend handoff" (:5); §15 "PARTIALLY VERIFIED" (:973) | 2026-10-16 | **historical** (no marker) | **Yes** — links ARCH as current (:7); Inspector 320 / 300–400 (:136) vs INS-D07 300 fixed; rail incl. Pages (:225) vs BD-05; keep 3 tabs (:259,:888) vs BD-08; CMS "Data & variables" owns conditions (:336–338) vs BD-20/D13 |
| BATCH-01A | Heading/Typography Figma slice H01–H34 | "PARTIALLY VERIFIED" (:5) | 2026-10-16 | **historical** | **Yes** — 3-tab baseline (H05 :51); "Size preset" (:23,:54) vs PDB:678 "Font-size token"; 60/280 geometry (:35) |
| DYN (FD-DYN-01) | CMS dynamic binding full system | "**SPEC COMPLETE (written scope) · not VERIFIED**" (DYN:4) | 2026-10-16/17 | **approved** (BD-20/22, D1–D13) | Partly — keeps "template page" wording by choice (DYN:6); "Record history per CMS rules" undefined (DYN:76) |
| improvement-progress.json | Machine checkpoint of Figma batches | batch01a "REFERENCE STUDY / NOT ACCEPTED" (:41); architecture "STATIC CANDIDATE … recommendedCandidate A" (:146,155) | 2026-10-16 | **historical** | **Yes** — contradicts BATCH-01A:5 "PARTIALLY VERIFIED"; recommends superseded ARCH A |
| 00-STRATEGY (FD-PNL-00S) | Persona, 3 JTBD, core loop, activation, NSM, validation plan | "**WORKING HYPOTHESIS — not validated.**" (:4) | 2026-10-17 | **proposal** (hypothesis; owner "han likh do") | Minor — §8 "Later: interactions authoring" (:49) while Panel 19 is SPEC COMPLETE |
| REVIEW | 5-reviewer critique, ~147 findings; §E applied log; §F backlog note | "READ-ONLY doc review" (:3) | 2026-10-17 | **historical** (review record) | **Yes** — §E:156 "Not done: OD-C3" vs 00:353 decided; §F:161 "172 tickets (P0 19 · P1 24 …)" vs BACKLOG:17 "174 (P0 20 · P1 25)"; "~60 Major" (:10) vs appendix 84 (:119–123) |
| BACKLOG (FD-ENG-01) | 174 eng tickets + 16 AI-deferred | "derived from SPEC COMPLETE panel docs · not VERIFIED" (:3) | 2026-10-17 (conflicts edited 10-18) | **proposal** (tickets) | Current; 3 conflicts still **Open** (:314,:317,:318) |
| RL | Screen-by-screen redesign list, 20 owner decisions | "**Status: PROPOSAL.** Nothing here is approved yet." (RL:3) | 2026-10-16 | **proposal** | **Yes** — predates BD-08/BD-05/SC-*; never dispositioned by PDB/panels (no reference found); several rows contradict approved decisions (see D1-13) |
| AS-IS-REVIEW.html | Evidence gallery for 99 AS-IS Figma frames | "evidence gallery, not an improved editor" | 2026-10-16 | **historical** | n/a (evidence) |
| BATCH-01A-REVIEW.html | Batch01a comparison gallery | "Design proposal · PARTIALLY VERIFIED" | 2026-10-16 | **historical** | Same as BATCH-01A |
| workflow-sketch.html | 3 illustrative workflow sketches | "Proposed workflow sketches. Illustrative content." | 2026-10-16 | **historical** | **Yes** — rail "Add Layers Pages Assets CMS Brand", topbar "Document saved", 3 tabs, "Data & variables" (all superseded by BD-02/05/08, D13); REPORT:830 DPR02 already flags system-ui/off-token colours |

## 5. Review-fix verification (did the 2026-10-17 review fixes land?)

| Finding | Claimed fix location | Present? | Evidence |
|---|---|---|---|
| C-1 image-loss interim guard; T-AS-04 BLOCKED | 08 §5, §6; 00 SC-9 ⛔ | **Y** (guard) / **partial** (BLOCKED) | P/08:95 guard text + "T-AS-04 is BLOCKED … cross-device"; 00:135 ⛔; acceptance row P/08:161 not tagged BLOCKED |
| C-1 usage scan incl. Settings/Brand | 08 §6; SC-9 | **Partial** | interim warning copy only (P/08:101; 00:120); full scan non-⛔ dependency (BK-125 P3) |
| C-2 settings concurrent-edit banner + read-compare-write | 10 §5; SC-9 ⛔ | **Y** | P/10:76 two-layer guard; 00:133 |
| C-2 dirty guard covers Publish/Preview | 10 §5 | **Y** | P/10:79 |
| C-3 "stays public until you publish" + Publish now | 10 §7 | **Y** | P/10:103 (incl. mirror copy, Needs attention) |
| C-3 OD-C3 left for owner | 10 §7 | **Superseded** — decided | 00:353, P/10:103 "OD-C3 decided (SC-22)"; REVIEW:156 stale |
| C-4 stored-data protection, tombstone, conversion, required preflight | 07 §6; SC-9 ⛔ | **Y** | P/07:91; 00:112 |
| C-5 collection soft delete, blocked while bound, Recently deleted; slug → redirects | 07 §8; SC-9 ⛔ | **Y** | P/07:111–113 (+ slug note :111); 00:113 |
| Strategy one-pager | 00-STRATEGY | **Y** | 00-STRATEGY:1–49 |
| Back rule topbar doors; one label pattern | 00 SC-1 | **Y** | 00:15, :17 |
| Esc canvas → parent; declared exceptions | 00 SC-2 | **Y** | 00:26–34 |
| Group≠Wrap; Ungroup in Layers; Lock ⌘⇧L; Arrange ⌘⌥]/[; delete = Undo | 00 SC-3 | **Y** | 00:48–65 |
| F6 fallback chord | 00 SC-5 | **Y** | 00:76 |
| Draft record in Preview; custom width ≠ export | 00 SC-8 | **Y** | 00:99 |
| SC-9 extended + ⛔ marker | 00 SC-9 | **Y** | 00:103, rows :112–121 |
| Glossary | 00 SC-11 | **Y** (with drift D1-9/10) | 00:197–231 |
| Shortcut scope, platform, rebinds, single-key toggle | 00 SC-12 | **Y** | 00:233–258 |
| Breakpoint ranges + cascade + override dot/reset | 00 SC-13 | **Y** | 00:260–266 |
| Lock scope; Add drag enabled | 00 SC-14 | **Y** | 00:268–269 |
| Recently deleted 30 d; page/main/Brand revert recovery | 00 SC-15 | **Y** | 00:273–279 |
| Status vocabulary; all 15 docs relabelled; footers fixed | 00 SC-16; every panel Status | **Partial** | panels 00–25 relabelled (status lines P/01–25:4); no "review pending"/"interim viewer" hits; **PDB:7,15,157,220–225,1160 and HANDOFF:3,13,55,189 still "DESIGN READY"** |
| Field-scoped ⌘Z; multi-select rules | 00 SC-17 | **Y** | 00:286–289 |
| One-line contracts (plan limits, AI, session expiry, ⌘K, interactions) | 00 SC-18 | **Y** | 00:291–297 (interactions → Panel 19) |
| Narrow widths never cover target; no auto-open overlay | 00 SC-19 | **Y** | 00:356 |
| ARCH marked SUPERSEDED; brief index wording | parent folder | **Y** / **Partial** | ARCH:1; PDB:1012–1033 index uses SPEC COMPLETE, but PDB:1033 still says Templates "Not covered" |
| Publish end-to-end spec | 14-PUBLISH | **Y** (exists) | P/14:4 status |
| Templates / First run specs | 15, 16 | **Y** (exist) | P/15:4, P/16:4 |
| Remaining surfaces 17–25 | 17–25 | **Y** (exist) | status lines P/17–25 |
| Persona conflict ("pick one") | 00-STRATEGY §1 | **Partial** | strategy picks solo designer (:10–11) but HANDOFF:9 and DYN:15 not annotated |

## 6. Documentation gap register (all contradictions, ambiguities, missing and stale items)

Every row from the 10 extraction passes, unchanged, prefixed by source pass. Severity counts (after review correction): Critical 1 · Major 85 · Minor 196 · qualified Minor 2 (284 rows). Resolution column = proposed design-level fix; no new capability.

### From D1-core-docs

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| D1-1 | stale | PDB:7, :15, :157, :220–225, :1160; HANDOFF:3, :13, :55, :189 "DESIGN READY" | 00:284 "DESIGN READY is retired"; PDB:1014 uses SPEC COMPLETE | Major | Relabel brief/annex to SPEC COMPLETE · not VERIFIED (+ blocked-by list) |
| D1-2 | stale | PDB:1033 "Not covered in this pass: Templates workspace interior" | PDB:1014 Panel 15 added; 00:359 struck through | Minor | Delete line |
| D1-3 | stale | PDB:1037, :1046 "owner decisions D7/D8 … Resolve D7/D8"; HANDOFF:66 "open: D7 … D8" | DYN:53–54 decided; HANDOFF:3 itself says decided | Minor | Update to "D7 deferred, D8 browser script (P4b)" |
| D1-4 | contradiction | PDB P1-D11/12 (:164–165), §6 AI row (:423), IA-01 tree AI (:247); HANDOFF NAV-02 AI (:80) | SC-21 no AI UI (00:332–340) | Major | Add SC-20/21/22 precedence note to PDB §4 and HANDOFF §1; mark AI rows "inactive (SC-21)" |
| D1-5 | contradiction | HANDOFF:9 primary users = roles; DYN:15 "designer/freelancer" | 00-STRATEGY:10–11 one primary user; roles = access | Minor | Point HANDOFF/DYN to 00-STRATEGY §1 |
| D1-6 | stale | REPORT:136 Inspector 320 (300–400); :225 rail with Pages, Site settings in site menu; :259 keep 3 tabs; :336 Data & variables owns conditions; IMPROVEMENT-PLAN:4 Figma-only; BATCH-01A H05/:35 3 tabs, 60/280; workflow-sketch rail with Pages | INS-D07 300 fixed (PDB:737); BD-05/14; BD-08; D13; BD-03 (PDB:72); GEO-01 | Major | Add "SUPERSEDED / historical — do not design from" banner to REPORT, IMPROVEMENT-PLAN, BATCH-01A(+REVIEW.html), workflow-sketch, improvement-progress.json, as done for ARCH:1 |
| D1-7 | contradiction | improvement-progress.json:41 batch01a "REFERENCE STUDY / NOT ACCEPTED"; :146–155 recommends ARCH A | BATCH-01A:5, IMPROVEMENT-PLAN:150,179 "PARTIALLY VERIFIED"; ARCH:1 SUPERSEDED | Minor | Align JSON to "historical/superseded" |
| D1-8 | contradiction | BATCH-01A:23, :54 rename Text style → "Size preset" | PDB:678 FD-INS-02 → "Font-size token" | Minor | FD-INS-02 wins; note in BATCH-01A |
| D1-9 | contradiction | 00:211 "Component library — components shared across the **account's** sites" | BD-16 PDB:218 same (organization) workspace, "not a personal library across all workspaces" | Major | Reword glossary to "shared across the workspace's sites" |
| D1-10 | ambiguity | 00:213 "Assets library — the user's asset list for this site" | PDB:427 discovery filtered by userId, optionally siteId; "Only you see these" | Minor | Glossary: "your assets (personal), filterable to this site" |
| D1-11 | stale | REVIEW:156 "Not done: OD-C3"; REVIEW:161 "172 tickets (P0 19 · P1 24)" | 00:353 OD-C3 decided; BACKLOG:17 174 (P0 20 · P1 25) | Minor | Add dated addendum to REVIEW §E/§F |
| D1-12 | ambiguity | REVIEW:10 "~60 Major" | REVIEW:119–123 13+14+19+14+24 = 84 Major | Minor | Correct count |
| D1-13 | contradiction / missing | RL (PROPOSAL) rows: I4 Behaviour→Settings (RL:104); §5 "visibility is a style" (RL:97); K1 in-place master ribbon P0 (RL:171); G10 min 1280×720 (RL:41); L1/L2 6 rail items (RL:59–60); C2/C5 open (RL:72,74); X1 AI workspace (RL:183) | BD-08 / INS-D01 Visibility in Behaviour (PDB:679); P/13:61,103 Components area; HANDOFF:116 tests 1024×768; BD-05; SC-13/DEC-IA-04; SC-21 | Major | Mark RL superseded by panel set or add disposition column per row (accepted / overridden by X / open) |
| D1-14 | ambiguity | PDB:879 IA-05 page delete keeps "existing … impact handling" | 00:276–277 page delete = Undo + Recently deleted, no confirm; REVIEW:84 "deleting a template page gets no pre-warning" | Minor | State whether collection-page/ link impact is shown in the Undo toast or a non-blocking notice |
| D1-15 | missing | DYN:76 "Record history per CMS rules" | No rule defined in DYN or §E fixes (REVIEW:84 flagged) | Minor | Define or replace with "no record history; Restore from Recently deleted (SC-15)" |
| D1-16 | ambiguity (IDs) | RL uses BK-NN (10-14 Webflow audit, RL:10), D1–D9 (Assets), U1–U8, K1–K7, T1–T7, R1–R11, P1–P11, B1–B9 | BACKLOG BK-001…174; DYN D1–D13; P24 U-1…U-7; P18 K-1…K-8; P15 T-1…T-5; P17 R-1…R-14; PDB P1-D*; DYN B1–B6 (e.g. RL "BK-43" library vs BK-043 access gate) | Minor | Prefix RL IDs (RL-I4) and cite audit as WF-BK-nn |
| D1-17 | missing | SC-9 duplicate rows (00:133 vs :147; :108 vs :121); bell scope; retention | BACKLOG:314, :317, :318 "Open" | Minor | Merge SC-9 rows; record bell-scope decision |
| D1-18 | contradiction | 00-STRATEGY:49 "Later: interactions authoring … AI contract detail" | Panel 19 Interactions SPEC COMPLETE; SC-10:177–180 | Minor | Update §8 scope to include 14–25 and SC-21 |
| D1-19 | missing | 00-STRATEGY:39–45 validation plan | No owner/date; REVIEW:156 "Not done: usability tests" | Major | Assign a gate before Figma of first run (as the plan itself states) |
| D1-20 | ambiguity | 00 section order SC-18 → SC-20 → SC-21 → SC-22 → SC-19 (00:291–356) | Readers searching sequentially miss SC-19 | Minor | Reorder |
| D1-21 | ambiguity | PDB IA-01 tree (:237–257) has no Components node | 00:220 Area list includes Components; P/13:61 Components workspace; PDB:275 mentions it | Minor | Add Components area to IA-01 tree |
| D1-22 | stale | REPORT:7 calls ARCH "the architecture decision" | ARCH:1 SUPERSEDED | Minor | covered by D1-6 banner |
| D1-23 | missing | Q9 package/version policy blockers listed (PDB:456) | Closure claimed in IAF-11/PKG-01 annex (not in D1 scope) | Minor | Cross-check by annex auditor; UNKNOWN here |

### From D2-panels-00-13

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| D2-1 | missing | 00-STRATEGY:5 "Each panel's §3 should name which job (§3) it serves" | No panel 01–13 names a job; every §3 is "Problems" (grep 0 hits) | Major | Add one "Job: J1/J2/J3/S" line to each §1 |
| D2-2 | ambiguity | SC-16 (00:284) "A panel with an open ⛔ dependency shows 'SPEC COMPLETE · blocked by…'" | 05 §5 and 09 §5 specify document ⌘Z, which depends on ⛔ U-1 (00:128), but their status lines carry no "blocked by" | Minor | Add "blocked by U-1 (interim guard)" or state why it doesn't apply |
| D2-3 | contradiction | 00:29 search fields (incl. Layers): clear, then a second Esc **blurs** | 00:36 and 04 §9 "Layers: clear search → **no-op**" | Minor | Pick one; recommend blur for every search field (SC-2 exception) |
| D2-4 | contradiction | 01 §6 group "Collaborate" | Same group holds "Unpublish site…" (01:141, empty group cell) | Minor | Move Unpublish into "This site" or a "Danger" group |
| D2-5 | stale | 01 §4 diagram "● Waiting · Sara ›" | 01 §5.4 chip states (amended) have no "Waiting · {name}" | Minor | Redraw the diagram with a valid chip state |
| D2-6 | stale | 01 §10 "Presence … (+ optional people popover)" | 01 §5.6 click opens the People popover (Panel 21) | Minor | Drop "optional" |
| D2-7 | contradiction | 10 §5 interim layer 1 is mandatory: re-read and show "Changed elsewhere — Review" before writing | 10 T-ST-04b "two sessions save in turn → second write wins" | Major | Rewrite T-ST-04b to assert the read-compare-write prompt |
| D2-8 | contradiction | SC-15 (00:275-276): confirms only for the listed cases; "any other confirm … is overridden" | 01 §6 Duplicate site confirm; 10 §5 Languages add/remove locale confirm; 13 §6 Update from selection confirm; 13 §5 duplicate-name "create anyway?"; 13 §9 Detach instance confirm | Major | Either add each to the SC-15 exception list with a reason, or replace each with Undo |
| D2-9 | contradiction | 07 §8 "Delete permanently (typed confirm, ADMIN+)" | 13 §4 "Delete permanently (ADMIN+, non-typed confirm)" | Minor | One rule in Panel 24 §4.8; panels cite it |
| D2-10 | contradiction | SC-3 toast "N elements deleted · Undo" | 07 §5 "Deleted — Restore"; 11 §5 "… · Undo · Recently deleted ›"; 08 §6 copy unspecified | Minor | One toast pattern: "{name} deleted · Undo · Recently deleted ›" |
| D2-11 | missing | SC-14 (00:269) locked descendants: Layers-only select + outline inherited-lock marker | 04 §5 markers list only 🔒; 04 §6 lock rules don't mention descendants | Major | Add the inherited-lock marker, its accessible name and its refusal copy to 04 §5/§6 |
| D2-12 | missing | SC-17 (00:289) multi-selection toolbar "Duplicate · Delete · Group · More" | 05 §6 "Duplicate · Delete · More — buttons unchanged" (single only) | Minor | Add the multi-select toolbar row to 05 §6 |
| D2-13 | missing | SC-13 (00:263-266) Inspector override dot, "Tablet" label, Reset to parent, "N overrides", first-time note; toast "applies to all breakpoints" | Not in 06 delta; 05 §7 only "Editing Tablet" label | Minor | Add SC-13 rows to 06 §2 and 05 §7 |
| D2-14 | contradiction | SC-3 "one registry; every menu draws from it" | 04 §7 adds Show on canvas, Copy link, Paste into/after, which are not in SC-3 | Minor | Add those rows to SC-3 (Layers column) |
| D2-15 | missing | SC-3 canvas column has Select children, Move to page, Move up/down/into/out, Lock ⌘⇧L | 05 §6 menu = "CV-16 kept + Show in Layers"; CV-16 lacks them | Minor | Replace the 05 menu row with "per SC-3" + grouping order |
| D2-16 | contradiction | 03 §8 "GEO-01's 40px list row applies to resource lists (records, assets, pages)" | 11 §5 Pages manager rows 32h; Recently deleted rows 32 (07 §8, 13 §4 via Panel 24) | Minor | Decide whether pages are a resource list (40) or a tool list (32); amend GEO-01 note |
| D2-17 | ambiguity | 06 header "300px fixed (INS-D07)" | 05 §9 and 06 B5 "obscures 312"; 12 §4.5 overlay "+12 inset" stated only for tasks | Minor | State the Inspector overlay inset (12) once in GEO-01 |
| D2-18 | gap | 05 §9 one-row toolbar needs ≈750+ | 12 §4.5 canvas region at 1440 with a docked task = 740 | Minor | State that the 05 collapse order applies whenever a task docks, and verify at 1440 |
| D2-19 | contradiction | 09 §8 preview "fixed width … min 360 … no splitter" | 09 §4 and §11 "360–520"; the <1280 rule is written twice in §8 | Minor | One rule: fixed 468, shrinks to 360, toggle below 1280 |
| D2-20 | missing | Panels 03/04/05/08/11/12/13 define loading | 07 §11 and 09 §10 have no loading state | Minor | Add loading rows (skeleton pattern) |
| D2-21 | missing | 01, 07, 08, 11 define offline | 03, 04, 05, 09 (autosave), 10 (Save), 12, 13 do not; 09 has no autosave-failure state | Major | Add offline and apply-failure rows, at least for 09 and 10 |
| D2-22 | naming | SC-11 (00:220-221) "Area" for editor destinations; "Workspace" = organization only | 02 (33×), 08 (25×), 13 (22×), 07 (14×) use "workspace" for areas | Minor | Rename in the next edit; UI copy must use "area" names only |
| D2-23 | naming | SC-11 "Main component", not "master" | 13 uses "master" 13×, 04 3× | Minor | Replace |
| D2-24 | naming | SC-11 never "library" alone | 03 §6.6 tag "Library"; 13 §4 "Library · v4"; 08 §5 "Not saved to library — Retry" | Minor | "Component library · v4"; "Not saved to Assets — Retry" |
| D2-25 | naming | 01 §9 and 07 §4 "Planned" | 10 §7 "SEO analysis · Planned" card that says "Coming soon"; T-ST-09 "Coming soon" | Minor | One label: "Planned" (flagged-features rule) |
| D2-26 | naming | SC-11 "US English in UI copy" | 09 §4.1 "Counts stay on Colours", BR rows; 03 body "favourites" next to UI "FAVORITES" | Minor | US spelling in any string that ships |
| D2-27 | stale | SC-21 every AI path inactive; 12 T-RT-04 marked inactive | 09 T-BR-05 AI Apply acceptance not marked inactive | Minor | Mark T-BR-05 "(inactive — SC-21)" |
| D2-28 | inconsistency | 12 §4.3 "Rail navigation, page switching and workspace changes use the same guard contract" | Guard copy varies: 01 §7.1 Stay/Leave anyway/Save & leave · 02 §7 Keep editing/Leave and lose changes · 10 §5 Keep editing/Discard/Save and continue · 12 §4.3 Keep/Discard | Minor | One guard dialog in SC (title, three verbs) with declared variants |
| D2-29 | missing | CLAUDE.md: DESIGN.md owns type, colour, motion | No panel 01–13 cites DESIGN.md; no type scale, contrast or motion lines | Major | Add a SC row "visual tokens per DESIGN.md" + per-panel type/contrast hooks |
| D2-30 | missing | 04 §5 dimmed rows 50% opacity; hidden rows muted italic | No contrast floor for de-emphasized text | Minor | Add a minimum contrast for dimmed/hidden row text |
| D2-31 | ambiguity | 07 §8 "Records Status filter gains Recently deleted … same list hosts deleted fields and collections" | A deleted collection's records filter is unreachable once the collection leaves the nav; Restore collection has no stated location | Major | CMS nav-level "Recently deleted" entry (like 08/13) hosting records, fields and collections |
| D2-32 | ambiguity | 03 §6.5 card "120×(65 thumb + 24 label)" | 03 §8 card width = (panel−32)/2 ≈ 126 at 284 | Minor | Card width = fluid formula; drop the 120 |
| D2-33 | ambiguity | 01 §5.3 Site settings: overview first, then last group "for the session" | 10 ST-02 "last screen remembered per site" (persistent) | Minor | State the persistence scope once (session or per site) |
| D2-34 | missing | 08 §5 interim: status "Image not uploaded yet — Retry" at Save-failed tier | 11 §8 status list and SC-4 priority do not include this text | Minor | Add it to the 11 status table under Save failed |
| D2-35 | gap | 00-STRATEGY §4 Change step = CMS/Assets/Brand | Components and Templates areas have no rail door; 13 relies on ⇧A, ⌘K and links | Minor | Record the door decision explicitly (keep as is with reason, or add a visible door) |

---

### From D3-panels-14-25

| ID | Type | Statement A (cite) | Statement B / what is missing (cite) | Severity | Proposed resolution |
|---|---|---|---|---|---|
| D3-1 | contradiction | 14 §5.2 has a Blocking row "Motion that never stops on an automatic trigger (WCAG 2.2.2)"; 19 §5.8 adds it to Publish | 25 §4.4 `publish_blocked.check_ids` closed enum lists only `vercel_connected, pages_ready, collection_lists, site_size, password_on_free, unresolved_images` (+ hard blockers). 25 says "Panel 14 owns the list", and T-AN-19 requires one value per Blocking row | Major | Add `motion_wcag_2_2_2` (or similar) to the enum |
| D3-2 | contradiction | 15 §6 Offline: "Create/Replace edit the document and save through the normal queue" (marked assumption) | 22 §5.3: "Needs a connection: … **Templates apply** … disabled with 'Needs a connection'" | Major | Choose one. 22's rule is safer: the backup checkpoint needs the server (15 §6 admits this) |
| D3-3 | contradiction | 16 §4.4: achievement toast in the checklist corner (bottom-left), 6 s, own `role=status aria-live=polite`, "stacked above Undo toasts … without covering them" | 22 §5.10: "≤1 transient + ≤2 persistent" (newest transient replaces), position bottom-right above the toast floor, "toasts stop owning a live region" | Major | Make the achievement a persistent-class toast in the 22 stack, or exempt it explicitly in 22 §5.10; one live pipe |
| D3-4 | contradiction | 23 §5.5: trial-ended "non-modal notice under the topbar … ✕"; 23 §8 `role=status` | 22 §4.2 banner priority list has no trial-ended entry; 22 §6 "trial reminders stay notifications + email, not banners"; 22 §8 "banners carry no live role" | Major | Add "Trial ended" to the 22 §4.2 list (info tone, dismissible per user per workspace) and drop `role=status` |
| D3-5 | ambiguity | SC-20 / 23 §4.2 / 01:128: ⋯ menu header shows the plan chip | SC-18 / 18 §5.1 / 01:142: ⋯ menu header entry "Search ⌘K" | Minor | Define the header as two rows (Search ⌘K, then plan chip) or put Search in the header and the chip as the first row |
| D3-6 | contradiction | SC-15: confirms only for the listed cases; "Any other confirm in panel text is overridden" (00:275-276; 24 §4.9) | Confirms not on the list: republish confirm (14 §5.6); Replace page confirm (15 §5.3; create confirm until T-4 is in SC-10 but not SC-15); Reload latest + Overwrite confirms (22 §5.4); "Remove protection and publish" confirm (23 §5.6); active-set Save confirm (23 §5.5a) | Major | Extend the SC-15 list with consequence confirms (replace, reload/overwrite, protection removal, active set, republish), or remove them from the panels |
| D3-7 | contradiction (AI leak) | SC-21 hides "History AI summary"; 12:96 "AI summary is hidden in this version" | 12:142 T-RT-09 "Saves inline compare still shows Visual/Semantic/AI summary" | Major | Rewrite T-RT-09 to Visual/Semantic only; AI variant marked inactive |
| D3-8 | ambiguity (AI leak) | 20 §0 / SC-21: `useAutoMilestone` (AI-12 milestone suggestion) is not mounted while the flag is off | 12:96 History target keeps "milestone banner" with no SC-21 mark | Minor (UNKNOWN whether the banner is the AI card) | State whether the milestone banner is AI-12; if so, mark it hidden |
| D3-9 | contradiction (AI leak) | SC-21: hide "AI copy in plan/upgrade dialogs"; 23 §14 pass-2 B3 "AI removed from the Upgrade dialog" | 23 §4.5 rule "Benefit rows are generated from PLAN_LIMITS FREE→PRO deltas"; PL-01 includes AI prompts/day and AI generations/month | Major | Add an exclusion clause: AI keys excluded while SC-21 is active |
| D3-10 | ambiguity | 09:88 keeps "Brand from logo/URL" as a subtask; 20 §1 "not AI" | SC-21 hides "Brand DS-AI entries"; 20 §4.7 "dsAi flag off → From logo/URL hidden (existing)"; root CLAUDE.md `NEXT_PUBLIC_FEATURE_DS_AI` = No | Minor | Decide whether From logo/URL ships this version; if yes, decouple it from `dsAi` |
| D3-11 | stale / scope | 16 §5.4, F-3, T-FR-09: "AI site arrives" flow | 20 §0: the wizard AI path (AI-14) is hidden | Minor | Mark it as legacy-AI-site only this version; F-3 deferred with AI |
| D3-12 | stale | 00-STRATEGY §8: "Later: interactions authoring, AI contract detail, multiplayer editing" | 19 and 21 are SPEC COMPLETE with full scope; 21 is flag-gated, 19 has no deferral | Minor | Update §8 scope and ordering; state whether 19 ships this version |
| D3-13 | stale | 00-STRATEGY §4: "Review task (Panel 12) … Publish task (Panel 12)" | 14 and 17 replaced the RT-10/RT-11 interiors | Minor | Point §4 to 14 and 17 |
| D3-14 | stale | 25 §4.3: Owner column "12 Review" for every review event | 17 owns client review end to end (17 header, SC-10 rows) | Minor | Owner → 17 |
| D3-15 | contradiction | 21 §5.6 / §8: Offline pill announced **assertive** | 22 §8: banners 4–10 (incl. 6 Offline) via the **polite** pipe | Minor | One announcement owner for offline (22 pipe); presence pill silent when the banner shows |
| D3-16 | consistency | SC-6 pattern "{Area} needs Editor access" (18 §7) | 14 §6 "Viewers can't publish — ask an editor"; 15 §6 "Viewers can't change pages"; 22 §5.11 "Form submissions need Editor access"; 18 "Editing needs Editor access" | Minor | Add a role-reason row to SC-11 / SC-18 with the canonical forms |
| D3-17 | consistency | 22 §5.3 "Needs a connection" | 14 "Can't publish while offline"; 18 "Can't do this while offline"; 24 "Can't restore while offline"; 17 client "You're offline — reconnect to approve or send" | Minor | One offline reason pattern in 00 |
| D3-18 | stale label | SC-16: a panel with an open ⛔ dependency shows "blocked by" | 15 status "SPEC COMPLETE · not VERIFIED" while T-TP-13 needs ⛔ P-TRIAL; 18 labels the same case "blocked by P-TRIAL (T-CP-07 only)" | Minor | 15 → "blocked by P-TRIAL (T-TP-13 only)" |
| D3-19 | ambiguity | 16 §7 `first_canvas_edit` "first committed document change **by the user** on this site" | 25 §4.2 "by **any** user, once per site"; 16 T-FR-11 "once per site" | Minor | Align 16 §7 wording to 25 |
| D3-20 | stale (AI) | 12:70, 22 §5.9 "all six tasks" | SC-21 hides the AI task → 5 tasks ship | Minor | "all tasks (six; five while SC-21)" |
| D3-21 | missing | 21 §5.2 banners "Ana saved changes · Get latest", "Ana applied the starter…" | 22 §4.2 banner priority list has no slot for them | Minor | Add a "Teammate change" entry (info) or declare them canvas-level |
| D3-22 | missing | 19 §5.4 IXD-3: Preview and `/share/<token>` run the interaction runtime | 17 §4.1 client snapshot `sandbox=""` (scripts off); not stated that interactions never play for the client approving | Minor | State it on the client page ("Animations don't play in review") or include `/review` under IXD-3 |
| D3-23 | consistency | 22 §7 Locked-on-Free banner actions: Upgrade / Ask the owner | 23 §5.5 Sites row banner: "Upgrade to edit and publish · Choose what stays active (owner)" | Minor | One banner sentence and action set; 22 §7 adopts 23's owner action |
| D3-24 | missing | 15 §5.5 saved template Delete "(Undo toast)" via `userTemplates.delete`; 24 row 44 "Delete → toast Undo" | UserTemplate has no `deletedAt` (24 UN-15); a hard delete means Undo must re-create (new ID) or use a grace window — unspecified | Minor | Specify grace-delete (as assets) or re-create with honest copy (24 §4.4) |
| D3-25 | stale citation | 23 §6 plan unknown → "unlocked-but-pending … same rule as unknown role, `SettingsTab.tsx:679-688`" | 10 §6 / 15 §6 changed the unknown-role rule to "unknown ≠ grant" (writes disabled) | Minor | Keep the plan rule (the server decides) but remove the outdated role precedent |
| D3-26 | missing | 14 §4.1 Checks list (13+ rows) and "See all ›" | No overflow or cap rule; "See all ›" destination not stated (vs 14 §5.1 rows open Compare) | Minor | Cap shown rows + "Show all n"; name the See all target |
| D3-27 | ambiguity | 12 footer 48 "only for tasks with actions" | 17 §4.3 shows a two-row footer (composer + "Send Round n+1") | Minor | State the footer height for two-row tasks |
| D3-28 | missing | 23 §5.5a "Choose what stays active" (sites + pages per site) | No search, sort or long-list rule; width not given | Minor | Add list rules (search above 20 rows, sort by edited date) |
| D3-29 | missing | 19 §6 states table | No loading or offline row (even "N/A") | Minor | Add an explicit N/A or behaviour |
| D3-30 | consistency (AI) | SC-3, SC-12, SC-18 AI rows marked inactive | SC-10 row 181 and SC-11 rows "AI prompt" / "AI site draft" (00:228-229) not marked | Minor | Mark them inactive (SC-21) |

---

### From T1-shell

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T1-01 | contradiction | P02 §7: guard dialog (existing `UnsavedTabSwitchDialog`) = **Keep editing · Leave and lose changes** (+ Retry/Stay on failure) | P10 §5 "Dirty guard": existing dialog = **Keep editing / Discard / Save and continue**, applied to rail clicks and Back to Editor. INV 4.11: "Keep editing vs a leave action" | Major | Define one guard dialog in P00 (button set, when "Save and continue" is offered) and point P02/P10/P12 at it |
| T1-02 | contradiction | INV 4.11 (`useTabSwitchGuard`): guard covers "staged Brand" | P02 §7: "Brand stays unguarded (autosave) — inventory 4.11 is corrected". SC-4/P11 §8: Brand has a local "applied locally" state before receipt | Major | Code-read is UNKNOWN which one is true. Settle it from source before spec, and state whether "applied locally" counts as dirty |
| T1-03 | contradiction | P01 §6: Duplicate site "Confirm → toast Open · Keep" | P00 SC-15: confirms remain **only** for the listed cases; "Any other confirm in panel text is overridden" | Minor | Either add "Duplicate site" to the SC-15 list (it is not destructive, so likely drop the confirm) or amend P01 §6 |
| T1-04 | contradiction | P10 ST-04 / §… "Danger zone: unchanged actions and confirmations" (delete = typed DELETE, INV 11.10) | SC-15 exception list names transfer and unpublish but **not site delete**. Sites have a 30-day Recently deleted (P22 GS-06), so Undo/restore is possible | Major | Add "delete site" to the SC-15 declared exceptions or specify an Undo + Recently deleted path. Add the 30-day restore line to the "{site} deleted" screen (INV 11.10 note) |
| T1-05 | stale | CPres M01-3.4 / 3.16 / 3.17 / 11.10: "Move → IAF-14 Topbar → Site settings → named screen" | P01 §6 keeps Duplicate site, Site health ↗, Invite ↗, Account ↗ in the ⋯ menu ("Keep") | Minor | Update CPres dispositions to P01 §6 (panel spec is newer) |
| T1-06 | stale | CPres M01-13.6: scope chip "Defer" | P18 §5.1/§9: redesigned "In {Area}" removable chip | Minor | Update CPres |
| T1-07 | contradiction | CPres M01-2.8: review-closed toasts "Keep" | P22 §4.1/§5.10: toasts only for the outcome of the user's own action; events from elsewhere → bell (L6). P17 §4.4: client events → bell "Feedback" | Minor | Decide: retire the in-session toast in favour of bell + chip change, or declare it an exception in P22 §5.10 |
| T1-08 | contradiction | P15 (line 119): NEW door "Pages row menu › Save as template…" | P11 §5 row-menu list (Rename … Delete) has no such row. P15 also lists only a "name field" while INV 11.5 has name + description | Minor | Add the row to P11 §5. State whether the description field is kept |
| T1-09 | ambiguity | INV 8.1: Preview covers the top bar. SC-1 lists "Preview bar" as a 56px work-area header | P01 §1 "same topbar in every module workspace" and T-TB-10 list areas but not Preview. P01 §5.8 says "full-work-area Preview" | Minor | State explicitly whether the global topbar stays visible above the Preview bar |
| T1-10 | ambiguity | INV 14.4: "⌘, Settings". P10 ST-01: "⌃,/⌘," | INV 3.2 / P01 §5.3 / §6: "⌃, / Ctrl+,". SC-12 has no Site settings row (on macOS ⌃ ≠ ⌘) | Minor | Add a Site settings row to SC-12 with one macOS key |
| T1-11 | missing | INV 1.6 / 14.4: ⌘\ toggles the Inspector; "Show inspector ⌘\" button | Absent from the SC-12 table, P18 sheet groups and P12. P05 §9 names only a "canvas-corner Inspector door" | Minor | Add an SC-12 row plus a P12/P05 control contract for hide/show (label, placement, persistence) |
| T1-12 | missing | INV 1.11: Skip to Canvas link (stays tabbable under full-page views, UX-22) | No panel specifies it. Only CPres M01-1.11 → IAF-01 | Minor | Add it to P02 §8 or P05 §10: target per area, hidden when the canvas is replaced |
| T1-13 | missing | INV 6.3: bell counts all unread but lists 5 | P01 §5.7 / P22 §5.11 keep 5 rows. MS IAF-19 E: "full inbox entry preserved". No full-inbox or Load more spec | Minor | Specify "View all notifications" or Load more, or make the badge count match the list |
| T1-14 | ambiguity | P16 §4.4: achievement toast "in the checklist's corner" (bottom-left), stacked above Undo toasts | P22 §5.10: toasts sit 16 above the toast floor in the canvas column, ≤1 transient | Minor | Name one position; say whether the achievement counts against the transient cap |
| T1-15 | missing | INV 12.2: Getting-started chip at the rail foot above Help | P16 §4.3 moves it to bottom-left above the bottom bar. Not in P16 §8 preservation map; P02 §9 rail height omits it | Minor | Add a "Move" row to the P16 §8 map |
| T1-16 | ambiguity | INV 10.12: mirror/sync failures as toasts with "Retry now" | P22 §4.1 assigns persistent conditions to banners and save state to status. P11 §8 shows only "Sync queue (N waiting)", and P22 §1 sends per-owner messages out of scope | Minor | Assign sync failures to one level (status details row with Retry vs banner) |
| T1-17 | missing | INV 7.7 / 7.9: fix-failed band copy; issue messages "developer-facing" (L4-039) | P12 keeps "bands" by reference. CPres M01-7.9 says "Redesign", but no copy is specified | Minor | Add an Issues copy table (message, location, Fix label) to P12 §5 or P14 §5.2 |
| T1-18 | ambiguity | INV 10.4: RecoveryBanner "Discard & reload" (local crash draft) | SC-15 / P22 §7: discarding a **kept unsaved copy** needs a confirm. P22 keeps RecoveryBanner unchanged, with no rule for its Discard | Major | State whether RecoveryBanner's Discard falls under the same SC-15 exception |
| T1-19 | missing | INV 5.2: "+" not withheld in view mode | P11 §9: viewer Pages button disabled. Strip "+" for viewers/view mode is not stated | Minor | Specify "+" hidden or disabled-with-reason for viewers |
| T1-22 | stale | MS IAF-22 E: status labels "Saved at… / Offline—local changes / Saving revision…" | P11 §8: "Saved {time} / Offline — not saved / Saving…" | Minor | Align MS to P11 (P00 SC-4 wins) |
| T1-23 | missing | INV 8.3: fonts and colours differ between canvas and Preview (UX-09); "users can't trust it as what ships" | SC-8 fixes width; P19 IXD-3 fixes scripts. No doc addresses font/colour parity | Major | Add a parity requirement (or a visible limitation line) to SC-8 / IAF-15 |
| T1-24 | missing | INV 1.17: "Project update failed" (design-system schema) load toast | No surface level in P22 | Minor | Map it to the P22 ladder (banner vs toast) |
| T1-26 | stale | MS IAF-21 E: checklist order "Set brand, Add page, Add block…" | P16 §4.3 reorders it (section, preview first). Only IAF-21 H carries the amendment | Minor | Amend IAF-21 E |
| T1-28 | ambiguity | INV 11.4: "Set up Products collection" auto-offered on first product block (✅) | CPres M01-11.4: "Keep → IAF-23 … unsupported UI explicitly deferred". No panel mentions it | Minor | State keep / defer in P07 |
| T1-29 | missing | INV 11.9: Permissions dialog (⌘K "Permissions", viewer notice) | P18 §5.2 target index has no Permissions row. No panel specifies dialog content or states. P10 sketch only links "Permissions" | Minor | Add a Permissions row to P18 §5.2 and a short contract (content, roles, Delete site door) |
| T1-30 | missing | INV 15.4: "Connect to tokens" toast after a template lands raw values | P09 names only the Brand-checks subtask. P15/P22 do not specify the trigger toast | Minor | Specify the trigger, copy and action in P15 §5 or P09 |

### From T2-canvas

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution (design-level) |
|---|---|---|---|---|---|
| T2-1 | contradiction | SC-17: multi-selection toolbar "Duplicate · Delete · Group · More" | P05 CV-11 / §6: toolbar for single selection, "buttons unchanged"; INV 7.3 hidden in multi | Major | Amend P05 §6 to SC-17. Specify anchor (combined box) and the small-box rule |
| T2-2 | stale | SC-3 canvas column adds Move to page, Select children, Move up/down/into/out | P05 §6: "CV-16 kept + Show in Layers" only | Minor | Align P05 §6 and §11 with SC-3 |
| T2-3 | missing | SC-3 lists actions without order | No menu order or grouping for the canvas menu; IA-02 (INV 11.2) unresolved | Major | Define one group order for the SC-3 surfaces (edit / clipboard / structure / arrange / state / destructive last) |
| T2-4 | missing | INV 11.2 / SC-3: one registry, eligibility-filtered | No per-element-type actions (text, image, link, instance, Collection list) on canvas | Major | Decide whether a type-context group sits at the top of the menu, from the existing registry actions only |
| T2-5 | contradiction | P05 §6: "Tab from selection box enters handles" | P05 CV-21 / §10: "Tab cycles elements … Canvas keys unchanged"; REVIEW §7:77 | Major | Pick one key to enter handle mode (for example Enter on the selection), keeping Tab = element cycle |
| T2-6 | missing | INV 6.8: multi-resize handles only resize the primary element | P05 CV-10 "kept"; no hide-or-wire decision; REVIEW §7:73 | Major | Decide: hide handles in multi-selection, or specify proportional multi-resize with acceptance |
| T2-7 | missing | FDB FI-02 / T-FI-02: duplicate/paste must keep breakpoint and :hover styles | No panel acceptance; P24 row 3 "Duplicate, paste … Keep" | Major | Add T-FI-02 as a P05 or P24 acceptance row |
| T2-8 | missing | INV 13.2: cancelled ⌘-drag clone leaves the copy | Not in any doc (FI-02 covers styles only) | Major | Esc / cancelled clone-drag removes the copy; add to P05 §6 Esc ladder step 1 |
| T2-9 | contradiction | P05 CV-15: format bar has bullets/numbers; "Enter commit" kept | INV 8.4: Enter always commits, so lists can't get a 2nd item and there are no line breaks | Major | Define Shift+Enter (line break) and Enter-in-list behaviour; commit = blur / ⌘Enter / outside click |
| T2-10 | contradiction | P04 §8: Group refuses locked members "(existing)" | INV 11.14 + REG M02-11.14 Fix: Group/Ungroup skip the lock gate | Major | Mark P04 §8 Group refusal as Fix, not existing; include Ungroup of a locked container |
| T2-11 | missing | INV 7.5: marquee only starts in a 20 px strip; selects parent+children | P05 "marquee kept" | Major | Specify the start rule (for example a modifier-drag from inside the page) and same-depth selection |
| T2-12 | missing | INV 7.6, 3.5: marquee and W×H pill not zoom-compensated | P05 compensates resize bounds only | Minor | Extend the compensation rule to all overlays |
| T2-13 | missing | INV 11.4: canvas menu unclamped | P04 §10 clamps the Layers menu only | Minor | One clamp rule for every menu and popover (viewport −16) |
| T2-14 | missing | SC-18: disabled actions show their reason (palette) | No rendering rule for reasons in canvas menu rows (INV 11.5) | Minor | Reuse the SC-18/P18 disabled-with-reason row pattern in the canvas menu |
| T2-15 | stale | REG M02-13.15 Keep (legend), M02-2.2 Defer (Wide), M02-6.18 Defer (breadcrumbs) | P18 §9 retires the legend; P05 revives Wide (preset) and breadcrumbs | Minor | Annotate the register rows as superseded by Panels 05/18 |
| T2-16 | stale | REG M02-7.4 Keep (multi-delete confirm) | SC-3: delete never confirms | Minor | Annotate the register |
| T2-17 | stale | INV 16.1: runtime "plays in preview/published" | P19 IX-09/IX-11: never runs on canvas; preview strips scripts | Minor | INV correction; P19 is authoritative |
| T2-18 | ambiguity | P19 §4.3 exposes "Reverse when the pointer / focus leaves" | No IXD dependency implements reverse in the published runtime; editor reverse is a placeholder (P19 §13-15); UNKNOWN for WAAPI | Major | Add an IXD row or hide the toggle until reverse runs in output |
| T2-19 | contradiction | INV 15.2: up to 3 avatars | P21 CO-08 / §4.1: ≤2 avatars + "+N" | Minor | Re-read `Presence.tsx`; fix whichever doc is wrong |
| T2-20 | ambiguity | INV 3.4: zoom to selection also on ⌘K | SC-12: ⌘K = palette (Global incl. Field); P05 Zoom omits ⌘K | Minor | State explicitly that the ⌘K zoom alias is removed |
| T2-21 | missing | INV 2.4 (re-fit on switch), 2.5 (width label under page) | P05 §5 Remember view and width field are silent | Minor | State: breakpoint switch → Fit if the frame doesn't fit; width label replaced by the toolbar width field |
| T2-22 | missing | INV 6.14 / UX-07: caption overlaps content | REG Redesign only; P05 §6 silent | Minor | Remove the caption (tooltips carry shortcuts) or place it outside the element |
| T2-23 | missing | INV 1.11: placeholder copy names the removed "+" control | No doc | Minor | New copy pointing to Add / drag |
| T2-24 | missing | INV 12.8: "added ✓ added" toast | REG Fix only | Minor | Toast copy rule: "{name} added · Undo" (P22 §5.10) |
| T2-25 | missing | INV 4.1 UX-01: empty CTA clips at 1280×720 | P16 §4.1 has no geometry or short-height rule | Major | Add a short-height layout (cards → row of 2 / scroll) to P16 §4.1 |
| T2-26 | missing | DESIGN.md:213 accent only for selection outlines and the like | Canvas overlay colours (guides, box model, badges, Drop here, pins, reorder grip) undefined; raw hex (INV 5.3) | Major | Define a canvas-overlay token set in P05 §9, with the accent restricted to selection/drop-target |
| T2-27 | ambiguity | P05 §8 Loading: "Existing skeleton" (canvas) | P22 §5: one shell skeleton replaces two (Fix GS-04) | Minor | State whether the canvas skeleton remains inside the shell skeleton |
| T2-28 | ambiguity | SC-3: "Bind to CMS field…" on the canvas menu | P06 A1: CMS binding section retired → bind icon per property row | Minor | Define the landing: open Inspector Content › Dynamic bindings summary, or the first bindable row |
| T2-29 | missing | SC-14: descendants of a locked element are locked | Canvas shows lock styling only on the element (INV 1.8); inherited lock is marked only in Layers | Minor | Specify canvas treatment of inherited lock (cursor + click toast) |
| T2-30 | ambiguity | P05 §5: Desktop frame 1440 + Fit | REVIEW §7:71: about 52 % at laptop widths; handles and text at that zoom not considered | Minor | Add a minimum effective handle hit area at low zoom (§9 Handles) |
| T2-31 | missing | INV 9.4: default grid 10 px is not a preset | P05 "Grid + pane" | Minor | Show the actual size, or add 10 to the presets |
| T2-32 | written detail added 2026-10-19; verification open | INV 9.6/9.7: ruler guide create/move/remove/lock, persisted | [P05 §5.1](../panels/05-CANVAS.md#51-grid-and-ruler-guides--targeted-gap-resolution-2026-10-19) now specifies gestures, non-drag editor, site scope, lock and Undo requirements | Minor | Original omission resolved in writing; geometry/keyboard/runtime, history and lock/persistence integration remain unverified |
| T2-33 | ambiguity | SC-3 "Arrange (front/back)" | INV 11.11: moves sibling order, not z-index | Minor | Relabel ("Move to first/last", aligned with Move up/down) or specify z-index |
| T2-34 | stale | P05 §12 acceptance order T-CV-13, 14, 15 before 11, 12 | — | Minor | Renumber |
| T2-35 | missing | INV 14.6: @mentions | P17 R-3 covers replies and audience only | Minor | Mark @mentions Deferred explicitly |
| T2-36 | contradiction | INV 12.9: media dropped on an image replaces it | P08 §3 problem 1 / IAF-09 E: replace must be explicit | Major | Drop-on-image → insert, with an explicit "Replace image" drop zone / affordance, or declare it the explicit gesture |
| T2-37 | missing | INV 5.2, 5.4, 5.6, 6.7: Alt hover, clone badge, hover grip, resize modifiers | REG-only or a one-word mention; no discoverability surface after the legend is retired | Minor | List the modifiers in the P18 sheet BASICS / Canvas group |
| T2-38 | missing | INV 12.1–12.5: full drag feedback set | P05 CV-13 "drop feedback" kept; no states, copy or tokens | Major | Add a drag-feedback state table to P05 §6 (valid / invalid + reason / between / inside / locked) |

### From T3-pages-add

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T3-1 | contradiction | P03 §6.6: three scopes, "each master listed exactly once"; Library = "not yet on this site" | P13 §4: Component library = "all … adopted or not"; This site includes adopted library copies → an adopted item appears twice | Major | One scope definition in SC-11 / P13; P03 counts derive from it |
| T3-2 | contradiction | SC-15 + P24 §4.9: "Any other confirm in panel text is overridden" | P15 §5.3 keeps the Replace confirm; P13 §6 Update from selection "existing confirm + Undo"; Detach all "existing" (has a confirm, INV D15) | Major | Either add these to the SC-15 exception list or replace them with Undo toasts |
| T3-3 | contradiction | P04 §11: empty "No layers yet" + **Add elements** | P16 §4.6: "No elements yet — add a section to start this page" + **Add a section** | Minor | P16 copy wins; edit P04 |
| T3-4 | missing | P04 §7 tree keyboard move (⌥↑/↓, ⌥Home/End) | P11 §11: Pages manager keyboard has F2, ⌘D, ⌫ only; no reorder | Major | Reuse the same chords on focused page rows, plus a "Move up/down" menu item |
| T3-5 | missing | INV #44: Listings score ≠ SEO tab score | Only CP-reg M03-44 "Fix"; no panel picks a model (blocks FG-008) | Major | Pick one model in P11 §7 / P10 SEO; Listings and the tab pill read it |
| T3-6 | missing | P24 #45 "Saved-version delete: out of scope — IAF-18 owns it" | IAF-18 H/I give no Undo, confirm or Recently deleted for a named version | Major | Decide: Undo toast + server soft delete, or a declared SC-15 exception |
| T3-7 | contradiction | P12 §5 History "Kept: … milestone banner" | SC-21 / P20 §0: `useAutoMilestone` not mounted while the flag is off | Minor | Mark the banner inactive (SC-21) in P12 §5 |
| T3-8 | stale | P11 PG-03 keeps the legend ("● unpublished changes") implicitly | P11 §5 renames the dot "● Unsaved"; target silent on the legend | Minor | State whether the legend stays; align its glyph text |
| T3-9 | missing | P15 §5.5 adds a Pages row-menu door "Save as template…" | P11 §5 row-menu list omits it | Minor | Add it to the P11 §5 menu list |
| T3-10 | contradiction | P03 §8: GEO-01 40px row applies to resource lists "(records, assets, pages)" | P11 §5 manager rows 32h; P24 §4.8 Recently deleted rows 32 (P13 list rows 40) | Minor | Pick 32 or 40 for page lists and Recently deleted |
| T3-11 | missing | P23 l.181 / OD-PL-5: page-level custom code is Pro, locked read-only on Free | P11 §7 "Tabs and fields unchanged", no Pro chip or lock state in Advanced | Minor | Add the Pro chip / lock state to P11 §7 Advanced |
| T3-12 | missing | P24 §4.1 #34 covers move-to-folder Undo | Folder delete ("pages kept") recovery and folder-row anatomy are unspecified | Minor | Add a matrix row (toast Undo re-creates folder, like P24 #27) |
| T3-13 | ambiguity | P11 PG-10: SEO tab "Indexed/Hidden" select | P11 PG-10: Advanced "indexing" toggle, both kept | Minor | One writer, one control; the other becomes a read-only line |
| T3-14 | missing | INV D14: Tablet/Mobile/hover edits on an instance are not recorded as overrides | P13 §7 only fixes positional keys for revisions; SC-13 cascade not applied to instances | Major | State the instance-override rule per breakpoint and state in P13 §9 |
| T3-15 | missing | INV E1: 27-component DS catalogue, invisible | P03 §6.3a Catalog components = 14 block ids (different set); only CP-reg names E1 | Minor | Record a disposition (surface in Add, or Defer) in P03 §7 |
| T3-16 | stale | IAF-04 H (module-specifications.md:207): plain Enter = newline, ⌘Enter generates | P03 §6.4 + SC-10: Enter generates, ⌘Enter alias | Minor (deferred) | Mark IAF-04 H superseded |
| T3-17 | stale | CP-reg l.17: IAF-06 home "Add → Templates workspace" | SC-10 / P15: primary entry Pages → New page; SC-11 noun "area" | Minor | Update CP-reg home text |
| T3-18 | ambiguity | SC-11: "Element — any registered type (69 types)" | INV G1: 52 engine element types; 69 = BIC block records | Minor | Say "69 block types (52 element types)" |
| T3-19 | missing | INV #111 Saves filter, #124 Session keys j/k/g/G | Only CP-reg rows; absent from P12, SC-12 and P18 sheet | Minor | List them in P12 §5 History and the shortcuts sheet, or Defer |
| T3-20 | missing | INV A42: sample copy "Aquibra", "© 2024 Buildrick", emoji social icons | Only CP-reg M04-A42 "Redesign"; no content spec | Minor | Add a block sample-content line to P03 §6.5 |
| T3-21 | ambiguity | SC-12: ⌘⇧V Paste HTML is **Canvas scope only** | P03 AD-01/§6.8: ⌘⇧V shown on the Add ⋯ menu (focus in Add) | Minor | Define whether Add-panel focus counts as Canvas scope |
| T3-22 | missing | INV #133: Activity states (no site, empty, error + Retry, permission → dashboard) | P12 §5/§6 say "states" only | Minor | Restate the four states in P12 §5 Activity |
| T3-23 | ambiguity | SC-12: "/" focuses area search (Global) | P11 does not say whether "/" reaches the Pages manager search (sheet, not an area) | Minor | State it in P11 §11 |
| T3-24 | missing | INV #79: built-in templates insert literal colours (L4-024 owner default: re-author on semantic tokens) | P15 §4.1 changes copy only | Minor | Record the re-author decision or a Defer in P15 §11 |
| T3-25 | missing | INV A32: L1-029 tip stacking open | P03 §10 "kept", P16 FR-14 "unchanged"; no arbitration | Minor | One-coach-at-a-time rule in P16 |
| T3-26 | missing | INV D18 / L2-020: master thumbnail blank for light-on-dark | P13 §4 puts a thumbnail on every row; fix not specified | Minor | Specify a thumbnail background / fallback in P13 §4 |
| T3-27 | missing | INV #8: Pages no-results lacks Clear search | P11 target silent | Minor | Adopt the Add/Templates pattern (copy + Clear search) |

### From T4-assets-cms-forms

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T4-1 | missing | Forms are a full INV family (23 rows, INV:1170–1209) | No Forms panel in P/ or in the PDB panel index (PDB:1014–1031); P/06 has 0 form rows | Major | Consolidate IAF-13 + FORM-01 + INS-06 + REPORT form contract into one Forms panel (or a P/06 + P/10 section) |
| T4-2 | contradiction | CPC:65 "Saved to your site directly"; P/10 T-ST-02 "Forms live" | INV:1190: honeypot and message reach the live site only after republish | Major | Scope chip "Applies on next publish" for spam protection and message |
| T4-3 | stale | P/08 AS-07 + §5: "real progress (existing 75→99)" | INV:1013, 1072: synthetic 25/50/75, stalls at 75 | Minor | Mark progress as Fix (needs `onUploadProgress`); update T-AS acceptance |
| T4-4 | contradiction | P/08 §9: near-limit warning at 90% | P/23:103 ≥80% (existing 80%); INV:1014 ≥80% | Minor | Use 80% (SC-18 line) everywhere |
| T4-5 | contradiction | P/08 §4.1 Type filter includes "Audio" | P/08 §5, §11: audio not uploadable; no local audio assets | Minor | Drop Audio from the filter until the server accepts it |
| T4-6 | gap | P/08 §6: folder delete moves assets to All (no confirm stated); SC-15 drops unlisted confirms | MS IAF-09 G "no fake global Undo" → no confirm and no Undo; INV:1049 confirms today | Minor | Give folder delete an Undo toast (restore folder + membership) |
| T4-7 | missing | INV:1179 password value stored and emailed in plain text (🐞) | No spec answer; CP:712 maps it to "After submit" | Major | Spec: hide Password inside forms, or a warning in Add/Inspector |
| T4-8 | missing | SC-7 / P/10 T-ST-07 rely on "Configure in Inspector" reaching the exact form; INV:1206–1207: `pageId` and `sourceUrl` never saved | No SC-9 dependency row; C21 is register-only | Major | Add an SC-9 row (persist pageId/sourceUrl) with a fallback ("form not on the open page — Open page ›") |
| T4-9 | missing | INV:1075 quota trusts declared bytes (🐞 security/billing) | Only noted (P/08 AS-07, CP:656); absent from SC-9 and the backlog | Major | Register as an engineering dependency |
| T4-10 | ambiguity | CP M05-A rows all read "Rail → Assets; contextual picker…" | A29 is an Inspector modal; B39 (export) → "CMS → Data"; C5 → "After submit" | Minor | Treat CP homes as family-level; give row-level homes for A29/B39/C5 |
| T4-11 | contradiction | CP:671 M05-B13 Products preset "Move → IAF-07" | CP:841 M06-C1 "Redesign, IAF-23 deferred"; P/03 AD-16 e-commerce blocks Defer (the trigger is unreachable) | Minor | One disposition: Defer with e-commerce |
| T4-12 | contradiction | INV:1136 owner default: hide Sources until persisted | P/07 §10 keeps them visible with a banner "Sources reset when you reload" | Minor | Confirm with the owner; record the decision |
| T4-13 | contradiction | REPORT:290: "View submissions" opens the inbox filtered to that form | P/10:105 / MS IAF-13: no per-form filter; site-wide export | Minor | Decide on a per-form filter; if kept, add it to P/10 |
| T4-14 | stale | REPORT:280 lists "upload" among retained form controls | INV:1180 upload field hidden; CP:713 Defer | Minor | Mark as deferred in REPORT |
| T4-15 | stale | PDB:679 "Native form transport stays in Submission → Advanced" | INV:1188: no UI writes `formConfig`; settings removed | Minor | Remove the reference or name the real control |
| T4-16 | gap | P/07 §6: Add field offers 16 types | P/07 §9 keeps the setup modal's starter fields (9 types, stepper bug INV:1099) | Minor | One type list for both dialogs; drop the stepper |
| T4-17 | gap | P/07 §5 conflict → "Changed elsewhere — Review (existing semantics)" | INV:1114, 1156: no view of "theirs"; Keep mine resends the stale copy (data-loss risk) | Major | Spec a field diff, and make Keep mine rebase on the latest version |
| T4-18 | gap | INV:1157: a refused collection's entries still queue and block publish | No local-only marker in P/07 or P/14 | Minor | Add a "Only on this device" collection state + publish row |
| T4-19 | gap | P/08 §9 "Stock not configured" (both providers) | INV:1040 one-provider fallback; INV:1039 filters | Minor | Add a single-provider notice; list the filter controls |
| T4-20 | gap | INV:1036–1037: two icon surfaces (drawer drill-in + Inspector modal) | P/08 names only "Icons (Upload ▾)" | Minor | State one icon picker and its homes |
| T4-21 | missing | INV:1208: submissions auto-deleted after 365 days | No disclosure in any doc (only CP:729 Keep) | Major | Inbox footer line "Submissions are kept 365 days" |
| T4-22 | contradiction | MS IAF-13 G, CPC:67: permanent submission delete with confirm, no Undo | SC-15: "Any other confirm in panel text is overridden"; the exception list lacks submissions | Major | Add submission delete to the SC-15 exception list (hard delete) |
| T4-23 | gap | INV:1131 count includes collections without a collection page | P/11:75 / DYN §14 never state the counting rule | Minor | "Count only collections with a collection page" |

**🐞 data-loss check:** A19/A56 image loss → answered (P/08 §5, blocked ⛔ P1-D18). A33 stock credit → answered. B31 sources → disclosed only, not persisted. B33 conditions → answered (DYN §12). C19 spam/archive disappear → answered (P/10 SET-01). **Not answered:** C5 password plaintext (T4-7), C21 sourceUrl never stored (T4-8), C22 silent 365-day purge (T4-21), B43 stale Keep-mine overwrite (🟡; T4-17), A55 quota (T4-9, not data loss).

### From T5-settings-publish

| ID | type | statement A | statement B / missing | severity | proposed resolution |
|---|---|---|---|---|---|
| T5-01 | contradiction | P/22 §7 Recovery offer: "Restore my edits (Keep)"; §9 GS-11 "same action" | MS IAF-22 H "Restore check current revision…"; INV 1476–1477 P0 BK-04 (overwrites teammate's newer work) | Critical | P/22 §5.2/§7: before Restore, compare the kept-copy time with the server revision; if the server is newer, offer Download a copy + Compare, never a silent apply. Add a ⛔ SC-9 row (fix exists on an unmerged branch, 765343348) |
| T5-02 | missing | INV 1503 / 1409 / 1413 site-scope authz holes still on main | **Correction 10-18:** decided in PDB:173 (P1-D20), PDB:187 (FI-05, T-FI-05), P13:31/62/113, RIH:150; missing only from SC-9 ⛔ and BL | Major | Add the three to BL and SC-9 as ⛔ with a "server refuses cross-site" acceptance; reference feat/phase1-s5-authz 7140abdd2 |
| T5-03 | contradiction | SC-15: confirms remain only for the listed cases; "Any other confirm in panel text is overridden" | P/10 §5 locale remove "with confirm"; §7 Danger zone "unchanged actions and confirmations" (Archive, Delete site); Redirect delete confirm (P/24 row 37 Keep); Set as primary, slug-change confirm, Forms Delete confirm | Major | Decide per action: add Delete site, slug change and Set primary (live-impact) to the SC-15 list, or rewrite P/10 §7 to Undo. Archive and locale remove → Undo |
| T5-04 | contradiction | P/03 l.145, l.202: e-commerce blocks "Defer (P1-D15)" | CP:841 M06-C1 Set Up Products Collection = "Redesign"; brief l.168 P1-D15 is only a "proposed scope decision" | Major | Mark C1 Defer in CP; record P1-D15 as decided or open in SC-22; state the read-only behaviour for existing product blocks (IAF-23 E) |
| T5-05 | missing | INV 1433: Stripe values injected unescaped ("fix before shipping") | No BL/P row (grep StripeInjector = 0) | Major | Add a BL security row even while the commerce UI is deferred |
| T5-06 | contradiction | MS IAF-15 H: "Vue/Next disabled Soon" | INV 1421 note "Don't draw 'Soon' tiles unless planned"; nothing in P plans Vue/Next | Minor | Remove the Soon tiles from the target or record a plan decision |
| T5-07 | ambiguity | P/14 §5.2: "SEO configured" Tip → Settings › SEO | P/10 §7: the title template is only in the reserved Planned card, so the Tip can never clear (INV 1355) | Minor | Change Fix to "How to fix: set a page title on each page (Page settings)" until the SEO arc, or drop the row's title-template condition |
| T5-08 | missing | INV 1321: password protection is silently skipped on Vercel plans without protection | P/10 §7, P/14 §5.2 and §7 have no state for it | Major | Add a Blocking check / failure row "Your Vercel plan can't protect this site" — never publish public silently (same principle as SC-20) |
| T5-09 | missing | Export is a ~7-feature module (INV 1420–1426) | No panel doc in P; only P/01 §6 row + MS IAF-15 (IA level) | Major | Write a short Export panel (or a P/01 annex): dialog geometry, tab order, states, ⌘K entry, plan-lock behaviour (P/23 allows export on locked sites), reduced-motion parity (BL BK-013) |
| T5-10 | ambiguity | SC-21 introduces `NEXT_PUBLIC_FEATURE_AI` (default off) | INV F2 FEATURE_DS_AI (Brand AI + server extractBrandFromUrl) | Minor | State in SC-21 whether DS_AI is subsumed by, or AND-ed with, FEATURE_AI |
| T5-11 | missing | INV 1371 legal line (Privacy · Terms) in Publish | P/14 §4.1 layout omits it; §9 "No capability removed" | Minor | Add it to the P/14 §4.1 footer or record its removal |
| T5-12 | missing | INV 1292 premature validation (UX-21) | P/10 §7 "validation unchanged" | Minor | Add "validate on blur/submit, not on open" to P/10 §7 General |
| T5-13 | missing | INV 1273 load cards blame "your connection" | P/10 has no copy rule; P/22 §5.3 split is banner-only | Minor | Reuse the P/22 split in Settings load/error cards |
| T5-14 | missing | INV 1467 Overwrite keeps no pre-overwrite snapshot (BK-59) | P/22 §5.4 Overwrite "existing confirm" only | Major | Overwrite first writes a "Before overwrite" save to History › Saves |
| T5-15 | missing | INV 1460 session-row restore never triggers save (BK-19) | P/12 RT-12 keeps Session restore; no fix | Major | P/12 / P/24: a restore marks the document dirty and queues a save; acceptance row |
| T5-16 | missing | INV 1479 RecoveryBanner off for dashboard sites | P/22 §4.2 "stays on the canvas (Keep)" | Minor | State whether it mounts for dashboard sites (with the server-newer check, T5-01) |
| T5-17 | missing | INV 1470 CMS bindings too large; 1469 settings mirror refused | P/11 §8 popover owners have no Site settings / bindings row | Minor | Add owner rows or inline copy |
| T5-18 | stale | CP:733, 784, 785 "Defer" for ❌ rows (S3, S54, S55); CP:803 Defer for P17 that P/14 designs; CP:879 Defer for Y27 that P/15 T-TP-18 revives; CP:792 "Keep" for P6 that P/14 changes | — | Minor | Refresh the M06 dispositions in CP against P/10, P/14, P/15 |
| T5-19 | ambiguity | P/10 §7 Workspace doors "open … in a new tab" | INV 1343: an in-pane door card (Close · Open ↗) exists | Minor | Say whether the door card stays (an intermediate step) or the row opens a tab directly |
| T5-20 | ambiguity | P/10 ST-03 Overview "workspace pending deletion strip" | P/22 §5.6 global banner (9) says the same thing | Minor | One surface: banner editor-wide; Overview keeps a row in Needs attention only |
| T5-21 | source question resolved 2026-10-19; verification open | S24 grid size / snap to grid left General | [P05 §5.1](../panels/05-CANVAS.md#51-grid-and-ruler-guides--targeted-gap-resolution-2026-10-19): View → Grid owns existing combined grid/snap control and size | Minor | Source has grid snapping; custom-size resize parity remains an implementation risk, not a runtime pass |

### From T6-inspector-brand

| ID | type | statement A (cite) | statement B or what is missing (cite) | severity | proposed resolution |
|---|---|---|---|---|---|
| T6-1 | stale | B1A:51 H05 "Style/Behaviour/Effects tabs — same IDs/order"; B1A:37 Heading block in Style | PDB:672 INS-D01 four tabs, with Heading level in Content (PDB:677) | Major | Mark B1A tab/placement rows superseded by FD-INS-02; keep only its H-row census |
| T6-2 | contradiction | PDB:678 rename to **"Font-size token"** (all callers) | B1A:23 **"Size preset"** + "Links font size only", heading only; P09 §4.1 "Type styles"; INV "Text style" | Major | Pick one noun in SC-11 and apply it in both the Inspector and Brand |
| T6-3 | contradiction | B1A:84 "Unit changes preserve number and change the stored unit (no implicit conversion)" | PDB:766 INS-D11: convert to preserve the computed size; disable when unresolvable | Major | INS-D11 governs; state in B1A that §Shared control behavior is the as-built baseline |
| T6-4 | contradiction | SC-13 00:263 "per-property **Reset to {parent breakpoint}**" (wins per precedence) | PDB:544 INS-01 "do not label every reset 'Reset to Desktop'"; IC-03 / PDB:628,715 "Remove Mobile override", fallback resolved first | Major | Amend SC-13: label names the removed layer, and the tooltip names the resolved fallback source |
| T6-5 | contradiction | SC-13: dot + "Tablet" label + section header "N overrides on Tablet" + tooltip + first-time note | PM M07-39 Merge; PDB:561 INS-18 "one persistent scope summary… not repeating the same warning five times" | Major | Amend SC-13 to the M07-39 three-level model (context, section count, field source) |
| T6-6 | missing | INV 1588 / PM M07-29 / B1A H31–H32 keep "Apply style to all … on this page" and "Reset style" in Inspector ⋯ | SC-3 00:42–61 registry has no row for either | Major | Add both rows to SC-3 with surface columns |
| T6-7 | contradiction | PDB:676 component variant/reset/detach in the header identity-details subview; PM M07-49 "Edit definition" | P13 §9 "Inspector ComponentRow… Edit main component" (unchanged); SC-11 "Main component", not master | Minor | Align P13 §9 to INS-D01 placement; one label "Edit main component" |
| T6-8 | contradiction | SC-11 00:231 "US English in UI copy (Color…)" | PDB:672 tab "Behaviour"; P09 "Colours", "Colour mode" (sketch "Colors") | Minor | Declare the tab/section labels (Behavior, Colors) or add an exception to SC-11 |
| T6-9 | missing | PDB:746 INS-D07: 32px controls, 12px section padding, stacked labels "for long/complex fields" | No label-column width or inline/stacked threshold. B1A:27 proposes 96/8/164 with 16px padding and 28px controls in 32 rows (conflicts) | Major | Add an Inspector row-anatomy spec (label width, control height, row height, threshold) to INS-D07; retire the B1A numbers |
| T6-10 | missing | PDB:746 section padding given | Section-header height, "Name +" empty-row height and More-settings row height not given | Minor | Add to INS-D07 table |
| T6-11 | stale | B1A:35 "Rail60 + drawer280 + Inspector300" | PDB:750 / GEO-01 rail 56 + panel 284 | Minor | Update B1A or mark it historical |
| T6-12 | contradiction | P09 §8 preview "fixed width, min 360… default 468, no splitter"; nav 240 | MS:537 IAF-10 F "nav 240/detail 320, preview flex" | Minor | P09 governs (later, panel-level); annotate MS |
| T6-13 | missing | INV 1829–1832: rules list, Open action, "Nothing to fix", Ignore + ignored count | P09 §7 says only "findings with Fix actions"; Ignore appears only in CP M08-48 | Minor | Add the Checks page anatomy (row actions, empty state, ignore/restore) to P09 §7 |
| T6-14 | missing | INV 1840 L4-028: starters named after real brands (Stripe, Notion, Apple, Linear, Vercel); two indigo/violet primaries | P09 §7 Starters specifies only preview/apply; grep for the names = 0 | Major | Owner decision: rename starters generically and recolour to pass the banned-hue rule |
| T6-15 | missing | INV 1771: Inspector reads persisted Beginner mode, with no control to change it | P09 §12 "Beginner/pro colour filter → Keep (Pro)" (Brand only); CP M08-12 Defer; nothing for the Inspector | Major | Decide: force Pro in the Inspector too, or delete the Beginner path; record it in P06 |
| T6-16 | missing | INV 1779 UX-18 / 1792: ~58 code-named tokens, groups/search decision | P09 §4 sketch is a flat list; no grouping/search decision | Minor | Decide grouping (semantic/primitive) and search in P09 §6 |
| T6-17 | ambiguity | P09 §4.1 "type styles are no longer listed here — they live in Reusable styles" | P09 §6 Typography "Family, size scale"; Inspector Font-size token binds font-size tokens (PDB:678) | Minor | State which page owns font-size tokens and which page owns type styles |
| T6-18 | stale | CP M08-42 / M08-52 "Keep" (AI generate, logo/URL) | SC-21 hides all Brand DS-AI entries | Minor | Annotate CP rows "inactive per SC-21" |
| T6-19 | missing | INV 1768 L4-029 open: reword "No brand set." → "Using default tokens." | P09 §10 keeps "No brand set." without deciding | Minor | Record the decision in P09 §10 |
| T6-20 | missing | INV 1823: preset binding rows look clickable but do nothing | P09 §4.1 says only "Read-only catalogue" | Minor | Specify non-interactive row styling or a link to the token |
| T6-21 | ambiguity | SC-11 00:223 Restore point = "before a starter or import" | P09 §7 / INV 1842: also created by scale, Dark Auto, logo and theme push; Connect (OQ-4) undecided | Minor | Widen the SC-11 definition; decide Connect |
| T6-22 | missing | INV 1834 L4-024: templates bind literal colours, so Brand edits don't recolour them; INV 1761 template toast "Connect to tokens" | P15 §4.1 fixes only the copy; neither P09 nor P15 specifies the post-template Connect offer | Major | Specify the post-apply Connect-to-tokens entry (P15 → P09 §7) and its owner decision |
| T6-23 | missing | INV 1559 L2-034: one-item Page ⋯ menu | PM M07-5 "Preserve current menu actions" | Minor | Decide the page actions set |
| T6-24 | missing | INV 1719 L3-028: no Redirect page picker; forms unnamed | PM M07-108 lists "Redirect to" without a picker | Minor | Reuse the Link page picker (M07-98) for Redirect |
| T6-25 | missing | INV 1575 Hide inspector "⌘\" | SC-12 table has no ⌘\ row (browser-conflict check not done) | Minor | Add to SC-12 with three-browser acceptance |
| T6-26 | missing | INV 1614 Mixed shown amber | PDB:752 "readable without colour"; no text/visual token | Minor | Specify the Mixed placeholder copy and token |
| T6-27 | missing | INV 1678: spacing-box numbers 16px tall (owner WCAG 2.5.8 exception) | PDB:746 default 32px controls; exception not recorded | Minor | Record the exception in INS-D07 or enlarge the targets |
| T6-28 | contradiction | PDB:725–727 INS-D05: field-type conversion "before confirmation; default Cancel"; column reduction "Remove contents… confirmation"; INV 1640 component Reset/Detach "each with a confirm" | SC-15 00:275–276 lists the only allowed confirms; "Any other confirm in panel text is overridden" | Major | Add these to SC-15 exceptions or restate them as Undo-only |

### From T7-design-system-engine

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T7-1 | contradiction | Rail 60 (DESIGN.md:232; tokens.generated.css:132) — *note 10-18: GEO-01 (RIH:93) and P02:133 already chose 56; this is DESIGN.md/token drift, not an open choice* | Rail 56 (02:133; RIH:100) | Major | Pick one; regenerate token via Figma before build; update DESIGN.md §Layout |
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


## 7. Open questions register

| # | Open item | Where | Status note |
|---|---|---|---|
| Q1 | Bell scope: site-scoped vs workspace notices in one bell (BK-148/155) | BACKLOG:314 | Open |
| Q2 | Collab op-log retention 24 h vs 7-day cron | BACKLOG:317 | Open (code) |
| Q3 | Duplicate SC-9 rows (settings conflict, library, receipts, Compare) | BACKLOG:318; 00:108/121, :133/147 | Open |
| Q4 | Validation plan (5 interviews, 5-user tests) — no owner/date | 00-STRATEGY:39–45; REVIEW:156 | Not done |
| Q5 | Funnel events "to define per panel" | 00-STRATEGY:36 | Partly covered by Panel 25 (not D1-verified) |
| Q6 | "Record history per CMS rules" undefined | DYN:76; REVIEW:84 | Open (no fix in §E) |
| Q7 | Multi-reference fields not in model; "contains any of" waits | DYN:429 | Open |
| Q8 | Server filter/sort/pagination parity at publish | DYN:430; 00:118 | Engineering dep (BK-122) |
| Q9 | Component package: schema, ACL matrix, version/update propagation, capacity, site-copy lifecycle | PDB:445, :456 (history) → IAF-11/PKG-01 (annex not read) | UNKNOWN whether closed in annex |
| Q10 | P1-D14 variant authoring UI (Defer, revisit at Components review) | PDB:167; P/13:30 "no variant authoring UI" | Deferred — revisit trigger passed without recorded decision |
| Q11 | P1-D15 e-commerce insertion reachability | PDB:168; RL A2 | Deferred; UNKNOWN final disposition |
| Q12 | URL state for area/record/task (reload lands on Editor) | REVIEW:62; BK-156 (P3) | Open |
| Q13 | Stripe ≥48 h trial rule unverified | BACKLOG:326 | Open |
| Q14 | RL owner decisions not dispositioned in authority docs: #1 issue count (P/01:58 "kept as owner questions"), #5 classes selector, #6 Beginner/Pro (P/09:152 keeps forced Pro), #7 SEO score model, #9 templates on tokens + purple, #11 DS 27-component catalogue, #16 Brand token pages / Component styles / starters, #18 topbar publish over panel, #19 chrome dark theme, #20 revive-or-gone list (RL §23) | RL:370–393 | Open / UNKNOWN (no grep hit for SEO score, dark chrome, 27-component, selector field in D/P) |
| Q15 | RL decisions implicitly resolved elsewhere (should be closed in RL): #2 (BD-05/SC-10:161), #3 (SC-13, DEC-IA-04), #4 (BD-08 keeps Behaviour), #8 (SC-11 "Changes not published"), #10 (P1-D15 Defer), #12 (P1-D14), #13 (SC-21), #14 (PDB:427 personal discovery), #15 (D13/BD-20), #17 (OD-R5, BK-136) | various | Resolved but RL not updated |
| Q16 | Whether supported browsers pass F6/⌃`, ⌘K, ⌘P | 00:76, :256, :258 | Acceptance pending |
| Q17 | Topbar fit at narrow widths with Site settings label | PDB:334, :346 | Not measured (G4/G8) |

## 8. Decision register

Status key: approved = user decision or designer-selected under explicit user closure; proposed; open; superseded.

| ID | Decision | Source | Status | Conflicts with |
|---|---|---|---|---|
| BD-01 | Assets/CMS/Brand visible in rail; Site settings visible in topbar; no hidden top dropdown | PDB:203 | approved | REPORT:225 (Site settings in site menu); ARCH A top workspace switcher (superseded) |
| BD-02 | Bottom bar = Pages + status only | PDB:204 | approved | workflow-sketch topbar status "Document saved"; REPORT:229 save in header |
| BD-03 | Audit code/runtime; no Figma dependency | PDB:205, :72 | approved | IMPROVEMENT-PLAN:4,15 (Figma-only mode); BATCH-01A; improvement-progress.json |
| BD-04 | Design/docs only, no app change | PDB:206 | approved | — |
| BD-05 | Rail: Add, Layers │ Assets, CMS, Brand │ Help | PDB:207 | approved | REPORT:225, RL L1/L2 ("6 rail items"), workflow-sketch (Pages in rail) |
| BD-06 | Rail stays across workspaces; Back to Editor | PDB:208 | approved | — |
| BD-07 | Topbar = site context/actions; canvas controls with canvas | PDB:209 | approved | REPORT:225 (header owns viewport/undo) |
| BD-08 | Inspector Content/Style/Behaviour/Effects + persistent header | PDB:210 | approved | REPORT:259 & :888 (keep 3 tabs); RL I4 (Behaviour→Settings); BATCH-01A H05 |
| BD-09 | AI Build experience = discussion direction only | PDB:211 | approved (as limit) | consistent with SC-21 |
| BD-10 | Canvas toolbar: Editing (Undo/Redo, crumbs) + View (bp, width, zoom, Fit, options) | PDB:212 | approved | — |
| BD-11 | Rail grouped; stable positions; local workspace headers | PDB:213 | approved | — |
| BD-12 | Bounded resize/collapse over free docking | PDB:214 | approved | RL A8 "Wide Add 700 keep or drop" (decided by SC-10:195 removal) |
| BD-13 | Shared Undo, preview/publish scope, nested returns … | PDB:215 | approved | — |
| BD-14 | Gear + "Site settings" beside site name in topbar — **LOCKED** | PDB:216, :1119 | approved/locked | REPORT:225 |
| BD-15 | AR-01–05 workstreams; no silent deletion; 7 dispositions | PDB:217 | approved | — |
| BD-16 | Component reuse across sites in same (organization) workspace | PDB:218 | approved | 00:211 SC-11 "shared across the **account's** sites" |
| BD-17 | Component package import/export in Add → Saved → Manage | PDB:219 | approved | Panel 13 moves Components to its own area (P/13:61) — placement wording drift, not capability |
| BD-18 | Inspector closure FD-INS-02 | PDB:220 | approved | status label "DESIGN READY" retired (00:284) |
| BD-19 | 69-block BIC-01 closure FD-INS-03 | PDB:221 | approved | same label issue |
| BD-20 | CMS full dynamic system, phased P1–P5 | PDB:222 | approved | REPORT:336–338 (conditions in Data & variables); RL B4 ("hide conditions until they work"); ARCH:132 CMS → Element conditions |
| BD-21 | FD-IA-09 existing-product IA closure | PDB:223 | approved | label |
| BD-22 | FD-DYN-01 detail: 3 creation ways, D2–D6, D9, D13 | PDB:224 | approved | — |
| BD-23 | Panel specs 00–13; all designer recs accepted | PDB:225 | approved | says "DESIGN READY" vs PDB:1014 "SPEC COMPLETE" |
| IA-01 | Hierarchy/canonical destinations (tree) | PDB:231–277, :1054 | approved (selected) | tree lists AI in right host (PDB:247) vs SC-21; Components not a node though an Area (00:220) |
| IA-02 | One Composer history; Undo in Canvas toolbar + Brand header; doc ⌘Z only in Editor/Brand | PDB:794–804 | approved | consistent with 00:184 / BK-006 |
| IA-03 | Preview site ≠ record preview ≠ Brand preview ≠ Publish; draft preflight | PDB:806–828 | approved | refined by SC-8 (00:99) |
| IA-04 | Stable rail actions & transitions | PDB:857–870 | approved | — |
| IA-05 | Bottom Pages entry/switching/management | PDB:872–882 | approved | delete "impact handling" (PDB:879) vs SC-15 Undo-only page delete (00:276–277) |
| IA-06 | Scope visible beside Inspector; bp mirror read-only | PDB:830–838 | approved | — |
| IA-07 | Context snapshots + immediate-source return frames | PDB:884–898 | approved | — |
| IA-08 | Settings ownership + local commit boundaries | PDB:840–853 | approved | — |
| FD-CMP-01 | Component package proposal | PDB:429–527 | **superseded** by IAF-11/PKG-01 (PDB:431) | — |
| FD-INS-01 | Inspector audit INS-01–18 | PDB:528–655 | superseded (grouping) / historical evidence | — |
| FD-INS-02 (INS-D01–D12) | Inspector closure: 4 tabs, 300 fixed, controls, drafts, align | PDB:657–777 | approved | INS-D07 300 fixed vs REPORT:136 320 (300–400), ARCH:45 336; INS-D01 Visibility in Behaviour vs RL §5:97 "visibility is a style" |
| FD-INS-03 | 69 blocks / 120 native routes | PDB:779–791 | approved | — |
| FD-IA-09 | Remaining IA handoff | HANDOFF | approved | — |
| FD-DYN-01 | CMS dynamic binding | DYN | approved | — |
| FD-PNL-00S | Strategy one-pager | 00-STRATEGY | proposal (hypothesis) | — |
| FD-ENG-01 | Engineering backlog | BACKLOG | proposal | — |
| P1-D01–D20 | Initial capability register | PDB:152–173 | **superseded** by FD-IA-09 register (PDB:148, :195) | P1-D11/D12 Keep AI vs SC-21 (historical) |
| DEC-IA-01–07 | Resource hierarchy, one task host, component lifecycle, responsive (Desktop 1440, Wide = preset), truthful unavailable, identity-safe recovery, access/guidance | HANDOFF:162–168 | approved (selected) | DEC-IA-04 vs RL C2/C5 (still listed "Decision", RL:72,74); DEC-IA-02 NAV-02 includes AI vs SC-21 |
| NAV-01–04, GEO-01, CTRL-01–07 | State/return, task host, draft registry, keyboard; geometry; shared controls | HANDOFF:70–154 | approved (selected) | GEO-01 56/284 vs tokens 60/280 (acknowledged HANDOFF:95); vs IMPROVEMENT-PLAN:141, BATCH-01A:35 |
| BD20-IA01–06 | Dynamic destinations overlay | HANDOFF:57–64 | approved; IA06 conditional P5 | — |
| D1 | Full dynamic system (option C) | DYN:45 | approved | — |
| D2 | Sources: CMS/site/page/date/URL/cookie; members wait D7 | DYN:46 | approved | — |
| D3 | False condition → rendered `hidden` | DYN:47 | approved | — |
| D4 | No dynamic page → disabled + Create collection page | DYN:48 | approved | — |
| D5 | Canvas published by default; Show drafts; never in output | DYN:49 | approved | SC-8 Draft-record Preview bar (00:99) resolves |
| D6 | Rich text into heading → plain + chip | DYN:50 | approved | — |
| D7 | Visitor login / members **deferred** | DYN:53 | approved (deferred) | PDB:1037,1046 & HANDOFF:66 still "open" |
| D8 | Live sources via published browser script | DYN:54 | approved | same stale refs |
| D9 | All three creation ways ship | DYN:51 | approved | — |
| D10–D12 | Pagination, 1-level refs, no nested groups | DYN:55, :428 | approved (designer-selected, owner instruction) | — |
| D13 | CMS → Data keeps Sources/variables; read-only Conditions index | DYN:52 | approved | REPORT:336–338; workflow-sketch "Data & variables" |
| SC-1 | Back slot/label; topbar door from workspace returns to that workspace | 00:9–17 | approved (R-1017) | — |
| SC-2 | Esc ladder; canvas Esc → parent; declared exceptions | 00:19–37 | approved | REPORT:128 (Esc then selection) historical |
| SC-3 | Element-action registry; Group≠Wrap; delete = Undo | 00:39–66 | approved | — |
| SC-4 | Status wording priority | 00:68–72 | approved | — |
| SC-5 | F6 order + ⌃` fallback | 00:74–76 | approved | — |
| SC-6 | Viewer matrix | 00:78–91 | approved | — |
| SC-7 | Return chip in Editor | 00:93–96 | approved | — |
| SC-8 | Preview target/width; Draft record bar | 00:98–99 | approved | — |
| SC-9 | Engineering dependency register (⛔) | 00:101–147 | approved | duplicate rows (00:133 vs :147; :108 vs :121) — BACKLOG:318 Open |
| SC-10 | Amendments register | 00:149–195 | approved | — |
| SC-11 | Glossary | 00:197–231 | approved | :211 vs BD-16; :213 vs PDB:427; "Area" vs "module workspace" used in PDB/HANDOFF |
| SC-12 | Shortcut scope/platform table | 00:233–258 | approved | — |
| SC-13 | Breakpoint cascade; Wide 1920 = Desktop preset | 00:260–266 | approved | RL C5 still "Decision" |
| SC-14 | Lock scope (descendants) | 00:268–271 | approved | — |
| SC-15 | Undo over confirm; 30-day Recently deleted; E-1…E-5 | 00:273–279 | approved | PDB:879 IA-05 "impact handling" for page delete |
| SC-16 | SPEC COMPLETE / VERIFIED; DESIGN READY retired | 00:281–284 | approved | PDB & HANDOFF labels (D1-1) |
| SC-17 | Field-scoped ⌘Z; multi-select rules | 00:286–289 | approved | — |
| SC-18 | One-line contracts: plan limits, AI, session expiry, ⌘K | 00:291–297 | approved | — |
| SC-19 | Narrow widths never cover target | 00:355–356 | approved | numbered after SC-22 |
| SC-20 | Free + Pro + 30-day Pro trial | 00:299–330 | approved (owner) | "everything free" rule replaced (00:166) |
| SC-21 | No AI UI this version; backend stays | 00:332–340 | approved (owner) | PDB P1-D11/12, §6 AI row (PDB:423), IA-01 tree (PDB:247), HANDOFF NAV-02 (:80), RL X1–X4 |
| SC-22 | All other panel ODs decided as recommended | 00:342–353 | approved (owner) | REVIEW:156 "OD-C3 not done" (stale) |
| OD-C3 | Access/password changes apply immediately (server gate; interim C-3 warning) | 00:353; P/10:103 | approved | REVIEW:156 |
| OD-R1…R7 | Client review | 00:344 | approved | — |
| OD-18-2, OD-18-3 | Palette in read-only view; no topbar ⌘K button | 00:345 | approved | — |
| OD-I1…I4 | Interactions | 00:346 | approved | 00-STRATEGY:49 ("interactions authoring" later) |
| OD-CL-1…CL-6 | Collaboration | 00:348 | approved | BACKLOG:317 retention code conflict (open) |
| OD-1…OD-3 | Global states | 00:349 | approved | — |
| OD-PL-1 | Over-limit content | P/23:168 | superseded by SC-20 owner rule | — |
| OD-PL-2…PL-7 | Plans | 00:350 | approved | — |
| OD-U1…U7 | Undo | 00:351 | approved | — |
| OD-A1…A8 | Analytics | 00:352 | approved | — |
| OD-T1 | EDITOR may replace page with template | 00:165 | approved | — |
| OD-T2 | Plans final (Free badge + Pro trial) | 00:166 | approved | — |
| OD-AI-1…AI-4 | AI decisions | BACKLOG:345–347 | **deferred** with SC-21 | — |
| RL decisions #1–#20 | Issue count, off-rail panels, Desktop width/Wide, Behaviour→Settings, classes selector, Beginner/Pro, SEO score, "Unpublished", templates on tokens/purple, removed Add blocks, DS catalogue, variants, AI workspace, media scope/auto-alt, CMS Sources/Conditions, Brand token pages, comment threads, scheduled publish/topbar, dark chrome, removed features | RL:370–393 | **proposed/open in RL**; many implicitly resolved elsewhere (see Open questions) | multiple — D1-13 |