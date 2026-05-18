import { describe, it, expect, vi } from "vitest";
import { HistoryManager } from "../HistoryManager";
import { EVENTS } from "../../shared/constants/events";

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

describe("HistoryManager redo bail on patch divergence (P0-9)", () => {
  it("rolls back the popped entry + returns false when applyPatch throws", () => {
    const mockComposer = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      exportProject: vi.fn(() => ({ pages: [{ id: "p1", elements: [] }], styles: [], assets: [] })),
      importProject: vi.fn(),
    } as any;

    const hm = new HistoryManager(mockComposer);
    // Seed a redo entry whose patch references a path that doesn't exist.
    // applyPatch should throw inside redo(), guard catches and bails.
    const badPatch = [{ op: "replace", path: "/pages/0/root/children/3/children/0/content", value: "X" }];
    (hm as any).redoStack = [
      {
        type: "patch",
        timestamp: Date.now(),
        patch: badPatch,
        reversePatch: [],
        label: "bad-redo",
      },
    ];
    (hm as any).currentStateCache = { pages: [{ id: "p1" }] };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ok = hm.redo();
    warnSpy.mockRestore();

    expect(ok).toBe(false);
    // Entry must be back on redo stack (no entry lost).
    expect((hm as any).redoStack.length).toBe(1);
    // importProject must NOT have been called (no broken state applied).
    expect(mockComposer.importProject).not.toHaveBeenCalled();
  });
});

describe("HistoryManager PROJECT_LOADED self-guard", () => {
  it("skips stack reset when PROJECT_LOADED fires from restoreSnapshot (undo/redo path)", () => {
    const listeners = new Map<string, ((data: unknown) => void)[]>();
    const mockComposer = {
      on: vi.fn((event: string, cb: (data: unknown) => void) => {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event)!.push(cb);
      }),
      off: vi.fn(),
      emit: vi.fn((event: string, data: unknown) => {
        listeners.get(event)?.forEach((cb) => cb(data));
      }),
      exportProject: vi.fn(() => ({ pages: [{ id: "p1" }], styles: [], assets: [] })),
      importProject: vi.fn(function (this: any, snapshot: any) {
        // Mirror Composer.importProject: emits PROJECT_LOADED with bare data.
        mockComposer.emit(EVENTS.PROJECT_LOADED, snapshot);
      }),
    } as any;

    const hm = new HistoryManager(mockComposer);
    // Seed: 1 checkpoint + 1 patch so canUndo()=true, and a redo entry waiting.
    const checkpointSnapshot = { pages: [{ id: "p1", elements: [] }] };
    (hm as any).undoStack = [
      { type: "checkpoint", timestamp: Date.now(), snapshot: checkpointSnapshot, label: "seed" },
      {
        type: "patch",
        timestamp: Date.now(),
        patch: [{ op: "add", path: "/a", value: "1" }],
        reversePatch: [{ op: "remove", path: "/a" }],
      },
    ];
    (hm as any).redoStack = [
      {
        type: "patch",
        timestamp: Date.now(),
        patch: [{ op: "add", path: "/b", value: "2" }],
        reversePatch: [{ op: "remove", path: "/b" }],
      },
    ];
    (hm as any).currentStateCache = { pages: [{ id: "p1" }] };

    // Trigger redo — restoreSnapshot fires importProject → PROJECT_LOADED.
    // Before the fix this re-entered the self-handler and wiped both stacks.
    hm.redo();

    // After redo, undoStack grows (entry moved over), redoStack drains.
    // CRITICAL: stacks must NOT be reset to [] + single "loaded" checkpoint
    // by the self-fire of PROJECT_LOADED during importProject.
    expect((hm as any).undoStack.length).toBeGreaterThan(1);
    expect((hm as any).redoStack.length).toBe(0);
    // Flag must reset post-restore so future external loads still reset history.
    expect((hm as any).isRestoringFromHistory).toBe(false);
  });
});
