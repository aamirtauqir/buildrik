/**
 * PanelErrorState - Standardized error display for sidebar panels
 * Slice 6B: composes ui EmptyState + Button (was a wrapper around the retired
 * shared/ui ErrorState).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EmptyState, Button } from "@/editor/chrome-ui";

export interface PanelErrorStateProps {
  /**
   * The headline. Every panel's load-error board writes its own — Brand's
   * 781:4311 says "Couldn't load your brand system." — because "Something
   * went wrong" names nothing the reader can act on or reason about.
   */
  title?: string;
  /** Error message to display */
  message?: string;
  /** Retry callback — shows "Try again" button when provided */
  onRetry?: () => void;
}

export const PanelErrorState: React.FC<PanelErrorStateProps> = ({
  title = "Something went wrong",
  message = "Something went wrong",
  onRetry,
}) => (
  <div style={wrapperStyles} role="alert" aria-live="polite">
    <EmptyState
      size="sm"
      title={title}
      body={message}
      action={
        onRetry ? (
          <Button size="xs" onClick={onRetry}>
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
