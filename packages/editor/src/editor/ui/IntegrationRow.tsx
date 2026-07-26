/**
 * IntegrationRow — Figma 257:6 (Status · Pro).
 * Settings → Integrations, and anywhere a third-party connection is listed.
 * @license BSD-3-Clause
 */
import React from "react";
import { Badge } from "./Badge";

export type IntegrationStatus = "connected" | "available" | "error";

const STATUS: Record<IntegrationStatus, { kind: "success" | "neutral" | "danger"; label: string }> = {
  connected: { kind: "success", label: "CONNECTED" },
  available: { kind: "neutral", label: "AVAILABLE" },
  error: { kind: "danger", label: "ERROR" },
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
      {pro ? <Badge kind="pro">PRO</Badge> : null}
      <Badge kind={s.kind}>{s.label}</Badge>
      {action}
    </div>
  );
}
