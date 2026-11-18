# D1 — Core (non-panel) doc set: documentation audit

Auditor task D1 · 2026-10-18 · AUDIT ONLY. Paths: D = `docs/audit-and-design-2026-10-16`, P = `D/panels`, RL = `docs/editor-redesign-list-2026-10-16.md`.

## Scope read

| File | Lines read | Note |
|---|---|---|
| D/PRODUCT-DESIGN-BRIEF.md (PDB) | 1–1166 (all) | |
| D/REMAINING-IA-HANDOFF.md (HANDOFF) | 1–189 (all) | annexes under `evidence/ia-final-2026-10-16/` NOT read (out of D1 list) |
| D/ARCHITECTURE-DECISION.md (ARCH) | 1–132 (all) | |
| D/IMPROVEMENT-PLAN.md | 1–181 (all) | |
| D/REPORT.md | 1–1087 (all) | route ledger rows read, not verified |
| D/BATCH-01A.md | 1–145 (all) | |
| D/CMS-DYNAMIC-BINDING-DESIGN.md (DYN) | 1–440 (all) | |
| D/improvement-progress.json | 1–164 (all) | |
| P/00-STRATEGY.md | 1–49 (all) | |
| P/REVIEW-2026-10-17-pro-product-design.md (REVIEW) | 1–162 (all) | |
| P/ENGINEERING-BACKLOG-2026-10-17.md (BACKLOG) | 1–356 (all) | |
| RL | 1–400 (all) | |
| P/00-SHARED-CONTRACTS.md (00) | 1–360 (all) | read to verify REVIEW §E claims |
| P/07-CMS.md | 65–115 (§5–§8) | fix verification only |
| P/08-ASSETS.md | 87–105, 155–165 | fix verification only |
| P/10-SITE-SETTINGS.md | 72–111 | fix verification only |
| P/01–25 | line 1–6 status lines; targeted greps (DESIGN READY, review pending, interim viewer, OD-*, variant, schedul, Beginner, purple, Airtable, Edit main component) | not read in full — other agents' scope |
| D/AS-IS-REVIEW.html | text-stripped, first ~2,500 of 11,807 chars | skim per brief |
| D/BATCH-01A-REVIEW.html | text-stripped, all 1,527 chars | skim |
| D/workflow-sketch.html | text-stripped, first ~2,500 of 3,870 chars | skim |

Skipped: `evidence/**` annexes (module-specifications, capability-preservation, inspector annexes) — not in D1 list; INV not opened (D1 does not do coverage).

## Document register

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

## Decision register

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

## Product architecture map

| Host | Defined content (doc) | Geometry (GEO-01 / doc) | Enter / exit / return rules |
|---|---|---|---|
| Global topbar | Exit, site identity + live dot, **Site settings** (gear+label), Review chip / Comments, presence (PLANNED), bell, Preview, CTA Publish, ⋯ site menu (Activity, Export, org links, "Search ⌘K" header) | 56h | BD-07/14; 00:82 viewer variant; Site settings = direct nav, returns to invoking area (00:15, PDB:344) |
| Global banner slot | Persistent conditions (Panel 22) | under topbar | joins F6 (00:75, :182) |
| Left rail | Add, Layers │ Assets, CMS, Brand │ Help (utility) | 56w, labels under icons | IA-04 (PDB:857–866); stable order; active marker only on real destination (PDB:275) |
| Left panel (Editor) | Add catalog / Layers tree / temporary Asset picker | 284 (260–360) | picker Cancel restores previous panel (HANDOFF:104) |
| Canvas toolbar | Editing: return chip, Undo/Redo, breadcrumbs · View: Desktop/Tablet/Mobile, width, zoom, Fit, options, Record switcher, Show drafts, Show hidden elements | 44h; 88h two rows if canvas <720 | BD-10; DYN §13; SC-7 return chip |
| Canvas | Selection, inline text, drag, resize, comments | 800 @1440 docked | Esc ladder → parent (00:26) |
| Inspector | Header + Content / Style / Behaviour / Effects; Page appearance at no selection; special contexts | 300 fixed; overlay ≤1366 (312 obscured) | INS-D01/D03/D07; subviews "‹ Back to {tab}" (DYN §8.3) |
| Right task host | Publish, Review, History, Activity, Issues, (AI — hidden by SC-21) | 360 (320–420); overlay 1281–1366; sheet ≤1280 | NAV-02 (HANDOFF:78–87): replaces Inspector in Editor, tray over resource body; Close restores prior Inspector state |
| Bottom bar | Pages entry, page strip, Add page, status (+ "Versions ›") | 32h | BD-02, IA-05, SC-4/6 |
| Pages manager | Temporary sheet: list, folders, search, bulk, page settings, Recently deleted | 560 / 720, viewport−48 | opening/closing never changes active page (PDB:876); row = "Open {page} in Editor" |
| Area: Assets | Library workspace, detail 320, folders, Fonts, Recently deleted | nav 240 / detail 320 | Back to Editor · {page}; picker vs manage distinct (CTRL-03) |
| Area: CMS | Collections → Records / Fields / Dynamic pages / Collection settings; **CMS → Data** (Sources, Site variables, Conditions index) | nav 240; record 720–960 | IA-07 frames; Locate → Inspector Content (SC-7) |
| Area: Brand | Token workspace + local Undo/Redo | nav 240, header 56 | IA-02 |
| Area: Site settings | 11 screens + Danger + workspace doors | header 56, footer 48 | IA-08; topbar door; returns to invoker |
| Area: Templates | Page templates (Panel 15) | work area | entry Pages → New page → From template; Add → Blocks "Page templates…" (PDB:913) |
| Area: Components | This page / This site / Component library; detail; import/export | work area | "Edit main component" → area with "‹ Back to {instance}" (P/13:103) |
| Dedicated: Compare / Time Travel | Read-only comparison / snapshot | full working area; rail+topbar visible | exit to exact origin; own Esc (00:37) |
| Preview (full screen) | Preview bar | — | last Editor page, current bp + frame width (SC-8); Back per SC-1 |
| Dialogs | Review-and-publish (P14), import/export 720/480/960, Create collection page, shortcuts dialog, ⌘K palette, conflict, session re-sign-in, Upgrade | viewport−48 | modal focus trap; Esc innermost |
| External | `/review/<token>` (client), `/share/<token>`, dashboard (Members/Billing/Integrations, `/dashboard/agency/library`), `/edit/[siteId]` | — | org links show org scope (PDB:335); bell other-site rows open new tab (00:183) |

