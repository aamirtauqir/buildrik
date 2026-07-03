# Design-reconciliation mission — code ⇄ Raw Design ⇄ happy-path wireframe (2026-07-02)

MISSION — Reconcile three sources into one truthful design system: (1) the shipped Buildrik codebase, (2) the Raw Design page in my Figma file, (3) the Wireframing page in the same file. End state: Raw Design reflects every real feature honestly, and a rebuilt wireframe page shows the whole product as one clear happy-path flow, job by job.

AUTONOMOUS MODE (founder pre-authorized "do not stop"): at each GATE below, write the gate output (table / screenshots) into the run log `docs/reviews/design-reconciliation-runlog-20260702.md`, make the call yourself, and continue. Never wait for founder input. The ONLY hard stop: any operation that would delete, move, or restyle an existing founder frame in Figma — that is forbidden outright, not gated.

## GROUND RULES (all phases)

1. Code is the only ground truth. Docs and Figma frames are hypotheses — before asserting "X works / is missing / behaves like Y", grep the actual code. Known trap: our audit docs are stale where code shipped past them.
2. Multi-package inventory or it's invalid: packages/dashboard (React `trpc.` client) + packages/editor (vanilla `client.*` via api-client.ts — grep separately) + server/ routers+services + packages/shared schemas.
3. Figma: use the Pro server `plugin_figma_figma` (run `whoami` first — must be the pro seat, not the capped account). Load the /figma-use skill before ANY use_figma call. NEVER delete, move, or restyle existing frames — every write is additive (new frames, new pages, note layers).
4. Job-first, not module-first. The unit is the journey, not the screen. Spine = ★ agency-wedge + 6 jobs: J1 Run-the-business · J2 Start-a-site · J3 Build · J4 On-brand (cross-CLIENT push, not single-site) · J5 Sign-off · J6 Ship & run. AI = cross-cutting (not a job, not a rail slot). Auth/save/toasts/confirms = substrate, not nav.
5. Locked editor rail: Insert · Pages · Styles · Site (confirmed decision). New features dock INSIDE a slot (e.g. CMS = "Content" view under Pages) — never a new rail slot.
6. Every state or it doesn't count: a screen is designed only when empty / loading / error / success (+ permission-denied where roles exist) are DRAWN. Never write a "covered ✓" claim for a state that isn't drawn — draw first, then claim.
7. Honesty tags carry into the design: 🟡 UI-exists-but-backend-decorative · ⚠️ dead-code-or-deploy-gap · "dashboard-not-editor" for surfaces that live in the dashboard (Share gate, Comments-on-published, Shared-DS-push, Custom domains). The design must not pretend these are editor features.
8. Don't invent. No feature enters the design without a code path proving it. Collab = demo-only (6 P1 data-corruption bugs) — presence slot stays gated, never promoted.
9. Wireframe fidelity: low-fi grey-box (structure, not polish). Monochrome + cobalt #2D6DFF accents only; fonts only General Sans / Inter / Geist / Geist Mono.

## PHASE 0 — FEATURE TRUTH TABLE (codebase)

Do NOT re-derive ~100 features from scratch. Load these existing inventories as the hypothesis:

- docs/reviews/complete-feature-list-20260623.md
- docs/reviews/wiring-matrix-codex-20260624.md
- docs/reviews/editor-orphans-20260624.md
- docs/reviews/ia-home-map-20260623.md
- docs/reviews/journey-coverage-audit-20260629.md
- docs/reviews/design-gaps-extensibility-audit-20260630.md
- docs/learning/product-design/reference/editor-functionality-map.html
- docs/learning/product-design/reference/ia-tree.html (60-node build board)
- docs/learning/product-design/reference/wireflows.html (10 journeys — the happy-path SSOT)
- docs/learning/product-design/reference/editor-wireframe.html (39 §s)
- docs/reviews/wireframes/ (dashboard screens)

Then spot-verify by grep every feature you will later mark MISSING or MISALIGNED. Known post-doc shifts to re-check in code: AI site-generation (wired), Stock (real, env-gated), CMS publish toggle (shipped), sign-off notify loop (shipped), redirects deploy (fixed), Custom-CSS (dead code), interactions (13 trigger types defined / 7 wired).

OUTPUT → one table: Feature · Job (J1–J6 / ★ / substrate / cross-cutting) · Surface + entry-point · Home (editor|dashboard) · Status (✅ works · 🟡 partial · 🔵 env-gated · ⚠️ dead/gap) · States existing in code · Evidence (file:line).

