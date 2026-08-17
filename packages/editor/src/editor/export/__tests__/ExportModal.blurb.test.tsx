/**
 * Board 1172:4825 titles the export modal "Export site as HTML" and puts a
 * sentence under it saying what you actually get.
 *
 * The modal said "Export" and nothing else — the one screen whose whole job is
 * choosing an output format described none of them, so "ZIP" vs "React" was a
 * word with no consequence attached.
 *
 * The blurb is per format because the board's own sentence is about the ZIP
 * ("A .zip with every page, styles inlined, media included") and would be a
 * false claim over a single HTML file. Shape is the contract, the sample is
 * not.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportModal } from "../ExportModal";

vi.mock("../../../engine/export/ExportEngine", () => ({
  ExportEngine: class {
    export() {
      return { html: "<p/>", css: "", stats: { elementCount: 0, htmlSize: 0, cssSize: 0 } };
    }
  },
}));

afterEach(cleanup);

const open = () =>
  render(<ExportModal isOpen onClose={vi.fn()} composer={null as never} />);

describe("ExportModal — board 1172:4825's title and blurb", () => {
  it("names the format in the title, not just 'Export'", () => {
    open();
    // DEFAULT_EXPORT_CONFIG decides which format opens first; whichever it is,
    // the title has to name it rather than saying nothing.
    expect(screen.getByText(/^Export site as \S+/)).toBeInTheDocument();
    expect(screen.queryByText(/^Export$/)).toBeNull();
  });

  it("says what the chosen format actually produces", () => {
    open();
    const blurbs = [
      /A \.zip with every page/,
      /One HTML file with styles inlined/,
      /drop into an existing/,
      /document tree as JSON/,
    ];
    expect(blurbs.some((b) => screen.queryByText(b))).toBe(true);
  });

  it("never claims a .zip over a single HTML file", () => {
    // The board's sentence is about the ZIP. Reusing it verbatim for every
    // format would describe files the user is not getting.
    open();
    const zip = screen.queryByText(/A \.zip with every page/);
    const html = screen.queryByText(/One HTML file with styles inlined/);
    expect(zip && html).toBeFalsy();
  });
});
