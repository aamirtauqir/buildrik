/**
 * UpgradeModal - Modal prompt for plan upgrades
 * Can be triggered by 403 responses or UI interactions.
 * Listens for "upgrade-modal-open" custom events.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "./Modal";
import { PremiumBadge } from "./PremiumBadge";

export interface UpgradeModalProps {
  /** Controlled open state (optional — also responds to events) */
  isOpen?: boolean;
  /** Controlled close handler */
  onClose?: () => void;
}

interface UpgradeEventDetail {
  feature?: string;
  requiredPlan?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen: controlledOpen,
  onClose: controlledClose,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [feature, setFeature] = React.useState<string | undefined>();
  const [requiredPlan, setRequiredPlan] = React.useState("Pro");

  const isOpen = controlledOpen ?? internalOpen;
  const handleClose = controlledClose ?? (() => setInternalOpen(false));

  // Listen for upgrade-modal-open events from 403 interceptor
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UpgradeEventDetail>).detail;
      setFeature(detail?.feature);
      setRequiredPlan(detail?.requiredPlan || "Pro");
      setInternalOpen(true);
    };
    window.addEventListener("upgrade-modal-open", handler);
    return () => window.removeEventListener("upgrade-modal-open", handler);
  }, []);

  const handleUpgrade = () => {
    window.open("/dashboard/settings/subscription", "_blank");
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upgrade Your Plan" size="sm">
      <div style={contentStyle}>
        <PremiumBadge size="lg" label={requiredPlan} />

        <p style={messageStyle}>
          {feature
            ? `${feature} requires the ${requiredPlan} plan.`
            : `This feature requires the ${requiredPlan} plan.`}
        </p>

        <div style={featuresListStyle}>
          <div style={featureRowStyle}>
            <span style={checkStyle}>✓</span>
            <span>Unlimited exports</span>
          </div>
          <div style={featureRowStyle}>
            <span style={checkStyle}>✓</span>
            <span>Premium templates</span>
          </div>
          <div style={featureRowStyle}>
            <span style={checkStyle}>✓</span>
            <span>AI-powered features</span>
          </div>
          <div style={featureRowStyle}>
            <span style={checkStyle}>✓</span>
            <span>Priority support</span>
          </div>
        </div>

        <div style={actionsStyle}>
          <button onClick={handleClose} style={cancelStyle}>
            Maybe Later
          </button>
          <button onClick={handleUpgrade} style={upgradeStyle}>
            Upgrade to {requiredPlan}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// Styles
// ============================================

const contentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  padding: "8px 0",
  textAlign: "center",
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "var(--aqb-text-secondary)",
  lineHeight: 1.5,
};

const featuresListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  padding: "12px 16px",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: 8,
  border: "1px solid var(--aqb-border, rgba(255,255,255,0.08))",
};

const featureRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "var(--aqb-text-primary)",
};

const checkStyle: React.CSSProperties = {
  color: "var(--aqb-success, #22c55e)",
  fontWeight: 700,
  fontSize: 14,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  width: "100%",
  marginTop: 4,
};

const cancelStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  border: "1px solid var(--aqb-border, rgba(255,255,255,0.08))",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const upgradeStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export default UpgradeModal;
