/**
 * The Add panel's CMS rows (2L9 B5-D37 176:21119, D38 176:21523, D74
 * 189:21741):
 *  - on a collection page, "CMS fields · {Collection}" — "This page's record",
 *    one row per field the page can show; a row inserts the field's element
 *    after the insert target, bound to the page's record, selected, with an
 *    Undo receipt ("Excerpt inserted · bound to Blog");
 *  - on any page with collections, "Collection lists" — "List of {Collection}"
 *    builds a list bound to it whose card is ordinary editable elements, and
 *    "Collection list · blank" the catalog's unbound list.
 *
 * Drag-only (owner 2026-11-19): every row drags onto the canvas and inserts
 * where it drops; Enter / Space insert at the insert target; a pointer click
 * only shows the drag hint. The inserts themselves live in ../cmsInsert.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Row, useToast } from "@/editor/chrome-ui";
import { pageFieldPlan, type PageFieldPlan } from "@/editor/cms/createCollectionPage";
import { EVENTS } from "@/shared/constants/events";
import type { CMSCollection } from "@/shared/types/cms";
import { resolveInsertTarget } from "../insertTarget";
import { altFieldOf, CMS_INSERT_MIME, insertCmsField, insertCmsList, type CmsInsertPayload } from "../cmsInsert";
import { isPointerClick } from "./DragHint";

const dragCms = (e: React.DragEvent, payload: CmsInsertPayload) => {
  e.dataTransfer.setData(CMS_INSERT_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
};

/* 176:21119 / 189:21741: 12/600 heads, 12px muted notes at the 12 inset; a
   field row is 56 tall, name left and its kind in a second column at 132;
   a list is an outlined full-width button, the blank list a quiet one. */
const HEAD = "tw:m-0 tw:px-3 tw:pt-3 tw:text-[12px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:px-3 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const FIELD_NAME = "tw:w-[120px] tw:flex-none tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";
const LIST_BTN = "tw:mx-3 tw:mt-3 tw:h-8 tw:w-[calc(100%-24px)] tw:text-[13px] tw:font-medium";

/** What a plan row is, as the board names it ("Heading H1", "Image + title alt"). */
function kindLabel(collection: CMSCollection, p: PageFieldPlan): string {
  if (p.element === "image") {
    const alt = altFieldOf(collection);
    return alt ? `Image + ${alt.name.toLowerCase()} alt` : p.label;
  }
  if (p.element === "heading" || p.label === "Rich text") return p.label;
  return p.field.type === "date" || p.field.type === "datetime" ? "Text · date" : p.field.type === "textarea" ? "Paragraph" : "Text";
}

function useCollections(composer: Composer | null): CMSCollection[] {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    const evs = [EVENTS.PROJECT_LOADED, EVENTS.CMS_COLLECTION_BOUND, EVENTS.PAGE_CHANGED];
    evs.forEach((e) => composer.on(e, bump));
    void composer.cms?.collections?.initialize?.().then(bump);
    return () => evs.forEach((e) => composer.off(e, bump));
  }, [composer]);
  return composer?.cms?.collections?.getAllCollections?.() ?? [];
}

export function CmsAddSection({
  composer,
  onBlankList,
  onBlankListDragStart,
  onDragHint,
}: {
  composer: Composer | null;
  /** The catalog's own Collection list (unbound). */
  onBlankList: () => void;
  /** …dragged as the catalog row it is. */
  onBlankListDragStart?: (e: React.DragEvent) => void;
  /** A pointer click shows "Drag onto the canvas to add" (drag-only Add). */
  onDragHint: (anchor: HTMLElement) => void;
}) {
  const { addToast } = useToast();
  const collections = useCollections(composer);
  if (!composer || collections.length === 0) return null;

  const page = composer.elements.getActivePage?.();
  const templateId = page ? composer.cms.bindings.templateCollectionOf?.(page.id) : null;
  const template = templateId ? collections.find((c) => c.id === templateId) ?? null : null;
  const target = resolveInsertTarget(composer, "text");

  const insertField = async (collection: CMSCollection, p: PageFieldPlan) => {
    const at = resolveInsertTarget(composer, p.element);
    if (!at) return;
    const id = await insertCmsField(composer, collection, p, at);
    composer.history.flushPending();
    const undo = composer.history.captureUndo();
    const el = composer.elements.getElement(id);
    if (el) composer.selection.select(el);
    addToast({ description: `${p.field.name} inserted · bound to ${collection.name}`, tone: "info", action: { label: "Undo", onClick: () => undo?.() } });
  };

  const insertList = async (collection: CMSCollection) => {
    const at = resolveInsertTarget(composer, "collection-list");
    if (!at) return;
    const listId = await insertCmsList(composer, collection, at);
    composer.history.flushPending();
    const undo = composer.history.captureUndo();
    const list = composer.elements.getElement(listId);
    if (list) composer.selection.select(list);
    addToast({ description: `List of ${collection.name} inserted`, tone: "info", action: { label: "Undo", onClick: () => undo?.() } });
  };

  const where = target?.afterName ? `after ${target.afterName}` : "at end";

  return (
    <div data-testid="add-cms">
      {template && (
        <section data-testid="add-cms-fields">
          <p className={HEAD}>{`CMS fields · ${template.name}`}</p>
          <p className={NOTE}>This page’s record</p>
          {pageFieldPlan(template).map((p) => (
            <Row
              key={p.field.slug}
              size="tall"
              interactive
              draggable
              data-testid={`add-cms-field-${p.field.slug}`}
              onDragStart={(e) => dragCms(e, { collectionId: template.id, fieldSlug: p.field.slug })}
              onClick={(e) => (isPointerClick(e) ? onDragHint(e.currentTarget) : void insertField(template, p))}
            >
              <span className={FIELD_NAME}>{p.field.name}</span>
              <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{kindLabel(template, p)}</span>
            </Row>
          ))}
          {target && <p className={`${NOTE} tw:pt-1`}>{`Insert into ${target.parentName} · ${where}`}</p>}
        </section>
      )}
      <section data-testid="add-cms-lists">
        <p className={HEAD}>Collection lists</p>
        {target && <p className={NOTE}>{`Insert ${where}`}</p>}
        {collections.map((c) => (
          <Button
            key={c.id}
            color="light"
            size="xs"
            className={LIST_BTN}
            draggable
            data-testid={`add-cms-list-${c.slug}`}
            onDragStart={(e) => dragCms(e, { collectionId: c.id })}
            onClick={(e) => (isPointerClick(e) ? onDragHint(e.currentTarget) : void insertList(c))}
          >
            {`List of ${c.name}`}
          </Button>
        ))}
        <Button color="light" size="xs" className={`${LIST_BTN} tw:border-transparent tw:bg-transparent`} data-testid="add-cms-list-blank"
          draggable={Boolean(onBlankListDragStart)}
          onDragStart={onBlankListDragStart}
          onClick={(e) => (isPointerClick(e) ? onDragHint(e.currentTarget) : onBlankList())}
        >
          Collection list · blank
        </Button>
        <p className={`${NOTE} tw:pt-3`}>Each list uses ordinary editable elements.</p>
      </section>
    </div>
  );
}
