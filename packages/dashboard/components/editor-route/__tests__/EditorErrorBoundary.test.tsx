/**
 * Unification spec §550 — EditorErrorBoundary
 * Asserts ChunkLoadError vs generic error routing + structured-log emission.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";
import { EditorErrorBoundary, EditorErrorScreen } from "../EditorErrorBoundary";

class ChunkLoadError extends Error {
  constructor(message = "Loading chunk failed") {
    super(message);
    this.name = "ChunkLoadError";
  }
}

function Boom({ error }: { error: Error }): JSX.Element {
  throw error;
}

describe("EditorErrorBoundary", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
  });

  it("renders fallback with the thrown error", () => {
    const fallback = vi.fn(({ error }: { error: Error }) => <p>caught: {error.message}</p>);
    render(
      <EditorErrorBoundary fallback={fallback} siteId="site-1">
        <Boom error={new Error("kaboom")} />
      </EditorErrorBoundary>,
    );
    expect(screen.getByText(/caught: kaboom/)).toBeInTheDocument();
    expect(fallback).toHaveBeenCalled();
  });

  it("emits chunk_load_error log on ChunkLoadError + editor_crash on generic", () => {
    render(
      <EditorErrorBoundary fallback={() => <p>fb</p>} siteId="site-A">
        <Boom error={new ChunkLoadError()} />
      </EditorErrorBoundary>,
    );
    render(
      <EditorErrorBoundary fallback={() => <p>fb</p>} siteId="site-B">
        <Boom error={new Error("normal")} />
      </EditorErrorBoundary>,
    );

    const logs = errSpy.mock.calls.map((c) => c[0]).filter((l): l is string => typeof l === "string");
    const chunk = logs.find((l) => l.includes('"type":"chunk_load_error"'));
    const crash = logs.find((l) => l.includes('"type":"editor_crash"'));
    expect(chunk).toBeTruthy();
    expect(crash).toBeTruthy();
    expect(chunk).toContain('"route_unified":true');
    expect(chunk).toContain('"siteId":"site-A"');
  });

  it("retry resets error state and re-renders children", () => {
    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) throw new Error("boom");
      return <p>recovered</p>;
    }
    let retryFn: (() => void) | null = null;
    const fallback = ({ retry }: { error: Error; retry: () => void }) => {
      retryFn = retry;
      return <button onClick={retry}>Retry</button>;
    };
    render(
      <EditorErrorBoundary fallback={fallback}>
        <MaybeBoom />
      </EditorErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    shouldThrow = false;
    act(() => { retryFn?.(); });
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });
});

describe("EditorErrorScreen", () => {
  it("renders message + Reload button + onRetry fires on click", () => {
    const onRetry = vi.fn();
    render(<EditorErrorScreen message="oops" onRetry={onRetry} />);
    expect(screen.getByText("oops")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
