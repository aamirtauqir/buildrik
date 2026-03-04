/**
 * AllCSSSection - Raw CSS property editor (Dev Mode only)
 * Allows adding any CSS property directly
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Section } from "../shared/Controls";
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
  propertyValue: {
    flex: 1,
    fontSize: 12,
    color: INSPECTOR_TOKENS.textPrimary,
    fontFamily: "monospace",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 4,
    padding: "4px 8px",
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
  addInput: {
    flex: 1,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "8px 10px",
    color: INSPECTOR_TOKENS.textPrimary,
    fontSize: 12,
    fontFamily: "monospace",
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
  devBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 6px",
    background: "rgba(234, 179, 8, 0.15)",
    border: "1px solid rgba(234, 179, 8, 0.3)",
    borderRadius: 4,
    color: "#eab308",
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 8,
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AllCSSSection: React.FC<AllCSSSectionProps> = ({ selectedElement, composer }) => {
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
    <Section title="All CSS" icon="Code" defaultOpen={false}>
      {/* Existing properties */}
      {cssProperties.length === 0 ? (
        <div style={{ color: INSPECTOR_TOKENS.textTertiary, fontSize: 12, padding: "8px 0" }}>
          No inline styles applied
        </div>
      ) : (
        cssProperties.map((prop) => (
          <div key={prop.name} style={styles.propertyRow}>
            <span style={styles.propertyName}>{prop.name}</span>
            <input
              type="text"
              value={prop.value}
              onChange={(e) => handleUpdateProperty(prop.name, e.target.value)}
              style={styles.propertyValue}
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
        <input
          type="text"
          placeholder="property-name"
          value={newProperty}
          onChange={(e) => setNewProperty(e.target.value)}
          style={styles.addInput}
        />
        <input
          type="text"
          placeholder="value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          style={styles.addInput}
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
