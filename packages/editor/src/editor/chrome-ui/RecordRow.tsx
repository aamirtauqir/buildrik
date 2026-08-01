/**
 * RecordRow — Figma 240:14 (Published).
 * CMS records inside the Content panel.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_LABEL_CLASS, ROW_META_CLASS, ROW_CHEVRON_CLASS } from "./Row";
import { StatusDot } from "./StatusDot";

export interface RecordRowProps extends Omit<RowProps, "children" | "size"> {
  label: string;
  meta?: string;
  published?: boolean;
  /** Same affordance as ListRow: the row drills into a detail view. */
  chevron?: boolean;
}

export function RecordRow({ label, meta, published, chevron, ...rest }: RecordRowProps) {
  return (
    <Row interactive {...rest}>
      <StatusDot state={published ? "live" : "draft"} label={published ? "Published" : "Draft"} />
      <span className={ROW_LABEL_CLASS}>{label}</span>
      {meta ? <span className={ROW_META_CLASS}>{meta}</span> : null}
      {chevron ? (
        <span className={ROW_CHEVRON_CLASS} aria-hidden="true">
          ›
        </span>
      ) : null}
    </Row>
  );
}
