# Auth Entry (email-first)

> **Routes:** `/auth` · `/auth/login` and `/auth/signup` are 307 shims that forward to `/auth?email=`
> **Source:** `packages/dashboard/app/auth/page.tsx` · `server/trpc/routers/auth.ts` · `server/services/auth.service.ts` · schemas `packages/shared/schemas/auth.ts`

## Overview
One screen handles both sign-in and sign-up. The user types an email first; the system detects whether an account exists and shapes the rest of the form accordingly. This removes the classic "login vs signup" fork and the wrong-door error.

## State machine (page-level)
`email_entry → checking → login_password | oauth_only | signup_new`

| State | Trigger | What the user sees |
|---|---|---|
| `email_entry` | initial | Email field + Continue + Google/GitHub buttons |
| `checking` | Continue pressed | Spinner; `auth.checkEmail` runs (200 ms constant-time floor) |
| `login_password` | account exists with password | Password field + Remember me + Forgot password? + magic-link option |
| `oauth_only` | account exists, no password, has provider(s) | "You signed up with Google/GitHub" + provider button(s) |
| `signup_new` | no account | Full name + password (+ strength meter) + terms checkbox |

## Fields

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| Email | text | Yes | valid email | Drives the state machine |
| Password (login) | password | Yes | min 8 only | Complexity is never re-validated at login |
| Remember me | checkbox | No | default false | 30-day session vs 24 h |
| Full name (signup) | text | Yes | 2–100 chars | |
| Password (signup) | password | Yes | min 8, ≥1 upper, ≥1 digit, ≥1 special | Live strength meter component |
| Terms accepted (signup) | checkbox | Yes | must be literally true (`z.literal(true)`) | Server-enforced |

## Interactions

### Continue (email check)
- **API:** `auth.checkEmail` → `{exists, hasPassword, providers[]}` — strict rate limit 5/15 min.
- Deliberate enumeration surface (product decision for email-first UX); mitigated by rate limit + constant-time floor.

### Sign in
- **API:** `auth.login {email, password, rememberMe}` — strict 5/15 min.
- Lockout check happens **before** password compare: locked account → 423 → navigate `/auth/error/locked?until=…` (live countdown).
- Wrong password → inline error with attempts remaining; **5 fails lock the account 15 min**; every attempt writes a `LoginAttempt` row + audit event.
- If 2FA enabled → `{requiresTwoFactor, tempToken}` → navigate `/auth/2fa?token=`.
- Else → `{sessionToken}` (5-min one-time grant) → client POSTs `/api/auth/create-session` → cookie set → `/auth/redirect`.

### Sign up
- **API:** `auth.signup` — normal 10/15 min.
- One transaction creates: User, personal Workspace ("<name>'s Workspace"), OWNER membership, OnboardingState (step `ROLE_SELECT`).
- Sends 24 h verification email (failure swallowed; flow continues) → navigate `/auth/verify-email?email=`.
- Duplicate email → 409 CONFLICT surfaced inline.

### OAuth (Google / GitHub)
- NextAuth `signIn(provider)`. First social login auto-creates User (`emailVerified` set immediately) + Workspace + provider link.
- Failure lands on `/auth/error/social-error?provider=`.

### Magic link entry
- Link on the password state → `/auth/magic-link` flow (see doc 03).

## Page relationships
- **Out:** `/auth/2fa`, `/auth/redirect`, `/auth/verify-email`, `/auth/check-inbox`, `/auth/magic-link`, `/auth/error/locked`, `/auth/error/social-error`.
- **In:** middleware sends any unauthenticated `/dashboard` or `/onboarding` visit here; logged-in users are bounced away from here.

## Business rules
- bcrypt runs even when the account doesn't exist (dummy hash) so timing can't reveal existence via the login path.
- Unverified email does **not** block login.
- Rate-limit bucket key is `IP:path` in Postgres — consistent across serverless instances.
