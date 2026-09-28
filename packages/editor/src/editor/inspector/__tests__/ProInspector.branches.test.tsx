/**
 * ProInspector — top-level branch selection:
 *   - no selection, project still loading → InspectorLoading (board 159:102)
 *   - no selection, or the page root → the Page panel (DD-13)
 *   - 2+ selected  → the SAME panel plus the multi bar (DD-12)
 *   - 1 selected   → full inspector body (Style · Behaviour · Effects strip)
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
vi.mock("../components/MultiSelectBar", () => ({
  MultiSelectBar: () => <div data-testid="multi-bar" />,
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

import { ProInspector } from "../ProInspector";
import { ToastProvider } from "@/editor/chrome-ui";

/* ProInspector mounts VariantSection, which reports a refused detach
   rather than swallowing it — so it needs the toast context. AquibraStudio
   wraps the whole studio in one, so every real mount has it and only these
   tests rendered the subtree bare. */
const renderWithToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);


function makeElement(id: string) {
  return {
    getStyles: () => ({}),
    getClasses: () => [],
    getCustomData: () => undefined,
    getId: () => id,
    getParent: () => null,
    getTagName: () => "div",
    getType: () => "box",
  };
}

function makeComposer(
  allSelected: ReturnType<typeof makeElement>[],
  loading = false
) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isProjectLoading: () => loading,
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
    renderWithToast(<ProInspector selectedElement={null} composer={makeComposer([])} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("multi-toolbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-content")).not.toBeInTheDocument();
  });

  /* Board 159:102 — "Select something on the canvas to edit it." is a lie
     while the canvas is still filling itself in. */
  it("renders the loading skeleton, not the empty state, while the project loads", () => {
    renderWithToast(<ProInspector selectedElement={null} composer={makeComposer([], true)} />);
    expect(screen.getByTestId("inspector-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("2+ selected keeps the same panel — tabs and sections — and adds the multi bar (DD-12)", () => {
    const composer = makeComposer([makeElement("a"), makeElement("b")]);
    renderWithToast(
      <ProInspector
        selectedElement={{ id: "a", type: "box", tagName: "div" }}
        composer={composer}
      />
    );
    expect(screen.getByTestId("multi-bar")).toBeInTheDocument();
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Inspector tabs" })).toBeInTheDocument();
  });

  it("the page root selected is the Page panel, not an element (DD-13)", () => {
    const composer = makeComposer([makeElement("root")]) as unknown as { elements: Record<string, unknown> };
    composer.elements.getActivePage = () => ({ name: "Home", root: { id: "root" } });
    renderWithToast(<ProInspector selectedElement={{ id: "root", type: "container" }} composer={composer as never} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders the single-element inspector body when exactly one is selected", () => {
    const composer = makeComposer([makeElement("a")]);
    renderWithToast(
      <ProInspector
        selectedElement={{ id: "a", type: "box", tagName: "div" }}
        composer={composer}
      />
    );
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
    // Boards 4428:141170 / 141642 / 142686 — the strip is back (B11).
    expect(screen.getByRole("tablist", { name: "Inspector tabs" })).toBeInTheDocument();
    expect(screen.queryByTestId("multi-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});
