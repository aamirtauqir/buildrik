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
 * Board 807:8069 draws the breakpoints with the width range each one governs.
 * The glyph-only switcher shipped four bare letters — nothing in the editor
 * said what "T" meant in pixels, in any tooltip or label.
 *
 * The numbers are read from BREAKPOINTS, the media queries the exporter
 * writes, NOT from the board (which draws a five-tier 992/480 scale). Those
 * are behaviour, and behaviour follows the CODE contract; only the fact that
 * a range is SHOWN comes from the board.
 */
describe("BreakpointSwitcher — each cell names the range it governs", () => {
  it("carries the media-query range in the accessible name", () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Desktop (\u22651024px)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tablet (768\u20131023px)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mobile (\u2264767px)" })).toBeTruthy();
  });

  it("says wide is a preview width, because its edits land on Desktop", () => {
    render(<BreakpointSwitcher value="wide" onChange={() => {}} includeWide />);
    expect(screen.getByRole("button", { name: /^Wide/ }).getAttribute("aria-label")).toBe(
      "Wide (preview width, uses Desktop styles)",
    );
  });

  it("repeats the range in a title so a pointer user sees it too", () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^Tablet/ }).getAttribute("title")).toBe(
      "Tablet \u00b7 768\u20131023px",
    );
  });
});
