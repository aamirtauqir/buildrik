"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { trpc } from "@/lib/trpc/client";

export default function BackupCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [backupCode, setBackupCode] = useState("");

  const verifyBackupCodeMutation = trpc.auth.verifyBackupCode.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const handleVerify = async () => {
    verifyBackupCodeMutation.mutate({ token, backupCode });
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
