/**
 * useBlockInsertion — smart-placement regression tests.
 *
 * Guards CAN-005: clicking Heading then Button must not nest the button inside
 * the h2. Auto-nest only triggers when the selection is a layout container.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import type { BlockData } from "../../../../shared/types";

// ─── Mocks (hoisted) ────────────────────────────────────────────────────────

const mockInsertBlock = vi.fn();

vi.mock("../../../../blocks/blockRegistry", () => ({
  insertBlock: (...args: unknown[]) => mockInsertBlock(...args),
  getBlockDefinitions: () => [
    { id: "button-block", elementType: "button" },
    { id: "heading-block", elementType: "heading" },
    { id: "icon-block", elementType: "icon" },
  ],
}));

vi.mock("../../../../shared/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("../../../../shared/utils/dragDrop/animations", () => ({
  animateDropSuccess: vi.fn(),
}));

// Import AFTER mocks so the hook wires them correctly.
// eslint-disable-next-line import/first
import { useBlockInsertion } from "../useBlockInsertion";

// ─── Fake composer helpers ──────────────────────────────────────────────────

type FakeEl = {
  id: string;
  type: string;
  children: FakeEl[];
  parent: FakeEl | null;
};

function makeEl(id: string, type: string, parent: FakeEl | null = null): FakeEl {
  return { id, type, children: [], parent };
}

function wrap(el: FakeEl) {
  return {
    getId: () => el.id,
    getType: () => el.type,
    getChildCount: () => el.children.length,
    getChildren: () => el.children.map(wrap),
    getParent: () => (el.parent ? wrap(el.parent) : null),
    getAttribute: () => null,
  };
}

function buildComposer(opts: { rootType?: string; selectedEl?: FakeEl | null } = {}) {
  const root = makeEl("root-1", opts.rootType ?? "container");
  const selected = opts.selectedEl ?? null;
  if (selected) {
    selected.parent = root;
    root.children.push(selected);
  }

  const store = new Map<string, FakeEl>([[root.id, root]]);
  if (selected) store.set(selected.id, selected);

  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    emit: vi.fn(),
    elements: {
      getActivePage: () => ({ root: { id: root.id } }),
      getElement: (id: string) => {
        const el = store.get(id);
        return el ? wrap(el) : undefined;
      },
    },
    selection: {
      getSelectedIds: () => (selected ? [selected.id] : []),
      select: vi.fn(),
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockInsertBlock.mockReset();
  mockInsertBlock.mockReturnValue("new-el-id");
});

describe("useBlockInsertion — smart placement (CAN-005 regression)", () => {
  it("inserts as sibling of a selected heading, NOT nested inside it", () => {
    const heading = makeEl("h-1", "heading");
    const composer = buildComposer({ selectedEl: heading });

    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useBlockInsertion(composer as any)
    );

    act(() => {
      result.current.handleBlockClick({
        id: "button-block",
        label: "Button",
      } as BlockData);
    });

    expect(mockInsertBlock).toHaveBeenCalledTimes(1);
    const [, , parentId] = mockInsertBlock.mock.calls[0];
    expect(parentId).toBe("root-1");
    expect(parentId).not.toBe("h-1");
  });

  it("inserts as sibling of a selected button (leaf, non-container)", () => {
    const button = makeEl("b-1", "button");
    const composer = buildComposer({ selectedEl: button });

    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useBlockInsertion(composer as any)
    );

    act(() => {
      result.current.handleBlockClick({
        id: "icon-block",
        label: "Icon",
      } as BlockData);
    });

    const [, , parentId] = mockInsertBlock.mock.calls[0];
    expect(parentId).toBe("root-1");
    expect(parentId).not.toBe("b-1");
  });

  it("DOES nest inside a selected container (flex)", () => {
    const flex = makeEl("f-1", "flex");
    const composer = buildComposer({ selectedEl: flex });

    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useBlockInsertion(composer as any)
    );

    act(() => {
      result.current.handleBlockClick({
        id: "button-block",
        label: "Button",
      } as BlockData);
    });

    const [, , parentId] = mockInsertBlock.mock.calls[0];
    expect(parentId).toBe("f-1");
  });

  it("inserts into root when nothing is selected", () => {
    const composer = buildComposer({ selectedEl: null });

    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useBlockInsertion(composer as any)
    );

    act(() => {
      result.current.handleBlockClick({
        id: "heading-block",
        label: "Heading",
      } as BlockData);
    });

    const [, , parentId] = mockInsertBlock.mock.calls[0];
    expect(parentId).toBe("root-1");
  });
});
