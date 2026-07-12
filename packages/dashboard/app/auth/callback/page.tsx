"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";
import { Loader2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";

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
        // Full navigation so /auth/redirect reads the just-set session cookie
        // instead of a stale useSession bounce → /dashboard (skips onboarding).
        window.location.assign("/auth/redirect");
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
      <AuthMessage title="Link expired" subtitle={error}>
        <AuthButton onClick={() => router.push("/auth/magic-link")}>Request a new link</AuthButton>
        <a href="/auth" className="text-auth-label text-auth-text-muted hover:text-auth-text-secondary text-center">
          Back to log in
        </a>
      </AuthMessage>
    );
  }

  return (
    <AuthCard noArt>
      <div className="flex flex-col items-center gap-5 py-6">
        <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
        <p className="text-auth-subtitle text-auth-text-muted">Completing sign in…</p>
      </div>
    </AuthCard>
  );
}

export default function CallbackPage() {
  return <Suspense fallback={null}><CallbackContent /></Suspense>;
}
