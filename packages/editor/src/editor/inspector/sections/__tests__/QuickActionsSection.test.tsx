/**
 * QuickActionsSection — display presets (Block/Flex/Grid/Hide) batch-write
 * with stale-prop clears, and active-preset detection from styles.display.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuickActionsSection } from "../QuickActionsSection";

function renderQuick(styles: Record<string, string> = {}) {
  const onBatchChange = vi.fn();
  const utils = render(
    <QuickActionsSection styles={styles} onBatchChange={onBatchChange} isOpen={true} />
  );
  return { onBatchChange, ...utils };
}

describe("QuickActionsSection — preset writes", () => {
  it("Block writes display:block and clears flex/grid props", () => {
    const { onBatchChange } = renderQuick();
    fireEvent.click(screen.getByRole("button", { name: "Set layout to Block" }));
    expect(onBatchChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display: "block",
        "flex-direction": "",
        "grid-template-columns": "",
      })
    );
  });

  it("Flex writes display:flex with sensible defaults and clears grid props", () => {
    const { onBatchChange } = renderQuick();
    fireEvent.click(screen.getByRole("button", { name: "Set layout to Flex" }));
    expect(onBatchChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display: "flex",
        "flex-direction": "row",
        "align-items": "center",
        "grid-template-columns": "",
      })
    );
  });

  it("Grid writes display:grid with a starter template and clears flex props", () => {
    const { onBatchChange } = renderQuick();
    fireEvent.click(screen.getByRole("button", { name: "Set layout to Grid" }));
    expect(onBatchChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display: "grid",
        "grid-template-columns": "1fr 1fr",
        "flex-direction": "",
      })
    );
  });

  it("Hide writes display:none only", () => {
    const { onBatchChange } = renderQuick();
    fireEvent.click(screen.getByRole("button", { name: "Set layout to Hide" }));
    expect(onBatchChange).toHaveBeenCalledWith({ display: "none" });
  });
});

describe("QuickActionsSection — active-preset detection", () => {
  it("marks Flex pressed when display is flex", () => {
    renderQuick({ display: "flex" });
    expect(screen.getByRole("button", { name: "Set layout to Flex" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Set layout to Block" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("marks Hide pressed when display is none", () => {
    renderQuick({ display: "none" });
    expect(screen.getByRole("button", { name: "Set layout to Hide" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("no preset is pressed for an unrecognized display value", () => {
    renderQuick({ display: "table" });
    for (const label of ["Block", "Flex", "Grid", "Hide"]) {
      expect(
        screen.getByRole("button", { name: `Set layout to ${label}` })
      ).toHaveAttribute("aria-pressed", "false");
    }
  });
});
