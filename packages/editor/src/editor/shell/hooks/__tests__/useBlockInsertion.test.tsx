/**
 * useBlockInsertion — sidebar block insertion: spam guard, smart-parent
 * walk-up resolution, nesting-error toast, needs-asset two-step emit.
 *
 * blockRegistry / nesting / toast / drop-animation boundaries are mocked so
 * the placement decision logic is isolated.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { useBlockInsertion } from "../useBlockInsertion";

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  getBlockDefinitions: vi.fn(),
  insertBlock: vi.fn(),
  canNestElement: vi.fn(),
  getSuggestedParents: vi.fn(() => [] as string[]),
  animateDropSuccess: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  ...{
  useToast: () => ({ addToast: mocks.addToast }),
},
}));

vi.mock("@/blocks/blockRegistry", () => ({
  getBlockDefinitions: mocks.getBlockDefinitions,
  insertBlock: mocks.insertBlock,
}));

vi.mock("@/shared/utils/nesting", () => ({
  canNestElement: mocks.canNestElement,
  getSuggestedParents: mocks.getSuggestedParents,
}));

vi.mock("@/shared/utils/dragDrop/animations", () => ({
  animateDropSuccess: mocks.animateDropSuccess,
}));

type MockElement = {
  getId: () => string;
  getType: () => string;
  getChildCount: () => number;
  getChildren: () => Array<{ getId: () => string }>;
  getParent: () => MockElement | null;
  getAttribute: (name: string) => string | null;
};

function makeElement(
  id: string,
  type: string,
  opts: Partial<Omit<MockElement, "getId" | "getType">> = {}
): MockElement {
  return {
    getId: () => id,
    getType: () => type,
    getChildCount: () => 0,
    getChildren: () => [],
    getParent: () => null,
    getAttribute: () => null,
    ...opts,
  };
}

const heroBlock: BlockData = { id: "hero", label: "Hero" } as unknown as BlockData;

describe("useBlockInsertion", () => {
  let elements: Map<string, MockElement>;
  let selectedIds: string[];
  let composer: {
    beginTransaction: ReturnType<typeof vi.fn>;
    endTransaction: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    elements: { getActivePage: ReturnType<typeof vi.fn>; getElement: ReturnType<typeof vi.fn> };
    selection: { getSelectedIds: ReturnType<typeof vi.fn>; select: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    elements = new Map();
    elements.set("root-1", makeElement("root-1", "root", { getChildCount: () => 3 }));
    selectedIds = [];

    composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      emit: vi.fn(),
      elements: {
        getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
        getElement: vi.fn((id: string) => elements.get(id) ?? null),
      },
      selection: {
        getSelectedIds: vi.fn(() => selectedIds),
        select: vi.fn(),
      },
    };

    mocks.getBlockDefinitions.mockReturnValue([
      { id: "hero", label: "Hero", elementType: "section" },
      { id: "image", label: "Image", elementType: "image" },
    ]);
    mocks.insertBlock.mockReturnValue("new-1");
    mocks.canNestElement.mockReturnValue(true);
    mocks.getSuggestedParents.mockReturnValue([]);
    elements.set("new-1", makeElement("new-1", "section"));
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function mountHook(withComposer = true) {
    return renderHook(() =>
      useBlockInsertion(withComposer ? (composer as unknown as Composer) : null)
    );
  }

  it("warns and bails when the composer is not ready", () => {
    const { result } = mountHook(false);
    act(() => result.current.handleBlockClick(heroBlock));
    expect(mocks.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", description: expect.stringContaining("not ready") })
    );
    expect(mocks.insertBlock).not.toHaveBeenCalled();
  });

  it("inserts at the page root end when nothing is selected", () => {
    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    expect(composer.beginTransaction).toHaveBeenCalledWith("insert-block-sidebar");
    expect(mocks.insertBlock).toHaveBeenCalledWith(
      composer,
      expect.objectContaining({ id: "hero" }),
      "root-1",
      3 // root child count
    );
    expect(composer.selection.select).toHaveBeenCalledWith(elements.get("new-1"));
    expect(mocks.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success", description: "Inserted: Hero" })
    );
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("inserts INSIDE the selected element when it accepts the block type", () => {
    elements.set(
      "sel-1",
      makeElement("sel-1", "container", { getChildCount: () => 2 })
    );
    selectedIds = ["sel-1"];
    mocks.canNestElement.mockImplementation(
      (_child: string, parentType: string) => parentType === "container"
    );

    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    expect(mocks.insertBlock).toHaveBeenCalledWith(
      composer,
      expect.anything(),
      "sel-1",
      2 // end of selected's children
    );
  });

  it("walks UP to the nearest accepting ancestor and inserts as sibling after the selection path", () => {
    const parent = makeElement("par-1", "container", {
      getChildren: () => [{ getId: () => "other" }, { getId: () => "sel-1" }],
      getChildCount: () => 2,
    });
    elements.set("par-1", parent);
    elements.set(
      "sel-1",
      makeElement("sel-1", "text", { getParent: () => parent })
    );
    selectedIds = ["sel-1"];
    // text cannot contain a section; container can
    mocks.canNestElement.mockImplementation(
      (_child: string, parentType: string) => parentType === "container"
    );

    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    // sel-1 is at index 1 inside par-1 → insert as its next sibling (index 2)
    expect(mocks.insertBlock).toHaveBeenCalledWith(composer, expect.anything(), "par-1", 2);
  });

  it("falls back to the page root when no ancestor accepts the block", () => {
    elements.set("sel-1", makeElement("sel-1", "text"));
    selectedIds = ["sel-1"];
    mocks.canNestElement.mockReturnValue(false);

    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    expect(mocks.insertBlock).toHaveBeenCalledWith(composer, expect.anything(), "root-1", 3);
  });

  it("shows a contextual nesting-error toast with suggested parents when insertion is rejected", () => {
    mocks.insertBlock.mockReturnValue(undefined);
    mocks.getSuggestedParents.mockReturnValue(["section", "container", "grid"]);

    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    expect(mocks.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "warning",
        duration: 5000,
        description: expect.stringContaining("Can't add Hero"),
      })
    );
    const msg = mocks.addToast.mock.calls.at(-1)?.[0].description as string;
    expect(msg).toContain("doesn't allow it");
    // Only the first two suggestions are surfaced
    expect(msg).toContain("Try selecting a section or container first.");
    expect(msg).not.toContain("grid");
  });

  it("emits the two-step needs-asset flow for media blocks without a src", () => {
    elements.set("new-img", makeElement("new-img", "image", { getAttribute: () => null }));
    mocks.insertBlock.mockReturnValue("new-img");

    const { result } = mountHook();
    act(() =>
      result.current.handleBlockClick({ id: "image", label: "Image" } as unknown as BlockData)
    );

    // Step 1 — synchronous tab switch so the Media tab mounts its listener
    expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "assets" });
    expect(composer.emit).not.toHaveBeenCalledWith("element:needs-asset", expect.anything());

    // Step 2 — needs-asset fires after the 100ms mount grace period
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(composer.emit).toHaveBeenCalledWith("element:needs-asset", {
      elementId: "new-img",
      type: "image",
    });
  });

  it("does NOT emit needs-asset for media blocks that already carry a src", () => {
    elements.set(
      "new-img",
      makeElement("new-img", "image", { getAttribute: () => "https://x/img.png" })
    );
    mocks.insertBlock.mockReturnValue("new-img");

    const { result } = mountHook();
    act(() =>
      result.current.handleBlockClick({ id: "image", label: "Image" } as unknown as BlockData)
    );
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(composer.emit).not.toHaveBeenCalledWith("element:needs-asset", expect.anything());
  });

  it("guards against spam clicks until the 150ms re-enable window elapses", () => {
    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));
    expect(result.current.isInsertingBlock).toBe(true);

    // Second click during the guard window is swallowed
    act(() => result.current.handleBlockClick(heroBlock));
    expect(mocks.insertBlock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.isInsertingBlock).toBe(false);

    act(() => result.current.handleBlockClick(heroBlock));
    expect(mocks.insertBlock).toHaveBeenCalledTimes(2);
  });

  it("shows an error toast when the block id is missing from the registry", () => {
    const { result } = mountHook();
    act(() =>
      result.current.handleBlockClick({ id: "ghost", label: "Ghost" } as unknown as BlockData)
    );
    expect(mocks.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "error", description: expect.stringContaining("not found") })
    );
    expect(mocks.insertBlock).not.toHaveBeenCalled();
    // Transaction still closed via finally
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("surfaces insertBlock exceptions as an error toast and still closes the transaction", () => {
    mocks.insertBlock.mockImplementation(() => {
      throw new Error("boom");
    });
    const { result } = mountHook();
    act(() => result.current.handleBlockClick(heroBlock));

    expect(mocks.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "error",
        description: expect.stringContaining("boom"),
      })
    );
    expect(composer.endTransaction).toHaveBeenCalled();
  });
});
