/**
 * Inspector Error Boundary — catches a render error in the tab's sections so
 * the panel survives it (2L9 S03/S04): "Unable to display Inspector",
 * "{name} is still selected. This display error has not changed your
 * document.", Try again. The selection and the tab live above the boundary
 * (ProInspector), so Try again returns to the same element on the same tab.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { captureError } from "@/shared/utils/errorTracking";
import { trackSidebar } from "@/shared/utils/sidebarAnalytics";
import { Button } from "@/editor/chrome-ui";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";

interface InspectorErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render on error */
  fallback?: React.ReactNode;
  /** The selected element's name, for "… is still selected". */
  targetName?: string;
}

interface InspectorErrorBoundaryState {
  hasError: boolean;
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
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): InspectorErrorBoundaryState {
    return { hasError: true };
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
          role="alert"
          className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pt-4"
          data-testid="inspector-error"
        >
          <div className="tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Unable to display Inspector</div>
          <div className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
            {this.props.targetName ? `${this.props.targetName} is still selected. ` : null}This display error has not changed your document.
          </div>
          {/* 2L9 S03: a plain group, the one way out full width and primary. */}
          <Button size="xs" variant="primary" className={`${WIDE_BUTTON} tw:text-white!`} onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default InspectorErrorBoundary;
