/**
 * Unified ControlRow — label + control row. Ported to .bdi-row-ctrl.
 * Grid: sm-label | 1fr content. Variants keep legacy API.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Stack } from "@/editor/shared/vibcoder/Stack";

export interface ControlRowProps {
  label: string;
  /** Label width preset: sm=44 (default), md=64, lg=90 */
  labelWidth?: "sm" | "md" | "lg";
  tooltip?: string;
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "stacked" | "compact";
}

const LABEL_WIDTHS = {
  sm: 44,
  md: 64,
  lg: 90,
} as const;

export const ControlRow: React.FC<ControlRowProps> = ({
  label,
  labelWidth = "sm",
  tooltip,
  disabled = false,
  disabledReason,
  icon,
  children,
  variant = "default",
}) => {
  const titleText = disabled && disabledReason ? disabledReason : tooltip;

  if (variant === "stacked") {
    return (
      <Stack
        gap="xs"
        role="group"
        aria-label={label}
        title={titleText}
        style={{
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        <label
          style={{
            font: "500 11px var(--bd-font)",
            color: "var(--bd-fg-secondary)",
            letterSpacing: "-0.005em",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {icon}
          {label}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          {children}
        </div>
      </Stack>
    );
  }

  return (
    <div
      className={`bdi-row-ctrl${labelWidth === "md" ? " wide" : ""}${disabled ? " disabled" : ""}`}
      style={{
        gridTemplateColumns:
          labelWidth === "sm" ? undefined : `${LABEL_WIDTHS[labelWidth]}px 1fr`,
      }}
      title={titleText}
      role="group"
      aria-label={label}
    >
      <label className="bdi-lb">
        {icon}
        {label}
      </label>
      <div className="bdi-row-content">{children}</div>
    </div>
  );
};

export const CompactRow: React.FC<Omit<ControlRowProps, "variant">> = (props) => (
  <ControlRow {...props} variant="compact" labelWidth="sm" />
);

export const StackedRow: React.FC<Omit<ControlRowProps, "variant">> = (props) => (
  <ControlRow {...props} variant="stacked" />
);

export interface SubTitleProps {
  children: React.ReactNode;
  marginTop?: number;
}

export const SubTitle: React.FC<SubTitleProps> = ({ children, marginTop = 6 }) => (
  <div
    className="bdi-sub-label"
    style={{ marginTop }}
  >
    {children}
  </div>
);

export default ControlRow;
