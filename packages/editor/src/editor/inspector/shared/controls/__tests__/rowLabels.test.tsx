import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RangeSlider, SliderInput } from "../SliderControls";
import { TextInputRow, InlineInput } from "../TextControls";
import { SelectRow } from "../InputControls";

/**
 * Every inspector row printed its label and left it unattached: a bare
 * <label> with no `htmlFor`, and the control not nested inside it. Measured
 * in the running editor with a heading selected and all eleven sections open:
 * 21 controls — 8 sliders, 6 selects, 7 text fields — with no accessible name
 * at all. Two of them were named by their placeholder, so a screen reader
 * announced the custom shadow field as "0 4px 6px rgba(0,0,0,0.1)".
 *
 * `getByLabelText` is the assertion because it is the same lookup a screen
 * reader does — it passes only when label and control are actually tied.
 */
describe("inspector rows name their controls", () => {
  it("RangeSlider", () => {
    render(<RangeSlider label="Rotate" value={10} onChange={() => {}} />);
    expect(screen.getByLabelText("Rotate")).toHaveProperty("type", "range");
  });

  it("SliderInput", () => {
    render(<SliderInput label="Opacity" value={50} onChange={() => {}} />);
    expect(screen.getByLabelText("Opacity")).toHaveProperty("type", "range");
  });

  it("TextInputRow", () => {
    render(<TextInputRow label="Move X" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Move X")).toHaveProperty("type", "text");
  });

  it("InlineInput", () => {
    render(<InlineInput label="Min width" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Min width")).toHaveProperty("type", "text");
  });

  it("SelectRow", () => {
    render(
      <SelectRow
        label="Property"
        value=""
        onChange={() => {}}
        options={[{ value: "all", label: "All" }]}
      />
    );
    expect(screen.getByLabelText("Property").tagName).toBe("SELECT");
  });

  it("gives each row its own id, so two rows do not collide", () => {
    render(
      <>
        <TextInputRow label="Move X" value="" onChange={() => {}} />
        <TextInputRow label="Move Y" value="" onChange={() => {}} />
      </>
    );
    const x = screen.getByLabelText("Move X");
    const y = screen.getByLabelText("Move Y");
    expect(x.id).not.toBe(y.id);
  });
});
