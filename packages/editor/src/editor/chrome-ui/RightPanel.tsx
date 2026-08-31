/**
 * RightPanel — Figma 19:47.
 * The inspector column: 300px, or 360px for the wide review surfaces.
 * @license BSD-3-Clause
 */
import React from "react";
import { PanelHeader } from "./PanelHeader";

export interface RightPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  wide?: boolean;
  actions?: React.ReactNode;
}

/* narrow/wide supply their own width value — Tailwind utilities of equal
   specificity have no className-order-to-cascade-order guarantee. */
const WIDTH_CLASS: Record<"narrow" | "wide", string> = {
  narrow: "tw:w-[300px]",
  wide: "tw:w-[360px]",
};

export function RightPanel({ title, wide, actions, className, children, ...rest }: RightPanelProps) {
  return (
    <aside
      className={[
        "tw:flex tw:flex-col tw:flex-none tw:bg-white tw:border-l tw:border-[var(--bk-gray-200)] tw:overflow-hidden",
        WIDTH_CLASS[wide ? "wide" : "narrow"],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
      {...rest}
    >
      <PanelHeader title={title} actions={actions} />
      <div className="tw:flex-1 tw:overflow-auto tw:p-3 tw:flex tw:flex-col tw:gap-3">{children}</div>
    </aside>
  );
}
