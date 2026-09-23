/**
 * Canvas Breadcrumb Component
 * Fixed bar at bottom of canvas showing current selection path
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import { Button } from "@/editor/chrome-ui";
import { loadMapFromStorage } from "../../panels/layers/hooks/layersPersistence";
import type { Composer } from "../../../engine";

export interface CanvasBreadcrumbProps {
  composer: Composer;
  selectedId: string | null;
  onSelectElement: (elementId: string) => void;
}

interface BreadcrumbSegmentData {
  id: string;
  name: string;
  type: string;
  isCurrent: boolean;
}

/** Get friendly element name */
function getElementName(type: string, tagName?: string): string {
  const typeMap: Record<string, string> = {
    container: "Container",
    section: "Section",
    row: "Row",
    column: "Column",
    heading: "Heading",
    paragraph: "Paragraph",
    text: "Text",
    image: "Image",
    button: "Button",
    link: "Link",
    video: "Video",
    form: "Form",
    div: "Div",
    span: "Span",
    nav: "Nav",
    header: "Header",
    footer: "Footer",
  };
  const normalized = type.toLowerCase();
  return typeMap[normalized] || tagName || type;
}

/* bottom-14, not bottom-0: the floating footer toolbar overlaps the last
   forty pixels of the canvas wrapper, and live check showed it covering the
   bar's lower 16px — the scrim survived as a 12px tinted sliver nobody would
   read as a breadcrumb. */
/* `rounded-lg` — 1175:4849 draws the bar as a radius-8 pill. It shipped square
   and full-bleed; the board's own frame is 720 wide, i.e. a floating bar, which
   is a layout call this pass did not take (see the recipe note). */
const BAR =
  "tw:absolute tw:bottom-14 tw:left-0 tw:right-0 tw:flex tw:items-center tw:gap-2 " +
  "tw:px-3 tw:py-1.5 tw:rounded-lg tw:bg-[rgba(17,24,39,0.75)] tw:backdrop-blur-sm";

/* Flowbite's Button theme sets h-10 / justify-center / font-medium and beats
   plain tw: utilities, so the board's 10px pill has to restate geometry,
   padding and border here rather than rely on defaults. */
/* 10px — 1175:4851 / 4854 / 4857 / 4860 all state it, and the pills are white,
   so `--bk-ink-muted` on them is 4.83:1 at any size in this range. The 11px
   floor of the type ramp is a CHROME rule; this is a canvas overlay label
   inside a 20px pill. */
const SEG_BASE =
  "tw:shrink-0 tw:h-auto tw:rounded tw:px-1.5 tw:py-[3px] tw:text-[11px] tw:leading-[normal] " +
  "tw:whitespace-nowrap tw:border-0 tw:font-normal tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
/* `disabled:bg-white` is load-bearing, not defensive. The `Canvas` root
   segment is rendered `disabled` (there is nowhere above it to go), and
   flowbite's disabled variant paints gray-100 — a variant beats a plain
   `bg-*` utility whatever twMerge does with the base, so the first pill in the
   bar came out grey against 1175:4850's white. Same class of defect as the
   DSModeToggle hover that repainted the selected segment. */
const SEG =
  SEG_BASE + " tw:bg-white tw:disabled:bg-white tw:text-[color:var(--bk-ink-muted)] tw:cursor-pointer " +
  "disabled:tw:cursor-default";
const SEG_CURRENT =
  SEG_BASE + " tw:bg-[color:var(--bk-accent)] tw:text-[color:var(--bk-accent-on)] tw:font-medium";
/* This comment used to claim gray-400 "measures 6.99:1 against the same bar".
   It measures 1.34:1, and the reason is worth keeping: the bar is ink at 50%
   over THE CANVAS, and the canvas is light, so it composites to #888C93 — a
   mid grey, not the dark bar the number assumed. gray-400 on mid grey is very
   nearly invisible. (A dark canvas only darkens the bar, so white is the worst
   case and the one to compute against.)
   Measured, not assumed: at 0.75 the bar composites to #4D525D, where gray-300
   is 5.32:1 and clears AA while staying translucent and staying dimmer than
   white, which is what these secondary labels are for. `--bk-ink-muted` is
   tuned for a light panel and is not a candidate here at any alpha. */
