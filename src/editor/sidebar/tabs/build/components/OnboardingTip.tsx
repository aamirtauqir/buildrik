/**
 * OnboardingTip — dismissible onboarding banner for Build Tab
 * English only. Dismissed via BUILD_TIP_DISMISSED storage key.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BUILD_TIP } from "../catalog/catalog";

interface OnboardingTipProps {
  dismissed: boolean;
  onDismiss: () => void;
}

export const OnboardingTip: React.FC<OnboardingTipProps> = ({ dismissed, onDismiss }) => {
  if (dismissed) return null;
  return (
    <div className="bld-tip-banner" role="note">
      <span className="bld-tip-banner-text">{BUILD_TIP}</span>
      <button
        className="bld-tip-banner-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss tip"
      >
        Got it ✕
      </button>
    </div>
  );
};
