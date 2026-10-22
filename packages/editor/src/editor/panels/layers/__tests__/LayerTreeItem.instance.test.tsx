/**
 * REA 2026-10-20 #19 (R3 W11, C10): a component instance read "Card ◇" in
 * Layers — the element type, not the component — and nothing told its
 * children apart from ordinary layers. Panel 04 §7 (N1): the ◇ tooltip reads
 * "Instance of {main component}". The instance row now carries the component
 * name, and every row inside it is marked as part of that instance.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LayerTreeItem, type LayerTreeItemProps } from "../LayerTreeItem";
import type { LayerItem } from "../types";

const noop = () => {};

/* card (instance root) › heading, inner › text — `plain` is outside it. */
const parents: Record<string, string | null> = { card: null, heading: "card", inner: "card", text: "inner", plain: null };
const fakeComposer = {
  components: {
    isInstance: (id: string) => id === "card",
    findInstanceContainingElement: (id: string) => {
      for (let cur: string | null = id; cur; cur = parents[cur] ?? null) {
        if (cur === "card") return { elementId: "card", componentId: "c1", isDetached: false };
      }
      return null;
    },
    getComponent: (id: string) => (id === "c1" ? { id: "c1", name: "Audit Card" } : undefined),
  },
  cms: { bindings: { getBindings: () => [], hasCollectionBinding: () => false } },
};

const leaf = (id: string, type: string, depth: number, children: LayerItem[] = []): LayerItem => ({
  id, type, tagName: "div", depth, children,
});

function renderTree(layer: LayerItem, extra: Partial<LayerTreeItemProps> = {}) {
  const props = {
    layer,
    composer: fakeComposer,
    expandedIds: new Set<string>(["card", "inner"]),
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
    ...extra,
  } as unknown as LayerTreeItemProps;
  return render(<LayerTreeItem {...props} />);
}

const card = () =>
  leaf("card", "container", 0, [leaf("heading", "heading", 1), leaf("inner", "container", 1, [leaf("text", "text", 2)])]);

describe("Layers · component instances", () => {
  it("the instance row is named for its component, not its element type", () => {
    renderTree(card());
    expect(screen.getByTestId("layer-name-card")).toHaveTextContent("Audit Card");
    const badge = screen.getByTestId("layer-instance-badge-card");
    expect(badge).toHaveAttribute("title", "Instance of Audit Card");
    expect(screen.getByTestId("layer-row-card").getAttribute("aria-label")).toMatch(/instance of Audit Card/);
  });

  it("a rename still wins over the component name", () => {
    renderTree(card(), { customNames: new Map([["card", "Pricing card"]]) });
    expect(screen.getByTestId("layer-name-card")).toHaveTextContent("Pricing card");
  });

  it("shows the instance's children — at every depth — marked as part of it", () => {
    renderTree(card());
    for (const id of ["heading", "inner", "text"]) {
      const row = screen.getByTestId(`layer-row-${id}`);
      expect(row).toHaveAttribute("data-instance-part", "true");
      expect(row.getAttribute("aria-label")).toMatch(/part of Audit Card/);
    }
    /* The root is the instance, not a part of one. */
    expect(screen.getByTestId("layer-row-card")).not.toHaveAttribute("data-instance-part");
  });

  it("a child row selects that child — the engine's instance rules decide what it may do", () => {
    const onSelect = vi.fn();
    renderTree(card(), { onSelect });
    fireEvent.click(screen.getByTestId("layer-row-text"));
    expect(onSelect).toHaveBeenCalledWith("text", { shift: false, meta: false });
  });

  it("an ordinary layer carries no instance marking", () => {
    renderTree(leaf("plain", "container", 0));
    const row = screen.getByTestId("layer-row-plain");
    expect(row).not.toHaveAttribute("data-instance-part");
    expect(row.getAttribute("aria-label")).not.toMatch(/instance/);
  });
});
