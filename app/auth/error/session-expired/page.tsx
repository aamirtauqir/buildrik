import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import Link from "next/link";

export default function SessionExpiredPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="clock" color="gray" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Session expired
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Your session has expired. Please sign in again.
      </p>

      <div className="h-4" />

      <AuthButton onClick={() => (window.location.href = "/auth/login")}>
        Sign In Again
      </AuthButton>

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
