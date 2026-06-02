---
date: 2026-06-03
topic: editor-dead-features-beat-webflow
focus: which editor features are dead; how to beat Webflow on features (not price); how to make features industrial-grade
mode: repo-grounded
---

# Ideation: Editor Dead Features + Beat Webflow on Features

## Grounding Context (Codebase + Market)

**Editor (packages/editor/src) — dead/scaffold inventory:**
- Onboarding system (`editor/onboarding/`) — built, zero imports, fully dark → REVIVE
- Stock photo/video search (`StockService`) — returns `[]`, `IS_STOCK_CONFIGURED=false` → FOLD into AI
- Integrations screen — all cards "Coming Soon", no OAuth → KILL label
- Animation timeline/scrolltrigger — commented-out L0 stubs, files absent → KILL editor / REVIVE as token presets
- Color opacity slider — stub, only 0%/100% → FIX
- DS token rename — button dead, callback never wired → REVIVE as migration
- Interactions section — silent no-op via optional `el.setInteractions?.()` → REVIVE via command bus
- Collab presence — UI mounted, real sync unproven → REVIVE as real multiplayer

Honesty rule (from 2026-05-18 audit): static read ≠ shipped. Grep handler + tRPC + flag, then live-walk before killing.

**Webflow weak spots (attack surface):** pricing chaos (2 hikes/6mo); localization tax ($9–29/locale/mo); static-only export breaks CMS/forms; multiplayer lacks live cursors + element lock, branching Enterprise-only; sunset Logic + User-Accounts (distrust); rigid CMS coupled to design; manual Core-Web-Vitals; AI is wizard-only (Framer Workshop beats them in-canvas). Webstudio wins on Next/Remix export + no lock-in; Plasmic on codebase-integration. W3C design-tokens spec v1 stable Oct 2025; EU Accessibility Act enforcement live 2025 — no builder has native WCAG audit.

## Ranked Ideas

### 1. Hybrid dynamic publish — forms/CMS/redirects/logic survive export
**Description:** Publish-to-Vercel ships a thin edge/serverless layer alongside static assets: forms POST to real endpoint+inbox, redirects/headers enforced, CMS pages render server-side, simple conditional logic baked into runtime JS. Folds auto-CWV (compress/dimension/defer) with before/after Lighthouse delta.
**Rationale:** Webflow's #1 hated betrayal; they sunset Logic + User-Accounts. `PublishService` + Vercel OAuth + forms/redirects/headers UI already wired (config theater, runtime gap). Appeared in all 5 ideation frames.
**Downsides:** Edge-runtime emit pipeline is real infra; per-site serverless cost; form-endpoint abuse/rate-limit.
**Confidence:** 90% · **Complexity:** High · **Status:** Unexplored

### 2. Agent-native command bus + in-canvas AI (keystone)
**Description:** Route every canvas/inspector/layers/pages/DS mutation through one typed command registry. Each command = UI handler AND agent tool (Zod schema). AI moves from sidebar wizard to in-place: select element → prompt → agent mutates tree → diff overlay → accept/reject via existing undo. Folds stock search, integrations, auto-CMS-from-design into agent intents.
**Rationale:** Single investment unlocking AI-builds-site, macros/replay, multiplayer (typed+ordered changes), audit logs. Beats Webflow (wizard-only AI), matches Framer Workshop. `Composer`/`HistoryManager` already centralize mutations; AI is real tRPC but has no tool surface.
**Downsides:** Command-extraction refactor touches every mutation path; risk of half-migration / two code paths.
**Confidence:** 85% · **Complexity:** High · **Status:** Explored

