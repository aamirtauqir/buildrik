# Dashboard Parity + Gap Implementation Plan (REVISED post dual-review)

**Goal:** Bring the real Next.js dashboard (`packages/dashboard/app/dashboard/**`) to parity with the standalone dc skin (`~/Downloads/Buildrik Dashboard (standalone).html`) — layout/spacing/structure + close the *real* gaps — then QA every screen with screenshots. Brand = **Buildrick**. No duplicate screens, no route renames, tsc 0.

**Reviewed by:** Codex (6 findings, P1×4/P2×2) + Claude subagent (C1/C2/H1/H2/H3/M1-5). Both converge. This revision folds in every finding.

---

## What the reviews changed (why this is NOT the first draft)

1. **Scope was wrong (C1 / Codex P1×3).** The three "backend changes" the gap analysis listed are ALREADY built + wired:
   - publish-FAILED terminal UI — `publish-progress.tsx:65` renders it; worker sets `status:FAILED`.
   - reviews admin-gate — `reviews.ts:55` requires ADMIN; `review-queue.tsx:45` renders the exact denied state.
   - solo-mode sidebar — `sidebar.tsx:29` already hides Clients/Reviews/Comments/Shared-theme when `agency_layer` off.
   These are **verify**, not build. The gap analysis diffed design-file-vs-design-file, so it imported non-gaps.

2. **But real defects hide underneath (Codex P1, both voices).** See Phase 2 — the actual work is the retry no-op, the role-unaware attention queue, the incomplete flag story, and the notif model gap.

3. **Accent conflict (C2).** dc skin `--color-primary: rgb(45,109,255)` = cobalt `#2D6DFF` (202 uses) + 2 purple gradients. App + DESIGN.md:28 = **red `#E42313`, "intentional, not drift"**; DESIGN.md bans purple. → **Precedence rule below. Accent is a USER DECISION (see gate).**

4. **Shared seams duplicated (Codex P5).** Site status colors defined 3× (`site-card-full.tsx:8`, `site-list-view.tsx:5`, `site-header.tsx:6`); nav/IA strings hardcoded 2× (`sidebar.tsx:15`, `command-palette.tsx:37`). Editing screens before consolidating = drift by construction → **Phase 0**.

5. **QA method not credible (Codex P6 / H3).** Admin-only procedures, flag-gated surfaces, 2 separate publish-failure backend paths (worker + cron cleanup). One `qa@` owner + screenshots = false positives → **role×flag×state matrix + seeded fixtures**.

---

## Precedence rule (resolves dc-vs-DESIGN.md)

When the dc skin and DESIGN.md disagree, match the dc skin for **layout, spacing, structure, component composition, states**; DESIGN.md governs everything else. Accent decision below overrides DESIGN.md's color rule:
- **GATE DECISION 2026-07-12: FLIP dashboard accent RED → COBALT `#2D6DFF`.** User treats the cobalt dc skin as a deliberate rebrand — unify the last red surface (dashboard chrome: home/sites/settings/billing/team/media) with editor + auth, both already cobalt. Recolor dashboard tokens + hardcoded reds; rewrite DESIGN.md's two-accent section to single cobalt. Auth is already cobalt (reskin 2026-07-10) — don't re-touch. Editor already cobalt — don't touch.
- **Purple gradients still NOT ported** (DESIGN.md bans purple; user did not override).
- Brand spelling: **Buildrick** (user decision 2026-07-11). Reconcile DESIGN.md's 6 stale "Buildrik" refs in Phase 0.

---

## Data-flow rule (unchanged)
Page → tRPC mutation → Router → Service → Prisma. No layer skipping. No duplicate screens. Reuse existing components/routes. **Never rename a route segment** — labels may change to match dc (e.g. Traffic/Submissions/Sharing), routes stay (`analytics`/`feedback`/`access`/`publish`).

---

## Phase 0 — Consolidate shared seams + reconcile brand (do FIRST — Codex P5)
- Extract site-status → color/label SSOT (one map) consumed by `site-card-full`, `site-list-view`, `site-header`. Kill the 3 copies.
- Extract nav/IA SSOT so `sidebar` + `command-palette` read one list (fixes the drift AND the solo-mode leak in 2c).
- Reconcile DESIGN.md brand spelling Buildrik→Buildrick (6 refs); note editor stays cobalt, dashboard accent per gate.
- QA: tsc 0, existing tests green, no visual change intended (pure consolidation).

## Phase 1 — Core-screen layout/spacing parity (highest traffic first)
Screens: Dashboard home, Sites (list + detail 8 tabs), Settings shell, Billing, Media.
- Render app screen (logged-in) vs dc skin on :8899 side-by-side; log each Δ (layout, spacing, typography, copy, states).
- Fix drift by editing the EXISTING component. Match **structure/spacing** to dc; **color/brand per precedence rule** (NOT a recolor).
- QA: screenshot each, 0 console errors, nav intact.

