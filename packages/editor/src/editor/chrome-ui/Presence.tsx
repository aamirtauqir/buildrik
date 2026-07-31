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
import { Avatar } from "flowbite-react";
import { avatarInitials, AVATAR_TONE_THEME, type AvatarTone } from "../ui/avatarTone";

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

/* Stacking ring belongs to the stack, not to every avatar in the product — an
   avatar in a comment row has nothing to separate itself from. Applied here,
   not globally, unlike the old `.bk-presence__stack .bk-avatar` descendant
   selector which was scoped the same way by construction (this is the only
   place that composes the stack). */
const STACK_AVATAR_RING_CLASS = "tw:[box-shadow:0_0_0_2px_var(--bk-bg-card)]";

const CONN_CLASS: Record<ConnectionState, string> = {
  live: "tw:bg-green-100 tw:text-green-600",
  reconnecting: "tw:bg-yellow-50 tw:text-yellow-800",
  offline: "tw:bg-red-100 tw:text-red-700",
};

const CONN_DOT_CLASS: Record<ConnectionState, string> = {
  live: "tw:bg-green-500",
  reconnecting: "tw:bg-yellow-500",
  offline: "tw:bg-red-600",
};

export function Presence({ users, connection = "live", max = 3, className, ...rest }: PresenceProps) {
  const others = users.filter((u) => !u.self);
  if (others.length === 0 && connection === "live") return null;

  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;

  return (
    <div className={["tw:inline-flex tw:items-center tw:gap-2", className].filter(Boolean).join(" ")} {...rest}>
      <div className="tw:inline-flex tw:items-center tw:-space-x-2">
        {shown.map((u) => (
          <Avatar
            key={u.id}
            className={[
              STACK_AVATAR_RING_CLASS,
              u.self && "tw:outline tw:outline-2 tw:outline-blue-700 tw:outline-offset-2",
            ]
              .filter(Boolean)
              .join(" ")}
            rounded
            size="xs"
            alt=""
            img={u.src}
            placeholderInitials={avatarInitials(u.name)}
            theme={AVATAR_TONE_THEME[toneFor(u.id)]}
            role="img"
            aria-label={u.name}
            title={u.name}
          />
        ))}
        {overflow > 0 ? (
          <span
            className={
              "tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full " +
              "tw:bg-gray-200 tw:text-gray-700 tw:[box-shadow:0_0_0_2px_var(--bk-bg-card)] " +
              "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:font-medium tw:flex-none"
            }
            aria-label={`${overflow} more`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
      <span
        className={
          "tw:inline-flex tw:items-center tw:gap-1 tw:h-5 tw:px-2 tw:rounded-full " +
          "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:font-medium tw:whitespace-nowrap " +
          CONN_CLASS[connection]
        }
        role="status"
        aria-live={connection === "offline" ? "assertive" : "polite"}
      >
        <span className={`tw:w-2 tw:h-2 tw:rounded-full tw:flex-none ${CONN_DOT_CLASS[connection]}`} aria-hidden="true" />
        {CONN_COPY[connection](users.length)}
      </span>
    </div>
  );
}
