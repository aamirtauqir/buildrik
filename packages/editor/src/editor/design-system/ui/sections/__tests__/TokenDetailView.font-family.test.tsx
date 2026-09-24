/**
 * Brand inspector font — Clone 3721:44821. A `font-family` token's detail
 * carries the same family picker the Typography section has (presets, the
 * ADDED site fonts under `Uploaded`, `Manage site fonts` at the foot); the
 * text field stays for a hand-typed stack. Picking writes the token's value
 * in the form font tokens already hold — a bare family (`Inter`,
 * `Geist Mono`), not the inspector's quoted stack.
 *
 * The QA note on 3721:43423: "Brand inspector uses a separate font-source
 * variable … the Heading inspector retains its own selection." The two
 * pickers share rows, never state.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { TokenDetailView } from "../TokenDetailView";
import { FontPicker } from "@/editor/inspector/sections/typography";
import { DSModeProvider } from "../../../state/DSModeContext";
import { EVENTS } from "@/shared/constants/events";
import type { DesignToken } from "../../../types";
import type { Composer } from "../../../../../engine";

const fontToken: DesignToken = {
  id: "font-heading",
  name: "Heading Font",
  value: "Inter",
  category: "typography",
  cssVar: "--buildrick-design-font-heading",
  type: "font-family",
};

const sizeToken: DesignToken = {
  id: "font-size-sm",
  name: "Font SM",
  value: "14px",
  category: "typography",
  cssVar: "--buildrick-design-font-size-sm",
  type: "font-size",
};

function composerWithFonts(families: string[]) {
  const listeners = new Map<string, Set<(p?: unknown) => void>>();
  const fonts = {
    getAllFonts: vi.fn(() =>
      families.map((family) => ({ id: `library-${family.toLowerCase().replace(/\s+/g, "-")}`, family, source: "custom", variants: [], loaded: true })),
    ),
    on: vi.fn((ev: string, fn: (p?: unknown) => void) => { (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn); }),
    off: vi.fn((ev: string, fn: (p?: unknown) => void) => { listeners.get(ev)?.delete(fn); }),
    emit: (ev: string) => listeners.get(ev)?.forEach((fn) => fn()),
  };
  const emit = vi.fn();
  const composer = { fonts, emit, on: vi.fn(), off: vi.fn() } as unknown as Composer;
  return { composer, fonts, emit };
}

const renderDetail = (token: DesignToken, composer: Composer, onValueChange = vi.fn()) => {
  render(
    <DSModeProvider initialMode="pro">
      <TokenDetailView token={token} composer={composer} onValueChange={onValueChange} />
    </DSModeProvider>,
  );
  /* C1 (ii): the card's value line is read-only until Change is pressed. A
     font role's Change opens the board's picker (7318:81029); "All fonts ›"
     reaches the full picker these tests cover. */
  fireEvent.click(screen.getByTestId("brand-token-action-replace"));
  if (token.type === "font-family") fireEvent.click(screen.getByTestId("brand-font-all"));
  return onValueChange;
};

const openTokenPicker = () => {
  fireEvent.click(screen.getByTestId("brand-token-font-picker"));
  return screen.getByRole("listbox", { name: "Font family selection" });
};

