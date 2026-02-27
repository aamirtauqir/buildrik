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
  /** Current user (excluded from display) */
  currentUser: CollaborationUser | null;
  /** Connection state */
  state: CollaborationState;
  /** Maximum visible avatars before showing overflow */
  maxVisible?: number;
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    border: "2px solid var(--aqb-bg-dark)",
    marginLeft: -8,
    cursor: "default",
    transition: "transform 0.15s ease",
  },
  avatarHover: {
    transform: "scale(1.1)",
    zIndex: 10,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover" as const,
  },
  overflow: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "var(--aqb-bg-panel-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--aqb-text-muted)",
    fontSize: 10,
    fontWeight: 600,
    marginLeft: -8,
    border: "2px solid var(--aqb-bg-dark)",
  },
  connection: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "var(--aqb-text-muted)",
    padding: "4px 8px",
    backgroundColor: "var(--aqb-bg-panel-secondary)",
    borderRadius: 4,
  },
  spinner: {
    width: 12,
    height: 12,
    border: "2px solid var(--aqb-border)",
    borderTopColor: "var(--aqb-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// ============================================================================
// USER AVATAR
// ============================================================================

interface UserAvatarProps {
  user: CollaborationUser;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarStyle: React.CSSProperties = {
    ...styles.avatar,
    backgroundColor: user.color,
    ...(isHovered ? styles.avatarHover : {}),
  };

  return (
    <div
      style={avatarStyle}
      title={user.name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} style={styles.avatarImage} />
      ) : (
        initials
      )}
    </div>
  );
};

// ============================================================================
// CONNECTION INDICATOR
// ============================================================================

interface ConnectionIndicatorProps {
  status: "connecting" | "reconnecting";
}

const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ status }) => (
  <div style={styles.connection}>
    <div style={styles.spinner} />
    <span>{status === "connecting" ? "Connecting..." : "Reconnecting..."}</span>
  </div>
);

// ============================================================================
// PRESENCE INDICATORS
// ============================================================================

export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  users,
  currentUser,
  state,
  maxVisible = 4,
}) => {
  // Filter out current user from display
  const otherUsers = React.useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser]
  );

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const overflowCount = otherUsers.length - maxVisible;

  // Don't render anything if disconnected and no users
  if (state === "disconnected" && otherUsers.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Connection status indicators */}
      {state === "connecting" && <ConnectionIndicator status="connecting" />}
      {state === "reconnecting" && <ConnectionIndicator status="reconnecting" />}

      {/* User avatars */}
      {state === "connected" &&
        visibleUsers.map((user) => <UserAvatar key={user.id} user={user} />)}

      {/* Overflow indicator */}
      {state === "connected" && overflowCount > 0 && (
        <div
          style={styles.overflow}
          title={`${overflowCount} more collaborator${overflowCount > 1 ? "s" : ""}`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default PresenceIndicators;
