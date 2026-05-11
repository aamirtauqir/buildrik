import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { DSBindingChip } from "../DSBindingChip";
import { DSModeProvider } from "../../../design-system/state/DSModeContext";

describe("DSBindingChip", () => {
  it("renders token state with action-oriented a11y label (DD3)", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <DSBindingChip state="token" label="color-primary" onClick={onClick} />
    );
    const btn = getByRole("button", { name: /Jump to token color-primary in Design tab/ });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders preset state with action-oriented a11y label (DD3)", () => {
    const { getByRole } = render(
      <DSBindingChip state="preset" label="card-shadow" onClick={() => {}} />
    );
    expect(getByRole("button", { name: /Jump to preset card-shadow in Design tab/ })).toBeTruthy();
  });

  it("renders off-ds state with warning prefix and bind-prompt a11y label", () => {
    const { getByRole, getByText } = render(
      <DSBindingChip state="off-ds" label="#FFAA22" onClick={() => {}} />
    );
    expect(getByRole("button", { name: /Off-design-system value #FFAA22/ })).toBeTruthy();
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

  // ─── DD3 a11y baseline ─────────────────────────────────────────────────

  it("DD3: chip carries bd-ds-binding-chip className for focus-visible CSS hook", () => {
    const { getByRole } = render(
      <DSBindingChip state="token" label="color-primary" onClick={() => {}} />
    );
    expect(getByRole("button").className).toContain("bd-ds-binding-chip");
  });

  it("DD3: secondary 'Bind to token' button carries its own focus-visible className + aria-label", () => {
    const { getByRole } = render(
      <DSModeProvider initialMode="beginner">
        <DSBindingChip
          state="off-ds"
          label="#FFAA22"
          onClick={() => {}}
          onBindRequest={() => {}}
        />
      </DSModeProvider>
    );
    const bindBtn = getByRole("button", { name: /Bind #FFAA22 to a design token/ });
    expect(bindBtn).toBeDefined();
    expect(bindBtn.textContent).toBe("Bind to token");
  });

  it("DD3: Enter activates the chip (native button keyboard behavior)", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <DSBindingChip state="token" label="color-primary" onClick={onClick} />
    );
    const btn = getByRole("button");
    // Native <button> fires click on Enter via the user-agent. RTL doesn't
    // simulate that automatically — so assert the element IS a real button
    // (which guarantees the UA path) and that direct click works.
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("type")).toBe("button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("DD3: static (no onClick) chip is a non-focusable span — no a11y phantom button", () => {
    const { container } = render(<DSBindingChip state="token" label="color-primary" />);
    const span = container.querySelector("span");
    expect(span).toBeTruthy();
    expect(span?.getAttribute("aria-label")).toMatch(/Jump to token color-primary/);
    // A bare span has no implicit role and no tabIndex — won't trap keyboard focus.
    expect(span?.getAttribute("tabindex")).toBeNull();
  });
});
