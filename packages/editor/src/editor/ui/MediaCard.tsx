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
    <button type="button" className={["bk-media-card", className].filter(Boolean).join(" ")} {...rest}>
      <span className="bk-media-card__thumb">
        {src ? <img src={src} alt="" /> : null}
        {badge ? (
          <span className="bk-media-card__badge">
            <Badge {...BADGE_KIND_PROPS[badgeKind]}>{badge}</Badge>
          </span>
        ) : null}
      </span>
      <span className="bk-media-card__name">{name}</span>
    </button>
  );
}
