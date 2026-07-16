/**
 * CornerRadiusSection — shorthand parsing, linked vs per-corner writes.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CornerRadiusSection } from "../CornerRadiusSection";

function renderRadius(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <CornerRadiusSection styles={styles} onChange={onChange} isOpen={true} />
  );
  return { onChange, ...utils };
}

describe("CornerRadiusSection — value rendering", () => {
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

  it("shows the shorthand as the collapsed preview pill", () => {
    renderRadius({ "border-radius": "6px" });
    expect(screen.getByText("6px")).toBeInTheDocument();
  });
});

describe("CornerRadiusSection — writes", () => {
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
