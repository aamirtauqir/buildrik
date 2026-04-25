/**
 * Settings tab — shared primitives.
 *
 * Emits .bd-set-* classes defined in ./settings.css. All visual chrome lives in
 * the stylesheet; this file owns only the React shape and ARIA/semantics.
 *
 * Primitives used by every screen:
 *   <Section title desc>      — section block with heading + optional description
 *   <Field label hint>        — form field wrapper with label
 *   <Input> <Textarea> <Select>
 *   <SwitchRow>               — toggle row with title/desc + switch
 *   <Screen>                  — outer wrapper used by screens (thin, mostly semantic)
 *
 * Preserved for LockedScreen (token-only migration):
 *   <LockedContainer> <LockedIcon> <LockedTitle> <LockedDesc> <LockedBtn>
 *
 * Refreshed skin: <SettingsNavGuard>
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./settings.css";

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  desc?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, desc, children }) => (
  <div className="bd-set-section">
    <h3 className="bd-set-section-h">{title}</h3>
    {desc ? <div className="bd-set-section-d">{desc}</div> : null}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Field
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, children }) => (
  <div className="bd-set-field">
    <label className="bd-set-field-lbl" htmlFor={htmlFor}>
      <span>{label}</span>
      {hint ? <span className="bd-set-field-hint">{hint}</span> : null}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input / Textarea / Select
// ─────────────────────────────────────────────────────────────────────────────

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    />
  )
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ─────────────────────────────────────────────────────────────────────────────
// SwitchRow
// ─────────────────────────────────────────────────────────────────────────────

interface SwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}) => (
  <div className="bd-set-switch-row">
    <div className="bd-set-switch-row-info">
      <div className="bd-set-switch-row-t">{title}</div>
      {description ? <div className="bd-set-switch-row-d">{description}</div> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`bd-set-switch${checked ? " on" : ""}`}
    >
      <span className="bd-set-switch-knob" />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen — outer wrapper
// ─────────────────────────────────────────────────────────────────────────────

export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// ─────────────────────────────────────────────────────────────────────────────
// Locked primitives — token migration only, layout preserved
// ─────────────────────────────────────────────────────────────────────────────

// Locked-screen min-height + copy max-width.
// Anchors the locked card vertically and caps copy width in the wide sidebar.
// Distinct from layout SSOT widths (SIDEBAR_WIDE / INSPECTOR_W = 320) — these
// are content-cap dimensions, not chrome-rail dimensions, so they don't share
// the SSOT export.
// @lint-layout-policy: locked-empty-state — vertical anchor + copy max width
const LOCKED_MIN_HEIGHT = 16 * 20;
const LOCKED_MAX_WIDTH = 16 * 20;
// Vertical padding for the locked card (top/bottom). Outside the layout SSOT
// because it's content-internal padding, not a chrome dimension.
// @lint-layout-policy: locked-empty-state inner padding-Y
const LOCKED_PAD_Y = 8 * 6;

const lockedContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: LOCKED_PAD_Y,
  paddingBottom: LOCKED_PAD_Y,
  paddingLeft: 24,
  paddingRight: 24,
  textAlign: "center",
  gap: 12,
  minHeight: LOCKED_MIN_HEIGHT,
};
const lockedIconStyle: React.CSSProperties = {
  marginBottom: 4,
};
const lockedTitleStyle: React.CSSProperties = {
  font: "600 14px var(--bd-font)",
  color: "var(--bd-fg-heading)",
  margin: 0,
};
const lockedDescStyle: React.CSSProperties = {
  font: "500 12px var(--bd-font)",
  color: "var(--bd-fg-muted)",
  maxWidth: LOCKED_MAX_WIDTH,
  lineHeight: 1.5,
  margin: 0,
};
const lockedBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 16px",
  borderRadius: "var(--buildrick-radius-md)",
  background: "var(--bd-accent)",
  color: "#fff",
  border: "none",
  font: "600 12px var(--bd-font)",
  cursor: "pointer",
};

export const LockedContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedContainerStyle}>{children}</div>
);
export const LockedIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedIconStyle}>{children}</div>
);
export const LockedTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={lockedTitleStyle}>{children}</h3>
);
export const LockedDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={lockedDescStyle}>{children}</p>
);

export const LockedBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ style, type = "button", children, ...rest }) => (
  <button type={type} style={{ ...lockedBtnStyle, ...style }} {...rest}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SettingsNavGuard — refreshed skin
// ─────────────────────────────────────────────────────────────────────────────

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
      className="bd-set-guard-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bd-set-guard-title"
    >
      <div className="bd-set-guard-modal">
        <h4 id="bd-set-guard-title" className="bd-set-guard-title">
          Discard unsaved changes?
        </h4>
        <p className="bd-set-guard-body">
          You have unsaved edits in this section. Switching will discard them. Save first to keep your changes.
        </p>
        <div className="bd-set-guard-actions">
          <button type="button" className="bd-set-btn sec" onClick={onCancel}>
            Keep editing
          </button>
          <button type="button" className="bd-set-btn pri" onClick={onDiscard}>
            Discard & switch
          </button>
        </div>
      </div>
    </div>
  );
};
