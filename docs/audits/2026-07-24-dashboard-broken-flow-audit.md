# Dashboard Broken-Flow Audit — 2026-07-24

Functional bug / broken-flow / dead-end sweep across the whole dashboard (design + AI-onboarding were covered separately this session). Four code-traced domain audits (billing, team, site-detail tabs, cross-cutting) plus a live walk of billing / plans / team / domains. **Report only — nothing changed.**

Severity: **Critical** = security, data loss, money, or a hard dead end a real user hits. **Major** = wrong result / dead-end / missing-state a user hits. **Minor** = cosmetic / edge / disclosed.

---

## RESOLUTION — 2026-07-25 (fixed + deployed BUILD `rA1jJR6QsjJvGlQIVryy0`)

All actionable findings fixed, typechecked (0 errors), tested (95 passing across 9 touched suites), and deployed to prod. Commits `3f1e0b22` (security) → `1185c685` (minors).

**Critical — all fixed** (except CR5, founder-gated):
- CR1/CR1b ✅ per-site scoping now enforced in `permission.service` (+6 regression tests); empty "specific sites" rejected.
- CR2 ✅ unpublish deletes the Vercel deployment (`deleteVercelDeployment`, best-effort).
- CR3 ✅ AI daily-prompt quota surfaced alongside monthly generations.
- CR4 ✅ today's analytics folded from live events; tab shows any populated dataset.
- CR5 ⛔ Stripe live checkout — **founder-gated** (needs live Products/prices + secrets), not code.
- CR6 ✅ team read queries ADMIN-gated; non-admins get a clean denied state.

