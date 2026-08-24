/**
 * useDirtyPages — the per-page unsaved-edit signal both the tab bar (435:2368)
 * and the Pages tree (140:21 / 1171:4729) draw a dot from.
 *
 * Two contracts are pinned here, and both were once broken in the running app:
 *
 * 1. WHICH EVENTS COUNT. The hook watched element:updated / element:deleted
 *    while autosave watched project:changed + history:undo/redo +
 *    version:restored. Inserting an element lit no dot; an undo neither lit one
 *    nor got saved. Both now read DOCUMENT_CHANGED_EVENTS, so they cannot
 *    drift apart.
 *
 * 2. WHERE THE STATE LIVES. It was a useState inside the panel that rendered
 *    it, so switching to Layers and back wiped the dots with nothing saved,
 *    and no edit was tracked at all while the panel was closed. It is now a
 *    per-composer store — document state, not panel state.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDirtyPages } from "../useDirtyPages";
import { EVENTS, DOCUMENT_CHANGED_EVENTS } from "@/shared/constants";
import type { Composer } from "@/engine";

/** Minimal composer: a real event registry + a settable active page. */
function makeComposer(activePageId: string | null = "p1") {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  let active = activePageId;
  const composer = {
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string, payload?: unknown) => handlers.get(ev)?.forEach((fn) => fn(payload)),
    elements: { getActivePage: () => (active ? { id: active } : null) },
    setActive: (id: string | null) => {
      active = id;
    },
  };
  return composer as unknown as Composer & { emit(ev: string, payload?: unknown): void; setActive(id: string | null): void };
}

describe("useDirtyPages", () => {
  it("starts clean", () => {
    const { result } = renderHook(() => useDirtyPages(makeComposer()));
    expect(result.current.size).toBe(0);
  });

  /* Every event autosave persists on must also light a dot. Driven off the
     shared constant so adding a fifth event cannot leave this hook behind. */
  it.each(DOCUMENT_CHANGED_EVENTS)("%s marks the ACTIVE page dirty", (event) => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(event));
    expect(result.current.has("p1")).toBe(true);
    expect(result.current.size).toBe(1);
  });

  /* Codex caught this one in review, and PageManager's own comment had warned
     about it: `setActivePage` emits project:changed with
     `{ type: "page:activated" }`, so subscribing to the raw event lit an
     unsaved dot on any page the user merely clicked to. */
  it("switching pages does NOT mark the page dirty", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:activated", page: { id: "p1" } }));
    expect(result.current.size).toBe(0);
  });

  /* …but every other payload type on the same event IS a real mutation. */
  it.each(["page:created", "page:updated", "page:deleted", "page:home", "page:reordered", "page:imported"])(
    "%s still marks the page dirty",
    (type) => {
      const composer = makeComposer("p1");
      const { result } = renderHook(() => useDirtyPages(composer));
      act(() => composer.emit(EVENTS.PROJECT_CHANGED, { type, page: { id: "p1" } }));
      expect(result.current.has("p1")).toBe(true);
    }
  );

  it("editing on a second page marks that one too, not instead", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    act(() => {
      composer.setActive("p2");
      composer.emit(EVENTS.PROJECT_CHANGED);
    });
    expect(result.current.has("p1")).toBe(true);
    expect(result.current.has("p2")).toBe(true);
  });

  it("a project save clears every page", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    act(() => composer.emit(EVENTS.PROJECT_SAVED));
    expect(result.current.size).toBe(0);
  });

  /* Composer.saveProject used to announce PROJECT_SAVED before storage.save()
     ran, so the dots cleared up front — and stayed cleared when the write
     threw. The start of a save is PROJECT_SAVING. */
  it("the START of a save does not clear the dots", () => {
    const composer = makeComposer();
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    act(() => composer.emit(EVENTS.PROJECT_SAVING));
    expect(result.current.size).toBe(1);
  });

  it("edits with no active page are ignored, not crashed on", () => {
    const composer = makeComposer(null);
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    expect(result.current.size).toBe(0);
  });

  /* Codex, reviewing the whole session at once: `PageManager` emits
     page:updated / page:home / page:created / page:deleted / page:reordered /
     page:imported with the affected page IN THE PAYLOAD, and it is routinely
     not the active one. Renaming a page from the Pages tree, or setting a
     different page as home, marked whichever page happened to be OPEN and left
     the edited one looking clean. */
  it.each([
    ["page:updated", "p2"],
    ["page:home", "p3"],
    ["page:created", "p4"],
    ["page:reordered", "p2"],
  ])("%s marks the page in the payload, not the active one", (type, target) => {
    const composer = makeComposer("p1");                       // p1 is ACTIVE
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED, { type, page: { id: target } }));
    expect(result.current.has(target)).toBe(true);
    expect(result.current.has("p1")).toBe(false);
  });

  /* An element edit carries no page, and for those the active page IS the
     right answer — the engine has no per-page flag on element events. */
  it("falls back to the active page when the event names none", () => {
    const composer = makeComposer("p1");
    const { result } = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    expect(result.current.has("p1")).toBe(true);
  });

  /* The defect this replaced: click Layers, click back to Pages, and every
     dot was gone with nothing saved, because the markers were the panel's
     useState. */
  it("dots survive the panel unmounting and remounting", () => {
    const composer = makeComposer("p1");
    const first = renderHook(() => useDirtyPages(composer));
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    expect(first.result.current.has("p1")).toBe(true);
    first.unmount();

    const second = renderHook(() => useDirtyPages(composer));
    expect(second.result.current.has("p1")).toBe(true);
  });

  /* And the half that unmount-safety alone would not fix: with the panel shut
     there was no listener at all, so an edit made from the canvas went
     unrecorded and the dot never appeared when the panel came back. */
  it("records edits made while no panel is mounted", () => {
    const composer = makeComposer("p1");
    renderHook(() => useDirtyPages(composer)).unmount();
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));

    const { result } = renderHook(() => useDirtyPages(composer));
    expect(result.current.has("p1")).toBe(true);
  });

  it("an unmounted hook is not re-rendered by a later edit", () => {
    const composer = makeComposer("p1");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useDirtyPages(composer));
    unmount();
    act(() => composer.emit(EVENTS.PROJECT_CHANGED));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("null composer is inert", () => {
    const { result } = renderHook(() => useDirtyPages(null));
    expect(result.current.size).toBe(0);
  });
});
