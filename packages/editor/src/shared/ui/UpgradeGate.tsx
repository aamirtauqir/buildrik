/**
 * UpgradeGate - Conditionally gates premium content behind plan check
 * Shows locked overlay when user plan is insufficient.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PremiumBadge } from "./PremiumBadge";

export type PlanLevel = "free" | "pro" | "enterprise";

export interface UpgradeGateProps {
  /** User's current plan */
  currentPlan: PlanLevel;
  /** Minimum plan required to access content */
  requiredPlan: PlanLevel;
  /** Content to render when plan is sufficient */
  children: React.ReactNode;
  /** Callback when user clicks upgrade */
  onUpgrade?: () => void;
  /** Feature name shown in locked state */
  featureName?: string;
}

const PLAN_RANK: Record<PlanLevel, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export const UpgradeGate: React.FC<UpgradeGateProps> = ({
  currentPlan,
  requiredPlan,
  children,
  onUpgrade,
  featureName,
}) => {
  const hasAccess = PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open("/dashboard/settings/subscription", "_blank");
    }
  };

  const planLabel = requiredPlan === "pro" ? "Pro" : "Enterprise";

  return (
    <div
      style={containerStyle}
      role="status"
      aria-label={`${featureName || "This feature"} requires ${planLabel} plan`}
    >
      <div style={overlayStyle}>
        <PremiumBadge size="md" label={planLabel} />
        <p style={messageStyle}>
          {featureName ? `${featureName} is` : "This feature is"} available on the {planLabel} plan.
        </p>
        <button style={upgradeButtonStyle} onClick={handleUpgrade}>
          Upgrade to {planLabel}
        </button>
      </div>
      <div style={blurredContentStyle} aria-hidden="true">
        {children}
      </div>
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 8,
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  background: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(4px)",
  borderRadius: 8,
};

const blurredContentStyle: React.CSSProperties = {
  filter: "blur(3px)",
  opacity: 0.4,
  pointerEvents: "none",
  userSelect: "none",
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "var(--aqb-text-secondary)",
  textAlign: "center",
  maxWidth: 200,
};

const upgradeButtonStyle: React.CSSProperties = {
  padding: "8px 20px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export default UpgradeGate;
