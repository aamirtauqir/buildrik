/**
 * useCatalog — pure read hook over the compile-time catalog.ts.
 *
 * No state, no Composer dependency, no async — catalog is bundled data.
 * The hook exists as a thin React-shaped wrapper so consumers don't import
 * CATALOG directly (keeps the seam clean if catalog ever moves to async
 * loading).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CATALOG } from "./catalog";
import type { ComponentTier, ComponentType } from "./types";

interface UseCatalogResult {
  all: ComponentType[];
  getById: (id: string) => ComponentType | undefined;
  filterByTier: (tier: ComponentTier) => ComponentType[];
  search: (query: string) => ComponentType[];
}

export function useCatalog(): UseCatalogResult {
  return React.useMemo<UseCatalogResult>(() => {
    const byId = new Map(CATALOG.map((c) => [c.id, c]));
    return {
      all: CATALOG,
      getById: (id) => byId.get(id),
      filterByTier: (tier) => CATALOG.filter((c) => c.category === tier),
      search: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return CATALOG;
        return CATALOG.filter(
          (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
        );
      },
    };
  }, []);
}
