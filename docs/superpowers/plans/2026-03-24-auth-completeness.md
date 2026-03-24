# Auth Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 8 auth flows (A-H) so signup/OAuth creates workspaces, invites use the correct table, magic link handles 2FA, and all error states work per PRD.

**Architecture:** Fix-in-place — surgical edits to 12 existing files. No new services, routers, or middleware. One new shared helper (`createWorkspaceForUser`) in `auth.service.ts` called from both signup and OAuth.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 5, NextAuth 5 (JWT), bcryptjs, otplib

**Spec:** `docs/superpowers/specs/2026-03-24-auth-completeness-design.md`

**Important:** Line numbers in this plan reference the **original** file state. After each task, line numbers in subsequent tasks are approximate — use the surrounding code context to locate edit points.

---

## Task 0: Prerequisite — AuditAction Type + tRPC Error Formatter

**Files:**
- Modify: `server/services/audit.service.ts`
- Modify: `server/trpc/trpc.ts`

- [ ] **Step 1: Add new audit actions to AuditAction type**

In `server/services/audit.service.ts`, replace the `AuditAction` type (lines 3-14) with:

```typescript
type AuditAction =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_LOCKED"
  | "SIGNUP" | "EMAIL_VERIFIED"
  | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED"
  | "MAGIC_LINK_REQUESTED" | "MAGIC_LINK_VERIFIED"
  | "2FA_VERIFIED" | "2FA_FAILED" | "2FA_LOCKED"
  | "BACKUP_CODE_USED" | "BACKUP_CODE_FAILED"
  | "INVITE_ACCEPTED" | "INVITE_DECLINED" | "INVITE_EMAIL_MISMATCH"
  | "SESSION_CREATED"
  | "OAUTH_LOGIN" | "OAUTH_SIGNUP"
  | "LOGOUT";
```

- [ ] **Step 2: Add tRPC error formatter to serialize `cause` to client**

In `server/trpc/trpc.ts`, update the `initTRPC` call (line 12-14) to include an error formatter:

```typescript
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        cause: error.cause instanceof Error ? undefined : error.cause,
      },
    };
  },
});
```

This serializes the `cause` field (which contains `attemptsRemaining`, `locked`, `lockedUntil` from AuthError.data) to the client. Only plain objects are passed through — Error instances are filtered out.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add server/services/audit.service.ts server/trpc/trpc.ts
git commit -m "chore(auth): add new AuditAction types, tRPC error formatter for cause data"
```

---

## Task 1: Workspace Creation Helper + Signup Fix (Flow D)

**Files:**
- Modify: `server/services/auth.service.ts`

- [ ] **Step 1: Add `generateUniqueSlug` and `createWorkspaceForUser` to auth.service.ts**

Add these after the existing `SAFE_USER_SELECT` constant (line 46), before the `login` function:

```typescript
import type { PrismaClient } from "@prisma/client";
type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "workspace";
}

async function generateUniqueSlug(tx: TxClient, name: string): Promise<string> {
  const base = generateSlug(name);
  const existing = await tx.workspace.findUnique({ where: { slug: base } });
  if (!existing) return base;

  for (let i = 0; i < 3; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`.slice(0, 35);
    const found = await tx.workspace.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
  }
  throw new AuthError("SLUG_COLLISION", "Unable to generate workspace URL. Please try again.", 500);
}

export async function createWorkspaceForUser(
  tx: TxClient,
  userId: string,
  fullName: string,
): Promise<{ workspaceId: string }> {
  const slug = await generateUniqueSlug(tx, fullName);
  const workspace = await tx.workspace.create({
    data: { name: `${fullName}'s Workspace`, slug, ownerId: userId },
  });
  await tx.workspaceMember.create({
    data: { userId, workspaceId: workspace.id, role: "OWNER" },
  });
  await tx.onboardingState.create({ data: { userId } });
  return { workspaceId: workspace.id };
}
```

- [ ] **Step 2: Rewrite `signup()` to use transaction with workspace creation**

Replace the current `signup` function (lines 83-106) with:

```typescript
export async function signup(fullName: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new AuthError("EMAIL_EXISTS", "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { user, workspaceId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { fullName, email, passwordHash },
      select: SAFE_USER_SELECT,
    });
    const { workspaceId } = await createWorkspaceForUser(tx, user.id, fullName);
    return { user, workspaceId };
  });

  await logAuditEvent("SIGNUP", "success", { userId: user.id, email, workspaceId });

  const token = await generateToken("email_verify", user.id, 60 * 24); // 24h
  try {
    await sendVerificationEmail(email, token);
  } catch {
    // User is created but email failed — let them resend verification later.
  }

  return user;
}
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors

