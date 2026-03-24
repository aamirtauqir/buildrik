"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormBanner } from "@/components/auth/form-banner";
import { SocialButton } from "@/components/auth/social-button";
import { signIn } from "next-auth/react"; // used for social login
import { trpc } from "@/lib/trpc/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        router.push(`/auth/2fa?token=${data.tempToken}`);
      } else {
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
      }
    },
    onError: (err) => {
      const cause = (err.data as Record<string, unknown>)?.cause as { attemptsRemaining?: number; locked?: boolean; lockedUntil?: string } | undefined;
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <AuthCard>
      <AuthLogo />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Welcome back
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Sign in to your account
      </p>

      <div className="h-6" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        {error && (
          <>
            <FormBanner variant="error" title={error} />
            <div className="h-4" />
          </>
        )}

        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="h-4" />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <div className="h-3" />

        <div className="flex justify-between items-center w-full">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-auth-input-border"
            />
            <span className="text-auth-label text-auth-text-secondary">Remember me</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-auth-label text-auth-link hover:underline"
          >
            Forgot?
          </Link>
        </div>

        <div className="h-5" />

        <AuthButton type="submit" loading={loginMutation.isPending}>
          Sign In
        </AuthButton>

        <div className="h-2" />

        <Link
          href="/auth/magic-link"
          className="text-auth-label text-auth-link hover:underline text-center"
        >
          Or sign in with a magic link
        </Link>

        <div className="h-6" />

        <AuthDivider />

        <div className="h-6" />

        <SocialButton provider="google" onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })} />

        <div className="h-2" />

        <SocialButton provider="github" onClick={() => signIn("github", { callbackUrl: "/auth/redirect" })} />

        <div className="h-6" />

        <p className="text-auth-subtitle text-auth-text-muted text-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-auth-link font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
