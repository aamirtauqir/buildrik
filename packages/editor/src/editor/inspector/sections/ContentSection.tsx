/**
 * Content Section — board 4428:141642's CONTENT ("Source ● Static ○ From
 * CMS") and, bound, 4428:149540: Collection ▾ · Field ▾ · Preview <value>
 * ⌁ Bound · "Shows the record's <Field> on dynamic pages and in collection
 * lists." (G3-078.)
 *
 * The v3 binding names no record: it follows "the record on this page".
 * On a collection's template page the export writes the publish worker's
 * {field} token, filled per record; elsewhere (and on the canvas) it previews
 * the first published record. An image binds its source, a link its URL,
 * anything else its text. Binding and Static (unbind) are each one undo step.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection } from "@/shared/types/cms";
import { EVENTS } from "@/shared/constants";
import { Button } from "@/editor/chrome-ui";
import { Section, SelectRow, type SectionTier } from "../shared/controls";

export interface ContentSectionProps {
  elementId: string;
  composer: Composer | null;
  onOpenCreateCollection?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const OPTION =
  "tw:h-6 tw:px-1 tw:gap-1 tw:rounded-md tw:text-[12px] tw:font-normal tw:whitespace-nowrap tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:px-4 tw:pb-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "tw:inline-block tw:size-2.5 tw:rounded-full tw:border " +
        (on ? "tw:border-[var(--bk-ink)] tw:bg-[var(--bk-ink)]" : "tw:border-[var(--bk-ink-muted)] tw:bg-transparent")
      }
    />
  );
}

/** Which property of the element a field fills. */
function boundProperty(type: string | undefined): "src" | "href" | "content" {
  if (type === "image") return "src";
  if (type === "link") return "href";
  return "content";
}

export const ContentSection: React.FC<ContentSectionProps> = ({ elementId, composer, onOpenCreateCollection, isOpen, onToggle, tier = "tertiary" }) => {
  const [tick, setTick] = React.useState(0);
  const [cmsChosen, setCmsChosen] = React.useState(false);
  const [collectionId, setCollectionId] = React.useState("");
  const [preview, setPreview] = React.useState("");

  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setTick((t) => t + 1);
    const evs = [EVENTS.BINDING_CREATED, EVENTS.BINDING_REMOVED, EVENTS.CMS_CONTENT_UPDATED, EVENTS.CMS_COLLECTION_UPDATED, EVENTS.PROJECT_LOADED];
    evs.forEach((e) => composer.on(e, bump));
    return () => evs.forEach((e) => composer.off(e, bump));
  }, [composer]);
  React.useEffect(() => {
    setCmsChosen(false);
    setCollectionId("");
  }, [elementId]);

  const binding = composer?.cms?.bindings?.getBindings?.(elementId)?.[0] ?? null;
  const collections: CMSCollection[] = composer?.cms?.collections?.getAllCollections?.() ?? [];
  const activeCollectionId = binding?.collectionId ?? (collectionId || collections[0]?.id || "");
  const collection = collections.find((c) => c.id === activeCollectionId) ?? null;
  const field = binding ? collection?.fields.find((f) => f.slug === binding.fieldSlug) ?? null : null;
  const fromCms = Boolean(binding) || cmsChosen;
  const property = boundProperty(composer?.elements.getElement(elementId)?.getType?.());

  React.useEffect(() => {
    let live = true;
    if (!binding || !composer) return setPreview("");
    void composer.cms.bindings.resolveBinding(binding).then((v) => live && setPreview(v));
    return () => {
      live = false;
    };
  }, [binding, composer, tick]);

  const bindField = (slug: string) => {
    const f = collection?.fields.find((x) => x.slug === slug);
    if (!composer || !collection || !f) return;
    if (binding) composer.cms.bindings.unbindAll(elementId, `Unbind ${field?.name ?? binding.fieldSlug}`);
    composer.cms.bindings.bindToField(elementId, collection.id, undefined, f.slug, property, undefined, `Bind ${f.name}`);
  };
  const toStatic = () => {
    setCmsChosen(false);
    if (composer && binding) composer.cms.bindings.unbindAll(elementId, `Unbind ${field?.name ?? binding.fieldSlug}`);
  };

  return (
    <Section title="Content" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-content">
      <div className="bdi-row-ctrl" data-testid="content-source">
        <span className="bdi-lb">Source</span>
        <div className="bdi-row-content" role="radiogroup" aria-label="Content source">
          <Button type="button" color="light" size="xs" className={OPTION} role="radio" aria-checked={!fromCms} data-testid="content-source-static" onClick={toStatic}>
            <Dot on={!fromCms} /> Static
          </Button>
          <Button type="button" color="light" size="xs" className={OPTION} role="radio" aria-checked={fromCms} data-testid="content-source-cms" onClick={() => setCmsChosen(true)}>
            <Dot on={fromCms} /> From CMS
          </Button>
        </div>
      </div>
      {fromCms && collections.length === 0 ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:pb-2" data-testid="content-no-collections">
          <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">No collections yet.</span>
          {onOpenCreateCollection ? (
            <Button size="xs" variant="link" className="tw:min-h-6 tw:text-[12px]" onClick={onOpenCreateCollection} data-testid="content-create-collection">
              Create collection
            </Button>
          ) : null}
        </div>
      ) : null}
      {fromCms && collection ? (
        <div data-testid="content-cms">
          <SelectRow
            label="Collection"
            value={activeCollectionId}
            onChange={(id) => {
              if (binding && composer) composer.cms.bindings.unbindAll(elementId, "Unbind field");
              setCollectionId(id);
              setCmsChosen(true);
            }}
            options={collections.map((c) => ({ value: c.id, label: c.name }))}
          />
          <SelectRow
            label="Field"
            value={binding?.fieldSlug ?? ""}
            placeholder="Choose a field…"
            onChange={bindField}
            options={collection.fields.map((f) => ({ value: f.slug, label: f.name }))}
          />
          {binding ? (
            <>
              <div className="bdi-row-ctrl" data-testid="content-preview">
                <span className="bdi-lb">Preview</span>
                <div className="bdi-row-content tw:gap-1.5">
                  <span className="tw:truncate tw:text-[12px] tw:text-[var(--bk-ink)]" data-testid="content-preview-value">{preview || "—"}</span>
                  <span className="tw:inline-flex tw:h-5 tw:flex-none tw:items-center tw:rounded-[4px] tw:bg-[var(--bk-accent-tint)] tw:px-1.5 tw:text-[11px] tw:text-[var(--bk-accent-text)]">
                    ⌁ Bound
                  </span>
                </div>
              </div>
              <p className={NOTE} data-testid="content-note">
                Shows the record&apos;s {field?.name ?? binding.fieldSlug} on dynamic pages and in collection lists.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </Section>
  );
};
