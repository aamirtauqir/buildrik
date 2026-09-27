/**
 * PropertyField Component
 * Renders different input types for element properties
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputRow, SelectRow } from "../../shared/controls";
import type { PropertyConfig } from "./config";
import { Checkbox } from "@/editor/chrome-ui";
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
  nameWarning: {
    margin: "-6px 0 10px",
    fontSize: 11,
    lineHeight: 1.45,
    color: "var(--bk-warning-ink, var(--bk-ink-muted))",
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
}) => {
  const checkboxId = React.useId();
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

  // CHECKBOX FIELD — the label names the property and is the box's
  // accessible name; the state is the box itself (DD-22, P-11b). The loader
  // hands a boolean attribute over as "true" (present) or "" (absent).
  if (prop.type === "checkbox") {
    return (
      <div style={styles.checkboxRow}>
        <label htmlFor={checkboxId} style={styles.checkboxLabel}>{prop.label}</label>
        <Checkbox
          id={checkboxId}
          color="blue"
          className="tw:bg-white"
          checked={value === "true"}
          onChange={(e) => onChange(prop.id, e.target.checked ? "true" : "")}
          style={{ width: 16, height: 16 }} />
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
