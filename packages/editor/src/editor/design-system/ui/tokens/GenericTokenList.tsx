import * as React from "react";
import type { DesignToken } from "../../types";
import { useDSModeOptional } from "../../state/DSModeContext";
import { TokenUsageChip } from "../sections/TokenUsageChip";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Input } from "@/editor/shared/vibcoder/Input";

interface GenericTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, string>;
  onTokenChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
  /** Per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
  /** T7: visible lint issues for a token (from composer.designSystem.lintState).
   *  Drives inline row warn state (amber bg + borderLeft + italic description +
   *  [lint] tag). Auto-fix / Ignore actions live in T8 detail view per D7. */
  getLintIssues?: (tokenId: string) => readonly LintIssue[];
  /** T8: row click → drill-in detail. Wired to the row's outer container so
   *  it doesn't compete with the inline input/restore controls. */
  onRowClick?: (tokenId: string) => void;
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
  color: "var(--bk-ink)",
};

const metaStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bk-ink-muted)",
  fontFamily: "var(--bk-font-mono, monospace)",
  marginTop: 2,
};

const inputStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  background: "var(--bk-bg-card)",
  color: "var(--bk-ink)",
  fontSize: 12,
  fontFamily: "var(--bk-font-mono, monospace)",
};

const restoreButtonStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  background: "transparent",
  color: "var(--bk-ink-muted)",
  fontSize: 11,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: "16px 0",
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  textAlign: "center",
};

// T7 inline lint state — matches TokenRow primitive's render shape.
// Row gets amber bg + 3px left border (paddingLeft compensates), italic
// description line after the editable group, and a [lint] tag after the
// usage chip. Auto-fix + Ignore buttons move to T8 detail view per D7.
const lintRowContainerStyle: React.CSSProperties = {
  background: "rgba(245, 158, 11, 0.08)",
  borderLeft: "3px solid var(--bk-warning-text)",
  borderRadius: 4,
  // Inner row already has its own grid padding — outer wrapper pads by 3px
  // less on the left so total visual padding stays constant.
  paddingLeft: 9,
  paddingTop: 4,
  paddingRight: 12,
  paddingBottom: 6,
  // Compensate for the 12px-on-left padding of the inner grid (rowStyle has
  // no padding — gap-only). Just match the outer wrapper sizing.
};

const lintDescStyle: React.CSSProperties = {
  fontSize: 11,
  fontStyle: "italic",
  color: "var(--bk-warning-text)",
  marginTop: 4,
};

const lintTagStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  padding: "1px 6px",
  borderRadius: 4,
  background: "rgba(245, 158, 11, 0.18)",
  color: "var(--bk-warning-text)",
};

export const GenericTokenList: React.FC<GenericTokenListProps> = ({
  tokens,
  pendingDiff,
  onTokenChange,
  onUndo,
  canUndo,
  usageByTokenId,
  getLintIssues,
  onRowClick,
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
        const hasLint = lintIssues.length > 0;
        return (
          <div
            key={t.id}
            data-token-row={t.id}
            data-lint-warn={hasLint ? "true" : undefined}
            style={hasLint ? lintRowContainerStyle : undefined}
          >
            <div style={rowStyle}>
              <div
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(t.id) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(t.id);
                        }
                      }
                    : undefined
                }
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                <div style={labelStyle}>{friendly}</div>
                {isPro && (
                  <div style={metaStyle}>
                    {t.id} · {t.cssVar}
                  </div>
                )}
              </div>
              <Input
                type="text"
                value={t.value}
                onChange={(e) => onTokenChange(t.id, e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: isDirty ? "var(--bk-warning)" : "var(--bk-border)",
                }}
                aria-label={`${friendly} value`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
              </Button>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TokenUsageChip count={usage} />
                {hasLint && <span style={lintTagStyle}>[lint]</span>}
              </div>
            </div>
            {hasLint && (
              <div style={lintDescStyle}>△ {lintIssues[0].message}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
