/**
 * Site fonts in the Family picker — Clone 3696:21550 / 3721:43423: an
 * uploaded font file is "a separate uploaded source; it does not replace the
 * built-in family". The picker lists the FontManager's custom fonts under
 * UPLOADED, above System, and choosing one writes the family as the value.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  return { composer: { fonts } as unknown as Composer, fonts };
}

describe("FontPicker — UPLOADED group", () => {
  it("lists the library's fonts under UPLOADED and selects one as the family value", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    const onChange = vi.fn();
    render(<FontPicker value="" onChange={onChange} composer={composer} />);
    fireEvent.click(screen.getByRole("button", { name: "Font family" }));
    const list = screen.getByRole("listbox", { name: "Font family selection" });
    expect(within(list).getByText("Uploaded")).toBeInTheDocument();
    fireEvent.click(within(list).getByRole("option", { name: "Inter Var" }));
    expect(onChange).toHaveBeenCalledWith("'Inter Var', sans-serif");
  });

  it("draws no UPLOADED group when the library holds no fonts", () => {
    const { composer } = composerWithFonts([]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    fireEvent.click(screen.getByRole("button", { name: "Font family" }));
    expect(screen.queryByText("Uploaded")).toBeNull();
  });

  it("picks up a font uploaded while the picker is mounted", () => {
    const { composer, fonts } = composerWithFonts([]);
    render(<FontPicker value="" onChange={vi.fn()} composer={composer} />);
    fonts.getAllFonts.mockImplementation(() => [{ id: "library-brand", family: "Brand", source: "custom", variants: [], loaded: true }]);
    fonts.emit(EVENTS.FONT_UPLOADED);
    fireEvent.click(screen.getByRole("button", { name: "Font family" }));
    expect(screen.getByRole("option", { name: "Brand" })).toBeInTheDocument();
  });
});
