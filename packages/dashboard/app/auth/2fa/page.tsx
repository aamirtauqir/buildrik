"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { OTPInput } from "@/components/auth/otp-input";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { safeReturnUrl } from "@lib/safe-return-url";
import { ArrowLeft } from "lucide-react";

function TwoFAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const rememberMe = searchParams.get("remember") === "1";
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verify2FAMutation = trpc.auth.verify2FA.useMutation({
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
    onError: (err) => {
      if (err.message.includes("Too many failed attempts")) {
        // Carry the temp token so the backup-code recovery path stays usable.
        router.push(`/auth/error/2fa-locked${token ? `?token=${encodeURIComponent(token)}` : ""}`);
        return;
      }
      setError(err.message);
    },
  });

  const handleVerify = () => {
    if (code.length < 6) return;
    verify2FAMutation.mutate({ twoFactorToken: token || "", code });
  };

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => router.push("/auth")}
        className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-5 self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Enter your code</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          We sent a 6-digit code to your authenticator app.
        </p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <OTPInput length={6} value={code} onChange={setCode} />

      <div className="h-5" />

      <AuthButton loading={verify2FAMutation.isPending} disabled={code.length < 6} onClick={handleVerify}>
        Verify
      </AuthButton>

      <div className="h-4" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Open your authenticator app to get the current code.
      </p>

      <div className="h-3" />

      <Link
        href={`/auth/2fa/backup?${new URLSearchParams({ ...(token ? { token } : {}), ...(rememberMe ? { remember: "1" } : {}), ...(returnUrl ? { returnUrl } : {}) }).toString()}`}
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        Use a recovery code instead
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
