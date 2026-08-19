/**
 * Text Controls — TextInputRow, InlineInput, SectionLabel, SubSectionTitle.
 * Ported to .bdi-text + .bdi-row-ctrl + .bdi-sub-label.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextField } from "@/editor/chrome-ui";

// ============================================================================
// TEXT INPUT ROW
// ============================================================================

export interface TextInputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  labelWidth?: number;
}

export const TextInputRow: React.FC<TextInputRowProps> = ({
  label,
  value,
  onChange,
  placeholder = "0px",
}) => {
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

// ============================================================================
// INLINE INPUT (same as TextInputRow — kept for API parity)
// ============================================================================

export interface InlineInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  labelWidth?: number;
}

export const InlineInput: React.FC<InlineInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "auto",
}) => {
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SECTION LABEL (inline block label)
// ============================================================================

export interface SectionLabelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children, style }) => (
  <label
    style={{
      font: "500 11px var(--bk-font-ui)",
      color: "var(--bk-ink-soft)",
      display: "block",
      marginBottom: 4,
      ...style,
    }}
  >
    {children}
  </label>
);

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
