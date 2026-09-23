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

export function RecordRow({ label, meta, published, chevron, className, ...rest }: RecordRowProps) {
  /* Same derived-id rule as ListRow — see the note there. */
  const rowId = (rest as Record<string, unknown>)["data-testid"];
  const sub = (part: string) => (typeof rowId === "string" ? `row-${part}-${rowId}` : undefined);
  return (
    /* 240:14 — radius 4, same as the List row it sits beside (241:1665). */
    <Row interactive className={["tw:rounded-[var(--bk-radius-sm)]", className].filter(Boolean).join(" ")} {...rest}>
      <StatusDot state={published ? "live" : "draft"} label={published ? "Published" : "Draft"} />
      {/* 240:16 / 240:17 — both 13/20, the same line-heights 232:6 gives the
          List row this sits beside (board 149:50 draws them in one column). */}
      <span className={`${ROW_LABEL_CLASS} tw:leading-5`} data-testid={sub("label")}>{label}</span>
      {meta ? <span className={`${ROW_META_CLASS} tw:leading-4`} data-testid={sub("meta")}>{meta}</span> : null}
      {chevron ? (
        <span className={`${ROW_CHEVRON_CLASS} tw:leading-5`} aria-hidden="true" data-testid={sub("chevron")}>
          ›
        </span>
      ) : null}
    </Row>
  );
}
