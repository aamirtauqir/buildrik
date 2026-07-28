/**
 * PresenceIndicators — adapts a live collaboration session to the `Presence`
 * organism (Figma 692:472).
 *
 * This used to be 300 lines of inline styles carrying its own avatar palette in
 * raw Tailwind hex, its own tooltip, and a 2px ring in `--bk-gray-900` left over
 * from the dark theme. All of that is the design system's job now; what remains
 * is the only part genuinely about collaboration — turning session state into
 * presence props.
 *
 * `connecting` and `reconnecting` both surface as "Reconnecting…". The user's
 * question in either case is the same — are my edits landing? — and the design
 * has one answer for it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Presence, type ConnectionState, type PresenceUser } from "@/editor/ui";
import type { CollaborationUser, CollaborationState } from "@/shared/types/collaboration";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";

export interface PresenceIndicatorsProps {
  /** All users in the room */
  users: CollaborationUser[];
  /** Current user — rendered with the "you" ring */
  currentUser: CollaborationUser | null;
  /** Connection state */
  state: CollaborationState;
  /** Maximum visible avatars before the overflow badge (default 3) */
  maxVisible?: number;
}

/** Demo collaborators, dev builds only — production shows an empty room. */
const MOCK_USERS: CollaborationUser[] = [
  { id: "1", name: "You", color: "", lastActive: 0 },
  { id: "2", name: "Ana", color: "", lastActive: 0 },
];

const CONNECTION: Record<CollaborationState, ConnectionState> = {
  connected: "live",
  connecting: "reconnecting",
  reconnecting: "reconnecting",
  disconnected: "offline",
};

/** Session shape → presence props. Exported so the topbar can skip the wrapper. */
export function toPresenceUsers(
  users: CollaborationUser[],
  currentUser: CollaborationUser | null,
  state: CollaborationState,
): PresenceUser[] {
  const demoing = IS_DEV_BUILD && state === "disconnected" && users.length === 0;
  const source = demoing ? MOCK_USERS : users;
  const selfId = currentUser?.id ?? (demoing ? "1" : null);
  return source.map((u) => ({ id: u.id, name: u.name, src: u.avatar, self: u.id === selfId }));
}

export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  users,
  currentUser,
  state,
  maxVisible = 3,
}) => (
  <Presence
    users={toPresenceUsers(users, currentUser, state)}
    connection={CONNECTION[state]}
    max={maxVisible}
  />
);

export default PresenceIndicators;
