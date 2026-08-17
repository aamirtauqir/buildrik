/**
 * UpgradeModal — board 1175:4804, the plan-upgrade prompt.
 *
 * It had no door. The modal is mounted once, globally
 * (`AquibraStudio.tsx:654`), and opens only on an `upgrade-modal-open`
 * window event that this comment used to attribute to "the 403 interceptor".
 * There is no 403 interceptor — nothing in `src/` has ever dispatched that
 * event, so the boarded surface was unreachable for every user. `openUpgrade`
 * below is the dispatcher, and it owns the event name so no call site has to
 * spell it.
 *
 * The prompt the product actually showed was `ProModal`, a second upgrade
 * modal living in the templates tab with no board of its own, a different
 * title and a stale benefit list (it advertised "AI alt-text generation",
 * a path removed from the repo). It is gone; the templates tab calls
 * `openUpgrade` now.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Modal } from "./Modal";
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

const UPGRADE_EVENT = "upgrade-modal-open";

/**
 * Open the upgrade prompt. `feature` completes the board's sentence —
 * "<feature> requires the <plan> plan." — so pass the thing the user just
 * reached for, not a category.
 */
export function openUpgrade(detail: UpgradeEventDetail = {}) {
  window.dispatchEvent(new CustomEvent<UpgradeEventDetail>(UPGRADE_EVENT, { detail }));
}

/**
 * The board lists four. "Unlimited exports" is not one of them here, and that
 * is deliberate: there is no export limit anywhere in `PLAN_LIMITS`, so Free
 * exports without limit too and the line sells nothing. "Custom domain" is a
 * real Free→Pro delta in that table (`customDomains: 0 → 3`), so it takes the
 * slot. The other three are the board's own.
 */
const FEATURES = [
  "Custom domain",
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

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UpgradeEventDetail>).detail;
      setFeature(detail?.feature);
      setRequiredPlan(detail?.requiredPlan || "Pro");
      setInternalOpen(true);
    };
    window.addEventListener(UPGRADE_EVENT, handler);
    return () => window.removeEventListener(UPGRADE_EVENT, handler);
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
          <Button color="light" size="xs" onClick={handleClose}>
            Maybe Later
          </Button>
          <Button size="xs" onClick={handleUpgrade}>
            Upgrade to {requiredPlan}
          </Button>
        </>
      }
    >
      {/* The board sets this block left, on plain white: no centring, and the
          benefit rows carry no tinted card behind them. */}
      <div className="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:py-1">
        <Badge color="purple">{requiredPlan}</Badge>

        <p className="tw:m-0 tw:text-sm tw:text-gray-600 tw:leading-normal">
          {feature
            ? `${feature} requires the ${requiredPlan} plan.`
            : `This feature requires the ${requiredPlan} plan.`}
        </p>

        <div className="tw:flex tw:flex-col tw:gap-2 tw:w-full">
          {FEATURES.map((item) => (
            <div key={item} className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-gray-900">
              <span className="tw:text-[var(--bk-success)] tw:font-semibold tw:text-sm" aria-hidden="true">
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
