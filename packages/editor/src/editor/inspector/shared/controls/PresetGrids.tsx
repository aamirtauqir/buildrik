/**
 * Preset Grid Controls — TemplateButtonGrid + PresetButtonGrid.
 * Ported to .bdi-qa pattern per comp-inspector.v1 quick actions row.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
// ============================================================================
// TEMPLATE BUTTON GRID (dense preset row, e.g., grid templates)
// ============================================================================

export interface TemplateButtonGridProps {
  templates: { label: string; value: string }[];
  currentValue: string;
  onChange: (value: string) => void;
  columns?: number;
}

export const TemplateButtonGrid: React.FC<TemplateButtonGridProps> = ({
  templates,
  currentValue,
  onChange,
  columns = 4,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 3,
    }}
  >
    {templates.map((tpl) => (
      <Button
        key={tpl.label}
        type="button"
        onClick={() => onChange(tpl.value)}
        className={`bdi-qa${currentValue === tpl.value ? " on" : ""}`}
        style={{ padding: "5px 0", fontSize: 9 }}
        aria-pressed={currentValue === tpl.value}
      >
        {tpl.label}
      </Button>
    ))}
  </div>
);

// ============================================================================
// PRESET BUTTON GRID
// ============================================================================

export interface PresetButtonGridProps {
  presets: { label: string; value: string }[];
  currentValue: string;
  onChange: (value: string) => void;
  columns?: number;
}

export const PresetButtonGrid: React.FC<PresetButtonGridProps> = ({
  presets,
  currentValue,
  onChange,
  columns = 4,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 4,
    }}
  >
    {presets.map((preset) => (
      <Button
        key={preset.label}
        type="button"
        onClick={() => onChange(preset.value)}
        className={`bdi-qa${currentValue === preset.value ? " on" : ""}`}
        aria-pressed={currentValue === preset.value}
      >
        {preset.label}
      </Button>
    ))}
  </div>
);
