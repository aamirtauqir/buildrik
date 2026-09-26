import { describe, it, expect } from "vitest";
import { parseCsvText } from "../csv";

describe("parseCsvText", () => {
  it("parses a simple comma-separated file", () => {
    expect(parseCsvText("name,price\nMargherita,12\nDiavola,14")).toEqual([
      ["name", "price"],
      ["Margherita", "12"],
      ["Diavola", "14"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsvText("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields containing commas and newlines", () => {
    const csv = 'name,note\n"Margherita","Tomato, mozzarella\nand basil"';
    expect(parseCsvText(csv)).toEqual([
      ["name", "note"],
      ["Margherita", "Tomato, mozzarella\nand basil"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsvText('name\n"Big ""Deal"" Pizza"')).toEqual([["name"], ['Big "Deal" Pizza']]);
  });

  it("strips a leading UTF-8 BOM", () => {
    expect(parseCsvText("﻿name,price\nA,1")).toEqual([
      ["name", "price"],
      ["A", "1"],
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseCsvText("")).toEqual([]);
  });

  it("does not emit a trailing blank row for a file ending in a newline", () => {
    expect(parseCsvText("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
