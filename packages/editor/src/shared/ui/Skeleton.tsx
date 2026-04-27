// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled primary
// Skeleton; keeps compound exports as legacy hand-rolls (carve-out).
/**
 * Adapter shim — translates legacy Skeleton API to vibcoder Skeleton.
 *
 * Strategy: bridge for the primary `Skeleton` component. Compound exports
 * (StudioSkeleton, SkeletonText, SkeletonAvatar, SkeletonCard,
 * SkeletonListItem, SkeletonTable, LoadingOverlay) are kept as legacy
 * hand-rolls. They are layout-level compositions, not adapter targets —
 * Phase 5 either decomposes them at consumer sites or re-implements them
 * on top of the vibcoder Skeleton primitive directly.
 *
 * Prop translations (primary Skeleton, Phase 4 Q4 mapping):
 *   width, height (number | string):
 *     → style={{ width, height }} on vibcoder Skeleton (vibcoder CSS
 *       sizes via shape modifiers; arbitrary px requires inline style).
 *   radius:
 *     → style={{ borderRadius }} (vibcoder has no radius modifier — caller
 *       always supplies it via shape="rect|circle|line"; we keep the
 *       legacy radius union by mapping to CSS values).
 *   animation:
 *     "pulse" → vibcoder default (vendored CSS owns the animation).
 *     "none"  → style={{ animation: "none" }} (inline override of vendored
 *               keyframe; the more graceful path vs throwing — caller may
 *               legitimately need a still-frame skeleton in tests/print).
 *     "wave"  → throws-at-render. Vibcoder Skeleton has no wave animation
 *               variant; faking the wave gradient via inline style would
 *               require ~6 css declarations and a custom keyframe injection
 *               that the vendored CSS would later silently override.
 *   role + aria-label:
 *     Legacy Skeleton emits `role="status" aria-label="Loading..."` for
 *     consumers that rely on screen-reader announcement. Forwarded
 *     explicitly; vibcoder defaults to `aria-hidden="true"` which we
 *     unset via `aria-hidden={false}`.
 *   className:
 *     Forwarded; vibcoder appends after its own classes.
 *   style:
 *     Spread last so caller's style overrides our radius/animation
 *     overrides if explicitly conflicting.
 *
 * @license BSD-3-Clause
 */

/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette in compound exports
 *   (StudioSkeleton, SkeletonCard, SkeletonListItem, SkeletonTable,
 *   LoadingOverlay). Chrome-hex lint rules do not apply here — these
 *   are layout-level skeleton compositions kept as legacy hand-rolls
 *   under the Phase 5 carve-out described above.
 */

import * as React from "react";
import { Skeleton as VibcoderSkeleton } from "@/editor/shared/vibcoder";

/** Detect prefers-reduced-motion for accessible animation control */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export interface SkeletonProps {
  /** Width of skeleton (number = px, string = any CSS value) */
  width?: number | string;
  /** Height of skeleton (number = px, string = any CSS value) */
  height?: number | string;
  /** Border radius variant */
  radius?: "none" | "sm" | "md" | "lg" | "full";
  /** Animation variant */
  animation?: "pulse" | "wave" | "none";
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

const radiusMap: Record<NonNullable<SkeletonProps["radius"]>, string | number> = {
  none: 0,
  sm: "var(--buildrick-radius-sm)",
  md: "var(--buildrick-radius-md)",
  lg: "var(--buildrick-radius-lg)",
  full: "9999px",
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  radius = "md",
  animation = "pulse",
  className,
  style,
}) => {
  const prefersReduced = useReducedMotion();
  const effectiveAnimation = prefersReduced ? "none" : animation;

  if (effectiveAnimation === "wave") {
    throw new Error(
      "Skeleton: animation=\"wave\" is not translatable — vibcoder Skeleton has no wave animation variant in the vendored CSS. Use animation=\"pulse\" or migrate the consumer to vibcoder Skeleton directly."
    );
  }

  const widthValue = typeof width === "number" ? `${width}px` : width;
  const heightValue = typeof height === "number" ? `${height}px` : height;

  const composedStyle: React.CSSProperties = {
    width: widthValue,
    height: heightValue,
    borderRadius: radiusMap[radius],
    ...(effectiveAnimation === "none" ? { animation: "none" } : {}),
    ...style,
  };

  return (
    <VibcoderSkeleton
      className={className}
      style={composedStyle}
      role="status"
      aria-label="Loading..."
      aria-hidden={false}
    />
  );
};

