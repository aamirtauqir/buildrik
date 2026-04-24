/**
 * PresenceIndicators Component
 * Shows connected collaborators and connection state
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CollaborationUser, CollaborationState } from "../../shared/types/collaboration";

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
  "#DC2626",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

/** Mock users shown in demo/disconnected mode */
const MOCK_USERS: CollaborationUser[] = [
  { id: "1", name: "You", color: "var(--buildrick-accent)", lastActive: Date.now() },
  { id: "2", name: "Ana", color: "var(--buildrick-accent)", lastActive: Date.now() },
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
    backgroundColor: "var(--buildrick-surface-4)",
    color: "var(--buildrick-text-primary)",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: "var(--buildrick-radius-sm)",
    boxShadow: "var(--buildrick-shadow-md)",
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
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color,
    color: "var(--buildrick-text-on-accent)",
    fontSize: 11,
    fontWeight: 600,
    border: "2px solid var(--buildrick-bg-dark)",
    // Self indicator: primary-colored ring with offset gap
    outline: isSelf ? "2px solid var(--buildrick-accent)" : "none",
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
    borderRadius: "50%",
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
    borderRadius: "50%",
    backgroundColor: "var(--buildrick-surface-4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--buildrick-text-muted)",
    fontSize: 11,
    fontWeight: 600,
    border: "2px solid var(--buildrick-bg-dark)",
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
    color: "var(--buildrick-text-muted)",
    padding: "4px 8px",
    backgroundColor: "var(--buildrick-surface-3)",
    borderRadius: "var(--buildrick-radius-xl)",
  };

  const spinnerStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    border: "2px solid var(--buildrick-border)",
    borderTopColor: "var(--buildrick-accent)",
    borderRadius: "50%",
    animation: "buildrick-spin 1s linear infinite",
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
  // In demo mode (disconnected, no users) fall back to mock data so the
  // header slot is never empty and the visual spec is visible.
  const displayUsers: CollaborationUser[] = React.useMemo(() => {
    if (state === "connected" && users.length > 0) return users;
    if (state === "disconnected" && users.length === 0) return MOCK_USERS;
    return users;
  }, [users, state]);

  // Self is either the real currentUser or the mock "You" entry in demo mode.
  const selfId = currentUser?.id ?? (state === "disconnected" ? "1" : null);

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
