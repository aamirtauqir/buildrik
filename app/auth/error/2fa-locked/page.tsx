import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";

export default function TwoFALockedPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="shield-alert" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Too many attempts
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        2FA verification has been locked. Try again in 30 minutes.
      </p>

      <div className="h-4" />

      <Link
        href="/auth/2fa/backup"
        className="text-auth-link hover:underline text-center block"
      >
        Use a recovery code
      </Link>

      <div className="h-3" />

      <Link
        href="mailto:support@buildrik.com"
        className="text-auth-link hover:underline text-center block"
      >
        Contact support
      </Link>

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
