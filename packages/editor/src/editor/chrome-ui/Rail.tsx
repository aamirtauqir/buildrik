/**
 * Rail + RailItem — the 60px tool column (Figma shell 52:6).
 *
 * The rail is a toolbar, not a list of links: it switches what the drawer shows
 * without navigating. aria-current marks the open tool so the active state is
 * announced, not merely tinted.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface RailProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Rail({ label = "Editor tools", className, children, ...rest }: RailProps) {
  return (
    <nav
      className={[
        "tw:w-[60px] tw:flex-none tw:flex tw:flex-col tw:items-center tw:gap-1 tw:py-2 tw:bg-[var(--bk-gray-100)] tw:border-r tw:border-[var(--bk-gray-200)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      {...rest}
    >
      {children}
    </nav>
  );
}

export function RailSpacer() {
  return <span className="tw:flex-1" aria-hidden="true" />;
}

export interface RailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  showLabel?: boolean;
}

const RAIL_ITEM_CLASS =
  "tw:relative tw:w-11 tw:h-11 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-0.5 " +
  "tw:border-0 tw:rounded-lg tw:bg-transparent tw:text-[var(--bk-ink-muted)] tw:cursor-pointer " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:[transition:var(--bk-transition-fast)] " +
  "tw:hover:bg-[var(--bk-gray-100)] tw:hover:text-[var(--bk-ink)] " +
  "tw:aria-[current=true]:bg-blue-50 tw:aria-[current=true]:text-blue-700 " +
  "tw:aria-[current=true]:before:content-[''] tw:aria-[current=true]:before:absolute tw:aria-[current=true]:before:left-[-8px] " +
  "tw:aria-[current=true]:before:top-2 tw:aria-[current=true]:before:bottom-2 tw:aria-[current=true]:before:w-[3px] " +
  "tw:aria-[current=true]:before:rounded-full tw:aria-[current=true]:before:bg-blue-700 " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const RailItem = React.forwardRef<HTMLButtonElement, RailItemProps>(function RailItem(
  { icon, label, active, showLabel = true, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[RAIL_ITEM_CLASS, className].filter(Boolean).join(" ")}
      aria-current={active || undefined}
      aria-label={showLabel ? undefined : label}
      title={showLabel ? undefined : label}
      {...rest}
    >
      <span aria-hidden="true">{icon}</span>
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
});
