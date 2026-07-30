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
import { Row, type RowProps } from "./Row";
import { Avatar } from "flowbite-react";
import { avatarInitials, AVATAR_TONE_THEME } from "./avatarTone";

export interface CommentRowProps extends Omit<RowProps, "children" | "size"> {
  author: string;
  authorKind?: "internal" | "client";
  body: string;
  meta?: string;
  resolved?: boolean;
}

export function CommentRow({
  author, authorKind = "internal", body, meta, resolved, className, ...rest
}: CommentRowProps) {
  return (
    <Row
      size="comment"
      interactive
      className={["bk-comment-row", authorKind === "client" && "bk-comment-row--client", className]
        .filter(Boolean)
        .join(" ")}
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
      <span className="bk-comment-row__body">
        <span className="bk-comment-row__author">
          {author}
          {authorKind === "client" ? " · Client" : ""}
        </span>
        <span className="bk-comment-row__text">{body}</span>
      </span>
      {meta ? <span className="bk-row__meta">{resolved ? `${meta} · Resolved` : meta}</span> : null}
    </Row>
  );
}
