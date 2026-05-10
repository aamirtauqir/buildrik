import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, renderHook } from "@testing-library/react";
import * as React from "react";
import { GenericPresetList } from "../GenericPresetList";
import { usePresetsForCategory } from "../../../state/usePresetsForCategory";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { StylePreset } from "../../../types";

const seed: StylePreset[] = [
  { id: "button-primary", friendlyName: "Primary button", category: "button", variant: "primary",
    bindings: { "background-color": { tokenId: "color-primary" } } },
  { id: "button-ghost",   friendlyName: "Ghost button",   category: "button", variant: "ghost",
    bindings: {} },
];

beforeEach(() => {
  localStorage.clear();
});

describe("GenericPresetList", () => {
  it("renders a row per preset with friendly-name input + variant + binding count", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    const { getByLabelText, getAllByText } = render(
      <DSModeProvider initialMode="beginner">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>,
    );
    expect(getByLabelText(/button preset button-primary friendly name/i)).toBeTruthy();
    expect(getByLabelText(/button preset button-ghost friendly name/i)).toBeTruthy();
    // "1 binding" + "0 bindings" both render
    expect(getAllByText(/binding/).length).toBeGreaterThanOrEqual(2);
  });

  it("editing the friendly-name input fires updatePreset (registry isDirty)", () => {
    const { result, rerender: rerenderHook } = renderHook(() => usePresetsForCategory("button", seed));
    const Holder: React.FC = () => (
      <DSModeProvider initialMode="beginner">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>
    );
    const { getByLabelText } = render(<Holder />);
    fireEvent.change(getByLabelText(/button preset button-primary friendly name/i), {
      target: { value: "Renamed" },
    });
    rerenderHook();
    expect(result.current.presets.find((p) => p.id === "button-primary")?.friendlyName).toBe("Renamed");
    expect(result.current.isDirty).toBe(true);
  });

  it("Delete button removes preset", () => {
    const { result, rerender: rerenderHook } = renderHook(() => usePresetsForCategory("button", seed));
    const Holder: React.FC = () => (
      <DSModeProvider initialMode="beginner">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>
    );
    const { getByLabelText } = render(<Holder />);
    fireEvent.click(getByLabelText(/Delete button-ghost/i));
    rerenderHook();
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-primary"]);
  });

  it("Add preset generates a fresh id and appends", () => {
    const { result, rerender: rerenderHook } = renderHook(() => usePresetsForCategory("button", seed));
    const Holder: React.FC = () => (
      <DSModeProvider initialMode="beginner">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>
    );
    const { getByText } = render(<Holder />);
    fireEvent.click(getByText(/\+ Add preset/i));
    rerenderHook();
    expect(result.current.presets).toHaveLength(3);
    expect(result.current.presets[2].id).toMatch(/^button-custom-/);
  });

  it("empty state shows add-preset prompt", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", []));
    const { getByText } = render(
      <DSModeProvider initialMode="beginner">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>,
    );
    expect(getByText(/No presets yet/i)).toBeTruthy();
  });

  it("Pro mode reveals preset id chip", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    const { getByText } = render(
      <DSModeProvider initialMode="pro">
        <GenericPresetList category="button" registry={result.current} />
      </DSModeProvider>,
    );
    // ID chips render as monospaced labels.
    expect(getByText("button-primary")).toBeTruthy();
    expect(getByText("button-ghost")).toBeTruthy();
  });

});
