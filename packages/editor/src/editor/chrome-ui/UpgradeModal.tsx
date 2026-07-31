/**
 * UpgradeModal — plan-upgrade prompt.
 *
 * Can be controlled via props, and also self-opens on the global
 * "upgrade-modal-open" custom event dispatched by the 403 interceptor.
 * Ported from shared/extensions/UpgradeModal (extensions drain); the
 * PremiumBadge dependency is replaced by Badge kind="pro".
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Modal } from "@/editor/ui/Modal";
import { Button, Badge } from "flowbite-react";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

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

const FEATURES = [
  "Unlimited exports",
  "Premium templates",
  "AI-powered features",
  "Priority support",
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen: controlledOpen,
  onClose: controlledClose,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [feature, setFeature] = React.useState<string | undefined>();
  const [requiredPlan, setRequiredPlan] = React.useState("Pro");

  const isOpen = controlledOpen ?? internalOpen;
  const handleClose = controlledClose ?? (() => setInternalOpen(false));

  // Listen for upgrade-modal-open events from the 403 interceptor.
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
    // Absolute dashboard billing URL — the editor runs on its own origin, so a
    // relative path would 404. Billing lives at /dashboard/settings/billing.
    window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank");
    handleClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Upgrade Your Plan"
      footer={
        <>
          <Button
            color="light"
            size="xs"
            onClick={handleClose}
            className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            Maybe Later
          </Button>
          <Button size="xs" onClick={handleUpgrade}>
            Upgrade to {requiredPlan}
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-2 tw:text-center">
        <Badge color="purple">{requiredPlan}</Badge>

        <p className="tw:m-0 tw:text-sm tw:text-gray-600 tw:leading-normal">
          {feature
            ? `${feature} requires the ${requiredPlan} plan.`
            : `This feature requires the ${requiredPlan} plan.`}
        </p>

        <div className="tw:flex tw:flex-col tw:gap-2 tw:w-full tw:py-3 tw:px-4 tw:bg-gray-100 tw:rounded-md tw:border tw:border-gray-200 tw:text-left">
          {FEATURES.map((item) => (
            <div key={item} className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-gray-900">
              <span className="tw:text-green-500 tw:font-semibold tw:text-sm" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
