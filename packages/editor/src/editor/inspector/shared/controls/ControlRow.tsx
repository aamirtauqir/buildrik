/**
 * Unified ControlRow — label + control row. Ported to .bdi-row-ctrl.
 * Grid: sm-label | 1fr content. Variants keep legacy API.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

/**
 * Stable anchor for one property row, derived from the label the row shows.
 *
 * Conformance recipes join board row nodes to live rows, and every row in this
 * panel is generated from a profile config — there is no call site to hang a
 * literal id on. The label IS the row's identity on screen and on the board
 * ("Padding", "Radius", "Font size"), so it is what the id is built from.
 * Prefix-first on purpose: `check-anchors` only resolves a template id through
 * the literal text BEFORE the interpolation.
 */
/* One line, deliberately: `check-anchors` resolves a derived id by finding a
   DECLARATION line that both names the helper and carries the template
   literal. Split across two lines it finds neither, and every row anchor in
   this panel reports as missing. */
export const rowTestId = (label: string): string => `inspector-row-${slugify(label)}`;

/** The row's CONTROL, addressed separately — the boards state both boxes. */
export const fieldTestId = (label: string): string => `inspector-field-${slugify(label)}`;

/**
 * The row's LABEL. Three boxes, three anchors: every profile board draws the
 * row (34), the control (160x28 at x120) and the label (12/normal ink-soft at
 * x16) as separate nodes, and the label was the one with nowhere to join.
 */
export const labelTestId = (label: string): string => `inspector-label-${slugify(label)}`;

const slugify = (label: string): string =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
      <div
        className="tw:flex tw:flex-col tw:gap-1"
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
            font: "500 11px var(--bk-font-ui)",
            color: "var(--bk-ink-soft)",
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
      </div>
    );
  }

  return (
    <div
      data-testid={rowTestId(label)}
      className={`bdi-row-ctrl${labelWidth === "md" ? " wide" : ""}${disabled ? " disabled" : ""}`}
      style={{
        gridTemplateColumns:
          labelWidth === "sm" ? undefined : `${LABEL_WIDTHS[labelWidth]}px 1fr`,
      }}
      title={titleText}
      role="group"
      aria-label={label}
    >
      <label className="bdi-lb" data-testid={labelTestId(label)}>
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
