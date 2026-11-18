/**
 * Section error boundary (2L9 B4-S05 `255:84358`): one section that fails to
 * render is replaced by its own notice — the rest of the tab stays usable.
 *
 *   Typography unavailable
 *   We could not display these controls. Your text and saved values are unchanged.
 *   [ Retry Typography ]
 *
 * Retry renders the section again; a new selection starts clean. The tab-wide
 * `InspectorErrorBoundary` stays above it for a failure outside a section.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { captureError } from "@/shared/utils/errorTracking";
import { Button } from "@/editor/chrome-ui";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";

interface Props {
  title: string;
  /** A change (the selected element) clears the failure. */
  resetKey: string;
  children: React.ReactNode;
}

export class SectionErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { component: info.componentStack ?? "unknown", section: this.props.title });
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    const { title } = this.props;
    return (
      <div role="alert" className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3" data-testid="inspector-section-error">
        <div className={GROUP_TITLE}>{title} unavailable</div>
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">We could not display these controls. Your text and saved values are unchanged.</p>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => this.setState({ failed: false })}>
          Retry {title}
        </Button>
      </div>
    );
  }
}
