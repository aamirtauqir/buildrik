/**
 * PanelHeader — Figma 16:6.
 * The 44px bar at the top of every drawer panel: title left, actions right.
 * @license BSD-3-Clause
 */
import React from "react";

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
}

export function PanelHeader({ title, actions, className, ...rest }: PanelHeaderProps) {
  return (
    <div
      role="heading"
      aria-level={2}
      className={["bk-panel-header", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bk-panel-header__title">{title}</span>
      {actions ? <span className="bk-panel-header__actions">{actions}</span> : null}
    </div>
  );
}
