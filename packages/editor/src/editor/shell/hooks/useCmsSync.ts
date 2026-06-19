/**
 * Subscribes the editor to the engine's CMS change events and mirrors each to
 * the dashboard (server CMS persistence, redesign E7). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see cmsSync).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { CMSCollection, CMSContentItem } from "../../../shared/types/cms";
import {
  syncCollectionUpsert,
  syncCollectionDelete,
  syncEntryUpsert,
  syncEntryDelete,
  hydrateCmsFromServer,
} from "../../../services/cmsSync";

export function useCmsSync(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer) return;
    const cm = composer.cms.collections;

    // Pull any server-side collections into local storage (cross-device).
    void hydrateCmsFromServer();

    const onColUpsert = (c: CMSCollection) => void syncCollectionUpsert(c);
    const onColDelete = (id: string) => void syncCollectionDelete(id);
    const onEntryUpsert = (it: CMSContentItem) => void syncEntryUpsert(it);
    const onEntryDelete = (id: string) => void syncEntryDelete(id);

    cm.on(EVENTS.CMS_COLLECTION_CREATED, onColUpsert);
    cm.on(EVENTS.CMS_COLLECTION_UPDATED, onColUpsert);
    cm.on(EVENTS.CMS_COLLECTION_DELETED, onColDelete);
    cm.on(EVENTS.CMS_CONTENT_CREATED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_UPDATED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_PUBLISHED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_UNPUBLISHED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_DELETED, onEntryDelete);

    return () => {
      cm.off(EVENTS.CMS_COLLECTION_CREATED, onColUpsert);
      cm.off(EVENTS.CMS_COLLECTION_UPDATED, onColUpsert);
      cm.off(EVENTS.CMS_COLLECTION_DELETED, onColDelete);
      cm.off(EVENTS.CMS_CONTENT_CREATED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_UPDATED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_PUBLISHED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_UNPUBLISHED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_DELETED, onEntryDelete);
    };
  }, [composer]);
}
