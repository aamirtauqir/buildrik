/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * SettingsErrorBoundary — Catches render errors inside the page-settings
 * drawer so a bad page / composer state can't crash the whole Pages tab.
 *
 * Local to Pages to avoid cross-concern coupling with inspector/*.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { captureError } from "../../../../../shared/utils/errorTracking";

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class SettingsErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { component: info.componentStack ?? "PageSettingsDrawer" });
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="pg-drawer-slide" role="alert">
        <div className="pg-drawer-slide__hdr">
          <button
            className="pg-drawer-slide__back"
            onClick={this.props.onClose}
            aria-label="Close page settings"
            title="Close"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="pg-drawer-slide__title">Settings error</div>
        </div>
        <div className="pg-drawer-slide__body" style={{ padding: 20 }}>
          <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: undefined })}
            style={{
              padding: "6px 12px",
              background: "rgba(45,109,255,0.15)",
              border: "1px solid rgba(45,109,255,0.4)",
              borderRadius: 4,
              color: "#a5c0ff",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
