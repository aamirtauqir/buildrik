"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { InlineError } from "@/components/auth/inline-error";
import { trpc } from "@lib/trpc/client";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ confirm?: string }>({});

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => router.push("/auth/password-changed"),
    onError: (err) => {
      if (err.message.includes("expired")) {
        router.push("/auth/error/expired-link?type=reset");
      } else {
        setErrors({ confirm: err.message });
      }
    },
  });

  if (!token) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">Invalid link</h1>
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            This reset link is invalid. Please request a new one.
          </p>
        </div>
        <div className="h-6" />
        <AuthButton onClick={() => router.push("/auth/forgot-password")}>
          Request new link
        </AuthButton>
      </AuthCard>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setErrors({});
    resetPasswordMutation.mutate({ token, newPassword, confirmPassword });
  };

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Choose a new password</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Make it strong — you won&apos;t need to enter it often.
        </p>
      </div>

      <div className="h-6" />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <AuthInput
          label="New password"
          hideLabel
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoFocus
        />
        <PasswordStrength password={newPassword} variant="line" />
        <AuthInput
          label="Confirm password"
          hideLabel
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {errors.confirm && <InlineError message={errors.confirm} />}

        <div className="h-1" />
        <AuthButton type="submit" loading={resetPasswordMutation.isPending}>
          Reset password
        </AuthButton>
      </form>
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
