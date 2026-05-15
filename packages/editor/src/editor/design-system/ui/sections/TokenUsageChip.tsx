/**
 * TokenUsageChip — small pill that shows how many times a design token is
 * referenced from element style bindings.
 *
 * Counts come from `composer.designSystem.tokenUsage` (TokenUsageTracker).
 * Rendering is pure — parent owns the count + subscription.
 *
 *   count > 0  → green "used Nx" chip
 *   count == 0 → muted "unused" chip
 *
 * Inline styles + className: className gives tests a deterministic hook;
 * inline styles avoid the orphan-class trap (className with no matching
 * CSS rule = invisible in production).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TokenUsageChipProps {
  count: number;
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "var(--buildrick-font-mono, ui-monospace, monospace)",
};

const usedStyle: React.CSSProperties = {
  background: "var(--buildrick-success-soft, #dcfce7)",
  color: "var(--buildrick-success-strong, #16a34a)",
};

const unusedStyle: React.CSSProperties = {
  background: "var(--bd-bg-muted, #f1f5f9)",
  color: "var(--bd-fg-muted, #64748b)",
};

export const TokenUsageChip: React.FC<TokenUsageChipProps> = ({ count }) => {
  const isUsed = count > 0;
  const variantClass = isUsed
    ? "ds-token-usage-chip--used"
    : "ds-token-usage-chip--unused";
  const label = isUsed ? `used ${count}×` : "unused";
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(isUsed ? usedStyle : unusedStyle),
  };
  return (
    <span className={`ds-token-usage-chip ${variantClass}`} style={style}>
      {label}
    </span>
  );
};
