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
import { BrandCard, BrandRow } from "../BrandCard";

export interface ComponentsSectionProps {
  composer: Composer | null;
}


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
    <BrandCard label="Component styles" data-components-catalog data-testid="brand-components-list">
      {CATALOG.map((component) => {
        const inUse = getInstanceCount(composer, component.id);
        return (
          <BrandRow
            key={component.id}
            data-catalog-card={component.id}
            data-testid={`brand-comp-row-${component.id}`}
            name={<span data-testid={`brand-comp-label-${component.id}`}>{component.name}</span>}
            sub={
              <span data-testid={`brand-comp-meta-${component.id}`}>
                Default appearance · {plural(component.variants.length, "variant")}
                {inUse > 0 ? ` · ${inUse} in use` : ""}
              </span>
            }
          />
        );
      })}
      {savedComponents.map((component) => (
        <BrandRow
          key={component.id}
          data-saved-card={component.id}
          name={component.name}
          sub={`Saved component · ${plural(getInstanceCount(composer, component.id), "instance")}`}
        />
      ))}
    </BrandCard>
  );
};
