/**
 * TokenRow — SSOT row primitive consumed by ColorTokenList, TypeTokenList,
 * SpacingTokenList, and GenericTokenList (per spec D6 / T9). One render
 * shape; bespoke FontFamilyRow / TypeScaleRow / ValueChip die in T4-T6.
 *
 * Slots:
 *   - `previewSlot` — left preview (swatch / Aa / spacing bar). Owned by caller.
 *   - `rightSlot`   — optional bespoke right content; overrides the default
 *                     usageChip + inline lint tag render.
 *
 * Behaviors:
 *   - Beginner mode (default): friendly name only.
 *   - Pro mode (`isPro=true`): friendly name + monospace token id + optional
 *     alias arrow chip (`→ {aliasTarget}`).
 *   - Lint: when `lintIssues` non-empty, row shifts to amber state
 *     (background + 3px left border) and appends italic description line
 *     using `lintIssues[0].message`. Default right slot adds `[lint]` tag.
 *
 * A11y: `role="button"` + `tabIndex={0}` + Enter/Space onKeyDown. A
 * `data-token-row` marker drives the regression tests in T4.
 *
 * Inline styles only — no new className (orphan-class memory).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "../../types";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import { TokenUsageChip } from "./TokenUsageChip";

export interface TokenRowProps {
  token: DesignToken;
  /** Left preview slot: swatch / Aa / spacing bar. Provided by caller. */
  previewSlot: React.ReactNode;
  /** Pro mode reveals ID + alias arrow. */
  isPro?: boolean;
  /** Alias target (next-hop) when token aliases another. */
  aliasTarget?: string | null;
  /** Usage count from tokenUsage tracker. */
  usageCount?: number;
  /** Lint issues — when non-empty, row gets warn state. */
  lintIssues?: readonly LintIssue[];
  /** Row click → drill-in detail. */
  onClick?: () => void;
  /** Optional bespoke right-side content. Overrides default (usageChip + lint tag). */
  rightSlot?: React.ReactNode;
}

const idLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontFamily: "var(--bk-font-mono, ui-monospace, monospace)",
  color: "var(--bk-ink-muted)",
};

const aliasChipStyle: React.CSSProperties = {
  color: "var(--bk-accent)",
};

const nameStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 500,
  color: "var(--bk-ink)",
};

const lintDescStyle: React.CSSProperties = {
  fontSize: 11,
  fontStyle: "italic",
  color: "var(--bk-warning-text)",
};

const lintTagStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  padding: "1px 6px",
  borderRadius: 4,
  background: "rgba(245, 158, 11, 0.18)",
  color: "var(--bk-warning-text)",
};

export const TokenRow: React.FC<TokenRowProps> = ({
  token,
  previewSlot,
  isPro = false,
  aliasTarget,
  usageCount,
  lintIssues,
  onClick,
  rightSlot,
}) => {
  const hasLint = !!lintIssues && lintIssues.length > 0;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: hasLint ? "8px 12px 8px 9px" : "8px 12px",
    background: hasLint ? "rgba(245, 158, 11, 0.08)" : "transparent",
    borderLeft: hasLint ? "3px solid var(--bk-warning-text)" : "none",
    cursor: "pointer",
    borderRadius: 4,
    transition: "background 60ms",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-token-row={token.id}
      data-lint-warn={hasLint ? "true" : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => {
        if (!hasLint) e.currentTarget.style.background = "var(--bk-bg-subtle)";
      }}
      onMouseLeave={(e) => {
        if (!hasLint) e.currentTarget.style.background = "transparent";
      }}
      style={rowStyle}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{previewSlot}</span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={nameStyle}>{token.name}</span>
        {isPro && (
          <span style={idLineStyle}>
            <span>{token.id}</span>
            {aliasTarget && <span style={aliasChipStyle}>→ {aliasTarget}</span>}
          </span>
        )}
        {hasLint && (
          <span style={lintDescStyle}>△ {lintIssues![0].message}</span>
        )}
      </div>
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {rightSlot ?? (
          <>
            {usageCount !== undefined && <TokenUsageChip count={usageCount} />}
            {hasLint && <span style={lintTagStyle}>[lint]</span>}
          </>
        )}
      </div>
    </div>
  );
};
