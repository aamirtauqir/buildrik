"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { safeReturnUrl } from "@lib/safe-return-url";
import { ArrowLeft, KeyRound } from "lucide-react";

function BackupCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const rememberMe = searchParams.get("remember") === "1";
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verifyBackupCodeMutation = trpc.auth.verifyBackupCode.useMutation({
    onSuccess: async (data) => {
      const res = await fetch("/api/auth/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe }),
      });
      if (res.ok) {
        // Full navigation so /auth/redirect reads the just-set session cookie
        // instead of a stale useSession bounce → /dashboard (skips onboarding).
        window.location.assign(returnUrl ?? "/auth/redirect");
      } else {
        setError("Failed to create session");
      }
    },
    // verifyBackupCode only returns `backupCodesRemaining` when the code MATCHES.
    // The failure path throws a bare "Invalid backup code", so the mockup's
    // "3 codes remaining" counter has no value to read on this branch.
    onError: (err) => {
      // verifyBackupCode is strict-rate-limited (5 / 15min per IP). That used to
      // fall through and render as "That backup code didn't match", which is a
      // lie — the code may have been right; they were simply throttled.
      if (err.data?.code === "TOO_MANY_REQUESTS") {
        router.push("/auth/error/2fa-locked");
        return;
      }
      setError("That backup code didn't match. Each code can only be used once.");
    },
  });

  const handleVerify = () => {
    setError(null);
    verifyBackupCodeMutation.mutate({ twoFactorToken: token || "", backupCode });
  };

  return (
    <AuthCard>
      <Link
        href={`/auth/2fa${token ? `?token=${encodeURIComponent(token)}` : ""}`}
        className="mb-5 flex items-center gap-1.5 self-start text-auth-input font-medium text-auth-text-muted hover:text-auth-text-body"
      >
        <ArrowLeft size={16} strokeWidth={1.7} /> Back to code
      </Link>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Enter a backup code</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Use one of the one-time backup codes you saved when setting up two-factor.
        </p>
      </div>

      <div className="h-5" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
        className="flex w-full flex-col gap-3.5"
      >
        <AuthInput
          label="Backup code"
          hideLabel
          icon={KeyRound}
          // The schema is XXXX-XXXX-XXXX (three groups, uppercase) — the mockup's
          // "xxxx-xxxx" placeholder would fail validation, so it is not copied.
          placeholder="XXXX-XXXX-XXXX"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
          className={error ? "border-auth-input-error bg-white tracking-[0.12em]" : "tracking-[0.12em]"}
          autoFocus
        />
        <AuthButton type="submit" loading={verifyBackupCodeMutation.isPending} disabled={!backupCode}>
          Verify
        </AuthButton>
      </form>

      <div className="h-3.5" />

      <p className="text-center text-auth-input text-auth-text-muted">
        Lost your codes?{" "}
        <Link href="mailto:support@buildrik.com" className="font-semibold text-auth-text-body hover:underline">
          Contact support
        </Link>
      </p>
    </AuthCard>
  );
}

export default function BackupCodePage() {
  return (
    <Suspense fallback={null}>
      <BackupCodeContent />
    </Suspense>
  );
}
