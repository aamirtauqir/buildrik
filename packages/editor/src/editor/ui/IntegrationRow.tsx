/**
 * IntegrationRow — Figma 257:6 (Status · Pro).
 * Settings → Integrations, and anywhere a third-party connection is listed.
 * @license BSD-3-Clause
 */
import React from "react";
import { Badge } from "flowbite-react";

export type IntegrationStatus = "connected" | "available" | "error";

/** flowbite badge color + text-color override per status (flowbite's color
 *  presets don't hex-match --bk-success-text/--bk-error-text exactly — see
 *  docs/plans/flowbite-bigbang-inventory.md "Task 5" Badge mapping). */
const STATUS: Record<IntegrationStatus, { color: string; className?: string; label: string }> = {
  connected: { color: "success", className: "tw:text-green-600", label: "CONNECTED" },
  available: { color: "gray", label: "AVAILABLE" },
  error: { color: "failure", className: "tw:text-red-700", label: "ERROR" },
};

export interface IntegrationRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  scope: string;
  status?: IntegrationStatus;
  pro?: boolean;
  logo?: React.ReactNode;
  action?: React.ReactNode;
}

export function IntegrationRow({
  name, scope, status = "available", pro, logo, action, className, ...rest
}: IntegrationRowProps) {
  const s = STATUS[status];
  return (
    <div className={["bk-row", "bk-integration-row", className].filter(Boolean).join(" ")} {...rest}>
      {logo ? <span className="bk-row__icon">{logo}</span> : null}
      <span className="bk-integration-row__body">
        <span className="bk-integration-row__name">{name}</span>
        <span className="bk-integration-row__scope">{scope}</span>
      </span>
      {pro ? <Badge color="purple">PRO</Badge> : null}
      <Badge color={s.color} className={s.className}>{s.label}</Badge>
      {action}
    </div>
  );
}
