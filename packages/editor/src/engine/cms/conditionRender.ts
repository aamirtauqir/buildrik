/**
 * Element conditions (B-11) applied to rendered HTML — the canvas preview and
 * the export / publish render share these two passes (design note
 * docs/design-2l9/engine-conditions.md):
 *
 *   applyCopyConditions — inside one Collection list copy, against that
 *     copy's record (RepeaterRenderer.expandChildren);
 *   applyPageConditions — everything else, against the template page's
 *     record: on the canvas and in a preview the page's preview record (the
 *     first published, the record `resolveBinding` previews); in a publish of
 *     a template page, written as `data-bk-if` for the server to evaluate per
 *     generated page (REQUESTS B-26).
 *
 * Canvas: a failing element stays, marked `data-bk-condition="hidden"` (drawn
 * as a ghost). Export: a failing element is removed — absent from the
 * published HTML, not display:none. An element with no record to read (a
 * plain page) is left as it is.
 *
 * @license BSD-3-Clause
 */
import {
  CMS_CONDITION_ATTR,
  encodeCmsCondition,
  evaluateCmsCondition,
} from "@buildrik/shared/schemas/cmsConditions";
import type { CMSCollection } from "@/shared/types/cms";
import type { Composer } from "../Composer";
import { pageFileNames } from "../export/pageFiles";

/** Canvas marker; also how the page pass knows a list copy already decided. */
export const CONDITION_STATE_ATTR = "data-bk-condition";

type Bindings = Composer["cms"]["bindings"];

const idOf = (el: Element) => el.getAttribute("data-buildrick-id") ?? "";

/** Decide one element: canvas marks, export keeps or removes. */
function decide(el: Element, pass: boolean, canvas: boolean): void {
  el.setAttribute(CONDITION_STATE_ATTR, pass ? "shown" : "hidden");
  if (!canvas && !pass) el.remove();
}

/**
 * The conditions inside one list copy (`node`) that belong to this list —
 * not to a list nested in it — against the copy's record.
 */
export function applyCopyConditions(
  node: HTMLElement,
  listEl: HTMLElement,
  data: Record<string, unknown>,
  bindings: Bindings,
  canvas: boolean,
  pageRecord?: Record<string, unknown> | null,
): void {
  if (!bindings.hasConditions?.()) return;
  const isList = (el: Element) => bindings.getCollectionBinding?.(idOf(el))?.repeat === "children";
  const candidates = [node, ...Array.from(node.querySelectorAll<HTMLElement>("[data-buildrick-id]"))];
  for (const el of candidates) {
    const condition = bindings.getCondition?.(idOf(el));
    if (!condition) continue;
    let nested = false;
    for (let up = el.parentElement; up && up !== listEl; up = up.parentElement) if (isList(up)) nested = true;
    if (nested) continue;
    decide(el, evaluateCmsCondition(condition, data, pageRecord), canvas);
  }
}

/** The collection whose template page `file` is, if any. */
export function templateCollectionFor(composer: Composer, file: string | undefined): CMSCollection | null {
  if (!file) return null;
  return composer.cms?.collections?.getAllCollections?.().find((c) => c.pageTemplatePath === file) ?? null;
}

/** The active page's published file name (the canvas's page). */
export function activePageFile(composer: Composer): string | undefined {
  /* `?.`: several suites hand the renderer a partial composer. */
  const page = composer.elements?.getActivePage?.();
  return page && composer.elements.getAllPages ? pageFileNames(composer.elements.getAllPages()).get(page.id) : undefined;
}

/** The record a template page previews: the record bar's choice
 *  (getPreviewRecord, 173:12022), else its first published record. */
export async function previewItemOf(composer: Composer, collectionId: string): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const bindings = composer.cms?.bindings;
  if (bindings?.getPreviewRecord) return (await bindings.getPreviewRecord(collectionId)) ?? null;
  return (await composer.cms.collections.queryContent({ collectionId, status: "published", filter: {} })).items[0] ?? null;
}

async function previewRecordOf(composer: Composer, collectionId: string): Promise<Record<string, unknown> | null> {
  return (await previewItemOf(composer, collectionId))?.data ?? null;
}

export interface PageConditionOptions {
  canvas: boolean;
  /** The page being exported (pageFileNames); absent on the canvas — the active page. */
  pageFile?: string;
  /** Publish of a template page: hand the condition to the server per record. */
  perRecordOnServer?: boolean;
}

/** Conditions not already decided by a list copy. */
export async function applyPageConditions(doc: Document, composer: Composer, options: PageConditionOptions): Promise<void> {
  const bindings = composer.cms?.bindings;
  if (!bindings?.hasConditions?.()) return;
  const pending = Array.from(doc.querySelectorAll("[data-buildrick-id]")).filter(
    (el) => !el.hasAttribute(CONDITION_STATE_ATTR) && bindings.getCondition(idOf(el)),
  );
  if (pending.length === 0) return;
  const template = templateCollectionFor(composer, options.pageFile ?? activePageFile(composer));
  if (!template) return;
  if (options.perRecordOnServer) {
    for (const el of pending) el.setAttribute(CMS_CONDITION_ATTR, encodeCmsCondition(bindings.getCondition(idOf(el))!));
    return;
  }
  const record = await previewRecordOf(composer, template.id);
  if (!record) return;
  for (const el of pending) decide(el, evaluateCmsCondition(bindings.getCondition(idOf(el))!, record), options.canvas);
}

/** Export: the canvas-only marker never ships. */
export function stripConditionState(doc: Document): void {
  doc.querySelectorAll(`[${CONDITION_STATE_ATTR}]`).forEach((el) => el.removeAttribute(CONDITION_STATE_ATTR));
}
