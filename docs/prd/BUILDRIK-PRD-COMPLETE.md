# Buildrik — Complete PRD
## Authentication (M1) + Onboarding (M2)

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-07-05 |
| **Source of truth** | Reverse-engineered from code — branch `main`, HEAD `e5624ca1` |
| **Status** | As-built ground truth + decision register. Spec-only items are explicitly marked. |
| **Method** | Routes, tRPC routers, services, Prisma schema, shared zod schemas read directly. Uncertainty marked `[TBC]`, never guessed. |

---

## 1. Executive summary

Buildrik is an AI website builder for agencies, freelancers, and small businesses (Next.js App Router + tRPC + Prisma). This PRD documents the complete entry experience: how a person gets an account, gets into it safely, and reaches an active workspace with their first site.

The auth system is unusually complete for its stage — email-first entry, OAuth, magic links, TOTP 2FA with backup codes, lockout, invites, session management, full audit trail. The onboarding is a 3-step wizard plus a 7-task activation checklist. The main risks are not missing features but **27 known gaps and inconsistencies** (§12) — broken sub-flows, orphaned surfaces, and code↔spec↔design drift — each needing an owner decision before v1.

**Data flow everywhere:** Page → tRPC procedure → service → Prisma. Validation SSOT: `packages/shared/schemas/`.

---

## 2. Users & context

| User | Entry path | Job to be done |
|---|---|---|
| **Solo founder / freelancer** | Signup (email or OAuth) | Get a website live fast, alone |
| **Agency owner** | Signup, picks "agency" | Set up a workspace, invite team, manage client sites |
| **Invited team member** | Invite email link | Join an existing workspace with the right role, start contributing |
| **Returning user** | Sign in (password / magic link / OAuth) | Get back to work with minimum friction, safely |

**Business goals served:** activation (signup → first site) and safe re-entry (returning users, recovery, lockout). Every auth screen serves one of these two.

---

## 3. Scope

**In scope (M1):** email-first auth entry, signup, OAuth (Google/GitHub), email verification, password recovery, magic link, 2FA + backup codes, account lockout, workspace invites, session management, auth error states.
**In scope (M2):** onboarding wizard (density → project setup → first-site creation), dashboard activation checklist, plan-limit gates during onboarding.
**Out of scope:** editor experience, billing/plans UI, team management beyond invites, in-editor AI, M3+ modules.

---

## 4. Success metrics (proposed — not yet instrumented in code)

> Code writes audit events for every auth action but defines no product metrics. These are proposed targets; instrument via the existing audit/AIUsage tables.

| Metric | Definition | Proposed target |
|---|---|---|
| Signup completion | signup started → email verified | ≥ 60% |
| Activation | signup → first site created | ≥ 40% within 24 h |
| Onboarding completion | wizard finished OR checklist 7/7 | ≥ 30% |
| Sign-in success | login attempts succeeding (excl. lockouts) | ≥ 95% |
| Recovery success | reset-link sent → password changed | ≥ 70% |
| Invite acceptance | invite sent → accepted before 7-day expiry | ≥ 65% |
| 2FA dead-ends | 2FA challenges ending in lockout with no backup code | < 1% (needs C3 fix) |

---

## 5. User journeys (as built)

### J1 — New user, email signup
`/auth` email → no account detected → name + password + terms → account + personal workspace + OWNER membership created (one transaction) → verification email (24 h) → `/auth/verify-email` → login → `/auth/redirect` → onboarding wizard.

### J2 — New user, OAuth
Google/GitHub button → NextAuth → first login auto-creates User (email pre-verified) + workspace → `/auth/redirect` → onboarding.

### J3 — Returning user
`/auth` email → account detected → password (or magic link / OAuth per account) → optional 2FA challenge → session grant → cookie → `/auth/redirect` → dashboard (or resume onboarding step).

### J4 — Forgot password
Forgot link → email → 60-min reset link → new password (all sessions revoked) → confirmation → login.

### J5 — Locked out
5 wrong passwords → locked 15 min → countdown screen → wait, or reset password instead.

### J6 — Invited member
Invite email (7-day validity) → `/auth/invite?token=` → sees workspace/inviter/role → sign in or sign up (invite email must match session email) → accept → membership + site permissions → dashboard.

