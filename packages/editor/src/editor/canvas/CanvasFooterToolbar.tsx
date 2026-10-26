/**
 * CanvasFooterToolbar — the canvas bar (design-2l9 boards 7:18654,
 * 145:64586): "Hero / Text · [devices] · 1440 px · 52% ⌄ · View", across the
 * TOP of the canvas column (the name is historical: it was docked at the
 * bottom until the 2026-10-26 board pass).
 *
 * - Left: where the selection is, two levels — "{Parent} / {Element}", the
 *   page alone with nothing selected (useSelectionReadout). The type and
 *   W × H the bar used to print ride in its tooltip.
 * - Centre: the device buttons — Desktop · Tablet · Mobile, icon-only, the
 *   active one on the accent tint (BreakpointSwitcher `variant="bar"`).
 * - "{width} px" opens Page width (145:71013): presets + a custom width. It
 *   replaces View ▸ Breakpoint ▸ / Custom width….
 * - "{zoom}%" opens the zoom rows (fit, selection, presets).
 * - "View" opens Canvas view (145:64586): Grid · {n} px › (the Grid and
 *   snapping dialog, 145:65011), Rulers, Snap guides — then, under a rule,
 *   the code's Spacing · Badges · X-Ray toggles (kept, code-ahead). "Show
 *   outlines" is the shell's preference (A-12); "Focus mode" waits on its
 *   meaning (`open:focus-mode-meaning`).
 *
 * Undo / Redo left this bar for the topbar's History group (Task 1.2).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BreakpointSwitcher, Button, isModalOpen, Menu, MenuGroup, MenuItem, MenuLabel, Popover, type Breakpoint } from "@/editor/chrome-ui";
import { ChevronDown } from "lucide-react";
import { stepZoom } from "@/shared/constants/canvas";
import { GridSnapDialog } from "./controls/GridSnapDialog";
import { PageWidthPanel } from "./controls/PageWidthPanel";
// Device values are the chrome-ui Breakpoint union.
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
  /** Element outlines without X-Ray's wireframe (board 145:64586). */
  outlines: boolean;
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
  /** Preview width set by "Custom width…", or null for the device's own. */
  customWidth?: number | null;
  /** Apply a custom preview width (board 145:71013). */
  onCustomWidth?: (width: number) => void;
  /** The width the page renders at now, in px — the bar's "{width} px". */
  pageWidth?: number;
  /** Left readout: "{Parent} / {Element}" (board 7:18654). */
  readout?: string;
  /** Its tooltip: "{Type} · {name} · W × H". */
  readoutTitle?: string;
  /** Grid spacing in px (the project's grid-size setting). */
  gridSize?: number;
  /** Set the grid spacing — View ▸ Grid ▸ Size (owner 2026-09-24). */
  onGridSizeChange?: (size: number) => void;
}

/**
 * The bar — one 41-tall row (42 with its container's hairline, board
 * 7:18654 y 56–98): readout · devices · width, zoom, View. A
 * three-column grid holds the devices where the board puts them — measured
 * on 7:18654, the group starts 409 into an 800 column, i.e. the side
 * columns split the free width 1.44 : 1 — whatever the readout's length; `min-w-0` + a truncating readout keep it inside a narrow
 * column. Flush to the column, full width — no radius, no shadow; the
 * hairline below and the fill come from its container
 * (`footerToolbarContainerStyles`).
 */
const BAR =
  "tw:grid tw:grid-cols-[minmax(0,1.44fr)_auto_minmax(0,1fr)] tw:items-center tw:gap-2 tw:h-[41px] tw:pl-1 " +
  "tw:bg-white tw:whitespace-nowrap tw:w-full tw:max-w-full tw:min-w-0";
const GROUP = "tw:flex tw:min-w-0 tw:items-center tw:justify-end tw:gap-1.5";

/* Board 145:64586's own rows, in its order. */
const VIEW_ROWS: readonly { key: keyof CanvasOverlayState; label: string; kbd?: string }[] = [
  { key: "rulers", label: "Rulers", kbd: "⌘R" },
  { key: "guides", label: "Snap guides", kbd: "⌘;" },
  { key: "outlines", label: "Show outlines" },
];
/* The code's other overlays — not on the board, kept under a rule. */
const MORE_VIEW_ROWS: readonly { key: keyof CanvasOverlayState; label: string; kbd: string }[] = [
  { key: "spacing", label: "Spacing", kbd: "⌘⇧;" },
  { key: "badges", label: "Badges", kbd: "⌘B" },
  { key: "xray", label: "X-Ray", kbd: "⌘⇧X" },
];

const FOOTER_MENU = "tw:min-w-[224px] tw:[&_[role^=menuitem]]:h-[30px]";
const VIEW_ZOOM_LEVELS = [50, 75, 100, 150, 200];

/* Board 7:18654's three controls, each its own look:
   "1440 px" a grey chip in the data face (Geist Mono, tabular);
   "52% ⌄"  a bordered select-like box with a chevron;
   "View"   plain text in ink. */
const TRIGGER_BASE =
  "tw:inline-flex tw:items-center tw:gap-1 tw:h-7 tw:rounded-md tw:whitespace-nowrap tw:text-[12px] tw:font-medium tw:tabular-nums";
const WIDTH_TRIGGER =
  `${TRIGGER_BASE} tw:px-2 tw:border tw:border-transparent tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)] tw:hover:bg-[var(--bk-gray-200)]`;