Return rules: IA-04 (rail Add/Layers → Editor last snapshot; resource → last local location), IA-05 (explicit page open supersedes Back), IA-07 (frames only for contextual tasks; per site; invalid → nearest list), SC-1 (one label "‹ Back to {origin}"), NAV-01 (direct nav replaces, no stack).

```mermaid
flowchart LR
  subgraph Shell[Persistent shell]
    TB[Topbar: site · Site settings · Review · Preview · Publish · ⋯]
    RAIL[Rail: Add · Layers | Assets · CMS · Brand | Help]
    BB[Bottom: Pages · strip · status/Versions]
  end
  ED[Editor: left panel 284 + canvas toolbar + canvas + Inspector 300]
  RT[Right task host 360: Publish · Review · History · Activity · Issues · AI hidden SC-21]
  AS[Area Assets] ; CM[Area CMS + CMS→Data] ; BR[Area Brand]
  SS[Area Site settings] ; TP[Area Templates] ; CP[Area Components]
  PM[Pages manager sheet]
  PV[Preview full-screen] ; CT[Compare / Time Travel]
  EXT["/review/token · /share/token · dashboard"]
  RAIL -- Add/Layers IA-04 --> ED
  RAIL -- IA-04 last local view --> AS & CM & BR
  AS & CM & BR -- "‹ Back to Editor · page" --> ED
  TB -- direct nav --> SS
  SS -- "‹ Back to invoker (SC-1)" --> ED & CM & BR & AS
  TB --> PV
  PV -- SC-1 --> ED
  TB -- Review/Publish --> RT
  RT -- Close restores Inspector / Locate+Fix --> ED
  BB --> PM
  PM -- "Open page in Editor (IA-05)" --> ED
  PM -- From template --> TP
  ED -- Edit main component --> CP
  CP -- "‹ Back to instance" --> ED
  CM -- "Edit collection page (SC-7 chip)" --> ED
  CM -- Locate condition --> ED
  RT -- History → Compare --> CT
  CT -- exit to origin --> RT
  TB -- org links / review link --> EXT
```

## Review-fix verification (REVIEW §E)

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

## Open questions register

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

## Principle observations

