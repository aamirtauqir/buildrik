/**
 * Brand font token — a font role's Change opens the editor's ONE font picker,
 * Choose font (2L9 R02), in the token's form: a pick writes the bare family
 * font tokens hold (`Inter`, `Geist Mono`), not the inspector's quoted stack;
 * no Inherit. "Type a font stack ›" opens the token's text field for a
 * hand-typed stack.
 *
 * The QA note on 3721:43423 still holds: picking for the token leaves the
 * Heading inspector's own selection alone.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { TokenDetailView } from "../TokenDetailView";
import { FontPicker } from "@/editor/inspector/sections/typography";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";
import { EVENTS } from "@/shared/constants/events";
import type { DesignToken } from "@/editor/design-system/types";
import type { Composer } from "@/engine";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

const fontToken: DesignToken = v6Token({
  id: "font-heading",
  name: "Heading Font",
  value: "Inter",
  category: "typography",
  cssVar: "--buildrick-design-font-heading",
  type: "font-family",
});

const sizeToken: DesignToken = v6Token({
  id: "font-size-sm",
  name: "Font SM",
  value: "14px",
  category: "typography",
  cssVar: "--buildrick-design-font-size-sm",
  type: "font-size",
});

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

const openPicker = (token: DesignToken, composer: Composer, onValueChange = vi.fn()) => {
  render(
    <DSModeProvider initialMode="pro">
      <TokenDetailView token={token} composer={composer} onValueChange={onValueChange} />
    </DSModeProvider>,
  );
  fireEvent.click(screen.getByTestId("brand-token-action-replace"));
  return onValueChange;
};

describe("TokenDetailView — a font role picks through Choose font (R02)", () => {
  it("Change opens Choose font with the role's line; no Inherit for a token", () => {
    const { composer } = composerWithFonts(["Brand Sans"]);
    openPicker(fontToken, composer);
    const pop = screen.getByTestId("brand-font-popover");
    expect(pop).toHaveTextContent("Brand › Fonts & type styles › Heading Font.");
    expect(within(pop).getByTestId("inspector-choose-font")).toBeInTheDocument();
    expect(within(pop).getByRole("button", { name: "Brand Sans · Uploaded" })).toBeInTheDocument();
    expect(within(pop).queryByRole("button", { name: "Inherit" })).toBeNull();
    expect(within(pop).getByTestId("inspector-choose-font-kept")).toHaveTextContent("Search, scroll and Heading Font are retained.");
  });

  it("a pick writes the bare family and closes; Cancel closes without a write", () => {
    const { composer } = composerWithFonts(["Brand Sans"]);
    const onValueChange = openPicker(fontToken, composer);
    fireEvent.click(screen.getByRole("button", { name: "Brand Sans · Uploaded" }));
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Brand Sans");
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("a catalogue and a system pick write their family; a stack with no single family stays as written", () => {
    const { composer } = composerWithFonts([]);
    const onValueChange = openPicker(fontToken, composer);
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "Lora" } });
    fireEvent.click(screen.getByRole("button", { name: "Lora · Catalogue" }));
    expect(onValueChange).toHaveBeenLastCalledWith("font-heading", "Lora");
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "System" } });
    fireEvent.click(screen.getByRole("button", { name: "System · System" }));
    expect(onValueChange).toHaveBeenLastCalledWith("font-heading", "-apple-system, BlinkMacSystemFont, sans-serif");
  });

  it("the token's family reads as the pressed row", () => {
    const { composer } = composerWithFonts(["Inter Variable"]);
    openPicker(v6Token({ id: "font-heading", name: "Heading Font", value: "Inter Variable", category: "typography", cssVar: "--buildrick-design-font-heading", type: "font-family" }), composer);
    expect(screen.getByRole("button", { name: "Inter Variable · Uploaded" })).toHaveAttribute("aria-pressed", "true");
  });

  it("Manage site fonts opens Site fonts; a font added there appears without a reopen", () => {
    const { composer, fonts, emit } = composerWithFonts([]);
    openPicker(fontToken, composer);
    fireEvent.click(screen.getByRole("button", { name: "Manage site fonts" }));
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", {});
    fonts.getAllFonts.mockImplementation(() => [{ id: "library-brand", family: "Brand", source: "custom", variants: [], loaded: true }]);
    act(() => fonts.emit(EVENTS.FONT_UPLOADED));
    expect(screen.getByRole("button", { name: "Brand · Uploaded" })).toBeInTheDocument();
  });

  it("Type a font stack › opens the text field, which commits on blur, not per keystroke", () => {
    const { composer } = composerWithFonts([]);
    const onValueChange = openPicker(fontToken, composer);
    fireEvent.click(screen.getByTestId("brand-font-type-stack"));
    const field = screen.getByLabelText("Value");
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.change(field, { target: { value: "Inter, sans-serif" } });
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Inter, sans-serif");
  });

  it("Enter commits the typed value too", () => {
    const { composer } = composerWithFonts([]);
    const onValueChange = openPicker(fontToken, composer);
    fireEvent.click(screen.getByTestId("brand-font-type-stack"));
    const field = screen.getByLabelText("Value");
    fireEvent.change(field, { target: { value: "Lora, serif" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("font-heading", "Lora, serif");
    fireEvent.blur(field);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("other token types get no font picker", () => {
    const { composer } = composerWithFonts([]);
    openPicker(sizeToken, composer);
    expect(screen.queryByTestId("brand-font-popover")).toBeNull();
    expect(screen.queryByTestId("inspector-choose-font")).toBeNull();
  });

  it("picking for the token leaves the Heading inspector's own selection alone", () => {
    const { composer } = composerWithFonts(["Inter Variable"]);
    const onToken = vi.fn();
    /* Its own role id: the picker keeps a role's search and the families it
       left with across reopenings (R04) — "Manage site fonts" above left this
       file's shared role, so a font added since would come back as R04's
       "Added to site · not applied" instead of the list. */
    const token = { ...fontToken, id: "font-heading-selection" };
    render(
      <DSModeProvider initialMode="pro">
        <FontPicker value="'Inter Variable', sans-serif" composer={composer} />
        <TokenDetailView token={token} composer={composer} onValueChange={onToken} />
      </DSModeProvider>,
    );
    fireEvent.click(screen.getByTestId("brand-token-action-replace"));
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "Lora" } });
    fireEvent.click(screen.getByRole("button", { name: "Lora · Catalogue" }));
    expect(onToken).toHaveBeenCalledWith("font-heading-selection", "Lora");
    expect(screen.getByRole("button", { name: "Font family" })).toHaveTextContent("Inter Variable");
  });
});
