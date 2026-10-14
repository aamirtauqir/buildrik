# Product design plan: Webflow-grade editing workflows in the existing Buildrick editor

Source: [`docs/audits/2026-10-14-webflow-editor-audit/README.md`](../audits/2026-10-14-webflow-editor-audit/README.md) (BK-01…BK-89, 12/13 P0+P1 independently re-verified). Owner request (2026-10-14): "isko read karo or is ka product design karna hai waisa" — turn the audit into the product design. Reviewed with `/plan-ceo-review`.

Status: **IN REVIEW** — nothing below is approved until the ledger row says so.

## Step 0 evidence

### 0A. Premise

- **Real problem.** Users cannot use the editor to predict output, and common gestures silently lose work. The audit measured both live: Preview ≠ publish (BK-09), inspector shows defaults instead of rendered values (BK-10), resize/undo/duplicate/restore/master-update destroy work (BK-01…07), rich text and forms break on the live site (BK-40, BK-44).
- **The Webflow gap is structural, not a feature list.** Webflow's Style panel is organised around *selector × breakpoint × state* with colour-coded value origin (W04, W17–W20). Buildrick styles element-by-element, hides the active breakpoint on Desktop, never shows where a value comes from, and has no class rules.
- **Target outcome.** A designer or agency user can (1) see what scope an edit hits before making it, (2) style once and reuse, (3) trust that canvas = Preview = live site, (4) never lose work silently.
- **Do-nothing cost.** Every session risks silent data loss on resize/undo/duplicate; every published page with bold text ships literal `<strong>`; forms lose answers. Webflow-like ambition stalls because the foundation contradicts itself.
- **Proxy risk.** Shipping class styling (the most "Webflow" feature) before the trust layer would be a proxy: classes on top of an inspector that misreports values multiplies confusion.

### 0B. Existing code leverage

| Sub-problem | Reuse | Evidence |
|---|---|---|
| Class rules | `StyleEngine` already stores selector × media × pseudo rules, persists them (`exportStyles`/`importStyles`) and exports (`toCSS`) | `engine/styles/StyleEngine.ts:76-111,425-471` |
| Value origin | `useFieldOverrides` + `OverrideDot` already know breakpoint/state/master layers; extend, don't rebuild | `inspector/hooks/useFieldOverrides.ts` |
| Preview = publish | `ExportEngine` publish path already produces correct CSS (class base + responsive + hide + site CSS) | L2: canvas and export agree on every property |
| Canvas bar breakpoints | `BreakpointSwitcher` exists in Preview | `chrome-ui` |
| Undo leak | `CommandCenter.run` read-only gate + `data-bk-surface` stand-down exist; ⌘Z just bypasses them | `CommandCenter.ts:132-148,219-226` |
| Collection list query | `CollectionManager.queryContent` supports filter/sort/offset; nobody passes it | `engine/cms/CollectionManager.ts:475-513` |
| Interaction preview | Published WAAPI runtime plays correctly | L6 #5 |
| Publish gate | `lifecycle.ts` gate ordering + pre-publish checks list | `editor/shell/lifecycle.ts` |
| Full-page host | `FullPageRouter` + `OverlayMount` focus trap | `sidebar/FullPageRouter.tsx`, `chrome-ui/focus.ts` |
| Components | Override patches, variant API, library rows exist | `engine/components/*` |

Rebuild is not justified anywhere: every P0 is a bounded fix in an existing path, and every Webflow-gap capability has an engine seam already.

### 0C. Dream state

```
  CURRENT STATE                         THIS PLAN                              12-MONTH IDEAL
  Element-by-element styling;      ->   Trust layer first (no silent loss,  ->  Selector × breakpoint × state
  inspector shows defaults;             truthful values, Preview = publish);    styling with visible origin;
  Preview ≠ live; silent data           then scope visibility (canvas bar,      classes + component props/slots;
  loss on resize/undo/duplicate;        origin labels, Settings tab);           CMS lists with query; interaction
  classes are labels; components        then reuse (classes, in-place           timeline; staging; content-editor
  are per-site copies                   master editing, CMS query)              role — "Webflow-grade, Buildrick-
                                                                                 simple", every value predictable
```

### Landscape (Layer 1–3)

- **Layer 1 (tried and true):** Webflow's model — classes, breakpoints, states, origin colours, Element settings vs Style panel (07-webflow-reference). Framer: preview starts at the chosen breakpoint.
- **Layer 2 (search):** Agencies complain Webflow is too flexible for content editors and its rich-text editing is weak ([Webflow forum 47668](https://forum.webflow.com/t/client-having-issues-in-editor-on-their-webflow-site/47668), [dev.to comment](https://dev.to/simonhlee97/comment/1p0gn), [Client Seats thread](https://discourse.webflow.com/t/its-mid-2025-did-webflow-migrated-editor-seats-to-client-seats-yet/322869?page=3)). Market split: visual vs AI-first builders ([designrevision](https://designrevision.com/blog/webflow-alternative.md), [typeflo](https://typeflo.io/blog/webflow-alternatives)) — vendor-authored, treat as weak signal.
- **Layer 3 (first principles):** Webflow's power comes from *visible scope*, not from classes per se. Classes are only safe once the user can see what a change affects. So the sequence is: truthful values → visible scope → reuse. Buildrick's differentiators (React export, rendered version compare, honest AI, token rename safety, client review) should stay and be made truthful, not traded for parity.

## Decision ledger

| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| D3 defer scripted Preview (owner) | BK-09/BK-61; IA-08 sandbox; L6 #4 | Phase 1 Preview = publish for CSS only; scripted Preview deferred | — | deferred | Owner answer to D3 (2026-10-15): "Defer to TODOS.md". Scope: isolated-origin scripted Preview (BK-61 + script part of BK-09) only |
| D4 component slots (owner) | BK-85; W22 | **Phase 3 keeps in-place master editing + declared props + slots** | — | approved (kept) | Owner answer to D4 (2026-10-15): "Keep slots in Phase 3". Scope: slots designed and built with props on the stable-id override model |
| D5 repair existing corrupted content (owner) — text rule superseded by D9 | Section 2 GAP; L1 #7 (NaNpx persisted), L4 #1–3, #11, L2 §10-9 | **Phase 1 adds a one-time load scan: auto-repair mechanical cases (NaNpx, double-escaped text, relinkable images) after a version snapshot, one Undo, summary toast; report unrepairable items (lost responsive/hover rules) in Issues** | — | approved | Owner answer to D5 (2026-10-15): "Detect + safe auto-repair". Scope exactly as the D5 grid column A |
| D6 BK-51 paste-HTML script execution (owner) | Section 3; L4 #6 | **Phase 1 includes BK-51: sanitize at setContent + before mount, text stays text, dialog lists removals, flag-payload regression test** | — | approved | Owner answer to D6 (2026-10-15): "Add to Phase 1" |
| D7 VIEWER IP export (owner) | Section 3; L4 #28; `server/trpc/routers/forms.ts:91-99` | **Phase 1 strips IP/technical metadata from submission list/export below ADMIN; tested as VIEWER and ADMIN** | — | approved | Owner answer to D7 (2026-10-15): "Add to Phase 1" |
| D8 observability event set (owner) | Section 8 GAP; `errorTracking.ts` | **Each phase ships the Section 8 events for the behaviour it adds (no content payloads) via captureError/activity rows, plus the two runbook lines** | — | approved | Owner answer to D8 (2026-10-15): "Event set + runbook per phase" |
| OV-1 restore check uses CAS token (outside voice #1) | `unsavedRecovery.ts:29` stores only attempt time | Section 2/4 corrected: base CAS token equality; legacy snapshots = potentially conflicting | — | applied (factual correction) | Within BK-04's approved invariant (no overwrite of newer work without a choice); no behaviour change to approved scope |
| OV-5 CMS sort semantics (outside voice #5) | `CollectionManager.ts:475` string localeCompare | Section 4 corrected: field-aware comparator, nulls last, id tie-break, shared editor/publish | — | applied (factual correction) | Within Phase 3 CMS query (D1); correctness of the approved feature |
| D9 reopen D5 auto-repair scope (outside voice #2) | `element.ts:50` contentFormat has no corruption provenance; `&amp;amp;` may be intentional | **Auto-repair only NaN/non-finite sizes and images with an exact asset match; escaped-text matches listed as "possible damage" in Issues with one-click Fix; lost rules shown as unknown; snapshot + Undo + toast kept** | — | approved (supersedes D5's text rule) | Owner answer to D9 (2026-10-15): "Narrow to unambiguous cases" |
| D10 one cascade-precedence contract (outside voice #3) | `StyleEngine.ts:659-711` canvas inline base + `!important` re-emit vs publish class rules | **Phase 1 writes one precedence contract (element base, class, combo, breakpoint, state) and makes canvas, Preview and publish implement it; ResolvedStyle is built on it; Phase 3 classes slot into the existing layer** | — | approved | Owner answer to D10 (2026-10-15): "Define it in Phase 1" |
| D11 immutable publish snapshot (outside voice #4) | `publish.service.ts:25` checks DB pages; `:330` deploys client HTML + CMS expansion | **Phase 1: each publish builds one immutable bundle (pages HTML, settings, CMS), stored on the job; server checks run on it, deploy ships it, rollback redeploys it** | — | approved | Owner answer to D11 (2026-10-15): "One immutable snapshot per publish" |
| D1 approach (owner) | Audit §A/§F; 0A–0C above | **Three phases: (1) trust — P0 data-loss/security + truthful values + Preview = publish; (2) scope — canvas bar, origin labels, Settings tab; (3) reuse — classes, component props/in-place edit, CMS query** | — | approved | Owner answer to D1 (2026-10-15, AskUserQuestion): "Trust → scope → reuse, 3 phases". Scope: sequencing and phase content as in the D1 comparison grid; per-phase owner sign-off |


Approval readiness: PASS — checked D1 (D1 answer), D3 (D3 answer), D4 (D4 answer), D5 (D5 answer, text rule superseded by D9), D6, D7, D8, D9, D10, D11 (each owner AskUserQuestion answer, 2026-10-15), OV-1 and OV-5 (factual corrections inside approved BK-04 / Phase 3 CMS scope). No unresolved rows.

## Answered: D1 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B | C |
|---|---|---|---|---|---|
| Fix P0 data-loss + security bugs (BK-01…08, 40, 42, 44) | pending | backlog only | Phase 1 | yes (all of it) | after style rewrite |
| Truthful values + Preview = publish (BK-09, BK-10) | pending | backlog only | Phase 1 | yes | folded into rewrite |
| Visible scope: canvas bar, origin labels, Settings tab (BK-31, 33, 38) | pending | backlog only | Phase 2 | no (later plan) | in rewrite |
| Reuse: classes, in-place master edit/props, CMS query (BK-30, 85, 46) | pending | backlog only | Phase 3 | no (later plan) | first, as one rewrite |
| Product design deliverable | pending | none | design spec per phase, owner sign-off per phase | spec for trust layer only | one big spec |

Question: D1 — D1: Is product design ko kis order mein banayein? Project: Buildrick editor on main; the 10-14 Webflow audit found 89 backlog items. ELI10: The audit shows two kinds of work. Some bugs silently destroy user work (resize, undo, duplicate). The rest is what makes Webflow feel powerful: you can see what a change will affect, and you can style once and reuse. If we build the powerful part on top of an editor that still shows wrong values and loses work, users get more confused, not less. Stakes if we pick wrong: classes and props built on a lying inspector multiply wrong edits across many elements at once. Recommendation: A because it fixes trust first, then makes scope visible, then adds reuse — each phase makes the next one safe. Note: options differ in kind, not coverage — no completeness score. Net: speed to "Webflow features" vs. safety of everything those features touch.
Header: Design order
A) Trust → scope → reuse, 3 phases (recommended)
Phase 1 fixes data loss, security and truthful values. Phase 2 makes scope visible (canvas bar, origin labels, Settings tab). Phase 3 adds reuse (classes, component props, CMS query). Effort L, risk low. ✅ Every phase leaves the editor more trustworthy than before, with live QA gates. ✅ Reuses existing engine seams (StyleEngine rules, ExportEngine, CommandCenter) at every step. ❌ Class styling, the headline Webflow feature, arrives in phase 3, not first.
B) Trust layer only, then re-plan
Design and fix only phase 1 now; plan scope and reuse later in a separate review. Effort M, risk low. ✅ Smallest commitment; the P0 data-loss bugs get full attention immediately. ✅ Next plan starts from a verified, trustworthy baseline. ❌ No product design yet for the Webflow-style workflows the owner asked for.
C) Style system first, as one rewrite
Design the selector × breakpoint × state model with classes and origin as one new inspector, fixing bugs along the way. Effort XL, risk high. ✅ Reaches Webflow-style styling soonest and in one coherent model. ✅ Avoids redesigning the inspector twice. ❌ Leaves data-loss bugs live during a long rewrite and stacks new features on an untruthful value model.

## Mode

Mode: HOLD SCOPE; approved decisions: D1. Owner answer to D2 (2026-10-15): "HOLD SCOPE" (skill recommended SCOPE REDUCTION on the >15-file rule; owner chose HOLD).

## 0G. HOLD SCOPE checks

**Complexity check.** The approved scope is well over 8 files (estimate: Phase 1 ≈ 40, Phase 2 ≈ 30, Phase 3 ≈ 50). Fewer moving parts that reach the same goal:
- One **resolved-style model** (engine) feeds the inspector, the origin labels (Phase 2) and later class layers (Phase 3). Built once in Phase 1 (BK-10), reused twice. No second "origin" store.
- One **export CSS path** for canvas-independent output: Preview renders through the publish path (BK-09) instead of fixing `Composer.exportHTML`'s separate cascade.
- One **gate** for every undo/shortcut (route ⌘Z through `CommandCenter.run`, BK-05) instead of per-surface guards.
- One **PublishGate** hook for every publish door (BK-21).
- One **FullPageHost** primitive for Settings/Brand/Templates/Assets (BK-65), which is also what fixes BK-05's Brand case.

**Minimum changes for the goal, by phase.**

| Phase | Goal (observable) | Minimum backlog set |
|---|---|---|
| 1 Trust | No silent loss; values shown = values rendered; Preview = live | BK-01, 02, 03, 04, 05, 06, 07, 08, 40, 42, 44 (P0); BK-09, 10, 11, 12, 13, 21, 59, 65; **BK-51 (D6); load-time repair (D5, narrowed by D9); submission IP restriction (D7); one precedence contract for canvas/Preview/publish (D10); immutable publish snapshot (D11)** |
| 2 Scope | User sees breakpoint, state and origin before editing; content vs style separated | BK-31, 33, 34, 35, 38, 29, 14, 84 |
| 3 Reuse | Style once, reuse; edit a component in place; query CMS lists | BK-30, 85 (in-place edit + props), 46, 48, 88 |

**Deferrable without blocking the goal (each asked separately below):**
- Scripted/interactive Preview on an isolated origin (part of BK-09/BK-61) — Phase 1 needs CSS parity only.
- Component **slots** (part of BK-85) — asked as D4; **owner kept them in Phase 3**.

**Invariants kept from the audit:** every acceptance criterion in audit §F for the rows above; DESIGN.md (one accent `#1A56DB`, Inter, 4 px, chrome-ui only); flagged features stay PLANNED; Figma out of scope this round.

## Answered: D3 (deferred 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B |
|---|---|---|---|---|
| Preview CSS = publish CSS (overrides, hover, hide, site CSS, head code, device) | D1 Phase 1 | in | in | in |
| Preview runs interactions/scripts on an isolated origin + security review | pending | in (BK-09/BK-61) | deferred to TODOS.md | in Phase 1 |

Question: D3 — D3: Preview mein interactions/scripts chalana Phase 1 mein rakhein ya baad mein? Project: Buildrick editor, Phase 1 (trust). ELI10: Phase 1 makes Preview look exactly like the live site (styles, hover, mobile). Making Preview also RUN animations and scripts is a separate, riskier job: it needs a separate safe origin and a security review, because scripts in the editor's own origin could touch the user's session. Stakes if we pick wrong: keeping it in delays Phase 1; deferring it means users still check animations only after publish. Recommendation: A because the Phase 1 goal (no silent loss, truthful output) is met by CSS parity, and the script sandbox needs its own security review. Note: options differ in kind, not coverage — no completeness score. Net: Phase 1 speed vs. seeing animations before publish.
Header: Preview scripts
A) Defer to TODOS.md (recommended)
Phase 1 delivers Preview = publish for all CSS; scripted Preview becomes a TODO with its own security review. Effort S now (zero implementation), risk low. ✅ Phase 1 ships sooner and avoids a security-sensitive sandbox change. ✅ The exported page already plays interactions correctly, so users have a workaround. ❌ Authors still can't watch interactions inside the editor until the TODO lands.
B) Keep in Phase 1
Build an isolated-origin scripted Preview with the published WAAPI runtime as part of BK-09. Effort L, risk medium. ✅ Interactions, sliders, tabs and forms become checkable before publish. ✅ Closes IA-08 and BK-61 together with BK-09. ❌ Adds a sandbox/origin change that needs security review and delays the data-loss fixes.

## Answered: D4 (kept in scope 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B |
|---|---|---|---|---|
| In-place master editing on an instance | D1 Phase 3 | in | in | in |
| Declared component props (text, image, link, visibility) keyed by stable ids | D1 Phase 3 | in | in | in |
| Slots (nested content areas inside a component) | pending | in (BK-85) | deferred to TODOS.md | in Phase 3 |

Question: D4 — D4: Component "slots" Phase 3 mein rakhein ya baad mein? Project: Buildrick editor, Phase 3 (reuse). ELI10: Phase 3 lets you edit a component in place and expose simple settings (props) like its text, image or link per copy. Slots go further: a hole inside the component where each copy can hold different elements. Slots need nesting rules, drag-drop into instances and new override logic, which is the riskiest part of the component model. Stakes if we pick wrong: keeping slots in makes Phase 3 much larger; deferring means layouts that need different inner content per copy still need detaching. Recommendation: A because in-place editing plus props already solves the audit's component pain (BK-07, BK-16, BK-17), and slots can follow once props are stable. Note: options differ in kind, not coverage — no completeness score. Net: Phase 3 size vs. full Webflow-style component flexibility.
Header: Slots
A) Defer slots to TODOS.md (recommended)
Phase 3 ships in-place master editing and declared props; slots become a TODO built on the stable-id override model. Effort S now (zero implementation), risk low. ✅ Phase 3 stays focused on the component pains the audit measured. ✅ Slots land later on a proven stable-id override model instead of today's position paths. ❌ Copies needing different inner layouts still require detaching until slots ship.
B) Keep slots in Phase 3
Design and build slots together with props and in-place editing. Effort XL, risk high. ✅ Matches Webflow's documented component model (props, slots, variants) in one go. ✅ One redesign of the instance model instead of two. ❌ Largest and riskiest piece of Phase 3; delays classes and CMS query that share the phase.

## 0I. Temporal interrogation (per phase)

Effort: human team / CC + gstack.

| Phase | Hour 1 — foundations | Hour 2–3 — core logic | Hour 4–5 — integration surprises | Hour 6+ — what they'll wish they planned | Effort |
|---|---|---|---|---|---|
| 1 Trust | Audit §F P0 rows and their acceptance criteria; the live rig (`scripts/baseline/editor-rig.mjs`, port + URL overrides); `CommandCenter` gate; `StyleEngine` rule keys | Scale-correct resize; transaction-local cancel; ⌘Z through the gate; clone copies StyleEngine rules; instance overrides record bp/state; restore compares server `lastEditedAt`; review/library/theme authz by target site; `contentFormat` on commit; keep uploaded URL; force POST forms + radio value | Preview through the publish path changes what users see in Preview (good, but every Preview test baseline moves); restore conflict needs new UI copy; authz changes may break dashboard library and theme screens that relied on workspace-wide reads | Regression tests for each P0 that fail on HEAD first; a migration for already-corrupted data (`NaNpx` widths, escaped `&amp;amp;` text, src-less images) | human ~3 weeks / CC ~2–3 days |
| 2 Scope | Resolved-style model from Phase 1 (BK-10) is the data source; DESIGN.md tokens; chrome-ui components | Canvas bar with breakpoint + width + breadcrumb; OriginLabel replacing OverrideDot; state forced on canvas; visibility as cascading style; Settings tab move | Moving alt/src/form settings out of Style changes every inspector test and the conformance boards; `--hide-*` → display:none needs a data migration for existing sites | Keyboard paths for every new control; 1280×720 layout | human ~3 weeks / CC ~2–3 days |
| 3 Reuse | StyleEngine `.class` rules; ComponentInstances override paths; `CollectionManager.queryContent` | Selector field + class rules + affects-N + rename; in-place master edit; declared props + **slots** (D4) on stable ids; CMS query editor | Classes change export CSS order (class rules must precede element rules); props/slots change the saved instance format → migration from position-path overrides; CMS query must match server publish snapshot | Style selectors cleanup (unused classes); prop/slot editing for content-only roles later; library propagation (BK-18) interacts with props | human ~6 weeks / CC ~5–7 days |

