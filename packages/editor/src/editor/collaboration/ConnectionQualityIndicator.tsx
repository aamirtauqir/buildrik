/**
 * ConnectionQualityIndicator Component
 * Shows connection quality as a 3-bar signal indicator with quality level
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ConnectionQualityStats } from "../../shared/types/collaboration";

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionQualityIndicatorProps {
  /** Connection quality stats from OTEngine */
  stats: ConnectionQualityStats;
  /** Whether collaboration is active */
  isConnected: boolean;
}

/**
 * Simplified 4-level quality derived from the engine's ConnectionQuality.
 * Engine levels: "excellent" | "good" | "poor" | "disconnected"
 * We map: excellent → good, good → fair, poor → poor, disconnected → disconnected
 */
type DisplayQuality = "good" | "fair" | "poor" | "disconnected";

// ============================================================================
// CONSTANTS — signal bar heights (ascending left-to-right)
// ============================================================================

const BAR_HEIGHTS = [6, 9, 12] as const;
const BAR_WIDTH = 3;
const BAR_GAP = 2;

// ============================================================================
// QUALITY CONFIG
// ============================================================================

interface QualityConfig {
  /** Number of bars that should be filled (1–3) */
  filledBars: number;
  /** CSS token for active bar colour */
  barColor: string;
  /** CSS token for pill background */
  bgColor: string;
}

const QUALITY_CONFIG: Record<DisplayQuality, QualityConfig> = {
  good: {
    filledBars: 3,
    barColor: "var(--aqb-success)",
    bgColor: "var(--aqb-success-light)",
  },
  fair: {
    filledBars: 2,
    barColor: "var(--aqb-warning)",
    bgColor: "var(--aqb-warning-light)",
  },
  poor: {
    filledBars: 1,
    barColor: "var(--aqb-error)",
    bgColor: "var(--aqb-error-light)",
  },
  disconnected: {
    filledBars: 0,
    barColor: "var(--aqb-text-disabled, var(--aqb-text-muted))",
    bgColor: "var(--aqb-surface-3)",
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map the engine's ConnectionQuality to the display quality we render.
 * Also incorporates latency thresholds from the PRD spec:
 *   < 100ms or connected  → good
 *   100–300ms or degraded → fair
 *   > 300ms or reconnecting → poor
 */
function toDisplayQuality(stats: ConnectionQualityStats, isConnected: boolean): DisplayQuality {
  if (!isConnected) return "disconnected";

  const { quality, avgLatency } = stats;

  if (quality === "disconnected") return "disconnected";

  // Latency-based override takes precedence over the engine label so the UI
  // reflects real-time conditions.
  if (avgLatency > 300) return "poor";
  if (avgLatency > 100) return "fair";

  // Engine label fallback
  if (quality === "excellent" || quality === "good") return "good";
  if (quality === "poor") return "poor";

  return "good";
}

function buildTooltip(stats: ConnectionQualityStats, isConnected: boolean): string {
  if (!isConnected) return "Offline";
  if (stats.quality === "disconnected") return "Reconnecting...";
  const base = `Connected · ${stats.avgLatency}ms`;
  return stats.pendingCount > 0 ? `${base} · ${stats.pendingCount} pending` : base;
}

// ============================================================================
// SIGNAL BARS
// ============================================================================

interface SignalBarsProps {
  filledBars: number;
  activeColor: string;
}

const SignalBars: React.FC<SignalBarsProps> = ({ filledBars, activeColor }) => {
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: BAR_GAP,
    height: BAR_HEIGHTS[2],
    flexShrink: 0,
  };

  return (
    <div style={wrapperStyle}>
      {BAR_HEIGHTS.map((h, idx) => {
        const isFilled = idx < filledBars;
        const barStyle: React.CSSProperties = {
          width: BAR_WIDTH,
          height: h,
          borderRadius: 1,
          backgroundColor: isFilled
            ? activeColor
            : "var(--aqb-border, rgba(255,255,255,0.15))",
          flexShrink: 0,
        };
        return <div key={idx} style={barStyle} />;
      })}
    </div>
  );
};

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
    backgroundColor: "var(--aqb-surface-4)",
    color: "var(--aqb-text-primary)",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: "var(--aqb-radius-sm)",
    boxShadow: "var(--aqb-shadow-md)",
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
// COMPONENT
// ============================================================================

/**
 * Default stats used in demo / disconnected mode so the component renders
 * a visible (greyed-out) pill rather than returning null.
 */
const DEMO_STATS: ConnectionQualityStats = {
  avgLatency: 0,
  pendingCount: 0,
  lastAckTime: 0,
  quality: "disconnected",
};

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  stats,
  isConnected,
}) => {
  // Always render — show "disconnected" pill in demo/offline mode.
  const effectiveStats: ConnectionQualityStats = stats ?? DEMO_STATS;
  const displayQuality = toDisplayQuality(effectiveStats, isConnected);
  const config = QUALITY_CONFIG[displayQuality];
  const tooltipText = buildTooltip(effectiveStats, isConnected);

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 24,
    padding: "0 8px",
    borderRadius: "var(--aqb-radius-xl, 999px)",
    backgroundColor: config.bgColor,
    cursor: "default",
    flexShrink: 0,
  };

  const offlineTextStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "var(--aqb-text-muted)",
    lineHeight: 1,
  };

  return (
    <Tooltip label={tooltipText}>
      <div style={pillStyle}>
        <SignalBars filledBars={config.filledBars} activeColor={config.barColor} />
        {displayQuality === "disconnected" && (
          <span style={offlineTextStyle}>Offline</span>
        )}
      </div>
    </Tooltip>
  );
};

export default ConnectionQualityIndicator;
