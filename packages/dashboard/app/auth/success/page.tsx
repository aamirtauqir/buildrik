"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLogo } from "@/components/auth/auth-logo";
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
    <div className="flex flex-col items-center gap-6">
      <AuthLogo />
      <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
      <p className="text-auth-subtitle text-auth-text-muted">Setting up your workspace...</p>
    </div>
  );
}
