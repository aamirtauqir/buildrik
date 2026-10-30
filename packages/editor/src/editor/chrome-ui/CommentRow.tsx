/**
 * CommentRow — one comment in the Review panel, 2L9 B8-R01 (237:8258).
 *
 * Who, where and when lead ("① Lena (client) · Logo · 2m"), the quote
 * follows, and the row's actions ("Locate ›  ✓ Resolve") close it. Open vs
 * resolved is said in words ("· Resolved") and by the quote dimming — never by
 * a colour alone. The pin number ties an open comment to its canvas pin.
 *
 * Row is deliberately transparent so the hover and selected tints are the only
 * things that paint it.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";

export interface CommentRowProps extends Omit<RowProps, "children" | "size"> {
  author: string;
  authorKind?: "internal" | "client";
  body: string;
  /** The tail of the lead line — "Logo · 2m". */
  meta?: string;
  resolved?: boolean;
  /** The comment's pin number on the canvas (open comments only). */
  pin?: number;
  /** Board 157:2: `was on: "Book a table" — element deleted`. */
  detachedNote?: string;
  /** Trailing controls on the lead line. */
  actions?: React.ReactNode;
  /** The row's own action line under the quote — "Locate ›  ✓ Resolve". */
  footer?: React.ReactNode;
  /**
   * Position in the rendered list. The row's body and meta carry
   * `review-comment-body-<index>` / `review-comment-meta-<index>` so a single
   * row is addressable.
   *
   * Defaulted rather than made conditional: `check-anchors` can only see a
   * derived id through the literal text BEFORE the interpolation.
   */
  index?: number;
}

const LEAD = "tw:flex tw:items-center tw:gap-1 tw:text-[13px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
/* "①": a 16px ring with the pin's number — the same number the canvas pin
   wears. */
const PIN =
  "tw:inline-flex tw:size-4 tw:flex-none tw:items-center tw:justify-center tw:rounded-full " +
  "tw:border tw:border-[var(--bk-ink)] tw:text-[length:var(--bk-text-11)] tw:leading-none tw:tabular-nums";

/** "Lena (client)", "Ali (team)"; "You" says its own kind. */
function who(author: string, kind: "internal" | "client"): string {
  if (author.trim().toLowerCase() === "you") return author;
  return `${author} (${kind === "client" ? "client" : "team"})`;
}

export function CommentRow({
  author,
  authorKind = "internal",
  body,
  meta,
  resolved,
  pin,
  detachedNote,
  actions,
  footer,
  index = 0,
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
        borderColor: "var(--bk-border)",
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 10,
        paddingBottom: 10,
        ...style,
      }}
      className={className}
      {...rest}
    >
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-[2px] tw:min-w-0">
        <span className={LEAD} data-testid={`review-comment-meta-${index}`}>
          {pin !== undefined ? (
            <span className={PIN} aria-label={`Pin ${pin}`}>
              {pin}
            </span>
          ) : null}
          <span className="tw:min-w-0 tw:truncate">
            {who(author, authorKind)}
            {meta ? ` · ${meta}` : ""}
            {resolved ? " · Resolved" : ""}
          </span>
        </span>
        <span
          /* A resolved comment's quote dims to muted ink. `title` keeps the
             whole comment reachable when it is clipped. */
          className={`tw:w-full tw:truncate tw:text-[13px] tw:leading-[18px] ${
            resolved ? "tw:text-[var(--bk-ink-muted)]" : "tw:text-[var(--bk-ink)]"
          }`}
          title={body}
          data-testid={`review-comment-body-${index}`}
        >
          {"“"}
          {body}
          {"”"}
        </span>
        {detachedNote ? (
          <span
            className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-warning-text)]"
            data-testid={`review-comment-detached-${index}`}
          >
            {detachedNote}
          </span>
        ) : null}
        {footer ? <span className="tw:flex tw:items-center tw:gap-4 tw:pt-1.5">{footer}</span> : null}
      </span>
      {actions ? (
        <span className="tw:flex tw:flex-none tw:items-center tw:gap-1">{actions}</span>
      ) : null}
    </Row>
  );
}
