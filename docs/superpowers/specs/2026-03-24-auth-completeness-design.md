# Phase 1: Auth Completeness — Design Spec

**Date:** 2026-03-24
**Status:** Reviewed (v2 — fixes from spec review applied)
**PRD Refs:** Sections 4.1, 9.2, 15.1-15.4, flow.md Flows A-H
**Audit Refs:** D-8, D-12, D-22, D-24, D-31

---

## 1. Problem Statement

The auth module has complete scaffolding (26 pages, 14 router endpoints, full service layer) but 3 of 8 auth flows are **broken** and 3 are **partial**. The critical blocker: signup and OAuth don't create a Workspace, which breaks every downstream feature (dashboard, sites, team, billing all query by workspaceId).

### Current State

| Flow | Status | Blocker |
|------|--------|---------|
| A. Login (happy path) | Done | rememberMe not wired |
| B. Login error → lock | Partial | No remaining attempts count, no lock timer |
| C. 2FA | Partial | No failure tracking, wrong redirect after verify |
| D. Signup → Onboarding | **Broken** | No Workspace/WorkspaceMember creation |
| E. Forgot password | Done | Token 30min instead of 1hr |
| F. Magic link | Partial | emailVerified not set, 2FA not checked |
| G. Social login | **Broken** | No Workspace creation for new OAuth users |
| H. Invite accept | **Broken** | Uses wrong table (VerificationToken instead of Invite) |

---

## 2. Solution Overview

Fix-in-place approach. No new services, no new routers, no architectural changes. Each fix is a surgical edit to existing files following the established patterns.

### Approach

1. Create a shared `createWorkspaceForUser()` helper — fixes Flows D, G simultaneously
2. Rewrite invite accept to use the Invite table — fixes Flow H
3. Add emailVerified + 2FA check to magic link verify — fixes Flow F
4. Add 2FA failure tracking + login remaining attempts — fixes Flows B, C
5. Wire rememberMe, fix password reset token expiry, fix 2FA redirect — fixes Flows A, C, E

---

## 3. Detailed Changes

### 3.1 Workspace Creation — Shared Helper (CRITICAL)

**File:** `server/services/auth.service.ts` — new exported function `createWorkspaceForUser()`

This helper is called from both `signup()` and `auth.config.ts` signIn callback. It is the single source of truth for workspace bootstrapping.

