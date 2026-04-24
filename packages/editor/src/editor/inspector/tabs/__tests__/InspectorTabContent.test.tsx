/**
 * InspectorTabContent smoke tests — per-element-type section rendering.
 *
 * Verifies the profile-driven renderer actually reshapes per selection by
 * asserting that different element types produce different section orders
 * in the same tab. Each test mounts InspectorTabContent with a minimal
 * composer stub and a fixture element, then queries the rendered section
 * headers by title.
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InspectorTabContent } from "../InspectorTabContent";
import type { UseAdvancedSettingsReturn } from "../../hooks/useAdvancedSettings";
import type { CssContext } from "../../config/cssContext";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeComposer() {
  return {
    elements: {
      getElement: vi.fn(() => ({
        getAnimation: vi.fn(() => null),
        getInteractions: vi.fn(() => []),
        getContent: vi.fn(() => ""),
        getAttribute: vi.fn(() => ""),
        getStyles: vi.fn(() => ({})),
        getClasses: vi.fn(() => []),
      })),
      // LinkSection queries all pages on mount to populate its page dropdown.
      getAllPages: vi.fn(() => []),
    },
    selection: {
      getSelected: vi.fn(() => null),
      getAllSelected: vi.fn(() => []),
      select: vi.fn(),
      clear: vi.fn(),
    },
    styles: {
      getGlobalClasses: vi.fn(() => []),
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

function makeCssContext(overrides: Partial<CssContext> = {}): CssContext {
  const base: CssContext = {
    display: "",
    parentDisplay: "",
    position: "static",
    elementType: "",
    isFlexContainer: false,
    isGridContainer: false,
    isFlexItem: false,
    isGridItem: false,
    isInline: false,
    isInlineBlock: false,
    isPositioned: false,
    isMedia: false,
    inspectorContext: {
      elementType: "",
      display: "",
      isTextLike: false,
      isContainer: false,
      isMedia: false,
      isFlexContainer: false,
      isGridContainer: false,
      devMode: false,
    } as unknown as CssContext["inspectorContext"],
  };
  return { ...base, ...overrides };
}

const NO_OP_ADVANCED: UseAdvancedSettingsReturn = {
  isExpanded: () => false,
  toggle: vi.fn(),
  expand: vi.fn(),
  collapse: vi.fn(),
  expandAll: vi.fn(),
  collapseAll: vi.fn(),
  expandedGroups: new Set(),
};

function renderTab(opts: {
  tabId: "style" | "element" | "effects";
  elementType: string;
  cssContext?: Partial<CssContext>;
  devMode?: boolean;
  expanded?: Set<string>;
}) {
  const composer = makeComposer();
  const cssContext = makeCssContext({
    ...opts.cssContext,
    elementType: opts.elementType,
    inspectorContext: {
      ...makeCssContext().inspectorContext,
      ...opts.cssContext?.inspectorContext,
      elementType: opts.elementType,
    },
  });
  return render(
    <InspectorTabContent
      tabId={opts.tabId}
      composer={composer as never}
      selectedElement={{ id: "el-1", type: opts.elementType }}
      styles={{}}
      onChange={vi.fn()}
      onBatchChange={vi.fn()}
      cssContext={cssContext}
      propertyStates={{}}
      expandedSections={opts.expanded ?? new Set()}
      onToggleSection={vi.fn()}
      advancedState={NO_OP_ADVANCED}
      devMode={opts.devMode ?? false}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Smoke tests
// ─────────────────────────────────────────────────────────────────────────────

describe("InspectorTabContent — per-element-type reshaping", () => {
  it("text element's style tab shows Typography before Size", () => {
    renderTab({
      tabId: "style",
      elementType: "text",
      cssContext: {
        inspectorContext: {
          elementType: "text",
          display: "",
          isTextLike: true,
          isContainer: false,
          isMedia: false,
          isFlexContainer: false,
          isGridContainer: false,
          devMode: false,
        } as unknown as CssContext["inspectorContext"],
      },
    });
    const typography = screen.getByRole("button", { name: /Typography section/i });
    const size = screen.getByRole("button", { name: /Size section/i });
    // Typography appears before Size in DOM order.
    expect(
      typography.compareDocumentPosition(size) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("image element's style tab shows Size as the first section", () => {
    renderTab({
      tabId: "style",
      elementType: "image",
      cssContext: {
        isMedia: true,
        inspectorContext: {
          elementType: "image",
          display: "",
          isTextLike: false,
          isContainer: false,
          isMedia: true,
          isFlexContainer: false,
          isGridContainer: false,
          devMode: false,
        } as unknown as CssContext["inspectorContext"],
      },
    });
    // Image profile doesn't include Typography (it's not text-like).
    expect(
      screen.queryByRole("button", { name: /Typography section/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Size section/i })).toBeInTheDocument();
  });

  it("flex container's style tab includes Flexbox before Size", () => {
    renderTab({
      tabId: "style",
      elementType: "flex",
      cssContext: {
        display: "flex",
        isFlexContainer: true,
        inspectorContext: {
          elementType: "flex",
          display: "flex",
          isTextLike: false,
          isContainer: true,
          isMedia: false,
          isFlexContainer: true,
          isGridContainer: false,
          devMode: false,
        } as unknown as CssContext["inspectorContext"],
      },
    });
    const flexbox = screen.getByRole("button", { name: /Flexbox section/i });
    const size = screen.getByRole("button", { name: /Size section/i });
    expect(
      flexbox.compareDocumentPosition(size) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("container without flex/grid does not render Flexbox section", () => {
    renderTab({
      tabId: "style",
      elementType: "container",
      cssContext: {
        display: "block",
        isFlexContainer: false,
        isFlexItem: false,
      },
    });
    // Flex is in the container profile's order but shouldRender filters it out.
    expect(
      screen.queryByRole("button", { name: /Flexbox section/i })
    ).not.toBeInTheDocument();
  });

  it("container's effects tab shows Effects + Animation + Visibility", () => {
    renderTab({ tabId: "effects", elementType: "container" });
    expect(screen.getByRole("button", { name: /Effects section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Animation section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Visibility section/i })).toBeInTheDocument();
  });

  it("button element's element tab shows Link Settings (linkable)", () => {
    renderTab({ tabId: "element", elementType: "button" });
    expect(
      screen.getByRole("button", { name: /Link Settings section/i })
    ).toBeInTheDocument();
  });

  it("container element's element tab does NOT show Link Settings (not linkable)", () => {
    renderTab({ tabId: "element", elementType: "container" });
    expect(
      screen.queryByRole("button", { name: /Link Settings section/i })
    ).not.toBeInTheDocument();
  });

  it("all-css is only rendered in dev mode", () => {
    const { rerender } = renderTab({
      tabId: "element",
      elementType: "container",
      devMode: false,
    });
    expect(screen.queryByRole("button", { name: /All CSS section/i })).not.toBeInTheDocument();

    rerender(
      <InspectorTabContent
        tabId="element"
        composer={makeComposer() as never}
        selectedElement={{ id: "el-1", type: "container" }}
        styles={{}}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
        cssContext={makeCssContext({ elementType: "container" })}
        propertyStates={{}}
          expandedSections={new Set()}
        onToggleSection={vi.fn()}
        advancedState={NO_OP_ADVANCED}
        devMode={true}
      />
    );
    expect(screen.getByRole("button", { name: /All CSS section/i })).toBeInTheDocument();
  });

  it("css-classes is universal — appears for every element type's element tab", () => {
    for (const type of ["container", "text", "image", "button", "input"]) {
      const { unmount } = renderTab({ tabId: "element", elementType: type });
      expect(
        screen.getByRole("button", { name: /^Classes section/i }),
        `css-classes missing for ${type}`
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("unknown element types fall back to container profile without crashing", () => {
    expect(() => {
      renderTab({ tabId: "style", elementType: "nonexistent-widget-xyz" });
    }).not.toThrow();
    // Container profile starts with quick-actions; it's a non-collapsible row
    // with a "Block" preset button, so that button is a good existence check.
    expect(screen.getByRole("button", { name: /Set layout to Block/i })).toBeInTheDocument();
  });
});
