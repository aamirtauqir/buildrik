# Buildrik — Full Application Audit

> **Date:** 2026-06-13
> **Method:** 5 parallel specialist agents (security, code-quality, broken-flows/wiring, PRD feature-gap/functional, data-integrity/reliability) reading the live codebase, grounded in `archive/prd/` (reverse-engineered PRD: 79 page specs, 140 tRPC procedures, 33 models). Cross-checked against this session's live-verifies.
> **Scope:** server (services + tRPC routers + REST routes), dashboard (Next.js), editor (Vite engine + chrome), Prisma schema + migrations.
> **Verdict:** Architecture is sound and most core flows are genuinely wired. The debt clusters in 4 places: **(1) prod schema drift** (June features not deployed), **(2) serverless-unsafe state** (in-memory Maps + rate limiter), **(3) hollow end-to-end features** (CMS, redirects-serving, Stripe upgrade), and **(4) layer discipline erosion** (10/19 routers touch Prisma directly). Two cross-tenant IDOR bugs and one unthrottled password gate are the sharpest security issues.

---

## Executive Summary — Severity Counts

| Dimension | P0 | P1 | P2 |
|-----------|----|----|----|
| Security & Privacy | 0 | 3 | 6 |
| Broken Flows & Wiring | 2 | 13 | 5 |
| Feature Gaps & Functional Risk | 0 | 12 | 9 |
| Code Quality (wrappers/dup/spaghetti) | 0 | 5 | 7 |
| Data Integrity & Reliability | 0 | 8 | 4 |

**No live-incident P0s today** — prod has 2 users and is months behind, so most risks are dormant. They become real the moment users arrive. Two P0 broken-flow bugs (onboarding loop, fake AI progress) are user-visible now.

