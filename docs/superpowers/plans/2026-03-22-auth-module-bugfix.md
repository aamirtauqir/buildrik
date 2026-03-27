# Auth Module Bugfix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all auth flows so users can actually sign up, log in, verify email, reset password, use magic links, complete 2FA, and accept invites — with real session management.

**Architecture:** The core problem is that tRPC mutations validate credentials but never create NextAuth sessions. The fix: wire NextAuth's Credentials provider `authorize()` to the existing `login()` service, then use NextAuth's `signIn("credentials")` from the client instead of raw tRPC mutations for login. For magic link and 2FA, add server-side session creation via NextAuth's `signIn()` server action. Keep tRPC for non-session mutations (signup, forgot-password, verify-email, invite).

**Tech Stack:** Next.js 16, React 19, NextAuth 5 (beta.30), tRPC 11, Prisma 5, Nodemailer

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/auth.config.ts` | Modify | Wire Credentials authorize() to auth.service.login() |
| `server/auth.ts` | Read only | Already exports signIn, signOut, auth |
| `server/services/auth.service.ts` | Modify | Add try-catch to resendVerification email, fix login return type |
| `server/trpc/routers/auth.ts` | Modify | Implement acceptInvite/declineInvite, wire resend handlers |
| `app/auth/login/page.tsx` | Modify | Use NextAuth signIn("credentials") instead of tRPC |
| `app/auth/callback/page.tsx` | Modify | Process magic link token → create session → redirect |
| `app/auth/2fa/page.tsx` | Modify | After verify, call session creation endpoint |
| `app/auth/2fa/backup/page.tsx` | Modify | Same — session creation after backup code verify |
| `app/auth/magic-link/page.tsx` | Modify | Convert to magic link request page (enter email) |
| `app/auth/magic-link/check/page.tsx` | Create | "Check inbox" page for magic link (moved from current magic-link) |
| `app/auth/reset-password/page.tsx` | Modify | Remove hardcoded email, add token guard |
| `app/auth/invite/page.tsx` | Modify | Fetch invite details from token, remove hardcoded data |
| `app/auth/check-inbox/page.tsx` | Modify | Wire resend handler to tRPC |
| `app/auth/otp/page.tsx` | Modify | Wire resend handler |
| `app/api/auth/session/route.ts` | Create | Server-side session creation endpoint for 2FA/magic-link flows |
| `emails/verify-email.tsx` | Read only | Already correct |

---

## Task 1: Wire NextAuth Credentials Provider to Login Service

> **Why first:** This is the foundation — nothing else works without sessions.

**Files:**
- Modify: `server/auth.config.ts:16-27`
- Modify: `server/services/auth.service.ts:8-38`

- [ ] **Step 1: Update Credentials authorize() to call login service**

```ts
// server/auth.config.ts — replace the Credentials provider block
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    const email = credentials.email as string;
    const password = credentials.password as string;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    if (user.lockedUntil && user.lockedUntil > new Date()) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // Return user object for NextAuth session
    return { id: user.id, email: user.email, name: user.fullName };
  },
}),
```

Note: Rate limiting and 2FA checks stay in the tRPC login mutation — authorize() only handles basic credential validation for NextAuth session creation.

- [ ] **Step 2: Verify auth.config.ts has proper imports**

Add at top of `server/auth.config.ts`:
```ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
```

- [ ] **Step 3: Commit**

```bash
git add server/auth.config.ts
git commit -m "feat: wire NextAuth Credentials provider to database"
```

---

## Task 2: Fix Login Page — Use NextAuth signIn()

> **Depends on:** Task 1

**Files:**
- Modify: `app/auth/login/page.tsx`

- [ ] **Step 1: Rewrite login page to use NextAuth + tRPC hybrid**

The flow: first call tRPC `auth.login` to check rate-limiting and 2FA, then if successful (no 2FA), call NextAuth `signIn("credentials")` to create session.

```tsx
// app/auth/login/page.tsx — key changes in handleSubmit and imports
import { signIn } from "next-auth/react";

