/**
 * Collection Section — Behaviour › Collection (board 20, §17.D): which
 * collection the list repeats its children over ("+ New collection…" always
 * offered), how many items to show, and "Open collection ›" into the CMS
 * workspace on that collection's table.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { CMS_COLLECTION_LIMIT_MAX } from "@buildrik/shared/schemas/sites";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { ExternalLink } from "lucide-react";
import { Section, SelectRow, InputRow, type SectionTier } from "../shared/controls";
import { ActionRow } from "./behaviourRows";
import { canWrite } from "@/engine/commands/commandOperations";

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
    composer.cms.collections.on(EVENTS.CMS_COLLECTION_CREATED, refresh);
    composer.cms.collections.on(EVENTS.CMS_STORE_REFRESHED, refresh);
    return () => {
      composer.off(EVENTS.CMS_COLLECTION_BOUND, refresh);
      composer.off(EVENTS.CMS_COLLECTION_UNBOUND, refresh);
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
    <Section title="Collection" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-collection">
      <SelectRow
        label="Collection"
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
          <InputRow
            label="Show items"
            type="number"
            placeholder="All"
            value={binding.limit ? String(binding.limit) : ""}
            onChange={(v) => {
              const n = Number.parseInt(v, 10);
              // The stored limit is bounded; past it the save would drop the binding.
              bind(binding.collectionId, n > 0 ? Math.min(n, CMS_COLLECTION_LIMIT_MAX) : undefined);
            }}
          />
          <ActionRow
            onClick={() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: binding.collectionId })}
            testId="collection-open"
            icon={<ExternalLink size={12} aria-hidden="true" className="tw:shrink-0" />}
          >
            Open collection
          </ActionRow>
        </>
      ) : null}
    </Section>
  );
};