| PID | Module | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P31 | Doc set | Status vocabulary split: authority brief/annex use retired "DESIGN READY" while panels use SPEC COMPLETE | Readers over-trust readiness | PDB:7; HANDOFF:3; 00:284 | NEEDS REVISION |
| P32 | Shell IA | Clear global vs contextual split, one canonical home per destination, Areas named | — | PDB:231–277; 00:220 | PASS-SPEC |
| P33 | Navigation | Uniform return label pattern + direct-vs-contextual rule; frames only for contextual tasks | Low | 00:9–17; HANDOFF:70–76; PDB:884–898 | PASS-SPEC |
| P33 | Navigation | No URL state → reload/deep link lose area/record/task | Orientation loss | REVIEW:62; BK-156 P3 | NEEDS REVISION |
| P23 | Status | Owner-specific status strings and priority order; success only after receipt | Receipt registry not shipped (fallback page-only) | 00:68–72, :107; CTRL-05 | PASS-SPEC (blocked by dep) |
| P24 | Data safety | Release-blocking ⛔ guards for image loss, CMS field/collection delete, settings overwrite | Guards are interim | 00:103–147; P/07:91, P/08:95, P/10:76 | PASS-SPEC |
| P25 | Recovery | Undo-over-confirm + 30-day Recently deleted with declared exceptions | Page delete loses pre-warning of CMS/collection-page impact? | 00:273–279 vs PDB:879 | NEEDS REVISION (clarify) |
| P06 / P07 | Terminology | Glossary fixes nouns, but "Component library = account's sites" contradicts BD-16 workspace scope | Permission/scope misunderstanding | 00:211; PDB:218 | NEEDS REVISION |
| P38 | Dynamic data | Exhaustive state table for bindings (loading, failed, deleted, empty, live, multi-select, viewer) | — | DYN:336–359 | PASS-SPEC |
| P34 | Geometry | Concrete min/default/max, canvas budget arithmetic at 1440/1280/1024 | Not measured; tokens differ (56/284 vs 60/280) | HANDOFF:95–116 | PASS-SPEC (unmeasured) |
| P39 | A11y | F6 + fallback chord, single-key toggle (2.1.4), non-colour state rule, 24px targets | Browser acceptance pending | 00:74–76, :236; HANDOFF:95,120 | PASS-SPEC |
| P01 / P04 | Strategy | Persona/JTBD/activation exist but are hypotheses with no scheduled validation | Whole IA unvalidated with users | 00-STRATEGY:4, :39–45 | BLOCKED (no usability evidence) |
| P40 | UX debt (docs) | 6 historical docs (REPORT, IMPROVEMENT-PLAN, BATCH-01A, sketch, progress.json, RL) carry contrary directions without supersede markers | Designers build from stale direction | see D1-6, D1-13 | NEEDS REVISION |
| P29 | AI | SC-21 hides AI but PDB/HANDOFF still place AI in IA tree / task host | Ambiguous scope for this version | PDB:247, :423; HANDOFF:80; 00:332–340 | NEEDS REVISION (annotate) |

## Contradictions & gaps

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

## Consistency notes

| Function | Pattern A | Pattern B | Note |
|---|---|---|---|
| Area naming | "module workspace" / `moduleWorkspace` / "resource workspace" (PDB:235, HANDOFF:72, :106) | "Area" (00:220 — "workspace" reserved for organization) | Glossary wins; brief/annex not updated |
| Collection page noun | "template page", "Blog template", "Create template page" (DYN:6, :230, PDB:224) | "Collection page" (00:216; P/07:105) | DYN keeps old wording deliberately |
| Component noun | "master", "definition" (PDB:155, :429ff; REPORT M23) | "main component" (00:207–208; P/13) | |
| Back labels | "Back to Editor · [page]", "Back to Inspector" (PDB:344, :868; REPORT:137) | "‹ Back to {origin}" single pattern (00:17) | SC-1 wins |
| Inspector width | 300 fixed (PDB:737) | 320 adj. 300–400 (REPORT:136); 336 (ARCH:45) | historical docs |
| Rail / drawer width | 56 / 284 (HANDOFF:100–101) | 60 / 280 tokens (DYN:39; BATCH-01A:35; IMPROVEMENT-PLAN:141; REPORT:839) | HANDOFF:95 routes change through token pipeline |
| Status vocabulary | DESIGN READY (PDB, HANDOFF) | SPEC COMPLETE / VERIFIED (00:281; panels; DYN) | D1-1 |
| Delete confirmation | page delete "impact handling" (PDB:879); REPORT C1:156 "name … recovery" | Undo-only + Recently deleted; confirm only E-1…E-5 (00:273–276) | SC-15 wins |
| Esc | "closes innermost popup → surface → selection" (REPORT:128; PDB:906) | ladder ending in canvas "select parent" (00:19–37) | SC-2 wins |
| Preview desktop width | 1320 labelled (REPORT:402) | 1440 (00:99; DEC-IA-04) | |
| Undo eligibility | global ⌘Z (REPORT:231) | Editor/Brand only; elsewhere "Open Editor to undo" (PDB:803; 00:184) | consistent between PDB and 00 |
| Minimum supported size | 1280×720 lowest (RL:41) | test 1024×768…1440×600; overlays below 1024 (HANDOFF:116) | |
| Settings save labels | "Done" for Page settings (REPORT:247) | footer Save/Cancel (00:154; RL P3) | |
| Persona | solo designer (PDB:47; 00-STRATEGY:10) | roles list (HANDOFF:9); "designer/freelancer" (DYN:15; REPORT:3) | D1-5 |
| Decision-ID prefixes | RL G/T/L/C/S/I/Y/P/M/A/K/X/D/B/F/R/E/U/V/H/Q/Z | panel IDs with hyphen (U-1, K-1, T-1, R-1) and BK-nnn | D1-16 collisions |