const loginMutation = trpc.auth.login.useMutation({
  onSuccess: async (data) => {
    if (data.requiresTwoFactor) {
      router.push(`/auth/2fa?token=${data.tempToken}`);
      return;
    }
    // Create actual NextAuth session
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Authentication failed");
    } else {
      router.push("/dashboard");
    }
  },
  onError: (err) => {
    setError(err.message);
  },
});
```

- [ ] **Step 2: Add SessionProvider to root layout**

`app/layout.tsx` needs `SessionProvider` from `next-auth/react`:
```tsx
import { SessionProvider } from "next-auth/react";

// Wrap children:
<SessionProvider>
  <TRPCProvider>{children}</TRPCProvider>
</SessionProvider>
```

Note: `SessionProvider` is a client component. Since `TRPCProvider` already has `"use client"`, wrap `SessionProvider` inside the same client boundary.

- [ ] **Step 3: Test manually**

1. Start dev server: `npm run dev`
2. Go to `/auth/signup`, create account
3. Verify email via Mailtrap link
4. Go to `/auth/login`, enter credentials
5. Verify: redirected to `/dashboard` (not kicked back to login)
6. Check: `next-auth.session-token` cookie exists in browser

- [ ] **Step 4: Commit**

```bash
git add app/auth/login/page.tsx app/layout.tsx
git commit -m "feat: login creates NextAuth session via signIn(credentials)"
```

---

## Task 3: Create Session Endpoint for 2FA and Magic Link Flows

> **Why:** 2FA and magic link verify tokens server-side via tRPC but need to create sessions afterward. We need a server-side endpoint that creates a session given a verified userId.

**Files:**
- Create: `app/api/auth/session/route.ts`
- Modify: `server/services/auth.service.ts`

- [ ] **Step 1: Create session creation API route**

```ts
// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/server/auth";
import { validateToken, invalidateToken } from "@/server/services/token.service";

export async function POST(req: NextRequest) {
  const { sessionToken } = await req.json();

  // Validate the one-time session token
  const userId = await validateToken(sessionToken, "session_grant");
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  await invalidateToken(sessionToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create session via NextAuth signIn
  // Note: In NextAuth 5, server-side signIn returns headers with session cookie
  await signIn("credentials", {
    email: user.email,
    password: "__session_grant__", // Special marker
    redirect: false,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Update Credentials authorize() to handle session grants**

In `server/auth.config.ts`, update authorize to handle the `__session_grant__` flow:

```ts
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;

  const email = credentials.email as string;
  const password = credentials.password as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  // Session grant flow (from 2FA/magic-link completion)
  if (password === "__session_grant__") {
    return { id: user.id, email: user.email, name: user.fullName };
  }

  // Normal password flow
  if (!user.passwordHash) return null;
  if (user.lockedUntil && user.lockedUntil > new Date()) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.fullName };
}
```

- [ ] **Step 3: Add session_grant to token service types**

In `server/services/token.service.ts`, add `"session_grant"` to the type union:
```ts
type: "email_verify" | "password_reset" | "magic_link" | "invite" | "2fa_temp" | "session_grant",
```

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/session/route.ts server/auth.config.ts server/services/token.service.ts
git commit -m "feat: add session creation endpoint for 2FA and magic-link flows"
```

---

## Task 4: Fix 2FA Flow — Create Session After Verification

> **Depends on:** Task 3

**Files:**
- Modify: `server/trpc/routers/auth.ts` (verify2FA, verifyBackupCode mutations)
- Modify: `app/auth/2fa/page.tsx`
- Modify: `app/auth/2fa/backup/page.tsx`

- [ ] **Step 1: Update verify2FA and verifyBackupCode to return session grant tokens**

In `server/trpc/routers/auth.ts`:
```ts
// Import generateToken
import { generateToken } from "@/server/services/token.service";

// verify2FA mutation — after successful verify, generate session grant
verify2FA: publicProcedure
  .input(z.object({ twoFactorToken: z.string().min(1), code: z.string().length(6) }))
  .mutation(async ({ input }) => {
    try {
      const user = await verify2FA(input.twoFactorToken, input.code);
      const sessionToken = await generateToken("session_grant", user.id, 5); // 5 min
      return { success: true, sessionToken, user: { id: user.id, email: user.email } };
    } catch (err) {
      handleAuthError(err);
    }
  }),

// Same pattern for verifyBackupCode
verifyBackupCode: publicProcedure
  .input(z.object({ twoFactorToken: z.string().min(1), backupCode: z.string().min(1) }))
  .mutation(async ({ input }) => {
    try {
      const result = await verifyBackupCode(input.twoFactorToken, input.backupCode);
      const sessionToken = await generateToken("session_grant", result.user.id, 5);
      return {
        success: true,
        sessionToken,
        user: { id: result.user.id, email: result.user.email },
        backupCodesRemaining: result.backupCodesRemaining,
      };
    } catch (err) {
      handleAuthError(err);
    }
  }),
```

- [ ] **Step 2: Update 2FA page to create session after verify**

In `app/auth/2fa/page.tsx`:
```tsx
const verify2FAMutation = trpc.auth.verify2FA.useMutation({
  onSuccess: async (data) => {
    // Create actual session
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: data.sessionToken }),
    });
    if (res.ok) {
      router.push("/dashboard");
    }
  },
});
```

- [ ] **Step 3: Update backup code page similarly**

Same pattern in `app/auth/2fa/backup/page.tsx`.

- [ ] **Step 4: Test manually**

1. Enable 2FA for a test user (manual DB update for now)
2. Login → should redirect to 2FA page
3. Enter code → should create session → redirect to dashboard
4. Verify session cookie exists

- [ ] **Step 5: Commit**

```bash
git add server/trpc/routers/auth.ts app/auth/2fa/page.tsx app/auth/2fa/backup/page.tsx
git commit -m "feat: 2FA and backup code flows create sessions after verification"
```

---

## Task 5: Fix Magic Link Flow — Request Page + Callback Verification

> **Depends on:** Task 3

**Files:**
- Modify: `app/auth/magic-link/page.tsx` (convert to request page)
- Create: `app/auth/magic-link/sent/page.tsx` (check inbox page)
- Modify: `app/auth/callback/page.tsx` (process magic link token)
- Modify: `server/trpc/routers/auth.ts` (verifyMagicLink returns session grant)

- [ ] **Step 1: Convert magic-link page to email entry form**

```tsx
// app/auth/magic-link/page.tsx — replace entire content
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { trpc } from "@/lib/trpc/client";

