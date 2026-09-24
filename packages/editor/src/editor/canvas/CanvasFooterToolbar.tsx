/**
 * CanvasFooterToolbar - the canvas status bar's edit + view controls.
 *
 * CONTROLS:
 * - Undo / Redo (moved off the topbar)
 * - ONE "View ▾" menu holding the six overlay toggles — board 5930:44801
 *   (Canvas · View menu): Snap guides · Spacing · Grid · Rulers · Badges ·
 *   X-Ray as check rows, each with its chord (G2-037: "one contextual
 *   selector", not a word bar). The chords themselves stay bound below.
 * - Its last two rows, Breakpoint ▸ (5930:44781, with Custom width… →
 *   5930:44824) and Zoom ▸ (7048:78112), plus the bar's own "100% ▾"
 *   (7048:78046, board 5936:44788).
 * - The selection readout at the right end.
 *
 * The Inspector toggle that sat at the end of the word bar has no home on the
 * board; it is a ⌘K row now (`toggle-inspector`, registry owned by the
 * commands lane) plus the ✕ in the inspector's own header, both of which emit
 * EVENTS.UI_TOGGLE_INSPECTOR for the shell to act on.
 *
 * Layout:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  [↶] [↷]  [View ▾]  [100% ▾]            Section · Hero · 680 × 250 │
 * └────────────────────────────────────────────────────────────────┘
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, isModalOpen, Menu, MenuGroup, MenuItem, MenuLabel, Popover, TextInput, Tooltip, type Breakpoint } from "@/editor/chrome-ui";
import { BREAKPOINTS } from "@/shared/constants/breakpoints";
import { stepZoom } from "@/shared/constants/canvas";
import { CustomWidthModal } from "./controls/CustomWidthModal";
// Undo/redo/device switching moved OFF the topbar and onto this canvas toolbar
// (Figma contract §2: viewport + edit controls belong to the canvas, the topbar
// stays minimal). Device values are the chrome-ui Breakpoint union.
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
  /** Preview width set by "Custom width…", or null for the device's own. */
  customWidth?: number | null;
  /** Apply a custom preview width (board 5930:44824). */
  onCustomWidth?: (width: number) => void;
  /** Right-end readout: "{Type} · {name} · W × H" (board 5936:44788). */
  readout?: string;
  /** Grid spacing in px (the project's grid-size setting). */
  gridSize?: number;
  /** Set the grid spacing — View ▸ Grid ▸ Size (owner 2026-09-24). */
  onGridSizeChange?: (size: number) => void;
}

// ============================================
// Icons (inline SVG for self-containment)
// ============================================

/* The six overlay glyphs that used to sit in this block are gone with the
   icon-only toggles — board 199:205 labels them in words. Recover from git
   history if a future surface needs them. */

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

/** Square icon control in the bar — undo/redo/help all share this box. The
 *  board draws a disabled ↶ ↷ as a muted glyph with no fill, so the Button's
 *  disabled fill is cleared. */
const EDIT_BTN =
  "tw:inline-flex tw:items-center tw:justify-center tw:size-7 tw:p-0 tw:rounded " +
  "tw:border tw:border-transparent tw:bg-transparent tw:disabled:bg-transparent tw:text-[var(--bk-ink-soft)] " +
  "tw:hover:bg-[var(--bk-gray-100)] tw:hover:text-[var(--bk-ink)]";

/**
 * The floating bar — board 5936:44788 / 4428:44164: one 44-tall row inset 16
 * from the canvas edges: ↶ ↷ · View ▾ · 100% ▾ on the left, the selection
 * readout ("Section · Hero · 680 × 250") at the right end. Breakpoints live in
 * View ▸ Breakpoint; shortcuts in Help. `min-w-0` + a truncating readout keep
 * it inside the canvas column when the column is narrow.
 */
const BAR =
  "tw:flex tw:items-center tw:justify-start tw:gap-1 tw:h-[var(--bk-size-header)] tw:px-3 tw:rounded-lg " +
  "tw:border tw:border-[var(--bk-gray-200)] tw:bg-white tw:[box-shadow:var(--bk-shadow-drag)] " +
  "tw:whitespace-nowrap tw:w-full tw:max-w-full tw:min-w-0";
const GROUP = "tw:flex tw:items-center tw:gap-1";

// ============================================
// View menu rows — board 5930:44801, in its order, with its chords
// ============================================

const VIEW_ROWS: readonly { key: keyof CanvasOverlayState; label: string; kbd: string }[] = [
  { key: "guides", label: "Snap guides", kbd: "⌘;" },
  { key: "spacing", label: "Spacing", kbd: "⌘⇧;" },
  { key: "grid", label: "Grid", kbd: "⌘'" },
  { key: "rulers", label: "Rulers", kbd: "⌘R" },
  { key: "badges", label: "Badges", kbd: "⌘B" },
  { key: "xray", label: "X-Ray", kbd: "⌘⇧X" },
];

