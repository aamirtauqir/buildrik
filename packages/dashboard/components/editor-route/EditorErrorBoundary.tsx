"use client";

import { Component, type ReactNode } from "react";

type FallbackProps = { error: Error; retry: () => void };

interface Props {
  fallback: (props: FallbackProps) => ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
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
