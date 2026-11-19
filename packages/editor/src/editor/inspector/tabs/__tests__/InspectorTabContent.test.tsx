/**
 * InspectorTabContent — Inspector v4: one order per tab, presence by the
 * type's capabilities (intersection for a multi-selection), and each
 * section's display mode (open / summary / "+" row, DD-11) drawn by the
 * frame the renderer hands the section.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import * as React from "react";
/* Interactions raises receipts through the toast provider. */
const render = (ui: React.ReactElement) => rtlRender(<ToastProvider>{ui}</ToastProvider>);
import { describe, expect, it, vi } from "vitest";
import { InspectorTabContent } from "../InspectorTabContent";
import type { UseAdvancedSettingsReturn } from "@/editor/inspector/hooks/useAdvancedSettings";
import type { CssContext } from "@/editor/inspector/config/cssContext";

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
        getTagName: vi.fn(() => "div"),
        getChildren: vi.fn(() => []),
        getParent: vi.fn(() => null),
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
    } as unknown as CssContext["inspectorContext"],
    selectedElements: [],
    mixedKeys: new Set<string>(),
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
  tabId: "content" | "style" | "behaviour" | "effects";
  elementType: string;
  cssContext?: Partial<CssContext>;
  authored?: Record<string, string>;
  choices?: Record<string, "open" | "closed">;
  selectedTypes?: string[];
  onSetChoices?: ReturnType<typeof vi.fn>;
}) {
  const composer = makeComposer();
  const cssContext = makeCssContext({ ...opts.cssContext, elementType: opts.elementType });
  return render(
    <InspectorTabContent
      tabId={opts.tabId}
      composer={composer as never}
      selectedElement={{ id: "el-1", type: opts.elementType }}
      selectedIds={["el-1"]}
      selectedTypes={opts.selectedTypes ?? [opts.elementType]}
      styles={{}}
      authoredStyles={opts.authored ?? {}}
      onChange={vi.fn()}
      onBatchChange={vi.fn()}
      cssContext={cssContext}
      propertyStates={{}}
      choices={opts.choices ?? {}}
      onSetChoices={(opts.onSetChoices ?? vi.fn()) as never}
      advancedState={NO_OP_ADVANCED}
    />
  );
}

const sectionNames = () =>
  screen.getAllByRole("button", { name: / section, (expanded|collapsed)$/ }).map((b) => b.getAttribute("aria-label")!.replace(/ section, .*/, ""));

describe("InspectorTabContent — one order per tab, presence by capability", () => {
  it("heading · Content: the type block leads, then Semantics, Advanced attributes (2L9 161:8480)", () => {
    renderTab({ tabId: "content", elementType: "heading" });
    expect(sectionNames()).toEqual(["Heading", "Semantics", "Advanced attributes"]);
  });

  it("heading · Style: Typography, Size, Spacing, Fill, Border — no type block", () => {
    renderTab({ tabId: "style", elementType: "heading" });
    expect(sectionNames()).toEqual(["Typography", "Size", "Spacing", "Background", "Border"]);
  });

  it("image · Style: no Typography, no Text inside", () => {
    renderTab({ tabId: "style", elementType: "image" });
    expect(sectionNames()).toEqual(["Size", "Spacing", "Background", "Border"]);
  });

  it("a container set to flex gets no Flexbox section — Children layout carries the flex controls (board 17, 247:21216)", () => {
    renderTab({ tabId: "style", elementType: "container", cssContext: { display: "flex", isFlexContainer: true } });
    expect(sectionNames()[0]).toBe("Children layout");
    expect(sectionNames()).not.toContain("Flexbox");
  });

  it("Behavior carries Interactions (Q1) and Visibility; Effects carries neither", () => {
    const { unmount } = renderTab({ tabId: "effects", elementType: "container" });
    /* FG-022: the three secondary sections sit behind "More effects". */
    expect(sectionNames()).toEqual(["Opacity", "Shadow", "More effects"]);
    unmount();
    renderTab({ tabId: "behaviour", elementType: "container" });
    expect(sectionNames()).toEqual(["Link", "Visibility", "Interactions"]);
  });

  it("an image shows no Link; a heading's Behavior has no Link and no CMS binding", () => {
    const { unmount } = renderTab({ tabId: "behaviour", elementType: "image" });
    expect(sectionNames()).not.toContain("Link");
    unmount();
    renderTab({ tabId: "behaviour", elementType: "heading" });
    expect(sectionNames()).toEqual(["Visibility", "Interactions"]);
  });

  it("a multi-selection shows only the sections every selected type has (DD-12)", () => {
    renderTab({ tabId: "style", elementType: "heading", selectedTypes: ["heading", "image"] });
    /* No shared type block, no Typography (the image has none). */
    expect(sectionNames()).toEqual(["Size", "Spacing", "Background", "Border"]);
  });

  it("an unknown stored type falls back to the container set without crashing", () => {
    renderTab({ tabId: "style", elementType: "nonexistent-widget-xyz" });
    expect(sectionNames()[0]).toBe("Children layout");
  });
});

