"use client";

import { ShieldAlert } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

/**
 * Near-duplicate of `/auth/device-alert` — kept deliberately. The mockup's
 * `device-alert` frame belongs to that route (unrecognized *device* after a
 * successful sign-in); this one is the generic "unrecognized device OR
 * location" error surface. Same shell, same CTAs, so the two never drift.
 * Like device-alert it has no detail table: nothing in the backend records a
 * raw device or a location to show (see the note on the device-alert page).
 */
export default function SuspiciousPage() {
  return (
    <AuthMessage
      icon={<ShieldAlert size={26} strokeWidth={1.7} className="text-[#C27803]" />}
      title="New sign-in detected"
      subtitle="We noticed a sign-in from a device or location we don't recognize. Confirm it was you."
    >
      <AuthButton onClick={() => (window.location.href = "/dashboard")}>Yes, it was me</AuthButton>
      <AuthButton
        variant="secondary"
        onClick={() => (window.location.href = "/auth/forgot-password")}
        className="border border-auth-input-error/50 bg-white text-auth-input-error hover:bg-auth-input-error/5"
      >
        Secure account
      </AuthButton>
    </AuthMessage>
  );
}
