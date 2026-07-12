"use client";

import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function AccessDeniedPage() {
  return (
    <AuthMessage
      title="Access declined"
      subtitle="You don't have permission to access this resource."
    >
      <AuthButton onClick={() => (window.location.href = "/dashboard")}>Go to dashboard</AuthButton>
      <Link href="mailto:admin@buildrik.com" className="text-auth-label text-auth-link hover:underline text-center">
        Contact workspace admin
      </Link>
      <Link href="/auth" className="text-auth-label text-auth-text-muted hover:text-auth-text-secondary text-center">
        Back to log in
      </Link>
    </AuthMessage>
  );
}