**Feasibility blockers found:** none blocking. Two pre-conditions: (1) Phase 3 cannot start before Phase 1's resolved-style model lands (class layer plugs into it); (2) props/slots need an instance-format migration plan before build.

**Pending choices (not asked yet; implementation-level, decided in the review sections only if they change scope):** data migration strategy for already-corrupted content; whether Phase 2's visibility change migrates `--hide-*` automatically.

## Review depth

Strategy-level capability rows per phase with "implementation owner must prove ___" notes (3 phases, ~120 files). Each phase gets its own `/plan-eng-review` for method-level contracts before build.

## Section 1 — Architecture

```
                         ┌────────────────────── editor chrome (React) ──────────────────────┐
  Phase 2  CanvasBar ────┤ Inspector: SelectorField(P3) · OriginLabel(P2) · Style | Settings │── FullPageHost(P1)
  (bp, width, crumb)     └───────────────┬───────────────────────────────┬───────────────────┘
                                         │ reads                         │ writes (one gate)
                               ┌─────────▼─────────┐            ┌────────▼─────────┐
  Phase 1 NEW ───────────────► │ ResolvedStyle     │            │ CommandCenter.run│◄── ⌘Z/⇧⌘Z, menus,
                               │ (layers + origin) │            │ (read-only, lock,│    shortcuts (P1)
                               └─────────┬─────────┘            │  full-page gate) │
                                         │                      └────────┬─────────┘
           ┌─────────────────────────────▼──────────────────────────────▼──────────────┐
           │ StyleEngine rules: selector × media × pseudo   (element P1 · .class P3)    │
           │ ElementManager clone → copies rules (P1)   ComponentInstances (P1 bp/state  │
           │ overrides → P3 stable-id props + slots)    CollectionManager.queryContent(P3)│
           └─────────────┬───────────────────────────────────────────────┬──────────────┘
                         │ export (one CSS path)                          │ save (CAS)
                ┌────────▼────────┐                              ┌───────▼────────────┐
                │ ExportEngine    │──► Preview (P1 uses this)    │ BuildrikSyncProvider│──► sites.saveProject
                │ publish/ZIP     │──► Publish (+ server checks) │ restore vs server   │    (lastEditedAt CAS)
                └─────────────────┘                              │ lastEditedAt (P1)   │
                                                                 └─────────────────────┘
  Server (P1): reviews/library/theme authz by target site · PublishGate server-side checks · forms POST
```

**Findings**

- **OK — one-way dependencies.** Every new piece sits on an existing seam (StyleEngine rules, ExportEngine, CommandCenter, CAS save). No new service, no new storage. Coupling added: Preview → ExportEngine (justified: removes a second cascade, `Composer.exportHTML`).
- **WARNING — ResolvedStyle is a new single point of truth for display.** If it is wrong, every field, origin label and (Phase 3) class view is wrong at once. Implementation owner must prove: for every element type on the audit fixture at Desktop/Tablet/Mobile × Base/:hover, displayed value = `getComputedStyle` (or names the intended difference). This is the audit's BK-10 acceptance, run across all types, not three.
- **WARNING — instance format change (Phase 3).** Props + slots replace position-path overrides. Saved projects carry the old format. Implementation owner must prove a lossless load-time migration and a rollback story (old code reading new format).
- **OK — scaling.** Rules per element ×3 breakpoints ×5 states; class rules reduce rule count. Watch: ResolvedStyle recomputation on every selection change; must stay < 16 ms on a 500-element page (owner must measure).
- **Security architecture:** P1 changes three server surfaces (reviews revoke/resolve, site-component library, theme reads). Each must bind to the target site and the effective site role (Section 3).
- **Rollback posture.** Phase 1 fixes are code-only and individually revertable, except any data repair (Section 2/9). Phase 2 Settings-tab move is UI-only. Phase 3 format migrations are one-way unless a down-migration ships with them.
- **Value test (artifacts about the work).** This plan file and the audit are owner-requested; they retire when Phase 3 ships. The per-phase QA results are consumed by the owner sign-off gate. No other process artifacts are added.

## Section 2 — Error & rescue map (capability level)

```
  CAPABILITY / BOUNDARY            | WHAT CAN GO WRONG                          | CLASS
  ---------------------------------|--------------------------------------------|---------------------
  Save (CAS)                       | server newer than local snapshot           | SAVE_CONFLICT
                                   | network down                               | NetworkError
  "Restore my edits"               | snapshot's base CAS token ≠ server token    | StaleRestore (NEW)
  Resize gesture                   | non-finite size, zoom ≠ 100 %, unmount     | InvalidGeometry (NEW)
  Clone / duplicate                | rules for old id not found                 | (none today) ← GAP
  Master update / reset            | override cannot be re-applied              | OverrideDropped
  Asset upload                     | Blob ok, createAsset fails                 | RegistrationFailed
  Preview build                    | export throws                              | (silent today) ← GAP
  Publish                          | checks fetch fails / blocker present       | ChecksUnavailable / Blocked
  Form submit (published)          | wrong method / encoding                    | 405 / 400 ← GAP (P1 fix)
  AI request                       | URL too large                              | 431 ← mislabelled
  Existing corrupted content       | NaNpx, escaped text, src-less img, lost    | (no detector) ← GAP
                                   | responsive/hover rules already saved       |

  CLASS              | RESCUED? | RESCUE ACTION                                   | USER SEES
  -------------------|----------|-------------------------------------------------|---------------------------
  SAVE_CONFLICT      | Y        | ConflictModal; Overwrite snapshots server first | "Changed elsewhere" (not "connection")
  StaleRestore (NEW) | Y        | offer Review / Keep server / Overwrite+backup   | explicit choice
  InvalidGeometry    | Y        | refuse write, keep previous size                | nothing changes
  OverrideDropped    | Y        | count bp/state too; Undo restores them          | "N overrides couldn't be kept · Undo"
  RegistrationFailed | Y        | keep uploaded URL, retry createAsset only       | "Saving image… · Retry" per tile
  Preview build fail | N ← GAP  | catch, show error in overlay, log               | "Preview couldn't load · Retry"
  ChecksUnavailable  | Y        | publish disabled; server refuses anyway         | "Checks didn't load · Retry"
  431 / too large    | Y        | send by POST; distinct copy                     | correct cause
  Corrupted content  | N ← GAP  | see D5                                          | today: silently broken pages
```

**Findings:** two GAPs need decisions beyond the audit rows: Preview build failure (silent today, `AquibraStudio.tsx:293,874` no catch) and already-corrupted user content. The Preview one is a required repair under "zero silent failures" and the HOLD rule (repairs needed to meet invariants are in scope); it is folded into BK-09's acceptance: **Preview shows an error state with Retry on build failure.** The corrupted-content one changes scope → D5.

## Answered: D5 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B | C |
|---|---|---|---|---|---|
| Stop new corruption (BK-02, 06, 40, 42) | D1 Phase 1 | in | in | in | in |
| Detect already-corrupted content (NaNpx, double-escaped text, src-less images, orphan rules) | pending | none | yes, on project load | yes, on project load | no |
| Repair it | pending | none | auto-repair the safe cases (NaNpx → remove, `&amp;amp;` → decode once, re-link src via asset id/URL) with one Undo + a version snapshot first | no; show an Issues list with "fix" per item | no |
| Lost responsive/hover styles from past duplicates | pending | none | reported only (cannot be recreated) | reported only | no |

Question: D5 — D5: Jo content pehle se kharab ho chuka hai, uska kya karein? Project: Buildrik editor, Phase 1 (trust). ELI10: Phase 1 stops the bugs from damaging new work. But real sites already saved damaged data: widths stored as NaNpx, text saved with escaped tags so it shows "&lt;strong&gt;" on the live site, images that lost their link, copies that lost their mobile styles. Fixing the bug does not fix the saved data. Stakes if we pick wrong: doing nothing leaves those sites broken after the fix ships; auto-repair that guesses wrong could change a page the user liked. Recommendation: A because the safe cases are mechanical and a version snapshot plus one Undo makes the repair reversible, which matches "zero silent failures". Completeness: A=9/10, B=7/10, C=3/10. Net: automatic fixing of known-safe damage vs. asking the user item by item.
Header: Repair data
A) Detect + safe auto-repair (recommended)
On load, scan once; auto-fix only mechanical cases (NaNpx, double-escaped text, relinkable images) after saving a version, with one Undo and a summary toast; report what can't be fixed. Effort M, risk medium. ✅ Damaged live sites heal on next open without users hunting for problems. ✅ Version snapshot + Undo make every repair reversible and visible. ❌ Needs careful rules so it never "repairs" intentional content like a literal "&amp;" in code text.
B) Detect + report only
On load, list damaged items in the Issues panel with a Fix button per item; nothing changes automatically. Effort S, risk low. ✅ Zero chance of an unwanted automatic change. ✅ Users see exactly what was damaged and where. ❌ Many users never open Issues, so most damaged live sites stay broken.
C) Do nothing
Phase 1 stops new damage only. Effort S (zero implementation), risk low now. ✅ Smallest Phase 1. ✅ No new load-time code path to maintain. ❌ Already-broken published sites stay broken with no signal to their owners.

## Section 3 — Security & threat model

| Threat | Likelihood | Impact | Plan mitigates? |
|---|---|---|---|
| Site-scoped member revokes/approves reviews on other sites (RR-01, capped ADMIN) | Med | High (unblocks publish, kills client links) | **Yes** — BK-08 in Phase 1 (bind to the review's own site + effective site role) |
| Site-scoped member reads other sites' component payloads and the workspace site list | Med | Med (agency client data exposure) | **Yes** — BK-08 (`siteScopeWhere` on library/theme reads) |
| Paste HTML runs script in the editor origin (BK-51, LIVE ✔ L4 #6); dialog falsely says the handler is removed | Low (user pastes it) | High (editor-origin script can act on the user's session, e.g. pasted from a malicious page) | **No** — BK-51 is P1 and not in the Phase 1 set → D6 |
| VIEWER exports submitter IPs (BK-45, LIVE ✔ L4 #28) | Med | Med (PII exposure to read-only members) | **No** — in BK-45 (P1), not in Phase 1 → D7 |
| D5 auto-repair rewrites user content on load | Low | Med | Partly — version snapshot first + Undo + summary; owner must prove the rules never touch code/text that intentionally contains `&amp;` |
| Phase 3 class names / prop values as new inputs | Med | Low–Med | Owner must prove: class names validated (letter first, `[a-z0-9-]`), prop values sanitized like content (DOMPurify), slot content goes through the same insert/sanitize door |
| AI prompt context via POST (BK-15) | Low | Low | Yes — keeps server quota/role checks; no new secret |
| Audit logging | — | — | Owner must prove: review revoke/approve, theme push/rollback and D5 repairs write activity rows (actor, site, what changed) |

No new secrets, dependencies or endpoints beyond moving AI context to POST.

## Answered: D6 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B |
|---|---|---|---|---|
| Sanitize content at `setContent` and before canvas mount; keep decoded text as text | pending (BK-51) | P1 backlog | Phase 1 | later |
| Paste dialog lists exactly what was removed | pending (BK-51) | P1 backlog | Phase 1 | later |

Question: D6 — D6: Paste HTML se script chal jane wala security bug Phase 1 mein theek karein? Project: Buildrick editor, Phase 1 (trust). ELI10: When a user pastes HTML, a hidden script inside it can run inside the editor, even though the paste dialog says it was removed. Only the person pasting triggers it, but the HTML could come from a malicious web page they copied, and a script in the editor's own origin can act as that user. The fix is small: clean the content before it reaches the canvas. Stakes if we pick wrong: leaving it means a known script-execution hole stays open during the whole Phase 1 work. Recommendation: A because it is a small, contained fix in the same content path Phase 1 already touches for rich text (BK-40). Note: options differ in kind, not coverage — no completeness score. Net: a slightly larger Phase 1 vs. a known security hole staying open.
Header: Paste XSS
A) Add to Phase 1 (recommended)
Sanitize at `setContent` and before mount, keep text nodes as text, and make the dialog list what it removed; regression test with the flag payload. Effort S, risk low. ✅ Closes a confirmed script-execution path in the editor origin. ✅ Shares the content-encoding work of BK-40, so little extra effort. ❌ Phase 1 grows by one more item to build and QA.
B) Leave in backlog
Keep BK-51 at P1 for a later batch. Effort S now (zero implementation), risk medium. ✅ Phase 1 stays exactly as approved in D1. ✅ No change to the paste path during the data-loss fixes. ❌ The hole and the false dialog message stay live until the later batch.

## Answered: D7 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B |
|---|---|---|---|---|
| Submitter IP in submission export/list restricted to ADMIN+ | pending (part of BK-45) | P1 backlog | Phase 1 | later with BK-45 |
| Rest of BK-45 (select options, type change, redirect clear) | BK-45 P1 | backlog | backlog (unchanged) | backlog |

Question: D7 — D7: Viewer ko form submitters ki IP export karne se rokna Phase 1 mein karein? Project: Buildrick editor, Phase 1 (trust). ELI10: Anyone with read-only (Viewer) access to a site can export form submissions as JSON, and the export includes each visitor's IP address. IPs are personal data. The fix is one server check: only admins get IPs. Stakes if we pick wrong: visitor IPs stay readable by read-only members until the later forms batch. Recommendation: A because it is a one-line server permission fix that removes a personal-data leak, and it is independent of the rest of BK-45. Note: options differ in kind, not coverage — no completeness score. Net: one tiny extra Phase 1 item vs. a privacy leak staying open.
Header: IP export
A) Add to Phase 1 (recommended)
Strip IP (and any other technical metadata) from list/export for roles below ADMIN; test as VIEWER and ADMIN. Effort S, risk low. ✅ Closes a confirmed personal-data exposure to read-only members. ✅ Independent one-line server change with a clear test. ❌ Phase 1 grows by one more item.
B) Leave in BK-45
Fix it later together with the other form-editing defects. Effort S now (zero implementation), risk medium. ✅ Phase 1 stays as approved. ✅ All form fixes ship together in one batch. ❌ Viewers can keep exporting visitor IPs until then.

## Section 4 — Data flow & interaction edge cases

**Restore vs newer server work (BK-04), async ordering.** Invariant: *a local snapshot never overwrites server work newer than the snapshot without an explicit user choice.*

