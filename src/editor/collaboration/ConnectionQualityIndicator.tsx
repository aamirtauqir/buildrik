/**
 * ConnectionQualityIndicator Component
 * Shows connection quality (latency/ping) in collaboration mode
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ConnectionQuality, ConnectionQualityStats } from "../../shared/types/collaboration";

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionQualityIndicatorProps {
  /** Connection quality stats from OTEngine */
  stats: ConnectionQualityStats;
  /** Whether collaboration is active */
  isConnected: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 4,
    backgroundColor: "var(--aqb-bg-panel-secondary)",
    cursor: "default",
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  label: {
    color: "var(--aqb-text-muted)",
    whiteSpace: "nowrap",
  },
  syncing: {
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

// Color mapping for quality levels
const QUALITY_COLORS: Record<ConnectionQuality, string> = {
  excellent: "#4ade80", // green
  good: "#facc15", // yellow
  poor: "#f87171", // red
  disconnected: "#9ca3af", // gray
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  stats,
  isConnected,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Don't render if not connected
  if (!isConnected) {
    return null;
  }

  const { avgLatency, pendingCount, quality } = stats;
  const isSyncing = pendingCount > 0;
  const color = QUALITY_COLORS[quality];

  // Build tooltip text
  let tooltip = "";
  if (quality === "disconnected") {
    tooltip = "Connection lost";
  } else {
    tooltip = `Latency: ${avgLatency}ms`;
    if (pendingCount > 0) {
      tooltip += ` | ${pendingCount} pending`;
    }
  }

  const dotStyle: React.CSSProperties = {
    ...styles.dot,
    backgroundColor: color,
    ...(isSyncing ? styles.syncing : {}),
  };

  return (
    <div
      style={styles.container}
      title={tooltip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={dotStyle} />
      {isHovered && (
        <span style={styles.label}>
          {quality === "disconnected" ? "Offline" : `${avgLatency}ms`}
        </span>
      )}
    </div>
  );
};

export default ConnectionQualityIndicator;
