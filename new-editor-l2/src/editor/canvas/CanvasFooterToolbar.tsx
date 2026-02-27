/**
 * CanvasFooterToolbar - Canvas Overlays & Zoom Controls
 * Bottom toolbar for canvas overlay toggles and zoom controls (IA Redesign 2026)
 *
 * CONTROLS:
 * - Overlay toggles: Guides, Spacing, Grid, Badges, X-Ray
 * - Zoom controls: [-] 100% [+]
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │  [📐 Guides ✓] [📏 Spacing ✓] [⊞ Grid] [🏷️ Badges] [🔍 X-Ray]  │  [−] 100% [+]   │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tooltip } from "../../shared/ui/Tooltip";
import { ZOOM_PRESETS } from "./shared";

// ============================================
// Types
// ============================================

export interface CanvasOverlayState {
  guides: boolean;
  spacing: boolean;
  grid: boolean;
  badges: boolean;
  xray: boolean;
}

export interface CanvasFooterToolbarProps {
  /** Current overlay states */
  overlays: CanvasOverlayState;
  /** Current zoom level (25-200) */
  zoom: number;
  /** Callback when overlay toggle changes */
  onOverlayChange: (overlay: keyof CanvasOverlayState, enabled: boolean) => void;
  /** Callback when zoom changes */
  onZoomChange: (zoom: number) => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Fit canvas to visible viewport */
  onFitToScreen?: () => void;
}

// ============================================
// Icons (inline SVG for self-containment)
// ============================================

const GuidesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3v18M8 3v18M3 8h18M3 16h18" strokeLinecap="round" />
  </svg>
);

const SpacingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 6H3M21 18H3M6 21V3M18 21V3" strokeLinecap="round" />
  </svg>
);

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

const BadgesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7h2M3 12h2M3 17h2M9 7h12M9 12h8M9 17h10" strokeLinecap="round" />
  </svg>
);

const XRayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M2 12h7M15 12h7M12 2v7M12 15v7" strokeLinecap="round" />
  </svg>
);

const HelpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
    <path d="M12 17h.01" strokeLinecap="round" />
  </svg>
);

// ============================================
// Overlay Button Component
// ============================================

interface OverlayButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
}

