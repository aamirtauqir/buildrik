/**
 * DimmedNotice — 2L9 147:78900: the selected element is dimmed in the editor
 * (the Layers eye), which changes nothing on the live site. Above the tabs:
 *
 *   Dimmed in editor only
 *   Text is still included on the live site.
 *   [ Show normally ]
 *   Hide on live site…
 *
 * Driven by the real dimmed state: the canvas node's `data-hidden` flag
 * (`useCanvasEditorFlags` sets it from the Layers panel's stored set), watched
 * so a toggle in Layers shows or clears the notice at once; with no canvas
 * node, the stored set itself. "Show normally" asks the Layers panel — the
 * owner of the dimmed set — to un-dim it; "Hide on live site…" goes to
 * Behavior › Visibility, the setting that does hide it on the site.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { getDOMElement } from "@/engine/canvas/resize/utils";
import { getLayerName, loadSetFromStorage } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";

function readDimmed(composer: Composer | null | undefined, elementId: string): boolean {
  const node = getDOMElement(elementId);
  if (node) return node.getAttribute("data-hidden") === "true";
  const pageId = composer?.elements?.getActivePage?.()?.id;
  return pageId ? loadSetFromStorage(pageId, "hidden").has(elementId) : false;
}

/** Whether the element is dimmed in the editor, kept current. */
function useDimmed(composer: Composer | null | undefined, elementId: string): boolean {
  const [dimmed, setDimmed] = React.useState(() => readDimmed(composer, elementId));
  React.useEffect(() => {
    const read = () => setDimmed(readDimmed(composer, elementId));
    read();
    /* The flag lands on the canvas node; the node is rebuilt with the canvas
       HTML, so watch the canvas subtree for it rather than one node. */
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(read);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-hidden"], childList: true });
    return () => observer.disconnect();
  }, [composer, elementId]);
  return dimmed;
}

export interface DimmedNoticeProps {
  composer: Composer | null | undefined;
  elementId: string;
  /** Behavior › Visibility. */
  onHideOnLiveSite: () => void;
}

export function DimmedNotice({ composer, elementId, onHideOnLiveSite }: DimmedNoticeProps) {
  const dimmed = useDimmed(composer, elementId);
  if (!dimmed) return null;
  const el = composer?.elements?.getElement?.(elementId);
  const name = el ? (getLayerName(el) ?? elementTypeLabel(el.getType())) : "This element";
  return (
    <div role="status" className="tw:flex tw:flex-col tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:py-3" data-testid="inspector-dimmed-notice">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <p className="tw:m-0 tw:text-[12px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Dimmed in editor only</p>
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{name} is still included on the live site.</p>
      </div>
      <Button
        color="light"
        size="xs"
        className={`${WIDE_BUTTON} tw:w-auto! tw:self-start tw:px-4`}
        onClick={() => composer?.emit(EVENTS.LAYER_SHOW_NORMALLY_REQUESTED, { id: elementId })}
        data-testid="inspector-dimmed-show"
      >
        Show normally
      </Button>
      <Button
        variant="link"
        size="xs"
        className="tw:h-6 tw:self-start tw:px-5 tw:text-[12px] tw:font-normal"
        onClick={onHideOnLiveSite}
        data-testid="inspector-dimmed-hide-live"
      >
        Hide on live site…
      </Button>
    </div>
  );
}
