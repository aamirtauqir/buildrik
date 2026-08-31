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

/* Each layout supplies its own full set — grid/table both build on the base
   flex-1/overflow-auto pair, so keeping them as one string per mode avoids
   any same-property class-order ambiguity (Row/PanelFrame precedent). */
const BODY_CLASS: Record<DrawerLayout, string> = {
  list: "tw:flex-1 tw:overflow-auto",
  grid: "tw:flex-1 tw:overflow-auto tw:grid tw:grid-cols-2 tw:gap-3 tw:p-3",
  table: "tw:flex-1 tw:overflow-auto tw:block",
};

export function Drawer({ title, layout = "list", actions, footer, className, children, ...rest }: DrawerProps) {
  return (
    <aside
      className={["tw:w-80 tw:flex-none tw:flex tw:flex-col tw:bg-white tw:border-r tw:border-[var(--bk-gray-200)] tw:overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
      {...rest}
    >
      <PanelHeader title={title} actions={actions} />
      <div className={BODY_CLASS[layout]}>{children}</div>
      {footer ? <div className="tw:border-t tw:border-[var(--bk-gray-200)] tw:py-2 tw:px-3">{footer}</div> : null}
    </aside>
  );
}
