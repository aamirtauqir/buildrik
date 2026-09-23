/**
 * ComponentsSection — Brand › Component styles, board 7316:82755 (C1 (ii);
 * was the drawer's 153:29 summary).
 *
 * One bordered card, a 48px row per catalogue component: its name over
 * "Default appearance · N variants", then the site's saved components the
 * same way. The page's one action, "✦ Generate with AI", is the workspace
 * header's (BrandWorkspace), not a strip pinned under the list.
 *
 * Departure from the board, recorded: the board's rows end in a ›, and no
 * per-component style editor exists behind one (the drawer's rows were
 * Buttons with no onClick). The rows are plain, not a door that opens nothing.
 * The drawer's "Read-only by design" callout named a Components panel the
 * six-item rail no longer has; it is gone with the strip.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import { CATALOG } from "../../../components-catalog/catalog";
import type { ComponentDefinition } from "../../../../shared/types/components";

export interface ComponentsSectionProps {
  composer: Composer | null;
}

/* 7316:82755: 48 tall, 16 in, 14px ink over a 13px muted line. */
const ROW = "tw:flex tw:h-12 tw:flex-col tw:justify-center tw:pl-4 tw:pr-3";
const NAME = "tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";
const SUB = "tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

function getSavedComponents(composer: Composer | null): ComponentDefinition[] {
  if (!composer) return [];
  const mgr = composer.components;
  if (!mgr || typeof mgr.getAllComponents !== "function") return [];
  try {
    return mgr.getAllComponents();
  } catch {
    return [];
  }
}

function getInstanceCount(composer: Composer | null, componentId: string): number {
  if (!composer) return 0;
  const mgr = composer.components;
  if (!mgr || typeof mgr.getInstancesOfComponent !== "function") return 0;
  try {
    return mgr.getInstancesOfComponent(componentId).length;
  } catch {
    return 0;
  }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const ComponentsSection: React.FC<ComponentsSectionProps> = ({ composer }) => {
  const savedComponents = React.useMemo(() => getSavedComponents(composer), [composer]);

  return (
    <ul
      data-components-catalog
      data-testid="brand-components-list"
      aria-label="Component styles"
      className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-0"
    >
      {CATALOG.map((component) => {
        const inUse = getInstanceCount(composer, component.id);
        return (
          <li key={component.id} data-catalog-card={component.id} data-testid={`brand-comp-row-${component.id}`} className={ROW}>
            <span data-testid={`brand-comp-label-${component.id}`} className={NAME}>{component.name}</span>
            <span data-testid={`brand-comp-meta-${component.id}`} className={SUB}>
              Default appearance · {plural(component.variants.length, "variant")}
              {inUse > 0 ? ` · ${inUse} in use` : ""}
            </span>
          </li>
        );
      })}
      {savedComponents.map((component) => (
        <li key={component.id} data-saved-card={component.id} className={ROW}>
          <span className={NAME}>{component.name}</span>
          <span className={SUB}>
            Saved component · {plural(getInstanceCount(composer, component.id), "instance")}
          </span>
        </li>
      ))}
    </ul>
  );
};
