/**
 * GenericPresetList (S2 U2) — parametrized editor for any preset category.
 *
 * v1 surface: friendly-name inline edit, variant chip (read-only),
 * binding count chip, delete button. Add Preset button generates a fresh
 * id ({category}-custom-{n}) with empty bindings. Inline binding editor
 * deferred to S2.1 — placeholder "Edit bindings" button is a no-op until
 * the binding picker UI ships.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetsForCategoryRegistry } from "../../state/usePresetsForCategory";
import type { PresetCategory, StylePreset } from "../../types";
import { useDSModeOptional } from "../../state/DSModeContext";

interface GenericPresetListProps {
  category: PresetCategory;
  registry: PresetsForCategoryRegistry;
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 0",
  borderBottom: "1px solid var(--bd-border)",
};

const lastRowStyle: React.CSSProperties = { ...rowStyle, borderBottom: "none" };

const inputStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  padding: "4px 8px",
  background: "var(--bd-bg-canvas, #0e0e10)",
  color: "var(--bd-fg-primary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 4,
  fontSize: 12,
};

const variantChipStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "2px 6px",
  borderRadius: 4,
  background: "var(--bd-bg-subtle)",
  color: "var(--bd-fg-secondary)",
  fontFamily: "var(--bd-font-mono, monospace)",
  flexShrink: 0,
};

const countChipStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  flexShrink: 0,
};

const ghostBtnStyle: React.CSSProperties = {
  padding: "3px 8px",
  background: "transparent",
  color: "var(--bd-fg-secondary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 4,
  fontSize: 11,
  cursor: "pointer",
};

const dangerBtnStyle: React.CSSProperties = {
  ...ghostBtnStyle,
  color: "var(--bd-error, #ef4444)",
  borderColor: "rgba(239,68,68,0.3)",
};

const idChipStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  fontFamily: "var(--bd-font-mono, monospace)",
  marginLeft: 4,
};

const addRowStyle: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  justifyContent: "flex-end",
};

function generateNewPreset(category: PresetCategory, existing: StylePreset[]): StylePreset {
  let n = existing.length + 1;
  let id = `${category}-custom-${n}`;
  const used = new Set(existing.map((p) => p.id));
  while (used.has(id)) {
    n += 1;
    id = `${category}-custom-${n}`;
  }
  return {
    id,
    friendlyName: `New ${category} preset`,
    category,
    variant: `custom-${n}`,
    bindings: {},
  };
}

export const GenericPresetList: React.FC<GenericPresetListProps> = ({ category, registry }) => {
  const mode = useDSModeOptional()?.mode ?? "beginner";
  const isPro = mode === "pro";

  if (registry.presets.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--bd-fg-muted)", padding: "4px 0" }}>
        No presets yet.
        <button
          type="button"
          onClick={() => registry.addPreset(generateNewPreset(category, registry.presets))}
          style={{ ...ghostBtnStyle, marginLeft: 8 }}
        >
          + Add preset
        </button>
      </div>
    );
  }

  return (
    <div>
      {registry.presets.map((p, i) => {
        const isLast = i === registry.presets.length - 1;
        const bindingCount = Object.keys(p.bindings).length;
        return (
          <div key={p.id} style={isLast ? lastRowStyle : rowStyle}>
            <input
              aria-label={`${category} preset ${p.id} friendly name`}
              type="text"
              value={p.friendlyName}
              onChange={(e) => registry.updatePreset(p.id, { friendlyName: e.target.value })}
              style={inputStyle}
            />
            <span style={variantChipStyle}>{p.variant}</span>
            <span style={countChipStyle}>{bindingCount} binding{bindingCount === 1 ? "" : "s"}</span>
            {isPro && <span style={idChipStyle}>{p.id}</span>}
            <button
              type="button"
              aria-label={`Delete ${p.id}`}
              onClick={() => registry.deletePreset(p.id)}
              style={dangerBtnStyle}
            >
              Delete
            </button>
          </div>
        );
      })}
      <div style={addRowStyle}>
        <button
          type="button"
          onClick={() => registry.addPreset(generateNewPreset(category, registry.presets))}
          style={ghostBtnStyle}
        >
          + Add preset
        </button>
      </div>
    </div>
  );
};
