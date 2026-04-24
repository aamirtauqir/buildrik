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
    data-screen-savebar="true"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderTop: "1px solid var(--bd-border)",
      background: "var(--bd-bg-subtle)",
      flexShrink: 0,
    }}
  >
    <div style={{ flex: 1, fontSize: 12, color: "var(--bd-fg-muted)" }}>
      {isDirty ? `${dirtyCount} previewing` : "All changes saved"}
    </div>
    <button
      onClick={onDiscard}
      disabled={!isDirty}
      style={{
        padding: "6px 12px",
        background: "transparent",
        border: "1px solid var(--bd-border)",
        borderRadius: 6,
        color: isDirty ? "#ef4444" : "var(--bd-fg-muted)",
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
        background: isDirty ? "var(--bd-accent)" : "var(--bd-accent-tint)",
        border: "none",
        borderRadius: 6,
        color: isDirty ? "#fff" : "var(--bd-fg-muted)",
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
