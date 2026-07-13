"use client";

import { ShieldCheck } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

/**
 * The `device-alert` mockup frame. Its Device / Location / Time table is NOT
 * rendered because the backend cannot fill it:
 *   - the new-device check (device-alert.service `recordDeviceAndAlert`) stores
 *     only a one-way HMAC fingerprint — by design it never keeps the raw UA/IP;
 *   - `Session.location` exists as a column but nothing ever writes it (no
 *     geo-IP lookup anywhere in the repo), so Location would always be blank;
 *   - nothing redirects here — the real alert is an email — so the page is
 *     never handed a device to describe.
 * Rendering "Chrome · macOS / Lisbon, PT" would be inventing all three rows.
 */
export default function DeviceAlertPage() {
  return (
    <AuthMessage
      icon={<ShieldCheck size={26} strokeWidth={1.7} className="text-[#B7791F]" />}
      title="New sign-in detected"
      subtitle="We noticed a sign-in from a device we don't recognize. Confirm it was you."
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
