/**
 * ColorFillPopover — board 33 (7995:209771): "Brand colours", one row per
 * token (swatch, name, hex, "Use"), "Add colours in Brand" at the foot. Kept
 * from the old picker: ✎ → Edit <token> (Update everywhere / Only this
 * element) and the Pro search.
 */
import { render, fireEvent, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ColorFillPopover } from "../ColorFillPopover";

const tokens = [
  { id: "color-primary", name: "Primary", value: "#1a56db", cssVar: "--buildrick-design-color-primary" },
  { id: "color-text", name: "Text", value: "#374151", cssVar: "--buildrick-design-color-text" },
  { id: "color-background", name: "Background", value: "#FFFFFF", cssVar: "--buildrick-design-color-background" },
];

function setup(over: Partial<React.ComponentProps<typeof ColorFillPopover>> = {}) {
  const props = {
    tokens,
    boundTokenId: null,
    onSelectToken: vi.fn(),
    onCustomValue: vi.fn(),
    onUpdateToken: vi.fn(),
    usageOf: vi.fn(() => 34),
    showSearch: false,
    onOpenBrand: vi.fn(),
    currentHex: "",
    ...over,
  };
  render(<ColorFillPopover {...props} />);
  return props;
}

describe("ColorFillPopover (board 33)", () => {
  it("Brand colours: a row per token with its name, its hex and a Use button; the foot opens Brand", () => {
    setup();
    const pop = screen.getByTestId("fill-popover");
    expect(pop.textContent?.startsWith("Brand colors")).toBe(true);
    const rows = within(screen.getByRole("list", { name: "Brand colors" })).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual(["Primary#1A56DBUse", "Text#374151Use", "Background#FFFFFFUse"]);
    // Board 33's content stays on top; below it, the closed "Custom colour" section.
    expect(pop.textContent?.endsWith("Add colors in BrandCustom color")).toBe(true);
    expect(screen.queryByText(/Recent|Detach/)).toBeNull();
  });

  it("Custom colour is closed at first; opened, its picker applies a raw colour", () => {
    const p = setup({ currentHex: "#374151" });
    const toggle = screen.getByRole("button", { name: "Custom color" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTestId("color-picker")).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    expect(hex.value.toUpperCase()).toBe("#374151");
    fireEvent.change(hex, { target: { value: "#12ab56" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(p.onCustomValue).toHaveBeenCalledTimes(1);
    expect(p.onCustomValue).toHaveBeenCalledWith("#12AB56");
  });

  it("Cancel in the custom picker closes the section without writing", () => {
    const p = setup({ currentHex: "#374151" });
    fireEvent.click(screen.getByRole("button", { name: "Custom color" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("color-picker")).toBeNull();
    expect(p.onCustomValue).not.toHaveBeenCalled();
  });

  it("Use <token> binds the token by its var", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Use Text" }));
    expect(p.onSelectToken).toHaveBeenCalledWith("var(--buildrick-design-color-text)");
  });

  it("the bound token's row is marked current", () => {
    setup({ boundTokenId: "color-text" });
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((r) => r.getAttribute("aria-current"))).toEqual([null, "true", null]);
  });

  it("Add colours in Brand asks for Brand", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: /Add colors in Brand/ }));
    expect(p.onOpenBrand).toHaveBeenCalled();
  });

  it("no Brand door without a way to open it; an empty brand says where colours come from", () => {
    setup({ tokens: [], onOpenBrand: undefined });
    expect(screen.getByText("No brand colors yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add colors in Brand/ })).toBeNull();
  });

  it("Pro: search narrows the list and counts", () => {
    setup({ showSearch: true });
    fireEvent.change(screen.getByTestId("fill-search"), { target: { value: "t" } });
    expect(screen.getAllByRole("listitem").map((r) => r.querySelector("[data-token-name]")?.textContent)).toEqual(["Text"]);
    expect(screen.getByTestId("fill-search-count").textContent).toBe("1 of 3 match 't'");
  });

  /* 2L9 39:9114 panel 3: the shared token or the selected element, said apart. */
  it("✎ opens the shared token: Update {token} · Light, or Use on selected element", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit Primary" }));
    expect(screen.getByText("Editing shared Brand color")).toBeTruthy();
    expect(screen.getByTestId("fill-edit-usage").textContent).toBe("Known references · 34 in this site");
    expect(screen.getByText("Local use applies in Light and Dark. Other uses of the token stay unchanged.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Hex color value"), { target: { value: "#123456" } });
    fireEvent.click(screen.getByTestId("fill-edit-everywhere"));
    expect(p.onUpdateToken).toHaveBeenCalledWith("color-primary", "#123456");
    expect(screen.getByTestId("fill-edit-everywhere").textContent).toBe("Update Primary · Light");
    expect(screen.getByTestId("fill-edit-only-this").textContent).toBe("Use on selected element");
    fireEvent.click(screen.getByTestId("fill-edit-only-this"));
    expect(p.onCustomValue).toHaveBeenCalledWith("#123456");
    fireEvent.click(screen.getByRole("button", { name: "← Back to Brand colors" }));
    expect(screen.getByTestId("fill-popover")).toBeTruthy();
  });
});
