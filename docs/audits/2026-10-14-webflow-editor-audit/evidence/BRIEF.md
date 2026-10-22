# Shared brief — Buildrik vs Webflow editor audit (2026-10-14)

You are one reader in a multi-part audit. READ-ONLY on the product: never edit code, tests, config, Figma or repo docs. The only file you may write is your own output file named in your task.

Repo: /Users/shahg/Desktop/pencil/buildrik (main @ df60cf9ec). Editor: packages/editor/src (engine/ = headless Composer + managers; editor/ = React chrome; shared/). Dashboard (Next.js, hosts the shipping editor at /edit/:id): packages/dashboard. Server: server/trpc/routers, server/services. DB: prisma/schema.prisma. Shared Zod: packages/shared/schemas. Feature flags: packages/editor/src/shared/utils/featureFlags.ts + runtimeEnv.ts (flagged features are PLANNED, not dead). Read packages/editor/CLAUDE.md and the AGENTS.md in any subdir you study.

Prior audits: 10 Oct audits are context only (NOT proof): packages/editor/docs/ui-ux-audit-2026-10-10/, packages/editor/docs/product-audit-2026-10-10/, packages/editor/docs/master-audit-2026-10-10/{WEBFLOW-FRAMER-GAP-ANALYSIS,PHASE-2-CANVAS-FINDINGS,FUNCTIONAL-AUDIT-MATRIX,FEATURE-INVENTORY,TECHNICAL-DEBT-AND-RISKS}.md, docs/audits/2026-10-08-editor-full-audit/. DO NOT use or cite any master-audit file dated 2026-10-14 (R38–R48, STATUS continuations, page-04 Figma work): the owner rejected them. Re-check every prior claim against current code; say "confirmed in code @df60cf9ec" or "no longer true".

Evidence levels (use exactly):
- CODE = implemented in code (cite file:line / symbol)
- REACH = reachable through UI per code (mounted, routed, not flag-off; cite the mount/route)
- LIVE = verified in running app (you cannot do this; instead list it under "Live checks needed")
- DESIGN = represented in Figma — out of scope this round (owner instruction); write "not assessed"
- PLANNED = described/planned only (docs, flags off, TODO)

Do not invent capabilities. If unsure → "Not verified" + what evidence would settle it.

Output file format (markdown):
1. Module map: per module — purpose, entry points (routes, rail items, menus, shortcuts, command palette ids), actions, dependencies, evidence.
2. Screen/flow inventory: every screen family, panel, tab, dialog, context menu, important reusable control in your scope, with file paths.
3. Control traces: for the important controls, UI → state change (Composer method / store) → validation → persistence (save path: local IndexedDB / tRPC / server) → rendered result (canvas DOM, preview, export). Mark where the chain breaks or is unclear.
4. State coverage: for each screen family, which of empty, loading, hover, focus, selected, disabled, read-only, validation-error, saving, saved, unsaved, failure, conflict, recovery exist in code (cite).
5. Ownership rows (table): Property/action | Current editing location(s) | Value owner (object/resource) | Scope (element/component/page/site/workspace) | Local/inherited/shared/bound/overridden | Who may change it (role check, cite) | Side effects (what else changes) | How the source of the value is shown | Reset/unlink/detach/revert semantics | Applied vs saved vs published boundary. Flag competing surfaces, unclear precedence, silent global effects, misleading editability, ambiguous reset.
6. Gap candidates vs Webflow (table): Area | Buildrik evidence | Webflow capability (state if from memory — the doc agent will confirm) | Classification (Missing capability / Partial implementation / Implemented but undiscoverable / Ownership ambiguity / Inconsistent interaction / Missing state / Intentional difference / Not verified) | User impact | Suggested change | Priority guess P0–P3.
7. Exists in code but hidden/poorly exposed (list, with evidence).
8. Preserve (works well or differentiates; evidence).
9. Defects found in code (with file:line and a concrete failure scenario).
10. Live checks needed: numbered, each an exact reproducible step list against the running editor (http://localhost:3300/edit/<siteId>) with the expected observable result and how to measure it (getComputedStyle / DOM / network / reload). These will be executed by live agents, so make them precise.

Be thorough. Prefer grep + targeted reads. Return to your caller only a <=300-word summary + your output file path.
