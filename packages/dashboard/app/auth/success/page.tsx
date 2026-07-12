"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?reason=session-required");
      return;
    }
    if (status === "authenticated") {
      const timer = setTimeout(() => {
        router.push("/auth/redirect");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <AuthCard noArt>
      <div className="flex flex-col items-center gap-5 py-6">
        <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">Signing you in</h1>
          <p className="text-auth-subtitle text-auth-text-muted mt-2">Setting up your workspace…</p>
        </div>
      </div>
    </AuthCard>
  );
}
