import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Billing screen — plan info and upgrade prompt
 * Shows plan badge, feature list with lock icons, and upgrade CTA on free plan.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PlanTier } from "../types";
import { Screen } from "../shared";

interface BillingScreenProps {
  /** Current user plan — controls whether upgrade prompt is shown */
  userPlan?: PlanTier;
  /** Called when the Upgrade button is clicked */
  onUpgrade?: () => void;
}

const PRO_FEATURES = [
  "Custom domain support",
  "Remove Buildrik branding",
  "Advanced analytics & integrations",
];

const LockIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const BillingScreen: React.FC<BillingScreenProps> = ({
  userPlan = "starter",
  onUpgrade,
}) => {
  const isFreePlan = userPlan === "starter";
  const planLabel = userPlan === "enterprise" ? "Enterprise" : userPlan === "pro" ? "Pro" : "Free Plan";

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open("/dashboard/settings/subscription", "_blank");
    }
  };

  return (
    <Screen>
      {/* Current plan badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "var(--bd-bg-subtle)",
          borderRadius: "var(--buildrick-radius-sm)",
          border: "1px solid var(--bd-border)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--bd-fg-muted)",
              marginBottom: 2,
            }}
          >
            Current plan
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bd-fg-primary)" }}>
            {planLabel}
          </div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "var(--buildrick-radius-full)",
            background: isFreePlan ? "var(--bd-bg-hover)" : "rgba(45,109,255,0.12)",
            color: isFreePlan ? "var(--bd-fg-secondary)" : "var(--bd-accent)",
            fontSize: 12,
            fontWeight: 600,
            border: isFreePlan
              ? "1px solid var(--bd-border)"
              : "1px solid rgba(45,109,255,0.25)",
          }}
        >
          {planLabel}
        </span>
      </div>
      {/* Upgrade prompt — only for free plan */}
      {isFreePlan && (
        <div
          style={{
            padding: "14px",
            background: "rgba(45,109,255,0.06)",
            borderRadius: "var(--buildrick-radius-sm)",
            border: "1px solid rgba(45,109,255,0.15)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--bd-fg-primary)",
              marginBottom: 10,
            }}
          >
            Unlock Pro features
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {PRO_FEATURES.map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--bd-fg-secondary)",
                }}
              >
                <span style={{ color: "var(--bd-fg-muted)" }}>
                  <LockIcon />
                </span>
                {feature}
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            style={{
              width: "100%",
              padding: "9px 16px",
              background: "var(--bd-accent)",
              border: "none",
              borderRadius: "var(--buildrick-radius-sm)",
              color: "var(--bd-fg-on-accent)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            aria-label="Upgrade to Pro plan"
          >
            Upgrade to Pro
          </Button>
        </div>
      )}
      {/* Already on Pro/Enterprise */}
      {!isFreePlan && (
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(34,197,94,0.06)",
            borderRadius: "var(--buildrick-radius-sm)",
            border: "1px solid rgba(34,197,94,0.15)",
            fontSize: 13,
            color: "var(--bd-fg-secondary)",
          }}
        >
          You have access to all {planLabel} features.
        </div>
      )}
      <div
        style={{
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          lineHeight: 1.5,
          paddingTop: 4,
        }}
      >
        Billing is managed through the Buildrik dashboard.{" "}
        <a
          href="/dashboard/settings/subscription"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--bd-accent)", textDecoration: "none" }}
        >
          Manage subscription →
        </a>
      </div>
    </Screen>
  );
};
