import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ComponentsPanelV2 } from "../ComponentsPanelV2";
import { TokenRegistryProvider } from "@/editor/design-system/state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "@/editor/design-system/state/StylePresetRegistryContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider projectId="panelv2-test">
      <StylePresetRegistryProvider projectId="panelv2-test">{ui}</StylePresetRegistryProvider>
    </TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("ComponentsPanelV2", () => {
  it("renders header + DSStatusChip + filter pills + search + both sections", () => {
    const { container, getByText, getByLabelText } = render(
      wrap(<ComponentsPanelV2 composer={null} />),
    );
    expect(container.querySelector('[data-components-panel-v2]')).toBeTruthy();
    expect(container.querySelector('[data-ds-status-chip]')).toBeTruthy();
    expect(getByText("All")).toBeTruthy();
    expect(getByText("DS")).toBeTruthy();
    expect(getByText("Yours")).toBeTruthy();
    expect(getByLabelText("Search components")).toBeTruthy();
    expect(container.querySelector('[data-catalog-section]')).toBeTruthy();
    expect(container.querySelector('[data-user-saved-section]')).toBeTruthy();
  });

  it("clicking DS filter hides UserSavedSection", () => {
    const { getByText, container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    fireEvent.click(getByText("DS"));
    expect(container.querySelector('[data-catalog-section]')).toBeTruthy();
    expect(container.querySelector('[data-user-saved-section]')).toBeNull();
  });

  it("clicking Yours filter hides CatalogSection", () => {
    const { getByText, container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    fireEvent.click(getByText("Yours"));
    expect(container.querySelector('[data-catalog-section]')).toBeNull();
    expect(container.querySelector('[data-user-saved-section]')).toBeTruthy();
  });

  it("typing in search filters CatalogSection rows", () => {
    const { getByLabelText, container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    fireEvent.change(getByLabelText("Search components"), { target: { value: "card" } });
    const rows = container.querySelectorAll("[data-catalog-row]");
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute("data-catalog-row")).toBe("card");
  });

  it("DSStatusChip click fires onJumpToDesign", () => {
    const onJump = vi.fn();
    const { container } = render(
      wrap(<ComponentsPanelV2 composer={null} onJumpToDesign={onJump} />),
    );
    const chip = container.querySelector('[data-ds-status-chip]') as HTMLElement;
    fireEvent.click(chip);
    expect(onJump).toHaveBeenCalled();
  });

  it("renders a 2-col card grid for each tier (Arc D5)", () => {
    const { container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    const grids = container.querySelectorAll("[data-catalog-grid]");
    // One grid per tier (atom / molecule / organism).
    expect(grids.length).toBe(3);
    const firstGridStyle = (grids[0] as HTMLElement).style.gridTemplateColumns;
    // jsdom may serialize "minmax(0, 1fr)" with normalized whitespace; just
    // verify the column count token is present.
    expect(firstGridStyle.includes("repeat(2,")).toBe(true);
  });

  it("renders header `+ AI` entry button (Arc D5)", () => {
    const { container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    const aiBtn = container.querySelector("[data-components-ai-entry]");
    expect(aiBtn).toBeTruthy();
    expect(aiBtn!.textContent).toContain("AI");
  });

  it("renders footer `+ Save current selection` button (Arc D5)", () => {
    const { container } = render(wrap(<ComponentsPanelV2 composer={null} />));
    const saveBtn = container.querySelector("[data-save-current-selection]");
    expect(saveBtn).toBeTruthy();
    expect(saveBtn!.textContent).toContain("Save current selection");
  });
});

describe("ComponentsPanelV2 → Save current selection (Gap A — sidebar save)", () => {
  const clickSaveButton = (container: HTMLElement) => {
    const buttons = Array.from(container.querySelectorAll("button"));
    const saveBtn = buttons.find((b) => b.textContent?.includes("Save current selection"));
    if (!saveBtn) throw new Error("Save current selection button not found");
    fireEvent.click(saveBtn);
  };

  it("emits COMPONENT_SAVE_AS_REQUESTED with selectionIds + extractedBindings when exactly 1 element is selected", () => {
    const sentinelBindings = new Map([["el-1:color", "color-primary"]]);
    const resolveForElements = vi.fn(() => sentinelBindings);
    const emit = vi.fn();
    const allElements: unknown[] = [];
    const composer = {
      selection: { getSelectedIds: () => ["el-1"] },
      elements: { getAllElements: () => allElements },
      designSystem: { tokenBindingResolver: { resolveForElements } },
      emit,
      on: () => {},
      off: () => {},
    } as never;

    const { container } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    clickSaveButton(container);

    expect(resolveForElements).toHaveBeenCalledWith(["el-1"], allElements);
    expect(emit).toHaveBeenCalledWith(
      "component:save-as-requested",
      expect.objectContaining({
        selectionIds: ["el-1"],
        extractedBindings: expect.any(Map),
      }),
    );
  });

  it("is a silent no-op when 0 elements are selected", () => {
    const emit = vi.fn();
    const composer = {
      selection: { getSelectedIds: () => [] },
      elements: { getAllElements: () => [] },
      designSystem: { tokenBindingResolver: { resolveForElements: vi.fn() } },
      emit,
      on: () => {},
      off: () => {},
    } as never;

    const { container } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    clickSaveButton(container);

    expect(emit).not.toHaveBeenCalled();
  });

  it("is a silent no-op when 2+ elements are selected", () => {
    const emit = vi.fn();
    const composer = {
      selection: { getSelectedIds: () => ["el-1", "el-2"] },
      elements: { getAllElements: () => [] },
      designSystem: { tokenBindingResolver: { resolveForElements: vi.fn() } },
      emit,
      on: () => {},
      off: () => {},
    } as never;

    const { container } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    clickSaveButton(container);

    expect(emit).not.toHaveBeenCalled();
  });

  it("falls back to empty extractedBindings Map when tokenBindingResolver absent", () => {
    const emit = vi.fn();
    const composer = {
      selection: { getSelectedIds: () => ["el-1"] },
      elements: { getAllElements: () => [] },
      designSystem: { tokenBindingResolver: undefined },
      emit,
      on: () => {},
      off: () => {},
    } as never;

    const { container } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    clickSaveButton(container);

    expect(emit).toHaveBeenCalledWith(
      "component:save-as-requested",
      expect.objectContaining({
        selectionIds: ["el-1"],
        extractedBindings: new Map(),
      }),
    );
  });
});
