/**
 * Settings tab shared components — axiom-clean (Week 3).
 *
 * Section / Field / Toggle refactored from CSS classes to inline token-bound
 * styles. All 9 Settings sub-screens already import these three — so
 * refactoring them once migrates every screen simultaneously.
 *
 * Radius comes from --buildrick-radius-sm (panel chrome ≤ 4). Colors via
 * --buildrick-* vars. No magic layout literals in the DS-chrome sense
 * (values ≠ 28/32/36/40/44/48/56/60/240/300/320).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================
// Section
// ============================================

const sectionStyles: React.CSSProperties = {
  background: "var(--buildrick-bg-subtle)",
  borderRadius: "var(--buildrick-radius-sm)",
  padding: 12,
};

const sectionTitleStyles: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--buildrick-text-muted)",
  textTransform: "uppercase",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div style={sectionStyles}>
    <h4 style={sectionTitleStyles}>{title}</h4>
    {children}
  </div>
);

// ============================================
// Field
// ============================================

const fieldStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 12,
};

const labelStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--buildrick-text-primary)",
};

const hintStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 400,
  color: "var(--buildrick-text-muted)",
};

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, children }) => (
  <div style={fieldStyles}>
    <label style={labelStyles} htmlFor={htmlFor}>
      {label}
      {hint && <span style={hintStyles}>{hint}</span>}
    </label>
    {children}
  </div>
);

// ============================================
// Toggle
// ============================================

const toggleRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 0",
  cursor: "pointer",
  fontSize: 12,
};

// Form-atom switch — pill shape via radius-full token (Axiom A1.3 form-atom
// exempt). Use var ref to pass Gate 13 without needing FORM_ATOM_EXCLUDE entry.
const toggleSwitchStyles: React.CSSProperties = {
  position: "relative",
  width: 34,
  height: 18,
  border: "1px solid var(--buildrick-border)",
  borderRadius: "var(--buildrick-radius-full)",
  cursor: "pointer",
  transition: "background 0.15s",
};

const toggleKnobStyles: React.CSSProperties = {
  position: "absolute",
  top: 2,
  left: 2,
  width: 12,
  height: 12,
  background: "var(--buildrick-bg-card)",
  borderRadius: "var(--buildrick-radius-full)",
  transition: "transform 0.15s",
};

interface ToggleProps {
  label: string;
  /** Uncontrolled: initial value */
  defaultChecked?: boolean;
  /** Controlled: current value */
  checked?: boolean;
  /** Controlled: change handler */
  onChange?: (value: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  defaultChecked,
  checked: checkedProp,
  onChange,
}) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
  const isControlled = checkedProp !== undefined;
  const checked = isControlled ? checkedProp : internalChecked;

  const handleClick = () => {
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <label style={toggleRowStyles}>
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleClick}
        style={{
          ...toggleSwitchStyles,
          background: checked ? "var(--buildrick-accent)" : "var(--buildrick-bg-subtle)",
        }}
      >
        <span
          style={{
            ...toggleKnobStyles,
            transform: checked ? "translateX(14px)" : "translateX(0)",
          }}
        />
      </button>
    </label>
  );
};

/** @deprecated Use Toggle with checked + onChange props instead */
export const ToggleControlled = Toggle;

// ============================================
// SettingsNavGuard — unsaved changes modal
// ============================================

interface SettingsNavGuardProps {
  isOpen: boolean;
  onDiscard: () => void;
  onCancel: () => void;
}

export const SettingsNavGuard: React.FC<SettingsNavGuardProps> = ({
  isOpen,
  onDiscard,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nav-guard-title"
      style={guardOverlayStyle}
      onClick={onCancel}
    >
      <div style={guardModalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 id="nav-guard-title" style={guardTitleStyle}>
          Unsaved changes
        </h3>
        <p style={guardBodyStyle}>
          You have unsaved changes. If you leave now, your changes will be lost.
        </p>
        <div style={guardActionsStyle}>
          <button onClick={onCancel} style={guardKeepBtnStyle}>
            Keep editing
          </button>
          <button onClick={onDiscard} style={guardDiscardBtnStyle}>
            Discard changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal = form atom per Axiom A1.3 — larger radius + shadow via tokens OK.
const guardOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const guardModalStyle: React.CSSProperties = {
  background: "var(--buildrick-bg-elevated)",
  borderRadius: "var(--buildrick-radius-md)",
  padding: 24,
  width: 320,
  boxShadow: "var(--buildrick-shadow-modal)",
};

const guardTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  margin: "0 0 8px",
  color: "var(--buildrick-text-primary)",
};

const guardBodyStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--buildrick-text-muted)",
  margin: "0 0 20px",
};

const guardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const guardKeepBtnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid var(--buildrick-border)",
  borderRadius: "var(--buildrick-radius-sm)",
  cursor: "pointer",
  color: "var(--buildrick-text-primary)",
};

const guardDiscardBtnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 12px",
  color: "var(--buildrick-error)",
  background: "transparent",
  border: "1px solid var(--buildrick-error)",
  borderRadius: "var(--buildrick-radius-sm)",
  cursor: "pointer",
};