const ZOOM_TRIGGER =
  `${TRIGGER_BASE} tw:w-[83px] tw:justify-between tw:px-2.5 tw:border tw:border-[var(--bk-border)] tw:bg-white tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-50)]`;
const VIEW_TRIGGER =
  `${TRIGGER_BASE} tw:px-1.5 tw:border tw:border-transparent tw:bg-transparent tw:text-[13px] tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)]`;

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
  customWidth,
  onCustomWidth,
  pageWidth,
  readout,
  readoutTitle,
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

  const [viewOpen, setViewOpen] = React.useState(false);
  const [gridOpen, setGridOpen] = React.useState(false);
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const [widthOpen, setWidthOpen] = React.useState(false);

  const overlayRow = (row: { key: keyof CanvasOverlayState; label: string; kbd?: string }) => (
    <MenuItem
      key={row.key}
      selected={overlays[row.key]}
      kbd={row.kbd}
      data-testid={`canvas-view-${row.key}`}
      onClick={() => {
        onOverlayChange(row.key, !overlays[row.key]);
        setViewOpen(false);
      }}
    >
      {row.label}
    </MenuItem>
  );

  return (
    <div className={BAR}>
      {/* The left readout — where the selection is. */}
      <span
        className="tw:min-w-0 tw:truncate tw:pl-2 tw:pr-2 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]"
        title={readoutTitle ?? readout}
        data-testid="canvas-bar-readout"
      >
        {readout}
      </span>
      {device && onDeviceChange ? (
        <BreakpointSwitcher variant="bar" value={device} onChange={onDeviceChange} data-testid="canvas-bar-devices" />
      ) : (
        <span />
      )}
      <div className={GROUP}>
        {/* "{width} px" — board 145:71013's Page width. */}
        {device && onDeviceChange && onCustomWidth && pageWidth ? (
          <Popover
            open={widthOpen}
            onClose={() => setWidthOpen(false)}
            placement="bottom"
            label="Page width"
            trigger={
              <Button
                type="button"
                color="light"
                className={WIDTH_TRIGGER}
                aria-haspopup="dialog"
                aria-expanded={widthOpen}
                aria-label={`Page width ${pageWidth} px`}
                data-testid="canvas-width-trigger"
                onClick={() => setWidthOpen((v) => !v)}
              >
                {`${pageWidth} px`}
              </Button>
            }
          >
            <PageWidthPanel
              width={pageWidth}
              device={device}
              custom={Boolean(customWidth)}
              onDeviceChange={onDeviceChange}
              onCustomWidth={onCustomWidth}
              onDone={() => setWidthOpen(false)}
            />
          </Popover>
        ) : null}
        <Popover
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          placement="bottom-end"
          label="Zoom"
          trigger={
            <Button
              type="button"
              color="light"
              className={ZOOM_TRIGGER}
              aria-haspopup="menu"
              aria-expanded={zoomOpen}
              aria-label={`Zoom ${Math.round(zoom)}%`}
              data-testid="canvas-zoom-trigger"
              onClick={() => setZoomOpen((v) => !v)}
            >
              {Math.round(zoom)}%
              <ChevronDown size={14} aria-hidden="true" className="tw:flex-none" />
            </Button>
          }
        >
          <Menu label="Zoom" data-testid="canvas-zoom-menu" className={FOOTER_MENU}>
            {onFitToScreen && (
              <MenuItem
                radio
                tick="box"
                selected={false}
                kbd="⌘1"
                data-testid="canvas-zoom-fit"
                onClick={() => {
                  onFitToScreen();
                  setZoomOpen(false);
                }}
              >
                Fit to screen
              </MenuItem>
            )}
            {VIEW_ZOOM_LEVELS.map((z) => (
              <MenuItem
                key={z}
                radio
                tick="box"
                selected={Math.round(zoom) === z}
                data-testid={`canvas-zoom-${z}`}
                onClick={() => {
                  onZoomChange(z);
                  setZoomOpen(false);
                }}
              >
                {`${z}%`}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
        {/* "View" — board 145:64586's Canvas view, opening down from the bar. */}
        <Popover
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          placement="bottom-end"
          label="Canvas view"
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
              View
            </Button>
          }
        >
          <Menu label="Canvas view" data-testid="canvas-view-menu" className={FOOTER_MENU}>
            <MenuLabel>Canvas view</MenuLabel>
            <MenuItem
              selected={overlays.grid}
              kbd={onGridSizeChange ? "›" : "⌘'"}
              data-testid="canvas-view-grid"
              onClick={() => {
                setViewOpen(false);
                if (onGridSizeChange) setGridOpen(true);
                else onOverlayChange("grid", !overlays.grid);
              }}
            >
              {`Grid · ${gridSize ?? 8} px`}
            </MenuItem>
            {VIEW_ROWS.map(overlayRow)}
            <MenuGroup>{MORE_VIEW_ROWS.map(overlayRow)}</MenuGroup>
          </Menu>
        </Popover>
      </div>
      {onGridSizeChange && (
        <GridSnapDialog
          open={gridOpen}
          gridOn={overlays.grid}
          gridSize={gridSize ?? 8}
          onClose={() => setGridOpen(false)}
          onApply={({ gridOn, gridSize: size }) => {
            if (size !== gridSize) onGridSizeChange(size);
            if (gridOn !== overlays.grid) onOverlayChange("grid", gridOn);
          }}
        />
      )}
    </div>
  );
};

export default CanvasFooterToolbar;
