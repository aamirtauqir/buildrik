/**
 * CommentRow — Review panel boards 156:2, 157:2, 157:109.
 *
 * The comment IS the row: it is quoted at full size, and everything about it
 * — who said it, which page, how long ago — sits under it in one muted line.
 * The previous row led with an avatar and the author's name and put the
 * comment second, so a panel of client feedback read as a list of people.
 *
 * A status dot carries open vs resolved. It is never the only carrier: the
 * meta line names the author and their kind in words, so the row survives
 * greyscale and colour-blindness.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_META_CLASS } from "./Row";

export interface CommentRowProps extends Omit<RowProps, "children" | "size"> {
  author: string;
  authorKind?: "internal" | "client";
  body: string;
  /** The tail of the board's meta line — "Home · 2d". */
  meta?: string;
  resolved?: boolean;
  /** Board 157:2: `was on: "Book a table" — element deleted`. */
  detachedNote?: string;
  /** Per-comment controls (Resolve, Reattach), under the meta line. */
  actions?: React.ReactNode;
}

const DOT = "tw:mt-1.5 tw:size-2 tw:flex-none tw:rounded-full";

export function CommentRow({
  author,
  authorKind = "internal",
  body,
  meta,
  resolved,
  detachedNote,
  actions,
  className,
  style,
  ...rest
}: CommentRowProps) {
  return (
    <Row
      size="comment"
      interactive
      /* Row's BASE utilities (tw:gap-2, tw:border-0, tw:items-center) are the
       * same specificity as any className override, so the geometry that has
       * to win goes through `style` — the VersionRow precedent. */
      style={{
        gap: "var(--bk-space-8)",
        alignItems: "flex-start",
        borderBottom: "1px solid var(--bk-border)",
        ...style,
      }}
      className={className}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={DOT}
        style={{ background: resolved ? "var(--bk-success)" : "var(--bk-warning)" }}
      />
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-1 tw:min-w-0">
        <span className="tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]">
          {"“"}
          {body}
          {"”"}
        </span>
        {detachedNote ? (
          <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]">
            {detachedNote}
          </span>
        ) : null}
        <span className={ROW_META_CLASS}>
          {author} · {authorKind === "client" ? "client" : "you"}
          {meta ? ` · ${meta}` : ""}
          {resolved ? " · resolved" : ""}
        </span>
        {actions ? (
          <span className="tw:flex tw:items-center tw:gap-2 tw:pt-1">{actions}</span>
        ) : null}
      </span>
    </Row>
  );
}
