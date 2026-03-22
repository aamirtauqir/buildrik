"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { InlineError } from "@/components/auth/inline-error";
import { trpc } from "@/lib/trpc/client";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ confirm?: string }>({});

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      router.push("/auth/password-changed");
    },
    onError: (err) => {
      if (err.message.includes("expired")) {
        router.push("/auth/error/expired-link?type=reset");
      } else {
        setErrors({ confirm: err.message });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { confirm?: string } = {};

    if (newPassword !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    resetPasswordMutation.mutate({ token: token ?? "", newPassword, confirmPassword });
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="lock" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Set new password
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Must be at least 8 characters
      </p>

      <div className="h-4" />

      <form onSubmit={handleSubmit}>
        <AuthInput
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <div className="h-4" />

        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {errors.confirm && (
          <>
            <div className="h-1" />
            <InlineError message={errors.confirm} />
          </>
        )}

        <div className="h-3" />

        <PasswordStrength password={newPassword} />

        <div className="h-5" />

        <AuthButton type="submit" loading={resetPasswordMutation.isPending}>
          Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
