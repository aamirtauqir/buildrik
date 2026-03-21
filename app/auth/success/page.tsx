"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { Loader2 } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-6">
      <AuthLogo />
      <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
      <p className="text-auth-subtitle text-auth-text-muted">Setting up your workspace...</p>
    </div>
  );
}
