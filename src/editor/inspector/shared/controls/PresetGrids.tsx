/**
 * Preset Grid Controls for Pro Inspector
 * TemplateButtonGrid, PresetButtonGrid
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TEMPLATE BUTTON GRID (for quick presets like grid templates)
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
}) => {
  const templateBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 4px",
    background: active ? "rgba(0,115,230,0.2)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(0,115,230,0.3)" : "1px solid rgba(255,255,255,0.06)",
    borderRadius: 4,
    color: active ? "#0073E6" : "#71717a",
    fontSize: 8,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 3,
        marginBottom: 10,
      }}
    >
      {templates.map((tpl) => (
        <button
          key={tpl.label}
          onClick={() => onChange(tpl.value)}
          style={templateBtnStyle(currentValue === tpl.value)}
        >
          {tpl.label}
        </button>
      ))}
    </div>
  );
};

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
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 4,
        marginBottom: 12,
      }}
    >
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.value)}
          style={{
            padding: "8px 4px",
            background:
              currentValue === preset.value ? "rgba(0,115,230,0.2)" : "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4,
            color: currentValue === preset.value ? "#0073E6" : "#71717a",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};
