"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { ArrowLeft } from "lucide-react";

function ChangeEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("email") ?? "";
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-run signup with the new email (reuses checkEmail/signup — no pending-email mutation exists).
    router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-5 self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-center">
        <p className="text-auth-subtitle text-auth-text-muted">Change email for</p>
        <h1 className="text-[21px] font-bold leading-tight text-auth-text-primary">Buildrick</h1>
      </div>

      <div className="h-6" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <AuthInput
          label="New email"
          hideLabel
          type="email"
          placeholder="New work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
