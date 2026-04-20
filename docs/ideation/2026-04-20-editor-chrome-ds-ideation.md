---
date: 2026-04-20
topic: editor-chrome-ds
focus: Dedicated design system for editor chrome, separated from user-website DS V1
mode: repo-grounded
status: committed-full-rollout
---

# Ideation: Editor Chrome Design System

## Decision Log

**2026-04-20 — User committed to full 4-6 week rollout.** Context: 3 months of prior fix attempts (theme-unification V1/V2, DS V1 first pass, DS V1 remediation) all fell short — either killed by Codex review or shipped incomplete. User decided to commit to the full program rather than another partial fix, citing code quality as the primary driver.

**Protection clause.** Prior specs (theme-unification V1 + V2) were killed for skipping Week 0 (inventory). This rollout is committed to the SEQUENCE, not just the destination. Week 0 gate is non-negotiable — enforces the prior-learning from `feedback_inventory_before_architecture.md`.

## Grounding Context

### Editor chrome surface
- 552 editor tsx/ts files across 14 zones (shell, rail 60px, sidebar 240/320/fullpage, inspector 300px, panels, canvas overlays)
- Per-tab CSS files total 7525 lines across 7 sidebar files (PagesTab.css alone = 3426L)
- `src/shared/ui/` has 30+ primitives — only 71/552 editor files use them (13% adoption)
- 30+ inspector sections each with inline `React.CSSProperties`
- 8 empty-state implementations drift per tab
- Hardcoded dims (44/48/56/60/28/32/48/240/320) duplicated in 12+ places; `shared/constants/layout.ts` missing

### DS V1 state (shipped 2026-04-20)
- `--buildrick-*` chrome vs `--buildrick-design-*` user-site namespace contract locked
- 11 canonical CSS files in `packages/editor/src/themes/design-system/`
- 1498 inline hex sites + 1033 ESLint violations in WARN mode (baseline established)
- CI gates wired (`lint:ds`, `verify:ds`, hex baseline); WARN→FAIL ramp pending

### Prior learnings that constrain this work
- **Inventory before architecture** — V1 + V2 theme specs killed by Codex for skipping (memory: `feedback_inventory_before_architecture.md`)
- **SSOT must be grep-verified** — constants file ≠ canonical until every consumer reads it (memory: `feedback_ssot_verification.md`)
- **No alias layers** — 9 families killed in DS V1 (`--ls-*`, `--rail-*`, `--surface-*`, etc.)
- **Gate-driven, not flag-day** — WARN→FAIL behind baseline (memory: `project_ds_v1_remediation.md`)
- **Codex at phase boundaries** — every "complete" claim to date has been overturned within 24-72h

### External prior art applied
- **VS Code:** disjoint `workbench.*` vs `editor.*` namespaces, 250+ chrome tokens
- **Figma FPL:** 680 tokens + 22 component sets rebuilt over 5 months component-by-component
- **Adobe Spectrum:** nested `<sp-theme>` for tool-in-tool isolation, density as first-class attribute
- **DAW / CAD / game engine convergence:** chrome carries no color from user content, zero decoration, flat fills, border-only inspector fields, extreme density

## Ranked Ideas (Committed Rollout)

### 1. PanelShell Primitive + Per-tab CSS Deletion
**Description:** Ship `<PanelShell>`, `<PanelShell.Header>`, `<PanelShell.Toolbar>`, `<PanelShell.Content>`, `<PanelShell.Footer>` in `src/shared/ui/panel/PanelShell.tsx` as first-class Emotion components. Grammar from DESIGN.md:134-189 hard-coded — caller cannot override zone heights. Codemod every sidebar tab + inspector to compose them. Delete 7 per-tab CSS files (~7525 lines out). ESLint bans new `.css` files under `editor/sidebar/tabs/**`.
**Rationale:** The PanelShell grammar is already documented and locked — the problem is it lives in a document, not code. Components make drift structurally impossible. Single biggest lever: every future panel ships in ~2 hours instead of ~2 days.
**Downsides:** Codemod risk across 38+ panels. Requires API to be right on first try (validated in Week 2 via 2 simplest tabs).
**Confidence:** 90% · **Complexity:** Medium · **Status:** Unexplored

