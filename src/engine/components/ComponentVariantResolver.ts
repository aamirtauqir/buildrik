/**
 * Component Variant & Override Resolution
 * Resolves variant styles and instance overrides for elements within component instances.
 *
 * @module engine/components/ComponentVariantResolver
 * @license BSD-3-Clause
 */

import type { ComponentDefinition, ComponentInstance } from "../../shared/types/components";
import type { Composer } from "../Composer";

// ============================================
// Instance Lookup
// ============================================

/**
 * Find the component instance that contains an element.
 * Returns the instance if the element is the instance root or a descendant.
 */
export function findInstanceContainingElement(
  composer: Composer,
  instances: Map<string, ComponentInstance>,
  elementId: string
): ComponentInstance | null {
  const directInstance = instances.get(elementId);
  if (directInstance && !directInstance.isDetached) {
    return directInstance;
  }

  const element = composer.elements.getElement(elementId);
  if (!element) return null;

  let current = element.getParent();
  while (current) {
    const parentInstance = instances.get(current.getId());
    if (parentInstance && !parentInstance.isDetached) {
      return parentInstance;
    }
    current = current.getParent();
  }

  return null;
}

// ============================================
// Element Path Within Instance
// ============================================

/**
 * Calculate the element's path within a component instance.
 * Returns path like "children[0].children[1]" or empty string for root.
 */
export function getElementPathWithinInstance(
  composer: Composer,
  elementId: string,
  instance: ComponentInstance
): string {
  if (elementId === instance.elementId) {
    return "";
  }

  const element = composer.elements.getElement(elementId);
  if (!element) return "";

  const pathParts: string[] = [];
  let current = element;

  while (current) {
    const parent = current.getParent();
    if (!parent) break;

    const siblings = parent.getChildren();
    const index = siblings.findIndex((s) => s.getId() === current.getId());
    if (index === -1) break;

    pathParts.unshift(`children[${index}]`);

    if (parent.getId() === instance.elementId) {
      break;
    }

    current = parent;
  }

  return pathParts.join(".");
}

// ============================================
// Dirty Marking
// ============================================

/**
 * Mark instance elements as needing re-render.
 * Emits element:updated for each element to notify subscribers.
 */
export function markInstanceElementsDirty(composer: Composer, instance: ComponentInstance): void {
  const rootElement = composer.elements.getElement(instance.elementId);
  if (!rootElement) return;

  const emitUpdatedRecursive = (el: ReturnType<typeof composer.elements.getElement>) => {
    if (!el) return;
    composer.emit("element:updated", el);
    for (const child of el.getChildren()) {
      emitUpdatedRecursive(child);
    }
  };

  emitUpdatedRecursive(rootElement);
}

// ============================================
// Variant Style Resolution
// ============================================

/**
 * Get variant style overrides for an element within a component instance.
 * Returns merged styles if the element is within an instance with a selected variant.
 */
export function getVariantStylesForElement(
  composer: Composer,
  components: Map<string, ComponentDefinition>,
  instances: Map<string, ComponentInstance>,
  elementId: string
): Record<string, string> | null {
  const instance = findInstanceContainingElement(composer, instances, elementId);
  if (!instance?.variantSelection?.variantId) return null;

  const component = components.get(instance.componentId);
  if (!component?.variants?.length) return null;

  const variant = component.variants.find((v) => v.id === instance.variantSelection?.variantId);
  if (!variant?.styleOverrides?.length) return null;

  const elementPath = getElementPathWithinInstance(composer, elementId, instance);

  const styles: Record<string, string> = {};
  for (const override of variant.styleOverrides) {
    const overridePath = override.elementPath;
    if (
      overridePath === elementPath ||
      (elementPath === "" && (overridePath === "" || overridePath === "root"))
    ) {
      styles[override.property] = override.value;
    }
  }

  return Object.keys(styles).length > 0 ? styles : null;
}

/**
 * Get all component-related overrides for an element (Variant + Instance).
 * Hierarchy: Instance wins over Variant.
 */
export function getOverridesForElement(
  composer: Composer,
  components: Map<string, ComponentDefinition>,
  instances: Map<string, ComponentInstance>,
  elementId: string
): Record<string, string> {
  const results: Record<string, string> = {};

  const variantStyles = getVariantStylesForElement(composer, components, instances, elementId);
  if (variantStyles) {
    Object.assign(results, variantStyles);
  }

  const instance = findInstanceContainingElement(composer, instances, elementId);
  if (instance) {
    const elementPath = getElementPathWithinInstance(composer, elementId, instance);
    const stylePrefix = `#/${elementPath}${elementPath ? "/" : ""}style/`;

    for (const op of instance.overrides) {
      if (op.path.startsWith(stylePrefix)) {
        const property = op.path.split("/").pop();
        if (property) {
          results[property] = op.value as string;
        }
      }
    }
  }

  return results;
}
