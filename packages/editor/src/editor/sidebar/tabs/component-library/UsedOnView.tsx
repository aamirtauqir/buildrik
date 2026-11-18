/**
 * UsedOnView — 2L9 217:42647 (B6-K21): where a master is used, one row per
 * place, each with an exact Locate. "Used in … ›" in the summary opens it in
 * the list's place; "‹ Back to {name}" returns to the list with the summary.
 *
 * A place is a top-level section of a page that holds instances: one instance
 * reads "Section 2 · Intro", several in one section read "Post header
 * (2 instances)". Locate opens that page with the first instance selected.
 *
 * `usedOnPlaces` is the one walk from an instance up to its page; the summary
 * reads its counts from it too.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { locateComment as locateOnCanvas } from "@/editor/sidebar/tabs/review/locate";

type Page = { id: string; name: string; root?: { id: string } | null };

type El = NonNullable<ReturnType<Composer["elements"]["getElement"]>>;

export interface UsedOnPlace {
  key: string;
  page: Page;
  /** The page's top-level section that holds the instances, and its index. */
  section: El;
  index: number;
  count: number;
  firstInstanceId: string;
}

/** "Section 2 · Intro" for one instance, "Post header (2 instances)" for several. */
export function placeLabel(place: UsedOnPlace): string {
  const name = getLayerName(place.section) || ELEMENT_TYPE_LABELS[place.section.getType()] || "Section";
  return place.count > 1 ? `${name} (${place.count} instances)` : `Section ${place.index + 1} · ${name}`;
}

/** Instances of `componentId`, grouped by page and top-level section. */
export function usedOnPlaces(composer: Composer | null, componentId: string): UsedOnPlace[] {
  if (!composer) return [];
  const instances = composer.components?.getInstancesOfComponent?.(componentId) ?? [];
  const pages: Page[] = composer.elements.getAllPages?.() ?? [];
  const groups = new Map<string, UsedOnPlace>();
  for (const inst of instances) {
    let el = composer.elements.getElement(inst.elementId) ?? null;
    let top = el;
    while (el?.getParent()) {
      top = el;
      el = el.getParent();
    }
    const page = pages.find((p) => p.root?.id === el?.getId());
    if (!page || !top) continue;
    const key = `${page.id}:${top.getId()}`;
    const hit = groups.get(key);
    if (hit) {
      hit.count += 1;
      continue;
    }
    const siblings = el?.getChildren?.() ?? [];
    const index = Math.max(0, siblings.findIndex((c) => c.getId() === top!.getId()));
    groups.set(key, { key, page, section: top, index, count: 1, firstInstanceId: inst.elementId });
  }
  return [...groups.values()];
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface UsedOnViewProps {
  component: ComponentDefinition;
  composer: Composer;
  onBack: () => void;
}

export const UsedOnView: React.FC<UsedOnViewProps> = ({ component, composer, onBack }) => {
  const places = usedOnPlaces(composer, component.id);
  const instances = places.reduce((n, p) => n + p.count, 0);
  const pageCount = new Set(places.map((p) => p.page.id)).size;
  return (
    <div className="tw:flex tw:flex-col tw:items-start" data-testid="comp-usedon">
      {/* 217:42888 — a 13/500 accent link back to the summary. */}
      <Button
        variant="link"
        size="xs"
        className="tw:h-8 tw:justify-start tw:pl-3 tw:text-[13px] tw:font-medium"
        onClick={onBack}
        data-testid="comp-usedon-back"
      >
        ‹ Back to {component.name}
      </Button>
      {/* 217:42891 — 20/30/600. */}
      <h2 className="tw:m-0 tw:text-[20px] tw:leading-[30px] tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="comp-usedon-title">
        {component.name} is used in {count(instances, "place", "places")} on {count(pageCount, "page", "pages")}
      </h2>
      {places.map((place) => (
        /* 217:42892 — 8px above and below, 12 between, a hairline under it. */
        <div key={place.key} className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:py-2" data-testid={`comp-usedon-${place.key}`}>
          <span className="tw:w-[260px] tw:shrink-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">{place.page.name}</span>
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">{placeLabel(place)}</span>
          <Button
            color="light"
            size="xs"
            onClick={() => locateOnCanvas(composer, { pageId: place.page.id, targetSelector: place.firstInstanceId })}
            className="tw:h-8 tw:w-30 tw:shrink-0 tw:rounded tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0"
          >
            Locate ›
          </Button>
        </div>
      ))}
      {/* 217:42917 — 12/16 ink-soft. */}
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        Locate opens the page with that instance selected.
      </p>
    </div>
  );
};

export default UsedOnView;
