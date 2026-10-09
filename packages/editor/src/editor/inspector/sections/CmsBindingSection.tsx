/**
 * CmsBindingSection — Behaviour › CMS binding (boards 2, 24, 25; R-DD-17).
 *
 *   Source   [Static | From CMS]
 *   Collection [Menu ▾]            + New collection…
 *   Field    [name · Text ▾]       (only fields that can fill this element)
 *   Cacio e pepe (record 1 of 3)   Open record ›   Unbind
 *   Unbind keeps the text you see now
 *
 * Source missing (board 25): the bound collection was deleted — a red box
 * says so, with Reconnect… (pick a new collection + field; the pick replaces
 * the binding in one step) and Unbind.
 *
 * The binding names no record: it follows "the record on this page". On a
 * collection's template page the export fills it per record; elsewhere (and
 * on the canvas) it previews the first published record — the preview line
 * names which one. An image binds its source, a link its URL, anything else
 * its text. Bind and unbind are one undo step each, and unbinding keeps the
 * value on screen (P-2). Every write passes the lock gate first (P-1).
 *
 * Replaced the header BindingBanner: the header chip names the binding, this
 * section is where it changes.
 *
 * @license BSD-3-Clause
 */
import { ExternalLink } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import { EVENTS } from "@/shared/constants";
import { cmsTextOf } from "@buildrik/shared/schemas/cms";
import { ButtonGroup, Section, SelectRow, type SectionTier } from "../shared/controls";
import { canWrite } from "@/engine/commands/commandOperations";
import { ActionRow, NoteRow } from "./behaviourRows";
import { pageFileNames } from "@/engine/export";
import { recordTitle } from "@/editor/cms/RecordsTable";

export interface CmsBindingSectionProps {
  elementId: string;
  composer: Composer | null;
  onOpenCreateCollection?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

type BoundProperty = "src" | "href" | "content";

/** Which property of the element a field fills. */
function boundProperty(type: string | undefined): BoundProperty {
  if (type === "image") return "src";
  if (type === "link") return "href";
  return "content";
}

/** The field types that can fill each property ("Field filtered by type"). */
const FIELD_TYPES_FOR: Record<BoundProperty, ReadonlySet<CMSFieldType>> = {
  src: new Set(["image", "file", "url"]),
  href: new Set(["url", "email", "file", "text"]),
  content: new Set(["text", "textarea", "richtext", "number", "date", "datetime", "select", "multiselect", "email", "url", "slug"]),
};

const FIELD_TYPE_LABEL: Record<CMSFieldType, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  number: "Number",
  date: "Date",
  datetime: "Date & time",
  boolean: "Yes / no",
  select: "Option",
  multiselect: "Options",
  image: "Image",
  file: "File",
  reference: "Reference",
  color: "Colour",
  url: "URL",
  email: "Email",
  slug: "Slug",
};

const fieldOption = (f: CMSField) => ({ value: f.slug, label: `${f.slug} · ${FIELD_TYPE_LABEL[f.type] ?? f.type}` });

const SOURCE_OPTIONS = [
  { value: "static", label: "Static" },
  { value: "cms", label: "From CMS" },
];

interface Preview {
  value: string;
  record: CMSContentItem | null;
  index: number;
  total: number;
}

