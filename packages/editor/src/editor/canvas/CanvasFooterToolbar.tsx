/**
 * CanvasFooterToolbar — the canvas status bar (design-2l9 boards 7:18654,
 * 145:64586): "Hero / Text · 1440 px · 52% · View".
 *
 * - Left: where the selection is, two levels — "{Parent} / {Element}", the
 *   page alone with nothing selected (useSelectionReadout). The type and
 *   W × H the bar used to print ride in its tooltip.
 * - "{width} px" opens Page width (145:71013): presets + a custom width. It
 *   replaces View ▸ Breakpoint ▸ / Custom width….
 * - "{zoom}%" opens the zoom rows (fit, selection, presets).
 * - "View" opens Canvas view (145:64586): Grid · {n} px › (the Grid and
 *   snapping panel, 145:65011, opened in the View popover's place), Rulers,
 *   Snap guides — then, under a rule,
 *   the code's Spacing · Badges · X-Ray toggles (kept, code-ahead). "Show
 *   outlines" is the shell's preference (A-12); "Focus mode" waits on its
 *   meaning (`open:focus-mode-meaning`).
 *
 * Undo / Redo left this bar for the topbar's History group (Task 1.2).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BreakpointSwitcher, Button, isModalOpen, Menu, MenuGroup, MenuItem, Popover, type Breakpoint } from "@/editor/chrome-ui";
import { ChevronDown } from "lucide-react";
import { stepZoom } from "@/shared/constants/canvas";
import { GridSnapPanel } from "./controls/GridSnapPanel";
import { RulersGuidesPanel, type CanvasGuideActions } from "./controls/RulersGuidesPanel";
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
  /** The site's ruler guides — View › Rulers and guides… (153:79518). */
  guides?: CanvasGuideActions;

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
 * The docked bar — one 44-tall row, the readout on the left and the three
 * controls on the right. `min-w-0` + a truncating readout keep it inside the
 * canvas column when the column is narrow.
 *
 * OWNER OVERRIDE 2026-10-03: docked flush to the canvas column's bottom edge
 * at full width — no radius, no shadow, no side border. The hairline on top
 * and the fill come from its container (`footerToolbarContainerStyles`).
 */
const BAR =
  "tw:grid tw:grid-cols-[minmax(0,1.44fr)_auto_minmax(0,1fr)] tw:items-center tw:gap-2 tw:h-[41px] tw:pl-1 " +
  "tw:bg-white tw:whitespace-nowrap tw:w-full tw:max-w-full tw:min-w-0";
/* Board 7:18654: path left, the device toggles in BAR's middle column, the
   controls right — BAR's 1.44 : 1 grid puts the toggles where the board does. */
const SIDE = "tw:flex tw:min-w-0 tw:items-center";

/* Board 145:64586's own rows, in its order. */
const VIEW_ROWS: readonly { key: keyof CanvasOverlayState; label: string; kbd?: string }[] = [
  /* 145:64586 "Rulers and guides…": the rulers are where guides are placed
     (click a ruler). No "…" — it toggles; the board's guide-detail dialog
     (S11) does not exist. */
  { key: "rulers", label: "Rulers and guides", kbd: "⌘R" },
  { key: "guides", label: "Snap guides", kbd: "⌘;" },
  { key: "outlines", label: "Show outlines" },
];
/* The code's other overlays — not on the board, kept under a rule. */
const MORE_VIEW_ROWS: readonly { key: keyof CanvasOverlayState; label: string; kbd: string }[] = [
  { key: "spacing", label: "Spacing", kbd: "⌘⇧;" },
  { key: "badges", label: "Badges", kbd: "⌘B" },
  { key: "xray", label: "X-Ray", kbd: "⌘⇧X" },
];

/* The bar's popovers open downward, 5 under the bar's bottom edge (145:65011:
   the panel's top at 103 under a bar ending at 98) — 8 more than Popover's
   own 4 from the trigger. */
const POPOVER_UNDER_BAR = "tw:mt-2";
const FOOTER_MENU = "tw:min-w-[224px] tw:[&_[role^=menuitem]]:h-[30px]";
const VIEW_ZOOM_LEVELS = [50, 75, 100, 150, 200];

/* The triggers are plain text on the bar, as the board draws them. */
const BAR_TRIGGER =
  "tw:inline-flex tw:items-center tw:gap-1 tw:h-7 tw:px-2.5 tw:py-1 tw:rounded tw:border tw:border-transparent tw:text-[12px] tw:whitespace-nowrap tw:bg-transparent tw:text-[var(--bk-ink)] tw:font-medium tw:tabular-nums tw:hover:bg-[var(--bk-gray-100)]";
/* Board 7:18654: bare device glyphs 24 square, 12 apart, the chosen one on a
   blue tint (not the well and solid fill the switcher draws elsewhere). */
const BAR_DEVICES =
  "tw:!gap-3 tw:!border-0 tw:!bg-transparent tw:!p-0 tw:[&_button]:!size-6 " +
  "tw:[&_[aria-pressed=true]]:!bg-[var(--bk-accent-tint)] tw:[&_[aria-pressed=true]]:!text-[var(--bk-accent-text)]";