- [ ] **Step 4: Commit**

```bash
git add server/services/auth.service.ts
git commit -m "feat(auth): add createWorkspaceForUser helper, wire signup transaction

Signup now creates User + Workspace + WorkspaceMember + OnboardingState
in a single Prisma transaction. Fixes Flow D (broken signup → onboarding)."
```

---

## Task 2: OAuth Workspace Creation (Flow G)

**Files:**
- Modify: `server/auth.config.ts`

- [ ] **Step 1: Import `createWorkspaceForUser` and wrap OAuth user creation in transaction**

Replace the `signIn` callback (lines 49-72) with:

```typescript
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      // OAuth: create user + workspace if not exists
      if (account && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          const created = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email: user.email!,
                fullName: user.name || user.email!,
                provider: account.provider,
                emailVerified: new Date(),
              },
            });
            await createWorkspaceForUser(tx, newUser.id, newUser.fullName);
            return newUser;
          });
          user.id = created.id;
          await logAuditEvent("OAUTH_SIGNUP", "success", { userId: created.id, email: user.email });
        } else {
          user.id = existing.id;
          await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
          await logAuditEvent("OAUTH_LOGIN", "success", { userId: existing.id, email: user.email });
        }
      }
      return true;
    },
```

Add import at the top of the file:
```typescript
import { createWorkspaceForUser } from "@/server/services/auth.service";
```

- [ ] **Step 2: Detect new OAuth user in JWT callback via OnboardingState**

Instead of an `isNewUser` flag (which requires `as any`), the redirect page already checks onboarding status via `useOnboardingFlow` hook. No JWT changes needed — the existing `/auth/redirect` page handles routing new vs existing users. The only change is the `callbackUrl` fix in steps 3-4 below.

- [ ] **Step 3: Fix social login callbackUrl in `app/auth/page.tsx`**

Change `callbackUrl: "/dashboard"` to `callbackUrl: "/auth/redirect"` in both SocialButton onClick handlers in `app/auth/page.tsx` (lines 44, 48).

- [ ] **Step 4: Fix social login callbackUrl in `app/auth/login/page.tsx`**

Change `callbackUrl: "/dashboard"` to `callbackUrl: "/auth/redirect"` in both SocialButton onClick handlers (lines 133, 137).

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add server/auth.config.ts app/auth/page.tsx app/auth/login/page.tsx
git commit -m "feat(auth): create workspace on OAuth signup, fix social callbackUrl

OAuth new users now get Workspace + WorkspaceMember + OnboardingState
via transaction. Social login redirects through /auth/redirect for
onboarding check. Fixes Flow G."
```

---

## Task 3: Invite Accept Rewrite (Flow H)

**Files:**
- Modify: `server/trpc/routers/auth.ts`

- [ ] **Step 1: Add `getInviteDetails` public query**

Add before `acceptInvite` in the authRouter (after line 155):

```typescript
  getInviteDetails: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({
        where: { token: input.token },
        include: { workspace: { select: { name: true } } },
      });
      if (!invite) {
        return { found: false as const };
      }
      // Resolve inviter name from userId stored in invitedBy
      const inviter = await ctx.prisma.user.findUnique({
        where: { id: invite.invitedBy },
        select: { fullName: true },
      });
      return {
        found: true as const,
        workspaceName: invite.workspace.name,
        inviterName: inviter?.fullName ?? "A team member",
        role: invite.role,
        expired: invite.status !== "PENDING" || invite.expiresAt < new Date(),
      };
    }),
```

- [ ] **Step 2: Rewrite `acceptInvite` to use Invite table with protectedProcedure**

Replace the existing `acceptInvite` (lines 157-177) with:

```typescript
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({
        where: { token: input.token },
        include: { workspace: { select: { name: true } } },
      });
      if (!invite || invite.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found or already used" });
      }
      if (invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite has expired" });
      }

      const userId = ctx.session.user.id;
      const existing = await ctx.prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of this workspace" });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const member = await tx.workspaceMember.create({
          data: { userId, workspaceId: invite.workspaceId, role: invite.role, invitedBy: invite.invitedBy },
        });
        if (invite.siteIds.length > 0) {
          await tx.sitePermission.createMany({
            data: invite.siteIds.map((siteId) => ({
              memberId: member.id,
              siteId,
              roleOverride: invite.role,
              grantedBy: invite.invitedBy,
            })),
          });
        }
        await tx.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
      });

      if (invite.email !== ctx.session.user.email) {
        await logAuditEvent("INVITE_EMAIL_MISMATCH", "success", {
          userId, metadata: { inviteEmail: invite.email, userEmail: ctx.session.user.email },
        });
      }
      await logAuditEvent("INVITE_ACCEPTED", "success", { userId, metadata: { workspaceId: invite.workspaceId } });
      return { success: true, workspaceId: invite.workspaceId, workspaceName: invite.workspace.name };
    }),
