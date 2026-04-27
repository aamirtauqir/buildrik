import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
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
    background: "var(--bd-bg-subtle)",
    border: "1px solid var(--bd-border-medium)",
    borderRadius: 6,
    color: "var(--bd-fg-primary)",
    fontSize: 12,
    outline: "none",
  } as React.CSSProperties,
  addButton: {
    padding: "8px 16px",
    background: "var(--buildrick-accent)",
    border: "none",
    borderRadius: 6,
    color: "var(--buildrick-text-on-accent)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  hint: {
    fontSize: 12,
    color: "var(--buildrick-text-secondary)",
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
        <Input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="data-*"
          style={styles.input}
        />
        <Input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          style={styles.input}
        />
        <Button onClick={addAttribute} style={styles.addButton}>
          +
        </Button>
      </div>
      <div style={styles.hint}>Add custom data-* or aria-* attributes</div>
    </div>
  );
};

export default DataAttributeEditor;
