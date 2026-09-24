/**
 * StudioFooter — 32px status bar at the bottom of the editor shell.
 *
 * Rebuilt to Figma board 52:2 node 52:10 (2026-08-06 full-UI rebuild):
 *   left   `Section · Hero` — the selected element's identity
 *          `680 × 250`     — its live rendered size
 *   right  `Desktop · 100%` — device · zoom, as text
 *
 * What the previous footer showed and the board does not: the
 * "Connected · main" pill (connection truth lives in the topbar save pill —
 * its component doc calls offline one of the five save truths) and the version
 * string. Removed per the founder's precedence rule: everything visual, the
 * board wins.
 *
 * The `Desktop · 100%` readout is the ZOOM CONTROL, not a label. Board
 * 817:4723 says it in words — "Bottom-right corner of footer. Click percentage
 * to open flyout. Range: 10%–400%." The −/+/presets group used to live in the
 * floating canvas toolbar instead, where it cost ~105px of a 760px bar and
 * forced every overlay toggle down to an icon; board 199:205 draws those
 * toggles as words, so the zoom group was the thing in the wrong place.
 *
 * Fit and zoom-to-selection have to measure the canvas, which only Canvas.tsx
 * can do, so those two rows emit `ZOOM_FIT` / `ZOOM_SELECTION` on the composer
 * rather than reaching for a prop chain that would have to cross the shell.
 *
 * "Section · Hero" and "680 × 250" on the board are SAMPLE data — the
 * contract is the shape `{type} · {name}` + `{w} × {h}`, not those literals.
 *
 * `syncConnected` remains in the interface unused: the only call site is
 * AquibraStudio.tsx, which is mid-edit in the founder's working tree — staging
 * it would commit their unrelated work. Trim it when that lands.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ListTree } from "lucide-react";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";
import { Button, POPOVER_BASE_CLASS } from "@/editor/chrome-ui";
import { useClickOutside } from "@/shared/hooks";
import { useSelectionReadout } from "@/editor/canvas/hooks/useSelectionReadout";
import { EVENTS } from "../../shared/constants/events";
import { ZOOM_PRESETS } from "../../shared/constants/canvas";

const DEVICE_LABEL: Partial<Record<DeviceType, string>> = {
  wide: "Wide",
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export interface StudioFooterProps {
  /* A full-page tab (Settings, Templates, History) replaces the canvas, so the
     selection readout and the zoom control describe something the person cannot
     see. The footer itself stays — save state and the connection pill are still
     true — but its canvas-specific halves are dropped. Without this the shell
     printed "Section · Hero 680 × 250" and "Desktop · 100%" over full-page
     Settings, which is audit finding F15, confirmed on six boards. The footer
     renders as a flex sibling OUTSIDE LayoutShell's grid, so none of the
     `.layout-shell--fullpage` rules can reach it — the mode has to be passed. */
  fullPage?: boolean;
  composer: Composer | null;
  device: DeviceType;
  zoom: number;
  /** Board 817:4723 — the percentage readout opens the zoom flyout. */
  onZoomChange?: (zoom: number) => void;
  /** Unused since the board rebuild — see the header comment. */
  syncConnected?: boolean;
  selectedElement: { id: string; type: string; tagName?: string } | null;
  /** E3: opens the page-structure (layers) outline. In 4-tool mode the footer ⌗
   *  is the only home for structure (it leaves the rail). */
  onOpenStructure?: () => void;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** One flyout row: name on the left, its chord greyed on the right.
 *  `nowrap` is load-bearing — at the popover's default 180px "Zoom to
 *  selection" broke across two lines and the flyout stopped looking like the
 *  board's single-line list. */
/* 13px in `--flowbite/gray/700` — 817:4727 and its ten siblings. The rows ran
   at `text-xs` (12) in `--bk-ink-soft`, a size small and a shade light against
   every label the flyout draws. */
const ZOOM_ROW =
  "tw:flex tw:w-full tw:h-7 tw:min-h-0 tw:items-center tw:justify-between tw:gap-6 tw:rounded tw:border-0 " +
  "tw:px-3 tw:py-0 tw:text-[13px] tw:font-medium tw:leading-[normal] tw:whitespace-nowrap tw:bg-transparent " +
  "tw:text-[var(--bk-gray-700)] tw:hover:bg-[var(--bk-gray-100)]";
/* 12px — 817:4728. The COLOUR stays `--bk-ink-muted`: the board names
   `--color/ink-placeholder` `var(--bk-gray-400)`, which measures 2.54:1 on the flyout's
   white and is a contrast failure, and a chord is information, not decoration. */
const ZOOM_KEY = "tw:text-[12px] tw:text-[var(--bk-ink-muted)]";

