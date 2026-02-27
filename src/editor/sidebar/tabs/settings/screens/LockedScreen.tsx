/**
 * Locked screen for premium features
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
import type { PlanTier } from "../types";

interface LockedScreenProps {
  plan: PlanTier;
  onUpgrade?: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({ plan, onUpgrade }) => {
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
      <h3 style={lockedTitleStyles}>Available in {plan === "pro" ? "Pro" : "Enterprise"}</h3>
      <p style={lockedDescStyles}>Upgrade your plan to unlock this feature.</p>
      <button
        style={upgradeBtnStyles}
        onClick={handleUpgrade}
        aria-label={`Upgrade to ${plan === "pro" ? "Pro" : "Enterprise"} plan`}
      >
        Upgrade Now
      </button>
    </div>
  );
};
