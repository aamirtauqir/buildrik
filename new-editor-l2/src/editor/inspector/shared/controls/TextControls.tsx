/**
 * Text Controls for Pro Inspector
 * TextInputRow, InlineInput, SectionLabel, SubSectionTitle
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TEXT INPUT ROW (inline text input with label)
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
  labelWidth = 50,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 10, color: "#71717a", minWidth: labelWidth }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "6px 8px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4,
          color: "#e4e4e7",
          fontSize: 11,
          outline: "none",
        }}
      />
    </div>
  );
};

// ============================================================================
// INLINE INPUT (compact input with label)
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
  labelWidth = 50,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
      }}
    >
      <label
        style={{
          fontSize: 10,
          color: "#71717a",
          fontWeight: 500,
          minWidth: labelWidth,
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "5px 6px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4,
          color: "#e4e4e7",
          fontSize: 10,
          outline: "none",
        }}
      />
    </div>
  );
};

// ============================================================================
// SECTION LABEL
// ============================================================================

export interface SectionLabelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children, style }) => {
  return (
    <label
      style={{
        fontSize: 11,
        color: "#71717a",
        fontWeight: 500,
        display: "block",
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </label>
  );
};

// ============================================================================
// SUB SECTION TITLE (smaller section headers)
// ============================================================================

export interface SubSectionTitleProps {
  children: React.ReactNode;
}

export const SubSectionTitle: React.FC<SubSectionTitleProps> = ({ children }) => (
  <div
    style={{
      fontSize: 9,
      color: "#52525b",
      fontWeight: 600,
      marginBottom: 8,
      marginTop: 12,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}
  >
    {children}
  </div>
);