describe("TokenDetailView — font-family token picker (Clone 3721:44821)", () => {
  it("a font-family token gets the picker; other token types do not", () => {
    const { composer } = composerWithFonts([]);
    const { unmount } = render(
      <DSModeProvider initialMode="pro">
        <TokenDetailView token={sizeToken} composer={composer} />
      </DSModeProvider>,
    );
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    expect(screen.queryByTestId("brand-token-font-picker")).toBeNull();
    unmount();
    renderDetail(fontToken, composer);
    const trigger = screen.getByTestId("brand-token-font-picker");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveTextContent("Inter");
    /* The text field stays beside it for a hand-typed stack. */
    expect(screen.getByLabelText("Value")).toHaveValue("Inter");
  });

  it("offers the ADDED site fonts under Uploaded, and picking one writes the bare family", () => {
    const { composer } = composerWithFonts(["Inter Variable"]);
    const onValueChange = renderDetail(fontToken, composer);
    const list = openTokenPicker();
    expect(within(list).getByTestId("font-picker-group-uploaded")).toBeInTheDocument();
    fireEvent.click(within(list).getByRole("option", { name: /Inter Variable/ }));
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Inter Variable");
    expect(screen.queryByRole("listbox", { name: "Font family selection" })).toBeNull();
  });

  it("a preset pick writes the family the way font tokens are written today", () => {
    const { composer } = composerWithFonts([]);
    const onValueChange = renderDetail(fontToken, composer);
    const list = openTokenPicker();
    fireEvent.click(within(list).getByRole("option", { name: /^Lora/ }));
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Lora");
  });

  it("reads the token's family back as the selected row, uploaded source visible", () => {
    const { composer } = composerWithFonts(["Inter Variable"]);
    renderDetail({ ...fontToken, value: "Inter Variable" }, composer);
    const trigger = screen.getByTestId("brand-token-font-picker");
    expect(trigger).toHaveTextContent("Inter Variable");
    expect(trigger).toHaveAttribute("data-font-source", "uploaded");
    const list = openTokenPicker();
    const row = within(list).getByTestId("font-picker-uploaded-row");
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(within(row).getByText("Uploaded")).toBeInTheDocument();
  });

  it("`Manage site fonts` opens Site fonts and closes the dropdown — with nothing uploaded too", () => {
    const { composer, emit } = composerWithFonts([]);
    renderDetail(fontToken, composer);
    const list = openTokenPicker();
    expect(within(list).queryByTestId("font-picker-group-uploaded")).toBeNull();
    fireEvent.click(within(list).getByTestId("font-picker-manage-site-fonts"));
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", {});
    expect(screen.queryByRole("listbox", { name: "Font family selection" })).toBeNull();
  });

  it("re-reads the site fonts while open — a font added in Site fonts appears without a reopen", () => {
    const { composer, fonts } = composerWithFonts([]);
    renderDetail(fontToken, composer);
    const list = openTokenPicker();
    expect(within(list).queryByTestId("font-picker-group-uploaded")).toBeNull();
    fonts.getAllFonts.mockImplementation(() => [{ id: "library-brand", family: "Brand", source: "custom", variants: [], loaded: true }]);
    act(() => fonts.emit(EVENTS.FONT_UPLOADED));
    expect(within(list).getByRole("option", { name: /Brand/ })).toBeInTheDocument();
  });

  it("the text field still takes a hand-typed stack", () => {
    const { composer } = composerWithFonts([]);
    const onValueChange = renderDetail(fontToken, composer);
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Inter, sans-serif" } });
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Inter, sans-serif");
  });

  it("is a separate selection from the Typography picker — picking here leaves the Heading inspector alone", () => {
    const { composer } = composerWithFonts(["Inter Variable"]);
    const onToken = vi.fn();
    const onHeading = vi.fn();
    render(
      <DSModeProvider initialMode="pro">
        <FontPicker value="'Inter Variable', sans-serif" onChange={onHeading} composer={composer} />
        <TokenDetailView token={fontToken} composer={composer} onValueChange={onToken} />
      </DSModeProvider>,
    );
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    fireEvent.click(screen.getByTestId("brand-font-all"));
    const list = openTokenPicker();
    fireEvent.click(within(list).getByRole("option", { name: /^Lora/ }));
    expect(onToken).toHaveBeenCalledWith("font-heading", "Lora");
    expect(onHeading).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Font family" })).toHaveTextContent("Inter Variable");
  });
});

describe("TokenDetailView — the Brand font picker popover (7318:81029)", () => {
  const openPopover = (token: DesignToken, composer: Composer, onValueChange = vi.fn()) => {
    render(
      <DSModeProvider initialMode="pro">
        <TokenDetailView token={token} composer={composer} onValueChange={onValueChange} />
      </DSModeProvider>,
    );
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    return onValueChange;
  };

  it("Change opens the board's popover: title, current selection, site fonts with sources, Manage, Cancel", () => {
    const { composer } = composerWithFonts(["Brand Sans"]);
    openPopover(fontToken, composer);
    const pop = screen.getByTestId("brand-font-popover");
    expect(within(pop).getByText("Heading Font")).toBeInTheDocument();
    expect(within(pop).getByText("Current selection")).toBeInTheDocument();
    expect(screen.getByTestId("brand-font-current")).toHaveTextContent("Inter · Built in");
    const rows = within(pop).getAllByRole("option").map((o) => o.textContent?.replace("✓", "").trim());
    expect(rows).toEqual(["Inter · Built in", "Geist Mono · Built in", "Brand Sans · Uploaded"]);
    expect(within(pop).getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    expect(within(pop).getByTestId("brand-font-manage")).toHaveTextContent("Manage site fonts ›");
    expect(within(pop).getByTestId("brand-font-cancel")).toHaveTextContent("Cancel");
    // No inline editor until "All fonts ›".
    expect(screen.queryByTestId("brand-token-font-picker")).toBeNull();
  });

  it("a row writes the family and closes; Cancel closes without a write", () => {
    const { composer } = composerWithFonts(["Brand Sans"]);
    const onValueChange = openPopover(fontToken, composer);
    fireEvent.click(screen.getByTestId("brand-font-option-Brand Sans"));
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Brand Sans");
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    fireEvent.click(screen.getByTestId("brand-font-cancel"));
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("a family from elsewhere (Google / typed) is listed first as Custom; Manage opens Site fonts", () => {
    const { composer, emit } = composerWithFonts([]);
    openPopover({ ...fontToken, value: "Lora" }, composer);
    expect(screen.getByTestId("brand-font-current")).toHaveTextContent("Lora · Custom");
    fireEvent.click(screen.getByTestId("brand-font-manage"));
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", {});
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
  });
});
