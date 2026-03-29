# TODOS

## Auth

### ~~OAuth session cookie duration is not user-controllable~~ DONE (v0.1.4)
`auth.config.ts` signIn callback now generates a `session_grant` token for non-2FA OAuth users and returns `/auth/oauth-redirect?token=...` instead of `true`. The new `/auth/oauth-redirect` page reads `buildrik_rememberMe` from sessionStorage (stored by the login page before the OAuth redirect) and calls `createClientSession`. OAuth and credential sessions now go through the identical path.

### ~~DB session check in protectedProcedure for real session revocation~~ DONE (v0.1.2)
`protectedProcedure` in `server/trpc/trpc.ts` now checks `Session` DB record on each request using `dbSessionId` embedded in JWT. Legacy sessions without `dbSessionId` are allowed through for backward compat.

### ~~Fix SecurityTab currentSessionId to display active session correctly~~ DONE (v0.1.2)
`security/page.tsx` is now a Server Component that reads `session.user.dbSessionId` from NextAuth and passes it to `SecurityTab`. "Current device" highlights correctly and "Revoke all other sessions" works.


### Email-first unified auth flow (Phase 2)
**What:** Collapse login + signup into a single email-first entry point. User enters email; if an account exists, show the password field; if new, show the signup form. Eliminates "already have an account?" confusion.
**Why:** Industry standard for modern SaaS (Linear, Vercel, Notion). Reduces friction by removing the login/signup decision entirely. The user just enters their email and the system figures out the right path.
**Pros:** Simpler mental model for users. Naturally handles the email conflict case. One entry point instead of two.
**Cons:** Significant frontend refactor. New routing and state machine. Two-step flow (email first, then password/signup) means two page loads. Needs thorough testing of edge cases (OAuth-only accounts, magic link preference, 2FA redirect).
**Context:** Identified during CEO review of auth UX (2026-03-28). Deferred from the auth-ux-hardening scope to ship as Phase 2 after the conversion bug fixes land. CEO plan at `~/.gstack/projects/buildrik/ceo-plans/2026-03-28-auth-ux-hardening.md`.
**Depends on:** Auth UX hardening (auto-login, smart error CTA, etc.) should ship first.

### ~~OAuth logins bypass 2FA entirely~~ DONE (v0.1.2)
`auth.config.ts` signIn callback now checks `twoFactorEnabled` after resolving the user. If true, returns `/auth/2fa?token=<2fa_temp>` — OAuth login redirects to the 2FA page instead of creating a session directly. Same TOTP flow as credential login.

### ~~returnUrl is ignored across all auth pages~~ DONE (v0.1.2)
`app/auth/redirect/page.tsx` now reads `?returnUrl=` from search params. Same-origin validated (prevents open redirect). When onboarding is complete and returnUrl is present, redirects there instead of /dashboard.

### ~~2FA "Trust this device" cookie~~ DONE (v0.1.3)
`server/services/trust-device.service.ts` signs/verifies an HMAC-SHA256 cookie (`buildrik_trust_device`). `checkTrustDevice` tRPC mutation reads the cookie from `ctx.headers`, verifies it, and returns a `session_grant` token if trusted — the 2FA page auto-redirects without showing TOTP. Cookie is auto-revoked on password change via `passwordChangedAt` field on User. Checkbox on both 2FA and backup-code pages.

### ~~OAuth account linking — Phase 1: Account model fix~~ DONE (v0.1.5)
**What:** In `server/auth.config.ts` signIn callback, add `prisma.account.upsert` after user find/create. Add `email_verified !== false` check before proceeding. All changes inside the existing `if (account && user.email)` guard. Upsert handles lazy backfill for existing users automatically. See CEO plan: `~/.gstack/projects/buildrik/ceo-plans/2026-03-28-oauth-account-linking-email-first.md`.
**Why:** Current code links OAuth users by email only. The `Account` model is unused. Adding any OAuth provider that doesn't verify email = full account takeover.
**Pros:** Closes the security gap. 1 file, ~15 lines. Ships on `fix/auth-hardening` branch.
**Cons:** None — pure additive.
**Context:** Google and GitHub verify email, so risk is near-zero today. But the architecture is one new provider away from account takeover. The `Account` model exists and is ready to use.
**Depends on:** Nothing. Ship on current branch before merging.

