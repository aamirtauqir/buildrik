"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";

export default function MagicLinkRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const magicLinkMutation = trpc.auth.magicLink.useMutation({
    onSuccess: () => {
      router.push(`/auth/magic-link/sent?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => {
      setError(err.message);
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
        We'll email you a link to sign in without a password
      </p>
      <div className="h-6" />
      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}
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
