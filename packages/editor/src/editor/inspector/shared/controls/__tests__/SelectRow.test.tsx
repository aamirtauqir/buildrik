/**
 * SelectRow — bare-theme value select, compact UI font (fix round 1).
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SelectRow } from "../InputControls";

describe("SelectRow — value select compact font (fix round 1)", () => {
  it("resolves an explicit 11px UI font-size on the real <select>, not flowbite's default text-sm", () => {
    // Same class of regression as InputWithUnit's unit select (see that
    // file's "fix round 1" block for the full mechanism): the ambient
    // `.bdi-ddn .bdi-v` 11px/UI-font styling only reaches the actual
    // <select> via inheritance from the outer `.bdi-ddn` div (where
    // flowbite puts `className`), and flowbite's own directly-declared
    // `text-sm` on the real <select> always wins over an inherited value.
    // BK_SELECT_BARE_VALUE_THEME now sets an explicit `tw:text-[11px]`
    // (and `--bk-font-ui` font-family) in the same `sizes.md` theme leaf
    // so it wins the tailwind-merge conflict instead of relying on
    // inheritance reaching an element that already has its own value.
    render(
      <SelectRow
        label="Display"
        value="block"
        onChange={vi.fn()}
        options={[{ value: "block", label: "Block" }]}
      />
    );
    const select = screen.getByRole("combobox");
    expect(select.className).toMatch(/tw:text-\[11px\]/);
    expect(select.className).not.toMatch(/\btext-sm\b/);
  });
});
