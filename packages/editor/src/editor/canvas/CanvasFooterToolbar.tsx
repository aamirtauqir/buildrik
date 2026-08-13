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
import { BreakpointSwitcher, Button, POPOVER_BASE_CLASS, Tooltip, type Breakpoint } from "@/editor/chrome-ui";
import { ZOOM_PRESETS } from "./shared";
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

/** Square icon control in the bar — undo/redo/help all share this box. */
const EDIT_BTN =
  "tw:inline-flex tw:items-center tw:justify-center tw:size-7 tw:p-0 tw:rounded " +
  "tw:border tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] " +
  "tw:hover:bg-gray-100 tw:hover:text-gray-900";

/** The floating bar itself. maxWidth/minWidth/overflow keep it inside the
 *  canvas column when the inspector opens — without them it ran ~276px under
 *  the inspector at 1440 and hid controls behind another panel. */
const BAR =
  "tw:flex tw:items-center tw:justify-center tw:gap-3 tw:h-10 tw:px-4 tw:py-2 tw:rounded-lg " +
  "tw:border tw:border-gray-200 tw:bg-white tw:[box-shadow:var(--bk-shadow-drag)] " +
  "tw:whitespace-nowrap tw:max-w-full tw:min-w-0 tw:overflow-x-auto";
const GROUP = "tw:flex tw:items-center tw:gap-1";
const DIVIDER = "tw:w-px tw:h-5 tw:mx-1 tw:bg-gray-200";
const ZOOM_GROUP = "tw:flex tw:items-center tw:gap-0.5 tw:p-0.5 tw:rounded tw:bg-[var(--bk-bg-subtle)]";
const ZOOM_BTN =
  "tw:flex tw:items-center tw:justify-center tw:size-6 tw:p-0 tw:rounded tw:border-0 " +
  "tw:bg-transparent tw:text-sm tw:font-medium tw:text-[var(--bk-ink-soft)] " +
  "tw:hover:bg-gray-100 tw:hover:text-gray-900";
const ZOOM_PCT =
  "tw:flex tw:items-center tw:justify-center tw:min-w-12 tw:h-6 tw:p-0 tw:border-0 " +
  "tw:bg-transparent tw:text-[11px] tw:font-semibold tw:text-gray-900";
const PRESET_ITEM =
  "tw:w-full tw:px-3 tw:py-[5px] tw:rounded tw:border-0 tw:text-xs tw:font-medium tw:text-right";
const PRESET_ROW =
  "tw:w-full tw:px-3 tw:py-[5px] tw:rounded tw:border-0 tw:text-xs tw:font-medium " +
  "tw:flex tw:items-center tw:justify-between tw:gap-4";
const PRESET_KEY = "tw:text-[10px] tw:text-[var(--bk-gray-400)]";
const PRESET_DIVIDER = "tw:h-px tw:my-1 tw:bg-gray-200";

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
      className={`tw:inline-flex tw:items-center tw:gap-1 tw:h-7 tw:px-2 tw:py-1 tw:rounded tw:border tw:text-[11px] tw:font-medium ${
        active
          ? "tw:border-blue-700 tw:bg-[var(--bk-bg-subtle)] tw:text-gray-900"
          : "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100"
      }`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
    >
      <span className={active ? "tw:flex" : "tw:flex tw:opacity-70"}>{icon}</span>
      <span>{label}</span>
      {active && <span className="tw:ml-0.5 tw:text-blue-700">✓</span>}
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
    <div className={BAR}>
      {/* Edit + viewport group — undo/redo + device switcher (moved off topbar) */}
      {showEditGroup && (
        <>
          <div className={GROUP}>
            {onUndo && (
              <Tooltip content="Undo · ⌘Z" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
                <Button
                  type="button"
                  color="light"
                  className={EDIT_BTN}
                  onClick={onUndo}
                  disabled={canUndo === false}
                  aria-label="Undo"
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
                  className={EDIT_BTN}
                  onClick={onRedo}
                  disabled={canRedo === false}
                  aria-label="Redo"
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
                // Conformance anchor at the CALL SITE, not inside the component.
                // BreakpointSwitcher is a generic chrome-ui primitive; if a
                // second one ever appears (a settings panel, say) an anchor
                // baked into the component would match both and Playwright
                // throws on an ambiguous locator. The composition site knows
                // which instance this is.
                data-testid="breakpoint-switcher"
              />
            )}
          </div>
          <div className={DIVIDER} />
        </>
      )}
      {/* Overlay Toggles */}
      <div className={GROUP}>
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
      <div className={DIVIDER} />
      {/* Zoom Controls */}
      <div className={`${ZOOM_GROUP} tw:relative`} ref={presetsRef}>
        <Button
          type="button"
          color="light"
          className={ZOOM_BTN}
          onClick={handleZoomOut}
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_PRESETS[0]}
        >
          −
        </Button>

        {/* % display — click to open preset dropdown */}
        <Button
          type="button"
          color="light"
          className={ZOOM_PCT}
          onClick={() => setShowPresets((v) => !v)}
          aria-label="Zoom presets"
          title="Click for zoom presets"
        >
          {Math.round(zoom)}%
        </Button>

        <Button
          type="button"
          color="light"
          className={ZOOM_BTN}
          onClick={handleZoomIn}
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
        >
          +
        </Button>

        {/* Preset dropdown */}
        {showPresets && (
          <div className={`${POPOVER_BASE_CLASS} tw:flex tw:flex-col tw:bottom-[calc(100%+6px)] tw:left-1/2 tw:-translate-x-1/2 tw:min-w-45 tw:p-1`}>
            {/* Board 817:4723 opens the flyout with the actions, then the
                preset list under a divider. */}
            {onFitToScreen && (
              <Button
                type="button"
                color="light"
                onClick={() => {
                  onFitToScreen();
                  setShowPresets(false);
                }}
                className={`${PRESET_ROW} tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100`}
              >
                <span>Zoom to fit</span>
                <span className={PRESET_KEY}>⌘0</span>
              </Button>
            )}
            <Button
              type="button"
              color="light"
              onClick={() => {
                onZoomChange(100);
                setShowPresets(false);
              }}
              className={`${PRESET_ROW} tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100`}
            >
              <span>Zoom to 100%</span>
            </Button>
            <div className={PRESET_DIVIDER} />
            {ZOOM_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                color="light"
                onClick={() => {
                  onZoomChange(preset);
                  setShowPresets(false);
                }}
                className={`${PRESET_ITEM} ${
                  Math.round(zoom) === preset
                    ? "tw:bg-[var(--bk-bg-subtle)] tw:text-gray-900"
                    : "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100"
                }`}
              >
                {preset}%
              </Button>
            ))}
          </div>
        )}
      </div>
      {/* Help Button */}
      {onHelpClick && (
        <>
          <div className={DIVIDER} />
          <Tooltip content="Keyboard shortcuts · ?" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              type="button"
              color="light"
              className={EDIT_BTN}
              onClick={onHelpClick}
              aria-label="Show keyboard shortcuts (press ? key)"
            >
              <HelpIcon />
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default CanvasFooterToolbar;
