/**
 * PropertyField Component
 * Renders different input types for element properties
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType } from "../../../../shared/types/media";
import { InputRow, SelectRow } from "../../shared/controls";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import type { PropertyConfig } from "./config";

const styles = {
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,
  checkboxLabel: {
    fontSize: 12,
    color: INSPECTOR_TOKENS.textTertiary,
    fontWeight: 500,
    minWidth: 70,
  } as React.CSSProperties,
  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  } as React.CSSProperties,
  checkboxText: {
    fontSize: 12,
    color: INSPECTOR_TOKENS.textPrimary,
  } as React.CSSProperties,
  srcRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    marginBottom: 12,
  } as React.CSSProperties,
  browseButton: {
    padding: "8px 12px",
    background: INSPECTOR_TOKENS.accentAlpha20,
    border: `1px solid ${INSPECTOR_TOKENS.accentAlpha30}`,
    borderRadius: 6,
    color: INSPECTOR_TOKENS.accent,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    marginBottom: 12,
  } as React.CSSProperties,
};

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyFieldProps {
  prop: PropertyConfig;
  value: string;
  onChange: (id: string, value: string) => void;
  selectedElement: { id: string; type: string };
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PropertyField: React.FC<PropertyFieldProps> = ({
  prop,
  value,
  onChange,
  selectedElement,
  onOpenMediaLibrary,
}) => {
  // SELECT FIELD
  if (prop.type === "select") {
    return (
      <SelectRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        options={prop.options || []}
      />
    );
  }

  // CHECKBOX FIELD
  if (prop.type === "checkbox") {
    return (
      <div style={styles.checkboxRow}>
        <label style={styles.checkboxLabel}>{prop.label}</label>
        <label style={styles.checkboxWrapper}>
          <input
            type="checkbox"
            checked={value === "true" || value === prop.id}
            onChange={(e) => onChange(prop.id, e.target.checked ? "true" : "")}
            style={{ width: 16, height: 16 }}
          />
          <span style={styles.checkboxText}>{value ? "Enabled" : "Disabled"}</span>
        </label>
      </div>
    );
  }

  // TEXTAREA FIELD
  if (prop.type === "textarea") {
    return (
      <InputRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        placeholder={prop.placeholder}
        textarea
      />
    );
  }

  // IMAGE/VIDEO SRC WITH BROWSE BUTTON
  if (
    prop.id === "src" &&
    (selectedElement.type === "image" || selectedElement.type === "video") &&
    onOpenMediaLibrary
  ) {
    const mediaType: MediaAssetType = selectedElement.type === "video" ? "video" : "image";

    return (
      <div style={styles.srcRow}>
        <div style={{ flex: 1 }}>
          <InputRow
            label={prop.label}
            value={value}
            onChange={(v) => onChange(prop.id, v)}
            placeholder={prop.placeholder}
          />
        </div>
        <button
          onClick={() =>
            onOpenMediaLibrary([mediaType], (asset) => {
              onChange("src", asset.src);
            })
          }
          style={styles.browseButton}
          title="Browse media library"
        >
          Browse
        </button>
      </div>
    );
  }

  // DEFAULT TEXT FIELD
  return (
    <InputRow
      label={prop.label}
      value={value}
      onChange={(v) => onChange(prop.id, v)}
      placeholder={prop.placeholder}
    />
  );
};
