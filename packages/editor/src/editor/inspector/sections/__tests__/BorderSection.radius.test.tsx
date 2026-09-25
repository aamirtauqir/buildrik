/**
 * Border › corner radius (G2-154: the Corner radius section folded into
 * Border) — shorthand parsing, linked vs per-corner writes.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BorderSection } from "../BorderSection";

/* The per-corner box lives behind More settings while the corners agree
   (board 7056:79008 draws one "Radius" row); these open it. */
function renderRadius(styles: Record<string, string> = {}, isOpen = true) {
  const onChange = vi.fn();
  const utils = render(
    <BorderSection styles={styles} onChange={onChange} isOpen={isOpen} advancedExpanded />
  );
  return { onChange, ...utils };
}

describe("Border › corner radius — value rendering", () => {
  it("populates all four corner inputs from the border-radius shorthand", () => {
    renderRadius({ "border-radius": "8px" });
    for (const corner of ["tl", "tr", "br", "bl"]) {
      expect(screen.getByRole("textbox", { name: `${corner} corner` })).toHaveValue("8");
    }
  });

  it("falls back to per-corner longhands when shorthand is absent", () => {
    renderRadius({ "border-top-left-radius": "12px" });
    expect(screen.getByRole("textbox", { name: "tl corner" })).toHaveValue("12");
    expect(screen.getByRole("textbox", { name: "br corner" })).toHaveValue("");
  });
});

describe("Border › compact radius (7056:79008)", () => {
  it("one Radius field while the corners agree; it writes the shorthand", () => {
    const onChange = vi.fn();
    render(<BorderSection styles={{ "border-radius": "8px" }} onChange={onChange} isOpen />);
    expect(screen.queryByRole("textbox", { name: "tl corner" })).toBeNull();
    const field = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(field.value).toBe("8");
    fireEvent.change(field, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("border-radius", "12px");
  });

  it("corners that differ bring the per-corner box back", () => {
    render(<BorderSection styles={{ "border-top-left-radius": "12px" }} onChange={vi.fn()} isOpen />);
    expect(screen.getByRole("textbox", { name: "tl corner" })).toHaveValue("12");
  });
});

describe("Border › corner radius — writes", () => {
  it("linked (default): editing any corner writes the border-radius shorthand", () => {
    const { onChange } = renderRadius();
    fireEvent.change(screen.getByRole("textbox", { name: "tr corner" }), {
      target: { value: "10" },
    });
    expect(onChange).toHaveBeenCalledWith("border-radius", "10px");
  });

  it("unlinked: editing a corner writes only that corner's longhand", () => {
    const { onChange } = renderRadius();
    fireEvent.click(screen.getByRole("button", { name: "Unlink corners" }));
    fireEvent.change(screen.getByRole("textbox", { name: "tl corner" }), {
      target: { value: "4" },
    });
    expect(onChange).toHaveBeenCalledWith("border-top-left-radius", "4px");

    fireEvent.change(screen.getByRole("textbox", { name: "br corner" }), {
      target: { value: "2" },
    });
    expect(onChange).toHaveBeenCalledWith("border-bottom-right-radius", "2px");
  });

  it("link toggle flips its aria-label between Unlink and Link", () => {
    renderRadius();
    const unlink = screen.getByRole("button", { name: "Unlink corners" });
    fireEvent.click(unlink);
    expect(screen.getByRole("button", { name: "Link all corners" })).toBeInTheDocument();
  });

  it("clearing an input writes an empty value (reset)", () => {
    const { onChange } = renderRadius({ "border-radius": "8px" });
    fireEvent.change(screen.getByRole("textbox", { name: "tl corner" }), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith("border-radius", "");
  });
});
