"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

/**
 * Signup hit an address that already has an account — either the checkEmail probe
 * said so, or auth.service.signup threw EMAIL_EXISTS (409). Offer the two ways out.
 */
function EmailExistsContent() {
  const email = useSearchParams().get("email") ?? "";

  return (
    <AuthMessage
      icon={<AlertCircle size={26} className="text-amber-600" />}
      title="This email is already in use"
      subtitle={
        email
          ? `An account for ${email} already exists. Log in instead, or reset your password.`
          : "An account with that email already exists. Log in instead, or reset your password."
      }
    >
      <Link href={email ? `/auth?email=${encodeURIComponent(email)}` : "/auth"} className="w-full">
        <AuthButton type="button">Log in instead</AuthButton>
      </Link>
      <Link href="/auth/forgot-password" className="w-full">
        <AuthButton type="button" variant="secondary">Reset password</AuthButton>
      </Link>
    </AuthMessage>
  );
}

export default function EmailExistsPage() {
  return <Suspense fallback={null}><EmailExistsContent /></Suspense>;
}