// ─── Compound exports (legacy hand-rolls, Phase 5 carve-out) ────────────────
// These are layout-level compositions, not adapter targets. Phase 5 either
// decomposes them at consumer sites or re-implements them on top of the
// vibcoder Skeleton primitive directly. They internally render the primary
// `Skeleton` shim above (which IS bridged), so they inherit the vibcoder
// `bd-skeleton` class through that path.

// Skeleton Text - for text content
export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Width of last line (percentage) */
  lastLineWidth?: number | string;
  /** Animation type */
  animation?: SkeletonProps["animation"];
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = "70%",
  animation = "pulse",
}) => {
  return (
    <div className="buildrick-skeleton-text" style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          animation={animation}
        />
      ))}
    </div>
  );
};

// Skeleton Avatar - for profile pictures
export interface SkeletonAvatarProps {
  size?: number;
  animation?: SkeletonProps["animation"];
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 40,
  animation = "pulse",
}) => {
  return <Skeleton width={size} height={size} radius="full" animation={animation} />;
};

// Skeleton Card - for card layouts
export interface SkeletonCardProps {
  /** Show image placeholder */
  hasImage?: boolean;
  /** Image height */
  imageHeight?: number;
  /** Number of text lines */
  textLines?: number;
  /** Show action buttons */
  hasActions?: boolean;
  animation?: SkeletonProps["animation"];
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  imageHeight = 140,
  textLines = 3,
  hasActions = false,
  animation = "pulse",
}) => {
  return (
    <div
      className="buildrick-skeleton-card"
      style={{
        background: "var(--buildrick-bg-panel-secondary, #2d2d44)",
        borderRadius: "var(--buildrick-radius-lg)",
        border: "1px solid var(--buildrick-border, var(--bd-fg-primary))",
        overflow: "hidden",
      }}
    >
      {hasImage && (
        <Skeleton
          height={imageHeight}
          radius="none"
          animation={animation}
          style={{ borderRadius: 0 }}
        />
      )}
      <div style={{ padding: 16 }}>
        <Skeleton height={20} width="60%" animation={animation} style={{ marginBottom: 12 }} />
        <SkeletonText lines={textLines} animation={animation} />
        {hasActions && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Skeleton height={36} width={80} animation={animation} />
            <Skeleton height={36} width={80} animation={animation} />
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton List Item - for list layouts
export interface SkeletonListItemProps {
  /** Show avatar */
  hasAvatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Number of text lines */
  textLines?: number;
  /** Show action */
  hasAction?: boolean;
  animation?: SkeletonProps["animation"];
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  hasAvatar = true,
  avatarSize = 40,
  textLines = 2,
  hasAction = false,
  animation = "pulse",
}) => {
  return (
    <div
      className="buildrick-skeleton-list-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "var(--buildrick-radius-md)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
      }}
    >
      {hasAvatar && <SkeletonAvatar size={avatarSize} animation={animation} />}
      <div style={{ flex: 1 }}>
        <Skeleton height={14} width="50%" animation={animation} style={{ marginBottom: 6 }} />
        {textLines > 1 && <Skeleton height={12} width="80%" animation={animation} />}
      </div>
      {hasAction && <Skeleton height={32} width={32} radius="md" animation={animation} />}
    </div>
  );
};

