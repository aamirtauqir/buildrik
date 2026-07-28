/**
 * Avatar — Figma component set 14:42 (Size).
 * Falls back to initials when there is no image, which is the common case for
 * invited collaborators who have not set a picture.
 * @license BSD-3-Clause
 */
import React from "react";

export type AvatarSize = "sm" | "md";
/** Tones come from the Flowbite ramps in the token file — never a raw hex. */
export type AvatarTone = "neutral" | "blue" | "green" | "purple" | "amber";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
  tone?: AvatarTone;
  /** Draws the accent ring that marks "this one is you". */
  self?: boolean;
  name: string;
  src?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase();
}

export function Avatar({ size = "sm", tone = "neutral", self, name, src, className, ...rest }: AvatarProps) {
  return (
    <span
      className={["bk-avatar", `bk-avatar--${size}`, `bk-avatar--${tone}`, self && "bk-avatar--self", className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={name}
      title={name}
      {...rest}
    >
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}
