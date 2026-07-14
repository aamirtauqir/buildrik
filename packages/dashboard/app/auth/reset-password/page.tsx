"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { rateLimitedHref } from "@lib/rate-limit-redirect";
import { resetPasswordSchema } from "@buildrik/shared/schemas/auth";
import { cn } from "@lib/utils";

const MISMATCH = "Passwords don't match. Re-enter the same password in both fields.";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => router.push("/auth/password-changed"),
    onError: (err) => {
      // 410 TOKEN_EXPIRED is mapped to NOT_FOUND by the auth router. The token
      // is dead (expired, already used, or unknown) — send them to the one
      // expired/invalid-link screen rather than failing in place.
      if (err.data?.code === "NOT_FOUND") router.replace("/auth/error/expired-link?type=reset");
      // resetPassword is strict-rate-limited (5 / 15min per IP).
      else if (err.data?.code === "TOO_MANY_REQUESTS") router.push(rateLimitedHref(err));
      else setError(err.message);
    },
  });

  useEffect(() => {
    if (!token) router.replace("/auth/error/expired-link?type=reset");
  }, [token, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ token, newPassword, confirmPassword });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.path[0] === "token") {
        router.replace("/auth/error/expired-link?type=reset");
        return;
      }
      const isMismatch = issue.path[0] === "confirmPassword";
      setMismatch(isMismatch);
      setError(isMismatch ? MISMATCH : issue.message);
      return;
    }
    setMismatch(false);
    setError(null);
    resetPasswordMutation.mutate(parsed.data);
  };

  if (!token) return null;

  const saving = resetPasswordMutation.isPending;

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Choose a new password</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Make it strong — you won&apos;t need to enter it often.
        </p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3">
        <div className={cn("w-full flex flex-col gap-3", saving && "opacity-50 pointer-events-none")}>
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
            className={cn(mismatch && "border-auth-input-error")}
          />
        </div>

        <AuthButton type="submit" loading={saving}>
          {saving ? "Updating password…" : "Reset password"}
        </AuthButton>
      </form>

      <div className="h-4" />
      <AuthBackLink />
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
