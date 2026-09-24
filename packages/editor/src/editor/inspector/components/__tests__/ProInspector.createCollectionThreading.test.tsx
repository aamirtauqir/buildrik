/**
 * Threading regression for the Create Collection prop path.
 *
 * Guards: ProInspector forwards its `onOpenCreateCollection` prop into the
 * tab content, which hands it to Settings › CONTENT's BindingPopover (the
 * binding door moved there from the header — G2-144). The BindingPopover unit test covers the downstream hop
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
const tabContentProps: Array<Record<string, unknown>> = [];
vi.mock("../../tabs/InspectorTabContent", () => ({
  InspectorTabContent: (props: Record<string, unknown>) => {
    tabContentProps.push(props);
    return null;
  },
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
import { ToastProvider } from "@/editor/chrome-ui";

/* ProInspector mounts VariantSection, which reports a refused detach
   rather than swallowing it — so it needs the toast context. AquibraStudio
   wraps the whole studio in one, so every real mount has it and only these
   tests rendered the subtree bare. */
const renderWithToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);


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
  } as any;
}

describe("ProInspector threads onOpenCreateCollection to the Settings tab content", () => {
  it("passes the exact callback prop through to InspectorTabContent", () => {
    tabContentProps.length = 0;
    const spy = vi.fn();

    renderWithToast(
      <ProInspector
        selectedElement={{ id: "el-1", type: "box", tagName: "div" }}
        composer={makeMinimalComposer()}
        currentBreakpoint="desktop"
        onOpenCreateCollection={spy}
      />
    );

    const received = tabContentProps[0];
    expect(received, "InspectorTabContent must mount").toBeTruthy();
    expect(received.onOpenCreateCollection).toBe(spy);

    // Simulate BindingPopover's footer click firing the received callback —
    // the same contract the real component uses. If the prop was dropped
    // or renamed upstream, `received.onOpenCreateCollection` would be
    // undefined and this call would throw.
    (received.onOpenCreateCollection as () => void)();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("renders cleanly when onOpenCreateCollection is omitted", () => {
    tabContentProps.length = 0;
    renderWithToast(
      <ProInspector
        selectedElement={{ id: "el-1", type: "box", tagName: "div" }}
        composer={makeMinimalComposer()}
        currentBreakpoint="desktop"
      />
    );
    expect(tabContentProps[0]?.onOpenCreateCollection).toBeUndefined();
    // The header no longer mounts the popover (board 4428:141170).
    expect(bindingPopoverProps).toHaveLength(0);
  });
});
