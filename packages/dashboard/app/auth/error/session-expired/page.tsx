"use client";

import { Clock } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function SessionExpiredPage() {
  return (
    <AuthMessage
      icon={<Clock size={26} strokeWidth={1.7} className="text-auth-text-muted" />}
      title="Your session expired"
      subtitle="For your security you were logged out after a period of inactivity. Log in again to pick up where you left off."
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Log in again</AuthButton>
    </AuthMessage>
  );
}
