/**
 * useElementBinding — the CMS field an element follows, named the way the
 * boards name it ("Menu.name", board 24), and whether its source is gone
 * (board 25: the collection was deleted — "… · missing").
 *
 * The header's status chip reads it (R-DD-17; the BindingBanner is gone).
 * A deleted collection leaves nothing to name it by — the binding stores its
 * id only — so a missing source is labelled by its field alone.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export interface ElementBinding {
  /** "Collection.field", or just "field" when the collection is gone. */
  label: string;
  /** The bound collection no longer exists. */
  missing: boolean;
  collectionId: string;
}

export function useElementBinding(composer: Composer | null | undefined, elementId: string): ElementBinding | null {
  const read = React.useCallback((): ElementBinding | null => {
    const first = composer?.cms?.bindings?.getBindings?.(elementId)?.[0];
    if (!first) return null;
    const collection = composer?.cms?.collections?.getCollection?.(first.collectionId);
    return {
      label: collection ? `${collection.name}.${first.fieldSlug}` : first.fieldSlug,
      missing: !collection,
      collectionId: first.collectionId,
    };
  }, [composer, elementId]);

  const [binding, setBinding] = React.useState<ElementBinding | null>(read);

  React.useEffect(() => {
    setBinding(read());
    if (!composer) return;
    const refresh = () => setBinding(read());
    composer.on(EVENTS.BINDING_CREATED, refresh);
    composer.on(EVENTS.BINDING_REMOVED, refresh);
    /* A collection deleted or renamed changes the chip without touching the
       binding — those arrive on the CMS store's own emitter. */
    const store = composer.cms?.collections;
    const storeEvs = [EVENTS.CMS_COLLECTION_DELETED, EVENTS.CMS_COLLECTION_UPDATED, EVENTS.CMS_STORE_REFRESHED];
    storeEvs.forEach((e) => store?.on?.(e, refresh));
    return () => {
      composer.off(EVENTS.BINDING_CREATED, refresh);
      composer.off(EVENTS.BINDING_REMOVED, refresh);
      storeEvs.forEach((e) => store?.off?.(e, refresh));
    };
  }, [composer, read]);

  return binding;
}
