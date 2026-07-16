// @vitest-environment jsdom
/**
 * useComponentsState — hook-level tests.
 * Covers: initial load + refresh on COMPONENT_LIST_UPDATED, canvas selection
 * sync, rename dialog machine, duplicate, delete confirm machine,
 * insert/instantiate (selection → active-page-root fallback), error paths.
 * Component-level tests (ComponentsTab, ComponentRow, modals) live in the
 * sibling files — this file tests only the hook.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import {
  createMockComposer,
  type MockComponentDef,
} from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { useComponentsState } from "../useComponentsState";

const asMock = (fn: unknown): Mock => fn as Mock;

const FIXTURES: MockComponentDef[] = [
  { id: "c1", name: "Hero Section", category: "Sections", tags: ["hero"] },
  { id: "c2", name: "Primary Button", category: "UI", tags: ["button"] },
];

function setup(opts: Parameters<typeof createMockComposer>[0] = {}) {
  const composer = createMockComposer({
    components: FIXTURES.map((c) => ({ ...c })),
    ...opts,
  });
  const view = renderHook(() => useComponentsState({ composer }));
  return { composer, ...view };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useComponentsState — initial load + refresh", () => {
  it("loads components via composer.components.getAllComponents on mount", () => {
    const { composer, result } = setup();

    expect(asMock(composer.components.getAllComponents)).toHaveBeenCalled();
    expect(result.current.components.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("refreshes the list when EVENTS.COMPONENT_LIST_UPDATED fires", () => {
    const { composer, result } = setup();

    asMock(composer.components.getAllComponents).mockReturnValue([
      ...FIXTURES.map((c) => ({ ...c })),
      { id: "c3", name: "Footer", category: "Sections" },
    ]);
    act(() => {
      composer._emit(EVENTS.COMPONENT_LIST_UPDATED, { componentId: "c3" });
    });

    expect(result.current.components.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
  });

  it("surfaces the error message (without crashing) when getAllComponents throws", () => {
    const composer = createMockComposer({ components: [] });
    asMock(composer.components.getAllComponents).mockImplementation(() => {
      throw new Error("registry unavailable");
    });

    const { result } = renderHook(() => useComponentsState({ composer }));

    expect(result.current.error).toBe("registry unavailable");
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.components).toEqual([]);
  });

  it("unsubscribes from COMPONENT_LIST_UPDATED on unmount", () => {
    const { composer, unmount } = setup();

    unmount();

    expect(asMock(composer.off)).toHaveBeenCalledWith(
      EVENTS.COMPONENT_LIST_UPDATED,
      expect.any(Function)
    );
    const callsBefore = asMock(composer.components.getAllComponents).mock.calls.length;
    composer._emit(EVENTS.COMPONENT_LIST_UPDATED);
    expect(asMock(composer.components.getAllComponents).mock.calls.length).toBe(callsBefore);
  });
});

describe("useComponentsState — canvas selection sync", () => {
  it("seeds canvasSelection from composer.selection on mount", () => {
    const { result } = setup({ selectedIds: ["el-9"] });

    expect(result.current.canvasSelection).toEqual(["el-9"]);
    expect(result.current.canCreateComponent).toBe(true);
  });

  it("updates canvasSelection (and canCreateComponent) on element:selected", () => {
    const { composer, result } = setup({ selectedIds: [] });
    expect(result.current.canvasSelection).toEqual([]);
    expect(result.current.canCreateComponent).toBe(false);

    asMock(composer.selection.getSelectedIds).mockReturnValue(["el-1"]);
    act(() => {
      composer._emit("element:selected");
    });

    expect(result.current.canvasSelection).toEqual(["el-1"]);
    expect(result.current.canCreateComponent).toBe(true);
  });

  it("resyncs on every selection:* event it subscribes to", () => {
    const { composer, result } = setup({ selectedIds: [] });
    const events = [
      "selection:added",
      "selection:removed",
      "selection:cleared",
      "selection:multiple",
    ];

    events.forEach((event, i) => {
      const ids = [`el-${i}a`, `el-${i}b`];
      asMock(composer.selection.getSelectedIds).mockReturnValue(ids);
      act(() => {
        composer._emit(event);
      });
      expect(result.current.canvasSelection).toEqual(ids);
    });
  });

  it("removes all five selection listeners on unmount", () => {
    const { composer, unmount } = setup();

    unmount();

    for (const event of [
      "element:selected",
      "selection:added",
      "selection:removed",
      "selection:cleared",
      "selection:multiple",
    ]) {
      expect(asMock(composer.off)).toHaveBeenCalledWith(event, expect.any(Function));
    }
  });
});

describe("useComponentsState — rename dialog machine", () => {
  it("handleRename opens the dialog with the component's current name", () => {
    const { result } = setup();

    act(() => {
      result.current.handleRename("c1");
    });

    expect(result.current.renameTarget).toEqual({ id: "c1", currentName: "Hero Section" });
  });

  it("handleRename is a no-op for an unknown component id", () => {
    const { result } = setup();

    act(() => {
      result.current.handleRename("ghost");
    });

    expect(result.current.renameTarget).toBeNull();
  });

  it("confirmRename commits the trimmed name via updateComponent and closes", async () => {
    const { composer, result } = setup();

    act(() => {
      result.current.handleRename("c1");
    });
    await act(async () => {
      await result.current.confirmRename("  New Hero  ");
    });

    expect(asMock(composer.components.updateComponent)).toHaveBeenCalledWith("c1", {
      name: "New Hero",
    });
    expect(result.current.renameTarget).toBeNull();
    expect(result.current.pendingToast).toEqual({
      message: "Component renamed",
      variant: "success",
    });
  });

  it("cancel path (setRenameTarget(null)) closes without calling updateComponent", () => {
    const { composer, result } = setup();

    act(() => {
      result.current.handleRename("c1");
    });
    act(() => {
      result.current.setRenameTarget(null);
    });

    expect(result.current.renameTarget).toBeNull();
    expect(asMock(composer.components.updateComponent)).not.toHaveBeenCalled();
  });

  it("confirmRename with the unchanged name skips updateComponent but closes", async () => {
    const { composer, result } = setup();

    act(() => {
      result.current.handleRename("c1");
    });
    await act(async () => {
      await result.current.confirmRename("Hero Section");
    });

    expect(asMock(composer.components.updateComponent)).not.toHaveBeenCalled();
    expect(result.current.renameTarget).toBeNull();
  });

  it("confirmRename with a whitespace-only name skips updateComponent but closes", async () => {
    const { composer, result } = setup();

    act(() => {
      result.current.handleRename("c1");
    });
    await act(async () => {
      await result.current.confirmRename("   ");
    });

    expect(asMock(composer.components.updateComponent)).not.toHaveBeenCalled();
    expect(result.current.renameTarget).toBeNull();
  });

  it("surfaces an error toast when updateComponent rejects (dialog still closes)", async () => {
    const { composer, result } = setup();
    asMock(composer.components.updateComponent).mockRejectedValueOnce(new Error("nope"));

    act(() => {
      result.current.handleRename("c1");
    });
    await act(async () => {
      await result.current.confirmRename("Fresh Name");
    });

    expect(result.current.pendingToast).toEqual({
      message: "Couldn't rename component.",
      variant: "error",
    });
    expect(result.current.renameTarget).toBeNull();
  });
});

describe("useComponentsState — duplicate", () => {
  it("handleDuplicate calls duplicateComponent and toasts success", async () => {
    const { composer, result } = setup();

    await act(async () => {
      await result.current.handleDuplicate("c1");
    });

    expect(asMock(composer.components.duplicateComponent)).toHaveBeenCalledWith("c1");
    expect(result.current.pendingToast).toEqual({
      message: "Component duplicated",
      variant: "success",
    });
  });

  it("surfaces an error toast when duplicateComponent rejects", async () => {
    const { composer, result } = setup();
    asMock(composer.components.duplicateComponent).mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      await result.current.handleDuplicate("c1");
    });

    expect(result.current.pendingToast).toEqual({
      message: "Couldn't duplicate component.",
      variant: "error",
    });
  });
});

describe("useComponentsState — delete confirm machine", () => {
  it("handleDelete opens the confirm state with the component's name", () => {
    const { result } = setup();

    act(() => {
      result.current.handleDelete("c1");
    });

    expect(result.current.confirmDelete).toEqual({ id: "c1", name: "Hero Section" });
  });

  it("handleDelete is a no-op for an unknown component id", () => {
    const { result } = setup();

    act(() => {
      result.current.handleDelete("ghost");
    });

    expect(result.current.confirmDelete).toBeNull();
  });

  it("confirmDeleteAction calls deleteComponent, clears selection and confirm state", async () => {
    const { composer, result } = setup();

    act(() => {
      result.current.setSelectedId("c1");
    });
    act(() => {
      result.current.handleDelete("c1");
    });
    await act(async () => {
      await result.current.confirmDeleteAction();
    });

    expect(asMock(composer.components.deleteComponent)).toHaveBeenCalledWith("c1");
    expect(result.current.confirmDelete).toBeNull();
    expect(result.current.selectedId).toBeNull();
  });

  it("cancel path (setConfirmDelete(null)) closes without calling deleteComponent", () => {
    const { composer, result } = setup();

    act(() => {
      result.current.handleDelete("c1");
    });
    act(() => {
      result.current.setConfirmDelete(null);
    });

    expect(result.current.confirmDelete).toBeNull();
    expect(asMock(composer.components.deleteComponent)).not.toHaveBeenCalled();
  });

  it("surfaces an error toast when deleteComponent rejects (confirm state clears)", async () => {
    const { composer, result } = setup();
    asMock(composer.components.deleteComponent).mockRejectedValueOnce(new Error("locked"));

    act(() => {
      result.current.handleDelete("c1");
    });
    await act(async () => {
      await result.current.confirmDeleteAction();
    });

    expect(result.current.pendingToast).toEqual({
      message: "Couldn't delete component.",
      variant: "error",
    });
    expect(result.current.confirmDelete).toBeNull();
  });

  it("KNOWN (pin): favorites orphan — deleting a component leaves its id in favorites", async () => {
    // KNOWN (pin): confirmDeleteAction never prunes the deleted id from the
    // favorites list (or its localStorage mirror), so favorites accumulates
    // orphaned ids of deleted components. Pinning current behavior, not fixing.
    const { result } = setup();

    act(() => {
      result.current.toggleFavorite("c1");
    });
    expect(result.current.favorites).toContain("c1");

    act(() => {
      result.current.handleDelete("c1");
    });
    await act(async () => {
      await result.current.confirmDeleteAction();
    });

    expect(result.current.favorites).toContain("c1");
  });
});

describe("useComponentsState — insert / instantiate", () => {
  it("instantiates into the first selected canvas element", async () => {
    const { composer, result } = setup({ selectedIds: ["el-1", "el-2"] });

    await act(async () => {
      await result.current.handleInstantiate("c2");
    });

    expect(asMock(composer.components.instantiateComponent)).toHaveBeenCalledWith("c2", "el-1");
    expect(result.current.pendingToast).toEqual({
      message: "Component added to canvas",
      variant: "success",
    });
  });

  it("falls back to the active page root when nothing is selected", async () => {
    const { composer, result } = setup({ selectedIds: [] });
    asMock(composer.elements.getActivePage).mockReturnValue({
      id: "p1",
      name: "Home",
      root: { id: "root-1" },
    });

    await act(async () => {
      await result.current.handleInstantiate("c2");
    });

    expect(asMock(composer.components.instantiateComponent)).toHaveBeenCalledWith("c2", "root-1");
  });

  it("warns (and does not instantiate) when there is no selection and no page root", async () => {
    // Default mock has no pages → getActivePage() returns null.
    const { composer, result } = setup({ selectedIds: [] });

    await act(async () => {
      await result.current.handleInstantiate("c2");
    });

    expect(asMock(composer.components.instantiateComponent)).not.toHaveBeenCalled();
    expect(result.current.pendingToast).toEqual({
      message: "Open a page first to add this component.",
      variant: "warning",
    });
  });

  it("surfaces an error toast when instantiateComponent rejects", async () => {
    const { composer, result } = setup({ selectedIds: ["el-1"] });
    asMock(composer.components.instantiateComponent).mockRejectedValueOnce(new Error("fail"));

    await act(async () => {
      await result.current.handleInstantiate("c2");
    });

    expect(result.current.pendingToast).toEqual({
      message: "Couldn't add component. Try again.",
      variant: "error",
    });
  });
});
