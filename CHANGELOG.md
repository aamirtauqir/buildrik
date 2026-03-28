# Changelog

## [0.1.3] — 2026-03-28

### Features

- **2FA "Trust this device" cookie** — HMAC-SHA256 cookie (`buildrik_trust_device`) lets users skip TOTP for 30 days on trusted browsers. `checkTrustDevice` tRPC mutation validates the cookie server-side and returns a `session_grant` directly. The 2FA page and backup-code page both show a "Trust this device for 30 days" checkbox. Cookie is auto-revoked when the user changes their password (`passwordChangedAt` field added to User model).

### Security

- **`passwordChangedAt` stamped on password change** — `changePassword` in `account.service.ts` now writes `passwordChangedAt: new Date()` to the user record, enabling trust-device cookies to be invalidated after a password reset.
- **Trust cookie is `SameSite=strict` + `httpOnly`** — prevents CSRF and JS access; cookie is verified server-side via `ctx.headers` in the tRPC mutation.
- **`2fa_temp` token consumed on trusted bypass** — `checkTrustDevice` calls `invalidateToken` before returning the `session_grant`, preventing token replay.

### Schema

- Added `passwordChangedAt DateTime?` to the `User` model. Run `npx prisma db push` to apply.

### Tests

- 23 tests in `__tests__/trust-device.test.ts`: unit tests for `signTrustDevice`/`verifyTrustDevice`/`parseTrustDeviceCookie`, source analysis for `create-session` cookie setting, 2FA/backup page checkbox + auto-bypass, `checkTrustDevice` mutation structure, `changePassword` stamping

## [0.1.2] — 2026-03-28

### Security

- **OAuth 2FA gate** — `signIn` callback in `auth.config.ts` now checks `twoFactorEnabled` for OAuth accounts and returns a `/auth/2fa?token=<2fa_temp>` redirect string instead of granting a session directly; OAuth logins no longer bypass 2FA
- **Real session revocation** — `protectedProcedure` in `trpc.ts` queries the `Session` DB table on every request using `dbSessionId` embedded in the JWT; revoked sessions are rejected mid-flight with `UNAUTHORIZED`; legacy sessions without `dbSessionId` are allowed through for backward compat
- **`dbSessionId` in JWT** — `/api/auth/create-session` now generates a UUID via `randomUUID()` (replacing the prior SHA-256 of the JWT), embeds it in the JWT payload, and stores it as `Session.sessionToken` in the DB; enables DB-side revocation without knowing the raw JWT
- **`returnUrl` open redirect prevention** — `/auth/redirect` validates `returnUrl` via same-origin check (`new URL(url, window.location.origin).origin === window.location.origin`) before redirecting; cross-origin URLs are silently ignored

### Features

- **Account deletion cron** — `GET /api/cron/account-deletion` processes `AccountDeletionReq` records past `scheduledAt`; runs user deletion and marks `processedAt` in a single `$transaction`; authenticated via `CRON_SECRET` bearer token
- **SecurityTab currentSessionId** — `settings/security/page.tsx` is now a Server Component that reads `session.user.dbSessionId` from NextAuth and threads it to `SecurityTab`; "Current device" badge and "Revoke all other sessions" now work correctly

### Tests

- 18 regression tests in `__tests__/auth-hardening-v2.test.ts` covering: OAuth 2FA gate ordering, DB session check source structure, `randomUUID` in `create-session`, `returnUrl` same-origin validation, account deletion cron auth/query/transaction/behavioral

## [0.1.1] — 2026-03-28

### Security

- **AES-256-GCM key derivation** — derive encryption key via `sha256` digest instead of a hex-slice of `NEXTAUTH_SECRET`, eliminating the weak 128-bit effective key
- **CSPRNG backup codes** — replace `Math.random()` with `crypto.randomInt()` in `enable2FA`, making backup codes cryptographically random
- **acceptInvite IDOR** — enforce email match check before the `$transaction` that grants workspace access; mismatched-email requests now throw `FORBIDDEN` before any DB write
- **team IDOR** — scope `changeRole` and `revokeMember` to `workspaceId` using `updateMany`/`deleteMany` compound where-clauses; foreign workspace members can no longer be modified
- **site IDOR** — scope `removeDomain`, `deleteRedirect`, `updateRedirect`, and `revokeShareLink` to `siteId` in Prisma operations; foreign site resources can no longer be modified
- **credentials bypass deleted** — removed NextAuth `CredentialsProvider` from `auth.config.ts` and the dead `trpc.auth.logout` mutation; no more password-bypass path
- **emailVerified enforcement** — `login()` now throws `EMAIL_NOT_VERIFIED` after bcrypt validation but before session grant; verified check order prevents timing leak
- **resendVerification guard** — `resendVerification()` early-returns for already-verified users, preventing 2FA bypass via verification re-send

### Features / UX

- **Session tracking** — OAuth `jwt` callback creates a `Session` DB record on sign-in, storing `userId`, `sessionToken`, and a `current` flag; session count capped at 10 with oldest evicted
- **`createClientSession` helper** — `lib/auth/create-session.ts` wraps `POST /api/auth/create-session`; login, verify-email, 2FA, and backup-code pages all use this instead of raw `signIn("credentials")`
- **`/api/auth/create-session` route** — exchanges a one-time `session_grant` token for a signed HTTP-only cookie session; token invalidated after session is created
- **rememberMe across 2FA** — login page stores `buildrik_rememberMe` in `sessionStorage` before redirecting to `/auth/2fa`; 2FA and backup-code pages read and remove it (read-once), passing it to `createClientSession`
- **verify-email auto-login** — on successful verification, page calls `createClientSession` and redirects to `/auth/redirect`; falls back to "Please sign in" copy if session creation fails
- **Inbox shortcut links** — verify-email and check-inbox pages show direct inbox links for gmail.com/outlook.com/yahoo.com instead of `mailto:` hrefs
- **Signup CONFLICT UX** — signup page shows "Sign in instead" link (with `?email=` pre-fill) and "Resend verification email" CTA on `CONFLICT` error
- **Social button loading state** — `social-button.tsx` tracks `isLoading` and shows `Loader2` spinner while OAuth redirect is in flight
- **Recovery code link on 2FA page** — 2FA page links to `/auth/2fa/backup` and shows "recovery code" text; removes fake "Resend (45s)" placeholder
- **check-inbox back-link** — back link targets `/auth/signup` for verify flow and `/auth/forgot-password` for reset flow

### Tests

- 32 auth hardening regression tests covering: credentials provider removal, OAuth jwt callback, session eviction, IDOR scoping, emailVerified ordering, AES key derivation, CSPRNG backup codes, acceptInvite IDOR, verify-email UX, signup CONFLICT UX, rememberMe flow, 2FA page behavior, check-inbox UX, dead code removal
- 4 IDOR regression tests for site-detail services (domain, redirect, share-link `siteId` scoping)
- Login session flow tests confirming `createClientSession` pattern

### Fixes

- `domains/page.tsx` and `access/page.tsx` — pass `siteId` alongside `id` in remove/revoke mutations (TypeScript errors from IDOR fix)
- `AuditAction` union — add `"LOGIN_UNVERIFIED"` variant used by `auth.service.ts`
- `INVITE_EMAIL_MISMATCH` dead audit log removed from `acceptInvite` (unreachable after the FORBIDDEN guard)
