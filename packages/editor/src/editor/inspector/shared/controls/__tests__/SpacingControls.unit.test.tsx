/**
 * @vitest-environment jsdom
 *
 * A side keeps its own unit when edited from the box: a video embed's
 * `padding-bottom: 56.25%` (the ratio trick) stepped or retyped stays a
 * percentage. The box used to append `px` to every number.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { SpacingBox } from "../SpacingControls";

const zero = { top: "0px", right: "0px", bottom: "0px", left: "0px" };

function renderBox(padding = { ...zero, bottom: "56.25%" }) {
  const onPaddingChange = vi.fn();
  render(<SpacingBox margin={zero} padding={padding} onMarginChange={() => {}} onPaddingChange={onPaddingChange} />);
  return { onPaddingChange, field: screen.getByRole("textbox", { name: /Padding bottom/ }) };
}

describe("SpacingBox · a side keeps its unit", () => {
  it("↑ on 56.25% writes 57.25%", () => {
    const { onPaddingChange, field } = renderBox();
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(onPaddingChange).toHaveBeenLastCalledWith("bottom", "57.25%");
  });

  it("a typed number on a % side writes %", () => {
    const { onPaddingChange, field } = renderBox();
    fireEvent.change(field, { target: { value: "50" } });
    expect(onPaddingChange).toHaveBeenLastCalledWith("bottom", "50%");
  });

  it("an empty or px side still writes px", () => {
    const { onPaddingChange, field } = renderBox({ ...zero, bottom: "" });
    fireEvent.change(field, { target: { value: "12" } });
    expect(onPaddingChange).toHaveBeenLastCalledWith("bottom", "12px");
  });
});
