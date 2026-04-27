import { Button } from "@/shared/ui/Button";
/**
 * VariantSection - Component variant picker for instances
 * Shows when selected element is a component instance with variants
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Package } from "lucide-react";
import type { Composer } from "../../../engine";
import type { ComponentDefinition } from "../../../shared/types/components";
import { Section } from "../shared/controls";

// ============================================================================
// TYPES
// ============================================================================

interface VariantSectionProps {
  /** Composer instance */
  composer: Composer | null;
  /** Selected element ID */
  elementId: string | null;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when section header is toggled — wires into useInspectorSections */
  onToggle?: () => void;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  propertyRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  propertyLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  valueChips: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  chip: (isSelected: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 6,
    border: isSelected ? "1px solid var(--buildrick-accent)" : "1px solid var(--buildrick-border)",
    background: isSelected ? "var(--buildrick-accent-subtle)" : "var(--buildrick-surface-3)",
    color: isSelected ? "var(--buildrick-accent)" : "var(--buildrick-text-secondary)",
    fontSize: 12,
    fontWeight: isSelected ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  noVariants: {
    padding: 12,
    background: "var(--buildrick-surface-2)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--buildrick-text-muted)",
    textAlign: "center" as const,
  },
  componentName: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "linear-gradient(135deg, rgba(45,109,255,0.08), rgba(45,109,255,0.04))",
    borderRadius: 8,
    marginBottom: 8,
  },
  componentIcon: {
    fontSize: 16,
  },
  componentLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--buildrick-text-primary)",
  },
  hint: {
    fontSize: 12,
    color: "var(--buildrick-text-muted)",
    padding: "8px 0 0",
    borderTop: "1px solid var(--buildrick-border)",
    marginTop: 8,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VariantSection: React.FC<VariantSectionProps> = ({ composer, elementId, isOpen, onToggle }) => {
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

  // Don't show section if component has no variant properties
  if (variantProperties.length === 0) {
    return null;
  }

  // Get current values for each property
  const getCurrentValue = (propertyName: string): string => {
    if (!componentInfo.currentVariant || variants.length === 0) {
      const prop = variantProperties.find((p) => p.name === propertyName);
      return prop?.defaultValue || "";
    }

    const currentVar = variants.find((v) => v.id === componentInfo.currentVariant);
    return currentVar?.propertyValues[propertyName] || "";
  };

  return (
    <Section title="Variants" icon="Layers" isOpen={isOpen} onToggle={onToggle} id="inspector-section-variants">
      <div style={styles.container}>
        {/* Component name badge */}
        <div style={styles.componentName}>
          <Package size={16} aria-hidden style={styles.componentIcon} />
          <span style={styles.componentLabel}>{componentInfo.component.name}</span>
        </div>

        {/* Variant property controls */}
        {variantProperties.map((prop) => (
          <div key={prop.name} style={styles.propertyRow}>
            <span style={styles.propertyLabel}>{prop.name}</span>
            <div style={styles.valueChips}>
              {prop.values.map((value) => {
                const isSelected = getCurrentValue(prop.name) === value;
                return (
                  <Button
                    key={value}
                    style={styles.chip(isSelected)}
                    onClick={() => handleVariantChange(prop.name, value)}
                    title={`Set ${prop.name} to ${value}`}
                    aria-pressed={isSelected}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={styles.hint}>
          Switch between component variants. Changes apply to this instance only.
        </div>
      </div>
    </Section>
  );
};

export default VariantSection;
