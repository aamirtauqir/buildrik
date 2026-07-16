/**
 * ErrorState / FieldError / ErrorBoundary tests — severity variants,
 * details toggle, action wiring, inline mode, and boundary catch/reset.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ErrorState, FieldError, ErrorBoundary } from "../ErrorState";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorState — full card", () => {
  it("renders the message with the severity's default title and role=alert", () => {
    render(<ErrorState message="Could not load blocks." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent("Could not load blocks.");
  });

  it("uses severity-specific default titles", () => {
    render(<ErrorState message="m1" severity="warning" />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    cleanup();
    render(<ErrorState message="m2" severity="info" />);
    expect(screen.getByText("Information")).toBeInTheDocument();
  });

  it("prefers an explicit title", () => {
    render(<ErrorState title="Publish failed" message="Vercel rejected the deploy." />);
    expect(screen.getByText("Publish failed")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("toggles the details panel and aria-expanded", () => {
    render(<ErrorState message="m" details="stack trace here" />);
    const toggle = screen.getByRole("button", { name: /Show details/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("stack trace here")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText("stack trace here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hide details/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("hides the toggle when showDetailsToggle is false", () => {
    render(<ErrorState message="m" details="secret" showDetailsToggle={false} />);
    expect(screen.queryByText(/Show details/)).not.toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("wires retry and secondary actions", () => {
    const onRetry = vi.fn();
    const onSecondary = vi.fn();
    render(
      <ErrorState
        message="m"
        onRetry={onRetry}
        retryLabel="Reload"
        secondaryAction={{ label: "Go back", onClick: onSecondary }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Reload/ }));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("renders no action row without callbacks", () => {
    render(<ErrorState message="m" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ErrorState — inline mode", () => {
  it("renders the compact alert with an underlined retry", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Sync failed" inline onRetry={onRetry} retryLabel="Retry" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Sync failed");
    // Inline mode shows no title, only the message.
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("FieldError", () => {
  it("renders an inline alert with the message", () => {
    render(<FieldError message="Email is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });
});

describe("ErrorBoundary", () => {
  function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error("boom");
    return <div>recovered</div>;
  }

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>healthy child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("healthy child")).toBeInTheDocument();
  });

  it("catches a throwing child, shows the default ErrorState, and calls onError", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // silence React's boundary log
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred in this component.")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.anything());
  });

  it("renders a custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>custom fallback</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("Reset re-renders the children and calls onReset", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();

    function Harness() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary onReset={() => { onReset(); setShouldThrow(false); }}>
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Harness />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });
});
