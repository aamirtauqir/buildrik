/**
 * NavItem — Figma 16:26 (State).
 *
 * Settings sub-nav, dashboard nav. `current` maps to aria-current="page", which
 * is what screen readers use to answer "where am I" — the tint alone does not.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { ROW_LABEL_CLASS } from "./Row";

export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  current?: boolean;
  trailing?: React.ReactNode;
}

const BASE =
  "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-3 tw:rounded-lg tw:border-0 tw:bg-transparent tw:w-full " +
  "tw:text-left tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-500 tw:cursor-pointer " +
  "tw:[transition:var(--bk-transition-fast)] tw:hover:bg-gray-100 tw:hover:text-gray-900 " +
  "tw:aria-[current=page]:bg-blue-50 tw:aria-[current=page]:text-blue-700 tw:aria-[current=page]:font-medium " +
  "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(function NavItem(
  { icon, current, trailing, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[BASE, className].filter(Boolean).join(" ")}
      aria-current={current ? "page" : undefined}
      {...rest}
    >
      {icon ? <span className="tw:flex-none tw:inline-flex tw:text-gray-500">{icon}</span> : null}
      <span className={ROW_LABEL_CLASS}>{children}</span>
      {trailing}
    </button>
  );
});
