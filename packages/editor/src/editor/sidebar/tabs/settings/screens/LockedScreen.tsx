/**
 * Locked screen — plan gate (Pro / Enterprise)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import {
  LockedContainer,
  LockedIcon,
  LockedTitle,
  LockedDesc,
  LockedBtn,
} from "../shared";

/*
  "coming-soon" lived here with a waitlist CTA and no consumer. The only
  construction site is SettingsTab:601, `variant={requiredPlan}`, and
  SCREEN_PLAN_REQUIREMENTS is typed Record<string, "pro" | "enterprise"> — so
  the branch was unreachable by type, not by accident. Worse, it rendered
  <LockedBtn onClick={onWaitlist}> with no guard on the handler, unlike the
  pro/enterprise path which falls back to the dashboard billing URL. A dead
  branch hiding a live defect. The union now matches what can actually arrive.
*/
export type LockedVariant = "pro" | "enterprise";

interface LockedScreenProps {
  variant: LockedVariant;
  /** Body description */
  message?: string;
  /** Called when upgrade CTA is clicked — pro/enterprise only */
  onUpgrade?: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({
  variant,
  message,
  onUpgrade,
}) => {
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
        <Badge color="purple">PRO</Badge>
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
