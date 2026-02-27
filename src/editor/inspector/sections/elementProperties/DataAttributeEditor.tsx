/**
 * DataAttributeEditor - Custom data-* attribute editor
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";

// ============================================================================
// TYPES
// ============================================================================

interface DataAttributeEditorProps {
  elementId: string;
  composer?: Composer | null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  input: {
    flex: 1,
    padding: "8px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#e4e4e7",
    fontSize: 12,
    outline: "none",
  } as React.CSSProperties,
  addButton: {
    padding: "8px 16px",
    background: "#0073E6",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  hint: {
    fontSize: 10,
    color: "#52525b",
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DataAttributeEditor: React.FC<DataAttributeEditorProps> = ({
  elementId,
  composer,
}) => {
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  const addAttribute = () => {
    if (!newKey.trim()) return;

    const key = newKey.startsWith("data-") ? newKey : `data-${newKey}`;

    if (composer) {
      const el = composer.elements.getElement(elementId);
      if (!el) return;
      el.setAttribute?.(key, newValue);
      setNewKey("");
      setNewValue("");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="data-*"
          style={styles.input}
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          style={styles.input}
        />
        <button onClick={addAttribute} style={styles.addButton}>
          +
        </button>
      </div>
      <div style={styles.hint}>Add custom data-* or aria-* attributes</div>
    </div>
  );
};

export default DataAttributeEditor;
