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
 * Geometry is Figma component 17:40 ("64h. External authors are MARKED"),
 * measured off boards 157:2 and 157:169: 64 tall, 16 left / 12 right, 10
 * vertical, 8 gap, a 13/20 body clipped to ONE line and a 12/18 meta 2px under
 * it. Two of those were drift the eye-walks passed over — the body shipped at
 * 14/20 and wrapped, and per-row actions sat on a fourth line, which put the
 * shipped row at ~90 against the board's 64. The actions kept their capability
 * and moved to a trailing slot on the row's own flex line.
 *
 * The board's `bg-[var(--color/bg-card,white)]` is NOT restated here: Row is
 * deliberately transparent so the hover tint and the selected tint are the only
 * things that paint it, and the row already reads white from the panel it sits
 * in. `measure.mjs` reports the EFFECTIVE background, so the board's fill is
 * satisfied without an opaque layer over the hover state.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";

export interface CommentRowProps extends Omit<RowProps, "children" | "size"> {
  author: string;
  authorKind?: "internal" | "client";
  body: string;
  /** The tail of the board's meta line — "Home · 2d". */
  meta?: string;
  resolved?: boolean;
  /** Board 157:2: `was on: "Book a table" — element deleted`. */
  detachedNote?: string;
  /** Per-comment controls (Resolve, Reattach), in the row's trailing slot. */
  actions?: React.ReactNode;
  /** Secondary controls on their own line under the meta — board
   *  4418:115784 puts Resolve there, leaving the trailing slot to Locate ›. */
  footer?: React.ReactNode;
  /**
   * Position in the rendered list. The row's body and meta carry
   * `review-comment-body-<index>` / `review-comment-meta-<index>` so a single
   * row is addressable — a list of rows that all answer to one id is a list
   * nothing can measure, and these two lines are where the board's type lives.
   *
   * Defaulted rather than made conditional: `check-anchors` can only see a
   * derived id through the literal text BEFORE the interpolation, so
   * ``data-testid={index == null ? undefined : `…-${index}`}`` greps as
   * nothing and every recipe naming these rows reads as a missing anchor.
   */
  index?: number;
}

const DOT = "tw:mt-1.5 tw:size-2 tw:flex-none tw:rounded-full";
/* Board I228:1017;17:39 — Inter 12/18 ink-muted, NOT the mono/11 ROW_META_CLASS
   the rest of the row family uses. A comment's meta is a sentence ("Sara ·
   client · Home · 2d"), not a count, so it is not data/11 · mono. */
const META = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";

export function CommentRow({
  author,
  authorKind = "internal",
  body,
  meta,
  resolved,
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
        /* borderCOLOR, not the `border-bottom` shorthand: with only the
           bottom edge set, `border-top-color` still computes — to
           currentColor, i.e. the row's ink — and that is the value a
           computed-style read reports for the row's border. */
        borderColor: "var(--bk-border)",
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        /* Row's `comment` size ships px-4/py-3; the board's row is 16/12/10.
           Through `style` for the same reason the gap is — Row's BASE
           utilities tie any className override on specificity. */
        paddingLeft: 16,
        paddingRight: 12,
        paddingTop: 10,
        paddingBottom: 10,
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
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-[2px] tw:min-w-0">
        {/* One line, clipped — board I228:1017;17:38 is `h-[20px]
            overflow-hidden text-ellipsis whitespace-nowrap`. `title` keeps the
            whole comment reachable, since the row is now the only place the
            panel shows it. */}
        <span
          className="tw:h-5 tw:w-full tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]"
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
        <span className={META} data-testid={`review-comment-meta-${index}`}>
          {author} · {authorKind === "client" ? "client" : "you"}
          {meta ? ` · ${meta}` : ""}
          {resolved ? " · resolved" : ""}
        </span>
        {footer ? <span className="tw:flex tw:items-center tw:gap-3 tw:pt-1">{footer}</span> : null}
      </span>
      {actions ? (
        <span className="tw:flex tw:flex-none tw:items-center tw:gap-1">{actions}</span>
      ) : null}
    </Row>
  );
}
