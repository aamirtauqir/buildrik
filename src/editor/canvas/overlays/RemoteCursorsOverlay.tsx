/**
 * RemoteCursorsOverlay Component
 * Renders other users' cursors on the canvas
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useState, useEffect } from "react";
import type { Composer } from "../../../engine/Composer";
import type { CollaborationUser, CursorPosition } from "../../../shared/types/collaboration";

// ============================================================================
// TYPES
// ============================================================================

interface RemoteCursorsOverlayProps {
  composer: Composer | null;
  /** Canvas zoom level for scaling */
  zoom?: number;
}

interface RemoteCursor {
  user: CollaborationUser;
  position: CursorPosition;
}

// ============================================================================
// STYLES
// ============================================================================

const containerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  overflow: "hidden",
  zIndex: 1000,
};

const cursorStyle: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  transition: "transform 0.1s ease-out",
  pointerEvents: "none",
};

const cursorSvgStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
};

const labelStyle: React.CSSProperties = {
  marginLeft: 12,
  marginTop: -4,
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  color: "#fff",
  whiteSpace: "nowrap",
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ============================================================================
// CURSOR COMPONENT
// ============================================================================

interface CursorPointerProps {
  cursor: RemoteCursor;
}

const CursorPointer: React.FC<CursorPointerProps> = ({ cursor }) => {
  const { user, position } = cursor;

  // Hide cursor if position is invalid
  if (position.x < 0 || position.y < 0) return null;

  return (
    <div
      style={{
        ...cursorStyle,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Cursor SVG */}
      <svg style={cursorSvgStyle} viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
          fill={user.color}
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <span style={{ ...labelStyle, backgroundColor: user.color }}>{user.name}</span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RemoteCursorsOverlay: React.FC<RemoteCursorsOverlayProps> = ({
  composer,
  zoom = 100,
}) => {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    if (!composer?.collaboration) return;

    const collab = composer.collaboration;
    const currentUserId = collab.getCurrentUser()?.id;

    const handleCursorUpdate = ({
      userId,
      position,
    }: {
      userId: string;
      position: CursorPosition;
    }) => {
      if (userId === currentUserId) return;

      setCursors((prev) => {
        const user = collab.getUsers().find((u) => u.id === userId);
        if (!user) return prev;

        const existing = prev.findIndex((c) => c.user.id === userId);
        const newCursor: RemoteCursor = { user, position };

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newCursor;
          return updated;
        }
        return [...prev, newCursor];
      });
    };

    const handleUserLeave = (userId: string) => {
      setCursors((prev) => prev.filter((c) => c.user.id !== userId));
    };

    collab.on("cursor:update", handleCursorUpdate);
    collab.on("user:leave", handleUserLeave);

    return () => {
      collab.off("cursor:update", handleCursorUpdate);
      collab.off("user:leave", handleUserLeave);
    };
  }, [composer]);

  // Note: zoom prop available for future scaling implementation
  void zoom;

  if (cursors.length === 0) return null;

  return (
    <div style={containerStyle}>
      {cursors.map((cursor) => (
        <CursorPointer key={cursor.user.id} cursor={cursor} />
      ))}
    </div>
  );
};

export default RemoteCursorsOverlay;
