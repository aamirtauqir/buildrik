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
 * its component doc calls offline one of the five save truths), zoom −/+
 * buttons (zoom controls live in the floating canvas toolbar, board
 * 462:3992-3997), and the version string. Removed per the founder's
 * precedence rule: everything visual, the board wins.
 *
 * "Section · Hero" and "680 × 250" on the board are SAMPLE data — the
 * contract is the shape `{type} · {name}` + `{w} × {h}`, not those literals.
 *
 * `onZoomChange` / `syncConnected` remain in the interface unused: the only
 * call site is AquibraStudio.tsx, which is mid-edit in the founder's working
 * tree — staging it would commit their unrelated work. Trim both when that
 * lands.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ListTree } from "lucide-react";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";
import { Button } from "@/editor/chrome-ui";

const DEVICE_LABEL: Partial<Record<DeviceType, string>> = {
  wide: "Wide",
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export interface StudioFooterProps {
  composer: Composer | null;
  device: DeviceType;
  zoom: number;
  /** Unused since the board rebuild — see the header comment. */
  onZoomChange?: (zoom: number) => void;
  /** Unused since the board rebuild — see the header comment. */
  syncConnected?: boolean;
  selectedElement: { id: string; type: string; tagName?: string } | null;
  /** E3: opens the page-structure (layers) outline. In 4-tool mode the footer ⌗
   *  is the only home for structure (it leaves the rail). */
  onOpenStructure?: () => void;
}

/** `section` -> `Section`, matching the board's `Section · Hero` casing. */
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * The selected element's rendered size, read from the canvas DOM. The engine
 * stamps every element with `data-buildrick-id` (Canvas.tsx:423), which is the
 * same handle the click-to-select path resolves. Re-read per render — a footer
 * render is driven by selection/zoom changes, exactly when size may move.
 * Returns null when the node is not in the DOM (jsdom, mid-mount).
 */
function elementDims(id: string | undefined): string | null {
  if (!id || typeof document === "undefined") return null;
  const node = document.querySelector<HTMLElement>(`[data-buildrick-id="${CSS.escape(id)}"]`);
  if (!node) return null;
  const w = Math.round(node.offsetWidth);
  const h = Math.round(node.offsetHeight);
  if (!w && !h) return null;
  return `${w} × ${h}`;
}

export const StudioFooter: React.FC<StudioFooterProps> = ({
  device,
  zoom,
  selectedElement,
  onOpenStructure,
}) => {
  const fourToolRail = getEditorViewMode().fourToolRail;

  const label = selectedElement
    ? `${cap(selectedElement.type)}${selectedElement.tagName ? ` · ${selectedElement.tagName}` : ""}`
    : "body";
  const dims = elementDims(selectedElement?.id);
  const deviceLabel = DEVICE_LABEL[device] ?? cap(device);

  return (
    <>
      {fourToolRail && onOpenStructure && (
        <Button
          color="light"
          onClick={onOpenStructure}
          aria-label="Page structure"
          className="tw:inline-flex tw:items-center tw:gap-[4px] tw:px-[6px] tw:py-[2px] tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:border-transparent tw:bg-transparent tw:hover:text-gray-900"
        >
          <ListTree size={14} />
          Structure
        </Button>
      )}
      <span
        className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis"
        title={label}
        data-testid="footer-selection-label"
      >
        {label}
      </span>
      {dims && (
        <span
          className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap"
          data-testid="footer-selection-dims"
        >
          {dims}
        </span>
      )}
      <span className="tw:flex-1 tw:min-w-px" />
      <span
        className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap"
        data-testid="footer-device-zoom"
      >
        {deviceLabel} · {Math.round(zoom)}%
      </span>
    </>
  );
};

export default StudioFooter;
