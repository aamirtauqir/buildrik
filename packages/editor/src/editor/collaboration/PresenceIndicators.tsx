/**
 * PresenceIndicators Component
 * Shows connected collaborators and connection state
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CollaborationUser, CollaborationState } from "../../shared/types/collaboration";
import { IS_DEV_BUILD } from "../../shared/utils/runtimeEnv";

// ============================================================================
// TYPES
// ============================================================================

interface PresenceIndicatorsProps {
  /** All users in the room */
  users: CollaborationUser[];
  /** Current user (shown with "You" ring indicator) */
  currentUser: CollaborationUser | null;
  /** Connection state */
  state: CollaborationState;
  /** Maximum visible avatars before showing overflow (default 3) */
  maxVisible?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Predefined avatar palette — cycled via user ID hash */
const AVATAR_PALETTE = [
  "#0891B2",
  "var(--bk-error)",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

/** Mock users shown in dev-build demo mode only (never in production) */
const MOCK_USERS: CollaborationUser[] = [
  { id: "1", name: "You", color: "var(--bk-accent)", lastActive: Date.now() },
  { id: "2", name: "Ana", color: "var(--bk-accent)", lastActive: Date.now() },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Derive a stable color from a user ID by hashing into the palette.
 * If the user already has a color set, that takes precedence.
 */
function deriveAvatarColor(userId: string, providedColor?: string): string {
  if (providedColor) return providedColor;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/**
 * Extract up to 2 initials from a display name.
 */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// TOOLTIP
// ============================================================================

interface TooltipProps {
  label: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children }) => {
  const [visible, setVisible] = React.useState(false);

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
    backgroundColor: "var(--bk-gray-200)",
    color: "var(--bk-ink)",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: "var(--bk-radius-sm)",
    boxShadow: "var(--bk-shadow-drag)",
    pointerEvents: "none",
    zIndex: 9999,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.1s ease",
  };

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div style={tooltipStyle}>{label}</div>
    </div>
  );
};

// ============================================================================
// USER AVATAR
// ============================================================================

interface UserAvatarProps {
  user: CollaborationUser;
  isSelf: boolean;
  /** role label shown in tooltip, e.g. "Editor" */
  role?: string;
  /** stacking index for z-index management */
  stackIndex: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, isSelf, role, stackIndex }) => {
  const color = deriveAvatarColor(user.id, user.color);
  const initials = getInitials(user.name);
  const tooltipLabel = role ? `${user.name} — ${role}` : user.name;

  const avatarStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "var(--bk-radius-full)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color,
    color: "var(--bk-accent-on)",
    fontSize: 11,
    fontWeight: 600,
    border: "2px solid var(--bk-gray-900)",
    // Self indicator: primary-colored ring with offset gap
    outline: isSelf ? "2px solid var(--bk-accent)" : "none",
    outlineOffset: isSelf ? 2 : 0,
    marginLeft: stackIndex === 0 ? 0 : -8,
    cursor: "default",
    flexShrink: 0,
    position: "relative",
    zIndex: stackIndex,
    transition: "transform 0.15s ease",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "var(--bk-radius-full)",
    objectFit: "cover",
  };

  return (
    <Tooltip label={tooltipLabel}>
      <div style={avatarStyle}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} style={imgStyle} />
        ) : (
          initials
        )}
      </div>
    </Tooltip>
  );
};

// ============================================================================
// OVERFLOW BADGE
// ============================================================================

interface OverflowBadgeProps {
  count: number;
  stackIndex: number;
}

const OverflowBadge: React.FC<OverflowBadgeProps> = ({ count, stackIndex }) => {
  const style: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "var(--bk-radius-full)",
    backgroundColor: "var(--bk-gray-200)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--bk-ink-muted)",
    fontSize: 11,
    fontWeight: 600,
    border: "2px solid var(--bk-gray-900)",
    marginLeft: -8,
    cursor: "default",
    flexShrink: 0,
    position: "relative",
    zIndex: stackIndex,
  };

  return (
    <Tooltip label={`${count} more collaborator${count > 1 ? "s" : ""}`}>
      <div style={style}>+{count}</div>
    </Tooltip>
  );
};

// ============================================================================
// CONNECTION INDICATOR (connecting / reconnecting state)
// ============================================================================

interface ConnectionIndicatorProps {
  status: "connecting" | "reconnecting";
}

const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ status }) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--bk-ink-muted)",
    padding: "4px 8px",
    backgroundColor: "var(--bk-bg-subtle)",
    borderRadius: "var(--bk-radius-lg)",
  };

  const spinnerStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    border: "2px solid var(--bk-border)",
    borderTopColor: "var(--bk-accent)",
    borderRadius: "var(--bk-radius-full)",
    animation: "bd-spin 1s linear infinite",
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      <span>{status === "connecting" ? "Connecting..." : "Reconnecting..."}</span>
    </div>
  );
};

// ============================================================================
// PRESENCE INDICATORS
// ============================================================================

export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  users,
  currentUser,
  state,
  maxVisible = 3,
}) => {
  // Determine which users to display.
  // Mock fallback is DEV-ONLY: in production a disconnected session renders
  // nothing instead of fake collaborators ("You", "Ana").
  const displayUsers: CollaborationUser[] = React.useMemo(() => {
    if (state === "connected" && users.length > 0) return users;
    if (IS_DEV_BUILD && state === "disconnected" && users.length === 0) return MOCK_USERS;
    return users;
  }, [users, state]);

  // Self is either the real currentUser or the mock "You" entry in dev demo mode.
  const selfId = currentUser?.id ?? (IS_DEV_BUILD && state === "disconnected" ? "1" : null);

  const visibleUsers = displayUsers.slice(0, maxVisible);
  const overflowCount = displayUsers.length - maxVisible;

  // Show spinner states
  if (state === "connecting") {
    return (
      <div style={{ paddingLeft: 4 }}>
        <ConnectionIndicator status="connecting" />
      </div>
    );
  }

  if (state === "reconnecting") {
    return (
      <div style={{ paddingLeft: 4 }}>
        <ConnectionIndicator status="reconnecting" />
      </div>
    );
  }

  if (displayUsers.length === 0) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    paddingLeft: 4,
    // The first avatar has no left margin; subsequent ones overlap via -8px marginLeft.
    // We need position:relative on the container so z-indexes stack correctly.
    position: "relative",
  };

  return (
    <div style={containerStyle}>
      {visibleUsers.map((user, idx) => (
        <UserAvatar
          key={user.id}
          user={user}
          isSelf={user.id === selfId}
          stackIndex={visibleUsers.length - idx}
        />
      ))}

      {overflowCount > 0 && (
        <OverflowBadge
          count={overflowCount}
          stackIndex={0}
        />
      )}
    </div>
  );
};

export default PresenceIndicators;
