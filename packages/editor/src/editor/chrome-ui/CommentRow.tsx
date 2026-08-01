/**
 * CommentRow — Figma 17:40 (Author: internal | client).
 *
 * Client comments carry a tint because who said it changes what you do about
 * it. The author is also written out, so the distinction survives greyscale and
 * colour-blindness.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_META_CLASS } from "./Row";
import { Avatar } from "flowbite-react";
import { avatarInitials, AVATAR_TONE_THEME } from "./avatarTone";

export interface CommentRowProps extends Omit<RowProps, "children" | "size"> {
  author: string;
  authorKind?: "internal" | "client";
  body: string;
  meta?: string;
  resolved?: boolean;
  /** Per-comment controls (Resolve, Reattach). They sit under the body rather
   *  than beside the meta so a long thread keeps one action column. */
  actions?: React.ReactNode;
}

export function CommentRow({
  author, authorKind = "internal", body, meta, resolved, actions, className, style, ...rest
}: CommentRowProps) {
  return (
    <Row
      size="comment"
      interactive
      /* gap/border-bottom/background all override a Row BASE utility of the
       * same specificity (tw:gap-2, tw:border-0, tw:bg-transparent) — see
       * VersionRow's comment on why `style` (already part of Row's untouched
       * HTMLAttributes contract) is the only deterministic override channel
       * for that, unlike the old CSS's guaranteed source-order win. */
      style={{
        gap: "var(--bk-space-12)",
        borderBottom: "1px solid var(--bk-border)",
        ...(authorKind === "client" ? { background: "var(--bk-warning-tint)" } : {}),
        ...style,
      }}
      className={className}
      {...rest}
    >
      <Avatar
        rounded
        size="xs"
        alt=""
        placeholderInitials={avatarInitials(author)}
        theme={AVATAR_TONE_THEME.neutral}
        role="img"
        aria-label={author}
        title={author}
      />
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-1 tw:min-w-0">
        <span className="tw:font-medium tw:text-xs">
          {author}
          {authorKind === "client" ? " · Client" : ""}
        </span>
        <span className="tw:text-gray-600">{body}</span>
        {actions ? <span className="tw:flex tw:items-center tw:gap-2 tw:pt-1">{actions}</span> : null}
      </span>
      {meta ? <span className={ROW_META_CLASS}>{resolved ? `${meta} · Resolved` : meta}</span> : null}
    </Row>
  );
}
