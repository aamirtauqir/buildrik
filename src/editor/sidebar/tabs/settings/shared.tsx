/**
 * Settings tab shared components
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../../../../shared/ui/Button";
import {
  sectionStyles,
  sectionTitleStyles,
  fieldStyles,
  labelStyles,
  hintStyles,
  toggleRowStyles,
  toggleStyles,
  toggleKnobStyles,
  integrationCardStyles,
  integrationNameStyles,
  integrationDescStyles,
} from "./styles";

// ============================================
// Section Component
// ============================================

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
// Field Component
// ============================================

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div style={fieldStyles}>
    <label style={labelStyles}>
      {label}
      {hint && <span style={hintStyles}>{hint}</span>}
    </label>
    {children}
  </div>
);

// ============================================
// Toggle Component (supports both controlled and uncontrolled modes)
// Controlled: pass `checked` + `onChange`
// Uncontrolled: pass `defaultChecked` (or nothing)
// ============================================

interface ToggleProps {
  label: string;
  /** Uncontrolled mode: initial value */
  defaultChecked?: boolean;
  /** Controlled mode: current value */
  checked?: boolean;
  /** Controlled mode: change handler */
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
        onClick={handleClick}
        style={{
          ...toggleStyles,
          background: checked ? "var(--aqb-primary)" : "var(--aqb-surface-4)",
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

const guardOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const guardModalStyle: React.CSSProperties = {
  background: "var(--aqb-surface, #fff)",
  borderRadius: 8,
  padding: "24px",
  width: 320,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

const guardTitleStyle: React.CSSProperties = {
  fontSize: "var(--aqb-font-lg, 15px)",
  fontWeight: 600,
  margin: "0 0 8px",
};

const guardBodyStyle: React.CSSProperties = {
  fontSize: "var(--aqb-font-sm, 13px)",
  color: "var(--aqb-text-muted, #666)",
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
  border: "1px solid var(--aqb-border)",
  borderRadius: 4,
  cursor: "pointer",
};

const guardDiscardBtnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 12px",
  color: "#dc2626",
  background: "transparent",
  border: "1px solid #dc2626",
  borderRadius: 4,
  cursor: "pointer",
};

// ============================================
// Integration Card Component
// ============================================

interface IntegrationCardProps {
  name: string;
  description: string;
  connected: boolean;
}

export const IntegrationCard = React.memo<IntegrationCardProps>(
  ({ name, description, connected }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isConnected, setIsConnected] = React.useState(connected);

    const handleToggle = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setIsConnected(!isConnected);
      setIsLoading(false);
    };

    return (
      <div style={integrationCardStyles}>
        <div style={{ flex: 1 }}>
          <div style={integrationNameStyles}>{name}</div>
          <div style={integrationDescStyles}>{description}</div>
        </div>
        <Button
          onClick={handleToggle}
          loading={isLoading}
          disabled={isLoading}
          variant={isConnected ? "ghost" : "primary"}
          size="sm"
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>
    );
  }
);
