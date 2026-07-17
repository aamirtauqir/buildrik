/**
 * Phase 4 T7 triage: keep-as-extension (composition).
 *
 * Rationale: Composes `Modal` (T5 shim — already inherited automatically
 * via the local `./Modal` import on line 11) + `PremiumBadge` + 403
 * event listener. Business orchestration above primitives, not a
 * primitive itself. The visual surface already routes through the T5
 * Modal -> Radix.Dialog swap with no codemod required.
 *
 * Phase 5 disposition: keep. Substrate (Modal, PremiumBadge) may
 * evolve underneath without touching this file.
 *
 * @license BSD-3-Clause
 */
/**
 * UpgradeModal - Modal prompt for plan upgrades
 * Can be triggered by 403 responses or UI interactions.
 * Listens for "upgrade-modal-open" custom events.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { PremiumBadge } from "@/shared/extensions/PremiumBadge";

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
    // Absolute dashboard billing URL — editor runs on its own origin and
    // "/dashboard/settings/subscription" was a wrong-origin 404. Billing is
    // at /dashboard/billing.
    const dashboardUrl =
      (import.meta as { env?: { VITE_DASHBOARD_URL?: string } }).env?.VITE_DASHBOARD_URL ||
      "http://localhost:3000";
    window.open(`${dashboardUrl}/dashboard/billing`, "_blank");
    handleClose();
  };

  return (
    <OverlayMount>
      <Modal open={isOpen} onOpenChange={(next) => !next && handleClose()}>
        <ModalContent size="lg">
          <ModalTitle>Upgrade Your Plan</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
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
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
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
  color: "var(--buildrick-text-secondary)",
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
  border: "1px solid var(--buildrick-border, rgba(255,255,255,0.08))",
};

const featureRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "var(--buildrick-text-primary)",
};

const checkStyle: React.CSSProperties = {
  color: "var(--buildrick-success)",
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
  color: "var(--buildrick-text-secondary)",
  border: "1px solid var(--buildrick-border, rgba(255,255,255,0.08))",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const upgradeStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  background: "var(--buildrick-accent)",
  color: "var(--buildrick-text-on-accent)",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export default UpgradeModal;
