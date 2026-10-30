/**
 * Under a selected Collection list, what it shows (2L9 B5-D95 195:28058,
 * D88 193:25921): "6 of 6 Team records", or with a query "6 of 13 matching
 * records · current record excluded". Counted the way the canvas renders the
 * list (RepeaterRenderer): every status, the list's filter / sort / Skip, and
 * on a collection page the previewed record excluded when the list says so.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { applyCmsListQuery } from "@buildrik/shared/schemas/cmsConditions";
import { CMS_COLLECTION_LIMIT_MAX } from "@buildrik/shared/schemas/sites";
import { EVENTS } from "@/shared/constants/events";
import { Z_INDEX } from "@/shared/constants/canvas";
import { useCanvasElementBox } from "./SelectionLabel";

/** The caption for list `listId`, or null when it is not a bound list. */
export async function listCountCaption(composer: Composer, listId: string): Promise<string | null> {
  const binding = composer.cms.bindings.getCollectionBinding(listId);
  if (!binding || binding.repeat !== "children") return null;
  const collection = composer.cms.collections.getCollection(binding.collectionId);
  const { items } = await composer.cms.collections.queryContent({ collectionId: binding.collectionId, limit: CMS_COLLECTION_LIMIT_MAX });
  const page = composer.elements.getActivePage();
  const template = page ? composer.cms.bindings.templateCollectionOf(page.id) : null;
  const pageItem = template ? await composer.cms.bindings.getPreviewRecord(template) : null;
  const excludeId = binding.excludeCurrent && template === binding.collectionId ? (pageItem?.id ?? null) : null;
  const queried = Boolean(binding.filter || binding.skip || excludeId);
  const matching = queried
    ? applyCmsListQuery(items, { filter: binding.filter, skip: binding.skip, excludeId }, pageItem?.data ?? null).length
    : items.length;
  const shown = binding.limit ? Math.min(binding.limit, matching) : matching;
  if (!queried) return `${shown} of ${matching} ${collection?.name ?? ""} records`.replace(/ {2,}/g, " ");
  return `${shown} of ${matching} matching records${excludeId ? " · current record excluded" : ""}`;
}

export function ListCountCaption({
  composer,
  elementId,
  canvasRef,
}: {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const box = useCanvasElementBox(elementId, canvasRef);
  const [text, setText] = React.useState<string | null>(null);
  React.useEffect(() => {
    let live = true;
    const read = () => void listCountCaption(composer, elementId).then((t) => live && setText(t));
    read();
    const evs = [EVENTS.CMS_COLLECTION_BOUND, EVENTS.ELEMENT_UPDATED, EVENTS.PROJECT_CHANGED] as const;
    evs.forEach((e) => composer.on(e, read));
    return () => {
      live = false;
      evs.forEach((e) => composer.off(e, read));
    };
  }, [composer, elementId]);
  if (!box || !text) return null;
  return (
    <div
      data-testid="canvas-list-count"
      className="tw:pointer-events-none tw:whitespace-nowrap tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-ui)]"
      style={{ position: "absolute", left: box.left, top: box.top + box.height + 6, zIndex: Z_INDEX.floatingToolbar }}
    >
      {text}
    </div>
  );
}
