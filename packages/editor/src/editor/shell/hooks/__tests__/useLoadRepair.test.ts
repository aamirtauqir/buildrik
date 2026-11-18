/**
 * useLoadRepair (E-T9, DR-T5, DR-T1): runs once per load, after any restore
 * choice; repairs only behind the kill switch, a writable editor and a saved
 * "Before automatic repair" version; one Undo; Fix / Keep as written.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ProjectData } from "@shared/types";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

const sync = vi.hoisted(() => ({ repairOn: true }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ isLoadRepairEnabled: () => sync.repairOn }));
const tracked = vi.hoisted(() => [] as Array<[string, unknown]>);
vi.mock("@/shared/utils/errorTracking", () => ({ trackEvent: (n: string, d: unknown) => tracked.push([n, d]) }));

import { useLoadRepair, BEFORE_REPAIR_VERSION } from "../useLoadRepair";
import { markUnsavedOffScreen, takeOffScreenUnsaved } from "@/services/unsavedRecovery";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const project = (): ProjectData =>
  ({
    pages: [
      {
        id: "p1",
        name: "Home",
        slug: "",
        root: {
          id: "root",
          type: "container",
          tagName: "div",
          children: [
            { id: "nan", type: "container", tagName: "div", styles: { width: "NaNpx" }, children: [] },
            { id: "esc", type: "heading", tagName: "h2", content: "Tom &amp;amp; Jerry", children: [] },
          ],
        },
      },
    ],
  }) as unknown as ProjectData;

let c: Composer;
let toasts: Array<{ title?: string; action?: { onClick: () => void }; secondaryAction?: { onClick: () => void } }>;
const addToast = (t: (typeof toasts)[number]) => {
  toasts.push(t);
  return "t";
};
const load = async () => {
  await act(async () => {
    c.importProject(project());
    await new Promise((r) => setTimeout(r, 10));
  });
};

beforeEach(() => {
  c = createTestComposer();
  c.versions.createVersion = vi.fn(() => Promise.resolve({} as never));
  toasts = [];
  tracked.length = 0;
  sync.repairOn = true;
  localStorage.clear();
});
afterEach(() => takeOffScreenUnsaved("s1"));

const hook = (readOnly = false) =>
  renderHook(() => useLoadRepair({ composer: c, siteId: "s1", addToast: addToast as never, readOnly }));

describe("useLoadRepair", () => {
  it("snapshots, repairs in one step, says so with Undo, and lists the escaped text", async () => {
    const { result } = hook();
    await load();
    await waitFor(() => expect(toasts).toHaveLength(1));
    expect(c.versions.createVersion).toHaveBeenCalledWith(BEFORE_REPAIR_VERSION, expect.any(String), expect.anything());
    expect(c.elements.getElement("nan")!.getStyles().width).toBeUndefined();
    expect(toasts[0].title).toBe("Fixed 1 broken size");
    expect(tracked).toContainEqual(["repair.applied", { nonFiniteSize: 1 }]);
    expect(result.current.issues.map((i) => [i.id, i.damage])).toEqual([
      ["damage:esc", { kind: "escaped-text", before: "Tom &amp; Jerry", after: "Tom & Jerry" }],
    ]);

    act(() => toasts[0].action!.onClick());
    expect(c.elements.getElement("nan")!.getStyles().width).toBe("NaNpx");
    expect(tracked).toContainEqual(["repair.undone", { nonFiniteSize: 1 }]);
  });

  it("the kill switch stops repairs; possible damage still lists", async () => {
    sync.repairOn = false;
    const { result } = hook();
    await load();
    await waitFor(() => expect(result.current.issues).toHaveLength(1));
    expect(c.elements.getElement("nan")!.getStyles().width).toBe("NaNpx");
    expect(c.versions.createVersion).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it("no snapshot, no repair", async () => {
    c.versions.createVersion = vi.fn(() => Promise.reject(new Error("idb")));
    hook();
    await load();
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(c.elements.getElement("nan")!.getStyles().width).toBe("NaNpx");
    expect(toasts).toHaveLength(0);
  });

  it("view mode lists but never repairs", async () => {
    const { result } = hook(true);
    await load();
    await waitFor(() => expect(result.current.issues).toHaveLength(1));
    expect(c.elements.getElement("nan")!.getStyles().width).toBe("NaNpx");
    expect(result.current.fix(result.current.issues[0])).toBe(false);
  });

  /* Decision 1: the restore dialog first, then the scan. */
  it("waits for a pending restore choice before scanning", async () => {
    localStorage.setItem("bk-unsaved-v1-s1", JSON.stringify({ project: project(), at: "2026-10-15T00:00:00Z", base: null }));
    markUnsavedOffScreen("s1");
    const { result } = hook();
    await load();
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(toasts).toHaveLength(0);
    expect(result.current.issues).toHaveLength(0);
    act(() => void takeOffScreenUnsaved("s1"));
    await waitFor(() => expect(toasts).toHaveLength(1));
  });

  it("Fix writes the decoded text; Keep as written leaves it and remembers", async () => {
    const { result, unmount } = hook();
    await load();
    await waitFor(() => expect(result.current.issues).toHaveLength(1));
    act(() => result.current.keep(result.current.issues[0]));
    expect(result.current.issues).toHaveLength(0);
    expect(c.elements.getElement("esc")!.getContent()).toBe("Tom &amp;amp; Jerry");
    unmount();

    // Next load: the kept text is not offered again.
    c = createTestComposer();
    c.versions.createVersion = vi.fn(() => Promise.resolve({} as never));
    const again = hook();
    await load();
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(again.result.current.issues).toHaveLength(0);

    localStorage.clear();
    c = createTestComposer();
    c.versions.createVersion = vi.fn(() => Promise.resolve({} as never));
    const third = hook();
    await load();
    await waitFor(() => expect(third.result.current.issues).toHaveLength(1));
    act(() => void third.result.current.fix(third.result.current.issues[0]));
    expect(c.elements.getElement("esc")!.getContent()).toBe("Tom &amp; Jerry");
    expect(third.result.current.issues).toHaveLength(0);
  });
});