```

- [ ] **Step 3: Rewrite `declineInvite` to use Invite table**

Replace the existing `declineInvite` (lines 179-185) with:

```typescript
  declineInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({ where: { token: input.token } });
      if (invite && invite.status === "PENDING") {
        await ctx.prisma.invite.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
      }
      await logAuditEvent("INVITE_DECLINED", "success");
      return { message: "Invite declined" };
    }),
```

- [ ] **Step 4: Clean up token service imports**

Update import at line 13 — `login` mutation still uses `generateToken`, but `validateToken` and `invalidateToken` were only used by the old invite code. Change to:

```typescript
import { generateToken } from "@/server/services/token.service";
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add server/trpc/routers/auth.ts
git commit -m "feat(auth): rewrite invite accept/decline to use Invite table

acceptInvite now queries Invite table directly, respects invite.role
and siteIds, creates SitePermission records. declineInvite updates
invite status. Added getInviteDetails public query. Fixes Flow H."
```

---

## Task 4: Invite Page — Show Workspace Details (Flow H Frontend)

**Files:**
- Modify: `app/auth/invite/page.tsx`

- [ ] **Step 1: Rewrite invite page to fetch and display invite details**

Replace the entire file content with:

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthButtonSecondary } from "@/components/auth/auth-button-secondary";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@/lib/trpc/client";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const inviteQuery = trpc.auth.getInviteDetails.useQuery(
    { token },
    { enabled: !!token },
  );

  const acceptMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      // If user is not authenticated, redirect to login with return URL
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(`/auth/invite?token=${token}`)}`);
        return;
      }
      setError(err.message);
    },
  });

  const declineMutation = trpc.auth.declineInvite.useMutation({
    onSuccess: () => router.push("/auth/login"),
    onError: (err) => setError(err.message),
  });

  if (inviteQuery.isLoading) {
    return (
      <AuthCard>
        <AuthLogo />
        <p className="text-auth-subtitle text-auth-text-muted text-center">Loading invitation...</p>
      </AuthCard>
    );
  }

  if (!inviteQuery.data?.found) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">Invitation not found</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">This invite link is invalid.</p>
        <div className="h-6" />
        <Link href="/auth/login" className="text-auth-link hover:underline">← Back to sign in</Link>
      </AuthCard>
    );
  }

  const invite = inviteQuery.data;

  if (invite.expired) {
    router.push("/auth/error/invite-expired");
    return null;
  }

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title font-semibold text-center">You&apos;ve been invited</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Join <strong>{invite.workspaceName}</strong> as {invite.role}
      </p>
      <p className="text-sm text-auth-text-muted text-center mt-1">
        Invited by {invite.inviterName}
      </p>
      <div className="h-6" />
      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}
      <AuthButton
        loading={acceptMutation.isPending}
        onClick={() => acceptMutation.mutate({ token })}
      >
        Accept Invitation
      </AuthButton>
      <div className="h-3" />
      <AuthButtonSecondary
        disabled={declineMutation.isPending}
        onClick={() => declineMutation.mutate({ token })}
      >
        Decline
      </AuthButtonSecondary>
      <div className="h-4" />
      <Link href="/auth/login" className="text-auth-link text-sm hover:underline">← Back to sign in</Link>
    </AuthCard>
  );
}

