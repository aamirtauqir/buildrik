/**
 * Board 4428:141170's applies-to row: "This element ▸" — no "Base" pill.
 * At the base state the pseudo-state door is the ▸ glyph; a picked state
 * shows its name so the row still says what a write lands on.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StateDropdown } from "../StateDropdown";

describe("StateDropdown trigger", () => {
  it("is a bare ▸ at the base state", () => {
    render(<StateDropdown current="normal" onChange={() => {}} withOverrides={new Set()} />);
    const t = screen.getByTestId("inspector-state-pill");
    expect(t).toHaveTextContent("▸");
    expect(t).not.toHaveTextContent("Base");
    expect(t).toHaveAccessibleName("State: Base");
  });

  it("names a picked state", () => {
    render(<StateDropdown current="hover" onChange={() => {}} withOverrides={new Set()} />);
    expect(screen.getByTestId("inspector-state-pill")).toHaveTextContent(":hover");
  });
});
