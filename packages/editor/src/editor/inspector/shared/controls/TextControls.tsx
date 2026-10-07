/**
 * Text Controls — TextInputRow, SubSectionTitle.
 * Ported to .bdi-text + .bdi-row-ctrl + .bdi-sub-label.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextField } from "@/editor/chrome-ui";
import { useInspectorField, mixedName } from "./InspectorFieldContext";

// ============================================================================
// TEXT INPUT ROW
// ============================================================================

export interface TextInputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  labelWidth?: number;
  /** The CSS property it edits — "Mixed" and read-only come from the field context. */
  property?: string;
}

export const TextInputRow: React.FC<TextInputRowProps> = ({
  label,
  value,
  onChange,
  placeholder = "0px",
  property,
}) => {
  const field = useInspectorField(property);
  /* Same gap as the sliders: a printed label that was never tied to the
     field, so the only accessible name these rows had was their placeholder —
     the custom box-shadow row announced itself as "0 4px 6px rgba(0,0,0,0.1)". */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>{label}</label>
      <div className="bdi-row-content">
        <TextField
          id={id}
          type="text"
          className="bdi-text"
          readOnly={field.readOnly}
          aria-readonly={field.readOnly || undefined}
          aria-label={field.mixed ? mixedName(label) : undefined}
          value={field.mixed ? "" : value}
          onChange={(e) => {
            if (field.readOnly) return;
            field.startTyping();
            onChange(e.target.value);
          }}
          onBlur={field.stopTyping}
          placeholder={field.mixed ? "Mixed" : placeholder}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SUB SECTION TITLE (uppercase mini-header)
// ============================================================================

export interface SubSectionTitleProps {
  children: React.ReactNode;
}

export const SubSectionTitle: React.FC<SubSectionTitleProps> = ({ children }) => (
  <div className="bdi-sub-label" style={{ marginBottom: 4 }}>
    {children}
  </div>
);
