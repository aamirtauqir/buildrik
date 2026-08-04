/**
 * Skeleton compounds — layout-level loading placeholders.
 *
 * SkeletonListItem: one list-row placeholder (avatar + text lines + action).
 * StudioSkeleton:   full-viewport boot screen shown while the engine loads.
 *
 * Moved from `editor/ui/SkeletonCompounds.tsx` (flowbite big-bang) — no
 * consumer lives in `shared/forms/`, so the `chrome-ui/` home the plan
 * calls for ("they're chrome layouts") applies with no edge-case override,
 * unlike `FormField`/`Slider`. The base pulsing block now uses Tailwind's
 * own `tw:animate-pulse` utility instead of the deleted `bk-skeleton`
 * keyframe (`bk-skeleton`/`bk-skeleton--circle` kept as marker classNames
 * only — no CSS rule backs them anymore, same "vestigial hook" precedent
 * `chrome-ui/TextField.tsx` set for `bk-input`). The rotating boot spinner
 * is now flowbite-react's `Spinner` (an SVG double-ring icon) instead of a
 * hand-rolled CSS border-trick circle; `default` color is one ramp step
 * off `--bk-accent` (`fill-primary-600`, not `-700`) so it's corrected via
 * `theme`, same "-700 is the only exact step" finding Checkbox/Radio/Tabs
 * all hit. Reduced-motion handling moved from a JS `matchMedia` listener
 * hook to Tailwind's own `motion-reduce:` variant — simpler, and it's a
 * real (not hand-authored) `@media (prefers-reduced-motion)` block emitted
 * by Tailwind's own build, not a new file added to the a11y.css exception.
 *
 * Non-flowbite layout/dimension CSS (row chrome, boot-screen chrome) moved
 * verbatim to `./skeleton.css` — an unlayered stylesheet imported directly
 * here (not routed through `themes/default.css`'s `@layer` chain), same
 * precedent `editor/ui/slider.css` established this round.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Spinner } from "flowbite-react";
import "./skeleton.css";

export interface SkeletonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
}

/**
 * The pulse itself. Exported because every skeleton in the editor should be
 * the same grey and the same animation — the Media grid's loading state
 * (board 777:4139) needs its own geometry, not its own treatment.
 */
export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ circle, className, ...rest }) => (
  <div
    aria-hidden="true"
    className={[
      "bk-skeleton",
      circle && "bk-skeleton--circle",
      "tw:animate-pulse tw:bg-gray-100",
      circle ? "tw:rounded-full" : "tw:rounded",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
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

export const StudioSkeleton: React.FC = () => (
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
          <Spinner
            size="xl"
            className="bk-studio-skeleton__spinner tw:h-12 tw:w-12 tw:motion-reduce:animate-none"
            theme={{ color: { default: "tw:fill-primary-700" } }}
          />
          <div className="bk-studio-skeleton__label">INITIALIZING ENGINE</div>
        </div>
      </div>
    </div>
  </div>
);