**Top 10 fix-first (by blast radius × likelihood-on-real-traffic):**
1. Prod schema drift — baseline + `migrate deploy` (every June feature's table/index absent live).
2. `IN_PROGRESS` vs `BUILDING` status mismatch bricks publishing permanently after any mid-build worker crash.
3. Uploads broken on serverless — `pendingUploads` in-memory Map → 404 on valid uploads.
4. Two cross-tenant IDOR — `generate.status`/`generate.cancel` (any user reads/cancels any workspace's AI job).
5. Share-link password gate: no brute-force throttle **and** cosmetic (cookie enforced by nothing).
6. Public form endpoint: no body validation, no spam protection, CSV formula injection.
7. Storage + per-plan upload-size quotas never enforced → cost blowout.
8. Onboarding completion flag never set → users stuck in re-onboarding loop (P0).
9. AI-generate progress is fake theater + cancel dead during build + stuck-QUEUED no recovery.
10. Stripe upgrade is a placeholder DB write — if key ever set, any user self-grants paid plan free.

---

## 1. Security & Privacy

Strong overall: `protectedProcedure` denies bearer by default, `scopedProcedure` enforces token scopes fail-closed, auth endpoints rate-limited, tokens/passwords hashed, OAuth state HMAC-verified, SSRF guard + Vercel AES-256-GCM still hold. No `$queryRawUnsafe`, no module-level SDK clients, no PII in logs. Real gaps:

### P1
- **Cross-tenant IDOR — AI job status** — `server/trpc/routers/templates.ts:51-57` → `ai-generation.service.ts:79-92` — `generate.status` passes client `jobId` to a bare `findUnique({where:{id}})`, no workspace scoping. Any authed user polls any tenant's job (`status/progress/steps/siteId/error`). Fix: assert `job.siteId`/`workspaceId` access first.
- **Cross-tenant IDOR — AI job cancel (tenant DoS)** — `templates.ts:59-61` → `ai-generation.service.ts:95-114` — `generate.cancel` cancels any workspace's in-flight build, no ownership check. Fix: gate on job's site/workspace before `update`.
- **Share-link password gate: no brute-force protection** — `app/api/share/[token]/verify-password/route.ts:40-45` — `bcrypt.compare` with zero rate limiting; token is meant to circulate, so unlimited guesses bypass the gate. Fix: `checkRateLimit(\`share-verify:${token}:${ip}\`, 5, 60_000)` + 429.

### P2
- **`integrations.getConnection` missing membership check** — `routers/integrations.ts:23-37` — takes client `workspaceId`, no `checkWorkspaceRole`; leaks Vercel connection status + `teamId` + `vercelUserId` (not the token). Fix: `checkWorkspaceRole(..., "MEMBER")`.
- **`confirmUpload` not bound to uploader** — `upload.service.ts:66-72` — stores `userId` but ignores it; another user's pending `fileId` could be confirmed. Low (UUID + 10min TTL). Fix: pass + check `ctx.session.user.id`.
- **Stripe webhook lacks timestamp tolerance (replay)** — `app/api/webhooks/stripe/route.ts:10-25` — HMAC verified but `t=` never compared to now; captured body replays forever. Fix: reject if `|now - t| > 5min`.
- **In-memory rate limiter doesn't survive scale-out** — `server/services/rate-limiter.ts` — per-process Map → real limit becomes `N×configured` on serverless. `rate-limiter.upstash.ts` exists but is a dead shim. Fix: wire a shared store for security-sensitive limits.
- **2FA secret keyed off `NEXTAUTH_SECRET` not `ENCRYPTION_KEY`** — `auth.service.ts:22-23` — rotating the session secret silently breaks all stored 2FA secrets. Fix: use `@/lib/encryption`.
- **Predictable workspace-slug suffix** — `auth.service.ts:65` — `Math.random().toString(36)`. Fix: `randomBytes(3).toString("hex")`.

**Awareness (not a defect):** AI `content/page/layout/summarize` in `ai.ts` call providers with no `reserveQuota` (unlike `streamPrompt`) — cost/abuse exposure.

---

## 2. Broken Flows & Wiring Gaps

10 core flows traced Page → tRPC → service:

| # | Flow | Status | Evidence |
|---|------|--------|----------|
| 1 | Signup / Login | **WIRED** | `app/auth/page.tsx` → `auth.checkEmail/login/signup` → `auth.service` (rate-limited) |
| 2 | Create site | **WIRED** | `sites/page.tsx` → `sites.create` |
| 3 | Open editor | **WIRED** | `BuildrikSyncProvider.loadProject` → `sites.get`+`pages.list` |
| 4 | Publish site | **WIRED** | `publish/page.tsx` → `prePublishChecks`+`publish` → poll/cancel |
| 5 | Invite team | **PARTIAL** | invite real; **"Change Role" UI is a dead no-op** (backend exists) |
| 6 | Billing upgrade | **PARTIAL (honest gate)** | real `PAYMENTS_NOT_CONFIGURED` throw, no fake success; cancel-flow unreachable |
| 7 | Media upload | **PARTIAL** | transport real; 3/4 dashboard surfaces drop the URL |
| 8 | AI generate | **WIRED (real bugs)** | `templates.generate.*` → worker → OpenAI; progress is fake theater |
| 9 | Settings save | **WIRED (most)** | per-tab mutations real; avatar + workspace-icon broken |
| 10 | Help ticket | **WIRED (data-empty)** | persists; no articles seeded, fake "Ticket #0" |

### P0
- **Onboarding completion flag never set → re-onboarding loop** — `onboarding.service.ts:39-43` — `setupProject` leaves `completed:false`; nothing advances it. `/onboarding` re-routes to setup forever. Fix: set `completed:true` on site-create success.
- **AI-generate progress checklist is fake theater** — `app/api/workers/ai-generate/[jobId]/route.ts:76,121` vs `ai-wizard/generation-progress.tsx:7-17` — worker writes only `BUILDING`→`COMPLETED`; UI expects `GENERATING_STRUCTURE/CONTENT/STYLES` (never written) → all steps flip done at once. Fix: write the `GENERATING_*` statuses as the worker advances.

### P1 (visible fake/dead features)
- **"Change Role" team action silent dead end** — `team/member-actions.tsx:54` + `team/page.tsx:78-90` — dispatches `changeRole`, switch only handles revoke/delete; backend works. Fix: render role picker calling `onChangeRole`.
- **Profile photo upload/remove dead** — `settings/profile-form.tsx:120-137` — local `createObjectURL` blob only; no `onAvatarUpload` passed, no avatar field in schema. Vanishes on reload.
- **Workspace icon persists ephemeral blob URL** — `settings/workspace-form.tsx:108-113` — `blob:http://localhost…` written raw to DB. Fix: route through real upload.
- **SEO og:image dropped on save** — `site-detail/seo-tab.tsx:176-183` — uploads, but "Save SEO" omits `ogImage` (backend accepts it). Fix: include `ogImage`.
- **Favicon uploaded to Blob, no persistence target** — `site-detail/settings-tab.tsx:81-88` — no `favicon` column. Fix: add column or remove uploader.
- **Help search & categories always empty** — `prisma/seed.ts` — `HelpArticle` table never seeded; search + 6 tiles + `[slug]` pages all empty. Fix: seed articles.
- **Help ticket fake "Ticket #0" + wrong SLA** — `help/ticket-form.tsx:46-53` + `help.service.ts:56-67` — `SupportTicket` model has no `ticketNumber`/`plan`. Fix: add column, return real plan.
- **Notification "Mute type"/"Delete" menu dead** — `notifications/notification-item.tsx:110-127` — no caller passes handlers, no procedures exist. Fix: wire or remove.
- **Notification preferences saved but never enforced** — `notification.trigger.ts:20-37` — `createNotification` inserts unconditionally; toggles have zero effect. Fix: check pref, skip insert/email.
- **AI-generate cancel silently fails during build** — `ai-generation.service.ts:104` — cancel rejected while `BUILDING`; no `onError`. Fix: add `BUILDING` to cancellable + onError toast.
- **AI credits-exhausted UX dead + raw 500** — `sites/new/page.tsx:253-269` — modal props never passed; `AI_MONTHLY_LIMIT` unmapped → raw 500. Fix: map error + wire props.
- **Onboarding checklist click completes ALL onboarding** — `onboarding/dashboard-checklist.tsx:103-106` — unknown task IDs → `nextStep` returns `COMPLETED`. Fix: per-task path on real events.
- **Dead backend — orphaned tRPC procedures (no caller):** `sites.saveProjectData/getProjectData`, `sites.unarchive/unpublish`, entire `apiTokens` router (full CRUD, zero UI), `media.listAssetVersions/createAssetVersion/restoreAssetVersion`, `onboarding.completeTourStep/completeTour`, `ai.getQuotaStatus`. Fix: wire intended UI or delete (no dead code per CLAUDE.md).

### P2
- Workspace accent-color default `"var(--color-primary)"` fails its own hex Zod validation (`workspace-form.tsx:84-85`).
- Stuck-QUEUED AI job spins forever if `NEXT_PUBLIC_APP_URL` unset (`ai-generation.service.ts:61`).
- `pendingUploads` in-memory Map → 404 on serverless (`upload.service.ts:17`).
- CancelModal + payment-method "Update" unreachable (intentional, pending Stripe).
- Support ticket never emailed/acknowledged despite SLA promise (`help.service.ts:56`).

---

## 3. Feature Gaps & Functional Risk

### Missing / Stubbed vs PRD
- **CMS / Collections — UI exists, backend does NOT.** Editor ships `CMSCollectionSetupModal`, `CMSRecordsModal`, `BindingPopover`, but **no Prisma model, no router/service**. Configurable in-canvas, nowhere to persist or render at publish. **P1.**
- **URL Redirects — stored but never served.** Full CRUD + CSV + quota counting, but **zero consumers** emit them to HTTP/deploy config. User spends quota; no redirect ever fires. **P1.**
- **Stripe upgrade — placeholder DB write.** No Stripe SDK; `upgradePlan` gates on key *presence* then writes `placeholder_…` IDs and flips plan. If key set in prod, any user self-grants paid free. **P1.**
- **Data export — stub.** `ExportJob` PENDING row, no worker. **P2.**
- **Bandwidth/storage metering — hardcoded 0** (`billing.service.ts:40-41`). **P2.**
- **Analytics partly fabricated** — `uniqueVisitors`=distinct-session, `avgSession`=hardcoded 0. **P2.**
- *(REAL, not stubs: AI generation, template.use, domain.connect, account-deletion + billing-downgrade crons. Multi-language, responsive breakpoints, in-session undo/redo — all real, NOT gaps.)*

### Competitive Gaps (vs Webflow/Framer/Wix)
- **Form spam protection (CAPTCHA/Turnstile)** — absent; only honeypot + spoofable in-memory IP limit. Every published form will get bot-flooded.
- **Form webhooks / Zapier on submit** — absent; agencies can't route leads to CRM.
- **Server-side form field validation** — absent; public endpoint never `.parse()`s the schema → DoS + bad data.
- **Real version history / restore** — engine has client-side timeline, no server model; can't roll back after closing editor.
- **A/B testing** — absent.
- **Page/element-level custom code** — site-level only.
- **Real-time collaboration** — poll-based, last-write-wins, no server OT (demo-only; 6 P1s — see `project_collab_codex_review_20260612`).

### Functional Risk
- **Uploads broken on serverless** — `pendingUploads` Map → presign/PUT hit different lambdas → 404 on valid uploads. **P1.**
- **Storage quota never enforced** — unlimited uploads → cost blowout. **P1.**
- **Per-plan upload size never enforced** — FREE user uploads 50MB despite 10MB cap; presign size check is a dead no-op. **P1.**
- **Public form endpoint — no body validation** — raw `req.json()` → unbounded payload to JSON column. **P1.**
- **CSV formula injection** — forms + redirects export attacker values verbatim; `=cmd|…` executes in Excel. **P1.**
- **`importRedirects` no validation** — naive split, bypasses schema, NOT NULL crash mid-batch. **P1.**
- **AI cancel dead during build + overwritten by COMPLETED** — cancelled job still creates site + consumes quota. **P1.**
- **AI stuck-QUEUED no recovery** — fire-and-forget dispatch, no re-dispatch cron. **P1.**
- **2FA disable without verification for OAuth-only users** — `account.service.ts:262` only checks password if one exists. **P1.**
- **Plan downgrade doesn't reconcile over-cap resources** — flips `plan:FREE`, never prunes excess sites/pages/domains. **P1.**
- **Stripe `charge.failed` not idempotent** — no `event.id` dedupe → duplicate notification spam on retry. **P1/P2.**
- **Share-link password gate cosmetic** — returns public Vercel URL, `share_<token>` cookie enforced by nothing. **P2.**
- **Domain connect swallows Vercel errors** — `catch {}`, orphan PENDING row, `removeDomain` never detaches from Vercel. **P2.**
- **Plan-limit boundary TOCTOU** — count-then-create without transaction across createSite/duplicateSite/useTemplate/invite. **P2.**
- **`duplicateSite` unbounded + lossy** — loads all pages into memory, drops meta/settings/slugHistory/FormBlock. **P2.**

---

## 4. Code Quality — Wrappers, Duplication, Spaghetti

### Layer violations (dominant debt)
- **10/19 routers touch Prisma directly** — `routers/{api-tokens,account,sites,site-detail,team,dashboard,billing,forms,auth,integrations}.ts` run `prisma.*`/`$transaction` directly. CLAUDE.md: routers call services, never Prisma. Systemic. **P1.**
- **`integrations.ts` fully bypasses its service** — inlines `workspaceIntegration` upsert/delete + `encrypt/decrypt` + `auditLog.create` though `integrations.service.ts` (159 LOC) exists. **P1.**
- Page→service edge `edit/[siteId]/page.tsx:3,20` (server-side auth gate — borderline acceptable). API-route→service is legitimate (controllers). Components→service: **clean, none**. Engine→editor: only tests.

### Middle-man / dead files
- **`rate-limiter.upstash.ts`** — 78 lines commented-out + 1 live re-export, no real importer. Violates no-commented-code + no-middle-man. **P1.** Fix: delete.

### God files
- **`ai.service.ts` — 1415 LOC**, 3+ domains (generation + OpenAIProvider + edit-command parsing + plan gen). **P1.** Fix: extract `openai.client.ts` + `ai-edit-commands.service.ts`.
- **`overview-tab.tsx` — 644 LOC**, 5 sections. **P2.**

### Duplication
- `guardSite` verbatim in `forms.ts:14` + `pages.ts:25` (**P2**); `timeAgo()` ×4; `formatDate()` ×6; initials/avatar ×3; inline id-gen in engine ×2 (should use canonical `generateId`). **P2.**

### Hidden side effects
- **Module-level `setInterval` in `rate-limiter.ts:4-9`** — fires at import, never cleared. **P1.**
- Module-level provider singletons (anthropic/ollama/openai) — mitigated (SDK clients lazy-init), flag for consistency. **P2.**

---

## 5. Data Integrity & Reliability

### Migration safety
- **Prod schema drift — June migrations never applied** — `ai_adoption_events`, `publish_job_active_unique`, `collab_operations`, `action_confirmations` absent live; `_prisma_migrations` table missing in prod. Any code touching these throws `42P01` or silently loses race-protection (the active-job unique guard is **advisory-only in prod**). **P1.** Fix: `prisma migrate resolve --applied` baseline → `migrate deploy`; verify the partial index exists.
- **`workspace_integrations_unique` adds UNIQUE with no dedupe** — aborts mid-run (`23505`) if dupes exist. **P2.** Fix: prepend ROW_NUMBER dedupe.
- NOT NULL adds all carry DEFAULT — safe.

### Transaction boundaries
- **Publish FAILED path not transactional** — job→FAILED then separate site.update; crash between → site stuck `PUBLISHING` forever. **P1.**
- **AI-generate worker writes Site + N Pages with no transaction** — crash mid-loop → orphan half-built site, re-run creates a second. **P1.**
- Publish COMPLETED/CANCELLED transitions ARE transactional — holds.

### Concurrency
- `reserveQuota` + action-confirmation single-use consume — both atomic, hold.
- **`recordUsage` double-counts vs `reserveQuota`** — unguarded upsert-increment alongside the atomic path; appears unused. **P1.** Fix: confirm dead + delete.

### Performance
- `runPrePublishChecks` JSON-equality scan on `blocks` (**P2**); AI-generate slug loop up to 50 sequential queries (**P2**). Index coverage on hot paths otherwise sound.

### Worker reliability
- **`IN_PROGRESS` vs `BUILDING` status mismatch** — cleanup cron reaps `IN_PROGRESS`, but worker writes `BUILDING`; that cron branch is **dead**. Crashed mid-build job never reaped + no-time-cutoff precheck → **publishing permanently bricked for that site**. **P1.** Fix: reap `{in:["BUILDING","DEPLOYING"]}` + stale-cutoff in `startPublish`.
- **Orphaned AI-generation jobs never cleaned/retried** — no cron for `ai_generation_jobs`. **P1.** Fix: add re-dispatch/fail cron.
- **`action_confirmations` + `collab_operations` no retention cron + no Site FK** — unbounded growth; orphan rows survive site delete (cascade can't fire). **P1/P2.** Fix: prune crons + `siteId` FK `onDelete:Cascade`.
- Publish SSE no max-lifetime → DB-query leak on stranded job. **P2.**

### Error handling
- **Activity/audit logs swallow all failures silently** — `try{}catch{}` empty; publish `recordActivity` outside its transaction → publish succeeds while activity row silently fails; security events (`LOGIN_FAILED`, `2FA_LOCKED`) can vanish. **P1.** Fix: `console.error` the swallow + fallback sink for compliance events.
- Collab poll `catch {}` hides persistent DB failure → silent dead stream. **P2.**

---

## Prioritized Remediation Roadmap

**Phase 0 — before any real users (infra correctness):**
1. Baseline + deploy prod migrations (drift fix).
2. Fix `IN_PROGRESS`/`BUILDING` cleanup mismatch + stale-`BUILDING` cutoff.
3. Move `pendingUploads` + rate limiter to a shared store (Postgres/Upstash).

**Phase 1 — security + data-loss (before marketing):**
4. Two AI-job IDOR fixes + share-password throttle + share-cookie enforcement.
5. Public form endpoint: Zod `.parse()` + size cap + CSV-injection escape + CAPTCHA.
6. Storage + per-plan upload-size quota enforcement.
7. Wrap AI-generate Site+Pages and publish-FAILED in transactions.
8. Gate `upgradePlan` behind real Stripe (or hard-disable) so key-set can't self-grant.

**Phase 2 — honesty pass (kill fake UI):**
9. Onboarding completion flag (P0) + real AI progress statuses (P0).
10. Fix or hide: avatar/icon/og:image/favicon uploads, Change-Role, notification menu, help seed + ticket number, notification-pref enforcement.
11. Delete or wire orphaned procedures (apiTokens router, asset-versions, etc.).

**Phase 3 — feature completeness (when scoped):**
12. CMS backend, redirect serving layer, version restore, form webhooks.

**Phase 4 — code hygiene (continuous):**
13. Drain routers-touching-Prisma to services; split `ai.service.ts`; delete `rate-limiter.upstash.ts` + `recordUsage`; extract shared utils (timeAgo/formatDate/guardSite); fix module-level `setInterval`.

---

## Cross-reference (this session's live-verifies)
- **Collaboration:** demo-only, 6 P1 distributed-systems bugs — `project_collab_codex_review_20260612`. Do not ship multiplayer.
- **AI propose-action publish:** live-verified working — `project_propose_action_liveverify_20260612`.
- **Publish password-protection 404 bug:** fixed `5c9286b2`.
- **Prod state:** 2 users, zero AI adoption events, schema months behind — none of the above is live-incident-causing *today*, but uploads, forms, and billing-downgrade fail first when real users arrive.
