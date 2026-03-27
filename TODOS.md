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

### AES-256-GCM key derivation breaks for non-hex NEXTAUTH_SECRET (P0 — 2FA non-functional)
**What:** `server/services/auth.service.ts:23` derives the AES key via `Buffer.from(process.env.NEXTAUTH_SECRET!.slice(0, 64), 'hex')`. If `NEXTAUTH_SECRET` contains non-hex characters (base64, random ASCII — the common case), `Buffer.from(..., 'hex')` silently drops invalid pairs, producing a key shorter than 32 bytes. `createCipheriv('aes-256-gcm', ...)` requires exactly 32 bytes and throws `Invalid key length` at runtime. All 2FA enrollment and verification fails silently for any deployment whose secret is not a pure lowercase hex string.
**Fix:** Replace with `createHash('sha256').update(process.env.NEXTAUTH_SECRET!).digest()` to always produce 32 bytes. Or add a separate `TOTP_ENCRYPTION_KEY` env var (32 hex bytes, documented).
**Depends on:** Nothing blocking. Fix before any real user enrolls in 2FA.

### Math.random() used to generate backup codes — not cryptographically secure (P0)
**What:** `server/services/account.service.ts` generates 2FA backup codes using `Math.floor(Math.random() * chars.length)`. `Math.random()` is not a CSPRNG. Backup codes are emergency authentication credentials.
**Fix:** Replace with `crypto.randomInt(0, chars.length)` (Node 14.10+) or generate via `crypto.randomBytes`.
**Depends on:** Nothing blocking.

### acceptInvite IDOR — any authenticated user can join any workspace by knowing the invite token (P0)
**What:** `server/trpc/routers/auth.ts` `acceptInvite` only logs a warning when the authenticated user's email doesn't match the invite's email, then grants workspace access anyway. Any authenticated user who knows or guesses an invite token can join any workspace.
**Fix:** Throw `TRPCError({ code: "FORBIDDEN" })` when `invite.email !== ctx.session.user.email`.
**Depends on:** Nothing blocking. High-risk on any shared deployment.

### Multiple IDOR holes in team and site-detail routers (P0)
**What:** `revokeInvite`, `resendInvite`, `revokeMember`, `deleteMember` (team.ts), and `updateRedirect`, `deleteRedirect`, `removeDomain`, `setPrimaryDomain`, `revokeShareLink` (site-detail.ts) accept bare IDs without verifying the caller owns the target resource. Any authenticated user can modify another workspace's resources.
**Fix:** Pass `workspaceId` from `getWorkspaceCtx` into each service function and add it to the `where` clause.
**Depends on:** Nothing blocking.

### OAuth email-only account linking may allow account takeover
**What:** `server/auth.config.ts` signIn callback links OAuth users to existing accounts by matching email only. No `Account` model linkage, no verified-email proof beyond trusting the provider. If a new OAuth provider account is created with the same email as an existing credential account, the OAuth login silently gains access.
**Why:** Google and GitHub both verify email ownership before issuing tokens, so the real-world risk is low for the current providers. But the architecture is brittle — adding a third provider that doesn't verify email would open a full account takeover path.
**Pros:** Fixing this closes a latent account takeover risk before it matters.
**Cons:** Requires a policy decision: should credential + OAuth accounts be explicitly linked (user-initiated), or continue auto-linking by email? User-initiated linking requires a UI flow.
**Context:** Found during Approach A eng review (Codex round 3). The `Account` model exists in prisma/schema.prisma but is not used by the current signIn callback flow. Auto-linking is a known NextAuth footgun documented in multiple security advisories.
**Depends on:** Nothing blocking. Evaluate before adding any new OAuth providers.