```typescript
export async function createWorkspaceForUser(
  tx: PrismaTransactionClient, // passed from caller's transaction
  userId: string,
  fullName: string,
  email: string
): Promise<{ workspaceId: string }> {
  const slug = await generateUniqueSlug(tx, fullName);
  const workspace = await tx.workspace.create({
    data: { name: `${fullName}'s Workspace`, slug, ownerId: userId },
  });
  await tx.workspaceMember.create({
    data: { userId, workspaceId: workspace.id, role: "OWNER" },
  });
  await tx.onboardingState.create({
    data: { userId },
  });
  return { workspaceId: workspace.id };
}
```

**Slug generation:** `fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)` + if collision, append 4-char random suffix. Retry up to 3 times if suffix also collides.

**Stripe Customer creation:** Handled outside the transaction, after it commits. This is NOT inside `createWorkspaceForUser` — it's a separate concern. The caller (signup or billing service) triggers it asynchronously. If it fails, `stripeCustomerId` stays null; the billing service creates it lazily on first upgrade (per PRD Decision #21). This avoids a hidden side effect in the auth service.

**In `signup()`:** Wrap User + `createWorkspaceForUser()` in `prisma.$transaction`. Email sending stays outside the transaction (existing pattern). If transaction fails, nothing is created.

### 3.2 OAuth Workspace Creation (CRITICAL)

**File:** `server/auth.config.ts` — `signIn` callback

**Current behavior:** Creates User for new OAuth users, but no Workspace.

**New behavior:** After creating User, call `createWorkspaceForUser()` from `auth.service.ts`. The callback already bypasses the Page→Router→Service chain (NextAuth forces this), so at minimum the business logic lives in the service and is called from the callback.

```typescript
// In signIn callback, !existing branch:
const created = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  await createWorkspaceForUser(tx, user.id, user.fullName, user.email);
  return user;
});
```

**isNewUser flag:** Set `token.isNewUser = true` in the `jwt` callback when user is first created. The redirect page reads this to route new users to onboarding vs dashboard.

**Social login callbackUrl fix:** Change `signIn("google", { callbackUrl: "/dashboard" })` to `signIn("google", { callbackUrl: "/auth/redirect" })` in `app/auth/page.tsx` and `app/auth/login/page.tsx`. This ensures new OAuth users go through the onboarding check, same as all other flows.

### 3.3 Invite Accept Rewrite (CRITICAL)

**File:** `server/trpc/routers/auth.ts` — `acceptInvite` mutation

**Current behavior:** Uses VerificationToken table, creates WorkspaceMember with hardcoded "editor" role.

**New behavior:** Change to `protectedProcedure` (user must be logged in to accept). Use `ctx.session.user.id` for the WorkspaceMember creation.

1. Query `Invite` table by `token` field (not VerificationToken)
2. Validate: `invite.status === 'PENDING'` and `invite.expiresAt > now()`
3. Check if `ctx.session.user.id` is already a member of `invite.workspaceId` — if so, return error `ALREADY_MEMBER`
4. Create `WorkspaceMember` with `userId: ctx.session.user.id`, `role: invite.role` (from invite, not hardcoded)
5. If `invite.siteIds` is non-empty, create `SitePermission` records for each site
6. Update `invite.status` to `'ACCEPTED'`
7. Log invite email mismatch if `invite.email !== ctx.session.user.email` (audit trail, not a blocker)
8. Return `{ success: true, workspaceId, workspaceName }`

**Also rewrite `declineInvite`:** Currently uses `invalidateToken()` on VerificationToken. Change to: query Invite by token, update `invite.status = 'DECLINED'`. Keep as `publicProcedure` (declining doesn't require auth).

**Pre-requisite:** The invite page needs to fetch invite details before showing the accept screen. Add a new `getInviteDetails` query:
- Input: `{ token: string }`
- Query Invite table, join Workspace for name
- Return: `{ workspaceName, inviterName, role, expired: boolean }`
- Public procedure (no auth required — user may not be logged in yet)

### 3.4 Invite Page — Show Workspace Details

**File:** `app/auth/invite/page.tsx`

**Current behavior:** Shows generic "You've been invited" with no workspace name.

**New behavior:**
1. On mount, call `trpc.auth.getInviteDetails.useQuery({ token })`
2. Display: "You've been invited to **{workspaceName}**"
3. Show: "Invited by {inviterName} as {role}"
4. If invite expired: redirect to `/auth/error/invite-expired`
5. If user not logged in: show "Sign in to accept" → redirect to login with `?returnUrl=/auth/invite?token=X`
6. If user logged in: show Accept/Decline buttons

### 3.5 Magic Link — Set emailVerified + 2FA Check

**File:** `server/services/auth.service.ts` — `verifyMagicLink()` function

**Current behavior:** Returns user, doesn't set emailVerified, doesn't check 2FA.

**New behavior:**
```
1. Validate token (existing)
2. Invalidate token (existing)
3. NEW: Update user.emailVerified = new Date() (if not already set)
4. NEW: Check user.twoFactorEnabled
   - If true: generate 2fa_temp token, return { requiresTwoFactor: true, tempToken }
   - If false: return user (existing behavior)
