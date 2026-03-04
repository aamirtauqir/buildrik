/**
 * DesignTabFooter — bottom bar with Revert and Review & Save buttons
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FooterProps {
  isDirty: boolean;
  dirtyCount: number;
  onDiscard: () => void;
  onReview: () => void;
}

export const DesignTabFooter: React.FC<FooterProps> = ({
  isDirty,
  dirtyCount,
  onDiscard,
  onReview,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderTop: "1px solid var(--aqb-border)",
      background: "var(--aqb-surface-2)",
      flexShrink: 0,
    }}
  >
    <div style={{ flex: 1, fontSize: 12, color: "var(--aqb-text-muted)" }}>
      {isDirty ? `${dirtyCount} previewing` : "All changes saved"}
    </div>
    <button
      onClick={onDiscard}
      disabled={!isDirty}
      style={{
        padding: "6px 12px",
        background: "transparent",
        border: "1px solid var(--aqb-border)",
        borderRadius: 6,
        color: isDirty ? "#ef4444" : "var(--aqb-text-muted)",
        fontSize: 12,
        cursor: isDirty ? "pointer" : "default",
        opacity: isDirty ? 1 : 0.4,
      }}
    >
      Discard
    </button>
    <button
      onClick={onReview}
      disabled={!isDirty}
      style={{
        padding: "6px 14px",
        background: isDirty ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(139,92,246,0.2)",
        border: "none",
        borderRadius: 6,
        color: isDirty ? "#fff" : "var(--aqb-text-muted)",
        fontSize: 12,
        fontWeight: 600,
        cursor: isDirty ? "pointer" : "default",
        opacity: isDirty ? 1 : 0.5,
      }}
    >
      Apply Changes
    </button>
  </div>
);
