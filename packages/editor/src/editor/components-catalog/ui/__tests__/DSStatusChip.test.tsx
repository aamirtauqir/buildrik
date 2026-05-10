import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { DSStatusChip } from "../DSStatusChip";
import { TokenRegistryProvider } from "@/editor/design-system/state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "@/editor/design-system/state/StylePresetRegistryContext";

const wrap = (ui: React.ReactNode) => (
  <TokenRegistryProvider projectId="ds-status-test">
    <StylePresetRegistryProvider projectId="ds-status-test">{ui}</StylePresetRegistryProvider>
  </TokenRegistryProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("DSStatusChip", () => {
  it("renders aggregate counts of styles + tokens", () => {
    const { container } = render(wrap(<DSStatusChip />));
    const chip = container.querySelector('[data-ds-status-chip]');
    expect(chip).toBeTruthy();
    // DEFAULT_TOKENS has > 30 entries, DEFAULT_PRESETS has 19. Counts must be > 0.
    expect(chip?.textContent).toMatch(/\d+ styles?/);
    expect(chip?.textContent).toMatch(/\d+ tokens?/);
  });

  it("renders as a button when onJumpToDesign provided", () => {
    const onJump = vi.fn();
    const { container } = render(wrap(<DSStatusChip onJumpToDesign={onJump} />));
    const chip = container.querySelector('[data-ds-status-chip]');
    expect(chip?.tagName.toLowerCase()).toBe("button");
    fireEvent.click(chip!);
    expect(onJump).toHaveBeenCalled();
  });

  it("renders as a div when onJumpToDesign omitted", () => {
    const { container } = render(wrap(<DSStatusChip />));
    const chip = container.querySelector('[data-ds-status-chip]');
    expect(chip?.tagName.toLowerCase()).toBe("div");
  });
});
