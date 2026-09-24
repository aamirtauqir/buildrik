/**
 * Collection Section — G3-079. The Collection list's binding door on the
 * Settings tab: which collection its children repeat over, and how many
 * records to show. Board 4428:151488 draws the list selected on the Style tab
 * only; this row is off-board (designer note, L2).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { Section, SelectRow, InputRow, type SectionTier } from "../shared/controls";

export interface CollectionListSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

export const CollectionListSection: React.FC<CollectionListSectionProps> = ({ elementId, composer, isOpen, onToggle, tier = "tertiary" }) => {
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
  const bind = (collectionId: string, limit: number | undefined) => {
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
        label="Source"
        value={binding?.collectionId ?? ""}
        options={options}
        placeholder="None"
        onChange={(id) => (id ? bind(id, binding?.limit) : composer.cms.bindings.unbindCollection(elementId))}
      />
      {binding ? (
        <InputRow
          label="Show"
          type="number"
          placeholder="All"
          value={binding.limit ? String(binding.limit) : ""}
          onChange={(v) => {
            const n = Number.parseInt(v, 10);
            bind(binding.collectionId, n > 0 ? n : undefined);
          }}
        />
      ) : null}
    </Section>
  );
};
