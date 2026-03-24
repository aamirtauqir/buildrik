"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@/lib/trpc/client";

function BackupCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verifyBackupCodeMutation = trpc.auth.verifyBackupCode.useMutation({
    onSuccess: async (data) => {
      const res = await fetch("/api/auth/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken }),
      });
      if (res.ok) {
        router.push("/auth/redirect");
      } else {
        setError("Failed to create session");
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleVerify = async () => {
    verifyBackupCodeMutation.mutate({ twoFactorToken: token || "", backupCode });
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="shield" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Enter backup code
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Enter one of your recovery codes. Each code can only be used once.
      </p>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <AuthInput
        label="Backup Code"
        placeholder="XXXX-XXXX-XXXX"
        value={backupCode}
        onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
      />

      <div className="h-5" />

      <AuthButton loading={verifyBackupCodeMutation.isPending} onClick={handleVerify}>
        Verify Backup Code
      </AuthButton>

      <div className="h-4" />

      <Link
        href={`/auth/2fa${token ? `?token=${token}` : ""}`}
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to 2FA
      </Link>

      <div className="h-2" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
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
