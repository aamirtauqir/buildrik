"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      router.push(`/auth/check-inbox?type=reset&email=${encodeURIComponent(email)}`);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    forgotPasswordMutation.mutate({ email });
  };

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => router.push("/auth")}
        className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-5 self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Reset your password</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Enter the email tied to your account and we&apos;ll send a reset link.
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
          label="Email"
          hideLabel
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <AuthButton type="submit" loading={forgotPasswordMutation.isPending}>
          Send reset link
        </AuthButton>
      </form>

      <div className="h-5" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Remember it?{" "}
        <Link href="/auth" className="text-auth-link font-medium hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