/** Board 5930:44781 — the Breakpoint list (+ Custom width…, G2-014). */
const BREAKPOINT_ROWS: { id: Breakpoint; label: string; width?: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "mobile", label: "Mobile", width: "375px" },
];
const DEVICE_LABEL: Partial<Record<string, string>> = { wide: "Wide", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile" };
/** View ▸ Grid ▸ Size presets (owner 2026-09-24; custom 1–100 beside them). */
const GRID_SIZES: readonly number[] = [4, 8, 16];
/** Board 7048:78112's presets. */
const VIEW_ZOOM_LEVELS = [50, 75, 100, 150, 200];

/* The trigger is plain text on the bar, as the board draws it, overlays on or
   off. The " · N" count is the one hint that something is drawn over the
   canvas (designer-notes: View trigger count). */
const VIEW_TRIGGER =
  "tw:inline-flex tw:items-center tw:gap-1 tw:h-7 tw:px-2.5 tw:py-1 tw:rounded tw:border tw:border-transparent tw:text-[11px] tw:whitespace-nowrap tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:font-medium tw:hover:bg-[var(--bk-gray-100)]";

// ============================================
// Main Component
// ============================================

export const CanvasFooterToolbar: React.FC<CanvasFooterToolbarProps> = ({
  overlays,
  zoom,
  onOverlayChange,
  onZoomChange,
  onFitToScreen,
  onZoomToSelection,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  customWidth,
  onCustomWidth,
  readout,
  gridSize,
  onGridSizeChange,
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
        onZoomChange(stepZoom(zoom, 1));
        return;
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        onZoomChange(stepZoom(zoom, -1));
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

  const showEditGroup = Boolean(onUndo || onRedo);
  const [viewOpen, setViewOpenState] = React.useState(false);
  /* Board 5930:44801's last two rows open their own lists in place —
     5930:44781 (Breakpoint) and 7048:78112 (Zoom). */
  const [viewPane, setViewPane] = React.useState<"main" | "breakpoint" | "zoom" | "grid">("main");
  const [customGrid, setCustomGrid] = React.useState("");
  const setViewOpen = (next: boolean | ((v: boolean) => boolean)) => {
    setViewOpenState(next);
    setViewPane("main");
  };
  const activeOverlays = VIEW_ROWS.filter((row) => overlays[row.key]).length;
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);
  /* Zoom rows — shared by View ▸ Zoom and the bar's "100% ▾" (7048:78046). */
  const zoomRows = (close: () => void) => (
    <>
      {onFitToScreen && (
        <MenuItem
          radio
          selected={false}
          data-testid="canvas-zoom-fit"
          onClick={() => {
            onFitToScreen();
            close();
          }}
        >
          Fit to screen
        </MenuItem>
      )}
      {VIEW_ZOOM_LEVELS.map((z) => (
        <MenuItem
          key={z}
          radio
          selected={Math.round(zoom) === z}
          data-testid={`canvas-zoom-${z}`}
          onClick={() => {
            onZoomChange(z);
            close();
          }}
        >
          {`${z}%`}
        </MenuItem>
      ))}
    </>
  );

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
          </div>
        </>
      )}
      {/* View menu — board 5930:44801. Opens upward: the bar sits at the
          bottom of the canvas. A row click toggles its overlay and closes
          (the board's SV + CLOSE). */}
      <div className={GROUP}>
        <Popover
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          placement="top"
          label="View"
          trigger={
            <Button
              type="button"
              color="light"
              className={VIEW_TRIGGER}
              aria-haspopup="menu"
              aria-expanded={viewOpen}
              aria-label="View"
              data-testid="canvas-view-menu-trigger"
              onClick={() => setViewOpen((v) => !v)}
            >
              View{activeOverlays > 0 ? ` · ${activeOverlays}` : ""} ▾
            </Button>
          }
        >
          {/* Board 5930:44801 draws the View menu 220 wide. */}
          <Menu label="View" data-testid="canvas-view-menu" className="tw:min-w-[220px]">
            {viewPane === "main" && (
              <>
                {VIEW_ROWS.map((row) => {
                  /* Owner 2026-09-24: the grid-size setting lives here now —
                     Grid opens its own list (Show grid · Size) instead of
                     toggling straight away. */
                  const opensGrid = row.key === "grid" && onGridSizeChange;
                  return (
                    <MenuItem
                      key={row.key}
                      selected={overlays[row.key]}
                      kbd={opensGrid ? `${row.kbd} ▸` : row.kbd}
                      data-testid={`canvas-view-${row.key}`}
                      onClick={() => {
                        if (opensGrid) {
                          setCustomGrid("");
                          setViewPane("grid");
                          return;
                        }
                        onOverlayChange(row.key, !overlays[row.key]);
                        setViewOpen(false);
                      }}
                    >
                      {row.label}
                    </MenuItem>
                  );
                })}
                <MenuGroup>
                  {device && onDeviceChange && (
                    <MenuItem
                      data-testid="canvas-view-breakpoint"
                      kbd={`${customWidth ? `${customWidth}px` : (DEVICE_LABEL[device] ?? device)} ▸`}
                      onClick={() => setViewPane("breakpoint")}
                    >
                      Breakpoint
                    </MenuItem>
                  )}
                  <MenuItem data-testid="canvas-view-zoom" kbd={`${Math.round(zoom)}% ▸`} onClick={() => setViewPane("zoom")}>
                    Zoom
                  </MenuItem>
                </MenuGroup>
              </>
            )}
            {viewPane === "breakpoint" && device && onDeviceChange && (
              <>
                {BREAKPOINT_ROWS.map((row) => (
                  <MenuItem
                    key={row.id}
                    radio
                    selected={device === row.id && !customWidth}
                    kbd={row.width}
                    data-testid={`canvas-breakpoint-${row.id}`}
                    onClick={() => {
                      onDeviceChange(row.id);
                      setViewOpen(false);
                    }}
                  >
                    {row.label}
                  </MenuItem>
                ))}
                {onCustomWidth && (
                  <MenuGroup>
                    <MenuItem
                      data-testid="canvas-breakpoint-custom"
                      onClick={() => {
                        setViewOpen(false);
                        setCustomOpen(true);
                      }}
                    >
                      Custom width…
                    </MenuItem>
                  </MenuGroup>
                )}
              </>
            )}
            {viewPane === "zoom" && zoomRows(() => setViewOpen(false))}
            {viewPane === "grid" && onGridSizeChange && (
              <>
                <MenuItem
                  selected={overlays.grid}
                  kbd="⌘'"
                  data-testid="canvas-grid-show"
                  onClick={() => {
                    onOverlayChange("grid", !overlays.grid);
                    setViewOpen(false);
                  }}
                >
                  Show grid
                </MenuItem>
                <MenuGroup>
                  <MenuLabel>Size</MenuLabel>
                  {GRID_SIZES.map((size) => (
                    <MenuItem
                      key={size}
                      radio
                      selected={gridSize === size}
                      data-testid={`canvas-grid-size-${size}`}
                      onClick={() => {
                        onGridSizeChange(size);
                        setViewOpen(false);
                      }}
                    >
                      {`${size}px`}
                    </MenuItem>
                  ))}
                  <div className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1">
                    <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">Custom</span>
                    <TextInput
                      sizing="sm"
                      inputMode="numeric"
                      aria-label="Custom grid size in px"
                      placeholder={gridSize && !GRID_SIZES.includes(gridSize) ? String(gridSize) : "px"}
                      value={customGrid}
                      data-testid="canvas-grid-size-custom"
                      onChange={(e) => setCustomGrid(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        const n = Number.parseInt(customGrid, 10);
                        if (e.key === "Enter" && n >= 1 && n <= 100) {
                          onGridSizeChange(n);
                          setViewOpen(false);
                        }
                      }}
                    />
                  </div>
                </MenuGroup>
              </>
            )}
          </Menu>
        </Popover>
        {/* "100% ▾" — board 5936:44788's bar; opens 7048:78046. */}
        <Popover
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          placement="top"
          label="Zoom"
          trigger={
            <Button
              type="button"
              color="light"
              className={`${VIEW_TRIGGER} tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:font-medium tw:hover:bg-[var(--bk-gray-100)]`}
              aria-haspopup="menu"
              aria-expanded={zoomOpen}
              aria-label={`Zoom ${Math.round(zoom)}%`}
              data-testid="canvas-zoom-trigger"
              onClick={() => setZoomOpen((v) => !v)}
            >
              {Math.round(zoom)}% ▾
            </Button>
          }
        >
          <Menu label="Zoom" data-testid="canvas-zoom-menu">
            {zoomRows(() => setZoomOpen(false))}
          </Menu>
        </Popover>
      </div>
      {onCustomWidth && (
        <CustomWidthModal
          open={customOpen}
          initialWidth={customWidth ?? BREAKPOINTS.desktop.minWidth}
          onClose={() => setCustomOpen(false)}
          onApply={onCustomWidth}
        />
      )}
      {readout && (
        <span
          className="tw:ml-auto tw:min-w-0 tw:truncate tw:pl-2 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]"
          title={readout}
          data-testid="canvas-bar-readout"
        >
          {readout}
        </span>
      )}
    </div>
  );
};

export default CanvasFooterToolbar;
