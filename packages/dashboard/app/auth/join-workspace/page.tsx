"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";

function JoinWorkspaceContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The invite token is the only thing in the URL: the email the account must
  // be created under is the one the invite was sent to, so it comes from the
  // token — never from a query param a stranger could swap.
  const inviteQuery = trpc.auth.getInviteDetails.useQuery({ token }, { enabled: !!token });
  const invite = inviteQuery.data?.found ? inviteQuery.data : null;
  const inviteUrl = `/auth/invite?token=${encodeURIComponent(token)}`;

  const expired = invite?.expired ?? false;
  useEffect(() => {
    if (expired) router.push("/auth/error/invite-expired");
  }, [expired, router]);

  // Joining IS accepting: the invitee gets an account, a live session, and the
  // membership in one submit, then lands on the "You're in!" screen. The hop is
  // a hard navigation — /api/auth/create-session sets the cookie behind
  // useSession's back, and a client push would read the stale "logged out"
  // cache and bounce them to the sign-in-required screen.
  const acceptMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => window.location.assign(`${inviteUrl}&accepted=1`),
    // Any accept failure (revoked, expired, already a member) has a designed
    // screen on the invite page — send them there with a live session.
    onError: () => window.location.assign(inviteUrl),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        // A brand-new account cannot have 2FA — but if it ever did, the invite
        // page (signed out) is the honest place to continue from.
        window.location.assign(inviteUrl);
        return;
      }
      const res = await fetch("/api/auth/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe: false }),
      });
      if (!res.ok) {
        window.location.assign(inviteUrl);
        return;
      }
      acceptMutation.mutate({ token });
    },
    onError: () => window.location.assign(inviteUrl),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      if (invite) loginMutation.mutate({ email: invite.email, password, rememberMe: false });
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setError(null);
    signupMutation.mutate({ fullName, email: invite.email, password, termsAccepted: true });
  };

  if (inviteQuery.isLoading) {
    return <AuthMessage title="Loading invitation…" />;
  }

  if (!invite) {
    return (
      <AuthMessage
        title="Invitation not found"
        subtitle="This invite link is invalid or has been revoked."
      >
        <Link href="/auth" className="w-full">
          <AuthButton variant="secondary" type="button">Back to log in</AuthButton>
        </Link>
      </AuthMessage>
    );
  }

  if (invite.expired) {
    // Redirect handled by the effect above; render nothing meanwhile.
    return null;
  }

  const pending = signupMutation.isPending || loginMutation.isPending || acceptMutation.isPending;

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Set up your profile</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Choose how your teammates at {invite.workspaceName} will see you.
        </p>
      </div>

      <div className="h-5" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <AuthInput
          label="Full name"
          hideLabel
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
        />
        <AuthInput
          label="Password"
          hideLabel
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordStrength password={password} variant="line" />
        <AuthButton type="submit" disabled={!fullName || !password} loading={pending}>
          Join workspace
        </AuthButton>
      </form>

      <div className="h-3" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        Joining as {invite.email}
      </p>
    </AuthCard>
  );
}

export default function JoinWorkspacePage() {
  return <Suspense fallback={null}><JoinWorkspaceContent /></Suspense>;
}