### J7 — Onboarding
Density (Simple/Advanced) → project name + method (AI/template/blank) → create first site (AI wizard: type → pages/tone → generate; or template gallery; or blank) → dashboard checklist (7 tasks) → done.

---

## 6. Functional requirements — M1 Auth

### 6.1 Auth entry (`/auth`; `/auth/login`, `/auth/signup` are shims)

Email-first state machine: `email_entry → checking → login_password | oauth_only | signup_new`.

| Field | Rules |
|---|---|
| Email | valid email; drives account detection (`checkEmail`: exists, hasPassword, providers; 200 ms constant-time floor; strict rate limit) |
| Password (login) | min 8 only — complexity never re-validated at login |
| Remember me | default off; 30-day session vs 24 h |
| Full name (signup) | 2–100 chars |
| Password (signup) | min 8, ≥1 uppercase, ≥1 number, ≥1 special; live strength meter |
| Terms | must be literally true — server-enforced |

Behavior:
- Lockout checked **before** password compare; locked → `/auth/error/locked?until=` with live countdown; wrong password shows attempts remaining.
- bcrypt (cost 10) runs even for nonexistent accounts (dummy hash — timing safety).
- Signup transaction: User + Workspace ("<name>'s Workspace") + OWNER membership + OnboardingState(ROLE_SELECT). Verification email failure is swallowed — flow continues.
- 2FA accounts: login returns a 5-min challenge token → `/auth/2fa`.
- Success: 5-min one-time session grant → `POST /api/auth/create-session` (CSRF-checked) → JWT cookie + DB session (30 d / 24 h) → `/auth/redirect`. Max 10 sessions, oldest pruned.

### 6.2 Two-factor (`/auth/2fa`, `/auth/2fa/backup`)

- TOTP (otplib), secret AES-256-GCM encrypted at rest. Input: exactly 6 digits.
- **5 wrong codes invalidate the challenge** → `/auth/error/2fa-locked`.
- Backup codes: **10** issued at setup, format `XXXX-XXXX-XXXX` (A–Z 0–9), bcrypt-hashed, single-use, `backupCodesRemaining` returned — display it.
- Setup/disable in account settings: enable → secret + otpauth URI + codes; confirm with a code; disable needs password or (OAuth-only) a code.
- ⚠ Defects: `/auth/otp` page forwards a code the 2FA page ignores (broken); static "Resend (45s)" label is meaningless for TOTP; no recovery path when both factors are lost (A1, A2, C3).

### 6.3 Magic link (`/auth/magic-link`, `…/sent`, `/auth/callback`)

- Request → always generic success (anti-enumeration) → sent screen with address, "expires in 15 minutes", 60 s resend cooldown.
- Consume on `/auth/callback?token=` → sets emailVerified if null → 2FA branch or session grant.
- ⚠ B4: entry from `/auth` routes to check-inbox without `type` → wrong copy + dead resend.

### 6.4 Password recovery & email verification

- Forgot → generic success → **60-min** reset token.
- Reset: complexity rules + confirm match (client + server) → **all sessions revoked** → confirmation (auto-forward 5 s).
- Verify email: **24 h** token; auto-verifies on arrival; resend re-mints. Same endpoint consumes **email-change** tokens (24 h, sent to the *new* address, identifier `userId:newEmail`).
- ⚠ B1: in-account changePassword does NOT revoke sessions but shares the "signed out everywhere" copy. ⚠ B3: login never requires verified email.

### 6.5 Invites (`/auth/invite?token=`)

- Row-based: UUID token, PENDING, **7-day expiry**, **max 2 resends** (each +7 d), cron flips overdue → EXPIRED.
- Public details query (workspace, inviter, role, expired). Accept requires session AND **invite email == session email** (case-insensitive; mismatch audited). Creates membership + site permissions, notifies inviter.
- Decline is public → owner notified.
- ⚠ B6: expired-page CTA implies self-serve resend; only owners can resend.

### 6.6 Session routing & errors

- `/auth/redirect` = single post-auth decision point: no session → back to `/auth`; else onboarding step or dashboard.
- `/auth/workspace-select`: lists memberships, select updates session workspaceId. ⚠ B5: its "Create new workspace" goes to onboarding, which never creates workspaces.
- Wired error pages: locked (countdown), 2fa-locked, expired-link, invite-expired, social-error.
- ⚠ A7: six orphan error pages (rate-limited, session-expired, captcha, disabled, suspicious, access-denied) + `/auth/splash` — no code path reaches them; no CAPTCHA system exists at all.

