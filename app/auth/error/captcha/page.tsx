import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

export default function CaptchaPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="shield" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Verify you&apos;re human
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        We detected unusual activity. Please complete the verification.
      </p>

      <div className="h-4" />

      <div className="border-2 border-dashed rounded-lg p-8 text-center text-auth-text-placeholder w-full">
        CAPTCHA widget placeholder
      </div>

      <div className="h-5" />

      <AuthButton disabled>Continue</AuthButton>

      <div className="h-4" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
