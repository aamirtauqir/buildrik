/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * DeviceFramePreview
 * CSS-only device frame mockup (iPhone / Android) that wraps the canvas content.
 * Toggle via a small device icon button rendered by the parent.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import type { DeviceType } from "../../shared/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeviceFramePreviewProps {
  /** Current device mode */
  device: DeviceType;
  /** Whether the device frame is active */
  active: boolean;
  /** Canvas content element rendered inside the frame */
  children: React.ReactNode;
}

// ─── Frame Dimensions ───────────────────────────────────────────────────────

interface FrameSpec {
  /** Outer width including bezels */
  outerWidth: number;
  /** Outer height including bezels */
  outerHeight: number;
  /** Screen width */
  screenWidth: number;
  /** Screen height */
  screenHeight: number;
  /** Bezel top (includes notch/status bar area) */
  bezelTop: number;
  /** Bezel bottom (includes home indicator area) */
  bezelBottom: number;
  /** Bezel sides */
  bezelSide: number;
  /** Corner radius of outer shell */
  outerRadius: number;
  /** Corner radius of screen */
  screenRadius: number;
  /** Whether to show notch */
  hasNotch: boolean;
  /** Whether to show home indicator */
  hasHomeIndicator: boolean;
}

const FRAME_SPECS: Partial<Record<DeviceType, FrameSpec>> = {
  mobile: {
    outerWidth: 405,
    outerHeight: 862,
    screenWidth: 375,
    screenHeight: 812,
    bezelTop: 30,
    bezelBottom: 20,
    bezelSide: 15,
    outerRadius: 44,
    screenRadius: 38,
    hasNotch: true,
    hasHomeIndicator: true,
  },
  tablet: {
    outerWidth: 800,
    outerHeight: 1064,
    screenWidth: 768,
    screenHeight: 1024,
    bezelTop: 24,
    bezelBottom: 16,
    bezelSide: 16,
    outerRadius: 24,
    screenRadius: 16,
    hasNotch: false,
    hasHomeIndicator: false,
  },
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const shellStyle = (spec: FrameSpec): React.CSSProperties => ({
  position: "relative",
  width: spec.outerWidth,
  height: spec.outerHeight,
  background: "var(--bk-ink)",
  borderRadius: spec.outerRadius,
  boxShadow:
    "var(--bk-shadow-overlay), 0 0 0 1px rgba(255,255,255,0.06) inset",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: `${spec.bezelTop}px ${spec.bezelSide}px ${spec.bezelBottom}px`,
  transition: "opacity 0.25s ease",
});

const screenStyle = (spec: FrameSpec): React.CSSProperties => ({
  width: spec.screenWidth,
  height: spec.screenHeight,
  borderRadius: spec.screenRadius,
  overflow: "auto",
  background: "var(--bk-bg-card)",
  position: "relative",
});

const notchStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: "50%",
  transform: "translateX(-50%)",
  width: 150,
  height: 28,
  background: "var(--bk-ink)",
  borderRadius: "0 0 18px 18px",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const notchCameraStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "var(--bk-radius-full)",
  background: "#2a2a2e",
  border: "1.5px solid #3a3a3e",
};

const homeIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 6,
  left: "50%",
  transform: "translateX(-50%)",
  width: 134,
  height: 5,
  borderRadius: 3,
  background: "rgba(255,255,255,0.25)",
};

const sideButtonStyle = (top: number, height: number, side: "left" | "right"): React.CSSProperties => ({
  position: "absolute",
  top,
  [side]: -2,
  width: 3,
  height,
  background: "#2a2a2a",
  borderRadius: side === "left" ? "2px 0 0 2px" : "0 2px 2px 0",
});

// ─── Component ──────────────────────────────────────────────────────────────

export function DeviceFramePreview({
  device,
  active,
  children,
}: DeviceFramePreviewProps) {
  const spec = FRAME_SPECS[device];

  // Only wrap mobile/tablet; desktop & watch pass children through
  if (!active || !spec) {
    return <>{children}</>;
  }

  return (
    <div style={shellStyle(spec)}>
      {/* Side buttons */}
      {device === "mobile" && (
        <>
          {/* Volume buttons (left) */}
          <div style={sideButtonStyle(120, 28, "left")} />
          <div style={sideButtonStyle(160, 28, "left")} />
          {/* Silent switch (left) */}
          <div style={sideButtonStyle(80, 18, "left")} />
          {/* Power button (right) */}
          <div style={sideButtonStyle(120, 48, "right")} />
        </>
      )}

      {/* Notch */}
      {spec.hasNotch && (
        <div style={notchStyle}>
          <div style={notchCameraStyle} />
        </div>
      )}

      {/* Screen area */}
      <div style={screenStyle(spec)}>{children}</div>

      {/* Home indicator */}
      {spec.hasHomeIndicator && <div style={homeIndicatorStyle} />}
    </div>
  );
}

// ─── Toggle Button ──────────────────────────────────────────────────────────

export interface DeviceFrameToggleProps {
  active: boolean;
  onToggle: () => void;
  device: DeviceType;
}

const toggleBaseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  transition: "all 0.15s ease",
  padding: 0,
};

/**
 * Small device icon button for toggling the frame preview.
 * Render this inside the canvas footer toolbar area.
 */
export function DeviceFrameToggle({ active, onToggle, device }: DeviceFrameToggleProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Only show toggle for mobile/tablet (frame exists for those)
  if (device === "desktop" || device === "watch") {
    return null;
  }

  const style: React.CSSProperties = {
    ...toggleBaseStyle,
    background: active
      ? "var(--bk-accent-tint)"
      : isHovered
        ? "rgba(255,255,255,0.08)"
        : "transparent",
    color: active ? "var(--bk-accent)" : "#a1a1aa",
  };

  return (
    <Button
      type="button"
      aria-label={active ? "Hide device frame" : "Show device frame"}
      aria-pressed={active}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
      title={active ? "Hide device frame" : "Show device frame"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {device === "mobile" ? (
          <>
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </>
        ) : (
          <>
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </>
        )}
      </svg>
    </Button>
  );
}
