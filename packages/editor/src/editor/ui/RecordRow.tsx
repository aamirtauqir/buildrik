/**
 * RecordRow — Figma 240:14 (Published).
 * CMS records inside the Content panel.
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";
import { StatusDot } from "../chrome-ui/StatusDot";

export interface RecordRowProps extends Omit<RowProps, "children" | "size"> {
  label: string;
  meta?: string;
  published?: boolean;
}

export function RecordRow({ label, meta, published, ...rest }: RecordRowProps) {
  return (
    <Row interactive {...rest}>
      <StatusDot state={published ? "live" : "draft"} label={published ? "Published" : "Draft"} />
      <span className="bk-row__label">{label}</span>
      {meta ? <span className="bk-row__meta">{meta}</span> : null}
    </Row>
  );
}
