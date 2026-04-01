/**
 * FormStateOverlay - Display form submission success/error states
 * @module components/Forms/FormStateOverlay
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FormState } from "../../engine/forms/FormHandler";

// ============================================================================
// TYPES
// ============================================================================

export interface FormStateOverlayProps {
  /** Current form state */
  state: FormState;
  /** Success message to display */
  successMessage?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when user dismisses the overlay */
  onDismiss?: () => void;
  /** Auto-dismiss after this many milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FormStateOverlay: React.FC<FormStateOverlayProps> = ({
  state,
  successMessage = "Form submitted successfully!",
  errorMessage = "There was a problem submitting the form.",
  onDismiss,
  autoDismissMs = 5000,
}) => {
  const [visible, setVisible] = React.useState(false);

  // Show overlay when form is submitted or has errors
  React.useEffect(() => {
    if (state.isSubmitted || Object.keys(state.errors).length > 0) {
      setVisible(true);
    }
  }, [state.isSubmitted, state.errors]);

  // Auto-dismiss after timeout
  React.useEffect(() => {
    if (!visible || autoDismissMs === 0) return;

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || state.isSubmitting) return null;

  const isSuccess = state.isSubmitted && Object.keys(state.errors).length === 0;
  const hasErrors = Object.keys(state.errors).length > 0;

  if (!isSuccess && !hasErrors) return null;

  return (
    <div style={overlayStyles}>
      <div style={{ ...cardStyles, borderColor: isSuccess ? "#10b981" : "#ef4444" }}>
        <div style={iconContainerStyles}>{isSuccess ? <SuccessIcon /> : <ErrorIcon />}</div>
        <h3 style={{ ...titleStyles, color: isSuccess ? "#10b981" : "#ef4444" }}>
          {isSuccess ? "Success!" : "Error"}
        </h3>
        <p style={messageStyles}>{isSuccess ? successMessage : errorMessage}</p>
        {hasErrors && (
          <ul style={errorListStyles}>
            {Object.entries(state.errors).map(([field, message]) => (
              <li key={field} style={errorItemStyles}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleDismiss} style={buttonStyles}>
          {isSuccess ? "Continue" : "Try Again"}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ICONS
// ============================================================================

const SuccessIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  animation: "fadeIn 200ms ease-out",
};

const cardStyles: React.CSSProperties = {
  background: "var(--aqb-surface, #fff)",
  borderRadius: "12px",
  padding: "32px",
  maxWidth: "400px",
  width: "90%",
  textAlign: "center",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  borderTop: "4px solid",
  animation: "slideUp 200ms ease-out",
};

const iconContainerStyles: React.CSSProperties = {
  marginBottom: "16px",
};

const titleStyles: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "24px",
  fontWeight: 600,
};

const messageStyles: React.CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: "14px",
  color: "var(--aqb-text-secondary, #666)",
};

const errorListStyles: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "0 0 16px 0",
  textAlign: "left",
};

const errorItemStyles: React.CSSProperties = {
  fontSize: "13px",
  color: "#ef4444",
  padding: "8px 12px",
  background: "rgba(239, 68, 68, 0.1)",
  borderRadius: "6px",
  marginBottom: "8px",
};

const buttonStyles: React.CSSProperties = {
  background: "var(--aqb-accent, #3b82f6)",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 150ms ease",
};

export default FormStateOverlay;
