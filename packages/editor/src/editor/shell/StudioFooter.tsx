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
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
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
    /* A rename that just happened wins; otherwise the name is the element's
       own data (saved with the project — G2-061). */
    if (renamed && renamed.id === selectedElement.id) return renamed.name;
    return getLayerName(composer?.elements.getElement(selectedElement.id)) ?? null;
  }, [selectedElement, pageId, renamed, composer]);

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
