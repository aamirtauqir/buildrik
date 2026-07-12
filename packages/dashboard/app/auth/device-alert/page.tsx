"use client";

import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function DeviceAlertPage() {
  return (
    <AuthMessage
      title="New sign-in detected"
      subtitle="We noticed a sign-in from a device we don't recognize. If this was you, you're all set."
    >
      <AuthButton onClick={() => (window.location.href = "/dashboard")}>Yes, this was me</AuthButton>
      <AuthButton variant="secondary" onClick={() => (window.location.href = "/auth/forgot-password")}>
        No, secure my account
      </AuthButton>
    </AuthMessage>
  );
}
