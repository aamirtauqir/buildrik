/**
 * DesignTabFooter — bottom bar with Revert and Review & Save buttons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={onDiscard}
      disabled={!isDirty}
      style={{ color: isDirty ? "#ef4444" : undefined }}
    >
      Discard
    </Button>
    <Button
      variant="primary"
      size="sm"
      onClick={onReview}
      disabled={!isDirty}
    >
      Apply Changes
    </Button>
  </div>
);