```
 tab A (offline edit)      server                    tab B (online)
 ─────────────────────     ──────────────────────     ──────────────────────
 edit → save fails         lastEditedAt = T0
 local snapshot @T1                                    add page → save → T2
 reload → load server(T2)  ◄─ T2
 "Restore my edits"?  ──►  compare snapshot.baseLastEditedAt (T0) vs server (T2)
     T0 == T2 → restore + save (CAS on T2)  ✔
     T0 <  T2 → StaleRestore → Review / Keep server / Overwrite (+ server snapshot version first)
 Order 2: B saves AFTER A's restore started → A's save CAS(T2) fails → SAVE_CONFLICT modal ✔
```
Mechanism: the snapshot must carry the server CAS token (`lastEditedAt`) its edits were based on — **not** the time the failed save was attempted (`UnsavedWork.at`, `services/unsavedRecovery.ts:29`) — and restore requires token equality. **Legacy snapshots without the token are treated as potentially conflicting** (always show the choice). (Correction from outside voice #1, 2026-10-15.) Regression proof: two contexts with controlled pause between A's reload and B's save, both orders.

**Duplicate with rules (BK-06):** `clone → new ids → copy rules(old→new, all media, all pseudo) → one transaction → save`. Shadow paths: no rules (copy nothing, fine); rule for a nested child (map every id in the subtree); paste into another page (rules travel with project styles); undo (transaction restores both).

**Load-time repair (D5):** `load → scan (NaN, double-escape, src-less) → snapshot version → repair in one transaction → toast "Repaired N items · Undo" → save`. Shadow paths: snapshot fails → do not repair, report in Issues; concurrent tab → CAS conflict modal as usual; repair finds 0 → nothing, no toast; read-only/VIEWER → detect and report only, never write.

| Interaction | Edge case | Handled? | How (required) |
|---|---|---|---|
| Resize | release with no movement; zoom 25/150 %; Escape; unmount mid-drag | after P1 | zero-delta no-op; scale maths; gesture-local rollback |
| ⌘Z | focus in Settings/Brand/time-travel; undo of another page | after P1 | gate + full-page stand-down; navigate to undone page |
| Publish | double-click "Publish now"; checks loading; failure retry | after P1 | button disabled until checks; single PublishGate; job tracked in topbar |
| Restore | two tabs; offline → online | after P1 | baseLastEditedAt compare (above) |
| Repair (D5) | user hits Undo after save | after P1 | Undo restores and saves; snapshot version stays |
| Class rename (P3) | rename to existing name; 200 elements use it | P3 owner must prove | inline error; one transaction; affects-N shown before confirm |
| Slots (P3, D4) | drag element into a slot of a locked instance; slot deleted on master | P3 owner must prove | lock gate; deleting a slot warns with count of instances losing content |
| CMS query (P3) | filter matches 0; sort on deleted field; numeric/date/null values; ties under offset | P3 owner must prove | collection-list empty state; invalid sort shown as warning; **field-aware ordering (numbers numeric, dates as dates, nulls last), deterministic tie-break by id, one comparator shared by editor and publish** — `queryContent` today string-compares every value (`CollectionManager.ts:475`), so it is not reusable as-is (correction from outside voice #5) |

## Section 5 — Code quality

- **OK — no new abstractions without a second consumer.** ResolvedStyle has three consumers (fields, origin labels, classes); PublishGate has four doors; FullPageHost has four tools.
- **WARNING — duplicate logic the plan must delete, not wrap:** `Composer.exportHTML` cascade (replaced by the publish path for Preview); two ⌘S handlers (`defaultCommands.ts:80-85` + `useEditorShortcuts.ts:167-170`); three Group eligibility rules; `GlobalStyleManager` (dead; fold into the Phase 3 class registry or delete — CLAUDE.md no-dead-code); `getClassStyles`/`computeStyles` (unused; do not wire as-is, they merge media variants wrongly).
- **WARNING — repo rules already violated in touched files:** `../../` imports in AI/interactions/settings hooks; inline style objects in `InteractionEditor`. Clean them when the file is touched (CLAUDE.md).
- Complexity: the load-time repair scan and the class cascade will branch heavily; owner must keep each rule a separate small function with its own test.

## Section 6 — Test review

Every audit row in the phases already has a testable acceptance criterion (audit §F). Required proof per item: **a regression test that fails on `df60cf9ec` first, then passes**, plus the live check from the audit lane re-run on the dev app (CLAUDE.md: live app is the verifier).

```
 NEW THING                          | TYPE              | HAPPY                      | FAILURE                         | EDGE
 -----------------------------------|-------------------|----------------------------|---------------------------------|------------------------------
 Scale-correct resize               | unit + e2e        | +20px@50% = +40 CSS px     | NaN refused                     | zero delta, 25/150 %
 Gesture-local cancel               | unit              | Escape restores start      | unmount mid-drag                | prior edit untouched
 ⌘Z gate                            | unit + e2e        | canvas undo                | in Settings/Brand/time-travel   | focus in input
 Rule-copying clone                 | unit              | bp + :hover copied         | subtree ids                     | reload
 Instance bp/state overrides        | unit              | survive master update      | dropped count incl. bp/state    | Undo restores
 Restore vs newer server            | integration (2 ctx)| same base → restore       | newer server → choice           | both orders
 Authz by target site               | integration (tRPC)| own site ok                | other site 403                  | capped admin
 contentFormat + sanitize (BK-40/51)| unit + export     | <strong> survives export   | script payload inert            | literal "&amp;" in code text
 Upload registration retry          | integration       | one Blob, one row          | createAsset fails once          | reload mid-retry
 Forms POST + radio value + IP      | integration       | value stored               | GET/multipart forced to POST    | VIEWER export has no IP
 Preview = publish CSS              | e2e               | 375px value equal          | build throws → error state      | hover, hide, site CSS
 PublishGate                        | unit + e2e        | publish after checks       | checks fail → refuse (server)   | retry path
 Load-time repair (D5)              | unit + integration| 3 damage types repaired    | snapshot fails → no repair      | VIEWER: report only
 ResolvedStyle                      | unit + e2e sweep  | all types × bp × state     | inherited/class/token origins   | 500-element perf
```
2am-Friday test: the e2e sweep that compares inspector value vs `getComputedStyle` for every element type × breakpoint × state on the audit fixture. Hostile-QA test: two tabs + offline + restore + publish. Chaos test: kill the network during upload registration and during a publish.

Flakiness: the live rig's HTML5 drag hangs headless Chromium (L1); drag tests need a headed run or a non-drag API path. Fonts: await `document.fonts.ready` before computed-style reads (prior learning `cdn-fonts-poison-computed-style-baselines`).

## Section 7 — Performance

- ResolvedStyle on selection change: must be < 16 ms on a 500-element page (measure with the existing fixture + a generated large page).
- D5 load scan: one pass over elements and styles; must be < 100 ms on a 500-element page and must not block first paint (run after load, before autosave starts).
- Preview through the publish path: export cost moves into Preview; it already exists for publish. Owner must measure Preview open time before/after on a 7-page site (target: no worse than +300 ms).
- Phase 3 class rules: fewer rules than per-element styling; CSS size should drop.
- Server: authz filters add a `siteScopeWhere` to library/theme queries; confirm indexed columns (`siteId`, `workspaceId`).

## Section 8 — Observability

Today: `shared/utils/errorTracking.ts` (`captureError`, Sentry, prod-only) and server activity rows. None of the audit's silent failures (resize writes, ⌘Z behind tools, restore overwrite, dropped overrides, registration failures, publish refusals) emit a signal; they were found only by a live audit.

**GAP — the plan has no way to know Phase 1 worked in production.** Proposed event set (D8), structured, no content payloads:

| Event | Fires when | Tells you |
|---|---|---|
| `save.conflict` / `restore.stale_choice` | CAS conflict; StaleRestore choice made | how often teammates collide; which choice users pick |
| `geometry.refused` | non-finite/zero-delta write refused | resize bug regressions |
| `undo.blocked_surface` | ⌘Z refused behind a full-page tool | gate working |
| `component.overrides_dropped` | update/reset drops overrides (count by kind) | data-loss rate |
| `media.registration_failed` / `_recovered` | createAsset fails / retry succeeds | upload durability |
| `publish.refused` (reason) | server refuses publish | checks enforced |
| `repair.applied` (counts by type) / `repair.undone` | D5 load-time repair | how much damage existed; whether repairs are wanted |
| `preview.build_failed` | Preview export throws | Preview health |

Runbook lines (owner must write): what to do when `repair.undone` rate > 5 % (repair rules too aggressive), when `component.overrides_dropped` > 0 after Phase 3 (format migration bug).

## Answered: D8 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B | C |
|---|---|---|---|---|---|
| Structured events from the Section 8 table, shipped with the phase that adds the behaviour | pending | none | yes | no | no |
| Exceptions reported via `captureError` with context | pending | partial | yes | yes | no |
| Runbook lines for repair-undo rate and overrides-dropped | pending | none | yes | no | no |

Question: D8 — D8: Har phase ke saath production signals (events) bhejein ya nahi? Project: Buildrick editor, all 3 phases. ELI10: Every bug in this audit was silent: nothing in production told anyone that work was lost; we only found them by testing by hand. If Phase 1 ships without signals, we will not know whether it really stopped the losses, or whether the new auto-repair (D5) annoys users. A small set of named events (no user content) fixes that. Stakes if we pick wrong: without signals, regressions stay invisible exactly like before. Recommendation: A because "zero silent failures" needs a production signal for each failure class the plan fixes. Completeness: A=9/10, B=6/10, C=2/10. Net: a little extra work per phase vs. flying blind after shipping.
Header: Signals
A) Event set + runbook per phase (recommended)
Ship the Section 8 events with the behaviour they watch, using the existing Sentry/activity plumbing, plus two runbook lines. Effort S per phase, risk low. ✅ Shows in production whether each fix holds and whether auto-repair is welcome. ✅ Reuses `captureError`/activity rows; no new service. ❌ Adds event names to maintain and a privacy check that no content leaks into them.
B) Exceptions only
Report thrown errors via `captureError` with context; no behaviour events. Effort S, risk low. ✅ Minimal change; catches crashes. ✅ Nothing new to name or maintain. ❌ Silent non-crash failures (dropped overrides, refused publishes, stale restores) stay invisible.
C) Nothing new
Rely on manual QA and user reports. Effort S (zero implementation), risk high. ✅ No extra work. ✅ No new data collection. ❌ Repeats exactly how these bugs survived until a manual audit.

## Section 9 — Deployment & rollout

- **Deploy target:** cPanel Node app via rsync, migrations over SSH tunnel; inode quota tight (memory `buildrik-prod-deploy-reality`). Every phase must check the inode budget before deploy.
- **Feature flags:** `NEXT_PUBLIC_*` flags are baked at build time (prior learning `flag_mechanism_next_public_is_buildtime`), so "flip a flag to roll back" means a rebuild. Treat rollback as **redeploy previous build**.
- **Data writes per phase:**
  - Phase 1: D5 load-time repair writes user content → always version-snapshot first; ship repair rules behind a server-read kill switch (DB/config value read per request, not `NEXT_PUBLIC_*`) so it can be stopped without a rebuild. Owner must prove the kill switch works.
  - Phase 2: visibility `--hide-*` → cascading display style is a data change; pending choice (owner: Phase 2 eng review) whether to migrate on load or keep reading both forms.
  - Phase 3: instance overrides position-path → stable-id props/slots is a format migration; old code must not load new-format projects silently (version field + refusal message), or ship a down-migration.
- **DB migrations:** none required for Phase 1–2 by the audit rows. Phase 3 may add class/prop storage; must be additive (`IF NOT EXISTS`, memory `duplicate-cms-edited-at-migration`).
- **Rollout order per phase:** server authz/gates first (safe with old clients), then editor bundle.
- **Deploy-time window:** old editor tabs open during deploy keep old behaviour until reload; CAS conflict modal protects saves (verified L5 #28).
- **Post-deploy checks (first 5 min):** login on prod, open a site, resize at 50 % (no size change on click), ⌘Z in Settings (no canvas change), Preview vs canvas at 375 px, one publish to a test site, `repair.applied` event visible. First hour: watch Section 8 events.

## Section 10 — Long-term trajectory

- **Debt introduced:** ResolvedStyle becomes the core read model (good debt: replaces three partial ones). Phase 3 format migration is the one-way door.
- **Reversibility:** Phase 1 = 4/5 (code fixes; repair is snapshot-backed). Phase 2 = 4/5 (UI moves; visibility migration 3/5). Phase 3 = 2/5 (class rules + props/slots change saved data).
- **Path dependency:** Phase 3 is easier because Phase 1 builds ResolvedStyle and Phase 2 builds OriginLabel and SelectorField's home. Later items (content-editor role BK-70, timeline BK-72, staging, libraries BK-18) sit on the same model: the content-editor role becomes "Settings tab + props only", which props/slots make natural.
- **1-year question:** a new engineer reads ResolvedStyle → StyleEngine → ExportEngine. Owner must add an engine AGENTS.md section for ResolvedStyle and the class cascade order.
- **Ecosystem fit:** chrome-ui + `tw:` + `--bk-*`; Composer single gateway; no new libraries.

## Section 11 — Design & UX

UI scope: yes (canvas bar, inspector, Settings tab, selector field, components, CMS query, Preview, publish gate).

**Information architecture (what the user sees first, second, third) after all phases:**
```
 Canvas bar:  [Undo Redo]  [Desktop 1024px ▾ | Tablet | Mobile]  Home › Section › Card › Heading   [Fit ▾ 75%]
 Inspector:   Heading · "Hero title"                               ⋯
              [ This element ▾ ][ .btn-primary ][ + class ]   Affects 3 elements      (P3)
              Editing Mobile · :hover                                                 (P2)
              Style | Settings | Effects
              Typography  ● Font size 32px   (set on Mobile)                          (P2 origin)
                          ○ Line height 1.5  (inherited from body)
```

**Interaction state coverage:**

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Preview (P1) | building… | "No content" | build failed + Retry | renders at canvas device | CMS unavailable → note |
| Restore choice (P1) | checking server | no local copy → hidden | server unreachable → keep local, retry | restored + saved | server newer → choice |
| Load repair (P1) | silent | nothing found → no toast | snapshot failed → Issues only | "Repaired N · Undo" | some unrepairable → Issues list |
| Publish gate (P1) | checks loading → disabled | nothing to publish | checks failed → retry, refuse | live + URL | warnings only |
| Canvas bar (P2) | — | — | — | breakpoint/width shown | custom width |
| Origin labels (P2) | — | unset → "inherited from …" | — | set here | mixed (multi-select) |
| Selector field (P3) | — | no classes → "This element" | invalid name inline | affects N | combo class |
| Slots (P3) | — | empty slot placeholder | locked instance → refused + reason | content placed | slot removed on master → warn |
| CMS query (P3) | items loading | 0 matches → empty state | invalid sort field → warning | list renders | drafts badge |

**Journey storyboard (agency designer, after Phase 3):** open site → sees Desktop 1024 in canvas bar (calm: knows the scope) → selects button → sees `.btn-primary · Affects 6` (confident: knows the reach) → switches to Mobile, changes padding → label says "set on Mobile" (in control) → Preview opens on Mobile and matches (trust) → publish gate green → live site identical (relief).

**DESIGN.md alignment:** Inter, one accent `#1A56DB`, 4 px spacing, compact density, chrome-ui only. Origin colours must not introduce purple/violet (banned); use the accent for "set here", ink-muted for "inherited", and a neutral outline for "class" — designer to confirm.

**AI-slop risk:** low; every surface is a concrete editor control. Watch the repair toast and the restore dialog copy: plain, specific, no reassurance filler.

**Responsive / desktop-only:** editor is desktop-only (DESIGN.md); target 1280–1920 widths; 1280×720 must keep the inspector in-flow (BK-14).

**Accessibility:** canvas bar and selector field keyboard-operable; origin conveyed by text, not colour alone; FullPageHost focus in/inert/return (BK-65); disabled reasons via `aria-describedby` (BK-64 pattern).

Recommendation: run `/plan-design-review` on this plan before Phase 2 build, and `/design-review` on the live app after each phase.

## Answered: D9 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current (D5) | A | B | C | D |
|---|---|---|---|---|---|---|
| Auto-repair NaN/non-finite sizes | D5 | yes | yes | yes | pending | yes |
| Auto-repair double-escaped text | D5 | yes | **no — list as "possible damage" candidates in Issues with a one-click Fix** | yes | pending | yes |
| Auto-relink images | D5 | yes | only when an asset with the exact uploaded URL/name+size exists | yes | pending | yes |
| Lost responsive/hover rules | D5 | reported | reported as "unknown — can't tell" | reported | pending | reported |
| Version snapshot + Undo + toast | D5 | yes | yes | yes | yes | yes |

Question: D9 — D9 (reopens D5): Auto-repair ko sirf pakki galtiyon tak mehdood karein? Project: Buildrick editor, Phase 1 (trust). ELI10: You approved automatic repair of damaged content (D5). The outside reviewer points out that one of the three repairs is a guess: text like "&amp;amp;" might be damage, or might be what the user really typed (for example in a code sample). The saved data has no flag saying "this was damaged". Undo makes a wrong repair reversible, but the user may never notice it happened. Stakes if we pick wrong: keeping it may silently change correct text on live sites; narrowing it leaves some damaged text until the user clicks Fix. Recommendation: A because only NaN sizes and exact-match images are unambiguous; text needs a human yes. Note: options differ in kind, not coverage — no completeness score. Net: fully automatic healing vs. never changing text the user meant.
Header: Repair scope
A) Narrow to unambiguous cases (recommended)
Auto-fix NaN sizes and images with an exact asset match; show escaped-text matches as "possible damage" in Issues with one-click Fix; lost rules shown as unknown. Effort M, risk low. ✅ No automatic change to text the user may have meant. ✅ Still heals the clear-cut damage without user effort. ❌ Damaged text on live sites stays until someone clicks Fix.
B) Keep D5 as approved
Auto-repair all three cases after a version snapshot, with Undo. Effort M, risk medium. ✅ Most damaged sites heal with no clicks. ✅ Already approved; no plan change. ❌ Can rewrite intentional "&amp;"-style text on live sites without anyone noticing.
C) Investigate before choosing
Measure on real saved projects how often escaped text is damage vs intentional, then decide. Effort S, risk low. ✅ Decision based on real data, not a guess. ✅ No repair code written prematurely. ❌ Delays the repair design until the measurement is done.
D) Defer this change only
Leave D5's text repair rule unresolved for now; NaN and image repair stay as approved. Effort S, risk medium. ✅ Phase 1 can start on everything else. ✅ Revisit when Phase 1 build reaches the repair step. ❌ The text-repair rule stays an open decision inside an approved phase.

## Answered: D10 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B | C | D |
|---|---|---|---|---|---|---|
| Written precedence contract (element base, class, combo, breakpoint up/down, state) | pending | none (Phase 3 "class rules before element rules") | Phase 1, with ResolvedStyle | Phase 3 | after investigation | open |
| Canvas renders by the same contract (no inline-base + `!important` divergence from publish) | pending | no | Phase 1 | Phase 3 | after investigation | open |
| Preview/publish use the same contract | D1 (BK-09) | Phase 1 | Phase 1 | Phase 1 | Phase 1 | Phase 1 |

Question: D10 — D10: Style ki "kaun jeetega" rules (precedence) Phase 1 mein hi tay karein? Project: Buildrick editor, Phases 1 and 3. ELI10: When an element has its own style, a class style, a mobile style and a hover style all for the same property, one of them must win. Today the canvas decides this one way (base styles inline, mobile/hover forced with !important) and the published site decides it another way (normal CSS rules). It works now only because there are no classes. Phase 1's "show the true value" model and Phase 3's classes both depend on one written rule that canvas, Preview and live site all follow. Stakes if we pick wrong: if we wait, Phase 1 builds the value model on the canvas's special-case rules and Phase 3 has to redo it; classes could then look right on canvas and wrong live. Recommendation: A because the value model (ResolvedStyle) is only truthful if canvas and publish share one precedence, and fixing it once is cheaper than twice. Note: options differ in kind, not coverage — no completeness score. Net: a bigger Phase 1 vs. rebuilding the value model in Phase 3.
Header: Precedence
A) Define it in Phase 1 (recommended)
Write one precedence contract and make canvas, Preview and publish implement it, with ResolvedStyle built on it; Phase 3 classes slot into a layer that already exists. Effort L, risk medium. ✅ ResolvedStyle is truthful from day one and Phase 3 needs no rework. ✅ Removes the canvas-only `!important` special case that hides divergence. ❌ Phase 1 grows: the canvas render path changes, which needs careful visual regression checks.
B) Keep it in Phase 3
Phase 1 builds ResolvedStyle on today's canvas behaviour; precedence with classes is solved in Phase 3. Effort M now, risk medium. ✅ Phase 1 stays closer to the approved size. ✅ No canvas render change during the data-loss fixes. ❌ Phase 3 likely rebuilds parts of ResolvedStyle and the canvas path.
C) Investigate before choosing
Prototype the contract against the audit fixture and measure how much of the canvas path must change, then decide. Effort S, risk low. ✅ Sizing based on evidence, not estimates. ✅ No commitment until the change is understood. ❌ Delays the start of ResolvedStyle work.
D) Defer this change only
Leave the precedence question open; Phase 1 proceeds and the row stays unresolved. Effort S, risk medium. ✅ No blocking now. ✅ Revisit when ResolvedStyle design starts. ❌ The core value model starts without a settled foundation.

## Answered: D11 (approved 2026-10-15)

Commitment comparison:

| Commitment | Source/approval or pending | Current | A | B | C | D |
|---|---|---|---|---|---|---|
| Server enforces pre-publish checks (BK-21) | D1 Phase 1 | yes, on DB pages | yes | yes | yes | yes |
| Checks run on the exact artifact deployed (pages HTML + settings + CMS snapshot), stored immutably per job | pending | no | Phase 1 | no | after investigation | open |
| Rollback redeploys a stored snapshot | existing (`log` holds pages) | partial | snapshot-based | as today | pending | as today |

Question: D11 — D11: Publish checks aur deploy ek hi "snapshot" par chalein? Project: Buildrick editor, Phase 1 (publish gate). ELI10: Phase 1 makes the server run the pre-publish checks. But the checks look at the pages saved in the database, while the deploy uses HTML the browser sends at publish time, plus CMS pages added later. So the server could approve one version and ship another (for example unsaved edits). The fix is to freeze one bundle per publish (pages, settings, CMS), check that bundle, and deploy exactly that bundle. Stakes if we pick wrong: a blocker can still reach the live site through the gap, and rollback stays approximate. Recommendation: A because a gate that checks something other than what ships is not a gate. Note: options differ in kind, not coverage — no completeness score. Net: a bigger publish change vs. a server gate that can be bypassed by timing.
Header: Publish snapshot
A) One immutable snapshot per publish (recommended)
Build the deploy bundle (pages, settings, CMS) once, store it on the job, run checks on it, deploy it, and roll back to it. Effort L, risk medium. ✅ What is checked is exactly what ships; unsaved edits cannot slip through. ✅ Rollback redeploys a known, stored bundle. ❌ Changes the publish worker and job storage; needs careful migration of in-flight jobs.
B) Keep checks on database state
Server checks DB pages as BK-21 says; deploy stays client HTML. Effort M, risk medium. ✅ Smaller change to the publish pipeline. ✅ Still blocks the common case (blocker saved in DB). ❌ Validated state and shipped state can differ; the gate has a timing gap.
C) Investigate before choosing
Measure how often client HTML differs from saved DB state at publish time and size the worker change, then decide. Effort S, risk low. ✅ Evidence-based sizing. ✅ No pipeline change until understood. ❌ Phase 1's publish gate design waits for the measurement.
D) Defer this change only
Leave the snapshot question open; BK-21 proceeds as written. Effort S, risk medium. ✅ No blocking now. ✅ Revisit during Phase 1 eng review. ❌ The gap stays a known hole in an approved fix.

## Final approved scope (after review)

| Phase | Approved content |
|---|---|
| **1 Trust** | BK-01, 02, 03, 04 (restore by base CAS token; legacy snapshots treated as conflicting), 05, 06, 07, 08, 40, 42, 44 (P0); BK-09 (CSS parity + Preview build error state), 10, 11, 12, 13, 21, 59, 65; BK-51 (D6); submission IP restriction (D7); one precedence contract for canvas/Preview/publish under ResolvedStyle (D10); immutable publish snapshot used by checks, deploy and rollback (D11); load-time repair of unambiguous damage only, escaped text as Issues candidates (D5 + D9); Section 8 events (D8) |
| **2 Scope** | BK-31 canvas bar, 33 single override indicator, 34 forced state preview, 35 visibility as cascading style, 38 Settings tab, 29 Position/Display for all types, 14 layout at 1280, 84 rail entries; Section 8 events for these |
| **3 Reuse** | BK-30 class rules + selector field + affects-N; BK-85 in-place master editing + declared props + **slots** (D4); BK-46 CMS query with field-aware comparator (OV-5); BK-48 field types; BK-88 conditional visibility; Section 8 events |

