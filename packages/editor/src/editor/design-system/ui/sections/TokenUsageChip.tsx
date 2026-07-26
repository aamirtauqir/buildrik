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
 * Inline styles only — no className. Tests assert on the rendered text
 * ("used 5×" / "unused") rather than orphan className hooks.
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
  fontFamily: "var(--bk-font-mono)",
};

const usedStyle: React.CSSProperties = {
  background: "var(--bk-success-tint)",
  color: "var(--bk-success-text)",
};

const unusedStyle: React.CSSProperties = {
  background: "var(--bk-bg-subtle)",
  color: "var(--bk-ink-muted)",
};

export const TokenUsageChip: React.FC<TokenUsageChipProps> = ({ count }) => {
  const isUsed = count > 0;
  const label = isUsed ? `used ${count}×` : "unused";
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(isUsed ? usedStyle : unusedStyle),
  };
  return <span style={style}>{label}</span>;
};