/* Board 7:18654: the width is a gray mono chip, the zoom an outlined select. */
const WIDTH_CHIP = `${BAR_TRIGGER} tw:!bg-[var(--bk-gray-100)] tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-normal`;
const ZOOM_SELECT = `${BAR_TRIGGER} tw:!border-[var(--bk-border)] tw:w-[82px] tw:justify-between tw:rounded-md tw:font-normal`;

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
  guides,
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
  const [guidesOpen, setGuidesOpen] = React.useState(false);
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
    <div className={BAR} data-testid="canvas-bar">
      {/* The left readout — where the selection is. */}
      <div className={SIDE}>
        <span
          className="tw:min-w-0 tw:truncate tw:pr-2 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]"
          title={readoutTitle ?? readout}
          data-testid="canvas-bar-readout"
        >
          {readout}
        </span>
      </div>
      {device && onDeviceChange ? (
        <BreakpointSwitcher
          value={device}
          onChange={onDeviceChange}
          data-testid="canvas-bar-breakpoints"
          className={BAR_DEVICES}
        />
      ) : (
        <span />
      )}
      <div className={`${SIDE} tw:justify-end tw:gap-1`}>
        {/* "{width} px" — board 145:71013's Page width. */}
        {device && onDeviceChange && onCustomWidth && pageWidth ? (
          <Popover
            open={widthOpen}
            onClose={() => setWidthOpen(false)}
            placement="bottom"
            className={POPOVER_UNDER_BAR}
            label="Page width"
            trigger={
              <Button
                type="button"
                color="light"
                className={WIDTH_CHIP}
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
          placement="bottom"
          className={POPOVER_UNDER_BAR}
          label="Zoom"
          trigger={
            <Button
              type="button"
              color="light"
              className={ZOOM_SELECT}
              aria-haspopup="menu"
              aria-expanded={zoomOpen}
              aria-label={`Zoom ${Math.round(zoom)}%`}
              data-testid="canvas-zoom-trigger"
              onClick={() => setZoomOpen((v) => !v)}
            >
              {Math.round(zoom)}%
              <ChevronDown size={14} aria-hidden="true" />
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
        {/* "View" — board 145:64586's Canvas view. Opens downward: the bar
            sits at the top of the canvas column (7:18654). */}
        <Popover
          open={viewOpen || gridOpen || guidesOpen}
          onClose={() => {
            setViewOpen(false);
            setGridOpen(false);
            setGuidesOpen(false);
          }}
          placement="bottom-end"
          /* The Grid panel is its own framed surface (145:65011, 360 wide):
             no popover padding around it. */
          className={gridOpen || guidesOpen ? `${POPOVER_UNDER_BAR} tw:p-0!` : POPOVER_UNDER_BAR}
          label="Canvas view"
          trigger={
            <Button
              type="button"
              color="light"
              className={BAR_TRIGGER}
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
          {/* Board 145:65011: Grid opens its panel in the View popover's
              place, under the same control, with Close in its head. */}
          {gridOpen && onGridSizeChange ? (
            <GridSnapPanel
              gridOn={overlays.grid}
              gridSize={gridSize ?? 8}
              onClose={() => setGridOpen(false)}
              onApply={({ gridOn, gridSize: size }) => {
                if (size !== gridSize) onGridSizeChange(size);
                if (gridOn !== overlays.grid) onOverlayChange("grid", gridOn);
              }}
            />
          ) : guidesOpen && guides ? (
            <RulersGuidesPanel
              rulersOn={overlays.rulers}
              onRulersChange={(on) => onOverlayChange("rulers", on)}
              guides={guides}
              onClose={() => setGuidesOpen(false)}
            />
          ) : (
          <Menu label="Canvas view" data-testid="canvas-view-menu" className={FOOTER_MENU}>
            {/* 145:64586: titled like Grid and snapping — "Canvas view" and a
                text Close, not a small-caps label. */}
            <div className="tw:flex tw:items-center tw:pl-2">
              <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">Canvas view</span>
              <Button
                color="light"
                size="xs"
                data-testid="canvas-view-close"
                className="tw:ml-auto tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
                onClick={() => setViewOpen(false)}
              >
                Close
              </Button>
            </div>
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
            {/* 153:79518: with the site's guides to hand, the rulers row opens
                Rulers and guides; without, it stays the toggle. */}
            {guides ? (
              <MenuItem
                selected={overlays.rulers}
                kbd="›"
                data-testid="canvas-view-rulers"
                onClick={() => {
                  setViewOpen(false);
                  setGuidesOpen(true);
                }}
              >
                Rulers and guides…
              </MenuItem>
            ) : (
              overlayRow(VIEW_ROWS[0])
            )}
            {VIEW_ROWS.slice(1).map(overlayRow)}
            <MenuGroup>{MORE_VIEW_ROWS.map(overlayRow)}</MenuGroup>
          </Menu>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default CanvasFooterToolbar;
