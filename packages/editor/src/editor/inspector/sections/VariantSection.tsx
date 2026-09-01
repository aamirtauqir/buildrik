/**
 * VariantSection — board 160:2 (Inspector · instance-selected).
 *
 * The band that says this thing came from a component: which variant it is on,
 * and the way back to the master. The board puts it ABOVE the style sections,
 * tinted, because it changes what everything below means — an instance's edits
 * are local until it is detached.
 *
 * It used to render as an ordinary collapsible "Variants" section at the very
 * bottom of the column, under Animation and CSS classes, with chips instead of
 * the board's selects and no way at all to undo an instance's own edits.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { ComponentDefinition } from "../../../shared/types/components";
import { Button, Select } from "@/editor/chrome-ui";
// ============================================================================
// TYPES
// ============================================================================

interface VariantSectionProps {
  /** Composer instance */
  composer: Composer | null;
  /** Selected element ID */
  elementId: string | null;
}

// ============================================================================
// STYLES
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

export const VariantSection: React.FC<VariantSectionProps> = ({ composer, elementId }) => {
  // State for component info
  const [componentInfo, setComponentInfo] = React.useState<{
    component: ComponentDefinition | null;
    instanceId: string | null;
    currentVariant: string | null;
  }>({
    component: null,
    instanceId: null,
    currentVariant: null,
  });

  // Check if selected element is a component instance
  React.useEffect(() => {
    if (!composer || !elementId) {
      setComponentInfo({ component: null, instanceId: null, currentVariant: null });
      return;
    }

    const instance = composer.components?.getInstanceByElementId(elementId);
    if (!instance) {
      setComponentInfo({ component: null, instanceId: null, currentVariant: null });
      return;
    }

    const component = composer.components?.getComponent(instance.componentId);
    setComponentInfo({
      component: component ?? null,
      instanceId: instance.elementId,
      currentVariant: instance.variantSelection?.variantId ?? null,
    });
  }, [composer, elementId]);

  // Handle variant change
  const handleVariantChange = React.useCallback(
    (propertyName: string, value: string) => {
      if (!composer || !componentInfo.instanceId || !componentInfo.component) return;

      // Find or create variant ID based on property values
      const variants = componentInfo.component.variants || [];
      const matchingVariant = variants.find((v) => v.propertyValues[propertyName] === value);

      if (matchingVariant) {
        // Update instance variant selection
        composer.components?.updateInstanceVariant?.(componentInfo.instanceId, matchingVariant.id);
      }
    },
    [composer, componentInfo]
  );

  // Don't render if not a component instance or no variant properties
  if (!componentInfo.component) {
    return null;
  }

  const variantProperties = componentInfo.component.variantProperties || [];
  const variants = componentInfo.component.variants || [];
  /* This used to `return null` when a component had no variant properties,
     which is the NORMAL case — most components define none. The whole band
     went with it, including "Reset to master", so an element that genuinely
     WAS an instance showed nothing at all: the inspector ran straight from the
     pill row into TYPOGRAPHY with no sign the element was linked to anything.
     Board 160:2 is exactly that state. Only the pickers depend on variants;
     being an instance does not. */
  const hasVariants = variantProperties.length > 0;

  const currentValue = (propertyName: string): string => {
    if (!componentInfo.currentVariant || variants.length === 0) {
      const prop = variantProperties.find((p) => p.name === propertyName);
      return prop?.defaultValue || "";
    }
    const currentVar = variants.find((v) => v.id === componentInfo.currentVariant);
    return currentVar?.propertyValues[propertyName] || "";
  };

  return (
    <div className="tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-2" data-testid="variant-band">
      <div className="tw:mb-1 tw:text-[11px] tw:font-medium tw:tracking-wide tw:text-[var(--bk-accent)]">
        {hasVariants ? "VARIANT" : "COMPONENT INSTANCE"}
      </div>
      {!hasVariants && (
        <div className="tw:mb-1 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">
          Linked to {componentInfo.component.name}. Edits here apply to this copy only.
        </div>
      )}
      {variantProperties.map((prop) => (
        <div key={prop.name} className="bdi-row-ctrl">
          <label className="bdi-lb">{prop.name}</label>
          <Select
            value={currentValue(prop.name)}
            onChange={(e) => handleVariantChange(prop.name, e.target.value)}
            aria-label={`${prop.name} variant`}
          >
            {prop.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      ))}
      <Button
        color="light"
        size="xs"
        className="tw:mt-1 tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-[var(--bk-accent)]"
        onClick={() => {
          if (componentInfo.instanceId) {
            void composer?.components?.resetInstance?.(componentInfo.instanceId);
          }
        }}
      >
        Reset to master
      </Button>
    </div>
  );
};

export default VariantSection;
