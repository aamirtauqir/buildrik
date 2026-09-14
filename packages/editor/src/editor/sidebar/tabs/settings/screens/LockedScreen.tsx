/**
 * Locked screen — the plan gate, Clone 3397:32859 (`Custom code` on a FREE
 * plan): one card — the plan pill, `<Feature> is a Pro feature`, what the
 * feature does, `Upgrade to Pro` → the dashboard's billing page. The shell
 * mounts it in place of any screen `SCREEN_PLAN_REQUIREMENTS` gates, so the
 * feature name and the body line come in as props (`LOCKED_COPY` carries the
 * two gated screens').
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge, Button } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

/*
  "coming-soon" lived here with a waitlist CTA and no consumer. The only
  construction site is SettingsTab, `variant={requiredPlan}`, and
  SCREEN_PLAN_REQUIREMENTS is typed Record<string, "pro" | "enterprise"> — so
  the branch was unreachable by type, not by accident. The union matches what
  can actually arrive.
*/
export type LockedVariant = "pro" | "enterprise";

const PLAN: Record<LockedVariant, { name: string; article: "a" | "an" }> = {
  pro: { name: "Pro", article: "a" },
  enterprise: { name: "Enterprise", article: "an" },
};

/** The feature name + body line per gated screen id (`SCREEN_PLAN_REQUIREMENTS`'s keys). */
export const LOCKED_COPY: Record<string, { feature: string; body: string }> = {
  "custom-code": {
    feature: "Custom code",
    body:
      "Custom code injects your own <head> markup, end-of-<body> scripts and CSS into every published page — analytics, fonts, chat widgets. It ships on every publish.",
  },
  integrations: {
    feature: "Integrations",
    body:
      "Integrations connect your published site to the services you already run — forms, payments, email and automation — without pasting code by hand.",
  },
};

interface LockedScreenProps {
  variant: LockedVariant;
  /** The feature's name, as the title's subject — `Custom code is a Pro feature`. */
  feature?: string;
  /** What the feature does, one or two lines under the title. */
  body?: string;
  /** Called when the upgrade CTA is clicked; defaults to opening dashboard billing. */
  onUpgrade?: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({
  variant,
  feature = "This feature",
  body = "Upgrade your plan to unlock it.",
  onUpgrade,
}) => {
  const { name: plan, article } = PLAN[variant];
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
    <div
      data-testid="set-locked"
      className="tw:flex tw:max-w-2xl tw:flex-col tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-6 tw:py-5 tw:text-center"
    >
      {/* The frame draws the plan pill in the accent tint, not the purple ramp
          the PRO badge wears elsewhere — the Clone is the visual contract. */}
      <Badge className="tw:rounded-full tw:border tw:border-[var(--bk-accent-subtle)] tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:py-0 tw:text-[length:var(--bk-text-11)] tw:font-semibold tw:uppercase tw:leading-4 tw:text-[var(--bk-accent-text)]">
        {plan}
      </Badge>
      <h3 className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">
        {feature} is {article} {plan} feature
      </h3>
      <p className="tw:m-0 tw:max-w-md tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        {body}
      </p>
      <Button
        type="button"
        variant="primary"
        size="xs"
        data-testid="set-locked-upgrade"
        onClick={handleUpgrade}
        aria-label={`Upgrade to ${plan} plan`}
        className="tw:mt-1 tw:text-[length:var(--bk-text-13)]"
      >
        Upgrade to {plan}
      </Button>
    </div>
  );
};
