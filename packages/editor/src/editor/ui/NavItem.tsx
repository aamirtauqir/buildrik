/**
 * NavItem — Figma 16:26 (State).
 *
 * Settings sub-nav, dashboard nav. `current` maps to aria-current="page", which
 * is what screen readers use to answer "where am I" — the tint alone does not.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  current?: boolean;
  trailing?: React.ReactNode;
}

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(function NavItem(
  { icon, current, trailing, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={["bk-nav-item", className].filter(Boolean).join(" ")}
      aria-current={current ? "page" : undefined}
      {...rest}
    >
      {icon ? <span className="bk-row__icon">{icon}</span> : null}
      <span className="bk-row__label">{children}</span>
      {trailing}
    </button>
  );
});
