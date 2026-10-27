/**
 * TypographyControls — Align, then 2L9 247:23404's rows: Letter spacing ·
 * Word spacing · Transform · Decoration · Font style · White-space · Word
 * break · Text indent · Vertical align, CSS's default shown when unset.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ADVANCED_TYPOGRAPHY_COUNT, TypographyControls } from "../TypographyControls";

function renderTypo(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(<TypographyControls styles={styles} onChange={onChange} />);
  return { onChange, ...utils };
}

const ROWS = ["Letter spacing", "Word spacing", "Transform", "Decoration", "Font style", "White-space", "Word break", "Text indent", "Vertical align"];

describe("TypographyControls — rows", () => {
  it("holds as many rows as the More settings badge claims", () => {
    const { container } = renderTypo();
    expect(container.querySelectorAll(".bdi-row-ctrl").length).toBe(ADVANCED_TYPOGRAPHY_COUNT);
  });

  it("names and orders the rows as 247:23404 does", () => {
    renderTypo();
    const els = ROWS.map((n) => screen.getByLabelText(n));
    const sorted = [...els].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    expect(sorted.map((el) => ROWS[els.indexOf(el)])).toEqual(ROWS);
  });

  it("an unset select shows CSS's default", () => {
    renderTypo();
    expect(screen.getByLabelText("Transform")).toHaveValue("none");
    expect(screen.getByLabelText("Decoration")).toHaveValue("none");
    expect(screen.getByLabelText("Font style")).toHaveValue("normal");
    expect(screen.getByLabelText("White-space")).toHaveValue("normal");
    expect(screen.getByLabelText("Word break")).toHaveValue("normal");
    expect(screen.getByLabelText("Vertical align")).toHaveValue("baseline");
  });
});

describe("TypographyControls — writes", () => {
  it("each select writes its property", () => {
    const { onChange } = renderTypo();
    const cases: Array<[string, string, string]> = [
      ["Transform", "text-transform", "uppercase"],
      ["Decoration", "text-decoration", "line-through"],
      ["Font style", "font-style", "italic"],
      ["White-space", "white-space", "nowrap"],
      ["Word break", "word-break", "break-all"],
      ["Vertical align", "vertical-align", "super"],
    ];
    for (const [label, property, value] of cases) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
      expect(onChange).toHaveBeenCalledWith(property, value);
    }
  });

  it("letter / word spacing and text indent write with a unit", () => {
    const { onChange } = renderTypo();
    fireEvent.change(screen.getByLabelText("Letter spacing"), { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("letter-spacing", "2px");
    fireEvent.change(screen.getByLabelText("Word spacing"), { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith("word-spacing", "3px");
    fireEvent.change(screen.getByLabelText("Text indent"), { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith("text-indent", "3px");
  });
});

describe("TypographyControls — current values", () => {
  it("shows the element's font style and decoration", () => {
    renderTypo({ "font-style": "italic", "text-decoration": "underline" });
    expect(screen.getByLabelText("Font style")).toHaveValue("italic");
    expect(screen.getByLabelText("Decoration")).toHaveValue("underline");
  });
});
