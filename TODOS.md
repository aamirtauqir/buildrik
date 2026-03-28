# TODOS

## Auth

### OAuth session cookie duration is not user-controllable
**What:** OAuth logins (Google, GitHub) always set a 30-day session cookie. Credential logins respect a `rememberMe` flag. The two paths behave inconsistently.
**Why:** `authConfig.cookies.sessionToken.maxAge` is hard-coded to 30 days. NextAuth doesn't give a clean hook to vary cookie duration per-sign-in for OAuth.
**Pros:** Giving users control over session duration improves security hygiene.
**Cons:** Requires either a custom OAuth session handler or a post-login "active session" UI to let users manage session length.
**Context:** Credential login uses `rememberMe` (boolean) passed to `/api/auth/create-session`. OAuth flow goes through NextAuth directly and sets the cookie in `authConfig.cookies`. The fix would need to intercept the NextAuth session token being set for OAuth, which may require a custom cookie handler or redirecting OAuth post-login through the same `/api/auth/create-session` endpoint.
**Depends on:** Nothing blocking. Can be tackled whenever UX polish is prioritized.

### DB session check in protectedProcedure for real session revocation
**What:** Add a DB `Session` lookup to `protectedProcedure` in `server/trpc/trpc.ts` on each request. Reject if no active session record found.
**Why:** JWT strategy is stateless — deleting `Session` rows does NOT revoke other devices. "Logout everywhere" and "revoke session" are currently display-only controls. A user on another device remains authenticated until their JWT expires even after you delete their DB record.
**Pros:** Real session revocation. "Logout everywhere" actually logs out everywhere. Session limit enforcement has teeth.
**Cons:** One DB read per authenticated request (~3-5ms). Must handle gracefully if session record missing (legacy OAuth sessions before Approach A fix).
**Context:** This is Approach B scope in the auth hardening plan. Tracked at `~/.gstack/projects/buildrik/2026-03-28-design-auth-hardening.md`. The `Session.sessionToken` field stores sha256(JWT) for credential sessions. For OAuth sessions (after Approach A), it stores a `dbSessionId` UUID embedded in the JWT. The lookup would use `token.dbSessionId` for OAuth and reconstruct sha256(cookie) for credential sessions.
**Depends on:** Approach A (auth-hardening) must ship first to ensure OAuth users have DB Session records.

### Fix SecurityTab currentSessionId to display active session correctly
**What:** `components/settings/security-tab.tsx` accepts a `currentSessionId` prop but `app/dashboard/settings/security/page.tsx` never passes it. The "current" session indicator is always empty.
**Why:** After Approach A, OAuth sessions will have a `dbSessionId` embedded in the JWT. Credential sessions have `sha256(JWT)` as the session token. The page needs to read the current session identifier from the JWT and pass it to `SecurityTab`.
**Pros:** Users can see which session is "this device."
**Cons:** Requires reading the JWT on the server side in the settings page. For credential sessions, this means decoding the cookie and hashing it.
**Context:** The `current` DB field is set correctly after Approach A. The missing piece is threading the identifier through to the UI.
**Depends on:** Approach A (auth-hardening) + DB session check in protectedProcedure.


### Email-first unified auth flow (Phase 2)
**What:** Collapse login + signup into a single email-first entry point. User enters email; if an account exists, show the password field; if new, show the signup form. Eliminates "already have an account?" confusion.
**Why:** Industry standard for modern SaaS (Linear, Vercel, Notion). Reduces friction by removing the login/signup decision entirely. The user just enters their email and the system figures out the right path.
**Pros:** Simpler mental model for users. Naturally handles the email conflict case. One entry point instead of two.
**Cons:** Significant frontend refactor. New routing and state machine. Two-step flow (email first, then password/signup) means two page loads. Needs thorough testing of edge cases (OAuth-only accounts, magic link preference, 2FA redirect).
**Context:** Identified during CEO review of auth UX (2026-03-28). Deferred from the auth-ux-hardening scope to ship as Phase 2 after the conversion bug fixes land. CEO plan at `~/.gstack/projects/buildrik/ceo-plans/2026-03-28-auth-ux-hardening.md`.
**Depends on:** Auth UX hardening (auto-login, smart error CTA, etc.) should ship first.

### OAuth logins bypass 2FA entirely
**What:** Social sign-in (Google, GitHub) via NextAuth never checks `twoFactorEnabled` on the User model. A user who enables 2FA for their account can still be logged in without a TOTP challenge via OAuth.
**Why:** The current OAuth flow goes through NextAuth's `signIn()` callback, which creates a session immediately without any 2FA gate. The credential login flow checks `twoFactorEnabled` and redirects to `/auth/2fa`, but OAuth has no equivalent check.
**Pros:** Fixing this ensures 2FA enforcement is consistent across all login methods. Users who enable 2FA expect it to apply everywhere.
**Cons:** Requires intercepting the OAuth callback, checking `twoFactorEnabled`, and redirecting to the 2FA page if enabled. This may require storing a pending OAuth session and completing it after 2FA verification.
**Context:** Identified by Codex during CEO review of auth UX (2026-03-28). This blocks the "trust this device" feature because trust device adds complexity to a 2FA flow that isn't enforced for all paths.
**Depends on:** Nothing blocking. Should be P1 since it's a real security gap.

### returnUrl is ignored across all auth pages
**What:** When users arrive at `/auth/login?returnUrl=/invite/abc`, the returnUrl is dropped after login. Users always land in the default dashboard flow instead of the intended destination.
**Why:** `login/page.tsx`, `2fa/page.tsx`, `magic-link/page.tsx`, and `redirect/page.tsx` all ignore `returnUrl` from search params. The onboarding flow in `use-onboarding-flow.ts` routes to default destinations.
**Pros:** Fixing this makes invite links, shared links, and any deep-link-to-login flow work correctly. Users land where they intended to go.
**Cons:** Requires threading returnUrl through login → 2FA → redirect → final destination. Need to validate returnUrl to prevent open redirect attacks (only allow same-origin URLs).
**Context:** Identified by Codex during CEO review (2026-03-28). Currently breaks invite-to-workspace flow.
**Depends on:** Nothing blocking. Can be done alongside or after auth UX hardening.

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
