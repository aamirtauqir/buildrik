/**
 * ListRow — Figma 232:6 (Icon · Count · Chevron).
 * The generic list line: Content collections, Pages, Media folders.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";

export interface ListRowProps extends Omit<RowProps, "children"> {
  icon?: React.ReactNode;
  label: string;
  count?: number | string;
  chevron?: boolean;
}

export function ListRow({ icon, label, count, chevron, ...rest }: ListRowProps) {
  return (
    <Row interactive {...rest}>
      {icon ? <span className="bk-row__icon">{icon}</span> : null}
      <span className="bk-row__label">{label}</span>
      {count !== undefined ? <span className="bk-row__meta">{count}</span> : null}
      {chevron ? (
        <span className="bk-row__chevron" aria-hidden="true">
          ›
        </span>
      ) : null}
    </Row>
  );
}
