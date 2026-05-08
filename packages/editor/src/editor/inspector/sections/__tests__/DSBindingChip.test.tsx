import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { DSBindingChip } from "../DSBindingChip";
import { DSModeProvider } from "../../../design-system/state/DSModeContext";

describe("DSBindingChip", () => {
  it("renders token state label and click target", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <DSBindingChip state="token" label="color-primary" onClick={onClick} />
    );
    const btn = getByRole("button", { name: /Bound to token color-primary/ });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders preset state with the 'Bound to preset' a11y label", () => {
    const { getByRole } = render(
      <DSBindingChip state="preset" label="card-shadow" onClick={() => {}} />
    );
    expect(getByRole("button", { name: /Bound to preset card-shadow/ })).toBeTruthy();
  });

  it("renders off-ds state with the warning prefix and 'Off design system' a11y", () => {
    const { getByRole, getByText } = render(
      <DSBindingChip state="off-ds" label="#FFAA22" onClick={() => {}} />
    );
    expect(getByRole("button", { name: /Off design system #FFAA22/ })).toBeTruthy();
    expect(getByText(/⚠/)).toBeTruthy();
  });

  it("renders as a static span (not a button) when no onClick is supplied", () => {
    const { container } = render(<DSBindingChip state="token" label="color-primary" />);
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("ariaLabel prop overrides the default accessible name", () => {
    const { getByLabelText } = render(
      <DSBindingChip
        state="token"
        label="color-primary"
        onClick={() => {}}
        ariaLabel="Custom label"
      />
    );
    expect(getByLabelText("Custom label")).toBeTruthy();
  });

  it("shows 'Bind to token' affordance in beginner mode (off-ds + handler present)", () => {
    const onBindRequest = vi.fn();
    const { getByText } = render(
      <DSModeProvider initialMode="beginner">
        <DSBindingChip
          state="off-ds"
          label="#FFAA22"
          onClick={() => {}}
          onBindRequest={onBindRequest}
        />
      </DSModeProvider>
    );

    fireEvent.click(getByText("Bind to token"));
    expect(onBindRequest).toHaveBeenCalled();
  });

  it("hides 'Bind to token' affordance in pro mode", () => {
    const onBindRequest = vi.fn();
    const { queryByText } = render(
      <DSModeProvider initialMode="pro">
        <DSBindingChip
          state="off-ds"
          label="#FFAA22"
          onClick={() => {}}
          onBindRequest={onBindRequest}
        />
      </DSModeProvider>
    );
    expect(queryByText("Bind to token")).toBeNull();
  });

  it("does not render the bind hint for token/preset states", () => {
    const onBindRequest = vi.fn();
    const { queryByText } = render(
      <DSModeProvider initialMode="beginner">
        <DSBindingChip
          state="token"
          label="color-primary"
          onClick={() => {}}
          onBindRequest={onBindRequest}
        />
      </DSModeProvider>
    );
    expect(queryByText("Bind to token")).toBeNull();
  });

  it("falls back to beginner-mode behavior when rendered outside DSModeProvider", () => {
    const onBindRequest = vi.fn();
    const { getByText } = render(
      <DSBindingChip
        state="off-ds"
        label="#FFAA22"
        onClick={() => {}}
        onBindRequest={onBindRequest}
      />
    );
    expect(getByText("Bind to token")).toBeTruthy();
  });
});
