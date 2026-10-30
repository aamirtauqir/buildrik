/**
 * Collection list — Content › Collection list (2L9 B5-D76 / D94; board 20):
 * which collection the list repeats its children over (Source; "+ New
 * collection…" always offered), "Open collection ›" into the CMS workspace on
 * that collection's table, and the list's query (CollectionQueryRows: Filter,
 * Match, Sort, Then by, Show, Skip — C-14).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { Button } from "@/editor/chrome-ui";
import { Section, SelectRow, type SectionTier } from "../shared/controls";
import { CollectionQueryRows } from "./CollectionQueryRows";
import { CollectionPagesRows } from "./CollectionPagesRows";
import { ActionRow } from "./behaviourRows";
import { canWrite } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";

export interface CollectionListSectionProps {
  elementId: string;
  composer: Composer | null;
  /** "+ New collection…" — the shell's create-collection door. */
  onOpenCreateCollection?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

export const CollectionListSection: React.FC<CollectionListSectionProps> = ({ elementId, composer, onOpenCreateCollection, isOpen, onToggle, tier = "tertiary" }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.CMS_COLLECTION_BOUND, refresh);
    composer.on(EVENTS.CMS_COLLECTION_UNBOUND, refresh);
    composer.on(EVENTS.CMS_LIST_QUERY_CHANGED, refresh);
    composer.cms.collections.on(EVENTS.CMS_COLLECTION_CREATED, refresh);
    composer.cms.collections.on(EVENTS.CMS_STORE_REFRESHED, refresh);
    return () => {
      composer.off(EVENTS.CMS_COLLECTION_BOUND, refresh);
      composer.off(EVENTS.CMS_COLLECTION_UNBOUND, refresh);
      composer.off(EVENTS.CMS_LIST_QUERY_CHANGED, refresh);
      composer.cms.collections.off(EVENTS.CMS_COLLECTION_CREATED, refresh);
      composer.cms.collections.off(EVENTS.CMS_STORE_REFRESHED, refresh);
    };
  }, [composer]);

  if (!composer) return null;
  const binding = composer.cms.bindings.getCollectionBinding(elementId);
  const options = composer.cms.collections.getAllCollections().map((c) => ({ value: c.id, label: c.name }));

  /* One undo step: binding retargets the template's starter placeholders. */
  /* P-1: binding re-renders the list's children, so bind / unbind pass the
     lock gate first (which says so when it refuses). */
  const writable = () => canWrite(composer, elementId);
  const bind = (collectionId: string, limit: number | undefined) => {
    if (!writable()) return;
    composer.beginTransaction?.("bind-collection-list");
    try {
      composer.cms.bindings.bindCollectionList(elementId, collectionId, { limit });
    } finally {
      composer.endTransaction?.();
    }
  };

  return (
    <Section title="Collection list" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-collection">
      <SelectRow
        label="Source"
        value={binding?.collectionId ?? ""}
        options={options}
        placeholder="None"
        onChange={(id) => (id ? bind(id, binding?.limit) : writable() && composer.cms.bindings.unbindCollection(elementId))}
      />
      {onOpenCreateCollection ? (
        <ActionRow onClick={onOpenCreateCollection} testId="collection-new">
          + New collection…
        </ActionRow>
      ) : null}
      {binding ? (
        <>
          <div className="tw:flex tw:justify-center">
          <Button
            type="button"
            variant="link"
            size="xs"
            className="tw:h-8 tw:self-center tw:text-[13px] tw:font-normal"
            onClick={() => {
              /* C-11: the CMS names where it came from ("‹ Home · Team list"). */
              const el = composer.elements.getElement(elementId);
              const page = composer.elements.getActivePage?.()?.name ?? "Page";
              const origin = `${page} · ${getLayerName(el) ?? elementTypeLabel(el?.getType?.() ?? "collection-list")}`;
              composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: binding.collectionId, origin });
            }}
            data-testid="collection-open"
          >
            Open collection ›
          </Button>
          </div>
          {/* C-14 (2L9 B5-D76 / D94): Filter, Match, Sort, Show, Skip. */}
          <CollectionQueryRows composer={composer} elementId={elementId} binding={binding} />
          {/* B-30 (2L9 B5-D75 / D78 / D80): Pages, When empty. */}
          <CollectionPagesRows composer={composer} elementId={elementId} binding={binding} />
        </>
      ) : null}
    </Section>
  );
};
