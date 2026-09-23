/**
 * Site fonts in the Family picker — Clone 3696:21550 / 3721:43423: an
 * uploaded font file is "a separate uploaded source; it does not replace the
 * built-in family". The picker lists the FontManager's custom fonts under
 * UPLOADED, above System, and choosing one writes the family as the value.
 *
 * Clone 3721:43084 (Typography · Choose heading family) adds the door: what
 * the picker OFFERS is the built-in groups, the ADDED site fonts under
 * `Uploaded` (each row naming its source), and a `Manage site fonts` row at
 * the foot that opens Site fonts (`ui:site-fonts`) and closes the dropdown.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { FontPicker } from "../FontPicker";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../../../../engine";

function composerWithFonts(families: string[]) {
  const listeners = new Map<string, Set<(p?: unknown) => void>>();
  const fonts = {
    getAllFonts: vi.fn(() =>
      families.map((family) => ({ id: `library-${family.toLowerCase()}`, family, source: "custom", variants: [], loaded: true })),
    ),
    on: vi.fn((ev: string, fn: (p?: unknown) => void) => { (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn); }),
    off: vi.fn((ev: string, fn: (p?: unknown) => void) => { listeners.get(ev)?.delete(fn); }),
    emit: (ev: string) => listeners.get(ev)?.forEach((fn) => fn()),
  };
  const emit = vi.fn();
  return { composer: { fonts, emit } as unknown as Composer, fonts, emit };
}

const openPicker = () => {
  fireEvent.click(screen.getByRole("button", { name: "Font family" }));
  return screen.getByRole("listbox", { name: "Font family selection" });
};

describe("FontPicker — UPLOADED group", () => {
  it("lists the library's fonts under UPLOADED and selects one as the family value", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    const onChange = vi.fn();
    render(<FontPicker value="" onChange={onChange} composer={composer} />);
    const list = openPicker();
    const group = within(list).getByTestId("font-picker-group-uploaded");
    expect(within(group).getByText("Uploaded", { selector: "div" })).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("option", { name: /Inter Var/ }));
    expect(onChange).toHaveBeenCalledWith("'Inter Var', sans-serif");
  });

  it("draws no UPLOADED group when the library holds no fonts", () => {
    const { composer } = composerWithFonts([]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    openPicker();
    expect(screen.queryByText("Uploaded")).toBeNull();
    expect(screen.queryByTestId("font-picker-group-uploaded")).toBeNull();
  });

  it("picks up a font uploaded while the picker is mounted", () => {
    const { composer, fonts } = composerWithFonts([]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    fonts.getAllFonts.mockImplementation(() => [{ id: "library-brand", family: "Brand", source: "custom", variants: [], loaded: true }]);
    act(() => fonts.emit(EVENTS.FONT_UPLOADED));
    openPicker();
    expect(screen.getByRole("option", { name: /Brand/ })).toBeInTheDocument();
  });

  it("drops a font removed while the dropdown is open — the group goes with its last row", () => {
    const { composer, fonts } = composerWithFonts(["Inter Var"]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    const list = openPicker();
    expect(within(list).getByTestId("font-picker-group-uploaded")).toBeInTheDocument();
    fonts.getAllFonts.mockImplementation(() => []);
    act(() => fonts.emit(EVENTS.FONT_DELETED));
    expect(within(list).queryByTestId("font-picker-group-uploaded")).toBeNull();
    expect(within(list).queryByRole("option", { name: /Inter Var/ })).toBeNull();
  });
});

describe("FontPicker — Clone 3721:43084, the picker's offer", () => {
  it("an uploaded row names its source, and the trigger reads an uploaded pick back as uploaded", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    render(<FontPicker value="'Inter Var', sans-serif" onChange={vi.fn()} composer={composer} />);
    const trigger = screen.getByRole("button", { name: "Font family" });
    expect(trigger).toHaveTextContent("Inter Var");
    expect(trigger).toHaveAttribute("data-font-source", "uploaded");
    const list = openPicker();
    const row = within(list).getByTestId("font-picker-uploaded-row");
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(row).toHaveAttribute("data-font-family", "Inter Var");
    /* The row's anatomy is the Google rows' — name left, source right. */
    expect(within(row).getByText("Uploaded")).toBeInTheDocument();
  });

  it("a built-in pick is not marked uploaded", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    render(<FontPicker value="Georgia, serif" onChange={vi.fn()} composer={composer} />);
    expect(screen.getByRole("button", { name: "Font family" })).not.toHaveAttribute("data-font-source");
  });

  it("`Manage site fonts` is the foot of the dropdown — below every group, 32 high — and opens Site fonts", () => {
    const { composer, emit } = composerWithFonts(["Inter Var"]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    const list = openPicker();
    const manage = within(list).getByRole("button", { name: "Manage site fonts" });
    expect(manage).toHaveAttribute("data-testid", "font-picker-manage-site-fonts");
    expect(manage.className).toContain("tw:h-8");
    /* Foot: after the last group's header in DOM order. */
    const googleHeader = within(list).getByText("Google Fonts");
    expect(googleHeader.compareDocumentPosition(manage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(manage);
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", {});
    expect(screen.queryByRole("listbox", { name: "Font family selection" })).toBeNull();
    expect(screen.getByRole("button", { name: "Font family" })).toHaveAttribute("aria-expanded", "false");
  });

  it("`Manage site fonts` still shows when nothing is uploaded", () => {
    const { composer } = composerWithFonts([]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    const list = openPicker();
    expect(within(list).queryByTestId("font-picker-group-uploaded")).toBeNull();
    expect(within(list).getByRole("button", { name: "Manage site fonts" })).toBeInTheDocument();
  });

  it("the search narrows the groups but never hides the Manage row", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    const list = openPicker();
    fireEvent.change(within(list).getByPlaceholderText("Search fonts..."), { target: { value: "zzzz-no-match" } });
    expect(within(list).queryByRole("option", { name: /Inter Var/ })).toBeNull();
    expect(within(list).getByRole("button", { name: "Manage site fonts" })).toBeInTheDocument();
  });
});