---

## 7. Functional requirements — M2 Onboarding

State machine per user (`OnboardingState`, created at signup):
`ROLE_SELECT → PROJECT_SETUP → SITE_CREATION → (EDITOR_TOUR: dead) → CHECKLIST → COMPLETED`

### 7.1 Step 1 — Density (`/onboarding/role`)
- Simple (`fewer`) / Advanced (`full`) cards; skip = Simple.
- Writes `UserPreference.editorDensity` (editor consumes it) — the only wizard answer with a live downstream reader.
- ⚠ B8: DB field named `role` stores density.

### 7.2 Step 2 — Project setup (`/onboarding/setup`)
- Workspace type solo/agency (agency only toggles `agency_layer` feature flag — creates nothing).
- Project name 2–100; method `ai` (Recommended) / `template` / `blank`. Back allowed, no skip.

### 7.3 Step 3 — First site (branch)
- **Blank** → `sites.create` → editor.
- **Template** → gallery (7 categories, 3 sorts, 6/page) → preview → `templates.use`.
- **AI** → 3-step wizard: business type (6) → pages 1–8 (Home locked) + tone (6) / content (3) / images (3) / description ≤500 → generate with 2 s polling → editor.
- Gates: sites FREE 3 / PRO 15 / BUSINESS 50 · AI monthly FREE 3 / PRO 20 / BUSINESS ∞ (credits modal on exhaust) · AI hourly 3/workspace (all plans).
- ⚠ B7: no creation path advances the step — progression relies on read-repair in `getState` (live site → jump to CHECKLIST). Create-then-delete may strand the user `[TBC]`.

### 7.4 Checklist (`/dashboard` floating card)
- 7 tasks: add text block · upload image · change site name · add second page · preview · invite teammate · publish. Progress `n/7` + bar.
- All 7 → COMPLETED (card gone forever). Dismiss (X) ends it without completion.
- Invited-member variant (3 tasks) exists in code but is never mounted — ⚠ A8.

---

## 8. Business rules master table

| Rule | Value |
|---|---|
| Account lockout | 5 failed logins → 15 min lock (checked pre-compare; attempts-remaining surfaced) |
| 2FA lockout | 5 wrong codes per challenge → challenge invalidated |
| IP rate limits | tRPC strict 5/15 min · normal 10/15 min · NextAuth credentials 5/5 min — Postgres fixed-window |
| Password | min 8, ≥1 upper, ≥1 digit, ≥1 special · bcrypt cost 10 |
| Sessions | JWT cookie, sameSite=lax, httpOnly · 30 d (remember) / 24 h · max 10, oldest pruned |
| Token TTLs | verify 24 h · reset 60 min · magic 15 min · 2FA-temp 5 min · session-grant 5 min · email-change 24 h — all sha256-hashed, single-use |
| Invites | 7-day expiry · max 2 resends · email-match on accept |
| Backup codes | 10 · `XXXX-XXXX-XXXX` · single-use · bcrypt-hashed |
| Anti-enumeration | generic success on forgot/resend/magic; dummy-hash compare on login; exception: checkEmail (deliberate, rate-limited, constant-time floor) |
| Plan gates (onboarding) | sites 3/15/50 · AI generations/mo 3/20/∞ · AI hourly 3 · AI prompts/day 10/200/∞ |
| Audit | every auth event writes an audit row (25 event types); LoginAttempt log (last 10 shown to user) |

---

## 9. Non-functional requirements

- **Security:** tokens hashed at rest; TOTP secrets AES-256-GCM; OAuth-only accounts can set a password but can't disconnect their last login method; workspace switching validates ACTIVE membership in the JWT callback; create-session is same-origin CSRF-checked; cookie-session only for account endpoints (bearer tokens denied).
- **Resilience:** email-provider failures never block user flows (logged, swallowed); rate limiting survives serverless (Postgres-backed); cron sweeps clean expired tokens/invites/sessions.
- **Known security debt:** backup codes via `Math.random()` (C1) · empty IP on tRPC login-history rows (C2) · no 2FA-exhausted recovery (C3).

---

