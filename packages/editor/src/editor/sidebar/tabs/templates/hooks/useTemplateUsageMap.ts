/**
 * useTemplateUsageMap — memoized Map<templateId, TemplateUsageEntry[]>
 * over composer.elements.getAllPages().
 *
 * Mirrors the media `useUsageMap` pattern: pure aggregator + event-driven
 * invalidation. Rebuilds on:
 *   - TEMPLATE_APPLIED   — recordAppliedTemplate fired
 *   - TEMPLATE_REMOVED   — removeAppliedTemplate fired
 *   - PAGE_CREATED       — page appeared
 *   - PROJECT_CHANGED    — page:deleted, page:updated, project reload
 *
 * @license BSD-3-Clause
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { EVENTS } from "../../../../../shared/constants/events";
import {
  getTemplateUsageMap,
  type TemplateUsageEntry,
  type TemplateUsageMap,
} from "../utils/templateUsage";

const EMPTY_LIST: ReadonlyArray<TemplateUsageEntry> = [];

export interface TemplateUsageMapView {
  get(templateId: string): ReadonlyArray<TemplateUsageEntry>;
  has(templateId: string): boolean;
  /** Underlying map; do not mutate. */
  readonly raw: TemplateUsageMap;
}

export function useTemplateUsageMap(composer: Composer | null): TemplateUsageMapView {
  const [tick, setTick] = useState(0);
  const mapRef = useRef<TemplateUsageMap>(new Map());

  useEffect(() => {
    if (!composer) {
      mapRef.current = new Map();
      return;
    }
    const rebuild = () => {
      mapRef.current = getTemplateUsageMap(composer);
      setTick((t) => t + 1);
    };
    rebuild();
    composer.on(EVENTS.TEMPLATE_APPLIED, rebuild);
    composer.on(EVENTS.TEMPLATE_REMOVED, rebuild);
    composer.on(EVENTS.PAGE_CREATED, rebuild);
    composer.on(EVENTS.PROJECT_CHANGED, rebuild);
    return () => {
      composer.off(EVENTS.TEMPLATE_APPLIED, rebuild);
      composer.off(EVENTS.TEMPLATE_REMOVED, rebuild);
      composer.off(EVENTS.PAGE_CREATED, rebuild);
      composer.off(EVENTS.PROJECT_CHANGED, rebuild);
    };
  }, [composer]);

  return useMemo<TemplateUsageMapView>(() => {
    const map = mapRef.current;
    return {
      get: (id: string) => map.get(id) ?? EMPTY_LIST,
      has: (id: string) => map.has(id),
      raw: map,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
}
