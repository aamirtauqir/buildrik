/**
 * ProInspector P4 states — AI agent takeover (board 160:512); the
 * whole-site scope banner (board 189:2) is gone with the scope row (DD-6a). Uses the same narrow mock harness
 * as the createCollectionThreading test: heavy subtrees stubbed, the
 * states under test rendered for real.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ToastProvider } from "@/editor/chrome-ui";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

vi.mock("../InspectorEmptyState", () => ({ InspectorEmptyState: () => null }));
vi.mock("../MultiSelectToolbar", () => ({ MultiSelectToolbar: () => null }));
vi.mock("../InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../tabs/InspectorTabContent", () => ({
  InspectorTabContent: () => <div data-testid="inspector-body" />,
}));
vi.mock("../../sections/ComponentRow", () => ({ ComponentRow: () => null }));
vi.mock("../InspectorElementMenu", () => ({ InspectorElementMenu: () => null }));
vi.mock("../DeleteConfirmModal", () => ({ DeleteConfirmModal: () => null }));

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
    isProjectLoading: () => false,
    elements: {
      getElement: () => ({
        getStyles: () => ({}),
        getClasses: () => [],
        getCustomData: () => undefined,
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
    { wrapper: ToastProvider },
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

  /* DD-6a/6b: the Applies-to scope and its Whole site takeover are gone —
     the one reach beyond this element is ⋯ "Apply style to all …". */
  it("offers no scope row: no Applies to, no Whole site", () => {
    mount();
    expect(screen.queryByText("Applies to")).toBeNull();
    expect(screen.queryByRole("button", { name: /Whole site|Edit reach/ })).toBeNull();
    expect(screen.queryByTestId("inspector-whole-site")).toBeNull();
  });
});
