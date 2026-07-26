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

export function RightPanel({ title, wide, actions, className, children, ...rest }: RightPanelProps) {
  return (
    <aside
      className={["bk-right-panel", wide && "bk-right-panel--wide", className].filter(Boolean).join(" ")}
      aria-label={title}
      {...rest}
    >
      <PanelHeader title={title} actions={actions} />
      <div className="bk-right-panel__body">{children}</div>
    </aside>
  );
}
