/**
 * DesignTabFooter — bottom bar with Revert and Review & Save buttons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";

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
      borderTop: "1px solid var(--bk-border)",
      background: "var(--bk-bg-subtle)",
      flexShrink: 0,
    }}
  >
    <div style={{ flex: 1, fontSize: 12, color: "var(--bk-ink-muted)" }}>
      {isDirty ? `${dirtyCount} previewing` : "All changes saved"}
    </div>
    <Button
      kind="ghost"
      size="sm"
      onClick={onDiscard}
      disabled={!isDirty}
      style={{ color: isDirty ? /* @lint-hex-policy: discard-affordance red-500, off chrome palette */ "#ef4444" : undefined }}
    >
      Discard
    </Button>
    <Button
      kind="primary"
      size="sm"
      onClick={onReview}
      disabled={!isDirty}
    >
      Apply Changes
    </Button>
  </div>
);
