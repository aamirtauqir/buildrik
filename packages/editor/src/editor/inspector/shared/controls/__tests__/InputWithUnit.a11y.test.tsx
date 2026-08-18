/**
 * Every field a screen-reader user can type into has a name.
 *
 * Measured live 2026-08-18 against the inspector column: nine `<input>`
 * elements had no accessible name at all. The unit `<Select>` beside each one
 * did (`${label} unit`), and so did the reset `<Button>` (`Reset ${label}`) —
 * only the field the value is typed into was anonymous. The row's `<label>`
 * is a bare element: no `htmlFor`, and it does not wrap the input, so it
 * names nothing. Paired rows (W | H, Size | line-height) draw no label at
 * all, which is what `ariaLabel` is for.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InputWithUnit } from "../InputControls";

afterEach(cleanup);

describe("InputWithUnit — the value field is named", () => {
  it("takes its name from the row label", () => {
    render(<InputWithUnit label="Letter" value="0" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Letter" })).toBeInTheDocument();
  });

  it("takes an explicit name when the row draws no label", () => {
    render(<InputWithUnit label="" ariaLabel="Width" value="120" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Width" })).toBeInTheDocument();
  });

  it("prefers the explicit name over the row label", () => {
    render(<InputWithUnit label="Size" ariaLabel="Font size" value="16" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Font size" })).toBeInTheDocument();
  });

  it("never leaves the field anonymous", () => {
    render(<InputWithUnit label="" value="" onChange={vi.fn()} placeholder="0" />);
    expect(screen.getByRole("textbox", { name: "0" })).toBeInTheDocument();
  });

  it("still names the unit and the reset control", () => {
    render(<InputWithUnit label="Gap" value="8" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Gap unit" })).toBeInTheDocument();
  });
});
