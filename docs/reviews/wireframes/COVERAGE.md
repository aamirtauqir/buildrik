# Wireframe coverage matrix — app feature parity (started 2026-06-15)

Goal: every real app feature/surface has a wireframe. Source = live inventory of editor + dashboard + server (tRPC 120+ procedures, 55 Prisma models, 60+ routes). ✅ have · 🔨 building · ⬜ gap.

## Auth (real: ~30 routes — wireframes had only 00-signin)
- ✅ sign-in (magic-link / password / 2fa stub) — 00
- 🔨 sign-up (name+password+strength) — A1
- 🔨 verify-email + check-inbox + resend — A2
- 🔨 forgot / reset / password-changed — A3
- 🔨 2FA entry + backup codes + OTP — A4
- 🔨 invite-accept (workspace) — A5
- 🔨 workspace-select (multi-ws) — A6
- 🔨 transfer-accept (ownership) — A7
- 🔨 auth error states (expired-link/invite-expired/session/2fa-locked/locked/rate-limited/access-denied/suspicious/captcha/disabled/social) — A8 (one toggle screen)
- 🔨 OAuth callback / splash / success / redirect — folded into A2/A8

## Account & personal settings (real: /dashboard/settings/*)
- 🔨 account — email change, password change/set, connected OAuth — B1
- 🔨 security — sessions list + revoke, 2FA enable/QR/backup — B2
- 🔨 notifications prefs (per-category in-app/email/digest) — B3
- 🔨 AI credits (usage + history + quota) — B4
- 🔨 danger zone — export data, delete account (30-day grace) — B5
- 🔨 profile (name/avatar/bio/lang/tz) — B6

## Team & workspace (real: /dashboard/team, /settings/workspace)
- 🔨 team management — members table, role change, suspend/remove, pending invites, activity — C1
- 🔨 invite modal (emails, role, site-scope, message) — C1 (sub)
- ✅ workspace settings + transfer + delete — 18 (extend)
- 🔨 notifications inbox (/dashboard/notifications, SSE) — C2
- 🔨 help center + article + support ticket — C3
- 🔨 integrations (Vercel OAuth + generic webhooks: GA/Mailchimp/Zapier/Slack) — C4
- 🔨 API tokens (create once / scopes / revoke) — C5

## Site management depth (real: /dashboard/sites + [id]/*)
- ✅ sites list (basic) — 11; 🔨 extend: folders, bulk-action bar, advanced filters, grid/list — D1
- 🔨 forms — form blocks list + submissions inbox + drawer + export — D2
- 🔨 redirects — list/create/import-csv/export (was only a tile in 14) — D3
- 🔨 share/access management (owner side: create link, password, expiry, revoke, viewcount) — D4
- ✅ site SEO — folded in 50/14; 🔨 dedicated per-site SEO — D5
- ✅ site detail / settings / domains / analytics / billing / dashboard-media — 12/14/15/19/16/17

## Editor depth (real engine + sidebar)
- 🔨 interactions / animation panel (triggers, timeline) — E1
- 🔨 multi-locale / translation UI (per-page locale variants) — E2
- 🔨 editor onboarding tour / coachmarks + editor-task checklist — E3
- 🔨 export (code/zip) — E4
- 🔨 collaboration presence (live cursors, avatars; demo-blocked but UI) — E5
- ✅ AI/templates/media/stock/components/history/pages/layers/add/settings/inspector(+states)/scope — 54/55/56/56b/57/58/50/51/52/53/59/59b/40/41

## Ship / public (real)
- ✅ publish / domain / paywall / live+404 / share-states — 20/22/30/90/91
- 🔨 pre-publish checks detail (framework health/content/SEO/SSL) — F1 (extend 20)
- 🔨 maintenance / terms / privacy / cookie-consent / offline / dashboard-404 — F2 (one system screen)

## Cross-cutting
- ✅ ⌘K palette / state-standard / confirm — 71/80/70
- 🔨 onboarding role-select exists (04); 🔨 dashboard onboarding checklist widget — C-onb (fold into 10)

---
Build order: A (auth) → B (account) → C (team/notif/help/integrations/tokens) → D (site depth) → E (editor depth) → F (system). Update this matrix + index.html + run link-check after each batch.

---

## CLOSED 2026-06-15 — all 🔨 shipped (25 new screens → 69 total + index)

- **A** auth: a1 signup · a2 verify-email · a3 password · a4 2fa · a5 invite · a6 workspace-select · a7 transfer-accept · a8 auth-errors(11 states). ✅
- **B** b1 account-settings (profile/login/security/notifications/AI-credits/danger — one sectioned screen covering all `/settings/*`). ✅
- **C** c1 team · c2 notifications-inbox · c3 help+ticket · c4 integrations · c5 api-tokens. ✅
- **D** d1 sites-advanced (folders/bulk/filters) · d2 forms+submissions · d3 redirects · d4 share-access (owner) · d5 SEO. ✅
- **E** e1 interactions/animation · e2 locales/translations · e3 editor-onboarding tour · e4 export · e5 collaboration (presence, demo-only honesty). ✅
- **F** f2 system pages (terms/privacy/cookie/offline/dashboard-404/error/maintenance). ✅

Wired: dashboard topbar (🔔→c2, ?→c3, avatar→b1) + Team nav; site-detail "Site tools" row → d2-d5; all in index map (stages 7-10). Integrity: no dead links, no orphans.

Deferred (genuinely not built in app / out of low-fi scope): ecommerce storefront UI (folder exists, minimal), granular per-field form-builder canvas (form *config* covered in d2 + editor Add), Stripe checkout internals (payment off-screen by design/safety).