GATE 0 — write the table + total count to the run log, then continue.

## PHASE 1 — READ THE FIGMA FILE (no writes)

File: https://www.figma.com/design/RmtnWGlZX9Z3idP6f5vmLq — get_metadata first; identify the "Raw Design" page and the "Wireframing" page. If page names don't obviously match, pick the closest match by content (screenshot to confirm) and record the mapping decision in the run log.

Inventory every top-level frame on both pages (batch the reads; get_screenshot only where a name is ambiguous).

OUTPUT → per page: frame name + node-id · which real feature(s) it shows · which job · notes (duplicate-of / unclear / which states are drawn).

## PHASE 2 — GAP DIFF (Raw Design vs the truth table)

Classify every mismatch with exactly these five verdicts:

- MISSING — in code, absent from Raw Design.
- INCOMPLETE — frame exists but steps/states missing (zero-ghosts test).
- DUPLICATED — same feature drawn in 2+ places (#14 one-home: name the keeper).
- UNCLEAR — cannot tell which real feature the frame maps to.
- MISALIGNED — contradicts real behavior (wrong rail, wrong home, editor-vs-dashboard wrong, drawn as working when 🟡/⚠️, invented capability).

Every MISSING/MISALIGNED row must carry code evidence (file:line) gathered in Phase 0 — no phantom findings.

OUTPUT → gap table: Verdict · Feature · Figma node (or —) · Evidence · Proposed fix.

GATE 2 — write the gap table to the run log, then continue.

## PHASE 3 — FIX THE RAW DESIGN PAGE (additive only)

For each gap row: add MISSING features as new labeled grey-box frames on the Raw Design page, grouped into job sections (★ wedge first, then J1–J6); on DUPLICATED frames add a note layer "→ merged into <keeper>" (do not delete); on MISALIGNED frames add the honesty-tag note (🟡 / ⚠️ / dashboard-not-editor); fix UNCLEAR by renaming frames to the real feature name.

## PHASE 4 — REBUILD THE WIREFRAME AS THE HAPPY PATH (new page)

Create a NEW page "Wireframe v2 — Happy Path". Leave the old Wireframing page untouched as archive (rename-suffix " — archive" is the only edit allowed there).

Route (decided): author/fix the flow in the canonical HTML first (docs/learning/product-design/reference/wireflows.html) and capture to Figma via generate_figma_design — keeps HTML as SSOT (the proven localhost-capture export route from memory `reference_figma_mcp_starter_cap`).

Structure:

- Row 0 = ★ wedge journey end-to-end (the spine): Sign-in → Clients → New site → Editor canvas → Master brand → DS push (select client sites → blast-radius confirm "N sites will update") → per-site result → Preview → Send-for-review (note + change-summary) → status flip In-review → ✓ Approved → Publish → ● Live.
- Rows 1–6 = one row per job (J1–J6), left→right storyboards mirroring wireflows.html's 10 journeys: numbered steps (J3.1, J3.2 …), one frame per step, a "user does → user sees" caption under each, connector arrows between steps.
- Every journey ends on its done-state (● Live / ✓ Approved / lead captured) — never on an error, restore, or dead-end step.
- Branch states go BELOW the happy row: each step's empty/loading/error/denied variants as smaller frames under it — drawn, not noted.
- Every editor frame shows the locked rail (Insert·Pages·Styles·Site) + slim topbar (Exit · Share · Publish · ⋯) + canvas toolbar hugging the canvas (undo/redo · history · device · zoom — #16).
- Placement: every Phase-0 feature lands in exactly ONE journey home (dock inside existing slots; no new nav). AI appears as ✨ moments inside steps, not as its own row.

GATE 4 — after Row 0 + one job row, get_screenshot both, write to the run log, then continue.

## PHASE 5 — VERIFY (two different audits, clean twice)

- Mechanical: coverage table Feature → frame node-id; count must equal Phase 0's total; 0 features without a home; 0 features with two homes; every journey's last frame is a done-state.
- Coherence (fresh eyes): re-walk each journey as a user who wasn't in the room — flag any step where "what does the user do next?" has no answer, and any grouping that has drifted back to module-shape.

Fix and re-run BOTH audits until each returns clean twice in a row.

FINAL OUTPUT (into the run log) → (a) the coverage table · (b) what you did NOT add, with reasons (honesty list) · (c) screenshots: wedge row + every job row · (d) product gaps that are BUILD work, not design work (e.g. client-approve, CMS field-type coverage, domains verify) — listed separately so design doesn't pretend to fix code.
