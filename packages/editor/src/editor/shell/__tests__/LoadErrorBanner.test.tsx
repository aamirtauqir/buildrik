/**
 * LoadErrorBanner (S1.5) — a persistent, actionable surface when loading the
 * site from the dashboard fails. Unlike the old disappearing toast, it stays
 * until the user acts: auth failure offers Sign in + Retry; a network failure
 * offers Retry. Reads error≠dismissed-and-forgotten (design DF5 sibling).
 */
import * as React from "react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadErrorBanner } from "../LoadErrorBanner";

function renderBanner(props: Partial<React.ComponentProps<typeof LoadErrorBanner>> = {}) {
  return render(
    <TooltipProvider>
      <LoadErrorBanner kind={null} onRetry={vi.fn()} onSignIn={vi.fn()} {...props} />
    </TooltipProvider>,
  );
}

afterEach(cleanup);

describe("LoadErrorBanner", () => {
  it("renders nothing when there is no error", () => {
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("auth failure offers Sign in + Retry", () => {
    const onSignIn = vi.fn();
    const onRetry = vi.fn();
    renderBanner({ kind: "auth", onSignIn, onRetry });
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onSignIn).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("network failure offers Retry and does not offer Sign in", () => {
    const onRetry = vi.fn();
    renderBanner({ kind: "network", onRetry });
    expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
