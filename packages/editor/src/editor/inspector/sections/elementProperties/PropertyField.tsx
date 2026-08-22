/**
 * PropertyField Component
 * Renders different input types for element properties
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType } from "../../../../shared/types/media";
import { InputRow, SelectRow } from "../../shared/controls";
import type { PropertyConfig } from "./config";
import { Button, Checkbox } from "@/editor/chrome-ui";
const styles = {
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,
  checkboxLabel: {
    fontSize: 12,
    color: "var(--bk-ink-muted)",
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
    color: "var(--bk-ink)",
  } as React.CSSProperties,
  nameWarning: {
    margin: "-6px 0 10px",
    fontSize: 11,
    lineHeight: 1.45,
    color: "var(--bk-warning-ink, var(--bk-ink-muted))",
  } as React.CSSProperties,
  srcRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    marginBottom: 12,
  } as React.CSSProperties,
  browseButton: {
    padding: "8px 12px",
    background: "var(--bk-accent-tint)",
    border: "1px solid var(--bk-alpha-accent-30)",
    borderRadius: 6,
    color: "var(--bk-accent)",
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

/* A `name` whose value is a form/document property is stripped by the
   sanitizer as DOM clobbering: `name="name"` inside a form makes `form.name`
   return the input rather than the form's name. The value disappears at
   publish, not at typing — the editor shows it, the canvas shows it, and the
   visitor's browser receives an unnamed control whose answer is dropped from
   the submission. Measured through `sanitizeHTML`: these five are stripped,
   while email / fullname / message / choice survive. Warn rather than rewrite:
   silently changing what someone typed is the same failure in the other
   direction. */
const CLOBBERING_NAMES = new Set(["name", "id", "submit", "action", "method"]);

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
          <Checkbox
            color="blue"
            className="tw:bg-white"
            checked={value === "true" || value === prop.id}
            onChange={(e) => onChange(prop.id, e.target.checked ? "true" : "")}
            style={{ width: 16, height: 16 }} />
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
        <Button
          onClick={() =>
            onOpenMediaLibrary([mediaType], (asset) => {
              onChange("src", asset.src);
            })
          }
          style={styles.browseButton}
          title="Browse media library"
        >
          Browse
        </Button>
      </div>
    );
  }

  // DEFAULT TEXT FIELD
  return (
    <>
      <InputRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        placeholder={prop.placeholder}
      />
      {prop.id === "name" && CLOBBERING_NAMES.has(value.trim().toLowerCase()) && (
        <p style={styles.nameWarning} role="status">
          &ldquo;{value.trim()}&rdquo; won&rsquo;t survive publishing — it collides with a form
          property, so the field ships with no name and its answer is dropped from the submission.
          Try &ldquo;full{value.trim().toLowerCase() === "name" ? "name" : "_" + value.trim().toLowerCase()}&rdquo;.
        </p>
      )}
    </>
  );
};
