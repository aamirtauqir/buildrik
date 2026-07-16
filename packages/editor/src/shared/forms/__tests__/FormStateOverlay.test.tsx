/**
 * FormStateOverlay tests — success/error surfaces, dismissal, auto-dismiss
 * timing, and the isSubmitting guard.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { FormStateOverlay } from "../FormStateOverlay";
import type { FormState } from "../../../engine/forms/FormHandler";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const mkState = (overrides: Partial<FormState> = {}): FormState => ({
  values: {},
  errors: {},
  isSubmitting: false,
  isSubmitted: false,
  ...overrides,
});

describe("FormStateOverlay — visibility", () => {
  it("renders nothing for an untouched form", () => {
    const { container } = render(<FormStateOverlay state={mkState()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while submitting", () => {
    const { container } = render(
      <FormStateOverlay state={mkState({ isSubmitted: true, isSubmitting: true })} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("FormStateOverlay — success", () => {
  it("shows the success card with the custom message and Continue action", () => {
    render(
      <FormStateOverlay
        state={mkState({ isSubmitted: true })}
        successMessage="Shukriya! We got it."
      />
    );
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Shukriya! We got it.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("dismisses on Continue and notifies onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <FormStateOverlay state={mkState({ isSubmitted: true })} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });
});

describe("FormStateOverlay — errors", () => {
  it("shows the error card with a per-field error list and Try Again", () => {
    render(
      <FormStateOverlay
        state={mkState({ errors: { email: "Email is required", name: "Too short" } })}
        errorMessage="Fix the fields below."
      />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Fix the fields below.")).toBeInTheDocument();
    expect(screen.getByText("email:")).toBeInTheDocument();
    expect(screen.getByText(/Email is required/)).toBeInTheDocument();
    expect(screen.getByText("name:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  });

  it("errors win over isSubmitted for the card tone", () => {
    render(
      <FormStateOverlay
        state={mkState({ isSubmitted: true, errors: { email: "Bad" } })}
      />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });
});

describe("FormStateOverlay — auto-dismiss", () => {
  it("auto-dismisses after the configured timeout", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <FormStateOverlay
        state={mkState({ isSubmitted: true })}
        autoDismissMs={1000}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText("Success!")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });

  it("autoDismissMs=0 disables auto-dismiss", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <FormStateOverlay
        state={mkState({ isSubmitted: true })}
        autoDismissMs={0}
        onDismiss={onDismiss}
      />
    );
    act(() => vi.advanceTimersByTime(60_000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });
});