### 2. Shell-Consumer Inventory (Week 0 Gate)
**Description:** Single committed document `docs/reviews/2026-04-20-editor-chrome-consumer-inventory.md` — spreadsheet-style table with one row per chrome consumer finding (file, finding, priority HIGH/MEDIUM/LOW/LOCAL_SHADOW, fix). Generated from grep scripts for: `--buildrick-design-*` leaks in chrome paths, inline hex in editor/, magic dim literals, scattered emotion blocks. Expected ~800-1500 rows.
**Rationale:** Prior learning mandates this as gate #1. V1 and V2 theme specs died from skipping it. DS V1 fix-list-v2 (892 rows) is the template. Without it, every subsequent architectural decision is made blind.
**Downsides:** Adds 1-2 days before visible progress. Not glamorous.
**Confidence:** 95% · **Complexity:** Low · **Status:** Unexplored

### 3. Layout Constants SSOT + Codemod + ESLint Ban
**Description:** Create `src/shared/constants/layout.ts` exporting RAIL_W, SIDEBAR_W, SIDEBAR_WIDE, INSPECTOR_W, TOPBAR_H, HEADER_H, TOOLBAR_H, FOOTER_H, ROW_SM/MD/LG. Jscodeshift codemod rewrites all literal matches in height/width/minHeight/padding contexts. ESLint rule `no-magic-layout-literals` bans new raw literals in layout properties.
**Rationale:** `shared/constants/` already hosts breakpoints.ts, canvas.ts, commands.ts — layout.ts conspicuously missing. Cheapest high-leverage item. Pattern is identical to DS V1's token codemod.
**Downsides:** None meaningful — WARN baseline handles any codemod misses.
**Confidence:** 95% · **Complexity:** Low · **Status:** Unexplored

### 4. Data-Driven Inspector (Schema Registry)
**Description:** Replace 30+ hand-styled inspector sections with one `<InspectorRenderer schema={...}>` + typed schema files. Each "section" becomes `{ id, label, density, columns, fields: Field[], conditional }`. Control registry provides canonical inputs (length, color, select, toggle, number, shadow, gradient, link, spacing4). Migration behind feature flag; 5 simplest sections first, then full sweep.
**Rationale:** Inspector is the densest drift surface (30+ sections × inline CSSProperties). Recent commits (e41a995 "dedup patterns, wire missing props", 2ed60e3 "delete sectionConfig/groupsConfig") show the inspector is already being reshaped in this direction.
**Downsides:** Largest single rewrite. Schema design must survive contact with 30+ sections. Risk if inspector UX changes in parallel.
**Confidence:** 75% · **Complexity:** High · **Status:** Unexplored

### 5. Token Binding Contract (Compile-Time DS)
**Description:** `<Box bg="chrome.panel.bg" p="chrome.gap.md" radius="sm">` typed primitive. Style props accept only token paths from `tokens.chrome.*` TS union type (generated from 11 DS V1 CSS-var files). Raw hex/px = TypeScript compile error, not ESLint warning. Emotion emits `var(--buildrick-*)` under the hood.
**Rationale:** Moves DS compliance from runtime lint (1033 WARN) to compile-time. An AI agent or new contributor cannot accidentally write `#FF0000` — the compiler refuses. Compounds forever as code volume grows.
**Downsides:** Typed-prop API is opinionated; dynamic values (drag positions) still need `style={}` escape hatch. Token union must stay in sync with CSS vars (generator script required).
**Confidence:** 80% · **Complexity:** Medium · **Status:** Unexplored

