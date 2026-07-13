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
        // verify2FA invalidates the temp token when it locks out, so there is
        // no token left to carry — the only way forward is a fresh log-in.
        router.push("/auth/error/2fa-locked");
        return;
      }
      // The service throws a bare "Invalid code" and never reports how many
      // attempts remain, so the mockup's attempt counter has nothing to read.
      setError("Incorrect code. Check your authenticator app and try again.");
    },
  });

  const handleVerify = () => {
    if (code.length < 6) return;
    setError(null);
    verify2FAMutation.mutate({ twoFactorToken: token || "", code });
  };

  const backupHref = `/auth/2fa/backup?${new URLSearchParams({
    ...(token ? { token } : {}),
    ...(rememberMe ? { remember: "1" } : {}),
    ...(returnUrl ? { returnUrl } : {}),
  }).toString()}`;

  return (
    <AuthCard>
      <Link
        href="/auth"
        className="mb-5 flex items-center gap-1.5 self-start text-auth-input font-medium text-auth-text-muted hover:text-auth-text-body"
      >
        <ArrowLeft size={16} strokeWidth={1.7} /> Back to log in
      </Link>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Enter your code</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Open your authenticator app for the current 6-digit code. It changes every 30 seconds.
        </p>
      </div>

      <div className="h-5" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <OTPInput length={6} value={code} onChange={setCode} error={!!error} />

      <div className="h-4" />

      <AuthButton loading={verify2FAMutation.isPending} disabled={code.length < 6} onClick={handleVerify}>
        Verify
      </AuthButton>

      <div className="h-4" />

      <p className="text-center text-auth-input text-auth-text-muted">
        Can&apos;t reach your app?{" "}
        <Link href={backupHref} className="font-semibold text-auth-text-body hover:underline">
          Use a backup code
        </Link>
      </p>
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
