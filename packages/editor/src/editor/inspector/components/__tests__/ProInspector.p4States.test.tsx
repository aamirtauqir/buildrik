/**
 * ProInspector P4 states — AI agent takeover (board 160:512) and the
 * whole-site scope banner (board 189:2). Uses the same narrow mock harness
 * as the createCollectionThreading test: heavy subtrees stubbed, the
 * states under test rendered for real.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

vi.mock("../BindingPopover", () => ({ BindingPopover: () => null }));
vi.mock("../InspectorEmptyState", () => ({ InspectorEmptyState: () => null }));
vi.mock("../MultiSelectToolbar", () => ({ MultiSelectToolbar: () => null }));
vi.mock("../InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../tabs/InspectorTabContent", () => ({
  InspectorTabContent: () => <div data-testid="inspector-body" />,
}));
vi.mock("../../sections/VariantSection", () => ({ VariantSection: () => null }));
vi.mock("../InspectorElementMenu", () => ({ InspectorElementMenu: () => null }));
vi.mock("../DeleteConfirmModal", () => ({ DeleteConfirmModal: () => null }));
vi.mock("@/editor/components-catalog/ui/DetachInstanceButton", () => ({
  DetachInstanceButton: () => null,
}));

import { ProInspector } from "../../ProInspector";

type Handler = (p: unknown) => void;

function makeComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((ev: string, fn: Handler) => {
      (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn);
    }),
    off: vi.fn((ev: string, fn: Handler) => listeners.get(ev)?.delete(fn)),
    emit: vi.fn((ev: string, p?: unknown) => listeners.get(ev)?.forEach((fn) => fn(p))),
    elements: {
      getElement: () => ({
        getStyles: () => ({}),
        getClasses: () => [],
        getId: () => "el-1",
        getParent: () => null,
        getTagName: () => "div",
        getType: () => "box",
      }),
    },
    selection: {
      select: vi.fn(),
      selectParent: vi.fn(),
      getSelected: () => null,
      getAllSelected: () => [],
    },
    styles: {
      getBreakpointStyle: () => ({}),
      getRule: () => undefined,
      getGlobalClasses: () => [],
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  };
}

function mount(composer = makeComposer()) {
  render(
    <ProInspector
      selectedElement={{ id: "el-1", type: "box", tagName: "div" }}
      composer={composer as never}
      currentBreakpoint="desktop"
    />,
  );
  return composer;
}

afterEach(() => cleanup());

describe("ProInspector P4 states", () => {
  it("ai:agent-run replaces the controls with the run status and restores after", () => {
    const composer = mount();
    expect(screen.getByTestId("inspector-body")).toBeInTheDocument();

    act(() => composer.emit("ai:agent-run", { running: true, summary: "Rewriting 3 headings…" }));
    expect(screen.getByTestId("inspector-ai-run")).toBeInTheDocument();
    expect(screen.getByText("Rewriting 3 headings…")).toBeInTheDocument();
    expect(screen.getByText(/selection is kept and restored/)).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-body")).toBeNull();

    act(() => composer.emit("ai:agent-run", { running: false, summary: "" }));
    expect(screen.queryByTestId("inspector-ai-run")).toBeNull();
    expect(screen.getByTestId("inspector-body")).toBeInTheDocument();
  });

  it("selecting Whole site shows the banner and Open Brand routes to the Brand panel", () => {
    const composer = mount();
    fireEvent.click(screen.getByRole("button", { name: /Edit reach/ }));
    fireEvent.click(screen.getByRole("button", { name: /Whole site/ }));

    expect(screen.getByTestId("inspector-whole-site")).toBeInTheDocument();
    expect(screen.getByText("Editing the whole site — every page")).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-body")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open Brand" }));
    expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "design" });

    // Back to the element restores the controls.
    // (banner cleared — Open Brand keeps it until the user returns)
  });

  it("'Back to this element' leaves the whole-site banner", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /Edit reach/ }));
    fireEvent.click(screen.getByRole("button", { name: /Whole site/ }));
    fireEvent.click(screen.getByRole("button", { name: "Back to this element" }));
    expect(screen.queryByTestId("inspector-whole-site")).toBeNull();
    expect(screen.getByTestId("inspector-body")).toBeInTheDocument();
  });
});
