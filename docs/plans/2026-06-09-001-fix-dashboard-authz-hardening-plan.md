# Fix: Dashboard authorization hardening

- **Date:** 2026-06-09
- **Scope:** `server/` (tRPC routers + services), `packages/dashboard/app` (route handlers + edit page). Editor package largely unaffected.
- **Origin:** Full codex vibe-code audit 2026-06-09 (5.9M tokens). Every Critical/High finding below was independently verified against current code (file:line confirmed).
- **Key enabler:** the role/ownership helpers already exist — `checkSiteRole(prisma, userId, siteId, role)` and `checkWorkspaceRole(prisma, userId, workspaceId, role)` in `server/services/permission.service.ts`, already used correctly throughout `server/trpc/routers/site-detail.ts` and `integrations.ts`. Most fixes apply the existing helper to routes that currently skip it. This is not new infrastructure — it's consistent application.

---

## 1. Verified findings

### Critical

**C1 — Content mutations check membership, not role (VIEWER can edit/destroy).**
`pages.ts` content routes use `guardSite` → `assertSiteAccess` (membership only): `pages.ts:45` (create), `:53` (update), `:61` (delete), `:75` (setTranslation), `:88` (removeTranslation). `sites.ts:230` (saveProject) + `:361` same pattern. The edit page (`app/edit/[siteId]/page.tsx:20`) and `sites.service.ts:736` also gate on membership only. Meanwhile `site-detail.ts` correctly uses `checkSiteRole(..., "EDITOR")` for its mutations. Consequence: a workspace `VIEWER` (or any member) can modify or destroy live site content via these routes. This also widens the stored-XSS blast radius (the sanitize work assumed EDITOR+).
Fix: replace `guardSite`/`assertSiteAccess` with `checkSiteRole(..., "EDITOR")` on every content-mutating route; enforce the same server-side on the edit page loader.

### High

**H1 — Invite token redeemable by the wrong account.** `auth.ts` `acceptInvite`: `tx.workspaceMember.create` (~:253) runs BEFORE the email check (~:269), which only *logs* `inviteEmail !== userEmail` into metadata. Consequence: anyone holding an invite token joins the workspace with a different account. Fix: reject (`throw FORBIDDEN`) when `invite.email !== user.email` before any membership write.

**H2 — Team administration IDOR.** `team.service.ts` `revokeMember(memberId)` (`:33`) and siblings key on `where: { id: memberId }` with no workspace/actor-role scope; router passes raw `memberId`/`inviteId` (`team.ts:57/68`). `changeMemberRole` takes `actorId` but does not verify the actor's role. Consequence: any authenticated member with an ID can demote/suspend/delete/revoke others. Fix: require `ADMIN`/`OWNER` in the router via `checkWorkspaceRole`, and pass `actorId + workspaceId` into the service so it re-checks tenant + role.

**H3 — Account/notification IDOR.** `account.ts` `sessions.revoke(sessionId)` (`:82`) → `revokeSession(input.sessionId)` (no userId); `integrations.remove(id)` (`:177`) → `removeIntegration(input.id)` (no userId); `notifications.markRead(id)` same. Consequence: a guessable/leaked ID lets one user revoke another's session, remove another's integration, or flip another's notification. Fix: scope every such mutation `where: { id, userId: ctx.session.user.id }` (delete/update returns 0 rows for non-owners).

**H4 — "Password protection" is cosmetic.** UI + persistence exist (`settings-tab.tsx:45`, `site-settings.service.ts:32/147`) but no code consumes `verifyPublishedPassword` on the actual published/share render path; `share/[token]/verify-password/route.ts:29/49` verifies once then redirects + sets a cookie, and the client immediately leaves (`share/[token]/page.tsx:19`). Consequence: the product claims content is protected when it isn't. Fix decision required (see §3): either enforce it for real or remove the feature/UI so it doesn't lie.

**H5 — Auth rate-limiting is per-instance only.** `auth.config.ts:9` + `trpc.ts:117` import the in-memory limiter; `rate-limiter.upstash.ts:1` states verbatim it is "NOT WIRED" and the in-memory Map gives `(per-instance-limit × warm-instance-count)` under serverless. Consequence: brute-force / enumeration on `auth.login`/`checkEmail`/`resendVerification` is bypassable by spraying across instances. Fix: wire the Upstash Redis limiter for auth routes (needs `UPSTASH_REDIS_*` env).

### Medium (verified-by-audit, lower priority)

