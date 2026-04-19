/**
 * QuickActionsSection — one-click display presets.
 *
 * Four buttons: Block / Flex Row / Flex Col / Grid. Each sets `display` and
 * sensible defaults via `onBatchChange` so the user can switch a container
 * layout without drilling into sections. Removes stale flex/grid props when
 * switching away, via empty-string values (handleBatchStyleChange treats empty
 * as "remove property").
 *
 * Previously `components/LayoutQuickActions.tsx` — relocated to sections/ so
 * the element-profile-driven renderer can register it like any other section.
 * Unlike the other sections, this is a non-collapsible inline row, not a
 * `<Section>` wrapper. It accepts a `tier` prop for API symmetry but renders
 * the same way regardless.
 *
 * @license BSD-3-Clause
 */

import { Grid3X3, Rows3, Columns3, Square } from "lucide-react";
import * as React from "react";
import type { SectionTier } from "../shared/controls";

// ============================================================================
// TYPES
// ============================================================================

export interface QuickActionsSectionProps {
  styles: Record<string, string>;
  onBatchChange: (changes: Record<string, string>) => void;
  /** Accepted for registry symmetry — not visually applied (row is non-tiered). */
  tier?: SectionTier;
}

type PresetId = "block" | "flex-row" | "flex-col" | "grid";

interface Preset {
  id: PresetId;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  /** Properties to set (or clear with empty string) when this preset is clicked. */
  changes: Record<string, string>;
}

// ============================================================================
// PRESETS
// ============================================================================

// Each preset clears the other layout-specific properties so switching from
// flex → grid doesn't leave stale flex-direction / align-items around.
const FLEX_CLEARS: Record<string, string> = {
  "flex-direction": "",
  "justify-content": "",
  "align-items": "",
  gap: "",
};
const GRID_CLEARS: Record<string, string> = {
  "grid-template-columns": "",
  "grid-template-rows": "",
  "grid-auto-flow": "",
};

const PRESETS: Preset[] = [
  {
    id: "block",
    label: "Block",
    Icon: Square,
    changes: {
      display: "block",
      ...FLEX_CLEARS,
      ...GRID_CLEARS,
    },
  },
  {
    id: "flex-row",
    label: "Row",
    Icon: Rows3,
    changes: {
      display: "flex",
      "flex-direction": "row",
      "align-items": "center",
      ...GRID_CLEARS,
    },
  },
  {
    id: "flex-col",
    label: "Col",
    Icon: Columns3,
    changes: {
      display: "flex",
      "flex-direction": "column",
      "align-items": "stretch",
      ...GRID_CLEARS,
    },
  },
  {
    id: "grid",
    label: "Grid",
    Icon: Grid3X3,
    changes: {
      display: "grid",
      "grid-template-columns": "1fr 1fr",
      gap: "16px",
      ...FLEX_CLEARS,
    },
  },
];

// ============================================================================
// STATE DETECTION
// ============================================================================

function getActivePreset(styles: Record<string, string>): PresetId | null {
  const display = styles.display;
  if (display === "flex" || display === "inline-flex") {
    return styles["flex-direction"] === "column" ? "flex-col" : "flex-row";
  }
  if (display === "grid" || display === "inline-grid") return "grid";
  if (display === "block") return "block";
  return null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex" as const,
    gap: 4,
    padding: "8px 14px 4px",
  },
  button: (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "6px 4px",
    background: active ? "var(--buildrick-accent-subtle, rgba(59,130,246,0.15))" : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid var(--buildrick-accent, rgba(59,130,246,0.6))"
      : "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    color: active ? "var(--buildrick-accent, #3b82f6)" : "var(--buildrick-text-tertiary)",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  }),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  styles: elementStyles,
  onBatchChange,
}) => {
  const activePreset = getActivePreset(elementStyles);

  return (
    <div style={styles.container} role="group" aria-label="Layout presets">
      {PRESETS.map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onBatchChange(preset.changes)}
            style={styles.button(isActive)}
            aria-pressed={isActive}
            aria-label={`Set layout to ${preset.label}`}
            title={`Set layout to ${preset.label}`}
          >
            <preset.Icon size={14} />
            <span>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionsSection;