const SEP = "tw:shrink-0 tw:text-[length:var(--bk-text-11)] tw:text-[color:var(--bk-gray-300)]";
/* Was 9px. The type ramp bottoms out at `--bk-text-11`, and these are the two
   controls that move the selection up and down the tree — not decoration. */
const HINTS =
  "tw:ml-auto tw:flex tw:shrink-0 tw:gap-3 tw:text-[length:var(--bk-text-11)] " +
  "tw:text-[color:var(--bk-gray-300)]";

export const CanvasBreadcrumb: React.FC<CanvasBreadcrumbProps> = ({
  composer,
  selectedId,
  onSelectElement,
}) => {
  const [segments, setSegments] = React.useState<BreadcrumbSegmentData[]>([]);

  // Build breadcrumb path
  React.useEffect(() => {
    if (!selectedId) {
      setSegments([]);
      return;
    }

    /* Board 1175:4849 labels a named element "Section · Hero" — the type says
       what it is, the name says which one. Without the name every container
       in a page of containers reads the same, which is exactly when a
       breadcrumb is worth having. Names come from the Layers panel's store,
       the same source the status bar reads. */
    const pageId = composer.elements?.getActivePage?.()?.id ?? "";
    const names = pageId ? loadMapFromStorage(pageId) : new Map<string, string>();

    const path: BreadcrumbSegmentData[] = [];

    // Build ancestor chain
    let currentElement: ReturnType<typeof composer.elements.getElement> | null =
      composer.elements.getElement(selectedId);
    while (currentElement) {
      const type =
        currentElement.getType?.() || currentElement.getTagName?.()?.toLowerCase() || "element";
      const currentId = currentElement.getId?.() || "";
      const typeName = getElementName(type, currentElement.getTagName?.()?.toLowerCase());
      const custom = names.get(currentId);
      path.unshift({
        id: currentId,
        name: custom ? `${typeName} · ${custom}` : typeName,
        type,
        isCurrent: currentId === selectedId,
      });

      currentElement = currentElement.getParent();
    }

    // Add "Canvas" as root
    path.unshift({
      id: "canvas-root",
      name: "Canvas",
      type: "canvas",
      isCurrent: false,
    });

    setSegments(path);
  }, [composer, selectedId]);

  if (!selectedId || segments.length === 0) {
    return null;
  }

  return (
    // z from the registry, not a tw: utility — the Emotion version this
    // replaced sat at Z_LAYERS.floatingToolbar (3001), and the rebuild's
    // tw:z-30 painted the whole bar UNDER the canvas. checkVisibility said
    // true, the rect was right, elementFromPoint returned the canvas: only
    // the live screenshot showed an empty strip.
    <div className={BAR} data-testid="canvas-crumb-bar" style={{ zIndex: Z_LAYERS.floatingToolbar }}>
      <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
        {segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {index > 0 && <span className={SEP}>&rsaquo;</span>}
            <Button
              type="button"
              color="light"
              className={segment.isCurrent ? SEG_CURRENT : SEG}
              /* ONE template, not a ternary between a literal and a
                 template: `check-anchors` resolves a derived id through the
                 text before the interpolation, and a bare literal in the other
                 branch hides the template from it. `current` is a position in
                 the path like any index. */
              data-testid={`canvas-crumb-seg-${segment.isCurrent ? "current" : index}`}
              onClick={() => {
                if (segment.id !== "canvas-root" && !segment.isCurrent) {
                  onSelectElement(segment.id);
                }
              }}
              disabled={segment.id === "canvas-root"}
            >
              {segment.name}
            </Button>
          </React.Fragment>
        ))}
      </div>

      {/* The keys named here are the ones useCanvasKeyboard actually binds. */}
      <div className={HINTS}>
        <span>&larr; Parent</span>
        <span>&rarr; Child</span>
      </div>
    </div>
  );
};

export default CanvasBreadcrumb;
