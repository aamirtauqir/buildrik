# Buildrik — PRD: Authentication (M1) + Onboarding (M2)

> Reverse-engineered from code on 2026-07-05 (branch `main`, HEAD `e5624ca1`).
> Scope: auth module + post-signup onboarding. Method: routes, tRPC routers, services, Prisma schema, and shared zod schemas read directly; every claim traces to a file. Uncertainty is marked `[TBC]`, never guessed.

## System overview

Buildrik is an AI website builder for agencies, freelancers, and small businesses (Next.js App Router + tRPC + Prisma, pnpm monorepo). This PRD covers the two entry milestones:

- **M1 · Auth** — how a person gets an account and gets into it: email-first sign-in/sign-up, OAuth (Google/GitHub), email verification, password recovery, magic links, two-factor auth with backup codes, account lockout, team invites, and session management.
- **M2 · Onboarding** — what happens between first login and an active workspace: a short wizard (experience density → project setup → first site creation) followed by a dashboard activation checklist.

Data flow everywhere: **Page → tRPC procedure → service → Prisma**. All request/response shapes live in `packages/shared/schemas/` (single source of truth for validation).

## Module overview

| Module | Pages | Core functionality |
|---|---|---|
| Auth entry | `/auth` (+ `/auth/login`, `/auth/signup` shims) | Email-first state machine: detects account, routes to password, OAuth-only, or new-signup |
| Two-factor | `/auth/2fa`, `/auth/2fa/backup`, `/auth/otp` | TOTP challenge, backup-code recovery, 2FA lockout |
| Magic link | `/auth/magic-link`, `…/sent`, `/auth/callback` | Passwordless sign-in, 15-minute links |
| Recovery & verification | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/check-inbox`, `/auth/password-changed` | Password reset (60-min token), email verify (24h), change-email confirm |
| Invites | `/auth/invite` + team router | Accept/decline workspace invites; 7-day expiry, 2 resends max |
| Session routing | `/auth/redirect`, `/auth/workspace-select`, `/auth/success` | Post-login routing into onboarding or dashboard; multi-workspace choice |
| Auth errors | `/auth/error/*` (10 pages) | Lockout countdown, rate-limited, 2FA-locked, expired links, OAuth failure + 6 orphans |
| Onboarding wizard | `/onboarding/role`, `/onboarding/setup` | Density choice → project name + build method (AI / template / blank) |
| Activation checklist | `/dashboard` floating card | 7 activation tasks; completing all marks onboarding done |

## Page inventory

| # | Page doc | Routes covered |
|---|---|---|
| 1 | [Auth entry](./pages/01-auth-entry.md) | `/auth`, `/auth/login`, `/auth/signup` |
| 2 | [Two-factor](./pages/02-two-factor.md) | `/auth/2fa`, `/auth/2fa/backup`, `/auth/otp` |
| 3 | [Magic link](./pages/03-magic-link.md) | `/auth/magic-link`, `/auth/magic-link/sent`, `/auth/callback` |
| 4 | [Recovery & verification](./pages/04-password-recovery-and-verification.md) | `/auth/forgot-password`, `/auth/reset-password`, `/auth/password-changed`, `/auth/verify-email`, `/auth/check-inbox`, change-email (account) |
| 5 | [Invites](./pages/05-invites.md) | `/auth/invite` + team invite lifecycle |
| 6 | [Workspace & session routing](./pages/06-workspace-and-session-routing.md) | `/auth/redirect`, `/auth/workspace-select`, `/auth/success`, `/auth/splash`, `/auth/error/*` |
| 7 | [Onboarding wizard](./pages/07-onboarding-wizard.md) | `/onboarding`, `/onboarding/role`, `/onboarding/setup`, site-creation branch |
| 8 | [Dashboard checklist](./pages/08-dashboard-checklist.md) | `/dashboard` activation card |

Appendix: [Enum dictionary](./appendix/enum-dictionary.md) · [API inventory](./appendix/api-inventory.md) · [Gaps & drift register](./appendix/gaps-and-drift.md)

## Global rules (apply everywhere)

### Identity & session
- Session strategy: **JWT cookie** (NextAuth), `sameSite=lax`, `httpOnly`, secure in prod. Cookie max-age 30 days.
- Login hand-off: auth mutations never set cookies directly — they return a one-time **session grant** (5-min token), which the client exchanges at `POST /api/auth/create-session` for the cookie + a DB session row (30 days with "Remember me", else 24 h).
- **Max 10 active sessions** per user; oldest is pruned.
- Password reset signs out **all** sessions. In-account password *change* does **not** (known inconsistency — gaps register #6).
- Login does **not** require a verified email (no verification wall).

### Abuse controls (three layers)
1. Per-account lockout: **5 failed logins → locked 15 minutes** (checked before password compare; UI gets remaining attempts).
2. Per-IP tRPC limits: strict endpoints **5/15 min**, normal **10/15 min** (Postgres fixed-window, serverless-safe).
3. NextAuth credentials layer: **5 per 5 min per IP**.
- 2FA has its own lockout: **5 wrong codes** per challenge → challenge invalidated.
- Anti-enumeration: forgot-password / resend-verification / magic-link always return a generic success; login compares against a dummy hash even when no user exists. (Exception: `checkEmail` deliberately reveals account existence for the email-first UX — with a 200 ms constant-time floor and strict rate limit.)

### Passwords & tokens
- Password rule (signup/reset): min 8, ≥1 uppercase, ≥1 number, ≥1 special. bcrypt cost 10.
- All verification tokens stored **sha256-hashed**, single-use. TTLs: email-verify 24 h · password-reset 60 min · magic-link 15 min · 2FA-temp 5 min · session-grant 5 min · email-change 24 h. (Invite links are a separate mechanism: UUID on the Invite row, 7-day expiry.)

### Permission model
Roles: `OWNER, ADMIN, EDITOR, DESIGNER, VIEWER` (strings + app-level constants; no Prisma enums). Signup creates User + personal Workspace + OWNER membership + OnboardingState in one transaction. Workspace switching is guarded (active membership validated in the JWT callback).

### Common interaction patterns
- Every auth mutation that sends email swallows email-provider failures (user flow continues; audit log records the attempt).
- Every significant auth event writes an audit row (see enum dictionary for the full event list).
- Middleware: authenticated users are bounced off `/auth/*` (except workspace-select/success/redirect); unauthenticated users on `/dashboard` or `/onboarding` are sent to login.
