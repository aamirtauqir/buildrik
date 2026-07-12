# Design gaps + extensibility audit — the 4 artifacts (= the Figma file)

**Date:** 2026-06-30
**Source:** codex consult (medium, 600k tok, read the 4 artifacts + spot-checked `packages/editor` + `packages/dashboard` + `packages/shared`). Lens = forward-looking: broken-ends, gaps, can-we-add-features. NOT a re-run of the 3 coherence passes (those are done).
**Audited:** `ia-home-map.html · ia-tree.html · wireflows.html · editor-wireframe.html` — the set captured into Figma `RmtnWGlZX9Z3idP6f5vmLq`.

## Headline
Structure is sound. **No major orphan / "no home" problem** — the 6-job IA places nearly everything. The blockers are **outcome closure**, not coherence: three journeys let a user *start* but not reliably *reach done*. These are **product build work, not design-doc bugs** — they don't get fixed by editing the HTML; they get fixed by building, and they're exactly what the agency-validation should gate.

---

## A. Broken ends / dead-ends (a real user can't finish)

| # | Sev | Where | The dead-end |
|---|-----|-------|--------------|
| 1 | **P1** | J5 sign-off · §16/§17/§18 | review fields/notify missing, comments in a dashboard iframe, share UI absent in editor, external-client approve not built → agency starts sign-off, client-side approval is not a reliable end state |
| 2 | **P1** | CMS journey · §10 | records stay `draft`, dynamic pages need `published`; "unreachable via UI alone" → user starts CMS, can't reach the dynamic-page payoff |
| 3 | **P1** | J6 Ship · §22 domains | "live on own domain" not reliable — domain verify flagged broken → can publish, can't complete own-domain outcome |
| 4 | P2 | J2 sites · ia-tree | bulk publish = status flip, not a real deploy (looks outcome-bearing, isn't) |

## B. Gaps (designed but thin / missing)
- **P1** Sign-off states: resend, notify-fail, reviewer identity, explicit approve/reject, resolved queue, audit trail, true read-only client mode.
- **P1** CMS: publish-state controls, generation progress, record validation, repeater/list UI, **9 of 14 field types** missing.
- P2 Forms: submission error/loading/admin states thin; block-config write-path gap.
- P2 Components: no override visibility, reset-to-master, instance-vs-master safety guard.
- P2 State coverage uneven (CMS empty/loading/error); some surfaces degrade to toasts instead of explicit states.
- P2 **Roles too coarse for agency software** — `own·mem·cli` rarely branch in the flows; no owner-vs-teammate-vs-client storyboard on approvals / brand push / publish / domains / forms.
- P2 analytics / redirects / domains drawn as placeholders, not full operational flows.

## C. Extensibility — can we add features cleanly?
**Clean fits (the spine has room):**
- Billing · white-label · workspace policies → **J1 Settings**
- AI page-generator → **J2 New-site / J3 topbar AI** (no rail break)
- Template marketplace → **J2 start-site gallery** (+ J3 My-Templates hook)

**Rigid spots (hard to extend — watch these):**
- `Site` rail slot is **becoming a junk drawer** — A/B testing, redirects, analytics, forms, security, integrations, SEO all want it. Needs sub-structure before it sprawls.
- CMS-under-`Pages → Content` preserves the spine but is the **first place to sprawl** as CMS grows (collections, schemas, bindings, dynamic routes).
- J5/J6 are **split across editor + dashboard + live site** — future approvals / staged publish / client permissions get harder because the workflow boundary is already fractured.

**Loose spots (under-specified — will sprawl without a rule):**
- Shared-theme semantics in the *design* (no preview/diff/rollback/preset drawn) — **NOTE: the backend already has these** (`packages/shared/schemas/theme.ts` D1 dry-run · D2 rollback · D4 presets). So this is the wireframe lagging the code, not a missing capability.
- AI "cross-cutting" has no placement rule beyond "not a rail slot."
- "Site settings" boundary still fuzzy post-dedup.

## D. Top 5 enhancements (codex-ranked)
1. **P1** Complete sign-off: approve/reject, resend, notify status, reviewer identity, audit trail, resolved queue.
2. **P1** Finish CMS publishability: per-record publish state, generation progress, "0 published → no pages generate" guardrail.
3. P2 Shared-brand dry-run/rollback **in the editor/dashboard UI** (backend schemas D1/D2/D4 already exist — wire the UI + draw the states).
4. P2 Role matrix across flows: owner / teammate / client / reviewer / locked-site.
5. P2 Unified async ops/status center: publish · domain-verify · review-send · theme-push · form-delivery failures in one place.

## E. Code spot-check (claims tempered after verification)
- **Shared theme push: REAL + dashboard-homed.** `packages/dashboard/components/theme/theme-manager.tsx` (11KB) + `packages/shared/schemas/theme.ts` (capture/push/lock + **D1 dry-run, D2 rollback, D4 presets**). Design §36 already says "✅ ships in dashboard, not editor" — honest. Tempers the older "wedge unbuildable / zero theme wiring" framing: the wedge is substantially BUILT (backend + dashboard); only the **editor-side** push UI is unwired.
- **Version history "server-backed": UNVERIFIED.** codex claimed it; `useVersionHistory.ts` only wraps `composer.versions` (engine) — persistence layer not provable from the hook. The design's "IndexedDB only → silent data-loss" note is NOT confirmed stale; left as-is. (Don't assert a build-state from a wrapper — `feedback_phantom_bugs_static_analysis`.)

---

## What this means for sequencing
- The 3 P1 dead-ends (J5 / CMS / domains) = **first-class product work**, not appendix polish. They are also the **most validation-sensitive** — J5 sign-off + the brand wedge are exactly what the agency calls test. Build after demand pulls (`agency-validation-plan.html`), not before.
- The only **design-doc** action this audit justifies: enrich §36 to draw the dry-run / rollback / preset states the backend already supports (small, optional).
- Extensibility verdict: spine has room for next-quarter features (billing, AI-gen, marketplace) **if** `Site`, `Pages→Content`, and shared-brand get hard boundaries first.

**Top 3 next (codex):** (1) close J5 end-to-end · (2) CMS reaches payoff · (3) define boundaries for Site / Pages→Content / shared-brand before adding features.
