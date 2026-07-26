/**
 * VersionRow — Figma 240:6 (Current).
 * History panel and Publish history.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";
import { Badge } from "./Badge";
import { StatusDot, type StatusDotState } from "./StatusDot";

export interface VersionRowProps extends Omit<RowProps, "children" | "size"> {
  title: string;
  meta: string;
  state?: StatusDotState;
  current?: boolean;
  actions?: React.ReactNode;
}

export function VersionRow({ title, meta, state, current, actions, className, ...rest }: VersionRowProps) {
  return (
    <Row
      size="tall"
      interactive
      className={["bk-version-row", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bk-version-row__top">
        {state ? <StatusDot state={state} /> : null}
        <span className="bk-version-row__title">{title}</span>
        {current ? <Badge kind="success">CURRENT</Badge> : null}
        {actions}
      </span>
      <span className="bk-row__meta">{meta}</span>
    </Row>
  );
}
