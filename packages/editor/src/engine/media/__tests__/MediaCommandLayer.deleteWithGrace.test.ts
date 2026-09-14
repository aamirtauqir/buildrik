/**
 * Deleting a file clears the dead src and offers one way back that restores
 * both — the file in the library and the src on every element that used it.
 *
 * Walked 2026-09-03: deleteAsset never entered history, so Undo stayed
 * enabled pointing at an unrelated earlier edit and restored nothing, while
 * the canvas element kept a src that now 404s. Restoring the element without
 * the file would recreate the dead src by another route, so neither half is
 * offered alone.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { MediaCommandLayer } from "../MediaCommandLayer";
import type { Composer } from "../../Composer";

type El = { id: string; src?: string; bg?: string };

function harness(els: El[], opts: { trash?: boolean } = {}) {
  const state: Record<string, El> = Object.fromEntries(els.map((e) => [e.id, { ...e }]));
  const facade = (e: El) => ({
    getId: () => e.id,
    getAttribute: (n: string) => (n === "src" ? e.src : undefined),
    getStyle: (p: string) => (p === "background-image" ? e.bg : undefined),
    setAttribute: (n: string, v: string) => { trace.push(`set:${inside ? "untracked" : "TRACKED"}`); if (n === "src") e.src = v; },
    removeAttribute: (n: string) => { trace.push(`remove:${inside ? "untracked" : "TRACKED"}`); if (n === "src") delete e.src; },
    setStyle: (p: string, v: string) => { trace.push(`style:${inside ? "untracked" : "TRACKED"}`); if (p === "background-image") e.bg = v; },
  });
  const restore = vi.fn();
  const commit = vi.fn(async () => {});
  const noteUnrecordedAction = vi.fn();
  /* Records every element write the layer makes and whether it happened
     inside runWithoutTracking — the property the live defect turned on. */
  const trace: string[] = [];
  let inside = 0;
  const runWithoutTracking = vi.fn((fn: () => void) => { inside++; try { fn(); } finally { inside--; } });
  const composer = {
    elements: {
      findByMediaSrc: (src: string) =>
        Object.values(state).filter((e) => e.src === src || e.bg?.includes(src)).map(facade),
    },
    media: {
      trashAsset: vi.fn(async () =>
        opts.trash === false ? null : { asset: { id: "a1", name: "hero.jpg", src: "blob:hero" }, restore, commit },
      ),
    },
    history: { noteUnrecordedAction, runWithoutTracking },
  } as unknown as Composer;
  return { layer: new MediaCommandLayer(composer), state, restore, commit, noteUnrecordedAction, runWithoutTracking, trace };
}

describe("MediaCommandLayer.deleteWithGrace", () => {
  it("clears the dead src on every element that used the file", async () => {
    const h = harness([{ id: "img", src: "blob:hero" }, { id: "sec", bg: "url(blob:hero)" }, { id: "other", src: "blob:x" }]);
    const g = await h.layer.deleteWithGrace("a1", 60_000);
    expect(g?.usageCount).toBe(2);
    expect(h.state.img.src).toBeUndefined();
    expect(h.state.sec.bg).toBe("none");
    expect(h.state.other.src).toBe("blob:x");
    await g!.commitNow();
  });

  it("undo restores the file AND the exact src on every element", async () => {
    const h = harness([{ id: "img", src: "blob:hero" }, { id: "sec", bg: 'url("blob:hero"), linear-gradient(red, blue)' }]);
    const g = await h.layer.deleteWithGrace("a1", 60_000);
    g!.undo();
    expect(h.restore).toHaveBeenCalledTimes(1);
    expect(h.state.img.src).toBe("blob:hero");
    expect(h.state.sec.bg).toBe('url("blob:hero"), linear-gradient(red, blue)');
    // Undone before the grace ran out, so the permanent delete never happens.
    await g!.commitNow();
    expect(h.commit).not.toHaveBeenCalled();
  });

  it("commits when the grace period runs out", async () => {
    vi.useFakeTimers();
    try {
      const h = harness([{ id: "img", src: "blob:hero" }]);
      const g = await h.layer.deleteWithGrace("a1", 1000);
      expect(h.commit).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1001);
      expect(h.commit).toHaveBeenCalledTimes(1);
      // Too late to undo — the file is gone, and the src stays cleared.
      g!.undo();
      expect(h.restore).not.toHaveBeenCalled();
      expect(h.state.img.src).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("tells history the delete happened outside it", async () => {
    const h = harness([{ id: "img", src: "blob:hero" }]);
    const g = await h.layer.deleteWithGrace("a1", 60_000);
    expect(h.noteUnrecordedAction).toHaveBeenCalledWith("deleting a file");
    await g!.commitNow();
  });

  it("returns null and touches nothing when no grace could be granted", async () => {
    const h = harness([{ id: "img", src: "blob:hero" }], { trash: false });
    expect(await h.layer.deleteWithGrace("a1", 60_000)).toBeNull();
    expect(h.state.img.src).toBe("blob:hero");
  });
});

/* THE ONE THAT CATCHES THE LIVE DEFECT. Announcing "deleting a file" as
   unrecorded was already there and it still lost, because the element clears
   fed the DEBOUNCED recorder, which fired ~1s later and re-armed Undo —
   pressing it then put a dead blob src back on an <img> whose asset was gone
   for good. Measured live 2026-09-15. The contract is that every element
   write this layer makes, on delete AND on its own undo, happens inside
   runWithoutTracking. A single TRACKED write is the bug. */
describe("MediaCommandLayer.deleteWithGrace — element writes never reach history", () => {
  it("clears and restores references without a single tracked write", async () => {
    const h = harness([
      { id: "e1", src: "blob:hero" },
      { id: "e2", bg: "url(blob:hero)" },
    ]);
    const g = await h.layer.deleteWithGrace("a1", 60_000);
    expect(g).not.toBeNull();
    expect(h.trace.length).toBeGreaterThan(0);
    expect(h.trace.filter((t) => t.endsWith("TRACKED"))).toEqual([]);

    const before = h.trace.length;
    g!.undo();
    expect(h.trace.length).toBeGreaterThan(before);
    expect(h.trace.filter((t) => t.endsWith("TRACKED"))).toEqual([]);
    expect(h.runWithoutTracking).toHaveBeenCalledTimes(2);
  });
});
