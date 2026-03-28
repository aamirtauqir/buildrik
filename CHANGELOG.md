# Changelog

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