export const CmsBindingSection: React.FC<CmsBindingSectionProps> = ({ elementId, composer, onOpenCreateCollection, isOpen, onToggle, tier = "tertiary" }) => {
  const [tick, setTick] = React.useState(0);
  const [cmsChosen, setCmsChosen] = React.useState(false);
  const [reconnecting, setReconnecting] = React.useState(false);
  const [collectionId, setCollectionId] = React.useState("");
  const [preview, setPreview] = React.useState<Preview | null>(null);

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
  React.useEffect(() => {
    setCmsChosen(false);
    setReconnecting(false);
    setCollectionId("");
  }, [elementId]);

  const binding = composer?.cms?.bindings?.getBindings?.(elementId)?.[0] ?? null;
  const collections: CMSCollection[] = composer?.cms?.collections?.getAllCollections?.() ?? [];
  const missing = Boolean(binding) && !collections.some((c) => c.id === binding?.collectionId);
  /* The Collection pick is local until a Field is chosen: the binding stays
     on its own collection meanwhile, and the Field pick replaces it. */
  const activeCollectionId = collectionId || (missing ? "" : binding?.collectionId) || collections[0]?.id || "";
  const collection = collections.find((c) => c.id === activeCollectionId) ?? null;
  const boundHere = binding && !missing && binding.collectionId === activeCollectionId ? binding : null;
  const property = boundProperty(composer?.elements.getElement(elementId)?.getType?.());
  const fields = (collection?.fields ?? []).filter((f) => FIELD_TYPES_FOR[property].has(f.type));
  const field = boundHere ? collection?.fields.find((f) => f.slug === boundHere.fieldSlug) ?? null : null;
  const fromCms = Boolean(binding) || cmsChosen;

  /* BD-09 / CMS-04 — which record the element shows, by context (§5b.2):
     inside a Collection list of this collection → each copy's own record;
     on this collection's template page → each generated page's record;
     anywhere else a SPECIFIC record, chosen here. It used to bind "no
     record" everywhere, which previews and publishes whichever record was
     edited last. */
  const context: "list" | "template" | "record" = React.useMemo(() => {
    if (!composer || !collection) return "record";
    for (let up = composer.elements.getElement(elementId)?.getParent?.() ?? null; up; up = up.getParent?.() ?? null) {
      const list = composer.cms.bindings.getCollectionBinding(up.getId());
      if (list?.repeat === "children" && list.collectionId === collection.id) return "list";
    }
    const page = composer.elements.getActivePage?.();
    const file = page ? pageFileNames(composer.elements.getAllPages()).get(page.id) : undefined;
    return file && collection.pageTemplatePath === file ? "template" : "record";
  }, [composer, collection, elementId, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const [records, setRecords] = React.useState<CMSContentItem[]>([]);
  React.useEffect(() => {
    let live = true;
    if (!composer || !collection || context !== "record") return setRecords([]);
    void composer.cms.collections.getContentItems(collection.id).then((rows) => live && setRecords(rows));
    return () => {
      live = false;
    };
  }, [composer, collection, context, tick]);
  const pinned = boundHere?.itemId && boundHere.itemId !== "context" ? boundHere.itemId : "";

  React.useEffect(() => {
    let live = true;
    if (!boundHere || !composer) {
      setPreview(null);
      return;
    }
    const { collectionId: cid, itemId, fieldSlug } = boundHere;
    /* Every published record, not queryContent's 50-row page: a pinned record
       is found by id wherever it sits, as publish finds it (EDT-003). */
    void composer.cms.collections
      .getContentItems(cid)
      .then((rows) => {
        if (!live) return;
        const items = rows.filter((r) => r.status === "published");
        /* No record = "the record on this page": the canvas previews the first. */
        const found = itemId && itemId !== "context" ? items.findIndex((i) => i.id === itemId) : 0;
        /* A pinned record that isn't published publishes nothing — say so,
           never preview another record in its place. */
        if (found < 0) {
          setPreview({ value: "", record: null, index: -1, total: items.length });
          return;
        }
        const index = found;
        const record = items[index] ?? null;
        setPreview({ value: cmsTextOf(record?.data[fieldSlug]), record, index, total: items.length });
      })
      .catch(() => live && setPreview(null));
    return () => {
      live = false;
    };
  }, [boundHere, composer, tick]);

  /* P-1: binding rewrites the element's content, so every bind / unbind here
     passes the lock gate first (which says so when it refuses). */
  const writable = () => (composer ? canWrite(composer, elementId) : false);
  const bindField = (slug: string) => {
    const f = collection?.fields.find((x) => x.slug === slug);
    if (!composer || !collection || !f || !writable()) return;
    /* Outside a list or the template page the binding names its record: the
       one already chosen, else the newest published one — explicitly. */
    const bind = (rows: CMSContentItem[]) => {
      const itemId =
        context === "record" ? pinned || rows.find((r) => r.status === "published")?.id || rows[0]?.id : undefined;
      // Replaces any binding on this property — one undo step (P-2).
      composer.cms.bindings.bindToField(elementId, collection.id, itemId, f.slug, property, undefined, `Bind ${f.name}`);
    };
    /* The record list may not have arrived yet on a first pick. */
    if (context === "record" && !pinned && records.length === 0) void composer.cms.collections.getContentItems(collection.id).then(bind);
    else bind(records);
    setReconnecting(false);
  };
  const unbind = () => {
    if (binding && !writable()) return;
    setCmsChosen(false);
    setReconnecting(false);
    if (composer && binding) composer.cms.bindings.unbindAll(elementId, `Unbind ${field?.name ?? binding.fieldSlug}`);
  };
  const openRecord = () => {
    if (!composer || !boundHere || !preview?.record) return;
    composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: boundHere.collectionId, recordId: preview.record.id });
  };

  const newCollection = onOpenCreateCollection ? (
    <ActionRow onClick={onOpenCreateCollection} testId="cms-new-collection">
      + New collection…
    </ActionRow>
  ) : null;

  const pickers = collections.length === 0 ? (
    <>
      <NoteRow testId="cms-no-collections">No collections yet.</NoteRow>
      {newCollection}
    </>
  ) : (
    <div data-testid="cms-pickers">
      <SelectRow
        label="Collection"
        value={activeCollectionId}
        onChange={(id) => {
          setCollectionId(id);
          setCmsChosen(true);
        }}
        options={collections.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Choose a collection…"
      />
      {newCollection}
      <SelectRow
        label="Field"
        value={boundHere?.fieldSlug ?? ""}
        placeholder={fields.length ? "Choose a field…" : "No fields fit here"}
        onChange={bindField}
        options={fields.map(fieldOption)}
      />
      {context === "record" ? (
        <SelectRow
          label="Record"
          value={pinned}
          placeholder={boundHere ? "Newest published record" : "Choose a record…"}
          onChange={(rid) => {
            if (!composer || !collection || !boundHere || !writable()) return;
            composer.cms.bindings.bindToField(elementId, collection.id, rid || undefined, boundHere.fieldSlug, property, boundHere.fallback, "Choose record");
          }}
          options={collection ? records.map((r) => ({ value: r.id, label: `${recordTitle(collection, r)}${r.status === "published" ? "" : " · Draft"}` })) : []}
        />
      ) : (
        <NoteRow testId="cms-record-context">
          {context === "list" ? "Record · each copy shows its own" : "Record · each generated page shows its own"}
        </NoteRow>
      )}
    </div>
  );

  return (
    <Section title="CMS binding" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-cms-binding">
      <ButtonGroup
        label="Source"
        value={fromCms ? "cms" : "static"}
        onChange={(v) => (v === "cms" ? setCmsChosen(true) : unbind())}
        options={SOURCE_OPTIONS}
      />

      {missing && !reconnecting ? (
        <>
          <NoteRow tone="error" testId="cms-source-missing">
            {binding?.collectionName
              ? `Source missing — Collection “${binding.collectionName}” was deleted.`
              : "Source missing — the collection this followed was deleted."}{" "}
            Reconnect a source or keep the current text.
          </NoteRow>
          <ActionRow onClick={() => setReconnecting(true)} testId="cms-reconnect">
            Reconnect…
          </ActionRow>
          <ActionRow onClick={unbind} testId="cms-unbind">
            Unbind
          </ActionRow>
        </>
      ) : fromCms ? (
        <>
          {pickers}
          {boundHere ? (
            <>
              <NoteRow testId="cms-preview">
                {preview
                  ? preview.index < 0
                    ? "This record isn't published — the page shows nothing here"
                    : preview.total
                      ? `${preview.value || "—"} (record ${preview.index + 1} of ${preview.total})`
                      : "No published records yet"
                  : "…"}
              </NoteRow>
              <ActionRow
                onClick={openRecord}
                disabled={!preview?.record}
                testId="cms-open-record"
                icon={<ExternalLink size={12} aria-hidden="true" className="tw:shrink-0" />}
              >
                Open record
              </ActionRow>
              <ActionRow onClick={unbind} testId="cms-unbind">
                Unbind
              </ActionRow>
              <NoteRow testId="cms-unbind-hint">Unbind keeps the text you see now</NoteRow>
            </>
          ) : null}
        </>
      ) : null}
    </Section>
  );
};
