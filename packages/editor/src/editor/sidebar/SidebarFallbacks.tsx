/**
 * SidebarFallbacks — Skeleton + Error boundary fallback for LeftSidebar
 * Extracted from index.tsx for single-responsibility compliance
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonListItem } from "../../shared/ui/Skeleton";

/** Loading skeleton shown while lazy-loaded tab chunks download */
export const PanelSkeleton: React.FC = () => (
  <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
    ))}
  </div>
);

/** Error fallback shown when a tab panel crashes */
export const SidebarErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div style={{ padding: 24, textAlign: "center", color: "var(--aqb-text-secondary)" }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Something went wrong</div>
    <div style={{ fontSize: 12, marginBottom: 16, color: "var(--aqb-text-muted)" }}>
      This panel encountered an error. Your work is safe.
    </div>
    <button
      onClick={onRetry}
      style={{
        padding: "6px 16px",
        background: "var(--aqb-surface-3)",
        border: "1px solid var(--aqb-bg-active)",
        borderRadius: 6,
        color: "var(--aqb-text-primary)",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      Try Again
    </button>
  </div>
);
