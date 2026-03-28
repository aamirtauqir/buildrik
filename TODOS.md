# TODOS

## Auth

### OAuth session cookie duration is not user-controllable
**What:** OAuth logins (Google, GitHub) always set a 30-day session cookie. Credential logins respect a `rememberMe` flag. The two paths behave inconsistently.
**Why:** `authConfig.cookies.sessionToken.maxAge` is hard-coded to 30 days. NextAuth doesn't give a clean hook to vary cookie duration per-sign-in for OAuth.
**Pros:** Giving users control over session duration improves security hygiene.
**Cons:** Requires either a custom OAuth session handler or a post-login "active session" UI to let users manage session length.
**Context:** Credential login uses `rememberMe` (boolean) passed to `/api/auth/create-session`. OAuth flow goes through NextAuth directly and sets the cookie in `authConfig.cookies`. The fix would need to intercept the NextAuth session token being set for OAuth, which may require a custom cookie handler or redirecting OAuth post-login through the same `/api/auth/create-session` endpoint.
**Depends on:** Nothing blocking. Can be tackled whenever UX polish is prioritized.

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

### 2FA "Trust this device" cookie
**What:** Add a "Trust this device for 30 days" checkbox on the 2FA page. When checked, set an HMAC-signed cookie that bypasses 2FA on subsequent logins from the same browser.
**Why:** Daily TOTP entry for the same device is friction that doesn't add security. Users on trusted devices should be able to skip 2FA.
**Pros:** Reduces daily friction for 2FA users. Standard feature in most SaaS products. HMAC-signed cookie means no DB migration needed.
**Cons:** Adds a 2FA bypass path that must be audited. Requires passwordChangedAt field on User model to auto-revoke on password change. No per-device revocation without a DB-backed approach.
**Context:** Accepted in CEO review scope, then deferred after Codex review found that OAuth bypasses 2FA entirely. Trust device should not be built until OAuth 2FA enforcement is fixed.
**Depends on:** OAuth 2FA enforcement fix (above). Also needs passwordChangedAt Prisma migration.

### OAuth email-only account linking may allow account takeover
**What:** `server/auth.config.ts` signIn callback links OAuth users to existing accounts by matching email only. No `Account` model linkage, no verified-email proof beyond trusting the provider. If a new OAuth provider account is created with the same email as an existing credential account, the OAuth login silently gains access.
**Why:** Google and GitHub both verify email ownership before issuing tokens, so the real-world risk is low for the current providers. But the architecture is brittle — adding a third provider that doesn't verify email would open a full account takeover path.
**Pros:** Fixing this closes a latent account takeover risk before it matters.
**Cons:** Requires a policy decision: should credential + OAuth accounts be explicitly linked (user-initiated), or continue auto-linking by email? User-initiated linking requires a UI flow.
**Context:** Found during Approach A eng review (Codex round 3). The `Account` model exists in prisma/schema.prisma but is not used by the current signIn callback flow. Auto-linking is a known NextAuth footgun documented in multiple security advisories.
**Depends on:** Nothing blocking. Evaluate before adding any new OAuth providers.