## 10. Enum reference (condensed)

- **Roles:** OWNER, ADMIN, EDITOR ("Content editor"), DESIGNER, VIEWER. **MemberStatus:** ACTIVE, SUSPENDED. **InviteStatus:** PENDING, ACCEPTED, DECLINED, EXPIRED. **Provider:** email, google, github.
- **Token types (real SSOT = token.service.ts):** email_verify, password_reset, magic_link, 2fa_temp, session_grant, email_change (+ internal 2fa_attempt; `invite` declared but dead). ⚠ B9: the exported `VerificationTokenType` constant lists only 4 and is out of sync.
- **Auth errors:** ACCOUNT_LOCKED(423), INVALID_CREDENTIALS(401), EMAIL_EXISTS(409), TOKEN_EXPIRED(410), INVALID_2FA_CODE(401), 2FA_LOCKED(423), SLUG_COLLISION(500).
- **Onboarding:** steps (6, one dead) · density full/fewer · method ai/template/blank · 8 task ids (7 = full checklist) · AI types (6), tones (6), content (3), images (3) · template categories (7), sorts (3).

---

## 11. API reference (condensed)

**authRouter:** checkEmail, login, signup, verifyEmail, resendVerification, forgotPassword, resetPassword, magicLink, verifyMagicLink, verify2FA, verifyBackupCode, logout, getInviteDetails (public query), acceptInvite, declineInvite.
**accountRouter (auth-relevant):** changeEmail, changePassword, setPassword, disconnectProvider, twoFactor.enable/confirm/disable, sessions.list/revoke/revokeAll, loginHistory.
**teamRouter:** invite, resendInvite, revokeInvite, pendingInvites.
**onboardingRouter:** getState (read-repair — not a pure getter), selectRole, setupProject, completeStep (⚠ dead), completeDashboardTask, dismiss.
**Adjacent:** sites.create, templates.use, templates.generate.create.
**REST:** POST /api/auth/create-session, POST /api/auth/logout, 3 cron cleanup routes (Bearer CRON_SECRET).

Full input/output/side-effect tables: `appendix/api-inventory.md`.

---

## 12. Gaps & decisions register (27 items — full detail in `appendix/gaps-and-drift.md`)

**A. Broken/dead (8):** /auth/otp broken forward · static 2FA resend label · sidebar dot → nonexistent /onboarding/create · EDITOR_TOUR unreachable + dead columns · completeStep endpoint unused · dead `invite` token type · 6 orphan error pages + splash · invited checklist variant never mounted.

**B. Product decisions (9):** changePassword vs reset session-revoke inconsistency · two password charsets · no email-verify gate on login · magic-link check-inbox wrong copy/dead resend · workspace-select "create" creates nothing · invite-expired CTA vs capability · step relies on read-repair · `role` field stores density · token-type constant drift.

**C. Security (3):** Math.random backup codes · empty IPs in login history · no 2FA-exhausted recovery.

**D. Spec-only, not built (7):** client quick-add · path-chooser + role defaults · AI style-token pick + 2-variant result · member-first-run · resume caps · agency 5-item checklist · editor coach marks.

**E. Design↔code:** Figma flow map says "7 token types" (reality 6+1+1 dead) and invite copy says 48 h (**code: 7 days**) · designed CAPTCHA page has no CAPTCHA system · wizard font (Space Grotesk) off the repo type system.

---

## 13. Release readiness (v1 gate proposal)

Must-fix before v1: A1, A3, A7 (wire or delete), A8, B1, B4, B5, C1, C3.
Should-fix: B2, B3 (decide + document), B6, B7, E copy sync (48 h ↔ 7 days).
Can ship with: A4–A6 cleanups, D items (roadmap), B8/B9 (refactors).

**Open questions for the team:**
1. Is unverified-email login intentional policy or an oversight? (B3)
2. Multi-workspace users: when should workspace-select actually appear? `[TBC]`
3. Invite roles: exact grantable set from the invite modal `[TBC — verify inviteMembersSchema]`.
4. v3 onboarding spec (D1–D7): build next, or re-scope after activation data?

---

*Companion docs: per-page deep dives in `docs/prd/pages/01–08`, full tables in `docs/prd/appendix/`. Every claim in this document traces to a file in the repo at HEAD `e5624ca1`; nothing is invented.*
