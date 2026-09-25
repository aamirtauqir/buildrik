# Buildrik full audit — 2026-09-25

This is a read-only, whole-codebase audit run as a multi-agent playbook (`PLAYBOOK.md`, Prompts 1–29). **Nothing in this folder changed product code.** No finding was reproduced in a running app: there was no Postgres, no browser, no Vercel Blob and no second client. The evidence is code reading (file:line), unit-level PoCs, jsdom probes and existing vitest suites. Each report says exactly what it did **not** verify.

## How to read the set

1. **Start with `90-fix-plan.md`.** It is the merged, de-duplicated result:
   - the verified P0 list;
   - 75 fixes in 5 batches (S, then A to D), with dependencies and required tests;
   - 46 product decisions;
   - the downgraded and refuted appendix.
2. **Use `00-inventory.md` as the map:** modules, routes, flags, the router-to-service map, and the competing implementations.
3. **Open an individual report `NN-*.md`** for the evidence behind any finding.
   - Finding IDs are `A<audit>-<n>`; for example, A19-2 is audit 19, finding 2.
   - Every important finding uses the playbook format: Finding / Severity / File / Symbol / Evidence / Expected / Root cause / Affected modules / Recommendation / Status.
4. **Severity in individual reports is the auditor's own rating.**
   - The **final** severities are in `90-fix-plan.md`. An adversarial verifier re-checked every P0, and 9 P0 claims were downgraded there.
   - When the two disagree, `90` wins.
5. **Status vocabulary.**
   - VERIFIED means verified in code or in a unit PoC. It never means verified in a running app.
   - PARTIAL, NOT VERIFIED, NOT RUNTIME VERIFIED and PRODUCT DECISION REQUIRED mean what they say.
6. **Each report ends with three sections:**
   - "Overlaps": observations handed to another audit, not audited there.
   - "Product decisions required".
   - "AUDIT HANDOFF".

## Index

Counts are the raw counts as each audit filed them, before merging and verifier verdicts.

| File | Audit | Headline | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|---|
| `PLAYBOOK.md` | — | Rules, evidence format, Prompts 1–29, agent roles | — | — | — | — |
| `00-inventory.md` | Stage A inventory | Repo, route, flag, router and service map; competing implementations; baseline test runs | — | — | — | — |
| `01-information-architecture.md` | 1 · IA and ownership | Two owners for settings: the theme push writes element CSS instead of Brand tokens, and editor autosave reverts dashboard settings. Media is per-user. | 2 | 3 | 9 | 7 |
| `02-module-cohesion.md` | 2 · Module cohesion | The settings mirror silently undoes dashboard edits. Non-admins hit an ADMIN-only mutation on every save. Many parallel implementations were never retired. | 1 | 2 | 11 | 6 |
| `03-navigation-discoverability.md` | 3 · Navigation | Review is advertised through five doors but always fails with `agency_layer` off. Sticky deep links land users on the wrong sub-screen. | 0 | 2 | 6 | 9 |
| `04-surface-architecture.md` | 4 · Surfaces | Full-screen surfaces don't own the keyboard, so Delete hits the hidden canvas. The Settings unsaved guard is bypassable. | 1 | 1 | 9 | 5 |
| `05-search-architecture.md` | 5 · Search | 34 search surfaces. The Pages-drawer ⌘K opens two palettes and can leave a hidden modal that disables all shortcuts. | 0 | 1 | 9 | 8 |
| `06-interaction-architecture.md` | 6 · Interaction | Locked elements can be deleted. Canvas ⌘Z reverts saved site settings. Form submissions are hard-deleted in one click. | 0 | 3 | 8 | 4 |
| `07-collaboration-product-architecture.md` | 7 · Collaboration product | A demoted member keeps their site role. The save conflict check is not atomic. Comments have no home with `agency_layer` off. Live co-editing (flag-off) is unsafe. | 1 | 8 | 11 | 5 |
| `08-signifiers-affordances.md` | 8 · Signifiers | A blocked Publish still looks like the primary CTA. The page password is shared but never enforced. Destructive actions are painted in accent blue. | 0 | 2 | 11 | 14 |
| `09-cognitive-load.md` | 9 · Cognitive load | Four commit models. Staged Brand edits show "Unsaved" but cannot be saved, and the exit guards ignore them. | 0 | 1 | 9 | 5 |
| `10-typography-spacing-layout.md` | 10 · Typography and layout | The chrome Button has no size contract (28/32/40px). Three palette geometries, two modal scales, and the type ramp is mostly bypassed. | 0 | 0 | 4 | 12 |
| `11-design-system-consistency.md` | 11 · Design system | The shell primitives have 0 production consumers. 12 hand-built dialogs have no focus trap. Dashboard raw controls and a stale hex gate. | 0 | 2 | 12 | 7 |
| `12-states-feedback-errors.md` | 12 · States and errors | The settings mirror bypasses the conflict guard. Publish poll failure freezes the panel. Invite email failures are swallowed. 44 mutations say nothing on 4xx. | 1 | 5 | 7 | 3 |
| `13-accessibility.md` | 13 · Accessibility | The dashboard Modal keeps one typed character. Labels are not associated with their fields. Layers keyboard navigation stalls. | 0 | 3 | 10 | 7 |
| `14-functional-wiring.md` | 14 · Functional wiring | History AI Summary and milestones are dead (superjson bypass, reproduced). 16 of 18 crons have no cPanel trigger. | 0 | 2 | 7 | 9 |
| `15-e2e-cross-module-flows.md` | 15 · E2E flows | 24 flows traced. With approval on and `agency_layer` off, only the OWNER can publish. Publish has no freshness check. `sites.list` ignores site scope. | 0 | 3 | 6 | 4 |
| `16-collaboration-runtime.md` | 16 · Collaboration runtime | Autosave rewrites settings from a stale copy. The "OT" never transforms ops. Prototype pollution through the op channel. CMS and component lost updates. | 1 | 7 | 7 | 2 |
| `17-code-architecture.md` | 17 · Code architecture | The save conflict check is read-then-write. Publish rollback and diff are dead: the fix went into a function nothing calls. | 1 | 1 | 6 | 11 |
| `18-performance.md` | 18 · Performance | Every edit re-serializes and replaces the whole canvas DOM. Autosave writes every page. The eager 2.2 MB editor chunk. | 0 | 1 | 8 | 6 |
| `19-security-permissions.md` | 19 · Security and permissions | Seven P0s: stored XSS, page IDOR, upload overwrite, blob delete, signup deleting accounts, EDITOR self-approval, demotion bypass. | 7 | 2 | 5 | 6 |
| `20-test-coverage.md` | 20 · Test coverage | Wide but unit-only. No DB test, no real editor E2E, 19 of 33 routers untested, collab 0 of 11 scenarios. | 0 | 5 | 7 | 3 |
| `90-fix-plan.md` | 29 · Fix-batch plan | **6 verified P0s** (all audit 19). 75 fixes (S 12 · A 22 · B 17 · C 9 · D 15). 46 product decisions. 9 P0 claims downgraded, 0 refuted. | 6 (final) | — | — | — |
| **Total (raw)** | | | **15** | **54** | **162** | **133** |

The raw P0 count is 15. It becomes 6 verified P0s after de-duplication and verifier verdicts:
- A01-2, A02-1, A12-1 and A16-1 are one finding, now P1.
- A07-1 and A19-7 are one finding. It stays P0 but needs a human severity check.
- A01-1, A04-1, A17-1 and A19-6 were downgraded.

**Status:** plan only. Awaiting approval. No code has been modified.
