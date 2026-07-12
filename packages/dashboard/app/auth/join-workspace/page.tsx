"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";

function JoinWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const workspace = searchParams.get("workspace") ?? "the workspace";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Invited new user: create the account, log them in (so acceptInvite — a
  // protected procedure — has a session), then land on the invite accept page.
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (!data.requiresTwoFactor) {
        await fetch("/api/auth/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe: false }),
        });
      }
      router.push(`/auth/invite?token=${encodeURIComponent(token)}`);
    },
    onError: () => router.push(`/auth/invite?token=${encodeURIComponent(token)}`),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => loginMutation.mutate({ email, password, rememberMe: false }),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    signupMutation.mutate({ fullName, email, password, termsAccepted: true });
  };

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Set up your profile</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Choose how your teammates at {workspace} see you.
        </p>
      </div>

      <div className="h-6" />

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
        <AuthButton type="submit" disabled={!fullName || !password} loading={signupMutation.isPending || loginMutation.isPending}>
          Join workspace
        </AuthButton>
      </form>
    </AuthCard>
  );
}

export default function JoinWorkspacePage() {
  return <Suspense fallback={null}><JoinWorkspaceContent /></Suspense>;
}
