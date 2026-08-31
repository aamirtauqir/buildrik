/**
 * SiteCard — Figma 17:9.
 * Dashboard site tile: thumbnail, name, status, last touched.
 * @license BSD-3-Clause
 */
import React from "react";
import { StatusDot, type StatusDotState } from "./StatusDot";

export interface SiteCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  state: StatusDotState;
  stateLabel: string;
  meta?: string;
  thumbnail?: string;
}

const BASE =
  "tw:flex tw:flex-col tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:overflow-hidden " +
  "tw:cursor-pointer tw:p-0 tw:text-left tw:[transition:var(--bk-transition-fast)] " +
  "tw:hover:border-gray-300 tw:hover:[box-shadow:var(--bk-shadow-raised)] " +
  "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export function SiteCard({ name, state, stateLabel, meta, thumbnail, className, ...rest }: SiteCardProps) {
  return (
    <button type="button" className={[BASE, className].filter(Boolean).join(" ")} {...rest}>
      <span className="tw:aspect-[16/10] tw:bg-gray-100 tw:border-b tw:border-gray-200">
        {thumbnail ? <img src={thumbnail} alt="" className="tw:w-full tw:h-full tw:object-cover tw:block" /> : null}
      </span>
      <span className="tw:flex tw:flex-col tw:gap-1 tw:p-3">
        <span className="tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]">
          {name}
        </span>
        <span className="tw:flex tw:items-center tw:gap-2 tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
          <StatusDot state={state} label={stateLabel} />
          <span>{stateLabel}</span>
          {meta ? <span className="tw:ml-auto">{meta}</span> : null}
        </span>
      </span>
    </button>
  );
}
