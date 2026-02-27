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

export const Toggle: React.FC<ToggleProps> = ({ label, defaultChecked, checked: checkedProp, onChange }) => {
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
