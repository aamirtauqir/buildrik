"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  // A dead magic link goes to the shared expired-link screen rather than a
  // second copy of it here — that screen is the one the frames draw, and it
  // keeps the raw server error (e.g. "Invalid uuid") off the user's face.
  const failed = () => router.replace("/auth/error/expired-link?type=magic-link");

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
        failed();
      }
    },
    onError: failed,
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
