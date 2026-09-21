/**
 * InspectorTabContent — the Beginner / Pro tier (decision #29, boards
 * 4428:141170 Beginner · 4428:141406 Pro · 6887:74333 Beginner expanded).
 * Beginner hides the registry's ADVANCED-tagged sections behind "Show all
 * (N more)"; Pro renders everything. Per-element reshaping is covered by
 * InspectorTabContent.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
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

function renderTier(tier: "beginner" | "pro", showAll = false, onShowAllChange = vi.fn()) {
  return render(
    <InspectorTabContent
      tabId="style"
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
      tier={tier}
      showAll={showAll}
      onShowAllChange={onShowAllChange}
    />
  );
}

describe("InspectorTabContent — Beginner / Pro tier", () => {
  // Container profile, Style tab: layout (ADVANCED), size, spacing,
  // background, border, corner-radius (ADVANCED); flex, grid and typography
  // hide themselves on a plain non-text container.
  it("Pro renders the whole column, no Show-all row", () => {
    renderTier("pro");
    expect(screen.getByRole("button", { name: /Layout section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Spacing section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Corner radius section/i })).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-show-all")).not.toBeInTheDocument();
    expect(screen.queryByTestId("inspector-show-less")).not.toBeInTheDocument();
  });

  it("Beginner hides the ADVANCED-tagged sections and counts them in the Show-all row", () => {
    renderTier("beginner");
    expect(screen.getByRole("button", { name: /Size section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Spacing section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Border section/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Layout section/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Corner radius section/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("inspector-show-all").textContent).toBe("Show all (2 more)");
  });

  it("Show all asks the panel to reveal; revealed, the row reads 'N of N groups · Show less'", () => {
    const onShowAllChange = vi.fn();
    const { unmount } = renderTier("beginner", false, onShowAllChange);
    fireEvent.click(screen.getByTestId("inspector-show-all"));
    expect(onShowAllChange).toHaveBeenCalledWith(true);
    unmount();

    renderTier("beginner", true, onShowAllChange);
    expect(screen.getByRole("button", { name: /Layout section/i })).toBeInTheDocument();
    expect(screen.getByTestId("inspector-show-less").textContent).toBe("6 of 6 groups · Show less ▴");
    fireEvent.click(screen.getByTestId("inspector-show-less"));
    expect(onShowAllChange).toHaveBeenLastCalledWith(false);
  });

  it("hides by TAG, not by position — an untagged fourth section stays", () => {
    renderTier("beginner");
    // Border is the fourth visible Style section for a container (size,
    // spacing, background, border) and is not tagged advanced; the old
    // ?density=fewer sliced at three and would have cut it.
    expect(screen.getByRole("button", { name: /Background section/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Border section/i })).toBeInTheDocument();
  });
});
