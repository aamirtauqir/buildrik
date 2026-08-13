/**
 * Canvas Breadcrumb Component
 * Fixed bar at bottom of canvas showing current selection path
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import { Button } from "@/editor/chrome-ui";
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

/* bottom-14, not bottom-0: the floating footer toolbar overlaps the canvas
   wrapper's last 40px, and live check showed it covering the bar's lower 16px
   — the scrim survived as a 12px tinted sliver nobody would read as a
   breadcrumb. */
const BAR =
  "tw:absolute tw:bottom-14 tw:left-0 tw:right-0 tw:flex tw:items-center tw:gap-2 " +
  "tw:px-3 tw:py-1.5 tw:bg-[rgba(17,24,39,0.5)] tw:backdrop-blur-sm";

/* Flowbite's Button theme sets h-10 / justify-center / font-medium and beats
   plain tw: utilities, so the board's 10px pill has to restate geometry,
   padding and border here rather than rely on defaults. */
const SEG_BASE =
  "tw:shrink-0 tw:h-auto tw:rounded tw:px-1.5 tw:py-[3px] tw:text-[10px] tw:leading-none " +
  "tw:whitespace-nowrap tw:border-0 tw:font-normal tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const SEG =
  SEG_BASE + " tw:bg-white tw:text-[color:var(--bk-ink-muted)] tw:cursor-pointer " +
  "disabled:tw:cursor-default";
const SEG_CURRENT =
  SEG_BASE + " tw:bg-[color:var(--bk-accent)] tw:text-[color:var(--bk-accent-on)] tw:font-medium";
const SEP = "tw:shrink-0 tw:text-[10px] tw:text-[color:var(--bk-ink-muted)]";
const HINTS =
  "tw:ml-auto tw:flex tw:shrink-0 tw:gap-3 tw:text-[9px] tw:text-[color:var(--bk-gray-400)]";

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

    const path: BreadcrumbSegmentData[] = [];

    // Build ancestor chain
    let currentElement: ReturnType<typeof composer.elements.getElement> | null =
      composer.elements.getElement(selectedId);
    while (currentElement) {
      const type =
        currentElement.getType?.() || currentElement.getTagName?.()?.toLowerCase() || "element";
      const currentId = currentElement.getId?.() || "";
      path.unshift({
        id: currentId,
        name: getElementName(type, currentElement.getTagName?.()?.toLowerCase()),
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
    <div className={BAR} style={{ zIndex: Z_LAYERS.floatingToolbar }}>
      <div className="tw:flex tw:items-center tw:gap-2 tw:overflow-hidden">
        {segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {index > 0 && <span className={SEP}>&rsaquo;</span>}
            <Button
              type="button"
              color="light"
              className={segment.isCurrent ? SEG_CURRENT : SEG}
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
