/**
 * B-9: Layers roving tabindex — only the selected row (or, with nothing
 * selected, the first visible row) sits at tabIndex 0; everything else is
 * -1, so Tab stops once instead of walking the whole tree. Arrow keys move
 * BOTH the selection and DOM focus, so keyboard traversal doesn't strand
 * focus on a row that just lost isSelected.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LayerTreeItem, type LayerTreeItemProps } from "../LayerTreeItem";

const noop = () => {};

function makeProps(overrides: Partial<LayerTreeItemProps> = {}): LayerTreeItemProps {
  return {
    layer: { id: "l1", type: "container", tagName: "div", depth: 0, children: [] },
    composer: null,
    expandedIds: new Set<string>(),
    dragState: { draggedId: null, targetId: null, position: null },
    hiddenIds: new Set<string>(),
    lockedIds: new Set<string>(),
    selectedIds: new Set<string>(),
    customNames: new Map<string, string>(),
    canvasHoveredId: null,
    editingId: null,
    editingName: "",
    editInputRef: { current: null },
    onToggleExpand: noop,
    onToggleVisibility: noop,
    onToggleLock: noop,
    onStartEditing: noop,
    onSaveEditedName: noop,
    onCancelEditing: noop,
    onEditingNameChange: noop,
    onMouseEnter: noop,
    onMouseLeave: noop,
    onDragStart: noop,
    onDragEnd: noop,
    onDragOver: noop,
    onDragLeave: noop,
    onDrop: noop,
    onSelect: noop,
    onContextMenu: noop,
    getVisibleLayerIds: () => ["l1"],
    displayPrefs: {
      showDimmed: true,
      showLockBadges: true,
      treeDensity: "compact",
      highlightCmsBound: false,
      showHtmlBadges: false,
    },
    ...overrides,
  } as unknown as LayerTreeItemProps;
}

describe("LayerTreeItem — roving tabindex", () => {
  it("a selected row is tabIndex 0", () => {
    const { container } = render(
      <LayerTreeItem {...makeProps({ selectedIds: new Set(["l1"]) })} />,
    );
    expect(container.querySelector('[role="treeitem"]')).toHaveAttribute("tabIndex", "0");
  });

  it("an unselected row, with something else selected, is tabIndex -1", () => {
    const { container } = render(
      <LayerTreeItem
        {...makeProps({ selectedIds: new Set(["other"]), getVisibleLayerIds: () => ["l1", "other"] })}
      />,
    );
    expect(container.querySelector('[role="treeitem"]')).toHaveAttribute("tabIndex", "-1");
  });

  it("with nothing selected, the first visible row is tabIndex 0", () => {
    const { container } = render(
      <LayerTreeItem {...makeProps({ selectedIds: new Set(), getVisibleLayerIds: () => ["l1", "l2"] })} />,
    );
    expect(container.querySelector('[role="treeitem"]')).toHaveAttribute("tabIndex", "0");
  });

  it("with nothing selected, a row that is NOT first is tabIndex -1", () => {
    const { container } = render(
      <LayerTreeItem
        {...makeProps({ layer: { id: "l2", type: "container", tagName: "div", depth: 0, children: [] }, selectedIds: new Set(), getVisibleLayerIds: () => ["l1", "l2"] })}
      />,
    );
    expect(container.querySelector('[role="treeitem"]')).toHaveAttribute("tabIndex", "-1");
  });
});

describe("LayerTreeItem — ArrowDown/Up moves DOM focus with the selection", () => {
  it("focuses the next row's element after selecting it", () => {
    document.body.innerHTML = "";
    const nextRow = document.createElement("div");
    nextRow.setAttribute("data-testid", "layer-row-l2");
    nextRow.tabIndex = -1;
    document.body.appendChild(nextRow);
    const focusSpy = vi.spyOn(nextRow, "focus");

    const onSelect = vi.fn();
    const { container } = render(
      <LayerTreeItem
        {...makeProps({
          selectedIds: new Set(["l1"]),
          getVisibleLayerIds: () => ["l1", "l2"],
          onSelect,
        })}
      />,
    );
    const row = container.querySelector('[role="treeitem"]') as HTMLElement;
    fireEvent.keyDown(row, { key: "ArrowDown" });

    expect(onSelect).toHaveBeenCalledWith("l2", {});
    expect(focusSpy).toHaveBeenCalled();
    nextRow.remove();
  });
});
