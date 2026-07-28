/**
 * PanelErrorState - Standardized error display for sidebar panels
 * Slice 6B: composes ui EmptyState + Button (was a wrapper around the retired
 * shared/ui ErrorState).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, EmptyState } from "@/editor/ui";

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
  <div style={wrapperStyles} role="alert" aria-live="polite">
    <EmptyState
      size="sm"
      title="Something went wrong"
      body={message}
      action={
        onRetry ? (
          <Button kind="primary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
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
