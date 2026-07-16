/**
 * InspectorTabContent — E3 density gating. "fewer" trims to the first three
 * visible sections and surfaces a reversible "Show all controls" affordance;
 * "full" renders everything. Per-element reshaping is covered by
 * InspectorTabContent.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InspectorTabContent } from "../InspectorTabContent";
import type { UseAdvancedSettingsReturn } from "../../hooks/useAdvancedSettings";
import type { CssContext } from "../../config/cssContext";

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
      getAllPages: vi.fn(() => []),
    },
    selection: { getSelected: vi.fn(() => null), getAllSelected: vi.fn(() => []) },
    styles: { getGlobalClasses: vi.fn(() => []) },
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

function makeCssContext(elementType: string): CssContext {
  return {
    display: "",
    parentDisplay: "",
    position: "static",
    elementType,
    isFlexContainer: false,
    isGridContainer: false,
    isFlexItem: false,
    isGridItem: false,
    isInline: false,
    isInlineBlock: false,
    isPositioned: false,
    isMedia: false,
    inspectorContext: {
      elementType,
      display: "",
      isTextLike: false,
      isContainer: true,
      isMedia: false,
      isFlexContainer: false,
      isGridContainer: false,
      devMode: false,
    } as unknown as CssContext["inspectorContext"],
    selectedElements: [],
    mixedKeys: new Set<string>(),
  };
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

function renderDensity(density: "full" | "fewer") {
  return render(
    <InspectorTabContent
      tabId="effects"
      composer={makeComposer() as never}
      selectedElement={{ id: "el-1", type: "container" }}
      styles={{}}
      onChange={vi.fn()}
      onBatchChange={vi.fn()}
      cssContext={makeCssContext("container")}
      propertyStates={{}}
      expandedSections={new Set()}
      onToggleSection={vi.fn()}
      advancedState={NO_OP_ADVANCED}
      devMode={false}
      density={density}
    />
  );
}

describe("InspectorTabContent — density gating", () => {
  // container effects tab order: effects, animation, visibility, interactions
  // (4 sections, none shouldRender-gated).
  it("full density renders all four effects sections", () => {
    renderDensity("full");
    expect(screen.getByRole("button", { name: /Effects section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Animation section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Visibility section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Interactions section/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show all controls/i })).not.toBeInTheDocument();
  });

  it("fewer density trims to the first three and hides the fourth", () => {
    renderDensity("fewer");
    expect(screen.getByRole("button", { name: /Effects section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Animation section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Visibility section/i })).toBeInTheDocument();
    // 4th section (Interactions) is dropped in "fewer".
    expect(
      screen.queryByRole("button", { name: /Interactions section/i })
    ).not.toBeInTheDocument();
  });

  it("fewer density offers a reversible 'Show all controls' affordance", () => {
    renderDensity("fewer");
    expect(
      screen.getByRole("button", { name: /Show all controls/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Simplified view/i)).toBeInTheDocument();
  });
});
