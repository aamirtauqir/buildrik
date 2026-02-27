/**
 * AI Loading Indicator
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Spinner } from "../shared/ui";

export interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "AI is thinking...",
}) => {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <Spinner size="lg" />
      <p style={{ marginTop: 16, color: "var(--aqb-text-muted)" }}>{message}</p>
    </div>
  );
};

export default LoadingIndicator;
