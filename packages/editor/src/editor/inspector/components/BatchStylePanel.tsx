/**
 * BatchStylePanel — edit common style properties across every selected element.
 *
 * Rendered below the alignment toolbar when 2+ elements are selected. Uses the
 * representative styles from the first selected element (via useBatchStyleHandler)
 * so the fields are pre-populated. Committing any field applies the new value
 * to every selected element inside a single composer transaction.
 *
 * Intentionally minimal — only the 5 properties most commonly edited in bulk:
 * background color, text color, border radius, padding shorthand, font size.
 * Adding more fields here makes the batch panel busier for little gain; users
 * who need advanced batch edits can still select individually.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";
import { useBatchStyleHandler } from "../hooks/useBatchStyleHandler";
import { ColorInput, InputWithUnit } from "../shared/controls";

// ============================================================================
// TYPES
// ============================================================================

export interface BatchStylePanelProps {
  composer: Composer | null;
  selectedIds: string[];
  currentBreakpoint?: BreakpointId;
  currentPseudoState?: PseudoStateId;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 4,
    padding: "12px 14px",
    borderTop: `1px solid ${"var(--buildrick-border)"}`,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--buildrick-text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: "var(--buildrick-text-muted)",
    marginTop: 8,
    lineHeight: 1.4,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const BatchStylePanel: React.FC<BatchStylePanelProps> = ({
  composer,
  selectedIds,
  currentBreakpoint = "desktop",
  currentPseudoState = "normal",
}) => {
  const { styles: elementStyles, mixed, handleStyleChange } = useBatchStyleHandler(
    composer,
    selectedIds,
    currentBreakpoint,
    currentPseudoState
  );

  if (selectedIds.length < 2) return null;

  // When a property disagrees across the selection, hand the input a blank
  // value + a "Mixed" label so users can see they're about to overwrite. The
  // label appears as a small pill next to the control's label.
  const fieldProps = (prop: string, fallbackLabel: string) => ({
    label: mixed.has(prop) ? `${fallbackLabel} · Mixed` : fallbackLabel,
    value: mixed.has(prop) ? "" : elementStyles[prop] || "",
  });

  return (
    <div style={styles.container}>
      <span style={styles.label}>Batch Edit ({selectedIds.length})</span>

      <ColorInput
        {...fieldProps("background-color", "Background")}
        onChange={(v) => handleStyleChange("background-color", v)}
      />

      <ColorInput
        {...fieldProps("color", "Text")}
        onChange={(v) => handleStyleChange("color", v)}
      />

      <InputWithUnit
        {...fieldProps("border-radius", "Radius")}
        onChange={(v) => handleStyleChange("border-radius", v)}
        units={["px", "%", "rem"]}
      />

      <InputWithUnit
        {...fieldProps("padding", "Padding")}
        onChange={(v) => handleStyleChange("padding", v)}
        units={["px", "%", "rem", "em"]}
      />

      <InputWithUnit
        {...fieldProps("font-size", "Font size")}
        onChange={(v) => handleStyleChange("font-size", v)}
        units={["px", "rem", "em", "%"]}
      />

      <p style={styles.hint}>
        {mixed.size > 0
          ? `${mixed.size} propert${mixed.size === 1 ? "y" : "ies"} differ across selection. Editing a "Mixed" field overwrites all ${selectedIds.length}.`
          : `Edits apply to all ${selectedIds.length} elements in one action.`}
      </p>
    </div>
  );
};

export default BatchStylePanel;
