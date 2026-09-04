/**
 * ProInspector — the reach-all-like-this banner (board 160:412) and the
 * pseudo-state banner (board 160:313). Neither had any test coverage
 * before this: no existing suite referenced `reach-all-banner`,
 * `pseudo-state-banner`, "Editing all", or "not Base" at all.
 *
 * Same narrow mock harness as ProInspector.p4States.test.tsx: heavy
 * subtrees stubbed, the states under test rendered for real.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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
    isProjectLoading: () => false,
    elements: {
      getElement: () => ({
        getStyles: () => ({}),
        getClasses: () => [],
        getId: () => "el-1",
        getParent: () => null,
        getTagName: () => "button",
        getType: () => "button",
      }),
      // Two same-type peers besides the selected element — the banner reads
      // "all 3 buttons" (peers + this one), and ScopeDropdown's "All like
      // this" option is only enabled when peers.length > 0.
      getAllElements: () => [
        { getId: () => "el-1", getType: () => "button" },
        { getId: () => "el-2", getType: () => "button" },
        { getId: () => "el-3", getType: () => "button" },
      ],
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
      selectedElement={{ id: "el-1", type: "button", tagName: "button" }}
      composer={composer as never}
      currentBreakpoint="desktop"
    />,
  );
  return composer;
}

afterEach(() => cleanup());

describe("ProInspector — reach-all-like-this banner (board 160:412)", () => {
  it("shows a single warning-toned line naming the count and the element type", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /Edit reach/ }));
    fireEvent.click(screen.getByRole("button", { name: /All like this/ }));

    const banner = screen.getByTestId("reach-all-banner");
    expect(banner).toBeInTheDocument();
    // 2 peers + this element = 3.
    expect(banner).toHaveTextContent("Editing all 3 buttons — All like this");
  });

  /* Board 160:510 carries no left accent bar and insets its text 16px in a
     300px-wide frame (px-4) — a prior pass added a 2px border-left the
     board never draws. */
  it("carries no left accent border and uses the board's 16px inset", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /Edit reach/ }));
    fireEvent.click(screen.getByRole("button", { name: /All like this/ }));

    const banner = screen.getByTestId("reach-all-banner");
    expect(banner.className).toContain("tw:px-4");
    expect(banner.className).not.toMatch(/border-l/);
  });
});

describe("ProInspector — pseudo-state banner (board 160:313)", () => {
  it("says which state a write lands on once a non-Base state is picked", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "State: Base" }));
    fireEvent.click(screen.getByRole("option", { name: ":hover" }));

    expect(screen.getByTestId("pseudo-state-banner")).toHaveTextContent(
      "Editing :hover — not Base"
    );
  });

  it("shows nothing while the state is Base", () => {
    mount();
    expect(screen.queryByTestId("pseudo-state-banner")).toBeNull();
  });
});
