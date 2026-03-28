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

### OAuth email-only account linking may allow account takeover
**What:** `server/auth.config.ts` signIn callback links OAuth users to existing accounts by matching email only. No `Account` model linkage, no verified-email proof beyond trusting the provider. If a new OAuth provider account is created with the same email as an existing credential account, the OAuth login silently gains access.
**Why:** Google and GitHub both verify email ownership before issuing tokens, so the real-world risk is low for the current providers. But the architecture is brittle — adding a third provider that doesn't verify email would open a full account takeover path.
**Pros:** Fixing this closes a latent account takeover risk before it matters.
**Cons:** Requires a policy decision: should credential + OAuth accounts be explicitly linked (user-initiated), or continue auto-linking by email? User-initiated linking requires a UI flow.
**Context:** Found during Approach A eng review (Codex round 3). The `Account` model exists in prisma/schema.prisma but is not used by the current signIn callback flow. Auto-linking is a known NextAuth footgun documented in multiple security advisories.
**Depends on:** Nothing blocking. Evaluate before adding any new OAuth providers.
