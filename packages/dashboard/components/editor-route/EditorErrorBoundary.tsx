"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type FallbackProps = { error: Error; retry: () => void };

interface Props {
  fallback: (props: FallbackProps) => ReactNode;
  children: ReactNode;
  siteId?: string;
}

interface State {
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Phase 3 observability scaffold: structured log for aggregation/alerting.
    // When Sentry is wired, captureException with tag route_unified=true here.
    console.error(
      JSON.stringify({
        type: error.name === "ChunkLoadError" ? "chunk_load_error" : "editor_crash",
        name: error.name,
        message: error.message,
        siteId: this.props.siteId,
        route_unified: true,
        componentStack: info.componentStack?.split("\n").slice(0, 5).join("\n"),
        ts: Date.now(),
      }),
    );
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, retry: this.retry });
    }
    return this.props.children;
  }
}

export function EditorErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "'Inter Tight', sans-serif",
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 500 }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
          background: "#2D6DFF",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Reload
      </button>
    </div>
  );
}
