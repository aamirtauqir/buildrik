/**
 * useCmsBinding — everything the Content tab's binding surfaces read and
 * write for one element (2L9 Play F2.02 / F2.05 / F2.16, boards B5-D01…D15):
 * the element's one CMS binding, the record it shows, its status, and the
 * writes (bind, change record, fallback, unbind). The property row, the
 * Choose source picker, the binding detail and the Dynamic bindings summary
 * all read this one hook, so they never disagree.
 *
 * Which record a binding shows depends on WHERE the element is (BD-09 /
 * CMS-04, §5b.2): inside a Collection list of that collection → each copy's
 * own ("list"); on that collection's template page → each generated page's
 * ("template"); anywhere else one specific record, named on the binding
 * ("record"). Bind and unbind are one undo step each; unbinding keeps the
 * value on screen (P-2); every write passes the lock gate first (P-1).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import { EVENTS } from "@/shared/constants";
import { cmsTextOf } from "@buildrik/shared/schemas/cms";
import { canWrite } from "@/engine/commands/commandOperations";
import { pageFileNames } from "@/engine/export";
import { FIELD_TYPE_LABEL } from "@/editor/cms/fieldTypes";

export type BoundProperty = "src" | "href" | "content";
export type RecordContext = "list" | "template" | "record";

/** Which property of the element a field fills. */
function boundProperty(type: string | undefined): BoundProperty {
  if (type === "image") return "src";
  if (type === "link") return "href";
  return "content";
}

/** How a property is named on its row and in "{Property} binding". */
export const PROPERTY_LABEL: Record<BoundProperty, string> = { content: "Text", src: "Image", href: "Link" };

/** The field types that can fill each property. */
export const FIELD_TYPES_FOR: Record<BoundProperty, ReadonlySet<CMSFieldType>> = {
  src: new Set(["image", "file", "url"]),
  href: new Set(["url", "email", "file", "text"]),
  content: new Set(["text", "textarea", "richtext", "number", "date", "datetime", "select", "multiselect", "email", "url", "slug"]),
};

export interface BindingPreview {
  value: string;
  record: CMSContentItem | null;
  /** Place among the published records; -1 = a pinned record that is not published. */
  index: number;
  total: number;
}

/** What the "Binding status" row says (B5-D11…D15); null = nothing to say. */
export type BindingStatus =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "field-missing" }
  | { kind: "incompatible"; type: string }
  | { kind: "empty-fallback"; fallback: string };

export interface CmsBindingState {
  property: BoundProperty;
  collections: CMSCollection[];
  binding: {
    collectionId: string;
    fieldSlug: string;
    itemId?: string;
    fallback?: string;
    collectionName?: string;
  } | null;
  /** The bound collection was deleted. */
  missing: boolean;
  collection: CMSCollection | null;
  field: CMSField | null;
  /** Where the bound record comes from, for the bound collection. */
  context: RecordContext;
  /** All records of the bound collection (for the Specific record pick). */
  records: CMSContentItem[];
  preview: BindingPreview | null;
  status: BindingStatus | null;
  /** The collection whose template page this is, if any. */
  templateCollection: CMSCollection | null;
  /** The collection of the Collection list this element sits in, if any. */
  listCollection: CMSCollection | null;
  bind: (collectionId: string, fieldSlug: string) => void;
  setRecord: (itemId: string) => void;
  setFallback: (fallback: string) => void;
  unbind: () => void;
  retry: () => void;
}

/** The collection list (repeat: children) an element sits inside, if any. */
function listCollectionId(composer: Composer, elementId: string): string | null {
  for (let up = composer.elements.getElement(elementId)?.getParent?.() ?? null; up; up = up.getParent?.() ?? null) {
    const list = composer.cms.bindings.getCollectionBinding?.(up.getId());
    if (list?.repeat === "children") return list.collectionId;
  }
  return null;
}

/** The collection whose template page is the active page, if any. */
function templateCollectionId(composer: Composer, collections: CMSCollection[]): string | null {
  const page = composer.elements.getActivePage?.();
  const file = page ? pageFileNames(composer.elements.getAllPages()).get(page.id) : undefined;
  return (file && collections.find((c) => c.pageTemplatePath === file)?.id) || null;
}

