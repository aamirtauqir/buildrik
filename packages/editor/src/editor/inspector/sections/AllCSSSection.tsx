/**
 * AllCSSSection - Raw CSS property editor (Dev Mode only)
 * Allows adding any CSS property directly
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { InputField } from "../../../shared/forms/InputField";
import { Section } from "../shared/controls";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";

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
    color: INSPECTOR_TOKENS.textSecondary,
    fontFamily: "monospace",
  } as React.CSSProperties,
  removeBtn: {
    background: "transparent",
    border: "none",
    color: INSPECTOR_TOKENS.textTertiary,
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
    borderTop: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  } as React.CSSProperties,
  addBtn: {
    padding: "8px 16px",
    background: "rgba(0, 115, 230, 0.2)",
    border: "1px solid rgba(0, 115, 230, 0.3)",
    borderRadius: 6,
    color: "#0073E6",
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

  // Get current styles from element
  const elementStyles = React.useMemo(() => {
    if (!composer || !selectedElement.id) return {};
    const el = composer.elements.getElement(selectedElement.id);
    return el?.getStyles?.() || {};
  }, [composer, selectedElement.id]);

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
    if (el) {
      el.setStyle?.(newProperty.trim(), newValue.trim() || "initial");
      composer.emit("element:updated");
    }

    setNewProperty("");
    setNewValue("");
  };

  const handleRemoveProperty = (propName: string) => {
    if (!composer) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (el) {
      el.removeStyle?.(propName);
      composer.emit("element:updated");
    }
  };

  const handleUpdateProperty = (propName: string, newVal: string) => {
    if (!composer) return;

    const el = composer.elements.getElement(selectedElement.id);
    if (el) {
      el.setStyle?.(propName, newVal);
      composer.emit("element:updated");
    }
  };

  return (
    <Section title="All CSS" icon="Code" defaultOpen={false} isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-all-css">
      {/* Existing properties */}
      {cssProperties.length === 0 ? (
        <div style={{ color: INSPECTOR_TOKENS.textTertiary, fontSize: 12, padding: "8px 0" }}>
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
            <button
              type="button"
              style={styles.removeBtn}
              onClick={() => handleRemoveProperty(prop.name)}
              title="Remove property"
            >
              ✕
            </button>
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
        <button
          type="button"
          style={styles.addBtn}
          onClick={handleAddProperty}
          disabled={!newProperty.trim()}
        >
          Add
        </button>
      </div>
    </Section>
  );
};

export default AllCSSSection;
