/**
 * Footer — 32px shell status bar.
 * @license BSD-3-Clause
 */
import React from "react";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export function Footer({ className, children, ...rest }: FooterProps) {
  return (
    <footer
      className={[
        "tw:h-8 tw:flex-none tw:flex tw:items-center tw:gap-3 tw:px-4 tw:bg-white tw:border-t tw:border-gray-200 " +
          "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </footer>
  );
}

export function FooterSpacer() {
  return <span className="tw:flex-1" aria-hidden="true" />;
}
