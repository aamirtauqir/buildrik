"use client";

import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function SessionExpiredPage() {
  return (
    <AuthMessage
      title="Your session expired"
      subtitle="For your security you were logged out after a period of inactivity."
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Log in again</AuthButton>
    </AuthMessage>
  );
}
