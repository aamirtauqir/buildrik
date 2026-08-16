/**
 * useUsageMap — memoized Map<src, count> of media usage across the active page.
 *
 * Replaces the per-asset-card `composer.mediaCommands.getUsages(src)` call,
 * which was O(N × assets) and re-ran on every panel render. This hook
 * builds the map once and invalidates on three element lifecycle events:
 *
 *   element:inserted        — new element, may reference a media src
 *   element:deleted         — may remove the last reference to a src
 *   element:style-updated   — targeted signal for src / background-image
 *                              mutations (MediaCommandLayer emits this)
 *
 * Consumers read via `get(src)` or `has(src)`. Iteration is O(1) via the map.
 *
 * @license BSD-3-Clause
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";

export interface UsageMap {
  get(src: string): number;
  has(src: string): boolean;
  /** Underlying map, for rare full-iteration cases. Do not mutate. */
  readonly raw: ReadonlyMap<string, number>;
}

function buildMap(composer: Composer): Map<string, number> {
  const counts = new Map<string, number>();
  // composer.elements.elements is a private Map; we iterate via findByMediaSrc
  // inversely: walk every element once, bumping any src it references.
  // We reach into the same source of truth (ElementManager) that
  // findByMediaSrc walks, but do it in a single pass.
  const allElements = composer.elements.getAllElements?.() ?? [];
  for (const el of allElements) {
    const src = el.getAttribute?.("src");
    if (src) {
      counts.set(src, (counts.get(src) ?? 0) + 1);
      continue;
    }
    const bgImage = el.getStyle?.("background-image");
    if (bgImage) {
      const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) {
        const bgSrc = match[1];
        counts.set(bgSrc, (counts.get(bgSrc) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function useUsageMap(composer: Composer | null): UsageMap {
  const [tick, setTick] = useState(0);
  const mapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!composer) {
      mapRef.current = new Map();
      return;
    }
    // Initial build.
    mapRef.current = buildMap(composer);
    setTick((t) => t + 1);

    const invalidate = () => {
      mapRef.current = buildMap(composer);
      setTick((t) => t + 1);
    };

    composer.on("element:inserted", invalidate);
    composer.on("element:deleted", invalidate);
    composer.on("element:style-updated", invalidate);

    return () => {
      composer.off("element:inserted", invalidate);
      composer.off("element:deleted", invalidate);
      composer.off("element:style-updated", invalidate);
    };
  }, [composer]);

  return useMemo<UsageMap>(() => {
    const map = mapRef.current;
    return {
      get: (src: string) => map.get(src) ?? 0,
      has: (src: string) => map.has(src),
      raw: map,
    };
    // `tick` is intentionally included to rebuild the UsageMap object
    // when the underlying map is replaced, so memoized consumers re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
}
