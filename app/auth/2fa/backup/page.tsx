"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { FormBanner } from "@/components/auth/form-banner";
import { createClientSession } from "@/lib/auth/create-session";
import { trpc } from "@/lib/trpc/client";

function BackupCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  useEffect(() => {
    try {
      setRememberMe(sessionStorage.getItem("buildrik_rememberMe") === "true");
      sessionStorage.removeItem("buildrik_rememberMe");
    } catch {
      // private browsing — default false
    }
  }, []);

  const verifyBackupCodeMutation = trpc.auth.verifyBackupCode.useMutation({
    onSuccess: async (data) => {
      const ok = await createClientSession(data.sessionToken, rememberMe, trustDevice);
      if (ok) {
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

      <div className="h-4" />

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(e) => setTrustDevice(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-[#E42313]"
        />
        <span className="text-auth-label text-auth-text-muted">
          Trust this device for 30 days
        </span>
      </label>

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
