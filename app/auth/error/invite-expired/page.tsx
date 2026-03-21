import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

export default function InviteExpiredPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Invite expired
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        This invitation link has expired. Ask the workspace admin to send a new
        invite.
      </p>

      <div className="h-4" />

      <AuthButton onClick={() => (window.location.href = "/dashboard")}>
        Go to Dashboard
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
