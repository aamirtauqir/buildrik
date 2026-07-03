# 0005 — Reverse-wireframe found zero ghosts: the gap is states, not screens

**Date:** 2026-06-22
**Status:** active

## What happened
The learner asked (Roman Urdu) whether we can wireframe the existing app from its real backend functionality, and whether that's a job for `plan-design-review` / `plan-ceo-review`. Taught L12 (reverse-wireframe) + built a reusable inventory template, then ran the inventory against the real code (25 routers, grep of frontend consumers).

## The result
**Zero router-level Ghosts.** All 25 backend routers have a real frontend consumer. The capability the learner suspected was missing — form submissions viewing — turned out fully wired (`SubmissionDrawer` + `listSubmissions` + pagination in `overview-tab.tsx`). The static inventory **corrected a guess**, which is the whole argument for doing it.

## The insight worth keeping
The "half-wired" diagnosis was right but mis-located. The gap is **not missing screens (Ghosts)** — it's **missing states + feedback inside surfaces that already exist (Half)**. Users said "no success/error feedback" and "backend not integrated"; that's a *state-completeness* problem, not a *build-the-screen* problem. So the recovery worklist is state-completion + a few thin agency surfaces (reviews/comments/clients), not a screen-building spree. This validates recovery P1 (feedback layer) as the correct first move.

## Method notes (so we don't repeat the trap)
- **Source-of-truth verdict from code:** does any frontend file consume the router? But static evidence only proves *surface exists*, never *all states present* — Half-vs-Wired needs a **live state-audit**. Ties to the standing lesson "audit-by-file-presence unreliable; live-verify mandatory."
- **Editor uses a different tRPC client** (`createTRPCClient` in `services/api-client.ts` / `AiTrpcClient.ts`, hitting `/api/trpc`) than the dashboard's `trpc.` React symbol. A dashboard-only grep makes editor-owned routers (ai/pages/cms/actions) look like Ghosts. Always grep the editor `client.<router>.` services separately. This was the near-miss that would have produced 4 false Ghosts.

## Correction taught
`plan-design-review` / `plan-ceo-review` pressure-test a *plan that already exists*; they don't generate wireframes. Order: inventory → wireframe gaps → draft plan → **then** the reviews → build.

## Consequences for teaching
- Builds on [[0004-mission-evolved-to-pro-builder]] (user-first/measure) — the inventory is the "measure reality before redesigning" habit applied to the codebase.
- Next teachable move: turn the 6 Half rows into wireframes (reviews + comments first = the agency↔client loop, the differentiator), or run the live state-audit of the 19 Wired rows.
