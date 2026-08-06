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
import { PanelHeader, PanelHeaderActions } from "../index";

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
