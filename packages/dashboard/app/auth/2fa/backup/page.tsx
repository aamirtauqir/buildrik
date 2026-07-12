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
import { ArrowLeft } from "lucide-react";

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
    onError: (err) => setError(err.message),
  });

  const handleVerify = () => {
    verifyBackupCodeMutation.mutate({ twoFactorToken: token || "", backupCode });
  };

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => router.push(`/auth/2fa${token ? `?token=${token}` : ""}`)}
        className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-5 self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Enter a backup code</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Enter one of your recovery codes. Each code works once.
        </p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
        className="w-full flex flex-col gap-3"
      >
        <AuthInput
          label="Backup code"
          hideLabel
          icon={null}
          placeholder="XXXX-XXXX-XXXX"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
          className="text-center tracking-[0.2em]"
          autoFocus
        />
        <AuthButton type="submit" loading={verifyBackupCodeMutation.isPending} disabled={!backupCode}>
          Verify
        </AuthButton>
      </form>

      <div className="h-4" />

      <Link
        href={`/auth/2fa${token ? `?token=${token}` : ""}`}
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        Use authenticator instead
      </Link>
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
