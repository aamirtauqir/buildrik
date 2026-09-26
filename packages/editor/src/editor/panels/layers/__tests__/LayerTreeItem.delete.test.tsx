/**
 * L-4: Delete / Backspace on a selected Layers row did nothing, even for an
 * unlocked element. The global shortcut listener stands down inside a
 * role=tree widget (its own keyboard contract), and the row handled neither
 * key. The row now runs the SAME engine "delete" command the canvas key runs —
 * lock and component-instance rules, the multi-select confirm and the single
 * undo step all come with it.
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

function row(container: HTMLElement) {
  return container.querySelector('[role="treeitem"]') as HTMLElement;
}

describe("LayerTreeItem — Delete runs the delete command", () => {
  it.each(["Delete", "Backspace"])("%s on the selected row runs commands.run('delete')", (key) => {
    const run = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <LayerTreeItem {...makeProps({ composer: { commands: { run } } as never, selectedIds: new Set(["l1"]), onSelect })} />,
    );
    fireEvent.keyDown(row(container), { key });
    expect(run).toHaveBeenCalledWith("delete");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("on a focused row that is not selected, selects it first", () => {
    const calls: string[] = [];
    const { container } = render(
      <LayerTreeItem
        {...makeProps({
          composer: { commands: { run: () => calls.push("run") } } as never,
          selectedIds: new Set(["other"]),
          onSelect: () => calls.push("select"),
        })}
      />,
    );
    fireEvent.keyDown(row(container), { key: "Delete" });
    expect(calls).toEqual(["select", "run"]);
  });

  it("does nothing while the row is being renamed", () => {
    const run = vi.fn();
    const { container } = render(
      <LayerTreeItem {...makeProps({ composer: { commands: { run } } as never, selectedIds: new Set(["l1"]), editingId: "l1" })} />,
    );
    const input = container.querySelector("input");
    fireEvent.keyDown(input ?? row(container), { key: "Backspace" });
    expect(run).not.toHaveBeenCalled();
  });
});
