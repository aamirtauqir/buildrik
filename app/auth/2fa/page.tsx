"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { OTPInput } from "@/components/auth/otp-input";
import { FormBanner } from "@/components/auth/form-banner";
import { createClientSession } from "@/lib/auth/create-session";
import { trpc } from "@/lib/trpc/client";

function TwoFAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    try {
      setRememberMe(sessionStorage.getItem("buildrik_rememberMe") === "true");
      sessionStorage.removeItem("buildrik_rememberMe");
    } catch {
      // private browsing — default false
    }
  }, []);

  const verify2FAMutation = trpc.auth.verify2FA.useMutation({
    onSuccess: async (data) => {
      const ok = await createClientSession(data.sessionToken, rememberMe);
      if (ok) {
        router.push("/auth/redirect");
      } else {
        setError("Failed to create session");
      }
    },
    onError: (err) => {
      if (err.message.includes("Too many failed attempts")) {
        router.push("/auth/error/2fa-locked");
        return;
      }
      setError(err.message);
    },
  });

  const handleVerify = async () => {
    if (code.length < 6) return;
    verify2FAMutation.mutate({ twoFactorToken: token || "", code });
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="shield" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Two-factor authentication
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Enter the 6-digit code from your authenticator app.
      </p>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <OTPInput length={6} value={code} onChange={setCode} />

      <div className="h-4" />

      <p className="text-auth-subtitle text-auth-text-muted text-center">
        Open your authenticator app to get the code.
      </p>

      <div className="h-5" />

      <AuthButton
        loading={verify2FAMutation.isPending}
        disabled={code.length < 6}
        onClick={handleVerify}
      >
        Verify Code
      </AuthButton>

      <div className="h-3" />

      <p className="text-auth-subtitle text-auth-text-placeholder text-center">
        or
      </p>

      <div className="h-3" />

      <Link
        href={`/auth/2fa/backup${token ? `?token=${token}` : ""}`}
        className="text-auth-link hover:underline text-center block"
      >
        Having trouble? Use a recovery code instead
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

export default function TwoFAPage() {
  return (
    <Suspense fallback={null}>
      <TwoFAContent />
    </Suspense>
  );
}
