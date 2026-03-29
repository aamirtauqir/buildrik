/**
 * Locked screen — plan-gate or coming-soon gate
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PremiumBadge } from "../../../../../shared/ui/PremiumBadge";
import {
  lockedStyles,
  lockedIconStyles,
  lockedTitleStyles,
  lockedDescStyles,
  upgradeBtnStyles,
} from "../styles";

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
      <div style={lockedStyles}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔜</div>
        <h3 style={lockedTitleStyles}>{title ?? "Coming Soon"}</h3>
        {message && <p style={lockedDescStyles}>{message}</p>}
        {waitlistLabel && (
          <button onClick={onWaitlist} style={waitlistBtnStyles}>
            {waitlistLabel}
          </button>
        )}
      </div>
    );
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open("/dashboard/settings/subscription", "_blank");
    }
  };

  return (
    <div style={lockedStyles}>
      <div style={lockedIconStyles}>
        <PremiumBadge size="lg" />
      </div>
      <h3 style={lockedTitleStyles}>Available in {variant === "pro" ? "Pro" : "Enterprise"}</h3>
      <p style={lockedDescStyles}>{message ?? "Upgrade your plan to unlock this feature."}</p>
      <button
        style={upgradeBtnStyles}
        onClick={handleUpgrade}
        aria-label={`Upgrade to ${variant === "pro" ? "Pro" : "Enterprise"} plan`}
      >
        Upgrade Now
      </button>
    </div>
  );
};

const waitlistBtnStyles: React.CSSProperties = {
  marginTop: 16,
  padding: "8px 16px",
  fontSize: "var(--aqb-font-sm, 13px)",
  background: "var(--aqb-primary, #2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