## Reality rows

```
REALITY: StyleEngine stores selector × media × pseudo rules and exports them — verified in code (StyleEngine.ts:76-111, 425-471)
REALITY: Canvas renders bases inline + re-emits state/breakpoint rules !important; publish uses class rules — verified (StyleEngine.ts:655-711; outside voice #3)
REALITY: UnsavedWork stores only the failed-attempt time, no CAS token — verified (unsavedRecovery.ts:29)
REALITY: runPrePublishChecks reads DB pages; startPublish deploys client HTML — verified (publish.service.ts:25, :330)
REALITY: queryContent string-compares all sort values — verified (CollectionManager.ts:475; outside voice #5)
REALITY: ExportEngine publish CSS matches canvas on every measured property — verified live (audit L2)
REALITY: captureError exists and is used in 4 files — verified (shared/utils/errorTracking.ts)
PLAN_REALITY: 7/7 rows verified, 0 unverified
```

## NOT in scope

| Item | Disposition | Answer | Rationale |
|---|---|---|---|
| Scripted/interactive Preview on an isolated origin (BK-61) | **Deferred** → TODOS.md | D3 | Needs its own security review; exported pages already play interactions |
| Automatic repair of escaped text | **Rejected** (replaced by Issues candidates) | D9 | Text may be intentional; saved data has no damage provenance |
| Figma/design representation edits | Out of round | owner instruction 2026-10-14 | Design work starts from audit §D/§E and live app |
| Deleting audit test data | Out | owner 2026-10-14 | Kept as evidence |
| All audit rows not listed in "Final approved scope" (e.g. timeline BK-72, content-editor role BK-70, staging, libraries BK-18, localization) | Not in this plan | D1 (phase content) | Remain in the audit backlog for later plans |

## What already exists (reused)

See §0B. Reused: StyleEngine rules, ExportEngine publish CSS, CommandCenter gate, CAS save + ConflictModal, BreakpointSwitcher, OverlayMount focus trap, useFieldOverrides/OverrideDot, CollectionManager.queryContent (after comparator fix), WAAPI runtime (deferred use), lifecycle.ts gate order, captureError/activity rows. Not reused: `Composer.exportHTML` cascade (replaced), `GlobalStyleManager`/`getClassStyles` (dead or wrong; fold or delete).

## Dream state delta

After Phase 3 the editor reaches the 12-month ideal's core: truthful values with visible origin, one precedence everywhere, classes, components with props and slots, CMS lists with queries, publish = what was checked. Still missing vs the ideal: scripted Preview (deferred), interaction timeline, staging environment, content-editor role, shared libraries, localization.

## Error & Rescue Registry (capability level)

| Capability | Failure mechanism | User impact today | Safeguard in plan | Owner must verify |
|---|---|---|---|---|
| Restore unsaved work | stale snapshot over newer server work | teammate pages deleted | base CAS token equality; legacy = conflicting; choice dialog | both async orders (Section 4) |
| Resize | zoom maths, NaN, cancel → global undo | corrupted sizes, lost edits | scale-correct, finite guard, gesture-local rollback | 25/50/100/150 % + keyboard + unmount |
| Undo | bypasses gates | hidden canvas changes saved | route through CommandCenter | every full-page tool + time-travel |
| Duplicate / master update | rules/overrides dropped | lost responsive/hover styling | copy rules; record bp/state overrides | reload + Undo |
| Upload | registration fails | src-less images | keep URL, retry registration only | reload mid-retry |
| Rich text / paste | escape vs HTML; script in paste | literal tags live; editor-origin script | contentFormat + sanitize at setContent | literal "&amp;" in code text stays |
| Forms | GET/multipart; radio "on"; IP export | lost answers; PII exposure | force POST; value control; ADMIN-only IP | VIEWER export |
| Preview | different cascade; build throws silently | users trust a wrong Preview | publish path + error state | 375 px parity; thrown export |
| Publish | checks on different state than deploy | blockers ship | immutable bundle per job | API-level publish attempt with blocker |
| Repair (D5/D9) | wrong repair; snapshot fails | changed content | unambiguous only; snapshot first; Undo; kill switch | rules never touch ambiguous text |
| Precedence (D10) | canvas ≠ publish once classes exist | wrong live styling | one contract | e2e sweep all types × bp × state |
| CMS query | string sort; unstable ties | wrong order, duplicate/skipped items under offset | field-aware comparator, id tie-break | numbers, dates, nulls, ties |

## Failure Modes Registry

```
  CODEPATH (capability)   | FAILURE MODE                    | RESCUED? | TEST?   | USER SEES?                 | LOGGED?
  ------------------------|---------------------------------|----------|---------|----------------------------|---------------------
  Restore                 | stale snapshot                  | Y (plan) | planned | choice dialog              | restore.stale_choice
  Resize                  | non-finite / zoom               | Y (plan) | planned | nothing changes            | geometry.refused
  Undo                    | behind full-page tool           | Y (plan) | planned | nothing changes            | undo.blocked_surface
  Master update           | overrides dropped               | Y (plan) | planned | count + Undo               | component.overrides_dropped
  Upload                  | registration failed             | Y (plan) | planned | per-tile Retry             | media.registration_failed
  Preview                 | build throws                    | Y (plan) | planned | error + Retry              | preview.build_failed
  Publish                 | checks fail / blocker           | Y (plan) | planned | refused with reason        | publish.refused
  Repair                  | snapshot fails                  | Y (plan) | planned | Issues list only           | repair.applied/undone
  Save                    | CAS conflict                    | Y (today)| exists  | conflict modal (copy fix)  | save.conflict
  CMS query               | invalid sort field              | Y (plan) | planned | warning + manual order     | (owner to add)
```
Critical gaps (RESCUED=N, TEST=N, silent): **0** after the plan's approved remedies.

## Diagrams produced

1. System architecture — Section 1.
2. Data flow with shadow paths — Section 4 (restore, duplicate, repair).
3. State machine — below.
4. Error flow — Section 2 tables.
5. Deployment sequence and 6. rollback — below.

```
 PUBLISH JOB (D11)
   [requested] --build bundle--> [bundle stored] --server checks--> (blocked) --user fixes--> [requested]
                                         |                      \--> (passed) --> [deploying] --> [live]
                                         |                                              \--> (failed) --> retry uses SAME bundle
   invalid: deploying a bundle that was not checked (prevented: deploy reads job.bundleId, checks write job.checkedBundleId; must match)
   rollback: [live vN] --> redeploy stored bundle vN-1 --> [live vN-1]

 DEPLOY / ROLLBACK (per phase)
   server authz + gates  -->  editor bundle  -->  smoke checks (Section 9)  --fail-->  redeploy previous build (rsync)
   data repair kill switch (server-read) can stop D5 repairs without a rebuild
```

## Stale Diagram Audit

Checked files this plan touches (StyleEngine.ts, publish.service.ts, ExportEngine.ts, CommandCenter.ts, unsavedRecovery.ts, engine/AGENTS.md, editor/AGENTS.md): no ASCII diagrams found. Owner must add a ResolvedStyle/precedence diagram to `engine/AGENTS.md` (Section 10).

## Implementation Tasks

Synthesized from this review's findings. Review depth is strategy-level, so tasks name the next design/verification action and owner; method contracts come from each phase's `/plan-eng-review`. Effort ratio assumption: architecture ~5x, bug fix with regression ~20x, research ~3x.

- [ ] **T1 (P1, human: ~1d / CC: ~2h)** — styles — Write the precedence contract (element base, class, combo, breakpoint up/down, state) and the ResolvedStyle origin model
  - Surfaced by: D10; Section 1 WARNING; outside voice #3
  - Files: to be determined (`engine/styles/*`, `engine/AGENTS.md`)
  - Verify: contract reviewed in Phase 1 `/plan-eng-review`; e2e sweep plan covers all element types × bp × state
