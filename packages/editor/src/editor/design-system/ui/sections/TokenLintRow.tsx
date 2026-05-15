/**
 * TokenLintRow — amber inline row that surfaces lint issues on a token.
 *
 * Mounted below a token row when `composer.designSystem.lintState` has
 * visible (non-suppressed) issues for that token. Shows the first issue
 * message, a "Nlints" pill if there are multiple, and 2 actions:
 *
 *   - Auto-fix — fires when the first issue has an `autoFixHint`. Host
 *     resolves the hint (e.g. "darken-22") via `applyContrastFix` and
 *     updates the token registry.
 *   - Ignore — fires `lintState.suppress(tokenId)` upstream, persisting
 *     the dismissal to localStorage.
 *
 * Inline styles only — matches T7/T8/T9 precedent per
 * feedback_orphan_classes_pattern.md. No className would map to vibcoder
 * warning colors at this depth.
 *
 * Matches prototype s09 surface A.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { LintIssue } from "../../../../engine/designSystem/LintState";

export interface TokenLintRowProps {
  tokenId: string;
  issues: readonly LintIssue[];
  onAutoFix: (tokenId: string, hint: string | undefined) => void;
  onIgnore: (tokenId: string) => void;
}

const rowStyle: React.CSSProperties = {
  marginTop: 6,
  padding: "8px 12px",
  background: "var(--buildrick-warning-soft, #fef9c3)",
  color: "var(--buildrick-warning-strong, #854d0e)",
  borderRadius: 6,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: 11,
  lineHeight: 1.4,
};

const pillStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 10,
  fontWeight: 500,
  padding: "1px 6px",
  borderRadius: 4,
  background: "rgba(133, 77, 14, 0.12)",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
};

const fixButtonStyle: React.CSSProperties = {
  padding: "2px 8px",
  fontSize: 10,
  fontWeight: 500,
  background: "var(--buildrick-warning-strong, #854d0e)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const ignoreButtonStyle: React.CSSProperties = {
  padding: "2px 8px",
  fontSize: 10,
  fontWeight: 500,
  background: "transparent",
  color: "var(--buildrick-warning-strong, #854d0e)",
  border: "1px solid currentColor",
  borderRadius: 4,
  cursor: "pointer",
};

export const TokenLintRow: React.FC<TokenLintRowProps> = ({
  tokenId,
  issues,
  onAutoFix,
  onIgnore,
}) => {
  if (issues.length === 0) return null;
  const first = issues[0];
  return (
    <div style={rowStyle} role="note" data-token-lint-row={tokenId}>
      <div style={headerRowStyle}>
        <span aria-hidden="true">⚠</span>
        <span>{first.message}</span>
        {issues.length > 1 && <span style={pillStyle}>{issues.length} lints</span>}
      </div>
      <div style={actionRowStyle}>
        {first.autoFixHint && (
          <button
            type="button"
            onClick={() => onAutoFix(tokenId, first.autoFixHint)}
            style={fixButtonStyle}
          >
            Auto-fix
          </button>
        )}
        <button type="button" onClick={() => onIgnore(tokenId)} style={ignoreButtonStyle}>
          Ignore
        </button>
      </div>
    </div>
  );
};
