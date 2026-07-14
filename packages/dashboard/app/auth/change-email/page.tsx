"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { emailField } from "@buildrik/shared/schemas/auth";

function ChangeEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("email") ?? "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // This screen is reached from the verification email itself, so browser history
  // often points at the mail client, not at us — the back link needs a real
  // destination rather than router.back().
  const backHref = `/auth/verify-email${current ? `?email=${encodeURIComponent(current)}` : ""}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailField.safeParse(email);
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    // Re-run signup with the new email (reuses checkEmail/signup — no pending-email mutation exists).
    router.push(`/auth/signup?email=${encodeURIComponent(parsed.data)}`);
  };

  return (
    <AuthCard>
      <AuthBackLink href={backHref} placement="top">
        Back
      </AuthBackLink>

      <div className="text-center">
        <p className="text-auth-subtitle text-auth-text-muted">Change email for</p>
        <h1 className="text-[21px] font-bold leading-tight text-auth-text-primary">Buildrick</h1>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3">
        <AuthInput
          label="New email"
          hideLabel
          type="email"
          placeholder="New work email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          invalid={Boolean(error)}
          autoComplete="email"
          autoFocus
        />
        <AuthButton type="submit" disabled={!email}>Update and resend</AuthButton>
      </form>

      {current && (
        <>
          <div className="h-4" />
          <p className="text-auth-label text-auth-text-muted text-center">Currently {current}</p>
        </>
      )}
    </AuthCard>
  );
}

export default function ChangeEmailPage() {
  return <Suspense fallback={null}><ChangeEmailContent /></Suspense>;
}