### 3. Design tokens as the spine — multi-brand + recalc graph
**Description:** Promote DS tab to source-of-truth. Every element binds W3C tokens; edit token → dependency-graph recalc repaints dependents; dark/variants as formulas. Workspace brand layer → N sites inherit+override. Revives token-rename as migration; animation as token-bound interaction presets; enables token-aware section marketplace (auto-theme on import).
**Rationale:** W3C tokens v1 stable Oct 2025; no builder treats tokens as SSOT. Strongest existing asset (token registries + CSSBundler + bidirectional StyleEngine shipped). Rebrand-in-one-edit + white-label can't be copied by Webflow's inline-style model without a rewrite.
**Downsides:** Recalc-graph + override resolution nontrivial; migrate inline styles onto tokens.
**Confidence:** 80% · **Complexity:** High · **Status:** Unexplored

### 4. Real multiplayer — element-lock + git-style branch/merge
**Description:** Wire dead collab-presence to real CRDT/OT: live named cursors, hard element-level locking, branch-able pages with visual 3-way node-level merge (undo DAG).
**Rationale:** CLAUDE.md names collab as next arc. Webflow multiplayer weak (no cursors/lock, branching Enterprise-only, merge deletes comments). Element-lock + fearless branching = agency-team wedge. history+time-travel + `OTEngine` exist; transport is the gap. Best built after #2 (commands are the merge unit).
**Downsides:** Real-time sync is the hardest piece; presence backend + conflict semantics.
**Confidence:** 70% · **Complexity:** High · **Status:** Unexplored

### 5. Live build-time diagnostics + native WCAG publish gate
**Description:** Background "web language server" streams inline squiggles as you build (mobile overflow, CLS, failing contrast, broken flex, missing alt) with one-click quick-fixes. Rolls up to WCAG 2.2 AA score that soft/hard-gates publish. Adds blast-radius on destructive edits.
**Rationale:** EU Accessibility Act live; no major builder has native WCAG audit — compliance buy-reason, not price. IDE keystroke-time diagnostics kill the publish→Lighthouse→fix loop. Grounded in `AltTextService` + DS contrast tokens.
**Downsides:** Rule-engine maintenance; noisy false-positives erode trust.
**Confidence:** 75% · **Complexity:** Medium · **Status:** Unexplored

### 6. Free/automatic localization (no per-locale tax)
**Description:** Ship locked `LOC: A,A` (subdirectory URLs + JSON column) as unlimited free locales: AI bulk-translate at publish (text+alt+meta), side-by-side per-string override grid, server-side locale routing.
**Rationale:** Webflow's most-resented meter ($9–29/locale/mo; 5 langs ≈ $145/mo). Architecture decided, backend started (05-18 run). "Drop the locale tax" wedge, not a price war.
**Downsides:** MT quality needs human-override UX; hreflang correctness; translation drift on edits.
**Confidence:** 80% · **Complexity:** Medium · **Status:** Unexplored

### 7. Onboarding revive — AI generates a first editable site
**Description:** Mount the already-built onboarding as one-prompt first run: "describe your site" → agent drags a real multi-page starter onto the live canvas (pages, nav, sample CMS, tokens). Blank canvas → editable site in 90s. Pairs with #2.
**Rationale:** Cheapest high-ROI activation win — system fully built, unused. Session-1 abandonment is where Webflow refugees churn. Door is generation, not a coachmark tour.
**Downsides:** Generation quality gates first impression; needs on-brand/editable guardrails.
**Confidence:** 78% · **Complexity:** Low–Medium · **Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Auto Core-Web-Vitals (standalone) | Folded into #1 publish pipeline |
| 2 | Fold dead panels into agent | Folded into #2 |
| 3 | Auto-CMS-from-design / one-schema-feeds-all | Folded into #2 + #3 |
| 4 | AI stock image (describe→placed→alt) | Folded into #2 |
| 5 | Token-aware section marketplace | Folded into #3 (downstream of token spine) |
| 6 | Migrations for token rename | Folded into #3 |
| 7 | Interaction presets (revive animation) | Folded into #3 (token-bound) |
| 8 | Pluggable hosting / no-lockin Next-Remix export | Better as brainstorm variant of #1; lower urgency |
| 9 | Revive Logic-layer as visual programming | Subset of #1 dynamic runtime; too big standalone now |
| 10 | Industrial inspector "diagnose layout" | Opacity = quick-win; diagnose folded into #5 |
