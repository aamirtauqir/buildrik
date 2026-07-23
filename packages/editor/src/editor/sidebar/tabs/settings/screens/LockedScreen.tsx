/**
 * Locked screen — plan-gate or coming-soon gate
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PremiumBadge } from "@/shared/extensions/PremiumBadge";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import {
  LockedContainer,
  LockedIcon,
  LockedTitle,
  LockedDesc,
  LockedBtn,
} from "../shared";

export type LockedVariant = "pro" | "enterprise" | "coming-soon";

interface LockedScreenProps {
  variant: LockedVariant;
  /** Override the title text */
  title?: string;
  /** Body description */
  message?: string;
  /** CTA label for coming-soon variant (e.g. "Get notified →") */
  waitlistLabel?: string;
  /** Called when waitlist CTA is clicked — coming-soon only */
  onWaitlist?: () => void;
  /** Called when upgrade CTA is clicked — pro/enterprise only */
  onUpgrade?: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({
  variant,
  title,
  message,
  waitlistLabel,
  onWaitlist,
  onUpgrade,
}) => {
  if (variant === "coming-soon") {
    return (
      <LockedContainer>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔜</div>
        <LockedTitle>{title ?? "Coming Soon"}</LockedTitle>
        {message && <LockedDesc>{message}</LockedDesc>}
        {waitlistLabel && (
          <LockedBtn onClick={onWaitlist}>{waitlistLabel}</LockedBtn>
        )}
      </LockedContainer>
    );
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Absolute dashboard billing URL — the editor runs on its own origin
      // (port 5050), and "/dashboard/settings/subscription" was both a
      // wrong-origin relative link AND a 404 (no such page). Billing lives
      // at /dashboard/settings/billing.
      window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank");
    }
  };

  return (
    <LockedContainer>
      <LockedIcon>
        <PremiumBadge size="lg" />
      </LockedIcon>
      <LockedTitle>Available in {variant === "pro" ? "Pro" : "Enterprise"}</LockedTitle>
      <LockedDesc>{message ?? "Upgrade your plan to unlock this feature."}</LockedDesc>
      <LockedBtn
        onClick={handleUpgrade}
        aria-label={`Upgrade to ${variant === "pro" ? "Pro" : "Enterprise"} plan`}
      >
        Upgrade Now
      </LockedBtn>
    </LockedContainer>
  );
};
