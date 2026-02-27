/**
 * PremiumBadge - Consistent premium/pro status indicator
 * Replaces scattered lock emoji + icon implementations.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface PremiumBadgeProps {
  /** Display size: "sm" for inline pills, "md" for card overlays, "lg" for locked screens */
  size?: "sm" | "md" | "lg";
  /** Optional label override (defaults to "Pro") */
  label?: string;
}

const LockSvg: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="4" y="8" width="12" height="10" rx="2" />
    <path d="M7 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ size = "sm", label = "Pro" }) => {
  const sizeConfig = SIZES[size];

  return (
    <span style={{ ...baseStyle, ...sizeConfig.container }} aria-label={`${label} feature`}>
      <LockSvg size={sizeConfig.iconSize} />
      {label}
    </span>
  );
};

// ============================================
// Styles
// ============================================

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontWeight: 600,
  background: "linear-gradient(135deg, var(--aqb-primary), #a78bfa)",
  color: "#fff",
  borderRadius: 100,
  whiteSpace: "nowrap",
};

const SIZES = {
  sm: {
    container: { gap: 2, padding: "2px 6px", fontSize: 10 } as React.CSSProperties,
    iconSize: 10,
  },
  md: {
    container: { gap: 4, padding: "4px 10px", fontSize: 12 } as React.CSSProperties,
    iconSize: 14,
  },
  lg: {
    container: { gap: 6, padding: "6px 14px", fontSize: 14 } as React.CSSProperties,
    iconSize: 18,
  },
};

export default PremiumBadge;
