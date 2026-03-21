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
import { PasswordStrength } from "@/components/auth/password-strength";
import { SocialButton } from "@/components/auth/social-button";
import { trpc } from "@/lib/trpc/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    signupMutation.mutate({ fullName, email, password });
  };

  return (
    <AuthCard>
      <AuthLogo />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Create your account
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Start building for free
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
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />

        <div className="h-4" />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <div className="h-3" />

        <PasswordStrength password={password} />

        <div className="h-4" />

        <label className="flex items-start gap-2 cursor-pointer w-full">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 rounded border-auth-input-border"
          />
          <span className="text-auth-label text-auth-text-secondary">
            I agree to the{" "}
            <Link href="/terms" className="text-auth-link hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-auth-link hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <div className="h-5" />

        <AuthButton type="submit" disabled={!termsAccepted} loading={signupMutation.isPending}>
          Create Account
        </AuthButton>

        <div className="h-6" />

        <AuthDivider />

        <div className="h-6" />

        <SocialButton provider="google" />

        <div className="h-2" />

        <SocialButton provider="github" />

        <div className="h-6" />

        <p className="text-auth-subtitle text-auth-text-muted text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-auth-link font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
