/**
 * The indent ladder is v3 board 4418:81300's (also 4418:79139).
 *
 * Read off the frame (Figma g4GzQFqzNYz5sosz1QtZXC page 4418:45431): the 16px
 * chevron boxes sit 16 / 32 / 48 from the drawer's left edge — base 16, step
 * 16. The first 16 is the gutter the multi-select checkbox lives in (x 4–20).
 * The V1 ladder (1082:4640) was base 12, which left no room for that box.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LayerTreeItem, type LayerTreeItemProps } from "../LayerTreeItem";

/** Board 4418:81300, chevron x (relative to the drawer) by depth. */
const BOARD_CHEVRON_X = [16, 32, 48];

const noop = () => {};
function rowFor(depth: number) {
  const props = {
    layer: { id: `l${depth}`, type: "container", tagName: "div", depth, children: [] },
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
    onToggleExpand: noop, onToggleVisibility: noop, onToggleLock: noop, onStartEditing: noop,
    onSaveEditedName: noop, onCancelEditing: noop, onEditingNameChange: noop, onMouseEnter: noop,
    onMouseLeave: noop, onDragStart: noop, onDragEnd: noop, onDragOver: noop, onDragLeave: noop,
    onDrop: noop, onSelect: noop, onContextMenu: noop, getVisibleLayerIds: () => [],
    displayPrefs: { showDimmed: true, showLockBadges: true, treeDensity: "compact", highlightCmsBound: false, showHtmlBadges: false },
  } as unknown as LayerTreeItemProps;
  const { container } = render(<LayerTreeItem {...props} />);
  return container.querySelector('[role="treeitem"]') as HTMLElement;
}

describe("Layers indent ladder — board 4418:81300", () => {
  it("puts every depth's chevron where the board puts it", () => {
    expect(BOARD_CHEVRON_X.map((_, d) => rowFor(d).style.paddingLeft)).toEqual(BOARD_CHEVRON_X.map((x) => `${x}px`));
  });

  it("gives every row the multi-select checkbox in its left gutter, unticked at rest", () => {
    const box = rowFor(0).querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(box).not.toBeNull();
    expect(box.checked).toBe(false);
  });
});
