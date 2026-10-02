/**
 * Every number field is named, and the name carries its unit (§16):
 * "Font size in pixels". The visible label stays the label (so
 * `getByLabelText("Font size")` still finds the field); the unit words ride
 * in a hidden span the field is also labelled by.
 *
 * Measured live 2026-08-18: nine inputs in the inspector column had no
 * accessible name at all. Paired rows draw no visible label, which is what
 * `ariaLabel` is for.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InputWithUnit } from "../InputControls";

afterEach(cleanup);

describe("InputWithUnit — the value field is named, with its unit", () => {
  it("takes its name from the row label, plus the unit", () => {
    render(<InputWithUnit label="Letter" value="0px" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Letter in pixels" })).toBeInTheDocument();
    expect(screen.getByLabelText("Letter")).toBe(screen.getByRole("textbox"));
  });

  it("takes an explicit name when the row draws no label", () => {
    render(<InputWithUnit label="" ariaLabel="Width" value="120" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Width in pixels" })).toBeInTheDocument();
  });

  it("prefers the explicit name over the row label", () => {
    render(<InputWithUnit label="Size" ariaLabel="Font size" value="16rem" units={["px", "rem"]} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Font size in rem" })).toBeInTheDocument();
  });

  it("a unitless field says so", () => {
    render(<InputWithUnit label="Line height" value="1.5" units={["", "px"]} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Line height as a multiplier" })).toBeInTheDocument();
  });

  it("a keyword value has no unit to speak of", () => {
    render(<InputWithUnit label="Width" value="auto" units={["px", "auto"]} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Width" })).toBeInTheDocument();
  });

  it("never leaves the field anonymous", () => {
    render(<InputWithUnit label="" value="" onChange={vi.fn()} placeholder="0" />);
    expect(screen.getByRole("textbox", { name: "0 in pixels" })).toBeInTheDocument();
  });

  it("names the unit dropdown", () => {
    render(<InputWithUnit label="Gap" value="8px" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Gap unit" })).toBeInTheDocument();
  });
});
