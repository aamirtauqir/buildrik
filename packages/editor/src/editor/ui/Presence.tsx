/**
 * Presence — Figma 692:472.
 *
 * Solo renders nothing: an avatar of yourself alone is noise. Overflow appears
 * past three. The connection pill is the only place a user learns that their
 * edits are not landing, so it is not optional decoration.
 *
 * Tone is derived from the user id, not picked per call site, so the same
 * person is the same colour in every session.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Avatar, type AvatarTone } from "./Avatar";

export type ConnectionState = "live" | "reconnecting" | "offline";

export interface PresenceUser {
  id: string;
  name: string;
  /** Profile image; initials are the fallback, never a placeholder glyph. */
  src?: string;
  self?: boolean;
}

export interface PresenceProps extends React.HTMLAttributes<HTMLDivElement> {
  users: PresenceUser[];
  connection?: ConnectionState;
  /** How many avatars before the overflow badge. */
  max?: number;
}

const TONES: AvatarTone[] = ["blue", "green", "amber", "purple", "neutral"];

export function toneFor(id: string): AvatarTone {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

const CONN_COPY: Record<ConnectionState, (n: number) => string> = {
  live: (n) => `${n} editing`,
  reconnecting: () => "Reconnecting…",
  offline: () => "Offline",
};

export function Presence({ users, connection = "live", max = 3, className, ...rest }: PresenceProps) {
  const others = users.filter((u) => !u.self);
  if (others.length === 0 && connection === "live") return null;

  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;

  return (
    <div className={["bk-presence", className].filter(Boolean).join(" ")} {...rest}>
      <div className="bk-presence__stack">
        {shown.map((u) => (
          <Avatar key={u.id} name={u.name} src={u.src} tone={toneFor(u.id)} self={u.self} />
        ))}
        {overflow > 0 ? (
          <span className="bk-presence__overflow" aria-label={`${overflow} more`}>
            +{overflow}
          </span>
        ) : null}
      </div>
      <span
        className={`bk-presence__conn bk-presence__conn--${connection}`}
        role="status"
        aria-live={connection === "offline" ? "assertive" : "polite"}
      >
        <span className="bk-presence__conn-dot" aria-hidden="true" />
        {CONN_COPY[connection](users.length)}
      </span>
    </div>
  );
}
