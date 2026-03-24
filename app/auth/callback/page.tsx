"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        router.push(`/auth/2fa?token=${data.tempToken}`);
        return;
      }
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
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">Link expired</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">{error}</p>
        <div className="h-6" />
        <AuthButton onClick={() => router.push("/auth/magic-link")}>Request New Link</AuthButton>
        <div className="h-3" />
        <a href="/auth/login" className="text-auth-label text-auth-link hover:underline text-center block">← Back to sign in</a>
      </AuthCard>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AuthLogo />
      <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
      <p className="text-auth-subtitle text-auth-text-muted">Completing sign in...</p>
    </div>
  );
}

export default function CallbackPage() {
  return <Suspense fallback={null}><CallbackContent /></Suspense>;
}
