/**
 * ProInspector — top-level branch selection:
 *   - no selection → InspectorEmptyState
 *   - 2+ selected  → MultiSelectToolbar (single-element inspector body skipped)
 *   - 1 selected   → full inspector body (tabs + tab content)
 *
 * The heavy children are mocked as probes (same pattern as
 * ProInspector.createCollectionThreading.test.tsx) so we assert which branch
 * renders without booting a real composer subtree.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../components/InspectorEmptyState", () => ({
  InspectorEmptyState: () => <div data-testid="empty-state" />,
}));
vi.mock("../components/MultiSelectToolbar", () => ({
  MultiSelectToolbar: () => <div data-testid="multi-toolbar" />,
}));
vi.mock("../tabs/InspectorTabContent", () => ({
  InspectorTabContent: () => <div data-testid="tab-content" />,
}));
vi.mock("../components/InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../sections/VariantSection", () => ({ VariantSection: () => null }));
vi.mock("../components/InspectorElementMenu", () => ({ InspectorElementMenu: () => null }));
vi.mock("../components/DeleteConfirmModal", () => ({ DeleteConfirmModal: () => null }));
vi.mock("../components/BindingPopover", () => ({ BindingPopover: () => null }));

import { ProInspector } from "../ProInspector";

function makeElement(id: string) {
  return {
    getStyles: () => ({}),
    getClasses: () => [],
    getId: () => id,
    getParent: () => null,
    getTagName: () => "div",
    getType: () => "box",
  };
}

function makeComposer(allSelected: ReturnType<typeof makeElement>[]) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    elements: { getElement: (id: string) => makeElement(id) },
    selection: {
      select: vi.fn(),
      selectParent: vi.fn(),
      getSelected: () => (allSelected.length ? allSelected[0] : null),
      getAllSelected: () => allSelected,
    },
    styles: {
      getBreakpointStyle: () => ({}),
      getRule: () => undefined,
      getGlobalClasses: () => [],
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as never;
}

describe("ProInspector — branch selection", () => {
  it("renders the empty state when no element is selected", () => {
    render(<ProInspector selectedElement={null} composer={makeComposer([])} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("multi-toolbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-content")).not.toBeInTheDocument();
  });

  it("renders the multi-select toolbar when 2+ elements are selected", () => {
    const composer = makeComposer([makeElement("a"), makeElement("b")]);
    render(
      <ProInspector
        selectedElement={{ id: "a", type: "box", tagName: "div" }}
        composer={composer}
      />
    );
    expect(screen.getByTestId("multi-toolbar")).toBeInTheDocument();
    // Single-element body must not render alongside the toolbar.
    expect(screen.queryByTestId("tab-content")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders the single-element inspector body when exactly one is selected", () => {
    const composer = makeComposer([makeElement("a")]);
    render(
      <ProInspector
        selectedElement={{ id: "a", type: "box", tagName: "div" }}
        composer={composer}
      />
    );
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.queryByTestId("multi-toolbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});
