/**
 * Skeleton compounds — layout-level loading placeholders.
 *
 * SkeletonListItem: one list-row placeholder (avatar + text lines + action).
 * StudioSkeleton:   full-viewport boot screen shown while the engine loads.
 *
 * Ported from shared/extensions/SkeletonCompounds (extensions drain). The
 * vibcoder Skeleton primitive dependency is replaced by the local
 * `bk-skeleton` block styled in ui.css.
 *
 * @license BSD-3-Clause
 */
import React from "react";

interface SkeletonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
}

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ circle, className, ...rest }) => (
  <div
    aria-hidden="true"
    className={["bk-skeleton", circle && "bk-skeleton--circle", className].filter(Boolean).join(" ")}
    {...rest}
  />
);

/* ── SkeletonListItem ───────────────────────────────────────────────────── */

export interface SkeletonListItemProps {
  hasAvatar?: boolean;
  avatarSize?: number;
  textLines?: number;
  hasAction?: boolean;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  hasAvatar = true,
  avatarSize = 40,
  textLines = 2,
  hasAction = false,
}) => (
  <div className="bk-skeleton-list-item">
    {hasAvatar && (
      <SkeletonBlock circle style={{ width: avatarSize, height: avatarSize, flexShrink: 0 }} />
    )}
    <div className="bk-skeleton-list-item__text">
      <SkeletonBlock className="bk-skeleton-list-item__line-primary" />
      {textLines > 1 && <SkeletonBlock className="bk-skeleton-list-item__line-secondary" />}
    </div>
    {hasAction && <SkeletonBlock className="bk-skeleton-list-item__action" />}
  </div>
);

/* ── StudioSkeleton ─────────────────────────────────────────────────────── */

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

export const StudioSkeleton: React.FC = () => {
  const prefersReduced = useReducedMotion();

  return (
    <div className="bk-studio-skeleton">
      <div className="bk-studio-skeleton__topbar">
        <div className="bk-studio-skeleton__topbar-group">
          <SkeletonBlock className="bk-studio-skeleton__chip" />
          <SkeletonBlock className="bk-studio-skeleton__chip" />
        </div>
        <SkeletonBlock className="bk-studio-skeleton__title" />
        <div className="bk-studio-skeleton__spring" />
        <SkeletonBlock className="bk-studio-skeleton__action" />
        <SkeletonBlock className="bk-studio-skeleton__action" />
      </div>

      <div className="bk-studio-skeleton__body">
        <div className="bk-studio-skeleton__rail">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="bk-studio-skeleton__rail-item" />
          ))}
          <div className="bk-studio-skeleton__spring" />
          <SkeletonBlock circle className="bk-studio-skeleton__avatar" />
        </div>

        <div className="bk-studio-skeleton__canvas">
          <div className="bk-studio-skeleton__page" />
          <div className="bk-studio-skeleton__center">
            <div
              className="bk-studio-skeleton__spinner"
              style={prefersReduced ? { animation: "none" } : undefined}
            />
            <div className="bk-studio-skeleton__label">INITIALIZING ENGINE</div>
          </div>
        </div>
      </div>
    </div>
  );
};
