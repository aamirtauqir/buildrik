/**
 * placeCatalogComponent — insert a catalog ComponentType into the page tree.
 *
 * v2: schema-driven. Runs interpretSchema → applyInterpretedTree to produce
 * the full element subtree per the catalog component's structure (h3+slot
 * for Card, button+text for Button, etc.). Variant default bindings then
 * apply as inline styles via cssVar refs so the runtime CSS resolves to
 * `var(--buildrick-design-color-primary)` not the raw value — token edits
 * propagate without re-rendering the catalog component.
 *
 * applyInterpretedTree owns the transaction, so a failure in any nested
 * createElement/addChild rolls back the whole insertion cleanly.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ComponentType, VariantBindings } from "./types";
import { interpretSchema } from "./schemaInterpreter";
import { applyInterpretedTree } from "./applyInterpretedTree";
import { tokenToCssVar } from "@/editor/design-system/types";

interface PlaceCatalogResult {
  elementId: string | undefined;
  variant: string;
}

interface PlaceOptions {
  /** Caller can override the default first-variant pick. */
  variant?: string;
  /** Forwarded to interpretSchema for {props.X} substitution. */
  props?: Record<string, unknown>;
}

/**
 * Convert a variant's PartialBindings into a styles record consumable by
 * Element.setStyles. Each binding becomes `cssProperty: var(--token-cssVar)`
 * so propagation stays O(1) — token edits change the var, not the binding.
 */
function bindingsToStyles(
  defaultBindings: VariantBindings,
  variant: string,
): Record<string, string> {
  const variantBindings = defaultBindings[variant] ?? {};
  const out: Record<string, string> = {};
  for (const [css, b] of Object.entries(variantBindings)) {
    out[css] = `var(${tokenToCssVar(b.tokenId)})`;
  }
  return out;
}

export function placeCatalogComponent(
  composer: Composer,
  component: ComponentType,
  parentId: string,
  dropIndex?: number,
  options: PlaceOptions = {},
): PlaceCatalogResult {
  const variant = options.variant ?? component.variants[0] ?? "default";

  const interpreted = interpretSchema(component, {
    variant,
    catalogId: component.id,
    props: options.props,
  });

  const { rootElementId } = applyInterpretedTree(composer, parentId, interpreted, dropIndex);
  if (!rootElementId) return { elementId: undefined, variant };

  // Apply variant default-bindings as inline styles on the root element.
  // Done outside applyInterpretedTree so the applier stays generic — bindings
  // are catalog-specific concern, not a schema concern.
  const styles = bindingsToStyles(component.defaultBindings, variant);
  if (Object.keys(styles).length > 0) {
    const rootEl = composer.elements.getElement(rootElementId);
    rootEl?.setStyles(styles);
  }

  return { elementId: rootElementId, variant };
}
