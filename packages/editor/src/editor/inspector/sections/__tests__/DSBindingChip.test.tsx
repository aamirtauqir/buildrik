/**
 * DSBindingChip — the one binding indicator: the token's name inside the
 * field (boards 1, 27). With a handler it opens Brand on the token (G3-156)
 * and draws the Inspector's one focus ring; without one it is plain text.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { DSBindingChip } from "../DSBindingChip";

describe("DSBindingChip", () => {
  it("shows the token's name and names the action; a click goes to Brand", () => {
    const onClick = vi.fn();
    const { getByRole } = render(<DSBindingChip label="Text / primary" onClick={onClick} />);
    const btn = getByRole("button", { name: /Jump to token Text \/ primary in Brand/ });
    expect(btn).toHaveTextContent("Text / primary");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("is static, non-focusable text when no handler is supplied", () => {
    const { container } = render(<DSBindingChip label="Text / primary" />);
    expect(container.querySelector("button")).toBeNull();
    const span = container.querySelector("span");
    expect(span).toHaveTextContent("Text / primary");
    expect(span?.getAttribute("tabindex")).toBeNull();
  });

  // Regression: the Page panel chip cut "Page / background" to "Page / backgrour"
  // at 1440 with no ellipsis — text-overflow is inert on the flex Button itself.
  it("a long name ellipsises inside its own block span and shows in full on hover", () => {
    const { getByRole } = render(<DSBindingChip label="Page / background" onClick={() => {}} />);
    const btn = getByRole("button");
    expect(btn.getAttribute("title")).toBe("Page / background");
    const inner = btn.querySelector("span");
    expect(inner).toHaveTextContent("Page / background");
    expect(inner?.className).toContain("tw:truncate");
    expect(inner?.className).toContain("tw:min-w-0");
  });

  it("the static name also carries the full name as its title", () => {
    const { container } = render(<DSBindingChip label="Page / background" />);
    expect(container.querySelector("span")?.getAttribute("title")).toBe("Page / background");
  });

  it("ariaLabel overrides the default accessible name", () => {
    const { getByLabelText } = render(<DSBindingChip label="Primary" onClick={() => {}} ariaLabel="Custom label" />);
    expect(getByLabelText("Custom label")).toBeTruthy();
  });

  it("a real type=button with the --bk-shadow-focus focus ring, not a pill", () => {
    const { getByRole } = render(<DSBindingChip label="Primary" onClick={() => {}} />);
    const btn = getByRole("button");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.className).toContain("tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]");
    expect(btn.className).not.toMatch(/success/);
  });
});
