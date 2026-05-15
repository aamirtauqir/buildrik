/**
 * useCanvasContextMenu — T12 "Save as component" entry coverage.
 *
 * The hook itself just delegates to `getContextMenuActions` (registry-based);
 * the entry lives in `standaloneActions.ts`. These tests run through the hook
 * with a mock composer so we exercise the full freeze-on-open flow and assert
 * on the menu shape the renderer (`ElementContextMenu`) sees.
 *
 * @license BSD-3-Clause
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Composer } from "../../../../engine";
import type { Element } from "../../../../engine/elements/Element";
import { EVENTS } from "../../../../shared/constants/events";
import type { ContextAction } from "../../menus";
import { useCanvasContextMenu } from "../useCanvasContextMenu";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function buildMockElement(
  id: string,
  styles: Record<string, string> = {},
): Element {
  return {
    getId: () => id,
    getType: () => "div",
    getStyles: () => ({ ...styles }),
    getParent: () => ({ getId: () => "root" } as unknown as Element),
    getChildren: () => [],
    isLocked: () => false,
    isContainer: () => false,
    canHaveChildren: () => false,
    canBeWrapped: () => false,
    canBeUnwrapped: () => false,
    getData: () => ({}),
  } as unknown as Element;
}

interface MockComposerOptions {
  selectedIds?: string[];
  elements?: Element[];
  resolveResult?: Map<string, string>;
}

function buildMockComposer(opts: MockComposerOptions = {}): Composer {
  const allElements = opts.elements ?? [];
  const byId = new Map(allElements.map((el) => [el.getId(), el]));
  return {
    emit: vi.fn(),
    selection: {
      getSelectedIds: () => opts.selectedIds ?? [],
    },
    elements: {
      // SelectionManager-style root lookup for the hook's freeze step.
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: (id: string) => byId.get(id) ?? null,
      getAllElements: () => allElements,
    },
    designSystem: {
      tokenBindingResolver: {
        resolveForElements: vi.fn(() => opts.resolveResult ?? new Map()),
      },
    },
  } as unknown as Composer;
}

/** Collect every label across top-level + nested submenus. */
function collectLabels(actions: ContextAction[]): string[] {
  const out: string[] = [];
  for (const a of actions) {
    out.push(a.label);
    if (a.submenu) out.push(...collectLabels(a.submenu));
  }
  return out;
}

function findAction(
  actions: ContextAction[],
  label: string,
): ContextAction | undefined {
  for (const a of actions) {
    if (a.label === label) return a;
    if (a.submenu) {
      const nested = findAction(a.submenu, label);
      if (nested) return nested;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCanvasContextMenu — Save as component (T12)", () => {
  it("includes a 'Save as component' entry for a non-root element", () => {
    const el = buildMockElement("el-1");
    const composer = buildMockComposer({
      selectedIds: ["el-1"],
      elements: [el],
    });

    const onAIRequest = vi.fn();
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      useCanvasContextMenu({ composer, onAIRequest, addToast }),
    );

    // The hook freezes menu data when contextMenu state is set.
    act(() => {
      result.current.setContextMenu({ x: 0, y: 0, elementId: "el-1" });
    });

    const labels = collectLabels(result.current.menuData?.actions ?? []);
    expect(labels).toContain("Save as component");
  });

  it("'Save as component' handler emits COMPONENT_SAVE_AS_REQUESTED with selectionIds + extractedBindings", () => {
    const el = buildMockElement("el-1", {
      color: "{{token.color.brand.primary}}",
    });
    const bindings = new Map([["el-1:color", "color.brand.primary"]]);
    const composer = buildMockComposer({
      selectedIds: ["el-1"],
      elements: [el],
      resolveResult: bindings,
    });

    const onAIRequest = vi.fn();
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      useCanvasContextMenu({ composer, onAIRequest, addToast }),
    );

    act(() => {
      result.current.setContextMenu({ x: 0, y: 0, elementId: "el-1" });
    });

    const action = findAction(
      result.current.menuData?.actions ?? [],
      "Save as component",
    );
    expect(action).toBeDefined();

    action!.handler!(result.current.menuData!.context);

    const emit = composer.emit as unknown as ReturnType<typeof vi.fn>;
    expect(emit).toHaveBeenCalledWith(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
      selectionIds: ["el-1"],
      extractedBindings: bindings,
    });
  });

  it("falls back to the right-clicked element id when selection is empty", () => {
    const el = buildMockElement("el-1");
    const composer = buildMockComposer({
      selectedIds: [],
      elements: [el],
    });

    const onAIRequest = vi.fn();
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      useCanvasContextMenu({ composer, onAIRequest, addToast }),
    );

    act(() => {
      result.current.setContextMenu({ x: 0, y: 0, elementId: "el-1" });
    });

    const action = findAction(
      result.current.menuData?.actions ?? [],
      "Save as component",
    );
    expect(action).toBeDefined();

    action!.handler!(result.current.menuData!.context);

    const emit = composer.emit as unknown as ReturnType<typeof vi.fn>;
    expect(emit).toHaveBeenCalledWith(
      EVENTS.COMPONENT_SAVE_AS_REQUESTED,
      expect.objectContaining({ selectionIds: ["el-1"] }),
    );
  });
});
