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

export function ListRow({ icon, label, count, chevron, className, ...rest }: ListRowProps) {
  /* The row's own testId, so each instance's three text nodes are individually
     addressable — a shared literal id would resolve to N elements and the
     conformance runner refuses ambiguity. The literal PREFIX is deliberate:
     `check-anchors` matches a derived id only through the text BEFORE the
     interpolation. */
  const rowId = (rest as Record<string, unknown>)["data-testid"];
  const sub = (part: string) => (typeof rowId === "string" ? `row-${part}-${rowId}` : undefined);
  return (
    /* 232:6 draws the row at radius 4. `Row` (8:47) itself carries none — the
       boards that show a bare Row (components-library 641:2561, the Content
       "+ New collection" line) state no radius, so the corner belongs to this
       instance, not to the base. */
    <Row interactive className={["tw:rounded-[var(--bk-radius-sm)]", className].filter(Boolean).join(" ")} {...rest}>
      {icon ? <span className={ROW_ICON_CLASS}>{icon}</span> : null}
      {/* 232:6's own children carry line-heights the shared row classes leave
          to the face: the label and the chevron are 13/20, the count is 11/16.
          Left as `normal` the label's box was 16 in a 32 row, so a list of rows
          sat 4px tighter than every board that draws one. Scoped to ListRow
          rather than pushed into ROW_LABEL_CLASS — NavItem and TreeRow share
          that constant and are measured against their own boards. */}
      <span className={`${ROW_LABEL_CLASS} tw:leading-5`} data-testid={sub("label")}>{label}</span>
      {count !== undefined ? (
        <span className={`${ROW_META_CLASS} tw:leading-4`} data-testid={sub("count")}>{count}</span>
      ) : null}
      {chevron ? (
        <span className={`${ROW_CHEVRON_CLASS} tw:leading-5`} aria-hidden="true" data-testid={sub("chevron")}>
          ›
        </span>
      ) : null}
    </Row>
  );
}
