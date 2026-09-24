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
  it("shows the hex input seeded from initialHex plus Cancel/Apply", () => {
    mount({ initialHex: "#FF0000" });
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    expect(hex.value).toBe("#FF0000");
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
  });

  it("fires onChange on mount with the resolved hex", () => {
    const { props } = mount({ initialHex: "#FF0000" });
    expect(props.onChange).toHaveBeenCalled();
    expect((props.onChange as Mock).mock.calls[0][0].toUpperCase()).toContain("FF0000");
  });
});

describe("ColorPicker — hex input", () => {
  it("a valid hex edit updates the swatch and keeps Apply enabled", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "00FF00" } });
    expect(hex.value).toBe("#00FF00");
    expect(screen.getByText("Apply").closest("button")).not.toBeDisabled();
    expect(screen.queryByText(/Enter a valid hex/)).not.toBeInTheDocument();
  });

  it("an invalid hex shows the error and disables Apply", () => {
    mount();
    const hex = screen.getByLabelText("Hex color value") as HTMLInputElement;
    fireEvent.change(hex, { target: { value: "zzz" } });
    expect(screen.getByText(/Enter a valid hex/)).toBeInTheDocument();
    expect(screen.getByText("Apply").closest("button")).toBeDisabled();
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
  it("Apply calls onSave with the current hex", () => {
    const { props } = mount({ initialHex: "#FF0000" });
    fireEvent.change(screen.getByLabelText("Hex color value"), {
      target: { value: "00FF00" },
    });
    fireEvent.click(screen.getByText("Apply"));
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect((props.onSave as Mock).mock.calls[0][0].toUpperCase()).toContain("00FF00");
  });

  it("Apply is a no-op while the hex is invalid (button disabled)", () => {
    const { props } = mount();
    fireEvent.change(screen.getByLabelText("Hex color value"), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByText("Apply"));
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

/* QA 2026-09-24: opening the picker on #1A56DB showed 1A57DB — the HSB round
   trip is lossy, so Set color without touching anything saved a new colour. */
describe("ColorPicker — an untouched value is saved exactly", () => {
  it.each(["#1A56DB", "#76A9FA", "#C81E1E", "#F9FAFB", "#111827"])("opens and saves %s unchanged", (hex) => {
    const onSave = vi.fn();
    render(<ColorPicker initialHex={hex} onChange={vi.fn()} onCancel={vi.fn()} onSave={onSave} />);
    expect((screen.getByLabelText("Hex color value") as HTMLInputElement).value).toBe(hex);
    fireEvent.click(screen.getByText("Apply"));
    expect(onSave).toHaveBeenCalledWith(hex);
  });

  it("a typed hex is saved as typed", () => {
    const onSave = vi.fn();
    render(<ColorPicker initialHex="#000000" onChange={vi.fn()} onCancel={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Hex color value"), { target: { value: "1a56db" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(onSave).toHaveBeenCalledWith("#1A56DB");
  });
});

/* G3-140 · 7318:80959: title, WORKSPACE PALETTE, the actions slot. */
describe("ColorPicker — the one picker (7318:80959)", () => {
  it("draws the title and the workspace palette; a swatch takes its value", () => {
    const { props } = mount({
      initialHex: "#FF0000",
      title: "Primary",
      palette: [{ id: "color-accent", name: "Accent", value: "#15803D" }],
    });
    expect(screen.getByTestId("color-picker-title").textContent).toBe("Primary");
    expect(screen.getByText("Workspace palette")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use Accent #15803D" }));
    expect((screen.getByLabelText("Hex color value") as HTMLInputElement).value).toBe("#15803D");
    fireEvent.click(screen.getByText("Apply"));
    expect(props.onSave).toHaveBeenCalledWith("#15803D");
  });

  it("`actions` replaces the Cancel / Apply foot", () => {
    mount({ initialHex: "#FF0000", actions: (hex: string) => <span data-testid="own-actions">{hex}</span> });
    expect(screen.queryByText("Apply")).not.toBeInTheDocument();
    expect(screen.getByTestId("own-actions").textContent).toBe("#FF0000");
  });
});