- [ ] **T2 (P1, human: ~1d / CC: ~2h)** — publish — Design the immutable publish bundle (pages HTML, settings, CMS) stored per job; checks, deploy and rollback read it
  - Surfaced by: D11; outside voice #4
  - Files: `server/services/publish.service.ts`, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`
  - Verify: API-level publish attempt with a blocker is refused; deploy reads the checked bundle id
- [ ] **T3 (P1, human: ~2w / CC: ~1.5d)** — Phase 1 P0 batch — Fix BK-01…08, 40, 42, 44, 51 + IP restriction, each with a regression test that fails on df60cf9ec first
  - Surfaced by: audit §F; D6; D7
  - Files: per audit §F rows
  - Verify: audit lane checks re-run live (L1–L6, V) all flip to NOT REPRODUCED
- [ ] **T4 (P1, human: ~2d / CC: ~3h)** — recovery — Store base CAS token with unsaved work; restore requires equality; legacy snapshots conflict
  - Surfaced by: OV-1; Section 4
  - Files: `packages/editor/src/services/unsavedRecovery.ts`, `editor/shell/hooks/useComposerInit.ts`
  - Verify: two-context test, both orders
- [ ] **T5 (P1, human: ~2d / CC: ~3h)** — repair — Load-time scan with unambiguous auto-repair (NaN sizes, exact-match images), Issues candidates for escaped text, snapshot + Undo + server kill switch
  - Surfaced by: D5, D9; Section 9
  - Files: to be determined
  - Verify: fixture with all three damage types; literal "&amp;" in code text untouched; kill switch stops repairs
- [ ] **T6 (P1, human: ~1d / CC: ~2h)** — observability — Add Section 8 events for Phase 1 behaviours and the two runbook lines
  - Surfaced by: D8
  - Files: `packages/editor/src/shared/utils/errorTracking.ts` + call sites
  - Verify: each event fires once in a scripted repro; no content in payloads
- [ ] **T7 (P2, human: ~1d / CC: ~1h)** — design — Run `/plan-design-review` on Phase 2 surfaces (canvas bar, origin labels, Settings tab) before build
  - Surfaced by: Section 11
  - Files: this plan
  - Verify: design review report attached to this plan
- [ ] **T8 (P2, human: ~2d / CC: ~4h)** — components — Design the instance-format migration (position paths → stable-id props + slots) with version field and refusal for old clients
  - Surfaced by: Section 1, 9, 10; D4
  - Files: `engine/components/*`
  - Verify: load-time migration round-trips every audit fixture instance losslessly
- [ ] **T9 (P2, human: ~1d / CC: ~2h)** — CMS — Field-aware comparator (numbers, dates, nulls last, id tie-break) shared by editor and publish
  - Surfaced by: OV-5
  - Files: `packages/editor/src/engine/cms/CollectionManager.ts`, publish CMS expansion
  - Verify: unit tests for 2 vs 10, dates, nulls, ties under offset

## Completion Summary

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | HOLD SCOPE                                  |
  | System Audit         | main @ df60cf9ec; audit 10-14 BK-01..89;    |
  |                      | 7 reality rows verified                     |
  | Step 0               | D1 3 phases; D3 deferred; D4 slots kept     |
  | Section 1  (Arch)    | 2 warnings (ResolvedStyle SPOF, format mig.)|
  | Section 2  (Errors)  | 11 error paths mapped, 2 GAPS (resolved D5) |
  | Section 3  (Security)| 2 issues found, 1 High severity (D6, D7)    |
  | Section 4  (Data/UX) | 8 edge cases mapped, 0 unhandled after plan |
  | Section 5  (Quality) | 3 issues found                              |
  | Section 6  (Tests)   | Diagram produced, 0 gaps                    |
  | Section 7  (Perf)    | 0 issues; 4 budgets set                     |
  | Section 8  (Observ)  | 1 gap found (resolved D8)                   |
  | Section 9  (Deploy)  | 4 risks flagged                             |
  | Section 10 (Future)  | Reversibility: 4/4/2 per phase, debt: 2     |
  | Section 11 (Design)  | 0 blocking issues; design review advised    |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (5 items)                           |
  | What already exists  | written                                     |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 12 rows, 0 CRITICAL GAPS                    |
  | Failure modes        | 10 total, 0 CRITICAL GAPS                   |
  | TODOS.md updates     | 1 item (scripted Preview, D3)               |
  | Scope proposals      | 0 proposed, 0 accepted (HOLD)               |
  | CEO plan             | skipped by mode                             |
  | Outside voice        | codex (gpt-6-astra) completed, 5 findings   |
  | Lake Score           | N/A (no scored option offered 10/10)        |
  | Diagrams produced    | 6 (arch, data flow, state, error, deploy,   |
  |                      | rollback)                                   |
  | Stale diagrams found | 0                                           |
  | Unresolved decisions | 0                                           |
  | Reality rows         | 7/7 rows (PLAN_REALITY), 0 unverified       |
  +====================================================================+
```

### Unresolved Decisions

None in the ledger. Pending implementation choices owned by later phase reviews (not decisions of this review): visibility migration form (Phase 2 eng review), instance-format migration details (T8).

---

# ENG REVIEW (`/plan-eng-review`, 2026-10-15) — target: this plan, Phase 1 (Trust)

Report file: this plan. Target fixed: Phase 1 scope as approved by CEO review (D1, D5–D11, OV-1, OV-5).

## Eng decision ledger

### E1: Re-baseline Phase 1 on origin/main before planning
Finding: E-F1, P1, confidence 10/10, `git merge-base --is-ancestor df60cf9ec origin/main` = true; `git rev-list --count df60cf9ec..origin/main` = 64; reviewer: native.
Plan baseline: Audit and this plan assume code at `df60cf9ec` (local main, 2026-10-09). Phase 1 list as approved in D1/D5–D11.
Runtime evidence: origin/main `cc95f3f7e` (2026-10-10) contains fixes touching Phase 1 items: `5358a0b63` (L2-037 AI 431 → BK-15), `c34bf7eea` (L2-015 master update keeps ids → BK-07), `dcc133d5c` (L2-018 cascaded values → BK-10), `64c02cecc` (DQ-001 failed checks block confirm → BK-21 client part), `6c3bf6866` (DQ-002 z-order refuses locked → BK-13 part), `3aaf24f47` (DQ-018 menus on chrome-ui → BK-28 part), `9e1ce5450` (DQ-011 time-travel safety). Not verified live on origin/main. Files for BK-01..06, 08, 40, 42, 44, 51 not touched by those commits (path log), so those defects are probably still present — unverified.
Comparison grid:

| Choice | Current | A | B | C |
|---|---|---|---|---|
| Baseline for Phase 1 | df60cf9ec | origin/main cc95f3f7e | df60cf9ec | undecided |
| Re-run audit live checks for Phase 1 rows on the new baseline | no | yes, before eng review continues (fresh worktree + verifier) | no; each task starts with "reproduce on main first" | pause review |
| Plan rows already fixed upstream | counted as open | marked fixed/partial with evidence, removed from Phase 1 work | kept; tasks may find them fixed | — |

Question D1:
D1 — D1: Phase 1 ko naye main (origin/main) par dobara check karke plan karein? Project: Buildrick editor, eng review of Phase 1. ELI10: The audit tested an older copy of the code (local main from 10-09). The real main on GitHub is 64 commits newer, and some of those commits already fix things in our Phase 1 list: the AI 431 error, master update losing ids, inspector showing defaults, and part of the publish gate. If we plan on the old copy, we will plan work that is already done and might miss new behaviour. Stakes if we pick wrong: wasted days rebuilding fixes that exist, or conflicts with code that changed. Recommendation: A because a one-time re-check on the current main costs about an hour of agent time and makes every Phase 1 task correct. Completeness: A=10/10, B=6/10, C=3/10. Net: one re-baseline now vs. finding stale tasks one by one during build.
Header: Re-baseline
Options:
A) Re-baseline on origin/main (recommended)
Create a worktree at origin/main, re-run the Phase 1 live checks (L1–L6, V scripts) there, mark each Phase 1 row fixed/partial/open with evidence, then continue this review. Effort: human ~1d / CC ~1h, risk low. ✅ Phase 1 contains only work that is really still broken on current main. ✅ Upstream fixes (L2-015, L2-018, L2-037, DQ-001/002/011/018) get verified instead of assumed. ❌ The eng review pauses about an hour while the checks run.
B) Keep df60cf9ec, verify per task
Continue the review on the current plan; every Phase 1 task starts with "reproduce on main first, drop if fixed". Effort: human ~0 now / CC ~0 now, risk medium. ✅ Review continues immediately. ✅ Each task still checks main before coding. ❌ Plan, estimates and sequencing stay partly wrong until each task discovers it.
C) Pause review
Stop here until the owner decides how to bring local main and origin/main together. Effort: human ~0 / CC ~0, risk low. ✅ Nothing planned on a moving base. ✅ Owner can first resolve the stale local checkout and its uncommitted menu WIP. ❌ Phase 1 planning stops until then.

State: approved
Actual answer: A) Re-baseline on origin/main — owner AskUserQuestion answer D1, 2026-10-15
Accepted scope: Worktree at origin/main cc95f3f7e; re-run Phase 1 live checks there; mark each Phase 1 row fixed/partial/open with evidence; continue this review on the re-baselined list.
History: —

### E1 outcome — Phase 1 re-baselined on origin/main cc95f3f7e (2026-10-15)

Evidence: [`R1-results.md`](../audits/2026-10-14-webflow-editor-audit/evidence/live/R1-results.md), [`R2-results.md`](../audits/2026-10-14-webflow-editor-audit/evidence/live/R2-results.md) (live, sites audit1014-V1/V2/L6, no publish).

| Row | Verdict on origin/main | Remaining Phase 1 work |
|---|---|---|
| BK-01, 02, 03 | OPEN | as planned (50 % no-move: 984×28 → 492×14; NaNpx persists; Escape removes saved Align) |
| BK-04 | OPEN | as planned (server 5 → 4 pages after Restore) |
| BK-05 | PARTIAL | Settings fixed; **Brand and time-travel** still undo + save; time-travel drops read-only |
| BK-06 | OPEN | as planned |
| BK-07 | **FIXED** (c34bf7eea) | removed from Phase 1; keep a regression test |
| BK-08 | OPEN (4/4) | as planned |
| BK-09 | OPEN | as planned |
| BK-10 | PARTIAL | line-height fixed (dcc133d5c); **Align inherited** and **tablet layer on Mobile** remain |
| BK-11, 12 | OPEN | as planned (`stylePeers.ts:79` typo still present) |
| BK-13 | PARTIAL | arrange fixed (6c3bf6866); **right-click select, Ungroup, paste-into, multi-select align** remain |
| BK-15 | **FIXED** (5358a0b63) | removed from Phase 1 (success path untestable locally: no provider) |
| BK-21 | PARTIAL | failed-checks state fixed (64c02cecc); **enabled while loading, retry path, server enforcement** remain (D11 snapshot unchanged) |
| BK-28 | PARTIAL | submenu keyboard + Layers arrows fixed (3aaf24f47); **submenu ~285 px off its row, footer Zoom Tab trap, ⌘D on page row** remain |
| BK-40, 42, 44, 51, D7 | OPEN | as planned |
| **NEW E-F2** | OPEN (P0) | resize handle focused → Enter ×2 → click canvas: **autosave stops for the session**; reload loses all later edits (R1) |
| **NEW E-F3** | OPEN (P1) | successful wired form submit 303-redirects to an old Vercel URL (`DEPLOYMENT_NOT_FOUND`) (R2) |

Server, `lib/` and `packages/dashboard/` were not touched between df60cf9ec and origin/main, so server-side rows were expected to stay open.

### Scope record (Scope Challenge B)

feature answers: none proposed (CEO HOLD SCOPE; no cuts offered); structure: Original arrangement — owner answer D2, 2026-10-15; accepted scope: Phase 1 as re-baselined in E1 outcome (BK-07, BK-15 removed as fixed; partial rows reduced to remaining parts), built as new modules: `engine/styles/ResolvedStyle.ts` + precedence contract, `server/services/publish-bundle.service.ts` + new Prisma table, `engine/recovery/DamageScanner.ts`, a PublishGate hook, `chrome-ui/FullPageHost.tsx`, an events module; pending remedies: E2, E3.

Scope Challenge A summary:
- Reuse: StyleEngine rule store, ExportEngine publish CSS, CommandCenter gate (BK-05 Settings already fixed through it upstream), CAS save + ConflictModal, publish job record, useIssuesFeed, lifecycle.ts, OverlayMount focus trap, captureError.
- Complexity: ~60–70 files [estimated], 3+ new classes/services → gate tripped; owner chose the original (new-module) arrangement.
- Search check: Search unavailable via Aside; patterns are repo-internal (precedence contract, publish snapshot, recovery token); no new library proposed.
- TODOS cross-reference: TODOS.md:488-492 already notes the canvas inherits the editor UI font (`chrome-reset.css:72`) so canvas ≠ published output — fold into the D10 precedence contract work; TODOS.md:521 notes RichTextEditor `activeStyles` never passed (BK-55 area, not Phase 1). D3 scripted Preview TODO added by CEO review.
- Distribution: no new artifacts; deploy via existing cPanel rsync.

### E2: Autosave stops after resize handle Enter ×2 + click (new, origin/main)
Finding: E-F2, P0, confidence 8/10 (live repro by R1 agent; root cause not traced), reviewer: R1 live agent.
Plan baseline: not in Phase 1 (found during re-baseline).
Runtime evidence: R1: focus a resize handle, press Enter twice, click the canvas → autosave stops for the session; reload loses every later edit. Likely the keyboard resize path (BK-02) leaves the resize transaction open, so autosave's change listener stays held (`ResizeHandler.ts` begin/endTransaction; `useComposerInit.ts` autosave) — unverified.
Comparison grid:

| Choice | Current | A | B |
|---|---|---|---|
| Fix E-F2 in Phase 1 with BK-02 (keyboard resize) | not planned | yes: finish/abort the gesture transaction on every exit path; autosave never blocked by an open gesture; regression test Enter×2 + click → save fires | no; separate later fix |
| Event `autosave.stalled` (D8 family) when dirty > 30 s without a save attempt | not planned | included (same behaviour) | no |

Question D3:
D3 — D3: Resize handle par Enter do baar dabane se autosave band ho jata hai. Phase 1 mein theek karein? Project: Buildrick editor, Phase 1 (origin/main). ELI10: The re-check found a new silent data-loss bug: focus a resize handle, press Enter twice, click the canvas, and the editor quietly stops saving for the rest of the session. Everything typed after that is lost on reload, with no warning. It lives in the same keyboard-resize code as BK-02. Stakes if we pick wrong: users lose a whole session of work without any message. Recommendation: A because it is a P0 silent data loss in code Phase 1 already rewrites for BK-02. Completeness: A=10/10, B=3/10. Net: one more Phase 1 item vs. a known session-wide data-loss path.
Header: Autosave stall
Options:
A) Fix in Phase 1 (recommended)
Close or abort the resize transaction on every exit (Enter, Escape, blur, click, unmount); autosave cannot be held by a gesture; add an `autosave.stalled` signal; regression test Enter×2 + click → save fires and reload keeps later edits. Effort: human ~1d / CC ~1h, risk low. ✅ Removes a session-wide silent data-loss path. ✅ Shares code and tests with BK-02 keyboard resize. ❌ Phase 1 grows by one item.
B) Fix later
Keep it out of Phase 1 and file it as a separate bug. Effort: human ~0 now / CC ~0 now, risk high. ✅ Phase 1 unchanged. ✅ Can be scheduled independently. ❌ Users keep losing whole sessions until it ships.

State: approved
Actual answer: A) Fix in Phase 1 — owner AskUserQuestion answer D3, 2026-10-15
Accepted scope: Close/abort the resize transaction on every exit (Enter, Escape, blur, click, unmount); autosave cannot be held by an open gesture; `autosave.stalled` signal; regression test Enter×2 + click → save fires and reload keeps later edits.
History: —

### E3: Successful form submit redirects to a dead Vercel URL (new, origin/main)
Finding: E-F3, P1, confidence 7/10 (live repro via export + wireForms stand-in by R2; root cause not traced), reviewer: R2 live agent.
Plan baseline: BK-44 (approved Phase 1) covers method/encoding/radio value/duplicate names; the post-success redirect target is not named in its acceptance.
Runtime evidence: R2: a successful wired submit returns 303 to an old Vercel deployment URL (`DEPLOYMENT_NOT_FOUND`) instead of the page. Likely the return URL is taken from a stored `publishedUrl`/form row origin rather than the request's page — unverified (`packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts`, `lib/publish-forms.ts`).
Comparison grid:

| Choice | Current | A | B |
|---|---|---|---|
| Success redirect returns to the submitting page (validated same-site URL) or the configured redirect | not in BK-44 acceptance | added to BK-44 in Phase 1, with open-redirect guard kept | later fix |

Question D4:
D4 — D4: Form submit ke baad visitor dead Vercel page par chala jata hai. Ise BK-44 (Phase 1) mein jodein? Project: Buildrick editor, Phase 1 forms (origin/main). ELI10: After a visitor successfully sends a form, the site sends them back to an old deployment address that no longer exists, so they see a "deployment not found" page instead of a thank-you. The form data is saved, but the visitor thinks it failed. BK-44 already fixes forms in Phase 1, but this redirect is not in its checklist. Stakes if we pick wrong: every visitor who submits a form sees an error page and may submit again or leave. Recommendation: A because it is the same form endpoint BK-44 already changes, and the existing open-redirect guard stays. Completeness: A=10/10, B=4/10. Net: a slightly bigger BK-44 vs. visitors landing on an error page.
Header: Form redirect
Options:
A) Add to BK-44 (recommended)
After success, return to the submitting page (validated same-site URL from the request) or the configured redirect; keep the open-redirect guard; regression test submit → 303 to the page and 200. Effort: human ~0.5d / CC ~30min, risk low. ✅ Visitors see the success state instead of an error page. ✅ Same endpoint and tests as BK-44; open-redirect protection preserved. ❌ BK-44 grows slightly.
B) Fix later
Leave BK-44 as approved; file the redirect as a separate bug. Effort: human ~0 now / CC ~0 now, risk medium. ✅ BK-44 scope unchanged. ✅ Can be fixed with other form work later. ❌ Every form submission keeps ending on an error page until then.

State: approved
Actual answer: A) Add to BK-44 — owner AskUserQuestion answer D4, 2026-10-15
Accepted scope: superseded by E9 (D10) — see E9.
History: D4 answer "Add to BK-44" (2026-10-15) accepted a redirect-logic change; reopened by outside voice #5 and replaced by E9's verify-then-fix scope.

Scope Challenge result: scope accepted as-is (structure: original arrangement, D2; additions within Phase 1 approved: E2 via D3, E3 via D4).

## Eng Section 1 — Architecture

```
 PHASE 1 (original arrangement, D2)
 ┌──────────── editor ────────────┐          ┌────────────── server ──────────────┐
 │ ResolvedStyle.ts ◄─ precedence │          │ publish-bundle.service.ts (NEW)    │
 │   contract (D10)               │  publish │   build → store (retain 20, §5)    │
 │ StyleEngine rules ─► canvas CSS│ ───────► │   → runPrePublishChecks(bundle)    │
 │                   ─► export CSS│          │   → deploy(bundle) / rollback      │
 │ DamageScanner.ts (D5/D9)       │          │ reviews/site-component/theme authz │
 │ PublishGate hook ─► lifecycle  │          │   bound to target site (BK-08)     │
 │ FullPageHost (chrome-ui)       │          │ forms route: POST/encoding/value,  │
 │ events module (D8)             │          │   return URL (BK-44, E3), IP (D7)  │
 └────────────────────────────────┘          └────────────────────────────────────┘
```

Findings:
- [P1] (confidence: 9/10) `packages/editor/src/engine/styles/StyleEngine.ts:689-711` — canvas emulates devices by re-emitting breakpoint rules with `!important` and no media query, because base styles render inline (`// !important, because the canvas renders an element's BASE styles inline and inline beats any stylesheet`). D10 needs canvas, Preview and export to share one precedence; the mechanism is an open choice → E4.
- [P2] (confidence: 9/10) `server/services/publish.service.ts:616-619` — `const PUBLISH_HISTORY_RETAINED = 20;` (contract §5). The new bundle table (D2) must use the same retention and prune with the job; carried forward from the existing contract, no question.
- [P2] (confidence: 8/10) `prisma/schema.prisma` PublishBuildJob — `/// The deploy payload — { pages: {path,html}[] } written at startPublish.` already stores pages on the job. With the new bundle table (D2), the job payload must point at the bundle (bundle id) instead of storing a second copy; implementation owner keeps one copy. Carried forward under D2/D11, no question.

Dispositions: E4 pending (question D5); retention and single-copy rules carried forward from §5 and D2/D11.

### E4: Mechanism for one precedence contract on the canvas (D10)
Finding: Eng S1 [P1] (confidence 9/10) `StyleEngine.ts:689-711`; reviewer: native.
Plan baseline: D10 approved — one precedence contract implemented by canvas, Preview and publish; mechanism not chosen.
Runtime evidence: canvas inlines base styles and re-emits active-device rules `!important` without media queries (quoted above); export emits class base + `@media` (audit L2: export matched canvas on all measured properties).
Comparison grid:

| Choice | Current | A | B | C |
|---|---|---|---|---|
| Canvas base styles | inline | sheet rules keyed `[data-buildrick-id]`, no inline | inline | inline inside an iframe document |
| Canvas device emulation | `!important` re-emit, no media query | CSS container queries on the canvas frame (`@container`), same rule order as export | `!important` layering extended for classes later | real `@media` inside a device-width iframe |
| Shared generator for canvas + export | no | yes (one rule list; @container vs @media wrapper) | no | yes |
| Blast radius | — | canvas render + selection overlays read computed styles only | small now, grows in Phase 3 | large: overlays, events, drag, inline edit must cross the iframe boundary |

Question D5:
D5 — D5: Canvas par "kaun jeetega" rule kaise lagu karein? Project: Buildrick editor, Phase 1 D10 (origin/main). ELI10: Today the canvas cheats to show mobile styles: it writes base styles directly on each element and then forces mobile rules with !important. The published site does it the normal CSS way. D10 says all three must follow one rule. We can make the canvas use normal stylesheet rules and let the canvas frame itself act like a phone or tablet (CSS container queries), or keep the cheat, or put the canvas inside a real mini browser window (iframe) sized like the device. Stakes if we pick wrong: keeping the cheat breaks once classes arrive; the iframe route is a very large rewrite of selection, drag and inline editing. Recommendation: A because it gives one generator and real cascade order without moving the canvas into an iframe. Completeness: A=9/10, B=4/10, C=10/10. Net: a contained render change vs. a full iframe migration vs. a shortcut that fails in Phase 3.
Header: Canvas cascade
Options:
A) Sheet rules + container queries (recommended)
Stop inlining base styles; one rule generator emits base → (class, Phase 3) → breakpoint → state in the same order for canvas and export, wrapped in `@container` on the canvas frame and `@media` on export. Effort: human ~1w / CC ~1d, risk medium. ✅ One precedence everywhere without an iframe rewrite. ✅ Removes the `!important` device block that hid canvas/publish divergence. ❌ Container queries need the canvas frame as a container and a visual regression sweep of every element type.
B) Keep inline + !important
Leave the canvas mechanism; document precedence and extend `!important` re-emission when classes arrive. Effort: human ~1d / CC ~2h, risk high. ✅ Smallest change now. ✅ No canvas render change during Phase 1. ❌ Contradicts D10's intent; class rules in Phase 3 cannot win correctly against inline bases.
C) Device-width iframe canvas
Render the canvas document in an iframe sized to the device so real `@media` applies; overlays, drag and inline edit cross the frame. Effort: human ~4w / CC ~5d, risk high. ✅ Exact browser parity with the published page, including media features. ✅ Isolates customer CSS from editor chrome. ❌ Very large rewrite of selection, overlays, drag, inline editing and event plumbing; far beyond Phase 1.

State: approved
Actual answer: A) Sheet rules + container queries — owner AskUserQuestion answer D5, 2026-10-15
Accepted scope: Canvas stops inlining base styles; one rule generator emits base → (class, Phase 3) → breakpoint → state for canvas and export; canvas wraps breakpoints in `@container` on the canvas frame, export in `@media`; the `!important` device/state re-emit blocks are removed; visual regression sweep of every element type.
History: —

## Eng Section 2 — Code quality

Findings:
- [P1] (confidence: 9/10) `packages/editor/src/engine/commands/stylePeers.ts:79` — `const selectorFor = (id: string) => \`[data-buildrik-id="${id}"]\`;` (typo, still on origin/main). Root cause: the element selector is hand-built in 77 places on origin/main (`git grep -c 'data-buildri[c]*k-id="${'`), e.g. `StyleEngine.ts:205` `const selector = \`[data-buildrick-id="${elementId}"]\`;`, `Canvas.tsx:346`, `useCanvasKeyboard.ts:116`; only `editor/canvas/comments/commentAnchors.ts:26` escapes the id. → E5.
- [P2] (confidence: 8/10) `engine/styles/StyleEngine.ts` is 825 lines (audit 0B); D5's generator change will grow it past the repo's 800-line split rule. Implementation owner splits the new rule generator into its own file as part of D2's new `ResolvedStyle.ts`/precedence module. Carried under D2, no question.
- [P2] (confidence: 9/10) Two ⌘S handlers (`engine/commands/defaultCommands.ts:80-85` and `editor/shell/hooks/useEditorShortcuts.ts:167-170`) — already BK-11 (approved Phase 1). No new choice.
- Error handling gaps: Preview build `.then` without catch (`AquibraStudio.tsx:293,874`) — already in BK-09 acceptance (CEO Section 2). No new choice.

### E5: Shared element-selector helper
Finding: Eng S2 [P1] (confidence 9/10) `stylePeers.ts:79` typo; 77 hand-built selectors; reviewer: native.
Plan baseline: BK-12 (approved) fixes the typo in `stylePeers.ts` only.
Runtime evidence: typo still present on origin/main (R2); 77 occurrences; ids are not escaped except in commentAnchors.
Shared-code rubric: callers verified (StyleEngine.ts:205,228,253,275,313,731,780; stylePeers.ts:79; commandOperations.ts:84; Canvas.tsx:346; 60+ DOM queries). Helper: `elementSelector(id)` in `shared/utils/` returning `[data-buildrick-id="${CSS.escape(id)}"]` (behaviour-identical for current id shapes). Lines: style-rule builders ~10 call sites (−10/+12 incl. helper) [estimated]; all sites 77 (−77/+80) [estimated]. Blast radius: a wrong helper breaks every selection — covered by existing canvas tests + one helper test.
Comparison grid:

| Choice | Current | A | B | C |
|---|---|---|---|---|
| Helper `elementSelector(id)` with `CSS.escape` | none | yes | yes | no |
| Migrate style-rule builders (StyleEngine, stylePeers, cssContext/useStyleHandlers, new ResolvedStyle) | no | yes (Phase 1) | yes | no (typo fix only) |
| Migrate the other ~65 DOM-query sites | no | no (later, opportunistic) | yes (Phase 1) | no |
| Lint/gate forbidding new hand-built selectors | none | no | yes | no |

Question D6:
D6 — D6: Element ka CSS selector ek helper se banayein? Project: Buildrick editor, Phase 1 code quality (origin/main). ELI10: The bug where "Apply style to all" silently does nothing on hover came from one typo in a hand-written selector string. That same string is written by hand in 77 places. A tiny shared helper would make that typo impossible where styles are written, and it would also escape odd ids safely. Stakes if we pick wrong: fixing only the one typo leaves 76 places where the next typo can silently break styling or selection. Recommendation: A because it removes the bug class where Phase 1 writes styles, without touching 65 unrelated DOM lookups. Completeness: A=8/10, B=10/10, C=4/10. Net: a small helper on the style path vs. a repo-wide sweep vs. a one-line fix.
Header: Selector helper
Options:
A) Helper + style-rule paths (recommended)
Add `elementSelector(id)` (with `CSS.escape`) in `shared/utils/`, use it in StyleEngine, stylePeers, cssContext/useStyleHandlers and the new ResolvedStyle module, with one helper test. Effort: human ~2h / CC ~15min, risk low. ✅ Makes the BK-12 typo class impossible on every style-writing path. ✅ Small diff confined to files Phase 1 already changes. ❌ The ~65 DOM-query sites keep their own strings until touched later.
B) Helper + all 77 sites + gate
Migrate every hand-built selector and add a gate forbidding new ones. Effort: human ~1d / CC ~1h, risk low-medium. ✅ One way to build the selector across the editor, enforced by a gate. ✅ Every id is escaped everywhere. ❌ Touches ~30 files unrelated to Phase 1 and widens review/merge conflicts.
C) Fix the typo only
Change `buildrik` to `buildrick` in `stylePeers.ts:79` as BK-12 says. Effort: human ~5min / CC ~1min, risk medium. ✅ Smallest change. ✅ Already approved as part of BK-12. ❌ The same mistake can recur in any of the 77 places with the same silent failure.

State: approved
Actual answer: A) Helper + style-rule paths — owner AskUserQuestion answer D6, 2026-10-15
Accepted scope: `elementSelector(id)` with `CSS.escape` in `shared/utils/`; used by StyleEngine, stylePeers, cssContext/useStyleHandlers and the new ResolvedStyle module; one helper test. Other DOM-query sites unchanged.
History: —

## Eng Section 3 — Tests

Framework: Vitest + React Testing Library (unit/integration, `__tests__/` co-located), Playwright (`packages/editor/e2e/`, `playwright.config.ts`), live rig `scripts/baseline/editor-rig.mjs` (CLAUDE.md: live app is the verifier).

```
CODE PATHS (Phase 1, origin/main)                              USER FLOWS
[+] engine/canvas resize                                       [+] Resize at zoom
  ├── ResizeHandler.snap.test.ts — snap only [★★]              ├── [GAP][→E2E] 50 % no-move click keeps size
  ├── [GAP] scale-correct deltas (25/50/100/150 %)             ├── [GAP][→E2E] keyboard resize, Enter×2 + click → autosave still fires (E2)
  ├── [GAP] finite guard (NaN refused)                          └── [GAP][→E2E] Escape keeps prior edit, no save
  ├── [GAP] gesture-local cancel + unmount
  └── [GAP] transaction closed on every exit (E2)             [+] Undo behind tools
[+] shortcuts/undo gate                                         ├── [★★ upstream] Settings ⌘Z (fixed, needs regression)
  └── [GAP] Brand + time-travel ⌘Z refused, no save             └── [GAP][→E2E] Brand / time-travel ⌘Z
[+] ElementManager clone                                       [+] Duplicate keeps responsive + hover
  └── [GAP] rules copied (all media, all pseudo, subtree)       └── [GAP][→E2E] reload keeps 24/40/32 + hover
[+] unsavedRecovery + restore                                  [+] Restore my edits
  ├── unsavedRecovery.offScreen.test.ts [★★]                     └── [GAP][→E2E] two contexts, both orders (E: OV-1)
  └── [GAP] base CAS token stored; equality; legacy = conflict
[+] ResolvedStyle + precedence (D10/D5)                        [+] Inspector truth
  ├── [GAP] layer order base→bp→state; origin per field          ├── [GAP][→E2E] sweep: all element types × D/T/M × Base/:hover,
  └── [GAP] one generator: @container (canvas) = @media (export)│     field value == getComputedStyle
[+] elementSelector helper (D6)                                  └── [GAP][→E2E] visual regression sweep after D5 (approved)
  └── [GAP] escapes ids; used by style paths
[+] stylePeers                                                  [+] Apply-to-all on :hover
  ├── stylePeers.test.ts [★★] Base + breakpoint layers           └── [GAP] :hover rules written for every peer + count toast
  └── [GAP] pseudo-state path (typo hid it)
[+] copy/paste/reset style scope (BK-12)  [GAP] Mobile writes Mobile only
[+] lock gate (BK-13)   [GAP] right-click select, Ungroup, paste-into, multi-align skip locked
[+] menus (BK-28)       [GAP] submenu anchored to its row; Zoom Tab exits; ⌘D on page row duplicates page
[+] server authz (BK-08)                                       [+] Security
  ├── review.service tests [★★] (4 files)                        └── [GAP][→E2E/tRPC] scoped EDITOR revoke other site → 403;
  └── [GAP] revoke/resolve bound to review's site + effective role;   library/theme scoped; capped ADMIN resolve → 403
      library/theme siteScopeWhere
[+] publish bundle + gate (D11, BK-21)                         [+] Publish
  ├── publish.service tests [★★] (5 files)                       ├── [GAP][→E2E] Publish now disabled while checks load
  ├── [GAP] bundle built once; checks + deploy read same id      └── [GAP] retry path goes through gate
  └── [GAP] retention 20 (§5) prunes bundle with job
[+] content (BK-40, BK-51)
  ├── ExportEngine tests [★★★] (29 files)
  ├── [GAP] contentFormat set on inline commit/toolbar/import; <strong> exported as element
  └── [GAP] paste payload inert (no onerror in DOM, flag undefined)
[+] upload (BK-42)
  ├── AssetUploadService.test.ts:180 asserts `returns null when createAsset rejects` ← locks the bug; REWRITE
  └── [GAP] keep uploaded URL, retry createAsset only; reload keeps src; 1 Blob, 1 row
[+] forms (BK-44, E3, D7)
  ├── form-submission tests [★★]
  └── [GAP] POST forced; radio value stored; unique names; 303 → submitting page; VIEWER export has no IP
[+] DamageScanner (D5/D9)       [GAP] NaN + exact-match image repaired; escaped text → Issues only; snapshot first; kill switch
[+] Preview (BK-09)             [GAP][→E2E] 375 px parity, hover, hide, site CSS, opens at canvas device; build error state
[+] events (D8)                 [GAP] each event fires once in a scripted repro, no content payload

COVERAGE (Phase 1): 0/27 changed behaviours covered at ★★+ by an existing test [estimated from file reads above]
QUALITY of existing related tests: ★★★:1 area (ExportEngine) ★★:6 areas  |  GAPS: 27 (13 →E2E)
```

Required tests (carried forward from approved acceptance criteria; no new choice): one regression test per row above that fails on origin/main first. Value cards (abridged; full cards in the test plan artifact):
- Value: protects=resize keeps size on a zero-delta release at 50 %; fails_when=bounds stop dividing by canvas scale; why_new=ResizeHandler.snap.test.ts covers snap only; seam=none; no_claim=none beyond protects
- Value: protects=autosave resumes after keyboard resize Enter×2 + click; fails_when=the gesture transaction is left open; why_new=no test covers keyboard exit paths; seam=none; no_claim=none beyond protects
- Value: protects=restore never overwrites newer server work; fails_when=restore compares attempt time not base token; why_new=offScreen test covers storage only; seam=none; no_claim=real network ordering (two Playwright contexts, local server)
- Value: protects=inspector value equals rendered value per layer; fails_when=ResolvedStyle skips a layer or inherited values; why_new=no sweep exists; seam=none; no_claim=WebKit rendering (Chromium only)
- Value: protects=cross-site review/library/theme access refused; fails_when=authz checks the caller's site not the target's; why_new=review tests use same-site fixtures; seam=none; no_claim=none beyond protects

Tests to retire or rewrite: `packages/editor/src/services/__tests__/AssetUploadService.test.ts:180` "returns null when createAsset rejects after a successful upload" — rewrite to assert the uploaded URL is kept and only `createAsset` is retried (BK-42 approved behaviour change).

LLM/eval scope: none (BK-15 fixed upstream; no prompt changes in Phase 1).

Findings:
- [P1] (confidence: 9/10) `AssetUploadService.test.ts:180` — `it("returns null when createAsset rejects after a successful upload", …)` locks the BK-42 bug; rewritten with BK-42 (approved). 
- [P1] (confidence: 9/10) `stylePeers.test.ts` — cases at :30–:149 cover Base and breakpoint layers only; no pseudo-state case, which is why the `:79` typo survived. Required test added with BK-12/E5.
- [P2] (confidence: 8/10) `ResizeHandler.snap.test.ts:47-59` — snap only; zoom, keyboard, cancel and transaction-exit paths untested. Required tests added with BK-01–03/E2.

Dispositions: all three carried forward under approved rows (BK-42, BK-12/D6, BK-01–03/D3); no new choices.

## Eng Section 4 — Performance

Findings:
- [P2] (confidence: 8/10) `packages/editor/src/engine/styles/StyleEngine.ts:654` — `this.styleElement.textContent = this.toCSS() + this.editorStatePreviewCSS() + this.editorDevicePreviewCSS();` rewrites the whole sheet on every flush. Today base styles are inline, so the sheet holds only breakpoint/state rules. After D5 every element's base styles move into the sheet: on a 500-element page that is ~500 more rules [estimated] re-serialized on each edit/drag frame. Scale unknown until measured. → E6.
- [P3] (confidence: 7/10) Publish bundle (D11) stores pages HTML + settings + CMS per job; retention 20 (§5) bounds it. Current job payload already stores pages; incremental size = settings + CMS snapshot [estimated small]. No choice.
- [P3] (confidence: 7/10) DamageScanner runs once per load, O(elements + rules); budget < 100 ms on 500 elements (CEO Section 7). No choice.

### E6: Stylesheet update strategy after D5
Finding: Eng S4 [P2] (confidence 8/10) `StyleEngine.ts:654`; reviewer: native.
Plan baseline: D5 approved (bases in sheet, container queries); CEO Section 7 budget: ResolvedStyle < 16 ms on 500 elements; no budget for sheet writes.
Runtime evidence: full `textContent` rewrite per flush (quoted); per-flush cost with bases in the sheet not measured.
Comparison grid:

| Choice | Current | A | B |
|---|---|---|---|
| Sheet write strategy | full textContent rewrite per flush | keep full rewrite; budget ≤ 8 ms per flush on a 500-element page (Chromium, M-series laptop); switch to per-rule CSSOM only if over budget | per-rule CSSOM updates (insert/replace/delete one rule) from the start |
| Perf check | none | Playwright trace on generated 500-element page during drag + typing | same trace |

Question D7:
D7 — D7: Har edit par poori stylesheet dobara likhein ya sirf badla hua rule? Project: Buildrick editor, Phase 1 D5 (origin/main). ELI10: After D5, every element's styles live in one stylesheet instead of on the element. Today the editor rewrites that whole stylesheet on every small change. On a big page that may make dragging and typing feel slow. We can keep the simple full rewrite and measure it against a strict time budget, switching only if it is too slow, or build the faster "change one rule at a time" method from the start. Stakes if we pick wrong: building the complex method too early adds bugs; measuring too late ships a laggy canvas. Recommendation: A because it keeps the simplest correct code and the budget plus trace catches a slowdown before ship. Completeness: A=9/10, B=10/10. Net: simplicity with a measured gate vs. upfront optimization.
Header: Sheet updates
Options:
A) Full rewrite + 8 ms budget (recommended)
Keep the full rewrite; add a Playwright trace on a generated 500-element page during drag and typing with a ≤ 8 ms per-flush budget; switch to per-rule CSSOM only if it fails. Effort: human ~0.5d / CC ~30min, risk low. ✅ Simplest code path; one serializer for canvas and export. ✅ The trace makes any slowdown visible before ship. ❌ If the budget fails, the CSSOM work lands later in Phase 1.
B) Per-rule CSSOM from the start
Maintain a rule index and update single rules via CSSOM on each change. Effort: human ~2d / CC ~3h, risk medium. ✅ Fastest updates regardless of page size. ✅ No later rework if pages are large. ❌ More code and ordering bugs (rule order defines precedence) before we know it is needed.

State: approved
Actual answer: A) Full rewrite + 8 ms budget — owner AskUserQuestion answer D7, 2026-10-15
Accepted scope: Keep full sheet rewrite per flush; Playwright trace on a generated 500-element page during drag and typing, ≤ 8 ms per flush; switch to per-rule CSSOM only if the budget fails.
History: —

## Eng Outside Voice — codex (gpt-6-astra), 2026-10-15

```
CODEX SAYS (plan review — outside voice):
1. High — D11 does not define where the snapshot becomes final. The worker still reads current SEO settings, redirects, domains, workspace scripts and form settings, then transforms HTML before deployment (worker route.ts:284). Define the immutable artifact after all content transformations; separate deployment-time authorization from frozen content.
2. High — Building the publish artifact can break the currently live site. The worker calls recordPublishedForms before deployment succeeds; it deactivates forms missing from the candidate (route.ts:349, form-submission.service.ts:360). Require side-effect-free preparation and activation tied to deployment success.
3. High — D5 removes generated inline styles but misses imperative inline writers. Resize writes width, height, position and transform directly onto DOM elements (DOMUpdater.ts:23); cleanup does not remove them. Specify temporary-style ownership and cleanup; test resize/Cancel → breakpoint switch → hover → undo without reload.
4. High — E2's exit-path prescription misses unbalanced entry. startResize overwrites an existing gesture and begins another transaction without an active-gesture guard (ResizeHandler.ts:139). Require idempotent/rejected re-entry; make the stall detector independent of project:changed (Composer suppresses it while a transaction is open, Composer.ts:1142).
5. Medium — E3's proposed behavior already exists; the published script sends _return=location.href, the service validates it against site origins (publish-forms.ts:94, form-submission.service.ts:180). A local stand-in on an unregistered origin correctly gets the fallback. Establish whether the defect is real before changing redirect logic.
Recommendation: revise the implementation contracts before approval because the snapshot boundary and canvas migration omit existing mutation paths.
VERDICT: findings · FINDINGS: P1
```

Verification (native, origin/main): all five citations read and confirmed — worker reads `prisma.site.findUnique` at deploy (`route.ts:284-290`); `recordPublishedForms(...)` before deploy (`route.ts:356`); `this.resizeState = {…}` with no active-gesture guard (`ResizeHandler.ts:140`); `if (this.transactionDepth > 0) { this.transactionDirty = true; return; }` (`Composer.ts:1142-1144`); `r[i].value=location.href` (`publish-forms.ts:96`) and `safeUrlOnOrigins(input.returnUrl, origins)` (`form-submission.service.ts:185`).

Dispositions:
- OV-E3 (#3) — carried forward as necessary implementation of D5: resize/drag temporary inline styles have one owner and are removed on finish/cancel/unmount; test resize → Cancel → breakpoint switch → hover → undo with no reload, computed values equal the sheet.
- OV-E4 (#4) — carried forward as necessary implementation of D3: `startResize` rejects or finishes an active gesture before starting another (transaction ownership); stall detection reads dirty-without-save time, not `project:changed`.
- #1 → E7 (question D8). #2 → E8 (question D9). #5 → E9 reopens D4 (question D10).

### E7: Publish artifact = final transformed output (outside voice #1)
Finding: OV #1 High, confidence 9/10, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:284-290` (site settings read at deploy time); reviewer: codex, verified native.
Plan baseline: D11 approved — one immutable bundle (pages HTML, settings, CMS) stored per job; checks, deploy and rollback use it. Where the bundle is "final" is unspecified.
Runtime evidence: worker reads SEO/redirects/domains/scripts/form settings and transforms HTML at deploy time.
Comparison grid:

| Choice | Current (D11) | A | B | C | D |
|---|---|---|---|---|---|
| Bundle content | pages HTML + settings + CMS (inputs) | the final deploy files after every transform (SEO, forms wiring, scripts, redirects/vercel.json), hashed | inputs as D11 | after investigation | open |
| Deploy-time reads | worker reads site settings | only authorization + Vercel connection + domains to attach; no content reads | as today | pending | pending |
| Checks run on | bundle | the final files | bundle inputs | pending | pending |

Question D8:
D8 — D8: Publish snapshot ko "aakhri bani hui files" banayein? Project: Buildrick editor, Phase 1 D11 (origin/main). ELI10: You approved one frozen bundle per publish so checks and deploy see the same thing. The outside reviewer found that the publish worker still reads site settings (SEO, redirects, scripts, form settings) at deploy time and changes the HTML after that. So even with a bundle, what ships can differ from what was checked. The fix is to freeze the final files after all those changes, check those, and deploy exactly those. Stakes if we pick wrong: a settings change between check and deploy still ships unchecked content, and rollback is not exact. Recommendation: A because only the final files are what visitors get, so only they can be checked and rolled back exactly. Note: options differ in kind, not coverage — no completeness score. Net: freezing outputs vs. freezing inputs that are later transformed.
Header: Final artifact
Options:
A) Apply this change (recommended)
Bundle = final deploy files after every transform, hashed; deploy reads only authorization, connection and domains; checks run on the final files; rollback redeploys them byte-for-byte. Effort: human ~2d / CC ~3h, risk medium. ✅ Checked, deployed and rolled-back content are identical by hash. ✅ Settings edits during a publish cannot leak into it. ❌ The worker's transform steps move into the bundle builder, a larger change to the publish pipeline.
B) Keep this row's current value
Keep D11 as written (inputs frozen; worker still transforms at deploy). Effort: human ~0 / CC ~0, risk medium. ✅ No extra pipeline change. ✅ D11 already improves on today. ❌ Deploy-time reads can still change what ships after checks passed.
C) Investigate before choosing
Map every deploy-time read/transform in the worker and size moving them, then decide (bounded: one code-read pass; no implementation). Effort: human ~0.5d / CC ~30min, risk low. ✅ Decision rests on a full list of transforms. ✅ D11 stays approved meanwhile. ❌ Phase 1 publish design waits for the investigation.
D) Defer this proposed change only
Leave the final-artifact question unresolved; D11 proceeds as written. Effort: human ~0 / CC ~0, risk medium. ✅ No change now. ✅ Revisit during implementation. ❌ The gap stays open in an approved fix.

State: approved
Actual answer: A) Apply this change — owner AskUserQuestion answer D8, 2026-10-15
Accepted scope: Bundle = final deploy files after every transform (SEO, form wiring, scripts, redirects/vercel.json), hashed; deploy reads only authorization, Vercel connection and domains; checks run on the final files; rollback redeploys them byte-for-byte. Supersedes the "inputs" wording of D11.
History: —

### E8: Publish preparation must have no side effects (outside voice #2)
Finding: OV #2 High, confidence 9/10, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:356` — `await recordPublishedForms(siteId, discovered, plan.deactivateMissing);` runs before deployment succeeds; reviewer: codex, verified native.
Plan baseline: D11/D8 build the bundle before checks; side effects of building are unspecified.
Runtime evidence: today a failed deploy after a form was removed leaves the old live site with that form deactivated (404 on submit) — code-read, not run live.
Comparison grid:

| Choice | Current | A | B | C | D |
|---|---|---|---|---|---|
| Form-row activation/deactivation | during build, before deploy | only after deploy success, in one step with marking the job live; failed deploy leaves rows unchanged | as today | after investigation | open |
| Other DB writes during bundle build | unspecified | none (build is pure; writes happen on success) | unspecified | pending | pending |
| Recovery if activation fails after deploy | none | retry activation idempotently; publish shows "live, forms updating" until done | none | pending | pending |

Question D9:
D9 — D9: Publish ki tayyari ke dauran live site ko na chhuein? Project: Buildrick editor, Phase 1 publish (origin/main). ELI10: Right now, when a publish starts, the worker already switches off forms that the new version no longer has, before the deploy is known to succeed. If the deploy then fails, the old site stays live but its forms are switched off, so visitors get errors. With the new frozen bundle, this preparation could even run just from opening Publish. The fix: building the bundle changes nothing; forms are switched on/off only after the deploy succeeds. Stakes if we pick wrong: a failed or abandoned publish silently breaks forms on the live site. Recommendation: A because preparation must be safe to run, cancel or fail without touching what visitors see. Note: options differ in kind, not coverage — no completeness score. Net: pure preparation + post-success activation vs. today's early writes.
Header: No side effects
Options:
A) Apply this change (recommended)
Bundle building is side-effect free; form activation/deactivation runs only after deploy success, idempotently, with a "forms updating" state until done; test remove form → failed deploy → old form still accepts submissions. Effort: human ~1d / CC ~2h, risk low. ✅ A failed or cancelled publish never changes the live site. ✅ Safe to build bundles for checks at any time. ❌ Activation becomes a separate post-deploy step that needs its own retry.
B) Keep this row's current value
Leave form recording before deploy. Effort: human ~0 / CC ~0, risk high. ✅ No pipeline change. ✅ Works when deploys succeed. ❌ Failed deploys keep breaking live forms.
C) Investigate before choosing
List every DB write in the worker before deploy and decide per write (bounded: one code-read pass). Effort: human ~0.5d / CC ~30min, risk low. ✅ Covers writes beyond forms. ✅ No change until mapped. ❌ Publish design waits.
D) Defer this proposed change only
Leave unresolved; continue with D8. Effort: human ~0 / CC ~0, risk high. ✅ No change now. ✅ Revisit later. ❌ The live-site breakage path stays.

State: approved
Actual answer: A) Apply this change — owner AskUserQuestion answer D9, 2026-10-15
Accepted scope: Bundle building writes nothing; form activation/deactivation runs only after deploy success, idempotently, with a "forms updating" state until done; test remove form → failed deploy → old form still accepts submissions.
History: —

### E9: Re-examine E3 / D4 form redirect (outside voice #5)
Finding: OV #5 Medium, confidence 8/10; reviewer: codex, verified native: `lib/publish-forms.ts:96` `r[i].value=location.href;` and `server/services/form-submission.service.ts:185` `const returnUrl = safeUrlOnOrigins(input.returnUrl, origins);`.
Plan baseline: D4 approved — add to BK-44: return to the submitting page or configured redirect; keep open-redirect guard.
Runtime evidence: the return-to-page behaviour already exists; R2's reproduction served the exported page from a local, unregistered origin, so the guard correctly rejected `_return` and used the fallback. The fallback pointing at a dead deployment URL may still be a real defect (stale origin list after the L5 project deletion), unverified.
Comparison grid:

| Choice | Current (D4) | A | B | C | D |
|---|---|---|---|---|---|
| Change redirect logic in BK-44 | yes | no; verify first on a registered origin (published or allowed domain); fix only what reproduces (e.g. stale fallback origin) | yes as D4 | after investigation (same as A's verify step) | open |
| Fallback when `_return` is rejected | unspecified | must never point at a deleted deployment; fall back to the site's current canonical/verified origin | as D4 | pending | pending |

Question D10:
D10 — D10 (reopens D4): Form redirect ka "bug" pehle pakka karein? Project: Buildrick editor, Phase 1 forms (origin/main). ELI10: You approved fixing the form redirect (D4). The outside reviewer showed the site already sends visitors back to their own page, but only when the page lives on one of the site's known addresses. Our test ran the page from a local address the server does not know, so the safety check correctly refused it and used a fallback. The fallback itself pointed at a deleted deployment, which may still be a real bug. Stakes if we pick wrong: we might rewrite working redirect code, or miss the real stale-fallback bug. Recommendation: A because we should change only what reproduces on a real address, and make the fallback never point at a deleted deployment. Note: options differ in kind, not coverage — no completeness score. Net: verify-then-fix vs. rewriting code that already works.
Header: Redirect check
Options:
A) Apply this change (recommended)
Replace D4's fix with: verify on a registered origin first; keep the existing return logic if it works; fix the fallback so it uses the current canonical/verified origin and never a deleted deployment; regression test both paths. Effort: human ~0.5d / CC ~30min, risk low. ✅ No rewrite of redirect code that already works. ✅ Fixes the likely real bug (stale fallback) with a test. ❌ Needs a registered-origin test setup (allowed domain or deploy).
B) Keep this row's current value
Keep D4 as approved (change redirect logic in BK-44). Effort: human ~0.5d / CC ~30min, risk medium. ✅ Already approved. ✅ No new verification step. ❌ May change working code based on a harness artifact.
C) Investigate before choosing
Only verify on a registered origin now and report; decide afterwards (bounded: one live check, no code). Effort: human ~2h / CC ~15min, risk low. ✅ Evidence before any decision. ✅ No code change yet. ❌ BK-44's redirect part stays undecided.
D) Defer this proposed change only
Leave D4's redirect item unresolved. Effort: human ~0 / CC ~0, risk medium. ✅ No change now. ✅ Revisit at implementation. ❌ The possible stale-fallback bug remains.

State: approved
Actual answer: A) Apply this change — owner AskUserQuestion answer D10, 2026-10-15
Accepted scope: Verify form return on a registered origin first; keep existing `_return` logic if it works; fallback uses the site's current canonical/verified origin and never a deleted deployment; regression tests for accepted `_return` and rejected-`_return` fallback. Supersedes E3/D4's redirect-logic change.
History: Reopens E3 (D4 answer "Add to BK-44", 2026-10-15) because outside voice #5 showed the behaviour already exists and the repro used an unregistered origin.

### Eng TODOS.md updates

No TODO proposals: no accepted Phase 1 item was deferred in this review; the 65 non-style DOM selector sites (D6 scope boundary) stay as they are by decision, not as debt.

Approval readiness: PASS — checked E1 (D1 answer), scope record (D2 answer), E2 (D3), E3 (D4, superseded by E9), E4 (D5), E5 (D6), E6 (D7), E7 (D8), E8 (D9), E9 (D10); OV-E3 carried under D5 accepted scope; OV-E4 carried under D3 accepted scope. No unresolved rows.

## Eng required outputs

### Phase 1 final work list (origin/main, after this review)

| Group | Items |
|---|---|
| Canvas gestures | BK-01, BK-02, BK-03, E2 (autosave stall, D3) incl. re-entry guard (OV-E4), temporary inline-style ownership (OV-E3) |
| Styling truth | Precedence contract + `ResolvedStyle.ts` (D10, D2); canvas sheet rules + `@container` (D5); full rewrite with 8 ms budget (D7); `elementSelector` helper on style paths (D6); BK-06 rule-copying clone; BK-10 remaining (Align inherited, tablet layer on Mobile); BK-12 (copy/paste/reset scope + Apply-to-all on states) |
| Undo / save / recovery | BK-04 restore by base CAS token (OV-1); BK-05 remaining (Brand, time-travel); BK-11 one ⌘S path; BK-59 snapshot before Overwrite |
| Locks and menus | BK-13 remaining (right-click, Ungroup, paste-into, multi-align); BK-28 remaining (submenu anchor, footer Zoom Tab trap, ⌘D on page row); FullPageHost (BK-65) |
| Security / privacy | BK-08 (4 parts); D7 IP restriction; BK-51 paste sanitization |
| Publish | D11 bundle = final hashed files (D8); side-effect-free build, post-success form activation (D9); BK-21 remaining (enabled while loading, retry path, server enforcement); BK-09 Preview through publish path + build error state |
| Content / media / forms | BK-40 contentFormat; BK-42 keep uploaded URL; BK-44 method/encoding/radio value/unique names; E9 verify-then-fix redirect fallback (D10) |
| Repair + signals | DamageScanner (D5/D9 CEO: NaN + exact-match images auto; escaped text → Issues; snapshot; kill switch); D8 events incl. `autosave.stalled` |
| Removed (fixed upstream) | BK-07 (c34bf7eea), BK-15 (5358a0b63) — keep regression tests only |

### NOT in scope (eng)

- BK-07 and BK-15 rework — fixed on origin/main; only regression tests remain.
- Migrating the ~65 DOM-query selector sites to `elementSelector` — outside D6 scope.
- Per-rule CSSOM updates — only if the 8 ms budget fails (D7).
- Device-width iframe canvas — rejected in D5.
- Scripted Preview — deferred by CEO D3 (TODOS.md).

### What already exists (eng)

Reused: StyleEngine rule store and `toCSS` ordering (generator moves out per D2), ExportEngine publish CSS (verified equal to canvas by audit L2), CommandCenter read-only/full-page gate (already fixes Settings ⌘Z upstream), CAS save + ConflictModal, `PUBLISH_HISTORY_RETAINED = 20` retention (§5), PublishBuildJob payload (points to the new bundle), `useIssuesFeed` (damage candidates surface), `lifecycle.ts` gate order, OverlayMount focus trap, `captureError`, `_return` + `safeUrlOnOrigins` form return logic (kept per D10), upstream fixes L2-015/L2-018/L2-037/DQ-001/002/011/018.

### Diagrams

```
 RESIZE GESTURE (D3, OV-E3, OV-E4)
   idle --start--> active(owns txn, owns temp inline styles)
     active --start again--> finish-or-reject (no second txn)
     active --move--> active (scale-correct, finite)
     active --finish--> write active axis only → close txn → clear temp styles → idle
     active --cancel/blur/unmount--> restore start bounds → rollback own txn → clear temp styles → idle
   invalid: two open txns; temp styles after idle; NaN written

 PUBLISH (D8, D9, D11)
   build bundle (pure: transforms → final files, hash) → store (retain 20)
     → server checks(bundle files) --fail--> blocked (no writes)
     → deploy(bundle) --fail--> failed (live site untouched; retry same bundle)
     → success → activate forms (idempotent, "forms updating") → mark live
   rollback: redeploy stored bundle by hash
```

### Failure modes (eng)

| New path | Realistic production failure | Test | Error handling | User sees |
|---|---|---|---|---|
| Resize gesture | re-entry opens second txn | yes (OV-E4) | reject/finish | nothing breaks |
| Canvas sheet rules (D5) | leftover inline style overrides sheet | yes (OV-E3) | temp-style owner clears | correct style |
| Container queries | container size not set → no breakpoint applies | yes (sweep) | canvas frame declares container | correct device styles |
| Bundle build | transform throws | yes | job blocked, no writes | "Couldn't prepare publish · Retry" |
| Post-deploy activation | DB write fails after deploy | yes | idempotent retry | "Live · forms updating" |
| Restore | legacy snapshot | yes | treated as conflict | choice dialog |
| DamageScanner | snapshot fails | yes | no repair, Issues only | Issues list |
| Form fallback | origin list stale | yes (E9) | current canonical origin | page or site home, never dead URL |

Critical gaps: 0.

### Worktree parallelization

| Step | Modules touched | Depends on |
|---|---|---|
| S1 Canvas gestures | `engine/canvas/`, `editor/canvas/overlays` | — |
| S2 Precedence + ResolvedStyle + canvas render | `engine/styles/`, `editor/inspector/`, `shared/utils` | — |
| S3 Clone/undo/save/recovery | `engine/elements/`, `engine/HistoryManager`, `services/`, `editor/shell/hooks` | S2 (clone copies rules in new format) |
| S4 Locks, menus, FullPageHost | `editor/canvas/menus`, `engine/commands`, `chrome-ui/`, `editor/sidebar/FullPageRouter` | — |
| S5 Server authz + forms + IP | `server/trpc/routers`, `server/services`, `lib/publish-forms`, `packages/dashboard/app/api/public` | — |
| S6 Publish bundle + gate + Preview | `server/services/publish*`, `packages/dashboard/app/api/workers/publish`, `prisma/`, `editor/shell` (gate, Preview) | S2 (Preview uses the generator), S5 (forms activation) |
| S7 Content/media/paste + DamageScanner + events | `engine/export/`, `engine/elements/manager`, `services/AssetUploadService`, `engine/media/`, `engine/recovery/`, `shared/utils/errorTracking` | S2 (scanner reads rules) |

Parallel lanes:
- Lane A: S2 → S3 → S7 (shared engine styles/elements)
- Lane B: S1 (engine/canvas) — coordinate with A on StyleEngine writes from resize
- Lane C: S4 (menus/shell/chrome-ui)
- Lane D: S5 → S6 (server, then publish pipeline; S6 also waits for A's S2)

Execution order: launch A + B + C + D(S5). Merge B, C, S5. When A's S2 merges, start S6. Merge A, then S6.
Conflict flags: `editor/shell` (S3, S4, S6) and `StyleEngine` (S1 temp styles vs S2 generator) — sequence edits or rebase per merge.

### Implementation Tasks (eng)

Effort ratios: bug fix with regression ~20x, architecture ~5x, tests ~50x.

- [ ] **E-T1 (P1, human: ~1w / CC: ~1d)** — styles — Precedence contract + `ResolvedStyle.ts` + one generator; canvas sheet rules with `@container`; remove `!important` re-emit blocks; 8 ms trace
  - Surfaced by: D10, D5 (E4), D7 (E6), D2
  - Files: `packages/editor/src/engine/styles/StyleEngine.ts`, new `engine/styles/ResolvedStyle.ts`, `editor/inspector/cssContext.ts`, `editor/inspector/hooks/useStyleHandlers.ts`, `editor/canvas/Canvas.tsx`
  - Verify: e2e sweep all element types × D/T/M × Base/:hover (field == computed); visual regression; trace ≤ 8 ms/flush on 500 elements
- [ ] **E-T2 (P1, human: ~2d / CC: ~3h)** — canvas — Scale-correct, finite, gesture-local resize with re-entry guard and temp-style ownership; autosave never held
  - Surfaced by: BK-01–03, E2 (D3), OV-E3, OV-E4
  - Files: `engine/canvas/ResizeHandler.ts`, `engine/canvas/resize/*`, `editor/canvas/overlays/SelectionHandles.tsx`, `engine/Composer.ts`
  - Verify: unit + e2e for 25/50/100/150 %, keyboard, Escape, Enter×2 + click, re-entry, Cancel → breakpoint → hover → undo
- [ ] **E-T3 (P1, human: ~1d / CC: ~1h)** — styles — `elementSelector(id)` helper; stylePeers pseudo-state path; copy/paste/reset breakpoint-aware
  - Surfaced by: D6 (E5), BK-12
  - Files: `shared/utils/` (new helper), `engine/commands/stylePeers.ts`, `engine/commands/defaultCommands.ts`, `engine/commands/commandOperations.ts`
  - Verify: stylePeers test with :hover; Mobile paste writes Mobile only
- [ ] **E-T4 (P1, human: ~2d / CC: ~3h)** — elements/recovery — Rule-copying clone; restore by base CAS token; one ⌘S path; snapshot before Overwrite; ⌘Z gated in Brand/time-travel
  - Surfaced by: BK-06, BK-04/OV-1, BK-11, BK-59, BK-05
  - Files: `engine/elements/ElementManager.ts`, `engine/elements/manager/ElementCRUD.ts`, `services/unsavedRecovery.ts`, `editor/shell/hooks/useComposerInit.ts`, `editor/shell/hooks/useEditorShortcuts.ts`, `engine/commands/defaultCommands.ts`
  - Verify: two-context restore both orders; duplicate keeps 24/40/32 + hover after reload
- [ ] **E-T5 (P1, human: ~2d / CC: ~3h)** — server — Review/library/theme authz by target site and effective role; VIEWER IP restriction
  - Surfaced by: BK-08, D7 (CEO)
  - Files: `server/trpc/routers/reviews.ts`, `server/services/review.service.ts`, `server/trpc/routers/site-component.ts`, `server/services/site-component.service.ts`, `server/trpc/routers/theme.ts`, `server/trpc/routers/forms.ts`
  - Verify: tRPC tests for scoped EDITOR, capped ADMIN, VIEWER export
- [ ] **E-T6 (P1, human: ~3d / CC: ~5h)** — publish — Bundle builder (final hashed files, pure); server checks on bundle; deploy/rollback by hash; post-success form activation; PublishGate for every door; Preview via publish path + error state
  - Surfaced by: D11, D8 (E7), D9 (E8), BK-21, BK-09
  - Files: `server/services/publish.service.ts`, new `server/services/publish-bundle.service.ts`, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`, `prisma/schema.prisma` (+ additive migration), `editor/shell/lifecycle.ts`, `editor/shell/PreviewOverlay.tsx`
  - Verify: settings change between check and deploy → deployed hash == checked hash; remove form + failed deploy → old form works; blocked bundle refused via API
- [ ] **E-T7 (P1, human: ~2d / CC: ~3h)** — content/forms — contentFormat on commit/toolbar/import; paste sanitization; keep uploaded URL; POST/encoding/radio value/unique names; verify-then-fix form fallback
  - Surfaced by: BK-40, BK-51, BK-42, BK-44, E9 (D10)
  - Files: `canvas/hooks/useCanvasInlineEdit.ts`, `engine/elements/manager/HTMLParser.ts`, `engine/elements/Element.ts`, `engine/export/ExportEngine.ts`, `services/AssetUploadService.ts` (+ rewrite test :180), `lib/publish-forms.ts`, `server/services/form-submission.service.ts`, `blocks/Forms/*`
  - Verify: export shows `<strong>`; paste flag undefined; reload keeps src, 1 row; radio stores value; fallback never dead URL
- [ ] **E-T8 (P2, human: ~2d / CC: ~3h)** — locks/menus/shell — Lock gate on right-click/Ungroup/paste/multi-align; submenu anchored; Zoom Tab exits; ⌘D on page row; FullPageHost focus/inert
  - Surfaced by: BK-13, BK-28, BK-65
  - Files: `editor/canvas/Canvas.tsx`, `editor/canvas/menus/*`, `engine/canvas/AlignmentHandler.ts`, `editor/sidebar/tabs/pages/components/PageRow.tsx`, `editor/canvas/hooks/useCanvasKeyboard.ts`, `editor/sidebar/FullPageRouter.tsx`, new `chrome-ui/FullPageHost.tsx`
  - Verify: live checks from R1 flip to FIXED
- [ ] **E-T9 (P2, human: ~2d / CC: ~3h)** — repair + signals — `engine/recovery/DamageScanner.ts` (NaN, exact-match images; escaped text → Issues), snapshot + Undo + kill switch; D8 events incl. `autosave.stalled` independent of `project:changed`
  - Surfaced by: D5/D9 (CEO), D8 (CEO), OV-E4
  - Files: new `engine/recovery/DamageScanner.ts`, `editor/shell/hooks/useIssuesFeed.ts`, `shared/utils/errorTracking.ts`, new events module
  - Verify: fixture with damage types; literal "&amp;" untouched; each event fires once
- [ ] **E-T10 (P2, human: ~2h / CC: ~10min)** — regression — Keep regression tests for upstream fixes BK-07 (L2-015) and BK-15 (L2-037)
  - Surfaced by: E1 outcome
  - Files: `engine/components/__tests__/`, `sidebar/tabs/ai/__tests__/`
  - Verify: tests fail if the upstream fix is reverted

### Unresolved decisions (eng)

None.

### Eng completion summary

- Step 0: Scope Challenge — scope accepted as-is (structure: original arrangement; Phase 1 re-baselined on origin/main)
- Reality rows: 7/7 applicable rows emitted (PLAN_REALITY below), 0 unverified premises (premise corrected: baseline df60cf9ec → origin/main)
- Architecture Review: 3 issues found
- Code Quality Review: 4 issues found
- Test Review: diagram produced, 27 gaps identified (all carried as required tests)
- Performance Review: 3 issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 0 items proposed to user
- Failure modes: 0 critical gaps flagged
- Unresolved decisions: 0 in this review
- Outside voice: codex (gpt-6-astra) completed — 5 findings (2 carried under approved rows, 3 resolved via D8–D10)
- Parallelization: 4 lanes, 3 parallel / 1 sequential dependency chain (A → S6)
- Lake Score: 5/7 answers chose the 10/10 option (D1, D3, D4, D5-scored C=10 not chosen, D6-scored B=10 not chosen, D7-scored B=10 not chosen, D10/D8/D9 unscored) → eligible scored questions with a 10/10 option: D1(A), D3(A), D4(A), D5(C), D6(B), D7(B); chose 10/10: D1, D3, D4 = 3/6

```
REALITY: premise-table finding baseline df60cf9ec was 64 commits behind origin/main; corrected by E1 re-baseline (R1/R2 evidence)
REALITY: already-done finding BK-07 (c34bf7eea) and BK-15 (5358a0b63) fixed upstream; partial fixes for BK-05/10/13/21/28 recorded
REALITY: surface-check pass tRPC routes named (reviews.revoke, siteComponents.library/libraryGet, theme.targets, forms.exportSubmissions) exercised live — docs/audits/2026-10-14-webflow-editor-audit/evidence/live/R2-results.md:21-23,42
REALITY: binding-decisions pass CEO D1–D11 carried into the eng work list unchanged — docs/plans/2026-10-14-webflow-workflows-product-design.md:551
REALITY: numbers pass live numbers are measured values (getStyles/getComputedStyle, network, reload) on cc95f3f7e; 500-element budget is a target, not a measurement — docs/audits/2026-10-14-webflow-editor-audit/evidence/live/R1-results.md:3
REALITY: deferred-asks pass audit rows outside Phase 1 listed in CEO NOT in scope — docs/plans/2026-10-14-webflow-workflows-product-design.md:568
REALITY: pr-count pass no ship-policy file; default one PR per lane, 4 lanes for Phase 1 — docs/plans/2026-10-14-webflow-workflows-product-design.md:735
```

## Design review (2026-10-15) — Phase 1 UI

Target: Phase 1 UI states. Figma out of scope this round (owner, 2026-10-14). Design source: audit §D/§E, DESIGN.md, approved mockups below. Initial design completeness: 5/10.

### Pass 1 — Information architecture: 4/10 → 9/10

Phase 1 hierarchy (after decisions 1–3):
```
 LOAD     restore dialog (if unsaved edits) ─► repair scan ─► "Repaired N · Undo" toast ─► Issues (candidates)
 SAVE     topbar pill: one state at a time (priority in Pass 2)
 PUBLISH  topbar [Publish] ─► Publish panel (the gate)
            1 Live · domain · published 2 days ago
            2 Before you publish · 1 blocker          ◄ verdict
            3 rows: spinner / ✓ / amber + Fix / red + Fix
            4 [Publish now]  "Fix 1 blocker to publish"
            5 Last publish · steps
          ─► confirm "Publish to production?" ─► job steps
```
Remaining gap (−1): Preview error and FullPageHost entry are covered in Passes 2 and 6.

### Pass 2 — Interaction states: 5/10 → 9/10

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Restore dialog (5) | "Checking the server…" (dialog waits, no buttons) | no local copy → no dialog | server unreachable → "Can't reach the server. Your edits stay in this browser." + Try again | "Your edits are back" → autosave | server newer → choice; legacy → "can't confirm" copy |
| Save pill (4) | "Saving…" | — | "Save failed — retry" / "Offline — not saved" / "Conflict — reload" | "Saved just now" | "Not saving · unsaved for 45 s" + popover |
| Load repair (1, 8) | silent | nothing found → no toast | snapshot failed → no repair, Issues rows only | "Repaired 3 items · Undo · Details" | ambiguous → "Possible damage" rows; unverifiable → "Couldn't verify…" |
| Publish panel (2, 3, 6, 7) | "Before you publish · checking 4 of 6", CTA disabled "Checking pages…" | "Nothing to publish yet" + link to Pages | checks couldn't load → "Try again"; server refused → "Publish stopped · 1 new blocker · Your live site wasn't changed." | "Website live" | "Updating forms…" / "Forms couldn't update · Retry form update" |
| Preview (9) | "Building preview…" | — | "Preview couldn't be built" + cause + Try again + Back to editor | renders at canvas page/device | CMS unavailable → note in header |
| Submission export (10) | button spinner | "No submissions yet" | "Export failed · Try again" | file downloads | VIEWER → "IP addresses are hidden for your role." |

Remaining gap (−1): the copy for "Nothing to publish yet" and "No submissions yet" empty states has no primary action defined beyond the link; acceptable for Phase 1.

### Pass 3 — User journey: 5/10 → 9/10

Phase 1 storyboard (agency designer, a teammate edits the same site):

| Step | User does | User feels | Plan specifies |
|---|---|---|---|
| 1 | Opens the site after a failed save yesterday | uneasy ("did I lose it?") | restore dialog first, nothing else on screen (1) |
| 2 | Reads "Sara Khan saved changes 3 minutes ago" | oriented | who/when line, comparison, Review differences (5) |
| 3 | Picks "Keep the server version", downloads own edits | in control | same three actions as ConflictModal (11) |
| 4 | Sees "Repaired 3 items · Undo · Details" | relieved, slightly wary | toast after the dialog, version "Before automatic repair" (1, 8) |
| 5 | Opens Issues, sees "Tom &amp;amp; Jerry → Tom & Jerry", keeps one as written | trusted with the call | before/after + Keep as written (8) |
| 6 | Edits for an hour; pill shows "Not saving · unsaved for 45 s" once | alarmed but guided | Save now / Download a copy, truthful copy (4) |
| 7 | Clicks Publish; panel says "Before you publish · 1 blocker" | clear | panel is the gate, verdict in header (2, 3) |
| 8 | Fixes it, publishes; "Website live", then "Forms couldn't update · Retry" | worried, then reassured | separate lines, old forms status, retry (7) |
| 9 | Opens Preview on Mobile; build fails once | annoyed | cause + Try again + Back to editor (9) |

Time horizons: 5 s — one dialog, one primary action. 5 min — save pill and publish panel always say the true state. 5 years — the editor never claims "saved" or "live" when it isn't; that is the trust Phase 1 buys.

Remaining gap (−1): no motion spec beyond DESIGN.md tokens (enough; see Pass 4).

### Pass 4 — AI slop: 8/10 → 9/10

Mode OPERATE (editor). Hard rejections: none (Claude + Codex agree). Approved mockups (restore C, publish C, repair C, stalled A) contain no card grid, gradient, coloured icon circle, emoji or coloured left border; the two variants with a black CTA or gradient (publish B, repair B) were not chosen. Motion uses DESIGN.md tokens only (hover 100 ms, popover/drawer 160 ms, modal 240 ms, ease-out in / ease-in out, none under reduced motion). Litmus 3 (scan by headlines) fixed by decisions 3 and 8.

### Pass 5 — Design system: 6/10 → 9/10

| Surface | Built from (existing `chrome-ui`) | New? |
|---|---|---|
| Restore dialog + ConflictModal footer | `OverlayMount`, `ModalContent/Title/Body/Footer`, `Button` | shared footer only |
| Save pill + stalled popover | `SaveStatus` (new variant), `Popover`, `Button` | variant |
| Publish panel gate | `PanelHeader`, `ListRow`, `StatusDot`, `Button`, existing `PublishConfirmModal` | no |
| Repair toast | `Toast` | no |
| Possible-damage rows | `IssuesPanel` rows, row overflow menu | row variant |
| Preview states | `PreviewOverlay`, `EmptyState`, `Button` | states only |
| FullPageHost | new `chrome-ui/FullPageHost.tsx` (eng D2) | yes, approved in eng |

Remaining gap (−1): DESIGN.md text fix is owner work (decision 12).

### Pass 6 — Responsive & accessibility: 5/10 → 9/10

- Desktop-only (DESIGN.md). Targets 1280–1920 wide; at 1280×720 the restore dialog (480 px) and the 280 px Publish panel must fit without horizontal scroll; long copy wraps per DESIGN.md §Overflow, it never truncates a reason or a verdict.
- Keyboard: decisions 13 and 14; dialogs open with focus on the safe action ("Keep the server version"), as `ConflictModal` does today.
- Screen readers: save-pill state changes announce through the existing `SaveStatus` live region; publish verdict changes announce once per scan, not per row; repair toast is `role="status"`; Preview error is `role="alert"`.
- Colour is never the only signal: every status dot has a text label (decisions 3, 6, 7, 8).
- Contrast: all copy on `--bk-*` text tokens meets AA on white.

Remaining gap (−1): no measured contrast check yet for `--bk-warning-text` on `--bk-warning-tint` in the pill (verify in /design-review).

### Pass 7 — Unresolved design decisions

| Decision needed | If deferred | Outcome |
|---|---|---|
| Stalled popover: auto-open or click? | users miss the amber pill, or get interrupted mid-typing | resolved — decision 15 |
| "Review differences": inline or History view? | user leaves the choice mid-way; the old restore-toast problem returns | resolved — decision 16 |

All other Phase 1 ambiguities found by the outside voices were resolved in Passes 1–6 (decisions 1–14).

### Design decision ledger

| # | Issue | Decision | Approved |
|---|---|---|---|
| 1 | Order of things shown on load | **1A — one sequence:** restore decision (blocking dialog) → repair scan of the content the user kept → repair toast → Issues. The old restore toast ("Some work never reached the server · Restore my edits", `useComposerInit.ts:343`) is removed; `RecoveryBanner` folds into the restore dialog's result. A toast never stacks on top of an open modal. | owner, 2026-10-15 |
| 2 | Which surface owns the publish gate | **2A — the Publish panel is the gate.** Topbar "Publish" always opens the panel (never silently disabled). Panel = checks + verdict + CTA. `PublishConfirmModal` shrinks to one "Publish to production?" step after checks pass. Every door (topbar, panel, failure retry, AI) routes here. One issue-count selector feeds topbar badge, panel and confirm. | owner, 2026-10-15 |
| 3 | Where the publish verdict sits | **3A — verdict in the header.** Order: status line → "Before you publish · 1 blocker" (header is the verdict; "· 1 blocker so far" while scanning) → check rows → CTA with one reason line under it. The separate "1 blocker must be fixed before publishing." line is removed. | owner, 2026-10-15 |
| 4 | Save pill and the stalled state | **4A — priority + truthful copy.** One state at a time: Conflict > Offline > Save failed > Not saving > Saving > Unsaved > Saved. "Not saving" = dirty for more than 30 s with no save attempt (same rule as D8's `autosave.stalled`). Pill: "Not saving · unsaved for 45 s" (age of the oldest unacknowledged change). Popover: "Autosave is stuck" / "Your changes are only in this tab." / [Save now] [Download a copy]. Save now → "Saving…" → "Saved just now" or "Save failed — retry"; disabled with the reason while a gesture is open. Download a copy is always available. New `SaveStatus` variant, not a new component. | owner, 2026-10-15 |
| 5 | What the restore dialog shows | **5A — differences + three copy variants.** "Review differences" inside the comparison block (list of changed pages/elements, labelled "Compares element content only"). Copy: teammate ("Sara Khan saved changes 3 minutes ago"), same user ("You saved from another tab 3 minutes ago"), legacy snapshot without a server token ("We can't confirm what changed since your edits"). "Replace with mine…" (named per decision 11; mockup said "Restore mine anyway…") opens the existing overwrite confirm and snapshots the server version first (BK-59). Escape defers the choice; both copies stay. | owner, 2026-10-15 |
| 6 | Server refusal and deploy failure | **6A — the checklist shows the server's results.** On refusal the panel replaces its rows with the server's; header "Publish stopped · 1 new blocker". Every failure line carries "Your live site wasn't changed." Bundle build failure: "Couldn't prepare publish · Try again". Deploy failure: "Deploy failed · Retry" (same bundle). | owner, 2026-10-15 |
| 7 | Form activation after deploy | **7A — website and forms reported separately.** Two lines: "Website live" and "Updating forms…". Failure: "Website live · Forms couldn't update" + "Retry form update" + one line saying whether the previous forms still accept entries (from the activation result). After 60 s: "Taking longer than usual". Survives panel close and reload; the job is complete only when forms are. | owner, 2026-10-15 |
| 8 | Possible-damage rows and repair Undo | **8A — before/after + keep option.** Each row: element path + inline preview ("Tom &amp;amp; Jerry → Tom & Jerry"), "Fix", and "Keep as written" in the row's overflow menu (no action strip, DESIGN.md rule 12). "Can't tell" becomes "Couldn't verify mobile or hover styles" + "Open element" + Dismiss. The pre-repair version is named "Before automatic repair" in History; the toast's Details opens it. VIEWER sees read-only rows: "An editor can fix this." | owner, 2026-10-15 |
| 9 | Preview build states | **9A — full error state.** Loading "Building preview…" at the same page and device. Error "Preview couldn't be built" + short cause ("Show in Issues" when tied to an element) + "Try again" + "Back to editor"; Try again disabled while running. Second failure: "Still failing · Copy error details". Stale output is never shown as current. Focus lands on the heading; Escape closes even from inside the iframe. | owner, 2026-10-15 |
| 10 | VIEWER submission export | **10A — one note.** A grey line by the export action: "IP addresses are hidden for your role." The IP column is absent from CSV/JSON (no empty column). | owner, 2026-10-15 |
| 11 | One vocabulary for "the server has newer work" | **11A — shared footer.** Restore dialog and `ConflictModal` use the same three actions: "Keep the server version" (primary, accent), "Download my edits", "Replace with mine…" (confirm; server snapshot first). Titles stay different (load time vs save time) with the same structure: who/when line + comparison. One shared footer component. `ConflictModal` copy and its tests change in the same commit. | owner, 2026-10-15 |
| 12 | DESIGN.md contradicts itself on ink and elevation | **12A — generated tokens win.** Phase 1 surfaces use only `--bk-*`: text `--bk-ink` / `--bk-ink-soft` / `--bk-ink-muted`; modals `--bk-shadow-overlay`; popover and toast `--bk-shadow-raised`; status dots `--bk-warning`/`--bk-success`/`--bk-error` on their `-tint`. No local hex. The mockups' #334155 was image direction only. The DESIGN.md wording fix (NO BLACK text cap vs `--bk-ink #111827`; rule 10 vs popover elevation) is a TODO for the owner. | owner, 2026-10-15 |
| 13 | Disabled controls must explain themselves | **13A — visible reason + `aria-disabled`.** Shared pattern: the control stays focusable with `aria-disabled="true"` and ignores activation; the reason sits under it as readable text (`--bk-ink-soft`, not disabled grey) and is its `aria-describedby`. Distinct reasons: "Checking pages…", "Fix 1 blocker to publish", "Only site admins can publish", "Finish resizing to save". One prop on chrome-ui `Button`. | owner, 2026-10-15 |
| 14 | FullPageHost focus contract | **14A — full contract.** Entry: focus the tool's heading (Brand `h1`, Settings title, CMS collection title, History "Version from …"). Escape closes the topmost transient surface first, then the tool. Exit: focus returns to the opener, else the rail's active item. The topbar save pill and the toast region stay outside the inert region. Native text-field ⌘Z works; canvas ⌘Z is blocked behind the tool (BK-05). | owner, 2026-10-15 |
| 15 | When the stalled popover opens | **15A — once on its own, then on click.** When the pill enters "Not saving" the popover opens once without taking focus or interrupting typing; after the user closes it, only a pill click reopens it; if 2 more minutes pass still stalled, it opens once more. | owner, 2026-10-15 |
| 16 | Where "Review differences" opens | **16A — inline list in the dialog.** Expands under the comparison: changed page/element names, one "yours / server" line each, "+ N more" after 8. The dialog and its choice stay in place. | owner, 2026-10-15 |
| 17 | DESIGN.md wording vs generated tokens (TODO proposal) | **C — fix in the Phase 1 PR, not deferred.** Rewrite DESIGN.md §NO BLACK RULE text cap and Anti-slop rule 10 so they match the generated tokens (`--bk-ink #111827`, `--bk-shadow-raised` on popovers/toasts) — see task DR-T8. | owner, 2026-10-15 |

### Approved Mockups

| Screen | Mockup path | Direction | Notes |
|---|---|---|---|
| Restore dialog | /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/restore-choice-20261015/final.png (chosen direction: variant-C.png) | Destructive action alone on the left, safe primary on the right; inline differences list | Decisions 5, 11, 16. Modal 480 px; canvas content in the image is placeholder. |
| Publish panel gate | /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/publish-gate-20261015/final.png (chosen: variant-C.png) | Checklist without cards, verdict in the header, website and forms on separate lines | Decisions 2, 3, 6, 7, 13. Image is not 1440×900; chrome sizes follow DESIGN.md, not the image. |
| Repair toast + Issues | /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/repair-issues-20261015/final.png (chosen: variant-C.png) | Quiet toast, compact rows with before → after, "Couldn't verify" group | Decisions 1, 8. The toast belongs bottom-left of the CANVAS, not over the drawer as drawn. |
| Autosave stuck | /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/save-stalled-20261015/final.png (chosen: variant-A.png) | Amber pill + anchored popover, accent only on Save now | Decisions 4, 15. |

### NOT in scope (design)

- Phase 2/3 surfaces (canvas bar, origin labels, selector field, slots, CMS query) — reviewed when those phases start; Section 11's IA sketch stays as their starting point.
- Figma boards for these screens — owner instruction 2026-10-14; the approved mockups are the visual reference for now.
- Device-specific layouts — editor is desktop-only (DESIGN.md).
- Scripted Preview on an isolated origin — deferred by CEO D3 (TODOS.md).

### What already exists (design)

DESIGN.md (Inter, one accent `#1A56DB`, 4 px grid, motion tokens, Flowbite palette); `chrome-ui` components `OverlayMount`, `ModalContent/Title/Body/Footer`, `Button`, `SaveStatus` (6 states, live region), `Popover`, `Toast`, `PanelHeader`, `ListRow`, `StatusDot`, `EmptyState`; `ConflictModal` (focus on the safe action, no scrim dismiss); `IssuesPanel` (scan/failed/retry states); `PublishConfirmModal`; `PreviewOverlay`; `RecoveryBanner` (folded into the restore dialog by decision 1).

### Design implementation tasks

- [ ] **DR-T1 (P1, human: ~1d / CC: ~2h)** — shell — Load-order coordinator: restore dialog → repair scan → toast → Issues; remove the old restore toast; fold RecoveryBanner; no toast over a modal
  - Surfaced by: Pass 1 — decision 1
  - Files: `packages/editor/src/editor/shell/hooks/useComposerInit.ts`, `editor/shell/RecoveryBanner.tsx`, new restore dialog under `editor/shell/modals/`
  - Verify: e2e — failed save + reload + teammate save → only the dialog shows; after choice, repair toast; never two overlays
- [ ] **DR-T2 (P1, human: ~1d / CC: ~2h)** — shell — Restore dialog with three copy variants, inline differences list, shared footer with ConflictModal
  - Surfaced by: Pass 2/3/7 — decisions 5, 11, 16
  - Files: `editor/shell/modals/ConflictModal.tsx` (+ tests), new `RestoreChoiceModal.tsx`, shared footer in `chrome-ui/`
  - Verify: unit tests per variant (teammate / same user / legacy); e2e both async orders; ConflictModal buttons renamed in the same commit
- [ ] **DR-T3 (P1, human: ~4h / CC: ~1h)** — chrome-ui — `SaveStatus` "Not saving" variant, priority order, popover (open once, reopen on click, once more after 2 min)
  - Surfaced by: Pass 2/7 — decisions 4, 15
  - Files: `editor/chrome-ui/SaveStatus.tsx`, `editor/shell/Topbar` wiring, `chrome-ui/__tests__/`
  - Verify: unit test of the priority table; e2e resize Enter×2 + click → pill shows Not saving → Save now → Saved just now
- [ ] **DR-T4 (P1, human: ~1d / CC: ~2h)** — publish UI — Panel as the gate: verdict header, server-result rows, "Your live site wasn't changed.", website/forms lines, retry paths; confirm modal reduced to one step; one issue-count selector
  - Surfaced by: Pass 1/2 — decisions 2, 3, 6, 7
  - Files: `editor/sidebar/tabs/publish/*`, `editor/shell/modals/PublishConfirmModal.tsx`, `editor/shell/lifecycle.ts`
  - Verify: e2e blocked/refused/deploy-failed/forms-failed states; topbar click while blocked opens the panel
- [ ] **DR-T5 (P1, human: ~4h / CC: ~1h)** — issues — Possible-damage rows with before → after, Keep as written, Couldn't verify group, VIEWER read-only; History version "Before automatic repair"
  - Surfaced by: Pass 2 — decision 8
  - Files: `editor/shell/IssuesPanel.tsx`, `editor/shell/hooks/useIssuesFeed.ts`, History version naming
  - Verify: fixture with "&amp;amp;" → Keep as written leaves text untouched; Details opens the named version
- [ ] **DR-T6 (P1, human: ~4h / CC: ~1h)** — preview — Building / error / second-failure states, focus on heading, Escape from the iframe
  - Surfaced by: Pass 2 — decision 9
  - Files: `editor/shell/PreviewOverlay.tsx`
  - Verify: forced build failure twice → "Still failing · Copy error details"; Escape closes with focus inside the iframe
- [ ] **DR-T7 (P2, human: ~4h / CC: ~1h)** — a11y — `aria-disabled` + visible reason pattern on chrome-ui `Button`; FullPageHost focus contract (heading focus, Escape order, opener fallback, pill and toasts outside inert)
  - Surfaced by: Pass 6 — decisions 13, 14
  - Files: `editor/chrome-ui/Button.tsx`, new `chrome-ui/FullPageHost.tsx`, `editor/sidebar/FullPageRouter.tsx`
  - Verify: keyboard-only walk of Brand/Settings/CMS/History; screen reader reads the disabled reason
- [ ] **DR-T8 (P2, human: ~30min / CC: ~5min)** — docs — DESIGN.md wording matches generated tokens (ink cap, popover/toast elevation); VIEWER export IP note copy
  - Surfaced by: Pass 5 — decisions 12, 17; Pass 2 — decision 10
  - Files: `DESIGN.md`, `server/trpc/routers/forms.ts` consumer UI (export action)
  - Verify: `pnpm run audit:rules` clean for DESIGN.md; VIEWER export shows the note and no IP column

### Design review completion summary

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | DESIGN.md present; UI scope = Phase 1 states |
  | Step 0               | 5/10; focus: all 7 passes                   |
  | Pass 1  (Info Arch)  | 4/10 → 9/10 after fixes                     |
  | Pass 2  (States)     | 5/10 → 9/10 after fixes                     |
  | Pass 3  (Journey)    | 5/10 → 9/10 after fixes                     |
  | Pass 4  (AI Slop)    | 8/10 → 9/10 after fixes                     |
  | Pass 5  (Design Sys) | 6/10 → 9/10 after fixes                     |
  | Pass 6  (Responsive) | 5/10 → 9/10 after fixes                     |
  | Pass 7  (Decisions)  | 2 resolved, 0 deferred                      |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (4 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 1 proposed → owner chose build now (DR-T8)  |
  | Approved Mockups     | 16 generated (12 variants + 4 final), 4 approved |
  | Decisions made       | 17 added to plan                            |
  | Decisions deferred   | 0                                           |
  | Overall design score | 4/10 → 9/10                                 |
  +====================================================================+
```

Outside voices: Codex (gpt-6-astra) completed, 9 findings, 0 hard rejections; Claude subagent completed, 12 findings, 0 hard rejections. Both converged on load order, save-pill priority, publish-gate owner and forms terminal state; all resolved by decisions 1–16.

### Unresolved decisions (design)

None.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 57 | CLEAR (2026-10-15) | mode: HOLD_SCOPE, 0 critical gaps; 11 decisions (D1–D11) answered |
| Outside Review | codex (gpt-6-astra) via `/plan-ceo-review`, `/plan-eng-review` and `/plan-design-review` outside voices | Independent 2nd opinion | 36 | completed (CEO, Eng and Design phases) | CEO 5 findings, all resolved; Eng 5 findings, all resolved or carried; Design 9 findings, 0 hard rejections, all resolved by design decisions 1–16 |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 43 | ISSUES OPEN (2026-10-15, FULL_REVIEW) | 37 issues, 0 critical gaps — all mapped to Phase 1 tasks E-T1…E-T10, none deferred |
| Design Review | `/plan-design-review` | UI/UX gaps | 42 | CLEAR (this run, 2026-10-15) | score: 4/10 → 9/10, 17 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 1 | — (not for this plan) | — |

- **OUTSIDE COVERAGE:** codex, design phase, completed 2026-10-15: 9 findings (7 High, 2 Medium), 0 hard rejections. Earlier codex phases: CEO (2026-10-14, 5 findings) and Eng (2026-10-15, 5 findings), both completed.
- **CROSS-MODEL:** Codex and the native Claude subagent agreed on the main design gaps: load-time ordering, save-pill priority and truthful stalled copy, the publish gate's owner surface, form-activation failure, restore-dialog differences, and disabled-with-reason accessibility. Claude alone flagged the duplicated publish verdict and the restore/conflict vocabulary split. Codex alone flagged the DESIGN.md ink/elevation contradiction, which was verified in `tokens.generated.css:77`. Model identities: native = Claude Opus 5.5; outside = gpt-6-astra.
- **VERDICT:** CEO + DESIGN CLEARED. ENG has 37 findings, all mapped to Phase 1 tasks with 0 unresolved; its status is recorded as ISSUES OPEN. The plan is ready to implement once the owner accepts it. Eng review required (status ISSUES OPEN by the log rule; re-run `/plan-eng-review` after Phase 1 tasks land to clear it).

NO UNRESOLVED DECISIONS
