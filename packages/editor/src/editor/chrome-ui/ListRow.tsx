/**
 * ListRow — Figma 232:6 (Icon · Count · Chevron).
 * The generic list line: Content collections, Pages, Media folders.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_ICON_CLASS, ROW_LABEL_CLASS, ROW_META_CLASS, ROW_CHEVRON_CLASS } from "./Row";

export interface ListRowProps extends Omit<RowProps, "children"> {
  icon?: React.ReactNode;
  label: string;
  count?: number | string;
  chevron?: boolean;
}

export function ListRow({ icon, label, count, chevron, ...rest }: ListRowProps) {
  return (
    <Row interactive {...rest}>
      {icon ? <span className={ROW_ICON_CLASS}>{icon}</span> : null}
      <span className={ROW_LABEL_CLASS}>{label}</span>
      {count !== undefined ? <span className={ROW_META_CLASS}>{count}</span> : null}
      {chevron ? (
        <span className={ROW_CHEVRON_CLASS} aria-hidden="true">
          ›
        </span>
      ) : null}
    </Row>
  );
}
