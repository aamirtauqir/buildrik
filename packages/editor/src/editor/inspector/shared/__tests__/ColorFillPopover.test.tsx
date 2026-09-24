/**
 * ColorFillPopover — G3-155: BRAND · RECENT · CUSTOM (4428:142922), search in
 * Pro (6840:62765), ✎ → Edit token with Update everywhere / Only this element
 * (4428:142968).
 */
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorFillPopover } from "../ColorFillPopover";

const tokens = [
  { id: "color-primary", name: "Primary", value: "#1A56DB", cssVar: "--buildrick-design-color-primary" },
  { id: "color-accent", name: "Accent", value: "#15803D", cssVar: "--buildrick-design-color-accent" },
  { id: "color-primary-alt", name: "Primary alt", value: "#1E429F", cssVar: "--buildrick-design-color-primary-alt" },
];

function setup(over: Partial<React.ComponentProps<typeof ColorFillPopover>> = {}) {
  const props = {
    label: "Fill",
    tokens,
    boundTokenId: null,
    currentHex: "#F3F4F6",
    onSelectToken: vi.fn(),
    onCustomValue: vi.fn(),
    onUpdateToken: vi.fn(),
    usageOf: vi.fn(() => 34),
    showSearch: false,
    onClose: vi.fn(),
    ...over,
  };
  render(<ColorFillPopover {...props} />);
  return props;
}

beforeEach(() => localStorage.clear());

describe("ColorFillPopover", () => {
  it("draws Fill · BRAND · CUSTOM in the board's order; a brand swatch binds the token", () => {
    const p = setup();
    const text = screen.getByTestId("fill-popover").textContent ?? "";
    expect(text.indexOf("Brand")).toBeLessThan(text.indexOf("Custom"));
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-label"))).toEqual(["Primary", "Accent", "Primary alt"]);
    fireEvent.click(screen.getByTestId("fill-brand-color-accent"));
    expect(p.onSelectToken).toHaveBeenCalledWith("var(--buildrick-design-color-accent)");
    expect(screen.queryByTestId("fill-search")).toBeNull();
    expect(screen.queryByText(/Design tab/)).toBeNull();
  });

  it("a custom hex applies and then shows under RECENT", () => {
    const p = setup();
    expect(screen.queryByTestId("fill-recent")).toBeNull();
    const hex = screen.getByTestId("fill-custom-hex");
    fireEvent.change(hex, { target: { value: "#ef4444" } });
    fireEvent.keyDown(hex, { key: "Enter" });
    expect(p.onCustomValue).toHaveBeenCalledWith("#EF4444");
    expect(screen.getByTestId("fill-recent")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Use #EF4444" })).toBeTruthy();
  });

  it("Detach shows only while bound and applies the resolved colour", () => {
    const p = setup({ boundTokenId: "color-primary", currentHex: "#1A56DB" });
    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByTestId("fill-detach"));
    expect(p.onCustomValue).toHaveBeenCalledWith("#1A56DB");
  });

  it("Pro: search narrows BRAND and counts; the ✎ footnote shows", () => {
    setup({ showSearch: true });
    fireEvent.change(screen.getByTestId("fill-search"), { target: { value: "prim" } });
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-label"))).toEqual(["Primary", "Primary alt"]);
    expect(screen.getByTestId("fill-search-count").textContent).toBe("2 of 3 match 'prim'");
    expect(screen.getByText(/on a brand swatch edits the token everywhere/)).toBeTruthy();
  });

  it("✎ opens Edit <token>: Update everywhere (N×) and Only this element", () => {
    const p = setup();
    fireEvent.click(screen.getByTestId("fill-edit-color-primary"));
    expect(screen.getByText("Edit Primary")).toBeTruthy();
    expect(screen.getByText("used 34×")).toBeTruthy();
    expect(screen.getByTestId("fill-edit-preview").textContent).toBe("Primary · #1A56DB");
    fireEvent.change(screen.getByLabelText("Hex color value"), { target: { value: "#123456" } });
    fireEvent.click(screen.getByTestId("fill-edit-everywhere"));
    expect(p.onUpdateToken).toHaveBeenCalledWith("color-primary", "#123456");
    expect(screen.getByTestId("fill-edit-everywhere").textContent).toBe("Update everywhere (34×)");
    fireEvent.click(screen.getByTestId("fill-edit-only-this"));
    expect(p.onCustomValue).toHaveBeenCalledWith("#123456");
  });

  it("the custom swatch opens the one picker; Apply applies", () => {
    const p = setup();
    fireEvent.click(screen.getByTestId("fill-custom-swatch"));
    expect(screen.getByTestId("fill-custom-picker")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Hex color value"), { target: { value: "#00ff00" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(p.onCustomValue).toHaveBeenCalledWith("#00FF00");
  });
});
