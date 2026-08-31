/**
 * MediaCard — Figma 17:6 (Badge).
 * Media library grid tile.
 * @license BSD-3-Clause
 */
import React from "react";
import { Badge } from "flowbite-react";

export type BadgeKind = "neutral" | "success" | "warning" | "danger" | "pro";

/** flowbite badge color + text-color override per kind (flowbite's color
 *  presets don't hex-match --bk-success-text/--bk-warning-tint/
 *  --bk-error-text exactly — see docs/plans/flowbite-bigbang-inventory.md
 *  "Task 5" Badge mapping). */
const BADGE_KIND_PROPS: Record<BadgeKind, { color: string; className?: string }> = {
  neutral: { color: "gray" },
  success: { color: "success", className: "tw:text-green-600" },
  warning: { color: "warning", className: "tw:bg-yellow-50" },
  danger: { color: "failure", className: "tw:text-red-700" },
  pro: { color: "purple" },
};

export interface MediaCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  src?: string;
  badge?: string;
  badgeKind?: BadgeKind;
}

export function MediaCard({ name, src, badge, badgeKind = "neutral", className, ...rest }: MediaCardProps) {
  return (
    <button
      type="button"
      className={["tw:group tw:flex tw:flex-col tw:gap-1 tw:border-0 tw:bg-none tw:p-0 tw:cursor-pointer tw:text-left", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* `group-focus-visible:` replicates the old `.bk-media-card:focus-visible
         .bk-media-card__thumb` descendant selector — parent-state-driven child
         styling, Tailwind's own mechanism for exactly this case. */}
      <span className="tw:relative tw:aspect-[4/3] tw:rounded-md tw:border tw:border-gray-200 tw:bg-gray-100 tw:overflow-hidden tw:outline-none tw:group-focus-visible:[box-shadow:var(--bk-shadow-focus)]">
        {src ? <img src={src} alt="" className="tw:w-full tw:h-full tw:object-cover tw:block" /> : null}
        {badge ? (
          <span className="tw:absolute tw:top-1 tw:left-1">
            <Badge {...BADGE_KIND_PROPS[badgeKind]}>{badge}</Badge>
          </span>
        ) : null}
      </span>
      <span className="tw:[font-family:var(--bk-font-ui)] tw:text-xs tw:text-[var(--bk-ink)] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap">
        {name}
      </span>
    </button>
  );
}
