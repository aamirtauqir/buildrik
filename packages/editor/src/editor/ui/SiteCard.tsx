/**
 * SiteCard — Figma 17:9.
 * Dashboard site tile: thumbnail, name, status, last touched.
 * @license BSD-3-Clause
 */
import React from "react";
import { StatusDot, type StatusDotState } from "../chrome-ui/StatusDot";

export interface SiteCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  state: StatusDotState;
  stateLabel: string;
  meta?: string;
  thumbnail?: string;
}

export function SiteCard({ name, state, stateLabel, meta, thumbnail, className, ...rest }: SiteCardProps) {
  return (
    <button type="button" className={["bk-site-card", className].filter(Boolean).join(" ")} {...rest}>
      <span className="bk-site-card__thumb">{thumbnail ? <img src={thumbnail} alt="" /> : null}</span>
      <span className="bk-site-card__body">
        <span className="bk-site-card__name">{name}</span>
        <span className="bk-site-card__meta">
          <StatusDot state={state} label={stateLabel} />
          <span>{stateLabel}</span>
          {meta ? <span className="bk-site-card__meta-right">{meta}</span> : null}
        </span>
      </span>
    </button>
  );
}