export const StudioFooter: React.FC<StudioFooterProps> = ({
  composer,
  device,
  zoom,
  fullPage = false,
  onZoomChange,
  selectedElement,
  onOpenStructure,
}) => {
  const fourToolRail = getEditorViewMode().fourToolRail;
  /* Boards 52:10 / 65:2 / 65:412 / 66:4 — shared with the canvas toolbar. */
  const { label, dims } = useSelectionReadout(composer, selectedElement);
  const deviceLabel = DEVICE_LABEL[device] ?? cap(device);

  /* Zoom flyout. Bottom-anchored so it grows UPWARD out of the 32px bar —
     it sits at the very bottom edge of the shell, and a downward menu would
     open off-screen. */
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const zoomRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(zoomRef, () => setZoomOpen(false), { enabled: zoomOpen });

  const pick = (z: number) => () => {
    onZoomChange?.(z);
    setZoomOpen(false);
  };
  const emitZoom = (event: string) => () => {
    composer?.emit(event, {});
    setZoomOpen(false);
  };

  return (
    <>
      {fourToolRail && onOpenStructure && (
        <Button
          color="light"
          onClick={onOpenStructure}
          aria-label="Page structure"
          className="tw:inline-flex tw:items-center tw:gap-[4px] tw:px-[6px] tw:py-[2px] tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:border-transparent tw:bg-transparent tw:hover:text-[var(--bk-ink)]"
        >
          <ListTree size={14} />
          Structure
        </Button>
      )}
      {!fullPage && (
        <span
          className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis"
          title={label}
          data-testid="footer-selection-label"
        >
          {label}
        </span>
      )}
      {!fullPage && dims && (
        <span
          className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap"
          data-testid="footer-selection-dims"
        >
          {dims}
        </span>
      )}
      <span className="tw:flex-1 tw:min-w-px" />
      {!fullPage && (
      <div className="tw:relative" ref={zoomRef}>
        <Button
          color="light"
          onClick={() => setZoomOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={zoomOpen}
          aria-label={`Zoom: ${Math.round(zoom)} percent`}
          /* tw:h-5 is load-bearing, not cosmetic. flowbite's Button defaults to
             h-10 (40px) and className goes through twMerge, so only a SAME
             property overrides it: the padding utilities here never could.
             A 40px control in this 32px status bar overflowed the 900px shell
             to 905 and made the whole editor scroll — the conformance harness
             caught it as every target shifting up 5px after an interaction.
             (CLAUDE.md, "Overriding a flowbite default depends on WHERE the
             class lands".) */
          className="tw:h-5 tw:border-transparent tw:bg-transparent tw:px-[6px] tw:py-[2px] tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap tw:hover:text-[var(--bk-ink)]"
          data-testid="footer-device-zoom"
        >
          {deviceLabel} · {Math.round(zoom)}%
        </Button>
        {zoomOpen && (
          <div
            role="menu"
            aria-label="Zoom"
            data-testid="footer-zoom-flyout"
            className={`${POPOVER_BASE_CLASS} tw:absolute tw:bottom-full tw:right-0 tw:mb-1 tw:min-w-[196px] tw:p-1`}
          >
            <Button color="light" data-testid="zoom-row-fit" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_FIT)}>
              <span data-testid="zoom-label-fit">Zoom to fit</span>
              <span className={ZOOM_KEY}>⌘1</span>
            </Button>
            <Button color="light" data-testid="zoom-row-selection" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_SELECTION)}>
              <span data-testid="zoom-label-selection">Zoom to selection</span>
              <span className={ZOOM_KEY}>⌘2</span>
            </Button>
            <Button color="light" data-testid="zoom-row-100" className={ZOOM_ROW} onClick={pick(100)}>
              <span data-testid="zoom-label-100">Zoom to 100%</span>
              <span className={ZOOM_KEY}>⌘0</span>
            </Button>
            {/* `--color/bg-subtle`, not gray-200 — 817:4731 / 4741. */}
            <div data-testid="zoom-sep-top" className="tw:my-1 tw:h-px tw:bg-[var(--bk-bg-subtle)]" />
            {ZOOM_PRESETS.map((preset) => (
              <Button
                key={preset}
                color="light"
                onClick={pick(preset)}
                data-testid={`zoom-preset-${preset}`}
                /* Left-aligned and pale-blue when current — 817:4737 / 4738.
                   The presets were `justify-end`, which put seven numbers on
                   the opposite edge from the eleven labels above and below
                   them, and the current one was a grey plate that read as
                   "hovered" rather than "this is where you are". */
                className={`${ZOOM_ROW} tw:justify-start ${
                  Math.round(zoom) === preset
                    ? "tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]"
                    : ""
                }`}
              >
                {preset}%
              </Button>
            ))}
            <div data-testid="zoom-sep-bottom" className="tw:my-1 tw:h-px tw:bg-[var(--bk-bg-subtle)]" />
            <Button color="light" data-testid="zoom-row-in" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_IN)}>
              <span data-testid="zoom-label-in">Zoom in</span>
              <span className={ZOOM_KEY}>⌘+</span>
            </Button>
            <Button color="light" data-testid="zoom-row-out" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_OUT)}>
              <span data-testid="zoom-label-out">Zoom out</span>
              <span className={ZOOM_KEY}>⌘−</span>
            </Button>
          </div>
        )}
      </div>
      )}
    </>
  );
};

export default StudioFooter;
