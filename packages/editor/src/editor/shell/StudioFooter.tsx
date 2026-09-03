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
import { useProjectLoading } from "./hooks/useProjectLoading";
import { loadMapFromStorage } from "../panels/layers/hooks/layersPersistence";
import { EVENTS } from "../../shared/constants/events";
import { ZOOM_PRESETS } from "../../shared/constants/canvas";

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
  /** Board 817:4723 — the percentage readout opens the zoom flyout. */
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

/** One flyout row: name on the left, its chord greyed on the right.
 *  `nowrap` is load-bearing — at the popover's default 180px "Zoom to
 *  selection" broke across two lines and the flyout stopped looking like the
 *  board's single-line list. */
const ZOOM_ROW =
  "tw:flex tw:w-full tw:h-7 tw:min-h-0 tw:items-center tw:justify-between tw:gap-6 tw:rounded tw:border-0 " +
  "tw:px-3 tw:py-0 tw:text-xs tw:font-medium tw:leading-5 tw:whitespace-nowrap tw:bg-transparent " +
  "tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-100)]";
const ZOOM_KEY = "tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]";

export const StudioFooter: React.FC<StudioFooterProps> = ({
  composer,
  device,
  zoom,
  onZoomChange,
  selectedElement,
  onOpenStructure,
}) => {
  const fourToolRail = getEditorViewMode().fourToolRail;
  /* Board 65:412 puts "Loading…" in this slot while the site is arriving.
     Without it the footer says "body" — the same thing it says about a
     finished, genuinely empty page. */
  const projectLoading = useProjectLoading(composer);

  /* Boards 52:10 and 65:2 both print `{Type} · {name}` — "Section · Hero".
     This printed `{Type} · {tagName}`, so a named section read "Container ·
     div": the tag, which the user never chose and cannot act on, in the slot
     meant to say WHICH element they are holding. Names live in the layers
     panel's per-page store, which is where the layer tree reads them from
     too, so the two surfaces cannot disagree. */
  const pageId = composer?.elements?.getActivePage?.()?.id;
  const [renamed, setRenamed] = React.useState<{ id: string; name: string | null } | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onRenamed = (p: { id: string; name: string | null }) => setRenamed(p);
    composer.on(EVENTS.ELEMENT_RENAMED, onRenamed);
    return () => {
      composer.off(EVENTS.ELEMENT_RENAMED, onRenamed);
    };
  }, [composer]);

  const customName = React.useMemo(() => {
    if (!selectedElement || !pageId) return null;
    /* A rename that just happened wins over the store: the panel persists in
       an effect, so reading storage in the same tick would return the name
       the user just replaced. */
    if (renamed && renamed.id === selectedElement.id) return renamed.name;
    return loadMapFromStorage(pageId).get(selectedElement.id) ?? null;
  }, [selectedElement, pageId, renamed]);

  /* Board 66:4 (Multi-select): "3 elements selected". The prop carries ONE
     element — the shell's primary — so a three-element selection printed the
     name of one of the three, with nothing anywhere in the status bar to say
     the other two would move with it. The count comes from the engine, which
     is the only thing that knows. */
  const [selectionCount, setSelectionCount] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setSelectionCount(composer.selection?.getSelectedIds?.().length ?? 0);
    sync();
    /* SELECTION_ADDED / _REMOVED are the ones multi-select actually fires —
       addToSelection emits neither SELECTION_CHANGED nor ELEMENT_SELECTED
       (SelectionManager:70), so a subscription to the obvious two names sees
       nothing while three elements are selected. */
    const EVENTS_WATCHED = [
      EVENTS.SELECTION_CHANGED,
      EVENTS.SELECTION_ADDED,
      EVENTS.SELECTION_REMOVED,
      EVENTS.ELEMENT_SELECTED,
      EVENTS.SELECTION_CLEARED,
    ] as const;
    for (const evt of EVENTS_WATCHED) composer.on(evt, sync);
    return () => {
      for (const evt of EVENTS_WATCHED) composer.off(evt, sync);
    };
  }, [composer]);

  /* "Nothing selected" per board 65:2, which is the only board that draws
     this slot with an empty selection — 52:10, the footer's own board, draws
     a selected element. The previous "body" contradicted the inspector
     standing beside it ("Select something on the canvas to edit it") by
     naming an element nobody had chosen. */
  const label = projectLoading
    ? "Loading…"
    : selectionCount > 1
      ? `${selectionCount} elements selected`
      : selectedElement
        ? `${cap(selectedElement.type)}${customName ? ` · ${customName}` : ""}`
        : "Nothing selected";
  const dims = elementDims(selectedElement?.id);
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
      <div className="tw:relative" ref={zoomRef}>
        <Button
          color="light"
          onClick={() => setZoomOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={zoomOpen}
          aria-label={`Zoom: ${Math.round(zoom)} percent`}
          className="tw:border-transparent tw:bg-transparent tw:px-[6px] tw:py-[2px] tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap tw:hover:text-[var(--bk-ink)]"
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
            <Button color="light" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_FIT)}>
              <span>Zoom to fit</span>
              <span className={ZOOM_KEY}>⌘1</span>
            </Button>
            <Button color="light" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_SELECTION)}>
              <span>Zoom to selection</span>
              <span className={ZOOM_KEY}>⌘2</span>
            </Button>
            <Button color="light" className={ZOOM_ROW} onClick={pick(100)}>
              <span>Zoom to 100%</span>
              <span className={ZOOM_KEY}>⌘0</span>
            </Button>
            <div className="tw:my-1 tw:h-px tw:bg-[var(--bk-gray-200)]" />
            {ZOOM_PRESETS.map((preset) => (
              <Button
                key={preset}
                color="light"
                onClick={pick(preset)}
                className={`${ZOOM_ROW} tw:justify-end ${
                  Math.round(zoom) === preset
                    ? "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)]"
                    : ""
                }`}
              >
                {preset}%
              </Button>
            ))}
            <div className="tw:my-1 tw:h-px tw:bg-[var(--bk-gray-200)]" />
            <Button color="light" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_IN)}>
              <span>Zoom in</span>
              <span className={ZOOM_KEY}>⌘+</span>
            </Button>
            <Button color="light" className={ZOOM_ROW} onClick={emitZoom(EVENTS.ZOOM_OUT)}>
              <span>Zoom out</span>
              <span className={ZOOM_KEY}>⌘−</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudioFooter;
