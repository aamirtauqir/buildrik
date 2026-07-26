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
    <nav className={["bk-rail", className].filter(Boolean).join(" ")} aria-label={label} {...rest}>
      {children}
    </nav>
  );
}

export function RailSpacer() {
  return <span className="bk-rail__spacer" aria-hidden="true" />;
}

export interface RailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  showLabel?: boolean;
}

export const RailItem = React.forwardRef<HTMLButtonElement, RailItemProps>(function RailItem(
  { icon, label, active, showLabel = true, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={["bk-rail-item", className].filter(Boolean).join(" ")}
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