export default function InvitePage() {
  return <Suspense fallback={null}><InviteContent /></Suspense>;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/auth/invite/page.tsx
git commit -m "feat(auth): invite page shows workspace name, role, and inviter

Fetches invite details via getInviteDetails query. Routes unauthenticated
users to login with returnUrl. Fixes Flow H frontend."
```

---

## Task 5: Magic Link — emailVerified + 2FA (Flow F)

**Files:**
- Modify: `server/services/auth.service.ts`
- Modify: `server/trpc/routers/auth.ts`
- Modify: `app/auth/callback/page.tsx`

- [ ] **Step 1: Fix `verifyMagicLink()` in auth.service.ts**

Replace the existing `verifyMagicLink` function (lines 175-184) with:

```typescript
export async function verifyMagicLink(token: string) {
  const userId = await validateToken(token, "magic_link");
  if (!userId) {
    throw new AuthError("TOKEN_EXPIRED", "Magic link expired", 410);
  }

  await invalidateToken(token);

  // Set emailVerified if not already set
  await prisma.user.updateMany({
    where: { id: userId, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  // Check if 2FA is enabled
  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (internal?.twoFactorEnabled) {
    const tempToken = await generateToken("2fa_temp", userId, 5);
    return { requiresTwoFactor: true as const, tempToken, userId };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  return { requiresTwoFactor: false as const, user: user! };
}
```

- [ ] **Step 2: Update `verifyMagicLink` router handler in auth.ts**

Replace the existing `verifyMagicLink` mutation (lines 106-118) with:

```typescript
  verifyMagicLink: strictRateLimit
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyMagicLink(input.token);
        if (result.requiresTwoFactor) {
          return { requiresTwoFactor: true as const, tempToken: result.tempToken };
        }
        const sessionToken = await generateToken("session_grant", result.user.id, 5);
        await logAuditEvent("MAGIC_LINK_VERIFIED", "success", { userId: result.user.id, email: result.user.email });
        return { requiresTwoFactor: false as const, sessionToken, user: { id: result.user.id, email: result.user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),
```

- [ ] **Step 3: Update callback page to handle 2FA redirect**

Replace the `verifyMutation` in `app/auth/callback/page.tsx` (lines 18-31) with:

```typescript
  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        router.push(`/auth/2fa?token=${data.tempToken}`);
        return;
      }
      const res = await fetch("/api/auth/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken }),
      });
      if (res.ok) {
        router.push("/auth/redirect");
      } else {
        setError("Failed to create session");
      }
    },
    onError: (err) => setError(err.message),
  });
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add server/services/auth.service.ts server/trpc/routers/auth.ts app/auth/callback/page.tsx
git commit -m "feat(auth): magic link sets emailVerified and handles 2FA

verifyMagicLink now sets emailVerified on first use and checks
twoFactorEnabled. Returns discriminated union for frontend routing.
Callback page redirects to 2FA if needed. Fixes Flow F."
```

---

## Task 6: Login Remaining Attempts + Lock Timer (Flows B)

**Files:**
- Modify: `server/services/auth.service.ts`
- Modify: `server/services/rate-limit.service.ts`
- Modify: `app/auth/login/page.tsx`
- Modify: `app/auth/error/locked/page.tsx`

- [ ] **Step 1: Clamp return in `incrementFailedAttempts`**

In `server/services/rate-limit.service.ts`, change line 31 from:
```typescript
  return MAX_ATTEMPTS - user.failedAttempts;
```
to:
```typescript
  return Math.max(0, MAX_ATTEMPTS - user.failedAttempts);
```

- [ ] **Step 2: Update `login()` to include attempts data in error**

In `server/services/auth.service.ts`, replace lines 61-67 with:

```typescript
  if (!user || !user.passwordHash || !valid) {
    if (user) {
      const remaining = await incrementFailedAttempts(user.id);
      await logAuditEvent("LOGIN_FAILED", "failure", { email, metadata: { attemptsRemaining: remaining } });
      const lockedUser = remaining <= 0
        ? await prisma.user.findUnique({ where: { id: user.id }, select: { lockedUntil: true } })
        : null;
      throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password", 401, {
        attemptsRemaining: remaining,
        locked: remaining <= 0,
        lockedUntil: lockedUser?.lockedUntil?.toISOString() ?? null,
      });
    }
    await logAuditEvent("LOGIN_FAILED", "failure", { email });
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
  }
```

- [ ] **Step 3: Update login page to show remaining attempts and redirect on lock**

In `app/auth/login/page.tsx`, replace the `onError` handler (lines 40-42) with:

```typescript
    onError: (err) => {
      // cause is serialized by the tRPC error formatter (added in Task 0)
      const cause = (err.data as any)?.cause as { attemptsRemaining?: number; locked?: boolean; lockedUntil?: string } | undefined;
      if (cause?.locked && cause.lockedUntil) {
        router.push(`/auth/error/locked?until=${encodeURIComponent(cause.lockedUntil)}`);
        return;
      }
      if (cause?.attemptsRemaining !== undefined && cause.attemptsRemaining > 0) {
        setError(`Incorrect email or password — ${cause.attemptsRemaining} more attempt${cause.attemptsRemaining === 1 ? "" : "s"}`);
      } else {
        setError(err.message);
      }
    },
