/**
 * ColorPicker — HSB picker hex input, validation, contrast badge, alpha
 * warning, and the save/cancel contract.
 *
 * jsdom's <canvas> has no 2D context; the component guards `if (!ctx) return`
 * on every draw, so the gradient canvases render as inert elements and the
 * hex-input / button behavior is fully exercisable.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ColorPicker } from "../ColorPicker";

function mount(over: Partial<React.ComponentProps<typeof ColorPicker>> = {}) {
  const props = {
    initialHex: "#FF0000",
    onChange: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    ...over,
  };
  const utils = render(<ColorPicker {...props} />);
  return { ...utils, props };
}

describe("ColorPicker — render", () => {
  it("shows the hex input seeded from initialHex plus Cancel/Set color", () => {
    mount({ initialHex: "#FF0000" });
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    expect(hex.value).toBe("FF0000");
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Set color")).toBeInTheDocument();
  });

  it("fires onChange on mount with the resolved hex", () => {
    const { props } = mount({ initialHex: "#FF0000" });
    expect(props.onChange).toHaveBeenCalled();
    expect((props.onChange as Mock).mock.calls[0][0].toUpperCase()).toContain("FF0000");
  });
});

describe("ColorPicker — hex input", () => {
  it("a valid hex edit updates the swatch and keeps Set color enabled", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "00FF00" } });
    expect(hex.value).toBe("00FF00");
    expect(screen.getByText("Set color").closest("button")).not.toBeDisabled();
    expect(screen.queryByText(/Enter a valid hex/)).not.toBeInTheDocument();
  });

  it("an invalid hex shows the error and disables Set color", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "zzz" } });
    expect(screen.getByText(/Enter a valid hex/)).toBeInTheDocument();
    expect(screen.getByText("Set color").closest("button")).toBeDisabled();
  });

  it("recovers when a valid hex follows an invalid one", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "zzz" } });
    expect(screen.getByText(/Enter a valid hex/)).toBeInTheDocument();
    fireEvent.change(hex, { target: { value: "123456" } });
    expect(screen.queryByText(/Enter a valid hex/)).not.toBeInTheDocument();
  });

  it("accepts 3-digit shorthand", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "0f0" } });
    expect(screen.queryByText(/Enter a valid hex/)).not.toBeInTheDocument();
  });
});

describe("ColorPicker — contrast badge", () => {
  it("renders the contrast ratio against the given background", () => {
    // black on white → 21:1
    mount({ initialHex: "#000000", background: "#FFFFFF" });
    expect(screen.getByText("21.0:1")).toBeInTheDocument();
  });
});

describe("ColorPicker — save / cancel", () => {
  it("Set color calls onSave with the current hex", () => {
    const { props } = mount({ initialHex: "#FF0000" });
    fireEvent.change(screen.getByLabelText("Hex color value"), {
      target: { value: "00FF00" },
    });
    fireEvent.click(screen.getByText("Set color"));
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect((props.onSave as Mock).mock.calls[0][0].toUpperCase()).toContain("00FF00");
  });

  it("Set color is a no-op while the hex is invalid (button disabled)", () => {
    const { props } = mount();
    fireEvent.change(screen.getByLabelText("Hex color value"), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByText("Set color"));
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("ColorPicker — alpha warning", () => {
  it("warns when the initial color has alpha below 0.8", () => {
    mount({ initialHex: "#FF000080" });
    expect(
      screen.getByText(/Background has transparency — contrast may not be accurate/),
    ).toBeInTheDocument();
  });

  it("no alpha warning for an opaque color", () => {
    mount({ initialHex: "#FF0000" });
    expect(
      screen.queryByText(/Background has transparency/),
    ).not.toBeInTheDocument();
  });
});
