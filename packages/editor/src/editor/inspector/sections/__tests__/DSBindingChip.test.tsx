/**
 * DSBindingChip — the bound-token chip. G3-156 (IN-104): the "preset" and
 * "off-ds" states (and the Beginner "Bind to token" hint) had no consumer and
 * were deleted; the chip means "bound", which is what the boards draw.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { DSBindingChip } from "../DSBindingChip";

describe("DSBindingChip", () => {
  it("names the token and the action (DD3), and clicks through", () => {
    const onClick = vi.fn();
    const { getByRole } = render(<DSBindingChip label="color-primary" onClick={onClick} />);
    const btn = getByRole("button", { name: /Jump to token color-primary in Brand/ });
    expect(btn.textContent).toBe("color-primary");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders as a static, non-focusable span when no onClick is supplied", () => {
    const { container } = render(<DSBindingChip label="color-primary" />);
    expect(container.querySelector("button")).toBeNull();
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-label")).toMatch(/Jump to token color-primary/);
    expect(span?.getAttribute("tabindex")).toBeNull();
  });

  it("ariaLabel prop overrides the default accessible name", () => {
    const { getByLabelText } = render(<DSBindingChip label="color-primary" onClick={() => {}} ariaLabel="Custom label" />);
    expect(getByLabelText("Custom label")).toBeTruthy();
  });

  it("DD3: a real type=button carrying the focus-visible class", () => {
    const { getByRole } = render(<DSBindingChip label="color-primary" onClick={() => {}} />);
    const btn = getByRole("button");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.className).toContain("bd-ds-binding-chip");
  });
});