// Skeleton Table - for table layouts
export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header */
  hasHeader?: boolean;
  animation?: SkeletonProps["animation"];
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  hasHeader = true,
  animation = "pulse",
}) => {
  return (
    <div
      className="buildrick-skeleton-table"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        background: "var(--buildrick-bg-panel-secondary, #2d2d44)",
        borderRadius: "var(--buildrick-radius-lg)",
        border: "1px solid var(--buildrick-border, var(--bd-fg-primary))",
        overflow: "hidden",
        padding: 4,
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 12,
            padding: "12px 16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--buildrick-radius-md)",
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={14} width="60%" animation={animation} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 12,
            padding: "12px 16px",
            borderRadius: "var(--buildrick-radius-md)",
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height={12}
              width={colIndex === 0 ? "80%" : "60%"}
              animation={animation}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading Overlay - for covering content during load
export interface LoadingOverlayProps {
  /** Whether to show the overlay */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Spinner size */
  spinnerSize?: number;
  /** Blur background */
  blur?: boolean;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  spinnerSize = 32,
  blur = true,
  children,
}) => {
  const prefersReduced = useReducedMotion();

  if (!visible) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {children}
      <div
        className="buildrick-loading-overlay"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: blur ? "rgba(13, 13, 26, 0.85)" : "rgba(13, 13, 26, 0.95)",
          backdropFilter: blur ? "blur(4px)" : undefined,
          borderRadius: "inherit",
          zIndex: 10,
        }}
        role="status"
        aria-label={message || "Loading..."}
      >
        <svg
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          fill="none"
          style={prefersReduced ? {} : { animation: "buildrick-spin 1s linear infinite" }}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="var(--buildrick-accent, #00d4aa)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60 30"
          />
        </svg>
        {message && (
          <span
            style={{
              fontSize: 13,
              color: "var(--buildrick-text-secondary, var(--bd-fg-muted))",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

// Studio Skeleton - mimic the main editor layout (V3 Blueprint)
export const StudioSkeleton: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const spinStyle = prefersReduced ? {} : { animation: "buildrick-spin 1s linear infinite" };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "var(--buildrick-text-primary)",
        overflow: "hidden",
      }}
    >
      {/* Header Skeleton */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "var(--buildrick-text-primary)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginRight: 24 }}>
          <Skeleton width={32} height={32} radius="sm" />
          <Skeleton width={32} height={32} radius="sm" />
        </div>
        <Skeleton width={160} height={32} radius="md" /> {/* Device Toggles */}
        <div style={{ flex: 1 }} />
        <Skeleton width={80} height={32} radius="md" /> {/* Saved */}
        <Skeleton width={80} height={32} radius="md" /> {/* Export */}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Rail */}
        <div
          style={{
            width: 60,
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 16,
            gap: 20,
            background: "var(--buildrick-text-primary)",
            zIndex: 5,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={36} height={36} radius="md" />
          ))}
          <div style={{ flex: 1 }} />
          <Skeleton width={36} height={36} radius="full" style={{ marginBottom: 16 }} />
        </div>

        {/* Left Panel (Build/Elements) */}
        <div
          style={{
            width: 280,
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0E0E11",
            display: "flex",
            flexDirection: "column",
            padding: 16,
            gap: 16,
          }}
        >
          <Skeleton width="100%" height={36} radius="md" /> {/* Search */}
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton width="50%" height={32} radius="sm" />
            <Skeleton width="50%" height={32} radius="sm" />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflow: "hidden",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Skeleton width={24} height={24} radius="sm" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="70%" height={12} radius="sm" style={{ marginBottom: 4 }} />
                  <Skeleton width="40%" height={8} radius="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            flex: 1,
            background: "#1E1E24",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Top Bar inside Canvas (optional, from wireframe) */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              padding: "8px 16px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 100,
              display: "flex",
              gap: 16,
            }}
          >
            <Skeleton width={24} height={24} radius="full" />
            <Skeleton width={24} height={24} radius="full" />
            <Skeleton width={60} height={24} radius="full" />
          </div>

          {/* The Canvas itself */}
          <div
            style={{
              width: "70%",
              height: "70%",
              background: "var(--buildrick-bg-card)",
              borderRadius: 4,
              opacity: 0.1,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
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
                border: "3px solid rgba(255,255,255,0.1)",
                borderTopColor: "var(--buildrick-accent, #00d4aa)",
                ...spinStyle,
              }}
            />
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              INITIALIZING ENGINE
            </div>
          </div>
        </div>

        {/* Right Inspector */}
        <div
          style={{
            width: 280,
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0E0E11",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              height: 48,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
            }}
          >
            <div
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Skeleton width={60} height={16} radius="sm" />
            </div>
            <div
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Skeleton width={60} height={16} radius="sm" />
            </div>
            <div
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Skeleton width={60} height={16} radius="sm" />
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton width="40%" height={12} radius="sm" style={{ marginBottom: 12 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Skeleton width="100%" height={32} radius="sm" />
                  <Skeleton width="100%" height={32} radius="sm" />
                </div>
              </div>
            ))}
            <Skeleton width="100%" height={120} radius="md" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes buildrick-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes buildrick-skeleton-wave {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes buildrick-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .buildrick-skeleton, .buildrick-skeleton-pulse, .buildrick-skeleton-wave {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;
