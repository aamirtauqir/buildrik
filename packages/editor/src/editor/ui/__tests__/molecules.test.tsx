/**
 * Molecules — contract tests.
 *
 * Assert the API and the accessibility wiring. Geometry comes from tokens and
 * is verified by the conformance runner, not here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldRow, PanelHeader } from "../index";

describe("FieldRow", () => {
  it("ties the label to its control", () => {
    render(
      <FieldRow label="Radius" htmlFor="radius">
        <input id="radius" />
      </FieldRow>,
    );
    expect(screen.getByLabelText("Radius")).toBeTruthy();
  });
});

describe("PanelHeader", () => {
  it("is a heading so the panel has an outline", () => {
    render(<PanelHeader title="Pages" />);
    expect(screen.getByRole("heading", { level: 2, name: "Pages" })).toBeTruthy();
  });
});

/* ── BreakpointSwitcher · ported from vibcoder ──────────────────────────── */
import { BreakpointSwitcher } from "../BreakpointSwitcher";

describe("BreakpointSwitcher", () => {
  it("is a labelled group of three type=button cells, four with includeWide", () => {
    const { container, rerender } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const group = screen.getByRole("group", { name: "Breakpoint" });
    expect(group.className).toContain("bk-bp-switcher");
    const btns = container.querySelectorAll("button.bk-bp-switcher__btn");
    expect(btns.length).toBe(3);
    btns.forEach((b) => expect(b.getAttribute("type")).toBe("button"));
    rerender(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    expect(container.querySelectorAll("button.bk-bp-switcher__btn").length).toBe(4);
  });

  it("marks only the active breakpoint aria-pressed and reports clicks", () => {
    const onChange = vi.fn();
    render(<BreakpointSwitcher value="tablet" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Tablet" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Desktop" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(onChange).toHaveBeenCalledWith("mobile");
  });

  it("labelled mode swaps glyphs for full names", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} labelled />,
    );
    expect(container.querySelector(".bk-bp-switcher")!.className).toContain("bk-bp-switcher--labelled");
    const texts = Array.from(container.querySelectorAll("button")).map((b) => b.textContent);
    expect(texts).toEqual(["Desktop", "Tablet", "Mobile"]);
  });
});

/* ── Extensions drain · ported from shared/extensions ───────────────────── */
import { PanelHeaderActions } from "../index";

describe("PanelHeaderActions", () => {
  it("renders only the buttons whose callbacks are provided, labelled by context", () => {
    const onPinToggle = vi.fn();
    const onClose = vi.fn();
    render(<PanelHeaderActions label="panel" isPinned onPinToggle={onPinToggle} onClose={onClose} />);
    const pin = screen.getByRole("button", { name: "Unpin panel" });
    expect(pin.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(pin);
    expect(onPinToggle).toHaveBeenCalledTimes(1);
  });
});
