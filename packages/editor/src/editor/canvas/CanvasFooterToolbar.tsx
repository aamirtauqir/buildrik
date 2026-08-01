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
import { useClickOutside } from "@/shared/hooks";
import { BreakpointSwitcher, Button, Tooltip, type Breakpoint } from "@/editor/chrome-ui";
import { ZOOM_PRESETS } from "./shared";
import { ROW_SM } from "@/shared/constants/layout";
// Undo/redo/device switching moved OFF the topbar and onto this canvas toolbar
// (Figma contract §2: viewport + edit controls belong to the canvas, the topbar
// stays minimal). Device values are the BreakpointSwitcher's 4-way union.
export type FooterDevice = Breakpoint;

// ============================================
// Types
// ============================================

export interface CanvasOverlayState {
  guides: boolean;
  spacing: boolean;
  grid: boolean;
  rulers: boolean;
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

  // ── Edit + viewport controls (moved off the topbar) ──────────────────────
  /** Current device/breakpoint. When provided, the device switcher renders. */
  device?: FooterDevice;
  /** Change the active device/breakpoint. */
  onDeviceChange?: (device: FooterDevice) => void;
  /** Whether an undo step is available. When onUndo is provided, undo renders. */
  canUndo?: boolean;
  /** Whether a redo step is available. */
  canRedo?: boolean;
  /** Perform undo. */
  onUndo?: () => void;
  /** Perform redo. */
  onRedo?: () => void;
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

const RulersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3h4v18H3zM3 3h18v4H3z" strokeLinejoin="round" />
    <path d="M3 8h2M3 12h2M3 16h2M8 3v2M12 3v2M16 3v2" strokeLinecap="round" />
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

const UndoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);

const editBtnStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: ROW_SM,
  height: ROW_SM,
  padding: 0,
  color: "var(--bk-ink-soft)",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: "var(--bk-radius-sm)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

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
  <Tooltip
    content={shortcut ? `${label} · ${shortcut}` : label}
    placement="bottom"
    arrow={false}
    className="tw:max-w-[280px] tw:whitespace-normal"
  >
    <Button
      type="button"
      color="light"
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
        color: active ? "var(--bk-ink)" : "var(--bk-ink-soft)",
        background: active ? "var(--bk-bg-subtle)" : "transparent",
        border: active ? "1px solid var(--bk-accent)" : "1px solid transparent",
        borderRadius: "var(--bk-radius-sm)",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ display: "flex", opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
      {active && <span style={{ marginLeft: "2px", color: "var(--bk-accent-text)" }}>✓</span>}
    </Button>
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
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
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

  useClickOutside(presetsRef, () => setShowPresets(false), { enabled: showPresets });

  const showEditGroup = Boolean(onUndo || onRedo || (device && onDeviceChange));

  return (
    <div style={containerStyles}>
      {/* Edit + viewport group — undo/redo + device switcher (moved off topbar) */}
      {showEditGroup && (
        <>
          <div style={overlaysGroupStyles}>
            {onUndo && (
              <Tooltip content="Undo · ⌘Z" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
                <Button
                  type="button"
                  color="light"
                  className="canvas-footer-btn tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                  onClick={onUndo}
                  disabled={canUndo === false}
                  aria-label="Undo"
                  style={editBtnStyles}
                >
                  <UndoIcon />
                </Button>
              </Tooltip>
            )}
            {onRedo && (
              <Tooltip content="Redo · ⌘⇧Z" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
                <Button
                  type="button"
                  color="light"
                  className="canvas-footer-btn tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                  onClick={onRedo}
                  disabled={canRedo === false}
                  aria-label="Redo"
                  style={editBtnStyles}
                >
                  <RedoIcon />
                </Button>
              </Tooltip>
            )}
            {device && onDeviceChange && (
              <BreakpointSwitcher
                value={device}
                onChange={onDeviceChange}
                includeWide
                aria-label="Device breakpoint"
              />
            )}
          </div>
          <div style={dividerStyles} />
        </>
      )}
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
          icon={<RulersIcon />}
          label="Rulers"
          active={overlays.rulers}
          onClick={() => onOverlayChange("rulers", !overlays.rulers)}
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
        <Button
          type="button"
          color="light"
          style={zoomBtnStyles}
          onClick={handleZoomOut}
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_PRESETS[0]} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          −
        </Button>

        {/* % display — click to open preset dropdown */}
        <Button
          type="button"
          color="light"
          style={zoomPctStyles}
          onClick={() => setShowPresets((v) => !v)}
          aria-label="Zoom presets"
          title="Click for zoom presets" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          {Math.round(zoom)}%
        </Button>

        <Button
          type="button"
          color="light"
          style={zoomBtnStyles}
          onClick={handleZoomIn}
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          +
        </Button>

        {/* Preset dropdown */}
        {showPresets && (
          <div style={presetsDropdownStyles}>
            {ZOOM_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                color="light"
                onClick={() => {
                  onZoomChange(preset);
                  setShowPresets(false);
                }}
                style={{
                  ...presetItemStyles,
                  background: Math.round(zoom) === preset ? "var(--bk-bg-subtle)" : "transparent",
                  color:
                    Math.round(zoom) === preset
                      ? "var(--bk-ink)"
                      : "var(--bk-ink-soft)",
                }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
              >
                {preset}%
              </Button>
            ))}
            {onFitToScreen && (
              <>
                <div style={presetDividerStyles} />
                <Button
                  type="button"
                  color="light"
                  onClick={() => {
                    onFitToScreen();
                    setShowPresets(false);
                  }}
                  style={presetItemStyles} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                >
                  Fit to screen
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {/* Help Button */}
      {onHelpClick && (
        <>
          <div style={dividerStyles} />
          <Tooltip content="Keyboard shortcuts · ?" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              type="button"
              color="light"
              style={{ ...zoomBtnStyles, width: ROW_SM, height: ROW_SM }}
              onClick={onHelpClick}
              aria-label="Show keyboard shortcuts (press ? key)" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              <HelpIcon />
            </Button>
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
  padding: "8px 16px",        /* PRD §10.7: 8px padding */
  height: "40px",
  // was --buildrick-surface-3, which is defined nowhere: the floating bar
  // rendered with NO fill, so canvas content showed straight through a
  // toolbar that is supposed to sit above it.
  background: "var(--bk-bg-card)",
  border: "1px solid var(--bk-border)",        /* PRD §10.7: all-sides border */
  borderRadius: "var(--bk-radius-lg)",         /* PRD §10.7: lg corner radius */
  // 30%-black was a dark-theme weight; the light chrome uses the shadow scale.
  boxShadow: "var(--bk-shadow-drag)",
  whiteSpace: "nowrap" as const,
  // The bar is centred over the canvas column, which narrows when the
  // inspector opens. Without these the row kept its intrinsic width and ran
  // ~276px under the inspector at 1440. Now it stays inside the column and
  // scrolls instead of hiding controls behind another panel.
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
};

const overlaysGroupStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const dividerStyles: React.CSSProperties = {
  width: "1px",
  height: "20px",
  background: "var(--bk-border)",
  margin: "0 4px",
};

const zoomGroupStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  background: "var(--bk-bg-subtle)",
  borderRadius: "var(--bk-radius-sm)",
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
  color: "var(--bk-ink-soft)",
  background: "transparent",
  border: "none",
  borderRadius: "var(--bk-radius-sm)",
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
  color: "var(--bk-ink)",
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
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: "var(--bk-radius-lg)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
  zIndex: 500,
  minWidth: "100px",
};

const presetItemStyles: React.CSSProperties = {
  padding: "5px 12px",
  border: "none",
  borderRadius: "var(--bk-radius-sm)",
  color: "var(--bk-ink-soft)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "right",
  background: "transparent",
  transition: "background 0.1s",
};

const presetDividerStyles: React.CSSProperties = {
  height: "1px",
  background: "var(--bk-border)",
  margin: "4px 0",
};

export default CanvasFooterToolbar;
