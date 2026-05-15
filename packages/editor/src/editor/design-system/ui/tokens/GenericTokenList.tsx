import * as React from "react";
import type { DesignToken } from "../../types";
import { useDSModeOptional } from "../../state/DSModeContext";
import { TokenUsageChip } from "../sections/TokenUsageChip";
import { TokenLintRow } from "../sections/TokenLintRow";
import type { LintIssue } from "../../../../engine/designSystem/LintState";

interface GenericTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, string>;
  onTokenChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
  /** Per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
  /** T10: visible lint issues for a token (from composer.designSystem.lintState). */
  getLintIssues?: (tokenId: string) => readonly LintIssue[];
  /** T10: Auto-fix click — host applies the hint + suppresses the row. */
  onLintAutoFix?: (tokenId: string, hint: string | undefined) => void;
  /** T10: Ignore click — host calls lintState.suppress(tokenId). */
  onLintIgnore?: (tokenId: string) => void;
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  // 4 cols: label · input · Restore · usage chip. minmax(0,1fr) prevents the
  // label column from forcing horizontal overflow when the panel is narrow.
  // Input column kept at 140px — shadow/motion/border values commonly run
  // >20 chars and would clip visibly at a tighter width.
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 140px auto auto",
  gap: 6,
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-primary)",
};

const metaStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  fontFamily: "var(--bd-font-mono, monospace)",
  marginTop: 2,
};

const inputStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "var(--bd-bg-elevated)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
  fontFamily: "var(--bd-font-mono, monospace)",
};

const restoreButtonStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "transparent",
  color: "var(--bd-fg-muted)",
  fontSize: 11,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: "16px 0",
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  textAlign: "center",
};

export const GenericTokenList: React.FC<GenericTokenListProps> = ({
  tokens,
  pendingDiff,
  onTokenChange,
  onUndo,
  canUndo,
  usageByTokenId,
  getLintIssues,
  onLintAutoFix,
  onLintIgnore,
}) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";

  if (tokens.length === 0) {
    return <div style={emptyStyle}>No tokens yet — defaults will appear once seeded.</div>;
  }

  return (
    <div style={listStyle}>
      {tokens.map((t) => {
        const friendly = t.friendlyName ?? t.name;
        const isDirty = pendingDiff[t.id] !== undefined;
        const undoable = canUndo(t.id);
        const usage = usageByTokenId?.get(t.id) ?? 0;
        const lintIssues = getLintIssues?.(t.id) ?? [];
        return (
          <div key={t.id}>
            <div style={rowStyle}>
              <div>
                <div style={labelStyle}>{friendly}</div>
                {isPro && (
                  <div style={metaStyle}>
                    {t.id} · {t.cssVar}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={t.value}
                onChange={(e) => onTokenChange(t.id, e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: isDirty ? "var(--bd-warning)" : "var(--bd-border)",
                }}
                aria-label={`${friendly} value`}
              />
              <button
                type="button"
                disabled={!undoable}
                onClick={() => onUndo(t.id)}
                style={{
                  ...restoreButtonStyle,
                  opacity: undoable ? 1 : 0.4,
                  cursor: undoable ? "pointer" : "not-allowed",
                }}
                aria-label={`Restore ${friendly}`}
              >
                Restore
              </button>
              <TokenUsageChip count={usage} />
            </div>
            {lintIssues.length > 0 && (
              <TokenLintRow
                tokenId={t.id}
                issues={lintIssues}
                onAutoFix={(id, hint) => onLintAutoFix?.(id, hint)}
                onIgnore={(id) => onLintIgnore?.(id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
