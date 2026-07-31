/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * Inspector Error Boundary
 * Catches errors in inspector sections to prevent entire panel crashes
 * @license BSD-3-Clause
 */

import * as React from "react";
import { captureError } from "../../../shared/utils/errorTracking";
import { trackSidebar } from "../../../shared/utils/sidebarAnalytics";
import { Button } from "@/editor/chrome-ui";

interface InspectorErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render on error */
  fallback?: React.ReactNode;
}

interface InspectorErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/**
 * Error boundary for the inspector panel
 * Provides graceful degradation when a section throws an error
 */
export class InspectorErrorBoundary extends React.Component<
  InspectorErrorBoundaryProps,
  InspectorErrorBoundaryState
> {
  constructor(props: InspectorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: Error): InspectorErrorBoundaryState {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { component: info.componentStack ?? "unknown" });
    trackSidebar("error", { error_type: "render", message: error.message });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: 16,
            margin: 12,
            background: "var(--bk-error-tint)",
            border: "1px solid var(--bk-error)",
            borderRadius: 8,
            color: "var(--bk-error)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Inspector Error</div>
          <div style={{ fontSize: 12, color: "var(--bk-error)", marginBottom: 12 }}>
            {this.state.message}
          </div>
          <Button
            onClick={() => this.setState({ hasError: false, message: undefined })}
            style={{
              padding: "6px 12px",
              background: "var(--bk-error-tint)",
              border: "1px solid var(--bk-error)",
              borderRadius: 4,
              color: "var(--bk-error)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default InspectorErrorBoundary;
