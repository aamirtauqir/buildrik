/**
 * PanelErrorState - Standardized error display for sidebar panels
 * Thin wrapper around ui/ErrorState with panel-appropriate defaults
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ErrorState } from "../../../shared/ui/ErrorState";

export interface PanelErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Retry callback — shows "Try again" button when provided */
  onRetry?: () => void;
}

export const PanelErrorState: React.FC<PanelErrorStateProps> = ({
  message = "Something went wrong",
  onRetry,
}) => (
  <div style={wrapperStyles}>
    <ErrorState
      message={message}
      severity="error"
      size="sm"
      onRetry={onRetry}
      retryLabel="Try again"
    />
  </div>
);

const wrapperStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  padding: 16,
};
