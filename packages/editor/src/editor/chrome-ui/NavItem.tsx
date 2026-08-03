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

/* px: 16 left / 12 right, per board 16:26 — it was 12/12. The asymmetry is the
   board's: the label lines up with panel content on the left, while the right
   edge keeps a tighter gutter for a trailing count or chevron. */
const BASE =
  "tw:relative tw:flex tw:items-center tw:gap-2 tw:h-8 tw:pl-4 tw:pr-3 tw:rounded-lg tw:border-0 tw:bg-transparent tw:w-full " +
  "tw:text-left tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-500 tw:cursor-pointer " +
  "tw:[transition:var(--bk-transition-fast)] tw:hover:bg-gray-100 tw:hover:text-gray-900 " +
  "tw:aria-[current=page]:bg-blue-50 tw:aria-[current=page]:text-blue-700 tw:aria-[current=page]:font-medium " +
  /* The 3px accent bar the board pairs with the tint (16:24). `rounded-l-lg`
     rather than clipping with overflow-hidden, which would also clip the
     focus-visible box-shadow ring and cost a keyboard user their position. */
  "tw:aria-[current=page]:before:content-[''] tw:aria-[current=page]:before:absolute " +
  "tw:aria-[current=page]:before:left-0 tw:aria-[current=page]:before:inset-y-0 " +
  "tw:aria-[current=page]:before:w-[3px] tw:aria-[current=page]:before:rounded-l-lg " +
  "tw:aria-[current=page]:before:bg-blue-700 " +
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
