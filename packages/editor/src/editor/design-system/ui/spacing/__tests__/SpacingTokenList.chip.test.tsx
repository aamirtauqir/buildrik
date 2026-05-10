/**
 * Visual-sync arc V2 — SpacingTokenList chip grid view tests.
 * Reference: docs/reference/left-panel/tab-design.html (Spacing section).
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { SpacingTokenList } from "../SpacingTokenList";
import type { DesignToken } from "../../../types";

function makeSpacing(id: string, value: string): DesignToken {
  return {
    id,
    name: id,
    value,
    category: "spacing",
    cssVar: `--bd-${id}`,
    type: "length",
    kind: "spacing",
  };
}

const baseProps = {
  activePreset: "normal" as const,
  savedPreset: "normal" as const,
  isDirty: false,
  onTokenChange: vi.fn(),
  onPresetApply: vi.fn(),
  onResetToDefaults: vi.fn(),
  onUndo: vi.fn(),
  canUndo: () => false,
  onRedo: vi.fn(),
  canRedo: () => false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SpacingTokenList — chip pill grid (Visual-sync V2)", () => {
  it("renders one chip per spacing token (prototype 4 / 8 / 12 / 16 ...)", () => {
    const tokens = ["4", "8", "12", "16", "20", "24", "32", "40", "48"].map((v, i) =>
      makeSpacing(`space-${i + 1}`, `${v}px`),
    );
    const { getAllByRole } = render(<SpacingTokenList tokens={tokens} {...baseProps} />);
    const chips = getAllByRole("listitem");
    expect(chips).toHaveLength(9);
    expect(chips.map((c) => c.textContent)).toEqual(["4", "8", "12", "16", "20", "24", "32", "40", "48"]);
  });

  it("each chip has accessible name with token name + value", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const { getByLabelText } = render(<SpacingTokenList tokens={tokens} {...baseProps} />);
    expect(getByLabelText(/Edit spacing space-4 \(16px\)/)).toBeTruthy();
  });

  it("clicking a chip toggles aria-pressed and reveals the inline edit drawer", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const { getByLabelText, queryByLabelText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} />,
    );
    const chip = getByLabelText(/Edit spacing space-4/);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(queryByLabelText(/Value for space-4/)).toBeNull();

    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(queryByLabelText(/Value for space-4/)).toBeTruthy();
  });

  it("editing the value in the drawer fires onTokenChange with px suffix", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const onTokenChange = vi.fn();
    const { getByLabelText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} onTokenChange={onTokenChange} />,
    );
    fireEvent.click(getByLabelText(/Edit spacing space-4/));
    fireEvent.change(getByLabelText(/Value for space-4/), { target: { value: "20" } });
    expect(onTokenChange).toHaveBeenCalledWith("space-4", "20px");
  });

  it("zero-spacing surfaces a warning indicator in the drawer", () => {
    const tokens = [makeSpacing("space-4", "0px")];
    const { getByLabelText } = render(<SpacingTokenList tokens={tokens} {...baseProps} />);
    fireEvent.click(getByLabelText(/Edit spacing space-4/));
    expect(getByLabelText("zero-spacing warning")).toBeTruthy();
  });

  it("undo button only renders when canUndo returns true", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const { getByLabelText, queryByLabelText, rerender } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} canUndo={() => false} />,
    );
    fireEvent.click(getByLabelText(/Edit spacing space-4/));
    expect(queryByLabelText(/Undo change to space-4/)).toBeNull();

    rerender(<SpacingTokenList tokens={tokens} {...baseProps} canUndo={() => true} />);
    expect(getByLabelText(/Undo change to space-4/)).toBeTruthy();
  });

  it("preset chip click fires onPresetApply with the preset name", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const onPresetApply = vi.fn();
    const { getByText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} onPresetApply={onPresetApply} />,
    );
    fireEvent.click(getByText("Compact (2px)"));
    expect(onPresetApply).toHaveBeenCalledWith("compact");
  });

  it("clicking the active chip a second time collapses the edit drawer", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const { getByLabelText, queryByLabelText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} />,
    );
    const chip = getByLabelText(/Edit spacing space-4/);
    fireEvent.click(chip);
    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(queryByLabelText(/Value for space-4/)).toBeNull();
  });

  it("renders the 'Scale · 4-pt grid' mono mini-metadata header", () => {
    const tokens = [makeSpacing("space-4", "16px")];
    const { getByText } = render(<SpacingTokenList tokens={tokens} {...baseProps} />);
    expect(getByText("Scale")).toBeTruthy();
    expect(getByText("4-pt grid")).toBeTruthy();
  });
});
