/**
 * ReviewModal — shows diff of all pending token changes before applying
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { DesignToken } from "../../types";

export interface ReviewModalProps {
  colorTokens: DesignToken[];
  colorDiff: Record<string, { tokenId: string; previousValue: string; currentValue: string }>;
  typeTokens: DesignToken[];
  typeSavedTokens: DesignToken[];
  spacingTokens: DesignToken[];
  spacingSavedTokens: DesignToken[];
  onConfirm: () => void;
  onClose: () => void;
}

const DIFF_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "5px 10px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 6,
  marginBottom: 3,
};

const DIFF_SECTION_HEADER: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--bk-ink-muted)",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  colorTokens,
  colorDiff,
  typeTokens,
  typeSavedTokens,
  spacingTokens,
  spacingSavedTokens,
  onConfirm,
  onClose,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  const changedEntries = Object.values(colorDiff);
  const changedTypeTokens = typeTokens.filter((t) => {
    const saved = typeSavedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const changedSpacingTokens = spacingTokens.filter((t) => {
    const saved = spacingSavedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const totalChanges =
    changedEntries.length + changedTypeTokens.length + changedSpacingTokens.length;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--bk-bg-subtle)",
          border: "1px solid var(--bk-border)",
          borderRadius: 12,
          padding: 20,
          width: 300,
          maxHeight: "70vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--bk-ink)",
            marginBottom: 4,
          }}
        >
          Review changes
        </div>
        <div style={{ fontSize: 12, color: "var(--bk-ink-muted)", marginBottom: 14 }}>
          {totalChanges} token{totalChanges !== 1 ? "s" : ""} will be updated
        </div>

        {/* Color changes */}
        {changedEntries.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={DIFF_SECTION_HEADER}>Color Changes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {changedEntries.map((diff) => {
                const token = colorTokens.find((t) => t.id === diff.tokenId);
                return (
                  <div
                    key={diff.tokenId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: diff.previousValue,
                        border: "1px solid rgba(255,255,255,0.1)",
                        flexShrink: 0,
                      }}
                    />
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="var(--bk-ink-muted)"
                      strokeWidth="1.5"
                    >
                      <path d="M2 6h8M8 3l3 3-3 3" strokeLinecap="round" />
                    </svg>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: diff.currentValue,
                        border: "1px solid rgba(255,255,255,0.1)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--bk-ink)", flex: 1 }}>
                      {token?.name ?? diff.tokenId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Typography changes */}
        {changedTypeTokens.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={DIFF_SECTION_HEADER}>Typography Changes</div>
            {changedTypeTokens.map((t) => {
              const savedVal = typeSavedTokens.find((s) => s.id === t.id)?.value ?? "—";
              return (
                <div key={t.id} style={DIFF_ROW_STYLE}>
                  <span style={{ fontSize: 12, color: "var(--bk-ink)", flex: 1 }}>
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "var(--bk-ink-muted)",
                      textDecoration: "line-through",
                    }}
                  >
                    {savedVal}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>→</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "var(--bk-success)",
                    }}
                  >
                    {t.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Spacing changes */}
        {changedSpacingTokens.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={DIFF_SECTION_HEADER}>Spacing Changes</div>
            {changedSpacingTokens.map((t) => {
              const savedVal = spacingSavedTokens.find((s) => s.id === t.id)?.value ?? "—";
              return (
                <div key={t.id} style={DIFF_ROW_STYLE}>
                  <span style={{ fontSize: 12, color: "var(--bk-ink)", flex: 1 }}>
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "var(--bk-ink-muted)",
                      textDecoration: "line-through",
                    }}
                  >
                    {savedVal}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>→</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "var(--bk-success)",
                    }}
                  >
                    {t.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Button
            ref={cancelRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
          >
            Save to site
          </Button>
        </div>
      </div>
    </div>
  );
};
