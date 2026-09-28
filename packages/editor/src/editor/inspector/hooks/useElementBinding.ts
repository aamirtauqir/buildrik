/**
 * useElementBinding — the CMS field an element follows, named the way the
 * boards name it ("Menu.name", board 24), and whether its source is gone
 * (board 25: the collection was deleted — "Specials.title · missing").
 *
 * Moved out of BindingBanner (DD-8b / R-DD-17): the header's status chip
 * reads it; the banner goes with lane L2-D1.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export interface ElementBinding {
  /** "Collection.field" */
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
      label: `${collection?.name ?? first.collectionId}.${first.fieldSlug}`,
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
    return () => {
      composer.off(EVENTS.BINDING_CREATED, refresh);
      composer.off(EVENTS.BINDING_REMOVED, refresh);
    };
  }, [composer, read]);

  return binding;
}
