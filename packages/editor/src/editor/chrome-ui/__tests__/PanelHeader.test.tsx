/**
 * PanelHeader — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (Task 6, flowbite
 * big-bang) when PanelHeader ported to chrome-ui — same describe blocks,
 * new home.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelBackRow, PanelHeader, PanelHeaderActions } from "../index";

describe("PanelHeader", () => {
  it("is a heading so the panel has an outline", () => {
    render(<PanelHeader title="Pages" />);
    expect(screen.getByRole("heading", { level: 2, name: "Pages" })).toBeTruthy();
  });
});

describe("PanelHeaderActions", () => {
  it("renders only the buttons whose callbacks are provided, labelled by context", () => {
    const onExpandToggle = vi.fn();
    const onClose = vi.fn();
    render(<PanelHeaderActions label="panel" isExpanded onExpandToggle={onExpandToggle} onClose={onClose} />);
    const pin = screen.getByRole("button", { name: "Collapse panel" });
    expect(pin.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(pin);
    expect(onExpandToggle).toHaveBeenCalledTimes(1);
  });
});

/* The 36px "‹ Add" / "‹ Saved components" row above a drilled-in panel's
   header (boards 4418:142419, 4418:142876, 5946:51667). Three screens drew it
   from three copies of one class string. */
describe("PanelBackRow", () => {
  it("renders ‹ label as a 36px bottom-ruled button and calls onClick", () => {
    const onClick = vi.fn();
    render(<PanelBackRow label="Add" onClick={onClick} data-testid="back" />);
    const btn = screen.getByTestId("back");
    expect(btn.textContent?.replace(/\s+/g, " ")).toBe("‹ Add");
    expect(btn.className).toContain("tw:h-9");
    expect(btn.className).toContain("tw:border-b");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
