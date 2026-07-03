# Design-reconciliation run log — 2026-07-02

Mission spec: `docs/reviews/design-reconciliation-mission-20260702.md`
Mode: autonomous (founder pre-authorized "do not stop"); gates recorded here, decided in-run.
Hard rule in force: NO delete/move/restyle of existing Figma frames — additive writes only.

## Phase 0 — Feature truth table — GATE 0 ✅ (recorded, continuing)
Sources: complete-feature-list (74 rows, 06-28 reconciled) + ia-tree build board (60 nodes) + functionality-map (41 surfaces) + 35 grep-verified claims (2 code agents, file:line below). Status legend: ✅ works · 🟡 partial · 🔵 env/flag-gated · ⚠️ dead-code/gap · ✗ not built. `(fl)` = carried from feature-list, not re-verified this run.

**Verified status corrections vs docs (the deltas that matter):**
| # | Feature | Docs said | CODE TRUTH | Evidence |
|---|---------|-----------|------------|----------|
| Δ1 | Interactions triggers | 13 defined / 7 wired | **13/13 wired** | types.ts:14-27 + InteractionRuntime.ts:164-253 |
| Δ2 | Component overrides | content/trait revert 🔴 | **ALL 4 kinds survive** | ComponentInstance.ts:109-151 |
| Δ3 | Component masters | IndexedDB-only | **server-backed** | componentSync mounted AquibraStudio.tsx:199 |
| Δ4 | Version history | "server-backed UNVERIFIED" (06-30) | **server-backed TRUE** | versionSync.ts:52,84 + AquibraStudio.tsx:196 |
| Δ5 | Edit-scope picker (element vs master) | ✅ in feature-list | **✗ NOT BUILT** | only ai/ScopeChip.tsx; types.ts:9-12 element\|page\|multi |
| Δ6 | Inline AI on selected text | (bundled ✅) | **✗ NOT BUILT** | RichTextEditor.tsx — zero AI actions |
| Δ7 | Custom domains verify | "BROKEN / cron stuck" | **real verify, flips VERIFIED** (e2e untested → 🟡) | dns-verify/route.ts:44,53 (dns.resolveCname/Txt) |
| Δ8 | Custom CSS | "Pro-gated" | **⚠️ dead code** (devMode hardcoded false, no Pro gate) | ProInspector.tsx:95 + element.tsx:74 |
| Δ9 | AI site generation | 🔵 hide | **✅ wired e2e** (provider key = env) | ai-generation.service.ts:8,44,63 → worker route.ts:152,164; consumer sites/new/page.tsx:67 |
| Δ10 | Redirects | notice added | **⚠️ deploy-gap holds**; dashboard redirects-tab.tsx has NO "not live" notice (editor screen has it) | redirect.service.ts DB-only; no vercel.ts/publish injection |
| Δ11 | Billing upgrade | ✅ | **🟡 checkout STUB** | billing.service.ts:158 |
| Δ12 | Canvas toolbar (#16 target) | drawn as-is | today: undo/redo/history/device = Topbar.tsx:356-390; **zoom only** = CanvasFooterToolbar | C2#17 |
| Δ13 | Forms canvas submit | — | preview-only, in-memory Map (published path = server) | FormSubmissionService.ts:99 |

**Truth table (74 features · by job · home · status · evidence):**

J1 Run-the-business (dashboard): Account ✅(fl) · API tokens ✅(fl) · Workspace ✅(fl) · Team+invite ✅ team/page.tsx:9→team.ts:67 · Invite accept ✅(fl) · Ownership transfer ✅(fl) · Roles ✅(fl) · Clients CRUD+assign ✅ clients.ts:86 + requireAgencyLayer · Notifications ✅(fl) · Integrations(Vercel) ✅(fl) · Billing 🟡 Δ11 · Upgrade/paywall 🔵 hide · Help ✅(fl)
J2 Start-a-site (dashboard): Sites list/detail ✅(fl) · Dashboard home 🟡 (fake bandwidth widget + hardcoded status counts — build bugs) · New blank/template ✅(fl) · New-site AI ✅ Δ9 · Template gallery ✅(fl) · First-run ✅(fl)
J3 Build (editor): Canvas ops ✅(fl) · Add elements ✅(fl) · Pages ✅ PagesTab.tsx:229 + settings drawer (+folders localStorage-only) · Layers ✅ StudioFooter.tsx:97 rename+reorder · Edit-scope ✗ Δ5 · Rail ✅ Insert·Pages·Styles·Site tabsConfig.ts:275 · ⌘K ✅ Topbar.tsx:261 (overloaded per-panel — unify target) · Onboarding ✅ dismissible · Text/rich ✅ RichTextEditor.tsx:49 · CMS ✅ publish-toggle CMSRecordsModal.tsx:124,285 + 0-published warning (5/14 field types creatable (fl)) · Media ✅ server-mirror MediaManager.ts:995,1255 · Stock ✅🔵 real providers stock.service.ts:55 env-gated; no-key prompt dead ⚠️ StockSourceModal.tsx:106 · Image editor ✅ crop/aspect (no versions) · Icon picker ✅ Lucide local · Templates tab ✅(fl) · My-Templates ✅ templateSync.ts:47
J4 On-brand (editor + dashboard push): Inspector ✅(fl) · DS tokens/styles ✅(fl) · Shared DS push ✅ dashboard-homed; theme.ts capture/push/previewPush/rollback/snapshots/presets; **editor theme.\* consumers = 0** · Reach model ✅(fl) · Components ✅ masters server + overrides survive Δ2/Δ3 (variants/detach UI 🟡 (fl)) · Custom CSS ⚠️ Δ8 · Interactions ✅ Δ1 · Animations 🟡 CSS presets (fl) · Localization 🟡 settings wired (LocalizationScreen.tsx), engine locale-unaware (SEOInjector og:locale only)
J5 Sign-off (both): Preview ✅(fl) · Request review ✅ Topbar.tsx:243 popover note+changeSummary → reviews.submit · Notify loop ✅ review.service.ts:134-179 + 2 email templates · Queue+resolve ✅ review-queue.tsx:23,88 APPROVED/CHANGES_REQUESTED · **External client approve ✗** share page = password→redirect only page.tsx:36,42 · Comments 🟡 dashboard iframe overlay comment-preview.tsx:15-18, NOT in-editor · Share link 🟡 dashboard-homed, editor share UI absent · Published-site password 🟡 Vercel-hobby gate bug (fl)
J6 Ship & run (both): Publish ✅(fl) · Published view ✅(fl) · Domains 🟡 Δ7 · Per-page SEO ✅(fl) · Site settings ✅ 10 sections/3 groups (fl) · Site-level SEO defaults ✗ (per-page only) · Forms ✅ builder + CSV FormsScreen.tsx:179 + Δ13 nuance · Redirects ⚠️ Δ10 · Analytics 🟡 first-party view + track API real; avgSession=0 bug · Export CUT · Localization runtime HIDE · Collab HIDE (flag editor runtimeEnv.ts:64-65 default off; 6 P1 bugs)
AI cross-cutting: Assistant ✅(fl) · Propose ✅ admin-gated (fl) · SEO write-title ✅(fl) · Alt-text ✅(fl) · Site-gen ✅ Δ9 · Inline AI ✗ Δ6 · Quota meter ⚠️ route orphan (0 consumers)
Substrate: Auth ✅(fl) · Undo/redo ✅ Topbar · Version history ✅ Δ4 · Save/conflict ✅(fl) · States = pattern · Billing internals ✅ backend (fl)

**TOTAL: 74 features.** Coverage targets for Phase 5 mechanical audit: 74 features → each exactly ONE journey home on the v2 page (hide/cut rows appear as gated/cut chips, not screens).

## Phase 2 — Gap diff (Raw Design vs truth) — GATE 2 ✅ (recorded, continuing)
Context: the file's own 06-29 audits (fa-flow-audit 48/18/34+12-critical · Reality-Gap 37 · surface-journey-map 18/21) were largely CLOSED by drawing (all 12 criticals have frames; spot-verified real content). Remaining verdicts BELOW are what's still true on 2026-07-02 against code:

| Verdict | Item | Figma node | Evidence | Fix (phase) |
|---|---|---|---|---|
| MISSING | API tokens flow | — | fa-audit GAP, no frame | P2 micro-flows frame (P3) |
| MISSING | Help/support flow | — | fa GAP | 〃 |
| MISSING | AI-SEO write-title sparkle | — | fa GAP; code ✅(fl) | 〃 |
| MISSING | Published-site password target | — | fa GAP; 🟡 Vercel bug | 〃 |
| MISSING | Redirects "saved-not-live" target state | — | Δ10 | 〃 |
| MISSING | Undo/redo + history behavior | — | fa GAP | 〃 |
| MISSING | My-Templates save-as flow | — | fa GAP; code ✅ | 〃 |
| MISSING | Stock-icons + image-editor micro-flow | — | fa GAP | 〃 |
| INCOMPLETE | Happy-path spine = map only, no screen storyboard | 61:4 | m0 footer: "connections only" | **Phase 4 new page (the core build)** |
| INCOMPLETE | Hi-fi onboarding set happy-only (no states) | 455:* | screenshots | note on sync board (P3) |
| DUPLICATED | DS management ×3 | 78:4 + 124:4 + **163:4 keeper** | token create/edit/blast-radius overlap; 163:4 fullest (lifecycle+typography+push) | note layers "→ merged into JDM 163:4" (P3) |
| UNCLEAR | "wireflow-root" name ≠ content (JDS mgmt) | 78:4 | text extract | rename (P3) |
| UNCLEAR | ji- prefix collision (integrations vs interactions) | 165:4 | vs 80:4/122:4/171:4 | rename → jia- (P3) |
| UNCLEAR | unnamed strip + stray "shell-inner" | 455:132 · 106:115 | metadata | rename (P3) |
| MISALIGNED | Hi-fi dashboard sidebar 7-item (Templates/Analytics/Notifications top-level; Team missing) vs locked 5 (Home·Sites·Clients·Team·Settings) | 455:132/455:541 | ia-home-map locked 5 | note layer (P3) |
| MISALIGNED | "13 triggers / 7 wired" | 3:2 (ia-tree capture) | Δ1 | sync board + note (P3) |
| MISALIGNED | JC "override-revert bug + IndexedDB masters" | 97:2 JC items | Δ2/Δ3 | note (P3) |
| MISALIGNED | "DNS verify cron stuck / domains broken" | 97:2 JD + 76:4 | Δ7 | note (P3) |
| MISALIGNED | "Custom CSS Pro-gated" | 76:4 | Δ8 | note (P3) |
| MISALIGNED | Version-history "IndexedDB-only data-loss" | 2:2 appendix §24 | Δ4 | note (P3) |
| MISALIGNED | "AI new site hidden/needs key" | 97:2 JX | Δ9 | note (P3) |
| MISALIGNED | feature-list "Edit-scope ✅" (doc-side) | — (repo doc) | Δ5 | sync board (P3) — repo doc fix separate |

No phantom findings: every MISSING/MISALIGNED row carries grep evidence (Δ table) or a named fa-audit GAP row.

**Route revision (Phase 4), recorded:** mission default was HTML-first→capture. Ground truth found: the Figma library (16 journeys, J0/J0b/JD/JX/j5b + deep-dives) is now RICHER than canonical wireflows.html (10 journeys) — HTML SSOT lags the founder's working canonical. Decision: **Phase 4 = Figma-native build** (use_figma, scripted); wireflows.html gets a "journey set superseded by Figma file RmtnWGlZX9Z3idP6f5vmLq" banner so exactly ONE canonical exists (LR-0026 rule).

## Phase 1 — Figma read — COMPLETE
whoami: saqib / Pro / Full seat ✓ (plugin_figma_figma).

**File = RmtnWGlZX9Z3idP6f5vmLq, ONE page: `0:1 "raw design"` (no separate "Wireframing" page).**
MAPPING DECISION (recorded, autonomous): "Raw Design page" = page 0:1 (the founder's whole working set). "Wireframing page" = the WIREFLOW LIBRARY + TARGET STATES bands inside 0:1 (28+ flow frames + 4 June-29 HTML captures). Phase 4 creates the NEW page "Wireframe v2 — Happy Path" in this same file (additive ✓).

Page structure: 99 top-level nodes in 5 labeled bands:
1. **PLANNING & REFERENCE** (y≈0): `1:2` IA Home-map · `3:2` IA Tree build board · `4:2` Wireflows (10 journeys) · `13:4` surface-journey-map (5) · `61:4` m0-master-flow · `97:2` Reality-Gap build list (6) · far right `455:*` hi-fi onboarding set (455:33 checklist-expanded · 455:367 first-canvas-prompt · 455:480 first-section-added · 455:541 dashboard-progress-bar · 455:132 3-screen strip).
2. **WIREFLOW LIBRARY** (y≈6.5k): 24 flow frames — j0-auth `229:7` · j0b-onboarding `229:104` · j5b-client-review `229:225` · jh `116:4` · jn-notifications `133:4` · jk `119:4` · js-settings `118:4` · jd-site-detail `231:8` · jsh-sharing `231:148` · jcl `117:4` · ji `122:4` · jx-ai `231:302` · jc `123:4` · jds-design-system `124:4` · es-error `120:4` · sp-subpaths `231:452` · j6-ship `153:4` · jds-token-mgmt `163:4` · jm-media `164:4` · ji-interactions-animations `165:4` · jc-library-mgmt `167:4` · ja-account `168:4` · jl-layers `169:4` · jf-forms `166:4` · jv-version-history `170:4` · ji-detailed `171:4` · jcl-crud-detailed `173:4` · jco-collab-target `174:4`.
3. **DOCUMENTATION / WIREFLOW SCREENS** (y≈18.7k): 16 doc-flow frames (j0-auth-flow `17:4`, j0b `26:4`, j5b `16:4`, jh-home `67:4`, jn `68:4`, jk `65:4`, js `66:4`, jd `30:4`, jsh `79:4`, ji `80:4`, jx `28:4`, jcl `77:4`, jc `75:4`, wireflow-root `78:4`, es `59:4`, sp `63:4`).
4. **TARGET STATES** (y≈30.7k): 18 target-state frames (j5b/ji/jsh/jd/jh-activity/jn/jx/j0b/jk/js/es/jc/jco/jl/jv/jm/jf/ja).
5. **ARCHIVE & APPENDIX** (y≈39.1k): `2:2` Editor surfaces 39 (capture) · `70:4` jh-home-v1-archived · `76:4` fa-flow-audit.

**KEY FINDING — a prior session (2026-06-29/30) already ran an in-file audit loop:**
- `76:4` fa-flow-audit: ~100 features vs 28 flow frames → **48 DONE · 18 PARTIAL · 34 GAP · 12 critical (8 P1/4 P2)**, per-job coverage tables.
- **All 12 critical gaps now HAVE matching wireflow frames** (jds-token→#1, jc-library→#2, ji-detailed→#3, jsh-sharing-wf→#4, jcl-crud→#5, jm-media→#6, ji-interactions-animations→#7, jf-forms→#8, ja-account→#9, jl-layers→#10, jv-version→#11, jco-collab-target→#12) — gaps were closed by drawing AFTER the audit.
- `97:2` Reality-Gap: 37 build items from 10 wireflows; most tagged "✓ DESIGNED"; the un-designed remainder = product BUGS (resendInvite, bandwidth fake data, status counts hardcoded, avgSession=0, DNS cron, published-password Vercel gate, JC override-revert, IndexedDB masters) = build work.
- `61:4` m0-master-flow: 16-journey connection map (J0→J0b→J1/J2→J3a/J3b→J4→J5/J5b→J6×3 + JD/JX + ★ wedge) w/ handoff index — **"connections only", not screen storyboards**.
- `13:4` surface-journey-map: 39 appendix surfaces → 18 linked / 21 orphaned w/ assigned homes + 1 wrong-ref fix (J3-CMS step-4 §11→§10) + 2 "nothing designed" gaps (auth §N — since closed by j0 frames; client-side review — since closed by j5b frames).

Taxonomy: file journey codes (J0/J0b/J3a/J3b/J5b/JD/JX + J1–J6 + ★) EXTEND the course's 6 jobs — vocabulary aligned at journey level; per-module deep-dives (JC/JM/JL/JV/JF/JDS…) dock under jobs. No J-number conflict found (earlier drift concern withdrawn).

Exemplar quality (screenshot `117:4` jcl-wireflow): strong — context/user/done-when header, 5 numbered grey-box steps w/ captions, implementation-requirements box, cross-refs (JH·JD·J1).

⚑ MISALIGNED candidate #1 (screenshot `455:132`): hi-fi dashboard sidebar = 7 items (Dashboard·Sites·Templates·Clients·Analytics·Notifications·Settings) vs locked IA 5 top-level (Home·Sites·Clients·Team·Settings) — Templates/Analytics/Notifications promoted, Team missing.

**The founder's felt gap confirmed structurally: the page is a LIBRARY (5 bands, 90 frames) — no ordered screen-by-screen happy-path spine exists; m0 is a box-map only. Phase 4 = the real build.**

## Phase 2 — Gap diff
Status: pending

## Phase 3 — Raw Design fixes (additive) — COMPLETE
- UNCLEAR renames (mission-allowed): `78:4` → "jds-design-system-flow (dup → JDM 163:4)" · `165:4` → "jia-interactions-animations-wireflow" · `455:132` → "onboarding-hifi-strip" · `106:115` → "jd-target-shell-inner (stray fragment)".
- **⚠ Reality Sync board `649:2`** (PLANNING band, right of 97:2): 16 code-verified Δ-rows + footer.
- **6 sync chips** adjacent to affected frames (never inside them): ia-tree `650:19` · reality-gap `650:22` · fa-flow-audit `650:25` · jds 78:4 `650:28` · jds 124:4 `650:31` · onboarding-hifi `650:34`.
- **`651:2` p2-micro-flows** (LIBRARY band, x6180): the 8 remaining fa-audit P2 GAPs drawn as smallest-honest journeys (API tokens · Help · AI-SEO ✨ · published-password ⚠ · redirects-not-live ⚠ · undo/history · My-Templates save-as · stock-icons+image-editor). Screenshot verified.
- Zero founder frames deleted/moved/restyled. All writes additive.

## Phase 4 — Wireframe v2 Happy Path — COMPLETE (Gate 4 passed in-run)
New page **`653:2` "Wireframe v2 — Happy Path"** (old page untouched; no separate old wireframing page existed to archive). Route revision executed: Figma-native build; `wireflows.html` got the superseded-for-journeys banner (canonical = the Figma file now).
Structure: header+legend · **Row 0 ★ wedge (13 steps W1–W13 → ● goal)** · Row 1 Entry 3-paths (6) · Row 2 J1 (6) · Row 3 J2 (5) · Row 4 J3 (8) · Row 5 J4 (6) · Row 6 J5 (7) · Row 7 J6 (6) = **57 step-cells**, every cell = mini-screen (editor/dash/client shell hint) + does→sees caption; per-row STATES strip (real states only, ⚠ amber where a code bug ends the flow); honesty footer (cut/gated chips). Gate-4 screenshots taken after Row 0 + Row 1 (recorded in transcript), then mass-produced.

## Phase 5 — Verify ×2
**Mechanical audit:** pass 1 → 3 findings (Row-1 no done-tag + flattened paths · AI-assistant drawer had no declared home · Site-settings hub unnamed) → fixed → **pass 2 CLEAN**: 8/8 rows end on ● done-state, vertical order = reading order, 57 cells.
**Coherence audit (independent fresh-eyes subagent):** pass 1 → **20 findings** (dead-ends: W9 retry unstated, W12 target-mid-spine, wedge-vs-Vercel-connect seam, "3 sites" math, W6 leverage beat, editor→dash teleport, post-approval re-review seam, Row-1 path flattening, actor rename G3, chip-legend absent, collab-vs-J5 collision, iframe caption opaque, module-drift rows 2/4/5/7, preview duplicate-home D8/G1, AI front-door). **16 fixed on-canvas**; **4 judged by-design with rationale** (invite-recovery lives in library j0 frame; Br1≠Br3 distinct concepts, retitled; Row-1 first-run shortcuts labeled; AI multi-entry with declared front door).
Pass 2 → 7 residuals (legend spanning two axes; Br6 "every" overstatement; G3 fake gate; AI front-door overclaim; Br1↔D3 scope collision; W10 anchor; B5/B6 modules) → all fixed (legend split USER-STATE vs BUILD-STATUS; selective-push wording; FYI framing; in-editor scoping; propagation-vs-edit-scope distinction; verb retitles).
Pass 3 → 3 residuals (4 chips on wrong axis; preview entries re-merged at control level; Δn undefined) → fixed (build-status chips greyed + worded; "Topbar ⋯ › Preview as client" vs "Topbar Preview" split; Δn defined in legend).
Pass 4 → 2 residuals (one = paraphrase artifact, canvas verbatim proved anchor intact; one real = ⚠ in the Reality-Sync references inside the symbol contract) → fixed (board renamed "Reality Sync — 2026-07-02").
**Pass 5 → PASS.** Reviewer verbatim: "All 20 pass-1 findings are now resolved, accepted by-design with sound rationale, or fixed through the four sweep passes — the page is coherent under all 5 tests."
**VERDICT: Mechanical CLEAN ×3 · Coherence PASS. Convergence 20 → 7 → 3 → 1 → 0.**

## MISSION STATUS: COMPLETE 2026-07-02
All 6 phases done, both audits clean, additive-only writes honored (0 founder frames deleted/moved/restyled; 4 mission-allowed UNCLEAR renames). Figma file RmtnWGlZX9Z3idP6f5vmLq now = the canonical design surface (wireflows.html bannered). Open ceiling: coherence ≠ correctness — the wedge still needs real-agency validation (agency-validation-plan.html).

### Coverage table (74 truth-table features → one primary home on v2 page)
Primary home = job-row cell; wedge cells reuse surfaces (reference, not second home); (+micro) = deep-dive also in p2-micro-flows; chips are drawn homes for non-screen features.
- **J1:** Clients→B1 · Team/roles/ownership→B2 · Invite-accept→E6 · Workspace→B4 · Integrations→B3 · Billing→B4 · Upgrade→footer-HIDDEN · Notifications→B5 · Account→B6 · API-tokens→B6(+micro) · Help→B6(+micro)
- **J2:** Sites→S1 · Dashboard-home→E3 · New-blank/template→S2 · Gallery→S3 · New-AI→S4 · First-run→E3–E5
- **J3:** Canvas-ops+Add→D1 · Text/rich→D2 · Inspector-select→D3 · Edit-scope→D3 (dashed TARGET) · Pages→D4 · Layers→D4 · Media→D5 · Stock/icons/image-editor→D5 · CMS→D6 · Forms-builder→D7 · Builder-preview→D8 · ⌘K→R4-chip · Editor-onboarding→E5 · Templates-tab+My-Templates→D1(+micro)
- **J4:** Reach→Br1 · Tokens/DS/styles→Br2 · Blast-radius→Br3 · Type/effects/motion (incl. 13 interactions + animations)→Br4 · Components→Br5 · Shared-DS-push→Br6 (wedge W7–W9) · Custom-CSS→R5-chip ⚠ · Localization-settings→R5-chip 🟡
- **J5:** Preview-as-client→G1 · Request-review→G2 · Notify→G3 · Share-link→G4 · Client-approve→G4 (TARGET) · Comments→G5 · Queue/resolve→G6 · Status-flip→G7 · Published-password→R6-chip(+micro)
- **J6:** SEO→H1 · Domains+Site-settings-hub→H2 · Publish/published-view→H3 · Analytics→H4 · Forms-leads→H5 · Version-history→H6 · Redirects→R7-chip ⚠(+micro) · SEO-defaults→R7-chip (NOT BUILT) · Export→footer-CUT · Collab→footer-GATED · Localization-runtime→footer-GATED
- **AI:** Assistant→R4 front-door chip · Propose→R4-chip · Inline→D2 (TARGET) · Site-gen→S4 · Alt-text→D5 · SEO-title→H1 · Quota→R4-chip
- **Substrate:** Auth→E1/E2 · Undo→R4-chip(+micro) · Save/autosave→R4-chip · Versions→H6 · State-patterns→the strips themselves · Billing-internals→backend (non-nav, noted)
**0 features without a home · 0 features with two primary homes.**

### Honesty list — what was deliberately NOT done
- No new rail slots, no new dashboard top-level nav (locked spine #15) — CMS stayed under Pages, AI stayed cross-cutting.
- Gated/cut features (collab, localization runtime, paywall, extra-workspace, Export) NOT drawn as path screens — chips only.
- Client-approve NOT drawn as shipped — dashed TARGET (code = password→redirect only).
- Known code bugs NOT designed away — every ⚠ chip maps to a build item below.
- Founder-era audit frames (fa-flow-audit, Reality-Gap, m0) NOT edited — corrections live in adjacent chips + the Reality Sync board.
- No hi-fi/visual polish — grey-box fidelity throughout (structure, not style).

### Build-vs-design gap list (product backlog — code work, the design cannot fix these)
1. Client-side review view + approve/request-changes UI on share token (Δ16 — J5's real dead-end)
2. Editor-side theme push UI (theme.* consumers in editor = 0; wedge push is dashboard-only today)
3. Redirects → inject into Vercel deploy + add dashboard "saved, not live" notice (Δ10)
4. Domains verify e2e test on live DNS (Δ7)
5. Inline-AI selected-text bar (Δ6) · 6. Edit-scope element↔master picker (Δ5)
7. CMS: only 5/14 field types creatable · 8. Billing checkout stub (Δ11)
9. Bug set: resendInvite email · bandwidth fake data · hardcoded status counts · avgSession=0 · published-password Vercel-hobby gate · site-level SEO defaults missing
10. AI quota meter consumer (orphan route) · 11. Canvas-toolbar re-lay-out (#16 target: move undo/history/device down from topbar)
