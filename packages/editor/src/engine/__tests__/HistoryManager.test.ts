import { describe, it, expect, vi } from "vitest";
import { HistoryManager } from "../HistoryManager";

describe("HistoryManager reconstructState", () => {
  it("returns last snapshot when no checkpoint exists", () => {
    const mockComposer = {
      on: vi.fn(),
      emit: vi.fn(),
      exportProject: vi.fn(() => ({ pages: [], styles: [], assets: [] })),
      importProject: vi.fn(),
    } as any;

    const hm = new HistoryManager(mockComposer);
    // Replace undoStack with only patch entries (no checkpoints)
    (hm as any).undoStack = [
      {
        type: "patch",
        timestamp: Date.now(),
        patch: [{ op: "add", path: "/a", value: "1" }],
        reversePatch: [],
      },
    ];
    (hm as any).currentStateCache = null;

    const state = (hm as any).reconstructState(0);
    expect(state).toBeDefined();
  });
});
