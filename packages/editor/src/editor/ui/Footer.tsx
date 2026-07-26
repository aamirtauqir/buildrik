/**
 * Footer — 32px shell status bar.
 * @license BSD-3-Clause
 */
import React from "react";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export function Footer({ className, children, ...rest }: FooterProps) {
  return (
    <footer className={["bk-footer", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </footer>
  );
}

export function FooterSpacer() {
  return <span className="bk-footer__spacer" aria-hidden="true" />;
}