```

**Router change** (`server/trpc/routers/auth.ts` — `verifyMagicLink`): The return type changes from always returning `{ sessionToken, user }` to a discriminated union:
- `{ requiresTwoFactor: false, sessionToken, user }` — existing path
- `{ requiresTwoFactor: true, tempToken }` — new 2FA path

This is a **coordinated frontend + backend change**. The router and callback page must be updated together.

**Frontend change** (`app/auth/callback/page.tsx`): Check `data.requiresTwoFactor`:
- If `true`: redirect to `/auth/2fa?token={data.tempToken}`
- If `false`: call `/api/auth/create-session` with `data.sessionToken` (existing behavior)

### 3.6 Login — Remaining Attempts in Error Response

**File:** `server/services/auth.service.ts` — `login()` function

**Current behavior:** Throws `AuthError("INVALID_CREDENTIALS", "Incorrect email or password")` with no attempt info.

**New behavior:** Include remaining attempts in error data:
```
const remaining = await incrementFailedAttempts(user.id);
throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password", 401, {
  attemptsRemaining: remaining,
  locked: remaining <= 0,
});
```

**File:** `server/services/rate-limit.service.ts` — `incrementFailedAttempts()`

Currently returns `MAX_ATTEMPTS - user.failedAttempts` which goes negative after lockout. **Fix:** clamp to `Math.max(0, MAX_ATTEMPTS - user.failedAttempts)` to avoid passing negative values to the frontend.

**File:** `server/trpc/routers/auth.ts` — `handleAuthError()`

Pass the `data` field through to TRPCError cause so frontend can read `attemptsRemaining`.

**File:** `app/auth/login/page.tsx`

Display: "Incorrect email or password — {attemptsRemaining} more attempt(s)" in FormBanner. When `locked: true`, redirect to `/auth/error/locked`.

### 3.7 Lock Page — Countdown Timer

**File:** `app/auth/error/locked/page.tsx`

**Current behavior:** Static page showing account is locked.

**New behavior:**
1. Accept `?until={timestamp}` query param (ISO string of `lockedUntil`). This timestamp comes from the login error response `data.lockedUntil` field (server-provided, not user-editable). The countdown is best-effort UI only — the actual lock is server-enforced via `isAccountLocked()`.
2. Display countdown timer: "Try again in {MM:SS}"
3. When timer reaches 0: show "Back to sign in" link
4. Also show "Reset Password" link at all times (per flow.md Flow B)

**Login error update:** When `locked: true`, the login error response should include `lockedUntil` timestamp from the server. The login page redirects to `/auth/error/locked?until={lockedUntil.toISOString()}`.

No new component file needed — inline the timer logic using `useState` + `useEffect` + `setInterval`.

### 3.8 2FA Failure Tracking

**File:** `server/services/auth.service.ts` — `verify2FA()` function

**Current behavior:** Throws error on wrong code, no counting.

**Approach:** Use a dedicated VerificationToken record to track 2FA attempts. This is reliable on Vercel serverless (no in-memory state), doesn't abuse the audit log for security enforcement, and uses an existing table.

**New behavior:**
1. On each failed 2FA verify, create a VerificationToken record: `{ type: "2fa_attempt", identifier: hashedTempToken, token: randomUUID(), expires: now + 5min }`
2. Before checking the code, count existing `2fa_attempt` records for this temp token: `WHERE type = '2fa_attempt' AND identifier = hashedTempToken AND used = false AND expires > NOW()`
3. If count >= 5: invalidate the `2fa_temp` token, throw `AuthError("2FA_LOCKED", "Too many failed attempts. Please log in again.", 423)`
4. Audit logging (`2FA_FAILED`) continues as before for observability — but is NOT used for enforcement.
5. Frontend: on `2FA_LOCKED` error, redirect to `/auth/error/2fa-locked`

**Cleanup:** 2FA attempt records auto-expire (5min). Existing token cleanup cron (if any) handles old records. No manual cleanup needed.

### 3.9 2FA Redirect Fix

**File:** `app/auth/2fa/page.tsx`

**Current behavior:** On success, goes to `/dashboard` directly.

**New behavior:** On success, go to `/auth/redirect` (which checks onboarding status and routes accordingly).

Same fix for `app/auth/2fa/backup/page.tsx`.

### 3.10 Password Reset Token Expiry Fix

**File:** `server/services/auth.service.ts` — `forgotPassword()` function

**Current:** `generateToken("password_reset", user.id, 30)` — 30 minutes.

**Fix:** Change to `generateToken("password_reset", user.id, 60)` — 1 hour per PRD.

### 3.11 Remember Me

**File:** `app/api/auth/create-session/route.ts`

**Current behavior:** Always sets `maxAge: 30 * 24 * 60 * 60` (30 days). The inline `createSessionSchema` (line 8 of route file) only accepts `sessionToken`.

**New behavior:** Add `rememberMe: z.boolean().optional().default(false)` to the inline `createSessionSchema` in the route file. (This schema stays inline — it's route-specific, not shared across modules, so moving it to `lib/validations/auth.ts` would be over-extraction.)
- If `rememberMe: true` → `maxAge: 30 * 24 * 60 * 60` (30 days)
- If `rememberMe: false` → omit `maxAge` (session cookie, expires on browser close)

**File:** `app/auth/login/page.tsx` — pass `rememberMe` to create-session fetch call body.

### 3.12 Session Limit Enforcement

**File:** `app/api/auth/create-session/route.ts`

**Gap:** The current route creates a JWT cookie but doesn't create a Session DB record. NextAuth with JWT strategy doesn't write to the Session table. For session limit enforcement AND the "Active Sessions" display in ACCT-3 (Settings > Security) to work, we need Session records.

**Session token storage:** Store a SHA-256 hash of the JWT as `sessionToken` in the Session table. This allows lookup/deletion without storing the raw JWT. The existing `Session.sessionToken` field is `@unique`, so the hash serves as the identifier.

**New behavior in `create-session/route.ts`**, after encoding the JWT:
1. Hash the JWT: `createHash('sha256').update(token).digest('hex')`
2. Create a `Session` record: `{ userId, sessionToken: hashedJWT, expires: now + maxAge, device: req.headers.get('user-agent'), ip: req.headers.get('x-forwarded-for') }`
3. Enforce limit using Prisma (two-step, PostgreSQL-compatible):
   ```typescript
   const sessions = await prisma.session.findMany({
     where: { userId, expires: { gt: new Date() } },
     orderBy: { createdAt: 'asc' },
     select: { id: true },
   });
   if (sessions.length > 10) {
     const toDelete = sessions.slice(0, sessions.length - 10).map(s => s.id);
     await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
   }
   ```
4. This also enables the "Active Sessions" display in ACCT-3 (Settings > Security)

**Logout impact:** The existing logout route does `session.deleteMany({ where: { userId } })` which still works — it deletes all Session records for the user. For single-session revocation (ACCT-3), the stored `sessionToken` hash can be matched.

### 3.13 Logout — Already Implemented

**File:** `app/api/auth/logout/route.ts`

**Current behavior (verified):** Already correct:
1. Decodes JWT to get userId
2. Deletes all Session DB records for user (`session.deleteMany`)
3. Clears cookie with `maxAge: 0`
4. Returns 200 with `{ success: true }`

**No changes needed.** The route already handles everything. PRD says 204 but 200 with body is acceptable and the frontend already expects JSON response.

---

## 4. Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `server/services/auth.service.ts` | Modify | Add `createWorkspaceForUser()` helper, signup transaction, magic link emailVerified+2FA, login attempts data, 2FA tracking via VerificationToken, password reset token 60min |
| `server/services/rate-limit.service.ts` | Modify | Clamp `incrementFailedAttempts` return to `Math.max(0, ...)` |
| `server/auth.config.ts` | Modify | OAuth: call `createWorkspaceForUser()`, isNewUser flag in JWT |
| `server/trpc/routers/auth.ts` | Modify | Invite rewrite (Invite table + protectedProcedure), declineInvite rewrite (Invite table), getInviteDetails query, magic link 2FA discriminated union return type, attempts in error |
| `app/api/auth/create-session/route.ts` | Modify | rememberMe in schema, session limit enforcement, Session DB record with hashed JWT |
| `app/auth/login/page.tsx` | Modify | Remaining attempts display, pass rememberMe, redirect to lock page with lockedUntil |
| `app/auth/page.tsx` | Modify | Social login callbackUrl → `/auth/redirect` |
| `app/auth/2fa/page.tsx` | Modify | Redirect to /auth/redirect, 2FA locked handling |
| `app/auth/2fa/backup/page.tsx` | Modify | Redirect to /auth/redirect |
| `app/auth/callback/page.tsx` | Modify | Handle requiresTwoFactor discriminated union from magic link |
| `app/auth/invite/page.tsx` | Modify | Fetch invite details, show workspace name/role, require auth for accept |
| `app/auth/error/locked/page.tsx` | Modify | Countdown timer from server-provided lockedUntil, reset password link |

### Files NOT Modified
- `app/api/auth/logout/route.ts` — already correct (cookie clearing + session deletion + audit log)
- `middleware.ts` — no changes needed
- `server/services/token.service.ts` — works correctly as-is
- `server/services/email.service.ts` — keep nodemailer for now, swap to Resend in later phase
- `prisma/schema.prisma` — all needed models already exist
- `lib/validations/auth.ts` — rememberMe schema stays inline in route file (route-specific)

---

## 5. Edge Cases

| Case | Handling |
|------|----------|
| Signup with existing email | Already handled — throws `EMAIL_EXISTS` (409) |
| Workspace slug collision | Append 4-char random suffix, retry up to 3 times. If still collides (near impossible), throw and let user retry signup. |
| Stripe Customer creation fails | Log warning, set `stripeCustomerId = null`, create on first billing action |
| OAuth user signs up with email that exists as credential user | Existing behavior: logs in as existing user (no duplicate). Workspace already exists. |
| Invite token used twice | Invite status set to `ACCEPTED` on first use. Second use: status check fails, return error |
| Invite for email that doesn't match logged-in user | Allow — invite is for workspace, not email-specific. User joins with their current account. Log mismatch in audit for observability. |
| 2FA tempToken expires mid-entry | Existing behavior: `validateToken` returns null, throws error. User redirected to login. |
| Magic link user has 2FA but no authenticator app anymore | Existing backup code flow handles this (Flow C → AUTH-04d) |
| Session limit: user has 11 sessions across devices | Oldest session deleted. That device will get redirected to login on next request. |

---

## 6. Out of Scope

- Email service migration (nodemailer → Resend) — separate task
- New email templates beyond existing 4 — separate task
- BroadcastChannel multi-tab sync (D-22) — Phase 5 polish
- Social auth linking (PRD Phase 2)
- Email change flow ACCT-5 (PRD Phase 2)
- Mobile responsive auth screens — Phase 5 polish
- Card shake animation on error — cosmetic, Phase 5
- Cookie consent — global feature, Phase 5
- Social-only user password handling (D-31) — Settings module phase

---

## 7. Success Criteria

1. New user signup creates User + Workspace + WorkspaceMember + OnboardingState in one transaction
2. OAuth signup creates the same set of records
3. After signup/OAuth, user is routed through onboarding (ONB-01) not directly to dashboard
4. Invite accept uses Invite table, respects invite.role and invite.siteIds
5. Invite page shows workspace name and inviter name
6. Magic link sets emailVerified and checks 2FA
7. Login error shows remaining attempts count
8. 2FA locks after 5 failed attempts within 5 minutes
9. Lock page shows countdown timer
10. Password reset token expires in 1 hour
11. Remember me controls cookie persistence
12. Session limit enforced at 10 active sessions
13. Logout clears cookie and session record