**Major — all fixed** (except two, noted):
- MJ2 ✅ Plans CTAs wired · MJ3 ✅ chart retitled · MJ4 ✅ usage shows real quota drivers · MJ5 ✅ dunning "Update payment method" · MJ6 ✅ grandfathered portal message · MJ7 ✅ reactivate · MJ8 ✅ self-strand guards · MJ10 ✅ login returnUrl · MJ11 ✅ favicon upload guard · MJ12 ✅ redirect edit · MJ13 ✅ domain error messages · MJ14 ✅ (folded into CR4) · MJ15 ✅ real checklist completion · MJ16 ✅ api-tokens error state.
- MJ1 ⛔ "$79/yr" was **bad Northwind demo-seed data**, not a product bug (Stripe stores a yearly price's `unit_amount` as the annual total → real yearly plans render correctly).
- MJ9 ⏭️ edit a member's per-site access after invite — a **missing feature**, not a bug; deferred.

**Minor — real code ones fixed:** primary-domain-must-be-VERIFIED guard, removed the dead/hazardous `billing.switchInterval`, team "seats" now shows members / plan capacity.
**Minor — deferred (not code bugs):** Learn placeholder videos (content), bandwidth/build/avgSession/country (unmetered infra), `LimitReached`/`switchInterval` dead-code (removed the latter), marketplace install non-admin hide + no-op (server-enforced / disclosed), SEO preview host, DESIGNER type casts, FREE `currentPeriodEnd` placeholder, LAST_ADMIN dead guard.

---

## CRITICAL

### CR1 — "Invite to specific sites" is not enforced; every member can reach every site  · SECURITY
`server/services/permission.service.ts:42-46` (`assertSiteAccess`) checks only that the user is an ACTIVE member of the site's **workspace** — it never consults `sitePermission`. `checkSiteRole:62-71` treats `sitePermission` as an additive role **override**, falling back to `member.role` for any site with no row. So a teammate invited to "Specific sites: [A]" can still edit sites B, C, D. The entire "specific sites" invite option (invite-modal `accessMode="specific"`, the "X of Y sites" in the member card) is cosmetic. **Confirmed by direct read of the permission layer.** For an agency with per-client teammates this is a real cross-client exposure.
- **CR1b** (`server/trpc/routers/auth.ts:296`): picking "Specific sites" but selecting none sends `siteIds: []` → no `sitePermission` rows created → unrestricted access. Intent inverts.

### CR2 — Unpublish leaves the site publicly live  · DATA/TRUST
`server/services/publish.service.ts:453-458` (`unpublishSite`) only does `prisma.site.update({ status:"DRAFT", publishedUrl:null })`. It never tells Vercel to remove/disable the deployment (contrast `domain.service.ts:117-141`, which does detach). The toast says "Site unpublished" and the badge flips to Draft, but the Vercel deployment and any custom domain stay live and crawlable. A user who unpublishes to take a site down is lied to.

### CR3 — AI credits shown ≠ AI limit that actually blocks you
Displayed (`server/services/account.service.ts:405-416`, settings/ai + billing bars): **monthly** `AIGenerationJob` vs `aiGenerations` (FREE=3). Enforced (`server/services/quota.service.ts:58-100`, via `ai.ts:33/298/383`): **daily** `aIUsage` rows vs `aiPromptsPerDay` (FREE=10). Two different tables, two different limits. A user sees "2 / 3 this month," then gets blocked by "Daily AI limit reached (10)" — a number shown in no UI. In-editor prompts increment `aIUsage`, so the visible counter can sit still while the user is throttled.

### CR4 — "Today" analytics is always empty, even with live traffic
`app/api/cron/analytics-aggregate/route.ts:24-29` rolls up only **yesterday's** events into a `siteAnalytics` row dated yesterday; `analytics.service.ts:109-112` builds `timeSeries` only from `siteAnalytics`; `analytics-tab.tsx:53` gates the whole tab on `timeSeries.length === 0`. So range=Today never has a row → "No analytics data yet" despite real page-views. (Related M: the same gate also hides live source/country/device data that comes from a different, populated table.)

### CR5 — Checkout is a dead end in production (Stripe live not configured)  · known/founder-gated
`billing.service.ts:204/215` throws `PAYMENTS_NOT_CONFIGURED` / `STRIPE_PRICE_NOT_CONFIGURED` (the 6 `STRIPE_*` live vars are the standing RED env:check). Billing → Upgrade → toast "Payments are not available yet." No path to a paid plan. This one is founder-gated (create live Products/prices), but from the user's seat it's a hard dead end with a vague message.

### CR6 — Team roster + pending-invite emails readable by any member  · SECURITY (info disclosure)
`server/trpc/routers/team.ts` `stats`(50) / `list`(54) / `pendingInvites`(138) / `activity`(150) use `getWorkspaceCtx` only — **no `requireAdmin`** (unlike auditLog/invite/changeRole). Any VIEWER/EDITOR can read every member's name+email+last-active and all pending-invite email addresses.

---

## MAJOR

**Money / plans**
- **MJ1 — Billing shows "$79/yr" for Business** (live-verified): the monthly price ($79) rendered with a `/yr` suffix (`components/billing/plan-card.tsx:30`); yearly Business is $63/mo. Price/interval mismatch on the current-plan card.
- **MJ2 — Plans page CTAs drop the selection** (`app/dashboard/settings/plans/page.tsx:251-271`): every Upgrade/Downgrade is just a `<Link>` to Billing; the chosen plan is discarded and no checkout is triggered.
- **MJ3 — Usage page plots form-submissions under a "Bandwidth" title** (`settings/usage/page.tsx:54-64`, `usage.service.ts:62`).
- **MJ4 — Usage page shows fake zeros + omits AI/sites/team** (`settings/usage/page.tsx:48-52`): two of four tiles are permanently 0; the page titled "Usage & AI credits" shows no AI credits.
- **MJ5 — Dunning has no clear "update payment" action** (`dunning-banner.tsx:54` → billing, where the portal is behind a conditionally-rendered card + a button mislabeled "Change plan").
- **MJ6 — Grandfathered/imported paid workspaces hit a portal dead end** (`billing.service.ts:242-246` → "upgrade a plan first" while already paid).

**Team / access**
- **MJ7 — Revoke Access is a one-way door** (`team.service.ts:159-174`): no reactivate/unsuspend mutation exists; only recovery is Remove + re-invite (which drops the member's site permissions).
- **MJ8 — An ADMIN can strand themselves** (`member-actions.tsx:48` disables only self-delete): self Revoke/Change-Role are enabled; revoke kills own sessions → instant lockout with no self-recovery.
- **MJ9 — No UI to view/edit a member's per-site access after invite** (only settable at invite time; the site-detail "Access" tab is public share-links, not member access).
- **MJ10 — `/auth/login` drops `returnUrl`/`next`** (`app/auth/login/page.tsx`): logged-out transfer-accept (`transfer/accept/page.tsx:29`) and editor deep-links (`edit/[siteId]/page.tsx:17`) don't return the user to their destination after login.

**Site detail**
- **MJ11 — Favicon/touch-icon upload silently fails and persists a base64 data URL** (`settings-tab.tsx:75-111`): no try/catch, preview + saved value both fall back to the FileReader data URL; on a failed Blob PUT (or Save-before-upload race) a giant data URI is written to `favicon` (schema has no `.url()`).
- **MJ12 — Redirect edit is impossible from the UI** (`redirects-tab.tsx` has only Add/Delete; `updateRedirect` built but never wired).
- **MJ13 — `DOMAIN_LIMIT`/`SITE_NOT_FOUND` surface as raw error codes** on domain connect (`site-detail.ts:231-235` only translates `DOMAIN_IN_USE`).
- **MJ14 — Analytics hides live source/country/device data** behind the timeSeries empty gate (see CR4).

**Cross-cutting**
- **MJ15 — Getting-started checklist can't be completed by doing the real thing** (`getting-started/page.tsx:34-35`): `team` + `publish` steps only flip via the self-attest floating widget; actually inviting/publishing never calls `completeDashboardTask`, so a real user is stuck at "3 of 5" forever.
- **MJ16 — API-tokens page infinite skeleton on workspace-query error** (`settings/api-tokens/page.tsx:10`): no error/retry state (sibling settings/ai handles it).

---

## MINOR (grouped)

- **Domains:** a PENDING/unverified domain can be set Primary with no effect at publish + no explanation (`domains-tab.tsx:130`); live-walk showed a `failed` domain with no visible retry.
- **Team seats (live-walk):** "4 / 4 seats" shown on Business (25-member plan) — seat display looks wrong. Plus: `acceptInvite` bypasses the seat limit (`auth.ts:292`); suspended members still consume seats; `LAST_ADMIN` guard is effectively dead (owner is always a 2nd admin); DESIGNER role dropped by type casts.
- **Marketplace:** "Install" is a disclosed no-op; Install button shown to non-admins (always errors); Search-Console/Analytics-Pro CTAs point at Integrations where they don't exist.
- **Billing:** `switchInterval` is a live raw-SQL, layer-violating, un-repriced endpoint (UI hides it); `LimitReached` upgrade card is dead code; failed overview silently defaults to FREE; FREE `currentPeriodEnd` is "today" (placeholder).
- **SEO:** no error state on the technical-SEO section (a save can overwrite with defaults); SERP/social previews hardcode `yoursite.com`.
- **Analytics:** country is `x-vercel-ip-country` only (always "unknown" off-Vercel); `avgSession` hardcoded to 0.
- **Learn:** every lesson plays the same placeholder video (content gap).
- **Workspace:** "Transfer ownership" form shown to non-owners (fails FORBIDDEN); pending-transfer email readable by any member.
- **Pending invites:** resend/revoke never disable → double-fire.

---

## What's solid (do not re-flag)

Stripe webhook idempotency + signature/replay + payload-shape fixes; `reserveQuota` race-safety; cancel/reactivate flow + invoice table states; domain DNS verification loop (connect → Vercel records → 30s poll → dns-verify cron → VERIFIED); redirects add/delete/import/export; submissions view/filter/paginate/export; publish-tab phases; notifications mark-read/delete/mute; account password/email/2FA/session-revoke; danger-zone delete/export with guards; API-token create/revoke; Vercel connect/disconnect; help search/article/ticket. Team IDOR guards (target re-scoped to actor's workspace) and owner protection are correct — which is what makes the ungated team **read** queries (CR6) the outlier.

---

## Fix-first shortlist

1. **CR1/CR1b** — enforce `sitePermission` as a restriction in `assertSiteAccess` (security).
2. **CR6** — `requireAdmin` on team read queries (security).
3. **CR2** — unpublish must detach the Vercel deployment.
4. **CR3** — reconcile the two AI-quota systems / surface the enforced one.
5. **MJ1 / MJ3 / MJ4** — the billing+usage display bugs (cheap, money-facing, fully in code).
6. **MJ11** — favicon upload guard (silently writes junk to published sites).

_Report only. Companion to the 2026-07-22 functional audit + the 2026-07-24 design audit._
