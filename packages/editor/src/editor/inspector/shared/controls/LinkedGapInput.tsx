/**
 * LinkedGapInput — shared linked/unlinked gap input for flex & grid.
 *
 * Consolidates the two inconsistent gap editors that used to live in
 * `flexbox/GapControls.tsx` and `sections/GridSection.tsx`. When linked, the
 * user edits a single value that writes the `gap` shorthand (and clears
 * `row-gap`/`column-gap` so the shorthand isn't shadowed). When unlinked, the
 * user edits row-gap / column-gap independently (and `gap` is cleared).
 *
 * Link detection mirrors the margin/padding pattern: if row-gap and column-gap
 * are both unset (or equal to each other), the value is considered linked.
 *
 * @license BSD-3-Clause
 */

import { Link, Link2Off } from "lucide-react";
import * as React from "react";
import { INSPECTOR_TOKENS, baseStyles } from "./controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface LinkedGapInputProps {
  styles: Record<string, string>;
  /** Called with a single CSS property and its new value. */
  onChange: (property: string, value: string) => void;
  /**
   * Batch handler — used when clearing multiple properties at once (e.g.,
   * when unlinking we need to clear `gap` and seed row-gap/column-gap). Falls
   * back to a sequence of onChange calls if omitted.
   */
  onBatchChange?: (changes: Record<string, string>) => void;
  /** Row label. Defaults to "Gap". */
  label?: string;
  disabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * A gap is "linked" when row-gap and column-gap are either both empty or equal
 * to each other. In that case the single `gap` shorthand is the source of truth.
 */
function isLinked(styles: Record<string, string>): boolean {
  const row = styles["row-gap"];
  const col = styles["column-gap"];
  if (!row && !col) return true;
  if (row && col && row === col) return true;
  return false;
}

function getLinkedValue(styles: Record<string, string>): string {
  // Prefer the gap shorthand when set, otherwise fall back to whichever side
  // has a value (they're equal or only one is set).
  return styles.gap || styles["row-gap"] || styles["column-gap"] || "";
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  label: {
    ...baseStyles.label,
    minWidth: 40,
  },
  linkButton: (linked: boolean): React.CSSProperties => ({
    width: 22,
    height: 22,
    padding: 0,
    background: linked ? INSPECTOR_TOKENS.accentAlpha20 : "transparent",
    border: `1px solid ${linked ? INSPECTOR_TOKENS.accentAlpha30 : INSPECTOR_TOKENS.borderInput}`,
    borderRadius: 4,
    color: linked ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.12s",
  }),
  input: {
    ...baseStyles.input,
    padding: "4px 8px",
  },
  splitRow: {
    display: "flex" as const,
    gap: 6,
    flex: 1,
  },
  splitField: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 4,
    flex: 1,
  },
  splitLabel: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textMuted,
    width: 22,
    flexShrink: 0,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LinkedGapInput: React.FC<LinkedGapInputProps> = ({
  styles: elementStyles,
  onChange,
  onBatchChange,
  label = "Gap",
  disabled = false,
}) => {
  const linked = isLinked(elementStyles);

  // Fallback batch helper: call onChange sequentially when no batch handler
  // is provided. Preserves behavior but loses the atomic-transaction benefit.
  const applyChanges = (changes: Record<string, string>) => {
    if (onBatchChange) {
      onBatchChange(changes);
      return;
    }
    Object.entries(changes).forEach(([prop, val]) => onChange(prop, val));
  };

  const handleLinkedChange = (value: string) => {
    // Writing via the shorthand means we also clear any lingering row/col
    // overrides so there's one source of truth.
    applyChanges({
      gap: value,
      "row-gap": "",
      "column-gap": "",
    });
  };

  const handleUnlinkedChange = (axis: "row-gap" | "column-gap", value: string) => {
    onChange(axis, value);
  };

  const toggleLink = () => {
    if (linked) {
      // Going from linked → unlinked: seed row-gap + column-gap from the
      // current shorthand so the user doesn't lose the value.
      const current = getLinkedValue(elementStyles);
      applyChanges({
        gap: "",
        "row-gap": current || "",
        "column-gap": current || "",
      });
    } else {
      // Going from unlinked → linked: collapse to whichever side has a value.
      // Prefer row-gap because users typically think "row spacing" first.
      const current = elementStyles["row-gap"] || elementStyles["column-gap"] || "";
      applyChanges({
        gap: current,
        "row-gap": "",
        "column-gap": "",
      });
    }
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <button
        type="button"
        onClick={toggleLink}
        style={styles.linkButton(linked)}
        aria-pressed={linked}
        aria-label={linked ? "Unlink row and column gap" : "Link row and column gap"}
        title={linked ? "Unlink row and column gap" : "Link row and column gap"}
        disabled={disabled}
      >
        {linked ? <Link size={12} aria-hidden="true" /> : <Link2Off size={12} aria-hidden="true" />}
      </button>
      {linked ? (
        <input
          type="text"
          value={getLinkedValue(elementStyles)}
          onChange={(e) => handleLinkedChange(e.target.value)}
          placeholder="0"
          style={styles.input}
          disabled={disabled}
          aria-label={`${label} (linked)`}
        />
      ) : (
        <div style={styles.splitRow}>
          <div style={styles.splitField}>
            <span style={styles.splitLabel}>Row</span>
            <input
              type="text"
              value={elementStyles["row-gap"] || ""}
              onChange={(e) => handleUnlinkedChange("row-gap", e.target.value)}
              placeholder="0"
              style={styles.input}
              disabled={disabled}
              aria-label="Row gap"
            />
          </div>
          <div style={styles.splitField}>
            <span style={styles.splitLabel}>Col</span>
            <input
              type="text"
              value={elementStyles["column-gap"] || ""}
              onChange={(e) => handleUnlinkedChange("column-gap", e.target.value)}
              placeholder="0"
              style={styles.input}
              disabled={disabled}
              aria-label="Column gap"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedGapInput;
