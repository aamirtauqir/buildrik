import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * SidebarFallbacks — Skeleton + Error boundary fallback for LeftSidebar
 * Extracted from index.tsx for single-responsibility compliance
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonListItem } from "@/shared/extensions/SkeletonCompounds";
import { Stack } from "@/editor/shared/vibcoder/Stack";

/** Loading skeleton shown while lazy-loaded tab chunks download */
export const PanelSkeleton: React.FC = () => (
  <Stack style={{ padding: "16px 12px", gap: 10 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonListItem key={i} hasAvatar avatarSize={24} textLines={1} />
    ))}
  </Stack>
);

/** Error fallback shown when a tab panel crashes */
export const SidebarErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div style={{ padding: 24, textAlign: "center", color: "var(--buildrick-text-secondary)" }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Something went wrong</div>
    <div style={{ fontSize: 12, marginBottom: 16, color: "var(--buildrick-text-muted)" }}>
      This panel encountered an error. Your work is safe.
    </div>
    <Button
      onClick={onRetry}
      style={{
        padding: "6px 16px",
        background: "var(--buildrick-surface-3)",
        border: "1px solid var(--buildrick-border)",
        borderRadius: 6,
        color: "var(--buildrick-text-primary)",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      Try Again
    </Button>
  </div>
);
