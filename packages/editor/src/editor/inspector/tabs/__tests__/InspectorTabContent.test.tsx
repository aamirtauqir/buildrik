/**
 * InspectorTabContent — Inspector v4: one order per tab, presence by the
 * type's capabilities (intersection for a multi-selection), and each
 * section's display mode (open / summary / "+" row, DD-11) drawn by the
 * frame the renderer hands the section.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
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
  tabId: "style" | "behaviour" | "effects";
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
  it("heading · Style: the type block leads, then Typography, Size, Spacing, Fill, Border (board 1)", () => {
    renderTab({ tabId: "style", elementType: "heading" });
    expect(sectionNames()).toEqual(["Heading", "Typography", "Size", "Spacing", "Fill", "Border"]);
  });

  it("image · Style: no Typography, no Text inside", () => {
    renderTab({ tabId: "style", elementType: "image" });
    expect(sectionNames()).toEqual(["Image", "Size", "Spacing", "Fill", "Border"]);
  });

  it("a container set to flex gets no Flexbox section — Layout carries the flex controls (board 17)", () => {
    renderTab({ tabId: "style", elementType: "container", cssContext: { display: "flex", isFlexContainer: true } });
    expect(sectionNames()[0]).toBe("Layout");
    expect(sectionNames()).not.toContain("Flexbox");
  });

  it("Behaviour carries Interactions (Q1) and Visibility; Effects carries neither", () => {
    const { unmount } = renderTab({ tabId: "effects", elementType: "container" });
    /* FG-022: the three secondary sections sit behind "More effects". */
    expect(sectionNames()).toEqual(["Opacity", "Shadow", "More effects"]);
    unmount();
    renderTab({ tabId: "behaviour", elementType: "container" });
    expect(sectionNames()).toEqual(["Link", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });

  it("an image shows no Link; a heading shows CMS binding, no Link", () => {
    const { unmount } = renderTab({ tabId: "behaviour", elementType: "image" });
    expect(sectionNames()).not.toContain("Link");
    unmount();
    renderTab({ tabId: "behaviour", elementType: "heading" });
    expect(sectionNames()).toEqual(["CMS binding", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });

  it("a multi-selection shows only the sections every selected type has (DD-12)", () => {
    renderTab({ tabId: "style", elementType: "heading", selectedTypes: ["heading", "image"] });
    /* No shared type block, no Typography (the image has none). */
    expect(sectionNames()).toEqual(["Size", "Spacing", "Fill", "Border"]);
  });

  it("an unknown stored type falls back to the container set without crashing", () => {
    renderTab({ tabId: "style", elementType: "nonexistent-widget-xyz" });
    expect(sectionNames()[0]).toBe("Layout");
  });
});

describe("InspectorTabContent — display modes (DD-11)", () => {
  it("Fill and Border arrive as '+' rows when the element carries no value", () => {
    renderTab({ tabId: "style", elementType: "heading" });
    expect(screen.getByTestId("inspector-add-fill")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-add-border")).toBeInTheDocument();
  });

  it("a valued section arrives open", () => {
    renderTab({ tabId: "style", elementType: "heading", authored: { "background-color": "#ff0000" } });
    expect(screen.queryByTestId("inspector-add-fill")).toBeNull();
    expect(screen.getByRole("button", { name: "Fill section, expanded" })).toBeInTheDocument();
  });

  it("the '+' records an open choice for this element type", () => {
    const onSetChoices = vi.fn();
    renderTab({ tabId: "style", elementType: "heading", onSetChoices });
    fireEvent.click(screen.getByTestId("inspector-add-border"));
    expect(onSetChoices).toHaveBeenCalledWith("heading", ["border"], "open");
  });

  it("Attributes and Effects › Advanced arrive closed with their one-line summary", () => {
    renderTab({ tabId: "effects", elementType: "heading", choices: { "heading:more-effects": "open" } });
    expect(screen.getByTestId("inspector-summary-effects-advanced")).toHaveTextContent("Cursor: auto · Blend: normal");
  });

  it("a user's close wins over 'always'", () => {
    renderTab({ tabId: "style", elementType: "heading", choices: { "heading:typography": "closed" } });
    expect(screen.getByRole("button", { name: "Typography section, collapsed" })).toBeInTheDocument();
  });

  it("⌥-click on a header sets every section on the tab (DD-22)", () => {
    const onSetChoices = vi.fn();
    renderTab({ tabId: "style", elementType: "heading", onSetChoices });
    fireEvent.click(screen.getByRole("button", { name: "Size section, expanded" }), { altKey: true });
    expect(onSetChoices).toHaveBeenCalledWith("heading", ["type", "typography", "size", "spacing", "fill", "border"], "closed");
  });
});

/* FG-022 (owner 2026-10-10): Opacity and Shadow arrive expanded; Filters,
   Transform & motion and Advanced sit under a collapsed "More effects", and
   a collapsed More effects says when one of them holds an active effect. */
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

  it("opening it records the choice and shows Filters, Transform & motion, Advanced", () => {
    const onSetChoices = vi.fn();
    const { unmount } = renderTab({ tabId: "effects", elementType: "container", onSetChoices });
    fireEvent.click(screen.getByRole("button", { name: "More effects section, collapsed" }));
    expect(onSetChoices).toHaveBeenCalledWith("container", ["more-effects"], "open");
    unmount();
    renderTab({ tabId: "effects", elementType: "container", choices: { "container:more-effects": "open" } });
    expect(sectionNames()).toEqual(["Opacity", "Shadow", "More effects", "Filters", "Transform & motion", "Advanced"]);
  });

  it("a collapsed More effects names the active effects it holds", () => {
    renderTab({ tabId: "effects", elementType: "container", authored: { filter: "blur(4px)", transform: "rotate(5deg)" } });
    expect(screen.getByRole("button", { name: "More effects section, collapsed" })).toBeInTheDocument();
    expect(screen.getByTestId("inspector-summary-more-effects")).toHaveTextContent("Active: Filters, Transform & motion");
    expect(screen.getByTestId("inspector-more-effects-active")).toBeInTheDocument();
  });

  it("opening a section inside it (a property jump) opens More effects too", () => {
    renderTab({ tabId: "effects", elementType: "container", choices: { "container:filters": "open" } });
    expect(screen.getByRole("button", { name: "Filters section, expanded" })).toBeInTheDocument();
  });
});
