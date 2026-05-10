/**
 * placeCatalogComponent — insert a catalog ComponentType into the page tree.
 *
 * v1 minimal: creates a single placeholder <div> tagged with
 * data-buildrik-catalog-component + data-variant so future schema
 * interpretation can find and re-render it. Default-variant bindings are
 * stored as data attributes too — when the renderer ships, it reads these
 * to compose the live element.
 *
 * No nesting validation in v1 — caller's drop target resolution is the
 * gate. Wraps the insertion in a Composer transaction so a failure rolls
 * back cleanly (matches insertBlock contract from blocks/blockRegistry.ts).
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ElementType } from "@/shared/types/element";
import type { ComponentType } from "./types";

interface PlaceCatalogResult {
  elementId: string | undefined;
  variant: string;
}

/** Map catalog id → existing ElementType. Unmapped → "container" (safe default). */
function elementTypeForCatalog(id: string): ElementType {
  switch (id) {
    case "button":  return "button";
    case "input":   return "input";
    case "section": return "section";
    case "card":    return "container";
    case "modal":   return "container";
    default:        return "container";
  }
}

export function placeCatalogComponent(
  composer: Composer,
  component: ComponentType,
  parentId: string,
  dropIndex?: number,
): PlaceCatalogResult {
  const variant = component.variants[0] ?? "default";

  composer.beginTransaction("place-catalog-component");
  try {
    const parent = composer.elements.getElement(parentId);
    if (!parent) {
      composer.rollbackTransaction();
      return { elementId: undefined, variant };
    }

    const element = composer.elements.createElement(elementTypeForCatalog(component.id), {
      content: component.name,
      attributes: {
        "data-buildrik-catalog-component": component.id,
        "data-variant": variant,
      },
    } as Parameters<typeof composer.elements.createElement>[1]);

    parent.addChild(element, dropIndex);

    composer.endTransaction();
    return { elementId: element.getId(), variant };
  } catch {
    composer.rollbackTransaction();
    return { elementId: undefined, variant };
  }
}