### ~~OAuth account linking — Phase 2a: Connected accounts panel~~ DONE (v0.1.6)
**What:** Add `account.linkedProviders` tRPC procedure to existing `server/trpc/routers/account.ts`. New "Connected accounts" section in `SecurityTab` showing linked providers + dates. Requires adding `createdAt DateTime @default(now())` to the `Account` model (non-breaking migration).
**Why:** The Account model will be populated after Phase 1. Users deserve visibility into which OAuth providers are linked to their account.
**Pros:** Small scope, high value. Read-only — no security risk.
**Cons:** Requires a schema migration for `createdAt` on Account model.
**Depends on:** Phase 1 (account upsert must be shipping).

### ~~OAuth account linking — Phase 2b: User-initiated provider linking~~ DONE (v0.1.6)
**What:** "Connect Google/GitHub" button in Settings. Requires: new `trpc.account.initiateLinking` mutation, new `/api/account/link/initiate` route handler (sets HttpOnly cookie + redirects to OAuth), and a linking detection branch in the existing `signIn` callback that reads the cookie via `cookies()` from `next/headers`, validates the link_token, checks email match, upserts Account, and returns a settings redirect.
**Why:** Gives users explicit control over which providers are connected to their account.
**Pros:** Completes the Account model story. Reuses existing generateToken/invalidateToken/signIn-callback patterns.
**Cons:** Depends on a feasibility spike (see below). Moderate scope.
**Context:** Full architecture in CEO plan. Key security constraints: email match enforced, link_token is single-use, route handler must verify session.
**Depends on:** Phase 2a + feasibility spike below.
**Codex flags:** (1) Per-user rate limiter referenced in `initiateLinking` may not exist — existing limiter in `server/trpc/trpc.ts` is IP+path only; verify before Phase 2b. (2) `/api/auth/signin/{provider}` initiation path is unverified vs the `signIn()` helper used elsewhere — spike this alongside the cookies() spike. (3) `?linked=` / `?link_error=` params on the success/error redirect are not consumed by any component — the account-tab UI needs to read and display these.

### ~~OAuth account linking — Phase 2b spike: Verify `cookies()`~~ DONE — confirmed working in Node.js context (v0.1.6)
**What:** Before starting Phase 2b, verify that `import { cookies } from "next/headers"` works inside the NextAuth 5 `signIn` callback. Add a temporary `console.log(cookies().getAll())` in the callback in dev and confirm.
**Why:** The entire Phase 2b linking architecture (detecting the link_token cookie inside the signIn callback) depends on this. If it doesn't work, Phase 2b needs a different design (store profile in short-lived DB record during signIn callback, read from there in a custom callback route).
**Pros:** 10-minute spike prevents a full architectural rework mid-implementation.
**Cons:** None.
**Depends on:** Nothing. Spike before Phase 2b starts.

### ~~OAuth account linking — Phase 2b: Provider unlinking~~ DONE (v0.1.6)
**What:** "Unlink" button for each connected provider in the SecurityTab Connected accounts panel. Guard: cannot unlink the last auth method if the user has no password set (enforcement in the account service, not the router).
**Why:** Connect without unlink is incomplete UX. Users who connect a provider accidentally need a path back.
**Pros:** Completes the connect/disconnect story.
**Cons:** Requires "last auth method" guard logic.
**Depends on:** Phase 2b (Connect) must ship first.

### Email-first unified auth flow (Phase 3 — new branch, after Phase 2b ships)
**What:** Collapse `/auth/login` + `/auth/signup` into a single email-first entry point. User enters email; if account exists show the right form; if new show signup inline. `/auth/login` and `/auth/signup` become 301 redirects. Current `/auth/page.tsx` content is replaced.
**Why:** Industry standard (Linear, Vercel, Notion). Removes the login/signup decision entirely.
**Pros:** Simpler mental model. Naturally handles the email conflict case.
**Cons:** Significant frontend refactor. New routing and state machine. Multiple edge cases.
**Context:** CEO plan at `~/.gstack/projects/buildrik/ceo-plans/2026-03-28-oauth-account-linking-email-first.md`. Requires a separate `/office-hours` design pass and a new plan document before implementation.
**Pre-conditions:**
1. Phase 2b must ship ✅ DONE (v0.1.6).
2. `auth.checkEmail` MUST be rate-limited + include consistent artificial delay ✅ DONE (v0.1.7) — strictRateLimit (5/15min) + 200ms floor.
**Depends on:** Phase 2b. Rate-limit guard on `checkEmail`. Separate plan document.
