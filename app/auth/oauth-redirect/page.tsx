"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSession } from "@/lib/auth/create-session";

function OAuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    let rememberMe = false;
    try {
      rememberMe = sessionStorage.getItem("buildrik_rememberMe") === "true";
      sessionStorage.removeItem("buildrik_rememberMe");
    } catch {
      // private browsing — default false
    }

    createClientSession(token, rememberMe).then((ok) => {
      if (ok) {
        router.push("/auth/redirect");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <a href="/auth/login" className="mt-4 block text-sm text-[#E42313] hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
        <p className="mt-4 text-sm" style={{ color: "#7A7A7A" }}>Signing you in...</p>
      </div>
    </div>
  );
}

export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
      </div>
    }>
      <OAuthRedirectContent />
    </Suspense>
  );
}