## Phase 2 — The REAL residual defects (re-scoped per both reviewers)
Each item is a verify-then-fix; the verify confirms the shipped surface, the fix closes the hole beneath it.
1. **Publish retry + error surfacing (Codex P1-1, H2).**
   - `publish-progress.tsx:59` Retry only `refetch()`s — make it re-invoke `startPublish` to mint a NEW job from a failed terminal state.
   - Surface `lastPublishError` (already persisted, `schema.prisma:233`) on list/detail (`sites.service.ts:46` → `site-header`/`site-list-view`).
   - "View log": the `log` column holds raw page HTML and `getPublishStatus` deliberately omits it → **replace "View log" with the client-safe `lastPublishError` string**, do NOT expose `log`.
2. **Role-aware home attention queue (Codex P1-2).** `dashboard.service.ts:391` attentionQueue is not role-aware; `page.tsx:178` always renders it; `needs-attention.tsx:28` links any member into admin-only reviews/comments. → gate the queue (and its links) on role + `agency_layer`.
3. **Complete solo-mode (Codex P1-3).** Sidebar already correct — verify. Then: filter `command-palette` agency entries (`m-shared-theme`, `m-reviews`) by `agency_layer`; flag-gate the attention queue; **flag-gate reviews/comments routers** to match theme/clients (`reviews.ts:40`, `comments.ts:29` currently ungated). Result = real solo mode, not just a hidden sidebar.
4. **Notif deleted-resource guard (Codex P1-4, H1).** Model has no `targetType`/`targetId` → can't fix in `notifications` alone. Ship the robust path: per-destination `notFound()` on every notification target (sites + clients already have it; add to comments/reviews/team/billing destinations). Deterministic stale-target metadata (schema add) is a **separate, flagged option** — not assumed.
- QA each: role matrix + wire-verify (flag/permission actually drives it), not just a screenshot.

## Phase 3 — Shared backlog (grep before building — much already exists)
- Empty states: `components/states/*` already ships StateEmpty/DeniedState/ErrorState/LoadingSkeleton and clients/team/client-detail/notifications/domains/comments already consume them (Codex). **Grep each screen first**; only add where genuinely missing (e.g. templates-category).
- Media folder rename/delete (extend `ovFolder` context menu).
- Email-change verification leg (`ovEmail` → pending screen).
- Roles + a11y pass (aria-labels on icon-only controls, focus states, non-color status, AA nav contrast, Designer badge/split/transfer/team-row).
- QA each.

## Phase 4 — Modal + state parity sweep (batched)
- Walk 41 `ov*` modals + ~22 `ds*` states in the dc skin; confirm each has a real app counterpart wired to tRPC; fix drift; add any missing. **Batch into ≤10-modal QA runs** (M4 — one sweep is not QA-able).
- Command palette parity incl. empty/no-results.
- QA: open each modal live via **state-forcing** (seed/flag), screenshot, verify action fires.

## Phase 5 — Business-logic reconciliation + final QA
- Reconcile any dc interaction the backend can't support (flag, don't fake).
- Full nav walk: every screen reachable, no dead links, no dupes, no renamed routes.
- Final screenshot pass; tsc 0; tests green.

---

## QA method (rewritten per Codex P6 / H3 — non-negotiable)
Screenshots alone catch layout, not wiring. Every phase runs against a **matrix**:
- **Role matrix:** seed a 2nd workspace member (non-admin) alongside `qa@buildrik.local` (admin). Verify admin-only surfaces (publish, reviews, comments, theme) deny the member and the home attention queue doesn't link them in.
- **Flag matrix:** toggle `agency_layer` ON/OFF; verify solo vs agency nav, command-palette entries, attention queue, and router gates all track the flag.
- **State-forcing:** seed/mock to reach ds* states (dsQuota, dsPastDue, dsOffline, dsPublishFailed, etc.) — they don't appear on a happy-path login.
- **Seeded failure fixtures:** publish worker-failure AND cron-cleanup are two paths (`publish/[jobId]/route.ts:139`, `cron/publish-job-cleanup:14`) — force both.
- **Wire assertions:** capture console + network per screen; assert the mutation/permission actually fired, not just that pixels match.
- Compare layout against the dc skin render on :8899.

## Guardrails
- **DESIGN.md wins** on tokens/color/brand/type; dc skin wins on layout/spacing/structure only.
- Dashboard accent stays **red** unless the gate flips it. Purple never ported.
- Never create a duplicate screen; never rename a route segment (labels only).
- Consolidate shared seams (Phase 0) BEFORE editing screens.
- tsc 0 + existing tests green each phase. Each phase independently shippable + QA'd.
