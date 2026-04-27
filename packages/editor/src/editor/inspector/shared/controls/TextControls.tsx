import { Input } from "@/editor/shared/vibcoder/Input";
/**
 * Text Controls — TextInputRow, InlineInput, SectionLabel, SubSectionTitle.
 * Ported to .bdi-text + .bdi-row-ctrl + .bdi-sub-label.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

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
}) => (
  <div className="bdi-row-ctrl">
    <label className="bdi-lb">{label}</label>
    <div className="bdi-row-content">
      <Input
        type="text"
        className="bdi-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

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
}) => (
  <div className="bdi-row-ctrl">
    <label className="bdi-lb">{label}</label>
    <div className="bdi-row-content">
      <Input
        type="text"
        className="bdi-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

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
      font: "500 11px var(--bd-font)",
      color: "var(--bd-fg-secondary)",
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