const OverlayButton: React.FC<OverlayButtonProps> = ({
  icon,
  label,
  shortcut,
  active,
  onClick,
}) => (
  <Tooltip content={label} shortcut={shortcut}>
    <button
      type="button"
      className={`canvas-footer-btn ${active ? "canvas-footer-btn--active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        height: "28px",
        fontSize: "11px",
        fontWeight: 500,
        color: active ? "var(--aqb-text-primary)" : "var(--aqb-text-secondary)",
        background: active ? "var(--aqb-surface-3)" : "transparent",
        border: active ? "1px solid var(--aqb-border-active)" : "1px solid transparent",
        borderRadius: "var(--aqb-radius-sm)",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ display: "flex", opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
      {active && <span style={{ marginLeft: "2px", color: "var(--aqb-accent-primary)" }}>✓</span>}
    </button>
  </Tooltip>
);

// ============================================
// Main Component
// ============================================

export const CanvasFooterToolbar: React.FC<CanvasFooterToolbarProps> = ({
  overlays,
  zoom,
  onOverlayChange,
  onZoomChange,
  onHelpClick,
  onFitToScreen,
}) => {
  const [showPresets, setShowPresets] = React.useState(false);
  const presetsRef = React.useRef<HTMLDivElement>(null);

  // Snap to next/prev preset instead of raw ±10 steps
  const handleZoomIn = React.useCallback(() => {
    const next = ZOOM_PRESETS.find((p) => p > zoom) ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
    onZoomChange(next);
  }, [zoom, onZoomChange]);

  const handleZoomOut = React.useCallback(() => {
    const prev = [...ZOOM_PRESETS].reverse().find((p) => p < zoom) ?? ZOOM_PRESETS[0];
    onZoomChange(prev);
  }, [zoom, onZoomChange]);

  // Close preset dropdown on outside click
  React.useEffect(() => {
    if (!showPresets) return;
    const handleOutside = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showPresets]);

  return (
    <div style={containerStyles}>
      {/* Overlay Toggles */}
      <div style={overlaysGroupStyles}>
        <OverlayButton
          icon={<GuidesIcon />}
          label="Snap Guides"
          active={overlays.guides}
          onClick={() => onOverlayChange("guides", !overlays.guides)}
        />
        <OverlayButton
          icon={<SpacingIcon />}
          label="Spacing"
          active={overlays.spacing}
          onClick={() => onOverlayChange("spacing", !overlays.spacing)}
        />
        <OverlayButton
          icon={<GridIcon />}
          label="Grid"
          active={overlays.grid}
          onClick={() => onOverlayChange("grid", !overlays.grid)}
        />
        <OverlayButton
          icon={<BadgesIcon />}
          label="Badges"
          active={overlays.badges}
          onClick={() => onOverlayChange("badges", !overlays.badges)}
        />
        <OverlayButton
          icon={<XRayIcon />}
          label="X-Ray"
          active={overlays.xray}
          onClick={() => onOverlayChange("xray", !overlays.xray)}
        />
      </div>

      {/* Divider */}
      <div style={dividerStyles} />

      {/* Zoom Controls */}
      <div style={{ ...zoomGroupStyles, position: "relative" }} ref={presetsRef}>
        <button
          type="button"
          style={zoomBtnStyles}
          onClick={handleZoomOut}
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_PRESETS[0]}
        >
          −
        </button>

        {/* % display — click to open preset dropdown */}
        <button
          type="button"
          style={zoomPctStyles}
          onClick={() => setShowPresets((v) => !v)}
          aria-label="Zoom presets"
          title="Click for zoom presets"
        >
          {Math.round(zoom)}%
        </button>

        <button
          type="button"
          style={zoomBtnStyles}
          onClick={handleZoomIn}
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
        >
          +
        </button>

        {/* Preset dropdown */}
        {showPresets && (
          <div style={presetsDropdownStyles}>
            {ZOOM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => { onZoomChange(preset); setShowPresets(false); }}
                style={{
                  ...presetItemStyles,
                  background: Math.round(zoom) === preset ? "var(--aqb-surface-3)" : "transparent",
                  color: Math.round(zoom) === preset ? "var(--aqb-text-primary)" : "var(--aqb-text-secondary)",
                }}
              >
                {preset}%
              </button>
            ))}
            {onFitToScreen && (
              <>
                <div style={presetDividerStyles} />
                <button
                  type="button"
                  onClick={() => { onFitToScreen(); setShowPresets(false); }}
                  style={presetItemStyles}
                >
                  Fit to screen
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Help Button */}
      {onHelpClick && (
        <>
          <div style={dividerStyles} />
          <Tooltip content="Keyboard shortcuts" shortcut="?">
            <button
              type="button"
              style={{ ...zoomBtnStyles, width: "28px", height: "28px" }}
              onClick={onHelpClick}
              aria-label="Show keyboard shortcuts (press ? key)"
            >
              <HelpIcon />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  padding: "6px 16px",
  height: "40px",
  background: "var(--aqb-surface-1)",
  borderTop: "1px solid var(--aqb-border)",
  borderRadius: "0 0 var(--aqb-radius-lg) var(--aqb-radius-lg)",
};

const overlaysGroupStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const dividerStyles: React.CSSProperties = {
  width: "1px",
  height: "20px",
  background: "var(--aqb-border)",
  margin: "0 4px",
};

const zoomGroupStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  background: "var(--aqb-surface-2)",
  borderRadius: "var(--aqb-radius-sm)",
  padding: "2px",
};

const zoomBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--aqb-text-secondary)",
  background: "transparent",
  border: "none",
  borderRadius: "var(--aqb-radius-sm)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const zoomPctStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "48px",
  height: "24px",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const presetsDropdownStyles: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 6px)",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  padding: "4px",
  background: "var(--aqb-surface-2)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-md)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
  zIndex: 500,
  minWidth: "100px",
};

const presetItemStyles: React.CSSProperties = {
  padding: "5px 12px",
  border: "none",
  borderRadius: "var(--aqb-radius-sm)",
  color: "var(--aqb-text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "right",
  background: "transparent",
  transition: "background 0.1s",
};

const presetDividerStyles: React.CSSProperties = {
  height: "1px",
  background: "var(--aqb-border)",
  margin: "4px 0",
};

export default CanvasFooterToolbar;