describe("InspectorTabContent — display modes (DD-11)", () => {
  it("2L9 161:8940: Spacing, Background and Border arrive shut, summarised 'None' / 'n set'", () => {
    renderTab({ tabId: "style", elementType: "heading", authored: { "padding-top": "8px", "padding-bottom": "8px" } });
    expect(screen.getByTestId("inspector-summary-spacing")).toHaveTextContent("2 set");
    expect(screen.getByTestId("inspector-summary-fill")).toHaveTextContent("None");
    expect(screen.getByTestId("inspector-summary-border")).toHaveTextContent("None");
  });

  it("opening a shut section records an open choice for this element type", () => {
    const onSetChoices = vi.fn();
    renderTab({ tabId: "style", elementType: "heading", onSetChoices });
    fireEvent.click(screen.getByRole("button", { name: "Border section, collapsed" }));
    expect(onSetChoices).toHaveBeenCalledWith("heading", ["border"], "open");
  });

  it("Effects › Advanced effects and Transform and transition arrive closed with 'n set' / 'None' (2L9 161:12525)", () => {
    renderTab({ tabId: "effects", elementType: "heading", choices: { "heading:more-effects": "open" } });
    expect(screen.getByTestId("inspector-summary-effects-advanced")).toHaveTextContent("None");
    expect(screen.getByTestId("inspector-summary-transform-motion")).toHaveTextContent("None");
  });

  it("a user's close wins over 'always'", () => {
    renderTab({ tabId: "style", elementType: "heading", choices: { "heading:typography": "closed" } });
    expect(screen.getByRole("button", { name: "Typography section, collapsed" })).toBeInTheDocument();
  });

  it("⌥-click on a header sets every section on the tab (DD-22)", () => {
    const onSetChoices = vi.fn();
    renderTab({ tabId: "style", elementType: "heading", onSetChoices });
    fireEvent.click(screen.getByRole("button", { name: "Size section, expanded" }), { altKey: true });
    expect(onSetChoices).toHaveBeenCalledWith("heading", ["typography", "size", "spacing", "fill", "border"], "closed");
  });
});

/* FG-022 (owner 2026-10-10, kept on the 2L9 design 2026-11-19): Opacity and
   Shadow arrive expanded; Filters, Transform and transition and Advanced
   effects sit under a collapsed "More effects", and a collapsed More effects
   says when one of them holds an active effect. */
describe("InspectorTabContent — Effects › More effects (FG-022)", () => {
  it("Opacity and Shadow arrive expanded with nothing set", () => {
    renderTab({ tabId: "effects", elementType: "container" });
    expect(screen.getByRole("button", { name: "Opacity section, expanded" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shadow section, expanded" })).toBeInTheDocument();
  });

  it("More effects arrives collapsed, its three sections unmounted", () => {
    renderTab({ tabId: "effects", elementType: "container" });
    expect(screen.getByRole("button", { name: "More effects section, collapsed" })).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-section-filters")).toBeNull();
    expect(screen.queryByTestId("inspector-summary-more-effects")).toBeNull();
  });

  it("opening it records the choice and shows the three sections", () => {
    const onSetChoices = vi.fn();
    const { unmount } = renderTab({ tabId: "effects", elementType: "container", onSetChoices });
    fireEvent.click(screen.getByRole("button", { name: "More effects section, collapsed" }));
    expect(onSetChoices).toHaveBeenCalledWith("container", ["more-effects"], "open");
    unmount();
    renderTab({ tabId: "effects", elementType: "container", choices: { "container:more-effects": "open" } });
    expect(sectionNames()).toEqual(["Opacity", "Shadow", "More effects", "Filters", "Transform and transition", "Advanced effects"]);
  });

  it("closing it also closes the sections opened inside it", () => {
    const onSetChoices = vi.fn();
    renderTab({ tabId: "effects", elementType: "container", onSetChoices, choices: { "container:more-effects": "open", "container:filters": "open" } });
    fireEvent.click(screen.getByRole("button", { name: "More effects section, expanded" }));
    expect(onSetChoices).toHaveBeenCalledWith("container", ["more-effects", "filters"], "closed");
  });

  it("a collapsed More effects names the active effects it holds", () => {
    renderTab({ tabId: "effects", elementType: "container", authored: { filter: "blur(4px)", transform: "rotate(5deg)" } });
    expect(screen.getByRole("button", { name: "More effects section, collapsed" })).toBeInTheDocument();
    expect(screen.getByTestId("inspector-summary-more-effects")).toHaveTextContent("Active: Filters, Transform and transition");
    expect(screen.getByTestId("inspector-more-effects-active")).toBeInTheDocument();
  });

  it("opening a section inside it (a property jump) opens More effects too", () => {
    renderTab({ tabId: "effects", elementType: "container", choices: { "container:filters": "open" } });
    expect(screen.getByRole("button", { name: "Filters section, expanded" })).toBeInTheDocument();
  });
});
