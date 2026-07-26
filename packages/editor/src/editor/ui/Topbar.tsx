/**
 * Topbar — 56px shell header.
 * @license BSD-3-Clause
 */
import React from "react";

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {}

export function Topbar({ className, children, ...rest }: TopbarProps) {
  return (
    <header className={["bk-topbar", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </header>
  );
}

export function TopbarSpacer() {
  return <span className="bk-topbar__spacer" aria-hidden="true" />;
}
