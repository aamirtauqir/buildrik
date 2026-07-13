"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function OAuthConflictContent() {
  const email = useSearchParams().get("email") ?? "your email";
  return (
    <AuthMessage
      icon={<AlertCircle size={26} strokeWidth={1.7} className="text-[#B7791F]" />}
      title="Account already exists"
      // The mockup ends "…to link Google", but no account-linking exists:
      // auth.config.ts sets no `allowDangerousEmailAccountLinking` and there is
      // no link-provider procedure, so a password login does NOT attach the
      // social account. Promising it here would be a lie — hence "to continue".
      subtitle={`An account for ${email} was created with a password. Log in with your password to continue.`}
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Log in with password</AuthButton>
      <AuthButton variant="secondary" onClick={() => (window.location.href = "/auth/forgot-password")}>
        Forgot password?
      </AuthButton>
    </AuthMessage>
  );
}

export default function OAuthConflictPage() {
  return <Suspense fallback={null}><OAuthConflictContent /></Suspense>;
}