### 6. Hex Gate WARN→FAIL via Green-Panel Allowlist
**Description:** `.ds-green-panels.json` allowlist. Migrated files run rules in FAIL mode; unmigrated stay WARN. Allowlist can only grow. Companion ESLint rule `no-legacy-components-import` fails any `editor/**` → `components/**` import (formalizes CLAUDE.md's "371 files, do not add" from social rule to build gate).
**Rationale:** DS V1 shipped WARN mode today with 1498 hex baseline. Ratchet is the endorsed next step — makes incremental progress permanent without flag-day rewrite.
**Downsides:** None — pure process ratchet.
**Confidence:** 95% · **Complexity:** Low · **Status:** Unexplored

### 7. Zero-Decoration Chrome Axiom + Chromatic Neutrality
**Description:** Three written axioms added to `DESIGN.md` §Chrome Axioms + two enforcement layers. **Axioms:** (A1) Zero decoration on panel chrome — no gradients, box-shadow must use a `--buildrick-shadow-*` token, `border-radius ≤ 4` on panel chrome only (form atoms exempt). (A2) Hue never load-bearing in chrome — cobalt restricted per §Color usage rules, status colors in status indicators only. (A3) No motion beyond function. **Enforcement:** (1) built-in `no-restricted-syntax` rules in `packages/editor/eslint.config.mjs` scoped via chrome-file overrides with LOCAL_SHADOW exclusions — catches JSX object-literal + Emotion template-literal patterns. (2) Grep gates 11-14 in `scripts/ds-grep-gates.sh`, file-backed by `scripts/.chrome-axioms-baseline`, fail on regression. No custom ESLint plugin; no `elevation.drop` token (real tokens are `--buildrick-shadow-{sm,md,lg,xl,dropdown,modal,hover,inner}`).
**Rationale:** Direct imports from DAW, game engine, microscope design. Prevents chrome competing with canvas content. Cheap to enforce, permanent discipline insurance. Baseline counts frozen Week 0: 129 gradients / 204 raw shadows / 592 panel-chrome radii > 4 / 566 magic layout literals.
**Downsides:** Grep-level enforcement misses interpolated token references (`${radius.md}px`) that resolve to panel-chrome violations at runtime — flagged as known limitation in inventory §10; addressed in Week 2 token convergence migration. Some designers will feel constrained when axioms harden from WARN to FAIL.
**Confidence:** 80% · **Complexity:** Low · **Status:** Shipped (Week 0)

## Committed Rollout Sequence (revised post-Codex 2026-04-20)

Token convergence moved ahead of `PanelShell` migration after Codex flagged the original Week 2 as "baking the wrong contract" — `PanelShell` built on current `--buildrick-radius-md` (8px) would contradict Axiom A1.3 the moment it ships. Token Binding (#5) now runs in Week 2 alongside layout constants.

| Week | Deliverable | Survivor(s) | Cost | Stop-here value |
|---|---|---|---|---|
| **Week 0** | Consumer inventory doc + Chrome Axioms in DESIGN.md + ESLint flat-config overrides + file-backed `.chrome-axioms-baseline` + 4 new grep gates | #2, #7 | 1 day | Inventory + file-backed baselines prevent V1/V2 failure pattern |
| **Week 1** | `shared/constants/layout.ts` + codemod on 566 magic layout literals + green-panel allowlist for hex/ESLint ratchet + `editor/ → components/` import ban | #3, #6 | 1-2 days | Layout drift stops; ratchet locks future progress |
| **Week 2** | `<Box>` Token Binding primitive + token convergence (decide: grandfather `radius-md` on form atoms only, panels use `radius-sm`) + small PanelShell scaffold (no tab migration yet) | #5, #1 prep | 4-5 days | Typed `<Box>` shipped; token contract locked; PanelShell API exists but tabs unchanged |
| **Week 3** | PanelShell migration of 2 simplest tabs (Settings, Pages) using Week 2 token decisions + validate decoration gate baselines drop | #1 | 3-4 days | 2 tabs fully PanelShell + axiom-clean; API validated |
| **Week 4** | PanelShell migration of remaining 6 tabs (Build, Templates, Media, Layers, Components, History) | #1 | 4-5 days | All 8 sidebar tabs consistent; per-tab CSS deleted |
| **Week 5** | `<InspectorRenderer>` + schema registry + migrate 5 adapter-fit sections (size, spacing, border, layout, css-classes) | #4 | 5 days | Schema proven on 5 adapter-fit sections from the 17 IDs |
| **Week 6** | Remaining 4 adapter-fit sections (grid, effects, all-css, visibility) + begin bespoke-adapter sections (flex, typography) | #4 | 5 days | 9/17 inspector sections migrated |
| **Week 7 (optional)** | 6 bespoke-adapter sections: animation, interactions, element-properties, background, link, quick-actions — schedule depends on whether bespoke pattern works | #4 | 5-8 days | Inspector fully data-driven; 17/17 IDs on registry |

**Key revisions vs the original sequence:**

- **Original Week 2 was wrong.** Shipping PanelShell before token convergence would have locked 8px radius into chrome headers/toolbars — contradicting Axiom A1.3 for panel chrome. Week 2 now does tokens first, PanelShell scaffold only.
- **Inspector scope corrected.** Original plan said "41 sections." Real count from `inspector/sections/registry.tsx:82` is **17 section IDs**, with `registry.tsx:254-257` already documenting 9 adapter-fit vs 8 bespoke. Migration order in Week 5-6 follows that split, not "simple-looking filenames."
- **Pilot list corrected.** Original pilots (`QuickActionsSection`, `VisibilitySection`) are NOT adapter-fit per the existing registry — they have custom behaviors. New Week 5 pilots (size, spacing, border, layout, css-classes) come from the 9 adapter-fit sections.

### Opportunity cost (named explicitly per Codex feedback)

4-6 weeks of solo work on DS infrastructure = **no user-facing feature ships** in that window. Specifically displaced:

- Any new sidebar tab or inspector panel feature (PanelShell API must land first or they'll be rewritten)
- Any visual polish / theme changes (axioms must be stable before micro-iteration is meaningful)
- Any new element type inspector sections (schema registry must land first or they'll be bespoke)

**Why now:** every sidebar tab and inspector section currently takes ~2 days because each reinvents header/toolbar/row/empty-state. Post-rollout, the same work takes ~2 hours. Break-even happens around the 15th new panel/section — which, at the current feature-request rate, is 2-3 months out. This investment pays back inside a quarter and every subsequent feature is cheaper forever.

**Why not later:** 3 months of prior fix attempts (theme-unification V1/V2, DS V1 first pass, DS V1 remediation) all failed partially or completely. The debt compounds until the component layer ships. Delaying another quarter means another ~8-10 panel features shipped at 2-day-per-panel cost instead of 2-hour-per-panel cost, and the consumer inventory baseline grows another 30-40%.

### Non-negotiable gates

1. **Week 0 inventory MUST ship before Week 1 starts.** Done (this commit).
2. **Each week's PR must pass all 14 DS gates + ESLint (advisory).** `.chrome-axioms-baseline` ratchets week by week.
3. **Codex review at every week boundary** before moving to the next. Budget ~1 hour per review. This is the protocol that caught 5+ systemic holes in DS V1 "complete" AND Week 0 draft 1.
4. **No file crosses the green-panel allowlist without a migrated sibling of similar complexity.** Prevents cherry-picking easy files.
5. **Stop-here value is real.** After any week, the rollout can pause without breaking the codebase. Features keep shipping (with the caveats in the opportunity-cost section above).

### Non-negotiable gates

1. **Week 0 inventory MUST ship before Week 2 starts.** No exceptions. This is the immune system against the V1/V2 failure pattern.
2. **Each week's PR must pass DS gates (verify:ds, lint:ds-hex) in addition to tests.** Green-panel allowlist ratchets week by week.
3. **Codex review at every week boundary** before moving to the next. Budget ~1 hour per review. This is the protocol that caught 5 systemic holes in DS V1 "complete."
4. **No file crosses the green-panel allowlist without a migrated sibling of similar complexity.** Prevents cherry-picking easy files.
5. **Stop-here value is real.** After any week, the rollout can pause without leaving the codebase broken. Features keep shipping.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Figma as canonical token source | No evidence of a mature maintained Figma file as SSOT. Violates inventory-before-architecture. |
| 2 | Drop Emotion from chrome (CSS-only) | Too expensive vs speculative perf value. Fights CLAUDE.md mandate. Future brainstorm if perf becomes measured issue. |
| 3 | Visual regression pixel-diff testing (Playwright) | Duplicates #1 + #5 enforcement. Brittle to canvas content changes, high setup cost. |
| 4 | Codex-at-phase-boundary as CI gate | Already covered — manual Codex review at phase boundaries is proven; CI-gating adds complexity. |
| 5 | Adoption telemetry in primitives | Premature for solo workflow. Hex baseline is already an adequate ratchet metric. |
| 6 | Claude-ships-blind acceptance test | Good principle, not a concrete deliverable. Fold in as acceptance criterion on #1. |
| 7 | Versioned `@buildrik/editor-chrome` monorepo package | Organizational overhead unclear for solo project. Monorepo split is premature. |
| 8 | 8 panel templates (fork-and-edit, shadcn model) | Contradicts #1's reusable primitive. Composition wins here because the grammar is regular. |
| 9 | One-file Panel DSL (.panel.ts) | Overlaps #4. DSL is a more ambitious rewrite; schema registry is the pragmatic middle. |
| 10 | Dual-stylesheet physical bundle split (chrome.css vs canvas.css) | DS V1 namespace + ESLint gate achieves most isolation. Bundle split too heavy vs marginal gain. |
| 11 | Density root attribute `<EditorTheme scale>` | Not urgent — future brainstorm variant on #5 once token binding is live. |
| 12 | Swiss typographic scale (standalone) | Folds into #5 Token Binding Contract (typography is just another token family). |
| 13 | 20-component ceiling (standalone) | Discipline principle, not a deliverable — serves #1 implicitly. |
| 14 | Spreadsheet formula bar (persistent inspector property bar) | UX/interaction idea, out of scope for DS ideation. Separate brainstorm candidate. |
| 15 | CAD inspector flat-rule grammar (standalone) | Valuable details absorbed into #4 schema design + #7 zero decoration. |
| 16 | Air traffic control per-zone layout grammar | Duplicated by #1 PanelShell grammar. |
| 17 | DS CLI scaffold (`npm run ds:new-panel`) | Good but low standalone value; fold as final-step sweetener on #1. |
| 18 | Standalone `<EmptyState>` consolidation | Folded into #1 — PanelShell's primitive set includes EmptyState. |
