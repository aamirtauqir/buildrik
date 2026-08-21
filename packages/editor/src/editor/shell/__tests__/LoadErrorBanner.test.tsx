/**
 * LoadErrorBanner (S1.5) — a persistent, actionable surface when loading the
 * site from the dashboard fails. Unlike the old disappearing toast, it stays
 * until the user acts: auth failure offers Sign in + Retry; a network failure
 * offers Retry. Reads error≠dismissed-and-forgotten (design DF5 sibling).
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadErrorBanner } from "../LoadErrorBanner";

function renderBanner(props: Partial<React.ComponentProps<typeof LoadErrorBanner>> = {}) {
  return render(
    <LoadErrorBanner kind={null} onRetry={vi.fn()} onSignIn={vi.fn()} {...props} />,
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

  /* A deleted site is not a blip. Walked live against a trashed site: the
     editor loaded a blank "Page 1", the banner said "you're seeing local
     changes for now", and the canvas invited the user to Start blank —
     while every save was refused. */
  it("a missing site says so, and does not offer a Retry that cannot work", () => {
    const onRetry = vi.fn();
    const onSignIn = vi.fn();
    renderBanner({ kind: "missing", onRetry, onSignIn });
    expect(screen.getByText(/isn't there anymore/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing you do here can be saved/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^retry$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /go to dashboard/i }));
    expect(onSignIn).toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("does not tell a missing site it is seeing local changes for now", () => {
    renderBanner({ kind: "missing" });
    expect(screen.queryByText(/local changes for now/i)).not.toBeInTheDocument();
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