export function useCmsBinding(composer: Composer | null | undefined, elementId: string): CmsBindingState {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setTick((t) => t + 1);
    const evs = [EVENTS.BINDING_CREATED, EVENTS.BINDING_REMOVED, EVENTS.CMS_CONTENT_UPDATED, EVENTS.CMS_COLLECTION_UPDATED, EVENTS.PROJECT_LOADED];
    evs.forEach((e) => composer.on(e, bump));
    /* Collections are created / deleted on the CMS store's own emitter. */
    const store = composer.cms?.collections;
    const storeEvs = [EVENTS.CMS_COLLECTION_CREATED, EVENTS.CMS_COLLECTION_DELETED, EVENTS.CMS_STORE_REFRESHED];
    storeEvs.forEach((e) => store?.on?.(e, bump));
    return () => {
      evs.forEach((e) => composer.off(e, bump));
      storeEvs.forEach((e) => store?.off?.(e, bump));
    };
  }, [composer]);

  const binding = composer?.cms?.bindings?.getBindings?.(elementId)?.[0] ?? null;
  const collections: CMSCollection[] = composer?.cms?.collections?.getAllCollections?.() ?? [];
  const missing = Boolean(binding) && !collections.some((c) => c.id === binding?.collectionId);
  const collection = binding && !missing ? collections.find((c) => c.id === binding.collectionId) ?? null : null;
  const property = boundProperty(composer?.elements.getElement(elementId)?.getType?.());
  const field = collection && binding ? collection.fields.find((f) => f.slug === binding.fieldSlug) ?? null : null;

  const { listCollection, templateCollection } = React.useMemo(() => {
    if (!composer?.cms) return { listCollection: null, templateCollection: null };
    const listId = listCollectionId(composer, elementId);
    const templateId = templateCollectionId(composer, collections);
    return {
      listCollection: collections.find((c) => c.id === listId) ?? null,
      templateCollection: collections.find((c) => c.id === templateId) ?? null,
    };
  }, [composer, elementId, collections, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextFor = React.useCallback(
    (collectionId: string): RecordContext =>
      listCollection?.id === collectionId ? "list" : templateCollection?.id === collectionId ? "template" : "record",
    [listCollection, templateCollection],
  );
  const context: RecordContext = collection ? contextFor(collection.id) : "record";

  const [records, setRecords] = React.useState<CMSContentItem[]>([]);
  const [preview, setPreview] = React.useState<BindingPreview | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    setFailed(false);
    if (!composer || !collection || !binding) {
      setRecords([]);
      setPreview(null);
      return;
    }
    const { itemId, fieldSlug } = binding;
    setPreview(null);
    /* Every record, not queryContent's 50-row page: a pinned record is found
       by id wherever it sits, as publish finds it (EDT-003). */
    void composer.cms.collections
      .getContentItems(collection.id)
      .then((rows) => {
        if (!live) return;
        setRecords(rows);
        const items = rows.filter((r) => r.status === "published");
        const found = itemId && itemId !== "context" ? items.findIndex((i) => i.id === itemId) : 0;
        /* A pinned record that isn't published publishes nothing — say so,
           never preview another record in its place. */
        if (found < 0) return setPreview({ value: "", record: null, index: -1, total: items.length });
        const record = items[found] ?? null;
        setPreview({ value: cmsTextOf(record?.data[fieldSlug]), record, index: found, total: items.length });
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [composer, collection?.id, binding?.fieldSlug, binding?.itemId, tick, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const status: BindingStatus | null = !binding || missing
    ? null
    : !field
      ? { kind: "field-missing" }
      : !FIELD_TYPES_FOR[property].has(field.type)
        ? { kind: "incompatible", type: FIELD_TYPE_LABEL[field.type] ?? field.type }
        : failed
          ? { kind: "failed" }
          : !preview
            ? { kind: "loading" }
            : preview.index >= 0 && !preview.value && binding.fallback
              ? { kind: "empty-fallback", fallback: binding.fallback }
              : null;

  /* P-1: binding rewrites the element's content — lock gate first. */
  const writable = () => (composer ? canWrite(composer, elementId) : false);

  const bind = (collectionId: string, fieldSlug: string) => {
    const target = collections.find((c) => c.id === collectionId);
    const f = target?.fields.find((x) => x.slug === fieldSlug);
    if (!composer || !target || !f || !writable()) return;
    const write = (rows: CMSContentItem[]) => {
      /* Outside a list or the template page the binding names its record:
         the one already pinned, else the newest published one — explicitly. */
      const pinned = binding?.collectionId === collectionId && binding.itemId && binding.itemId !== "context" ? binding.itemId : "";
      const itemId =
        contextFor(collectionId) === "record" ? pinned || rows.find((r) => r.status === "published")?.id || rows[0]?.id : undefined;
      // Replaces any binding on this property — one undo step (P-2).
      composer.cms.bindings.bindToField(elementId, collectionId, itemId, fieldSlug, property, binding?.fallback, `Bind ${f.name}`);
    };
    if (contextFor(collectionId) === "record") void composer.cms.collections.getContentItems(collectionId).then(write);
    else write([]);
  };

  const rebind = (itemId: string | undefined, fallback: string | undefined, label: string) => {
    if (!composer || !binding || !collection || !writable()) return;
    composer.cms.bindings.bindToField(elementId, collection.id, itemId, binding.fieldSlug, property, fallback, label);
  };

  return {
    property,
    collections,
    binding,
    missing,
    collection,
    field,
    context,
    records,
    preview,
    status,
    templateCollection,
    listCollection,
    bind,
    setRecord: (itemId) => rebind(itemId || undefined, binding?.fallback, "Choose record"),
    setFallback: (fallback) => rebind(binding?.itemId, fallback.trim() || undefined, "Set fallback"),
    unbind: () => {
      if (!composer || !binding || !writable()) return;
      composer.cms.bindings.unbindAll(elementId, `Unbind ${field?.name ?? binding.fieldSlug}`);
    },
    retry: () => setAttempt((n) => n + 1),
  };
}