```

Also change the login success redirect (line 34) from `router.push("/dashboard")` to `router.push("/auth/redirect")`.

- [ ] **Step 4: Rewrite lock page with countdown timer**

Replace the entire `app/auth/error/locked/page.tsx` with:

```tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";

function LockedContent() {
  const searchParams = useSearchParams();
  const until = searchParams.get("until");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!until) { setExpired(true); return; }
    const target = new Date(until).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) setExpired(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  const mins = remaining !== null ? Math.floor(remaining / 60) : 0;
  const secs = remaining !== null ? remaining % 60 : 0;

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="lock" color="red" />
      <h1 className="text-auth-title text-auth-text-primary text-center">Account locked</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Too many failed attempts.
        {!expired && remaining !== null && (
          <> Try again in <strong>{mins}:{secs.toString().padStart(2, "0")}</strong></>
        )}
      </p>
      <div className="h-4" />
      {expired && (
        <Link href="/auth/login" className="text-auth-link hover:underline text-center block font-semibold mb-3">
          Back to sign in
        </Link>
      )}
      <Link href="/auth/forgot-password" className="text-auth-link hover:underline text-center block">
        Reset your password
      </Link>
      <div className="h-3" />
      <Link href="mailto:support@buildrik.com" className="text-auth-link hover:underline text-center block">
        Contact support
      </Link>
    </AuthCard>
  );
}

