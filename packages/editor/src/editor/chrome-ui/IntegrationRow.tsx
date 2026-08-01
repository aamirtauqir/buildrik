/**
 * IntegrationRow — Figma 257:6 (Status · Pro).
 * Settings → Integrations, and anywhere a third-party connection is listed.
 * @license BSD-3-Clause
 */
import React from "react";
import { Badge } from "flowbite-react";
import { ROW_ICON_CLASS } from "./Row";

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

/** Self-contained recreation of the former `.bk-row` + `.bk-integration-row`
 *  combined effect (same rationale as FormatRow's BASE, in the same commit). */
const BASE =
  "tw:flex tw:items-center tw:gap-3 tw:h-16 tw:px-4 tw:w-full tw:text-left tw:border tw:border-gray-200 " +
  "tw:rounded-lg tw:bg-white tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-900 " +
  "tw:[transition:var(--bk-transition-fast)]";

export function IntegrationRow({
  name, scope, status = "available", pro, logo, action, className, ...rest
}: IntegrationRowProps) {
  const s = STATUS[status];
  return (
    <div className={[BASE, className].filter(Boolean).join(" ")} {...rest}>
      {logo ? <span className={ROW_ICON_CLASS}>{logo}</span> : null}
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        <span className="tw:font-medium">{name}</span>
        <span className="tw:text-gray-500 tw:text-xs">{scope}</span>
      </span>
      {pro ? <Badge color="purple">PRO</Badge> : null}
      <Badge color={s.color} className={s.className}>{s.label}</Badge>
      {action}
    </div>
  );
}
