"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@/lib/trpc/client";

function CheckInboxContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const email = searchParams.get("email") ?? "";

  const resendMutation = trpc.auth.forgotPassword.useMutation();

  const subtitle =
    type === "reset"
      ? "We sent password reset instructions to"
      : "We sent a verification link to";

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Check your inbox
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        {subtitle}
      </p>

      {email && (
        <div className="bg-gray-100 rounded-lg px-4 py-2 text-auth-label text-auth-text-body flex items-center gap-2 justify-center">
          <Mail className="w-4 h-4 shrink-0" />
          {email}
        </div>
      )}

      <div className="h-4" />

      <a
        href="mailto:"
        className="w-full h-auth-btn rounded-auth-btn text-auth-btn text-white font-semibold bg-auth-cta hover:bg-auth-cta-hover transition-colors flex items-center justify-center gap-2"
      >
        Open Email App
      </a>

      <div className="h-4" />

      <ResendTimer
        initialSeconds={60}
        onResend={() => {
          if (type === "reset" && email) {
            resendMutation.mutate({ email });
          }
        }}
      />

      <div className="h-3" />

      <div className="flex justify-center">
        <Link href="/auth/forgot-password" className="text-auth-link text-auth-link hover:underline text-center">
          ← Use a different email
        </Link>
      </div>

      <div className="h-1" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        Don&apos;t see it? Check your spam or junk folder
      </p>

      <div className="h-4" />

      <div className="flex justify-center">
        <Link href="/auth/login" className="text-auth-link text-auth-link hover:underline text-center">
          ← Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}

export default function CheckInboxPage() {
  return (
    <Suspense fallback={null}>
      <CheckInboxContent />
    </Suspense>
  );
}
