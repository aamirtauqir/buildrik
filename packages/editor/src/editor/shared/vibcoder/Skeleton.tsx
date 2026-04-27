/**
 * Vibcoder Skeleton wrapper.
 * Renders the `bd-skeleton` atom from src/themes/components/atoms/skeleton.css
 * with chained shape + size modifier classes.
 *
 * Variant + size union from `vibcoder-variants.mjs atoms/skeleton`:
 *   shapes: rect (default), line, circle  — exposed as `shape` prop
 *   sizes:  xs, sm, lg                    — default md = no modifier
 *   states: (none — purely presentational)
 *
 * The variants script bucketed shapes under "variants" because they share
 * the modifier-class shape; semantically they're a shape enum (mutually
 * exclusive), exposed via `shape` here.
 *
 * IMPORTANT — `size` is a NO-OP when `shape="line"`. The vendored CSS only
 * defines size rules for `bd-skeleton--<size>.bd-skeleton--rect` and
 * `bd-skeleton--<size>.bd-skeleton--circle`. Lines remain 12px regardless
 * of size. Callers wanting wider/narrower lines should use `style={{ width }}`
 * (matching the upstream HTML demo at skeleton.html line 17-19).
 *
 * A11y: skeletons are decorative loading placeholders. Defaults to
 * `aria-hidden="true"` per upstream HTML demo. Caller can override by
 * passing `aria-hidden={false}` (or any aria-* attr) via ...rest, which
 * displaces the default per JSX attribute order.
 *
 * forwardRef targets the wrapper div.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type FC, forwardRef, useEffect, useState } from "react";

export type SkeletonShape = "rect" | "line" | "circle";
export type SkeletonSize = "xs" | "sm" | "lg";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  /** No-op when `shape="line"` (vendored CSS has no line size rules). */
  size?: SkeletonSize;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape = "rect", size, className, ...rest }, ref) => {
    const classes = [
      "bd-skeleton",
      `bd-skeleton--${shape}`,
      // md is the base default — no `bd-skeleton--md` rule exists in vendored CSS
      size && `bd-skeleton--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return <div ref={ref} aria-hidden="true" className={classes} {...rest} />;
  },
);
Skeleton.displayName = "Skeleton";

// ─── Compound exports (Phase 5 migration carve-outs) ──────────────────────
// Layout-level compositions built on top of the Skeleton primitive.
// Migrated here from the Phase 4 shim to unblock shim deletion.

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
      background: "rgba(255, 255, 255, 0.02)",
      borderRadius: "var(--buildrick-radius-md)",
      border: "1px solid rgba(255, 255, 255, 0.04)",
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
      <Skeleton style={{ height: 32, width: 32, borderRadius: "var(--buildrick-radius-md)" }} aria-hidden />
    )}
  </div>
);

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
          <Skeleton style={{ width: 32, height: 32, borderRadius: "var(--buildrick-radius-sm)" }} />
          <Skeleton style={{ width: 32, height: 32, borderRadius: "var(--buildrick-radius-sm)" }} />
        </div>
        <Skeleton style={{ width: 160, height: 32, borderRadius: "var(--buildrick-radius-md)" }} />
        <div style={{ flex: 1 }} />
        <Skeleton style={{ width: 80, height: 32, borderRadius: "var(--buildrick-radius-md)" }} />
        <Skeleton style={{ width: 80, height: 32, borderRadius: "var(--buildrick-radius-md)" }} />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
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
            <Skeleton key={i} style={{ width: 36, height: 36, borderRadius: "var(--buildrick-radius-md)" }} />
          ))}
          <div style={{ flex: 1 }} />
          <Skeleton style={{ width: 36, height: 36, borderRadius: 9999, marginBottom: 16 }} />
        </div>

        <div
          style={{
            flex: 1,
            background: "var(--buildrick-canvas-bg, #1E1E24)",
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
      </div>
      <style>{`
        @keyframes buildrick-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
