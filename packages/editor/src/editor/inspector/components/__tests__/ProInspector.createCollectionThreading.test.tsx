/**
 * Threading regression for the Create Collection prop path.
 *
 * Guards: ProInspector forwards its `onOpenCreateCollection` prop into
 * BindingPopover. The BindingPopover unit test covers the downstream hop
 * (its own click handler invokes the prop). This test covers the hop
 * above — a rename on either side, or accidentally dropping the prop
 * spread, would make the spy observed here fire with the wrong shape or
 * not at all.
 *
 * Kept narrow on purpose: we assert the prop identity, not the whole
 * render tree, so the test doesn't become brittle against inspector UX
 * changes.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock BindingPopover as a probe that records every prop it received on
// mount. Hoisted above the import so vitest's module registry intercepts.
const bindingPopoverProps: Array<Record<string, unknown>> = [];
vi.mock("../BindingPopover", () => ({
  BindingPopover: (props: Record<string, unknown>) => {
    bindingPopoverProps.push(props);
    return null;
  },
}));

// Keep the rest of ProInspector's heavy subtree out of the render — we
// only care about whether the prop reaches BindingPopover. Most of these
// deps come from hooks/composer, which would require a real composer to
// boot. Stub the components/hooks ProInspector imports that don't touch
// the threading under test.
vi.mock("../InspectorEmptyState", () => ({
  InspectorEmptyState: () => null,
}));
vi.mock("../MultiSelectToolbar", () => ({
  MultiSelectToolbar: () => null,
}));
vi.mock("../InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../tabs/InspectorTabContent", () => ({
  InspectorTabContent: () => null,
}));
vi.mock("../../sections/VariantSection", () => ({
  VariantSection: () => null,
}));
vi.mock("../InspectorElementMenu", () => ({
  InspectorElementMenu: () => null,
}));
vi.mock("../DeleteConfirmModal", () => ({
  DeleteConfirmModal: () => null,
}));

import { ProInspector } from "../../ProInspector";

function makeMinimalComposer() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isProjectLoading: () => false,
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
  } as any;
}

describe("ProInspector threads onOpenCreateCollection to BindingPopover", () => {
  it("passes the exact callback prop through to BindingPopover", () => {
    bindingPopoverProps.length = 0;
    const spy = vi.fn();

    render(
      <ProInspector
        selectedElement={{ id: "el-1", type: "box", tagName: "div" }}
        composer={makeMinimalComposer()}
        currentBreakpoint="desktop"
        onOpenCreateCollection={spy}
      />
    );

    const received = bindingPopoverProps[0];
    expect(received, "BindingPopover must mount").toBeTruthy();
    expect(received.onOpenCreateCollection).toBe(spy);

    // Simulate BindingPopover's footer click firing the received callback —
    // the same contract the real component uses. If the prop was dropped
    // or renamed upstream, `received.onOpenCreateCollection` would be
    // undefined and this call would throw.
    (received.onOpenCreateCollection as () => void)();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("renders cleanly when onOpenCreateCollection is omitted", () => {
    bindingPopoverProps.length = 0;
    render(
      <ProInspector
        selectedElement={{ id: "el-1", type: "box", tagName: "div" }}
        composer={makeMinimalComposer()}
        currentBreakpoint="desktop"
      />
    );
    expect(bindingPopoverProps[0]?.onOpenCreateCollection).toBeUndefined();
  });
});
