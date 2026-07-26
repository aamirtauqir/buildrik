/**
 * Skeleton compound extensions — Phase 5 migration carve-outs.
 *
 * Layout-level compositions built on top of the Skeleton primitive.
 * Lives here (not in vibcoder/Skeleton.tsx) so vendor-pipeline re-runs
 * do not overwrite these components.
 *
 * Import the base `Skeleton` primitive from:
 *   @/editor/shared/vibcoder/Skeleton
 *
 * @license BSD-3-Clause
 */

import { type FC, useEffect, useState } from "react";
import { Skeleton } from "@/editor/shared/vibcoder/Skeleton";

// ─── SkeletonListItem ─────────────────────────────────────────────────────────

export interface SkeletonListItemProps {
  hasAvatar?: boolean;
  avatarSize?: number;
  textLines?: number;
  hasAction?: boolean;
}

export const SkeletonListItem: FC<SkeletonListItemProps> = ({
  hasAvatar = true,
  avatarSize = 40,
  textLines = 2,
  hasAction = false,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: "var(--bk-alpha-ink-12)",
      borderRadius: "var(--bk-radius-lg)",
      border: "1px solid var(--bk-alpha-ink-12)",
    }}
  >
    {hasAvatar && (
      <Skeleton
        shape="circle"
        style={{ width: avatarSize, height: avatarSize, flexShrink: 0 }}
        aria-hidden
      />
    )}
    <div style={{ flex: 1 }}>
      <Skeleton style={{ height: 14, width: "50%", marginBottom: 6 }} aria-hidden />
      {textLines > 1 && <Skeleton style={{ height: 12, width: "80%" }} aria-hidden />}
    </div>
    {hasAction && (
      <Skeleton style={{ height: 32, width: 32, borderRadius: "var(--bk-radius-lg)" }} aria-hidden />
    )}
  </div>
);

// ─── StudioSkeleton ───────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export const StudioSkeleton: FC = () => {
  const prefersReduced = useReducedMotion();
  const spinStyle = prefersReduced ? {} : { animation: "bd-skeleton-spin 1s linear infinite" };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "var(--bk-ink)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          borderBottom: "1px solid var(--bk-alpha-ink-08)",
          background: "var(--bk-ink)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginRight: 24 }}>
          <Skeleton style={{ width: 32, height: 32, borderRadius: "var(--bk-radius-sm)" }} />
          <Skeleton style={{ width: 32, height: 32, borderRadius: "var(--bk-radius-sm)" }} />
        </div>
        <Skeleton style={{ width: 160, height: 32, borderRadius: "var(--bk-radius-lg)" }} />
        <div style={{ flex: 1 }} />
        <Skeleton style={{ width: 80, height: 32, borderRadius: "var(--bk-radius-lg)" }} />
        <Skeleton style={{ width: 80, height: 32, borderRadius: "var(--bk-radius-lg)" }} />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 60,
            borderRight: "1px solid var(--bk-alpha-ink-08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 16,
            gap: 20,
            background: "var(--bk-ink)",
            zIndex: 5,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} style={{ width: 36, height: 36, borderRadius: "var(--bk-radius-lg)" }} />
          ))}
          <div style={{ flex: 1 }} />
          <Skeleton style={{ width: 36, height: 36, borderRadius: 9999, marginBottom: 16 }} />
        </div>

        <div
          style={{
            flex: 1,
            background: "var(--bk-bg-app)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "70%",
              height: "70%",
              background: "var(--bk-bg-card)",
              borderRadius: 4,
              opacity: 0.1,
              boxShadow: "0 20px 50px var(--bk-alpha-ink-12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid var(--bk-alpha-ink-08)",
                borderTopColor: "var(--bk-accent)",
                ...spinStyle,
              }}
            />
            <div
              style={{
                color: "var(--bk-ink-muted)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              INITIALIZING ENGINE
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bd-skeleton-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
