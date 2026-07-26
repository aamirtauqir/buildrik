/**
 * Drawer — Figma component set 19:46 (Layout: list | grid | table).
 * The 320px left panel every rail tool opens into.
 * @license BSD-3-Clause
 */
import React from "react";
import { PanelHeader } from "./PanelHeader";

export type DrawerLayout = "list" | "grid" | "table";

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  layout?: DrawerLayout;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ title, layout = "list", actions, footer, className, children, ...rest }: DrawerProps) {
  return (
    <aside className={["bk-drawer", className].filter(Boolean).join(" ")} aria-label={title} {...rest}>
      <PanelHeader title={title} actions={actions} />
      <div className={["bk-drawer__body", layout !== "list" && `bk-drawer__body--${layout}`].filter(Boolean).join(" ")}>
        {children}
      </div>
      {footer ? <div className="bk-drawer__foot">{footer}</div> : null}
    </aside>
  );
}
