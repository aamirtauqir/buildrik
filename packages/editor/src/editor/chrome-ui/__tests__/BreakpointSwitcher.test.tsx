/**
 * BreakpointSwitcher — contract tests (ported from vibcoder).
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (Task 6, flowbite
 * big-bang) when BreakpointSwitcher ported to chrome-ui. The three
 * `bk-bp-switcher*` classname assertions (known test debt, flagged at
 * dispatch) rewritten to role-based queries — `within(group)` scopes the
 * button count/type checks to the switcher itself instead of a container
 * classname, and "labelled mode" is now proven purely by its OBSERVABLE
 * difference (full names vs. glyphs), which is a stronger signal than a
 * modifier class ever was.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { BreakpointSwitcher } from "../BreakpointSwitcher";
import { BREAKPOINTS, DEVICE_PREVIEW_SIZES } from "@/shared/constants/breakpoints";

describe("BreakpointSwitcher", () => {
  it("is a labelled group of three type=button cells, four with includeWide", () => {
    const { rerender } = render(<BreakpointSwitcher value="desktop" onChange={() => {}} />);
    const group = screen.getByRole("group", { name: "Breakpoint" });
    const btns = within(group).getAllByRole("button");
    expect(btns.length).toBe(3);
    btns.forEach((b) => expect(b.getAttribute("type")).toBe("button"));
    rerender(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    expect(within(screen.getByRole("group", { name: "Breakpoint" })).getAllByRole("button").length).toBe(4);
  });

  it("marks only the active breakpoint aria-pressed and reports clicks", () => {
    const onChange = vi.fn();
    render(<BreakpointSwitcher value="tablet" onChange={onChange} />);
    expect(screen.getByRole("button", { name: /^Tablet/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^Desktop/ }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: /^Mobile/ }));
    expect(onChange).toHaveBeenCalledWith("mobile");
  });

  it("labelled mode swaps glyphs for full names", () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} labelled />);
    const group = screen.getByRole("group", { name: "Breakpoint" });
    const texts = within(group)
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(texts).toEqual(["Desktop", "Tablet", "Mobile"]);
  });
});

/**
 * Board 2L9 (Shell, F1.07 `302:7348`, `502:3834`): the topbar breakpoint
 * control is a row of device icons with no text. The width each one previews
 * lives in its tooltip, read from DEVICE_PREVIEW_SIZES (the one device-size
 * table the canvas frame uses), never from the board's sample numbers. The
 * board says "Phone"; the code's "Mobile" wins (authority: code:mobile-label).
 */
describe("BreakpointSwitcher (unlabelled)", () => {
  const names = () =>
    within(screen.getByRole("group", { name: "Breakpoint" }))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));

  it("renders wide (when enabled), desktop, tablet, mobile icon buttons in that order", () => {
    const { rerender } = render(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    expect(names()).toEqual(["Wide", "Desktop", "Tablet", "Mobile"]);
    rerender(<BreakpointSwitcher value="desktop" onChange={() => {}} />);
    expect(names()).toEqual(["Desktop", "Tablet", "Mobile"]);
  });

  it("shows an icon and no visible text in each cell", () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    for (const btn of within(screen.getByRole("group", { name: "Breakpoint" })).getAllByRole("button")) {
      expect(btn.textContent).toBe("");
      const icon = btn.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("marks exactly the active cell aria-pressed=true", () => {
    render(<BreakpointSwitcher value="mobile" onChange={() => {}} includeWide />);
    const pressed = within(screen.getByRole("group", { name: "Breakpoint" }))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-pressed"));
    expect(pressed).toEqual(["false", "false", "false", "true"]);
  });

  it.each([
    ["Tablet", `Tablet \u00b7 ${DEVICE_PREVIEW_SIZES.tablet.width}px`],
    ["Mobile", `Mobile \u00b7 ${DEVICE_PREVIEW_SIZES.mobile.width}px`],
    ["Wide", `Wide \u00b7 ${DEVICE_PREVIEW_SIZES.wide.width}px`],
    /* Desktop fills the canvas column, floored at the desktop breakpoint. */
    ["Desktop", `Desktop \u00b7 \u2265${BREAKPOINTS.desktop.minWidth}px`],
  ])("tooltip on %s reads its width from the breakpoint config", (name, text) => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    const btn = screen.getByRole("button", { name });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(btn);
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent(text);
    expect(btn.getAttribute("aria-describedby")).toBe(tip.id);
  });

  it("pins the tablet tooltip to 768px, the canvas's tablet frame", () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} />);
    fireEvent.focus(screen.getByRole("button", { name: "Tablet" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tablet \u00b7 768px");
  });
});
