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
import { BreakpointSwitcher, Button, isModalOpen, Tooltip, type Breakpoint } from "@/editor/chrome-ui";
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
  /** Board 817:4723 — fit the SELECTED element, not the page. */
  onZoomToSelection?: () => void;

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

/* The six overlay glyphs that used to sit in this block are gone with the
   icon-only toggles — board 199:205 labels them in words. Recover from git
   history if a future surface needs them. */

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
 *  the inspector at 1440 and hid controls behind another panel.
 *
 *  `justify-start`, NOT `justify-center`: a centred flex row that overflows
 *  spills equally off BOTH ends, and the spill off the start cannot be
 *  scrolled back to — scrollLeft has no negative side. Measured at 1440 with a
 *  drawer open: bar 758px, content 855px, and undo, redo and the Wide device
 *  button sat at x=300..367 against a bar starting at x=380. They rendered,
 *  they were focusable, and no pointer could ever reach them. Anchored at the
 *  start, the overflow goes to the end, where the scroll can follow it — which
 *  is also how board 199:205 draws the bar with a drawer open. */
const BAR =
  "tw:flex tw:items-center tw:justify-start tw:gap-3 tw:h-10 tw:px-4 tw:py-2 tw:rounded-lg " +
  "tw:border tw:border-gray-200 tw:bg-white tw:[box-shadow:var(--bk-shadow-drag)] " +
  "tw:whitespace-nowrap tw:max-w-full tw:min-w-0 tw:overflow-x-auto";
const GROUP = "tw:flex tw:items-center tw:gap-1";
const DIVIDER = "tw:w-px tw:h-5 tw:mx-1 tw:bg-gray-200";

// ============================================
// Overlay Button Component
// ============================================

interface OverlayButtonProps {
  label: string;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
}

const OverlayButton: React.FC<OverlayButtonProps> = ({
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
    {/* Board 199:205 draws these as WORDS, not icons: "Snap Guides · Spacing ·
        Grid · Rulers · Badges · X-Ray", the active one in a grey pill with the
        text gone semibold — no border, no tick. They were icon-only because the
        bar also carried the zoom group and overflowed under the inspector; board
        817:4723 puts zoom in the footer's bottom-right corner instead, and with
        it gone the words fit the canvas column's 760px with room to spare. */}
    <Button
      type="button"
      color="light"
      className={`tw:inline-flex tw:items-center tw:h-7 tw:px-2.5 tw:py-1 tw:rounded tw:border tw:border-transparent tw:text-[11px] tw:whitespace-nowrap ${
        active
          ? "tw:bg-[var(--bk-bg-subtle)] tw:text-gray-900 tw:font-semibold"
          : "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:font-medium tw:hover:bg-gray-100"
      }`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
    >
      {label}
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
  onZoomToSelection,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  /* Board 817:4649 prints a chord against every toggle, and none of them was
     bound — the hints on this bar were the only place they existed. The
     handler lives here rather than in the shell's shortcut hook because this
     component already owns the toggles' state and callback.

     ⌘R (Rulers) is one of them, and it is the browser's reload. Taken anyway,
     because a chord printed on a control and not honoured is the worse of the
     two failures — and only the PLAIN chord is taken, so ⌘⇧R (hard reload) and
     F5 both still reload the editor. */
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen()) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (!(e.metaKey || e.ctrlKey)) return;

      const key = e.key.toLowerCase();

      /* Board 817:4723's own rows: fit, selection, 100%, in, out. Printed on
         the flyout and bound nowhere until now. */
      if (key === "1" && onFitToScreen) {
        e.preventDefault();
        onFitToScreen();
        return;
      }
      if (key === "2" && onZoomToSelection) {
        e.preventDefault();
        onZoomToSelection();
        return;
      }
      if (key === "0") {
        e.preventDefault();
        onZoomChange(100);
        return;
      }
      if (key === "=" || key === "+") {
        e.preventDefault();
        onZoomChange(ZOOM_PRESETS.find((p) => p > zoom) ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1]);
        return;
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        onZoomChange([...ZOOM_PRESETS].reverse().find((p) => p < zoom) ?? ZOOM_PRESETS[0]);
        return;
      }

      let overlay: keyof CanvasOverlayState | null = null;
      if (key === ";" || key === ":") overlay = e.shiftKey ? "spacing" : "guides";
      else if (key === "'" || key === '"') overlay = "grid";
      else if (key === "b" && !e.shiftKey) overlay = "badges";
      else if (key === "r" && !e.shiftKey) overlay = "rulers";
      else if (key === "x" && e.shiftKey) overlay = "xray";
      if (!overlay) return;

      e.preventDefault();
      onOverlayChange(overlay, !overlays[overlay]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlays, onOverlayChange, onZoomChange, onFitToScreen, onZoomToSelection, zoom]);

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
          label="Snap Guides"
          shortcut="⌘;"
          active={overlays.guides}
          onClick={() => onOverlayChange("guides", !overlays.guides)}
        />
        <OverlayButton
          label="Spacing"
          shortcut="⌘⇧;"
          active={overlays.spacing}
          onClick={() => onOverlayChange("spacing", !overlays.spacing)}
        />
        <OverlayButton
          label="Grid"
          shortcut="⌘'"
          active={overlays.grid}
          onClick={() => onOverlayChange("grid", !overlays.grid)}
        />
        <OverlayButton
          label="Rulers"
          shortcut="⌘R"
          active={overlays.rulers}
          onClick={() => onOverlayChange("rulers", !overlays.rulers)}
        />
        <OverlayButton
          label="Badges"
          shortcut="⌘B"
          active={overlays.badges}
          onClick={() => onOverlayChange("badges", !overlays.badges)}
        />
        <OverlayButton
          label="X-Ray"
          shortcut="⌘⇧X"
          active={overlays.xray}
          onClick={() => onOverlayChange("xray", !overlays.xray)}
        />
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
