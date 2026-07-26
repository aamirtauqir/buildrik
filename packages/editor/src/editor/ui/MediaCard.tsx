/**
 * MediaCard — Figma 17:6 (Badge).
 * Media library grid tile.
 * @license BSD-3-Clause
 */
import React from "react";
import { Badge, type BadgeKind } from "./Badge";

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
            <Badge kind={badgeKind}>{badge}</Badge>
          </span>
        ) : null}
      </span>
      <span className="bk-media-card__name">{name}</span>
    </button>
  );
}
