import { Button } from "@/shared/ui/Button";
/**
 * AllCSSSection - Raw CSS property editor (Dev Mode only)
 * Allows adding any CSS property directly
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { InputField } from "../../../shared/forms/InputField";
import { runTransaction } from "../../../shared/utils/helpers";
import { Section, type SectionTier } from "../shared/controls";

// ============================================================================
// TYPES
// ============================================================================

export interface AllCSSSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer: Composer | null | undefined;
  /** Controlled open state for the section wrapper. */
  isOpen?: boolean;
  /** Called when the section header is toggled. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
}

interface CSSProperty {
  name: string;
  value: string;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  propertyRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  } as React.CSSProperties,
  propertyName: {
    flex: "0 0 100px",
    fontSize: 12,
    color: "var(--buildrick-text-secondary)",
    fontFamily: "monospace",
  } as React.CSSProperties,
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--buildrick-text-tertiary)",
    cursor: "pointer",
    padding: 4,
    fontSize: 12,
    opacity: 0.6,
  } as React.CSSProperties,
  addForm: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    padding: "12px 0",
    borderTop: `1px solid ${"var(--buildrick-border)"}`,
  } as React.CSSProperties,
  addBtn: {
    padding: "8px 16px",
    background: "rgba(0, 115, 230, 0.2)",
    border: "1px solid rgba(0, 115, 230, 0.3)",
    borderRadius: 6,
    color: "var(--buildrick-accent)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AllCSSSection: React.FC<AllCSSSectionProps> = ({
  selectedElement,
  composer,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const [newProperty, setNewProperty] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  // SSOT: seed from composer and re-read on element:updated events so
  // undo/redo or external panels don't leave this view stale.
  const [elementStyles, setElementStyles] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!composer || !selectedElement?.id) {
      setElementStyles({});
      return;
    }
    const read = () => {
      const el = composer.elements.getElement(selectedElement.id);
      setElementStyles(el?.getStyles?.() || {});
    };
    read();
    const handler = (payload: unknown) => {
      const id = (payload as { getId?: () => string } | undefined)?.getId?.();
      if (!id || id === selectedElement.id) read();
    };
    composer.on?.("element:updated", handler);
    return () => { composer.off?.("element:updated", handler); };
  }, [composer, selectedElement?.id]);

  // Convert to array for display
  const cssProperties: CSSProperty[] = React.useMemo(() => {
    return Object.entries(elementStyles).map(([name, value]) => ({
      name,
      value: String(value),
    }));
  }, [elementStyles]);

  const handleAddProperty = () => {
    if (!newProperty.trim() || !composer) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "add-css-property", () => {
      el.setStyle?.(newProperty.trim(), newValue.trim() || "initial");
    });

    setNewProperty("");
    setNewValue("");
  };

  const handleRemoveProperty = (propName: string) => {
    if (!composer) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "remove-css-property", () => {
      el.removeStyle?.(propName);
    });
  };

  const handleUpdateProperty = (propName: string, newVal: string) => {
    if (!composer) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "update-css-property", () => {
      el.setStyle?.(propName, newVal);
    });
  };

  return (
    <Section title="All CSS" icon="Code" defaultOpen={false} isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-all-css">
      {/* Existing properties */}
      {cssProperties.length === 0 ? (
        <div style={{ color: "var(--buildrick-text-tertiary)", fontSize: 12, padding: "8px 0" }}>
          No inline styles applied
        </div>
      ) : (
        cssProperties.map((prop) => (
          <div key={prop.name} style={styles.propertyRow}>
            <span style={styles.propertyName}>{prop.name}</span>
            <InputField
              type="text"
              value={prop.value}
              onChange={(e) => handleUpdateProperty(prop.name, e.target.value)}
            />
            <Button
              type="button"
              style={styles.removeBtn}
              onClick={() => handleRemoveProperty(prop.name)}
              title="Remove property"
            >
              ✕
            </Button>
          </div>
        ))
      )}
      {/* Add new property */}
      <div style={styles.addForm}>
        <InputField
          type="text"
          placeholder="property-name"
          value={newProperty}
          onChange={(e) => setNewProperty(e.target.value)}
        />
        <InputField
          type="text"
          placeholder="value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
        />
        <Button
          type="button"
          style={styles.addBtn}
          onClick={handleAddProperty}
          disabled={!newProperty.trim()}
        >
          Add
        </Button>
      </div>
    </Section>
  );
};

export default AllCSSSection;
