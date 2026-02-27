/**
 * Unified ControlRow Component for Pro Inspector
 *
 * Standardizes label+input row patterns across all inspector sections.
 * Provides consistent styling, accessibility, and state handling.
 *
 * @example
 * // Basic usage
 * <ControlRow label="Width">
 *   <NumberInput value={styles.width} onChange={...} />
 * </ControlRow>
 *
 * // With tooltip and disabled state
 * <ControlRow label="Grow" tooltip="Flex grow factor" disabled disabledReason="Parent is not flex">
 *   <NumberInput value={0} onChange={...} />
 * </ControlRow>
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "./controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface ControlRowProps {
  /** Label text displayed on the left */
  label: string;
  /** Label width preset: sm=50px, md=70px, lg=90px */
  labelWidth?: "sm" | "md" | "lg";
  /** Optional tooltip shown on hover */
  tooltip?: string;
  /** Disables the entire row */
  disabled?: boolean;
  /** Explanation shown when disabled */
  disabledReason?: string;
  /** Optional icon before the label */
  icon?: React.ReactNode;
  /** Control element(s) */
  children: React.ReactNode;
  /** Additional CSS class for the row */
  className?: string;
  /** Row layout variant */
  variant?: "default" | "stacked" | "compact";
}

// ============================================================================
// LABEL WIDTH MAP
// ============================================================================

const LABEL_WIDTHS = {
  sm: 50,
  md: 70,
  lg: 90,
} as const;

// ============================================================================
// STYLES
// ============================================================================

const getRowStyle = (
  variant: ControlRowProps["variant"],
  disabled?: boolean
): React.CSSProperties => ({
  display: variant === "stacked" ? "block" : "flex",
  alignItems: variant === "stacked" ? undefined : "center",
  gap: variant === "compact" ? 4 : 8,
  marginBottom: variant === "compact" ? 6 : 12,
  opacity: disabled ? 0.5 : 1,
  pointerEvents: disabled ? "none" : "auto",
});

const getLabelStyle = (
  labelWidth: "sm" | "md" | "lg",
  variant: ControlRowProps["variant"]
): React.CSSProperties => ({
  fontSize: variant === "compact" ? 10 : 11,
  color: INSPECTOR_TOKENS.textTertiary,
  fontWeight: 500,
  minWidth: variant === "stacked" ? undefined : LABEL_WIDTHS[labelWidth],
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginBottom: variant === "stacked" ? 4 : 0,
});

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ControlRow: React.FC<ControlRowProps> = ({
  label,
  labelWidth = "md",
  tooltip,
  disabled = false,
  disabledReason,
  icon,
  children,
  variant = "default",
}) => {
  const titleText = disabled && disabledReason ? disabledReason : tooltip;

  return (
    <div style={getRowStyle(variant, disabled)} title={titleText} role="group" aria-label={label}>
      <label style={getLabelStyle(labelWidth, variant)}>
        {icon}
        {label}
      </label>
      <div style={contentStyle}>{children}</div>
    </div>
  );
};

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

/**
 * Compact row for dense layouts (like flex item controls)
 */
export const CompactRow: React.FC<Omit<ControlRowProps, "variant">> = (props) => (
  <ControlRow {...props} variant="compact" labelWidth="sm" />
);

/**
 * Stacked row where label is above controls
 */
export const StackedRow: React.FC<Omit<ControlRowProps, "variant">> = (props) => (
  <ControlRow {...props} variant="stacked" />
);

/**
 * Section sub-title row (no controls, just label)
 */
export interface SubTitleProps {
  children: React.ReactNode;
  marginTop?: number;
}

export const SubTitle: React.FC<SubTitleProps> = ({ children, marginTop = 12 }) => (
  <div
    style={{
      fontSize: 9,
      color: INSPECTOR_TOKENS.textMuted,
      fontWeight: 600,
      marginBottom: 8,
      marginTop,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}
  >
    {children}
  </div>
);

export default ControlRow;