- **M1** AI generation jobs readable/cancellable by bare `jobId` — no authz (`templates.ts:51/59`, `ai-generation.service.ts:58/74`). Scope by `userId`/`workspaceId`.
- **M2** Nondeterministic workspace via `findFirst` (`workspace-ctx.ts:55`, `dashboard.ts:20`, `account.ts:30`, `quota.service.ts:31`). Make active workspace explicit in session/context.
- **M3** Public form submission unvalidated — `submitForm` stores `input.data` raw (`form-submission.service.ts:24/52`); schema is a generic record (`forms.ts:3`). Validate against `formBlock.fields` server-side.
- **M4** `bulkAction("publish")` flips DB state without deploying (`sites.service.ts:497/518`); cleanup cron matches `IN_PROGRESS` but worker uses `BUILDING` (`publish-job-cleanup/route.ts:21` vs `workers/publish/route.ts:75`). Route bulk publish through the real job pipeline; fix cron status.
- **M5** `integrations.vercel.getConnection` leaks tenant metadata to any logged-in user with a `workspaceId` (`integrations.ts:23`) — add `checkWorkspaceRole`.
- **M6** Cron auth `Bearer ${process.env.CRON_SECRET}` — `Bearer undefined` valid if unset (`publish-job-cleanup/route.ts:8`, repeated). Fail closed when secret missing.

---

## 2. Design

The spine is one rule: **every mutation authorizes the actor against the specific resource it touches** — by role for shared resources (sites/workspaces) and by ownership for user-private resources (sessions/integrations/notifications).

| Resource | Mechanism |
|----------|-----------|
| Site content (pages, saveProject) | `checkSiteRole(..., "EDITOR")` |
| Team / workspace admin | `checkWorkspaceRole(..., "ADMIN"\|"OWNER")` + service re-check with `actorId`/`workspaceId` |
| User-private rows (session/integration/notification) | Prisma `where: { id, userId }` (no separate query — the scoped write is the check) |
| Auth endpoints | Redis-backed limiter |

No new abstraction needed for C1–H3: the helpers exist and `site-detail.ts` is the reference pattern.

---

## 3. Task breakdown (priority order — recommendation: A-tier first)

**A1 — C1 role-gate content writes (Critical).**
- `pages.ts` create/update/delete/setTranslation/removeTranslation: `guardSite` → `checkSiteRole(ctx.prisma, ctx.session.user.id, siteId, "EDITOR")`.
- `sites.ts` saveProject (`:230`) + the second write path (`:361`): same.
- Edit page loader (`app/edit/[siteId]/page.tsx`): server-side `checkSiteRole(EDITOR)`; redirect/403 for VIEWER.
- Acceptance: a VIEWER membership is rejected on every content write + the edit page; an EDITOR still works. Add an authz test per route (mock a VIEWER vs EDITOR).

**A2 — H1 invite email match (High).** Reorder `acceptInvite`: check `invite.email !== user.email` → throw FORBIDDEN before the membership write. Test: mismatched email never creates a member.

**A3 — H2 team IDOR (High).** Router: `checkWorkspaceRole(ADMIN)` on changeRole/revoke/suspend/resend/delete. Service: take `actorId + workspaceId`, scope `where: { id, workspaceId }`, re-check actor role + OWNER-protection. Test: non-admin member cannot mutate another member.

**A4 — H3 account/notification IDOR (High).** Scope `revokeSession`/`removeIntegration`/`markRead` by `userId` (`where: { id, userId }`). Test: user A cannot revoke user B's session/integration/notification.

**B1 — H4 password protection (High, decision-gated).** STOP for a decision: (a) enforce — guard the published/share render path, consume the cookie server-side, rate-limit verify; or (b) remove the cosmetic UI + setting until real. Do not leave it lying.

**B2 — H5 Redis rate-limiter (High, env-gated).** Wire `rate-limiter.upstash.ts` into `auth.config.ts` + `trpc.ts` for `login`/`checkEmail`/`resendVerification`. Needs `UPSTASH_REDIS_REST_URL`/`TOKEN`. Fall back to in-memory only in dev.

**C — Medium cluster (M1-M6).** Batch after A/B: AI-job authz, explicit workspace, form validation, bulk-publish pipeline + cron status, getConnection gate, cron-secret fail-closed.

---

## 4. Tests

Per-route authz tests are the regression net (mock session role/ownership, assert reject vs allow). The `server/services/__tests__` harness + the existing `permission.service` are the pattern. Each A/B task ships its failing-first test.

---

## 5. Rollout

- One commit per task, server `tsc` + targeted tests green each step; direct to main (solo).
- Authz changes can lock out legitimate users — run the relevant router tests after each task; a VIEWER-allow regression is the risk to watch.
- B1 (password) is a product decision — do not implement before the user picks enforce-vs-remove.