export default function AccountLockedPage() {
  return <Suspense fallback={null}><LockedContent /></Suspense>;
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add server/services/auth.service.ts server/services/rate-limit.service.ts app/auth/login/page.tsx app/auth/error/locked/page.tsx
git commit -m "feat(auth): login shows remaining attempts, lock page has countdown

Login error now includes attemptsRemaining and lockedUntil. Lock page
shows live countdown timer and reset password link. Fixes Flow B."
```

---

## Task 7: 2FA Failure Tracking + Redirect Fix (Flow C)

**Files:**
- Modify: `server/services/auth.service.ts`
- Modify: `app/auth/2fa/page.tsx`
- Modify: `app/auth/2fa/backup/page.tsx`

- [ ] **Step 1: Add 2FA attempt tracking to `verify2FA()` in auth.service.ts**

Replace the existing `verify2FA` function (lines 186-220) with:

```typescript
export async function verify2FA(tempToken: string, code: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  // Check 2FA attempt count (using VerificationToken as counter)
  const hashedTemp = createHash("sha256").update(tempToken).digest("hex");
  const attemptCount = await prisma.verificationToken.count({
    where: { type: "2fa_attempt", identifier: hashedTemp, used: false, expires: { gt: new Date() } },
  });
  if (attemptCount >= 5) {
    await invalidateToken(tempToken);
    await logAuditEvent("2FA_LOCKED", "failure", { userId });
    throw new AuthError("2FA_LOCKED", "Too many failed attempts. Please log in again.", 423);
  }

  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!internal?.twoFactorSecret) {
    throw new AuthError("INVALID_2FA_CODE", "2FA not configured", 401);
  }

  let secret: string;
  try {
    secret = internal.twoFactorSecret.includes(':')
      ? decryptSecret(internal.twoFactorSecret)
      : internal.twoFactorSecret;
  } catch {
    throw new AuthError("INVALID_2FA_CODE", "Invalid 2FA configuration", 401);
  }
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) {
    // Record failed attempt
    await prisma.verificationToken.create({
      data: {
        identifier: hashedTemp,
        token: randomUUID(),
        type: "2fa_attempt",
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    await logAuditEvent("2FA_FAILED", "failure", { userId });
    throw new AuthError("INVALID_2FA_CODE", "Invalid code", 401);
  }

  await invalidateToken(tempToken);
  await logAuditEvent("2FA_VERIFIED", "success", { userId });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
  return user;
}
```

Add `createHash` to the existing crypto import (line 4):
```typescript
import { createCipheriv, createDecipheriv, randomBytes, createHash, randomUUID } from "crypto";
```

- [ ] **Step 2: Fix 2FA page redirect to `/auth/redirect`**

In `app/auth/2fa/page.tsx`, change the `onSuccess` handler (line 26-35) — replace `router.push("/dashboard")` with `router.push("/auth/redirect")`.

Also add 2FA locked error handling:

```typescript
    onError: (err) => {
      if (err.message.includes("Too many failed attempts")) {
        router.push("/auth/error/2fa-locked");
        return;
      }
      setError(err.message);
    },
```

- [ ] **Step 3: Fix backup code page redirect to `/auth/redirect`**

In `app/auth/2fa/backup/page.tsx`, change line 31 from `router.push("/dashboard")` to `router.push("/auth/redirect")`.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add server/services/auth.service.ts app/auth/2fa/page.tsx app/auth/2fa/backup/page.tsx
git commit -m "feat(auth): 2FA tracks failed attempts, locks after 5, fix redirect

2FA now records attempt count via VerificationToken. Locks after 5
failures. 2FA/backup pages redirect through /auth/redirect for
onboarding check. Fixes Flow C."
```

---

## Task 8: Password Reset Token Fix (Flow E)

**Files:**
- Modify: `server/services/auth.service.ts`

- [ ] **Step 1: Change password reset token expiry from 30min to 60min**

In `server/services/auth.service.ts`, change line 142 from:
```typescript
  const token = await generateToken("password_reset", user.id, 30); // 30min
```
to:
```typescript
  const token = await generateToken("password_reset", user.id, 60); // 1 hour per PRD
```

- [ ] **Step 2: Commit**

```bash
git add server/services/auth.service.ts
git commit -m "fix(auth): password reset token expiry 30min → 1hr per PRD"
```

---

## Task 9: Remember Me + Session Limit (Flows A, cross-cutting)

**Files:**
- Modify: `app/api/auth/create-session/route.ts`
- Modify: `app/auth/login/page.tsx`

- [ ] **Step 1: Update create-session route with rememberMe, Session record, and session limit**

Replace the entire `app/api/auth/create-session/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { validateToken, invalidateToken } from "@/server/services/token.service";
import { encode } from "next-auth/jwt";
import { logAuditEvent } from "@/server/services/audit.service";

const createSessionSchema = z.object({
  sessionToken: z.string().uuid(),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sessionToken, rememberMe } = parsed.data;

  // CSRF: verify request comes from same origin
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (origin && !origin.startsWith(appUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!origin && referer && !referer.startsWith(appUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = await validateToken(sessionToken, "session_grant");
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await invalidateToken(sessionToken);

  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined; // 30 days or session

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      userId: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: cookieName,
  });

  // Create Session DB record for session management + active sessions display
  const hashedJWT = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + (maxAge ?? 24 * 60 * 60) * 1000); // default 1 day for session cookies
  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: hashedJWT,
      expires,
      device: req.headers.get("user-agent") ?? undefined,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      current: true,
    },
  });

  // Enforce session limit: max 10 active sessions
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expires: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (sessions.length > 10) {
    const toDelete = sessions.slice(0, sessions.length - 10).map((s) => s.id);
    await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
  }

  await logAuditEvent("SESSION_CREATED", "success", { userId: user.id, email: user.email });

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  });

  return response;
}
```

- [ ] **Step 2: Pass rememberMe in login page fetch call**

In `app/auth/login/page.tsx`, update the create-session fetch body (line 31) from:
```typescript
          body: JSON.stringify({ sessionToken: data.sessionToken }),
```
to:
```typescript
          body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe }),
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/create-session/route.ts app/auth/login/page.tsx
git commit -m "feat(auth): remember me, session DB records, 10-session limit

create-session now accepts rememberMe (controls cookie maxAge),
creates Session DB record with hashed JWT, and enforces max 10
active sessions per user. Fixes Flows A + D-12 audit item."
```

---

## Task 10: Final Verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Verify all files are saved and committed**

Run: `git status`
Expected: clean working tree

- [ ] **Step 3: Verify the auth flows are logically complete by tracing each flow:**

| Flow | Key files touched | Expected path |
|------|-------------------|---------------|
| A Login | login page → create-session (rememberMe) → /auth/redirect | Done |
| B Error/Lock | login page → error with attempts → /auth/error/locked (timer) | Done |
| C 2FA | 2fa page → verify2FA (attempt tracking) → /auth/redirect | Done |
| D Signup | signup → transaction (user+workspace) → verify email → redirect | Done |
| E ForgotPw | forgotPassword → 60min token → reset → login | Done |
| F Magic Link | magic link → verifyMagicLink (emailVerified+2FA check) → redirect | Done |
| G OAuth | auth.config signIn → transaction (user+workspace) → /auth/redirect | Done |
| H Invite | invite page (details) → acceptInvite (Invite table) → dashboard | Done |
