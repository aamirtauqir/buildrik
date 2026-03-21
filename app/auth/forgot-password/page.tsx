"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    router.push(`/auth/check-inbox?email=${encodeURIComponent(email)}&type=reset`);
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="key" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Forgot your password?
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        No worries, we&apos;ll send you reset instructions
      </p>

      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="h-5" />

        <AuthButton type="submit" loading={loading}>
          Send Reset Email
        </AuthButton>
      </form>

      <div className="h-4" />

      <div className="flex justify-center">
        <Link href="/auth/login" className="text-auth-link text-auth-link hover:underline text-center">
          ← Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