export default function MagicLinkRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const magicLinkMutation = trpc.auth.magicLink.useMutation({
    onSuccess: () => {
      router.push(`/auth/magic-link/sent?email=${encodeURIComponent(email)}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    magicLinkMutation.mutate({ email });
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title text-auth-text-primary text-center">
        Sign in with magic link
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        We'll send you a link to sign in without a password
      </p>
      <div className="h-6" />
      <form onSubmit={handleSubmit} className="w-full">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="h-5" />
        <AuthButton type="submit" loading={magicLinkMutation.isPending}>
          Send Magic Link
        </AuthButton>
      </form>
      <div className="h-4" />
      <Link href="/auth/login" className="text-auth-label text-auth-link hover:underline text-center block">
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
```

- [ ] **Step 2: Create "magic link sent" page**

```tsx
// app/auth/magic-link/sent/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@/lib/trpc/client";

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const resendMutation = trpc.auth.magicLink.useMutation();

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title text-auth-text-primary text-center">Check your email</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        We sent a magic link to {email || "your email"}. Click the link to sign in. Link expires in 15 minutes.
      </p>
      <div className="h-6" />
      <a href="mailto:" className="w-full">
        <AuthButton type="button">Open Email App</AuthButton>
      </a>
      <div className="h-4" />
      <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />
      <div className="h-3" />
      <Link href="/auth/login" className="text-auth-link hover:underline text-center block">
        Use password instead
      </Link>
      <div className="h-2" />
      <Link href="/auth/login" className="text-auth-label text-auth-link hover:underline text-center block">
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}

export default function MagicLinkSentPage() {
  return <Suspense fallback={null}><MagicLinkSentContent /></Suspense>;
}
```

- [ ] **Step 3: Update verifyMagicLink mutation to return session grant**

In `server/trpc/routers/auth.ts`:
```ts
verifyMagicLink: publicProcedure
  .input(z.object({ token: z.string().min(1) }))
  .mutation(async ({ input }) => {
    try {
      const user = await verifyMagicLink(input.token);
      if (!user) throw new AuthError("TOKEN_EXPIRED", "Magic link expired", 410);
      const sessionToken = await generateToken("session_grant", user.id, 5);
      return { success: true, sessionToken, user: { id: user.id, email: user.email } };
    } catch (err) {
      handleAuthError(err);
    }
  }),
```

- [ ] **Step 4: Fix callback page to process magic link token**

```tsx
// app/auth/callback/page.tsx — replace entire content
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: async (data) => {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Failed to create session");
      }
    },
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">Link expired</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">{error}</p>
        <div className="h-6" />
        <AuthButton onClick={() => router.push("/auth/magic-link")}>Request New Link</AuthButton>
        <div className="h-3" />
        <a href="/auth/login" className="text-auth-label text-auth-link hover:underline text-center block">
          ← Back to sign in
        </a>
      </AuthCard>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AuthLogo />
      <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
      <p className="text-auth-subtitle text-auth-text-muted">Completing sign in...</p>
    </div>
  );
}

export default function CallbackPage() {
  return <Suspense fallback={null}><CallbackContent /></Suspense>;
}
```

- [ ] **Step 5: Commit**

```bash
git add app/auth/magic-link/page.tsx app/auth/magic-link/sent/page.tsx app/auth/callback/page.tsx server/trpc/routers/auth.ts
git commit -m "feat: complete magic link flow — request, send, verify, create session"
```

---

## Task 6: Fix Reset Password Page — Remove Hardcoded Text, Add Token Guard

**Files:**
- Modify: `app/auth/reset-password/page.tsx:69-72,19`

- [ ] **Step 1: Remove hardcoded email and add token guard**

In `app/auth/reset-password/page.tsx`:

Replace the hardcoded email banner (line 69-72):
```tsx
// REMOVE this block:
<div className="bg-blue-50 border border-blue-200 rounded-auth-input px-4 py-2 text-auth-label text-blue-700 w-full flex items-center gap-2">
  <AlertTriangle className="w-4 h-4 shrink-0" />
  Resetting password for sarah@acmecorp.com
</div>
```

Add token guard after `const token = searchParams.get("token");`:
```tsx
if (!token) {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />
      <h1 className="text-auth-title text-auth-text-primary text-center">Invalid link</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        This reset link is invalid. Please request a new one.
      </p>
      <div className="h-6" />
      <AuthButton onClick={() => router.push("/auth/forgot-password")}>
        Request New Link
      </AuthButton>
    </AuthCard>
  );
}
```

Also remove the unused `AlertTriangle` import.

- [ ] **Step 2: Commit**

```bash
git add app/auth/reset-password/page.tsx
git commit -m "fix: remove hardcoded email from reset page, add token guard"
```

---

## Task 7: Implement Invite Accept/Decline

**Files:**
- Modify: `server/trpc/routers/auth.ts` (acceptInvite, declineInvite)
- Modify: `server/services/token.service.ts` (validate invite tokens)
- Modify: `app/auth/invite/page.tsx` (fetch invite details, remove hardcoded data)

- [ ] **Step 1: Implement acceptInvite mutation**

In `server/trpc/routers/auth.ts`:
```ts
acceptInvite: publicProcedure
  .input(z.object({ token: z.string().min(1) }))
  .mutation(async ({ input }) => {
    const userId = await validateToken(input.token, "invite");
    if (!userId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invite expired or invalid" });
    }

    // userId here is the invited user's email (stored as identifier)
    // For now, mark token as used
    await invalidateToken(input.token);

    return { success: true, message: "Invite accepted" };
  }),

declineInvite: publicProcedure
  .input(z.object({ token: z.string().min(1) }))
  .mutation(async ({ input }) => {
    await invalidateToken(input.token);
    return { message: "Invite declined" };
  }),
```

Add imports at top of auth.ts:
```ts
import { generateToken, validateToken, invalidateToken } from "@/server/services/token.service";
```

- [ ] **Step 2: Update invite page to show loading state instead of hardcoded data**

In `app/auth/invite/page.tsx`, replace the hardcoded "Acme Corp" block:
```tsx
<div className="bg-gray-50 rounded-lg p-4 w-full">
  <p className="font-bold">Team Invitation</p>
  <p className="text-sm text-gray-600">You have been invited to join a workspace</p>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add server/trpc/routers/auth.ts app/auth/invite/page.tsx
git commit -m "feat: implement invite accept/decline with token validation"
```

---

## Task 8: Wire Placeholder Resend Handlers

**Files:**
- Modify: `app/auth/2fa/page.tsx` (resend timer)
- Modify: `app/auth/check-inbox/page.tsx` (resend timer)
- Modify: `app/auth/otp/page.tsx` (resend timer)
- Modify: `server/services/auth.service.ts` (try-catch resendVerification email)

- [ ] **Step 1: Fix resendVerification email error handling**

In `server/services/auth.service.ts`, wrap email in try-catch:
```ts
export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = await generateToken("email_verify", user.id, 60 * 24);
  try {
    await sendVerificationEmail(email, token);
  } catch {
    // Email failed but don't crash — user can retry
  }
}
```

- [ ] **Step 2: Wire check-inbox resend handler**

In `app/auth/check-inbox/page.tsx`, replace `onResend={() => console.log("resend")}`:

```tsx
// Add at top of CheckInboxContent:
const resendMutation = trpc.auth.forgotPassword.useMutation();

// Replace onResend:
<ResendTimer
  initialSeconds={60}
  onResend={() => {
    if (type === "reset") {
      resendMutation.mutate({ email });
    }
  }}
/>
```

Add `trpc` import if not present.

- [ ] **Step 3: Remove console.log from 2fa page resend**

In `app/auth/2fa/page.tsx`, the resend timer on line 52 — 2FA codes come from authenticator app, not email. Remove the ResendTimer or replace with a note: "Open your authenticator app to get the code."

- [ ] **Step 4: Wire OTP page resend handler**

In `app/auth/otp/page.tsx`, replace `console.log("resend")` with actual resend logic (depends on what OTP is for — if it's email OTP, call resend mutation).

- [ ] **Step 5: Commit**

```bash
git add server/services/auth.service.ts app/auth/check-inbox/page.tsx app/auth/2fa/page.tsx app/auth/otp/page.tsx
git commit -m "fix: wire placeholder resend handlers to actual mutations"
```

---

## Task 9: Final Verification — Build and Manual Test

**Files:** None (testing only)

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: No errors

- [ ] **Step 2: Test signup flow**

1. Go to `/auth/signup` → fill form → submit
2. Check Mailtrap for verification email
3. Click verification link
4. Should see "Email verified" → redirect to login

- [ ] **Step 3: Test login flow**

1. Go to `/auth/login` → enter verified credentials
2. Should redirect to `/dashboard`
3. Check browser: session cookie exists
4. Refresh `/dashboard` — should stay (not kicked to login)

- [ ] **Step 4: Test forgot password flow**

1. Go to `/auth/forgot-password` → enter email
2. Check Mailtrap for reset email
3. Click reset link → should show reset form (no "sarah@acmecorp.com")
4. Enter new password → submit → should redirect to password-changed page

- [ ] **Step 5: Test magic link flow**

1. Go to `/auth/magic-link` → enter email → submit
2. Check Mailtrap for magic link email
3. Click link → should auto-verify → create session → redirect to dashboard

- [ ] **Step 6: Test error states**

1. `/auth/reset-password` (no token) → should show "Invalid link"
2. `/auth/verify-email?token=fake` → should show "Verification failed"
3. Login with wrong password 5x → should show "Account locked"

- [ ] **Step 7: Commit all remaining changes and tag**

```bash
git add -A
git commit -m "fix: complete auth module — all flows create sessions and handle errors"
```

---

## Execution Order & Dependencies

```
Task 1 (Credentials provider)
  └── Task 2 (Login page) ──────────────────┐
  └── Task 3 (Session endpoint) ─────────────┤
        ├── Task 4 (2FA session)             │
        └── Task 5 (Magic link flow)         │
                                             │
Task 6 (Reset password) ─── independent ─────┤
Task 7 (Invite) ──────────── independent ────┤
Task 8 (Resend handlers) ── independent ─────┤
                                             │
Task 9 (Final verification) ─────────────────┘
```

**Parallelizable:** Tasks 6, 7, 8 can run in parallel (independent of each other and of Tasks 4/5).
