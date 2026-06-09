/**
 * Live undo/redo integration test — real Composer, real element tree,
 * real export/import round-trip (NOT a mocked composer).
 *
 * Guards the P0 found in QA 2026-06-09: adding two elements then a single
 * Cmd+Z wiped BOTH and redo restored the wrong one. The existing
 * HistoryManager.test.ts suite passes with a vi.fn() composer, so it never
 * exercised importProject → buildElementTree, which mutates the snapshot
 * in place and corrupts currentStateCache.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { Composer } from "../Composer";
import type { ProjectData } from "../../shared/types";

// Coalesce delay used by HistoryManager (config.coalesceDelay).
const COALESCE = 500;

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  if (typeof globalThis.indexedDB === "undefined") {
    const fireOnSuccess = (req: Record<string, unknown>) => {
      Promise.resolve().then(() => (req.onsuccess as (() => void) | undefined)?.());
    };
    Object.defineProperty(globalThis, "indexedDB", {
      value: {
        open: () => {
          const req: Record<string, unknown> = {
            onsuccess: () => {}, onerror: () => {}, onupgradeneeded: () => {},
            result: {
              createObjectStore: () => ({ createIndex: () => {} }),
              transaction: () => ({
                objectStore: () => ({
                  get: () => { const r = { result: undefined }; fireOnSuccess(r); return r; },
                  put: () => { const r = {}; fireOnSuccess(r); return r; },
                  getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                  index: () => ({ getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; } }),
                }),
              }),
              close: () => {}, objectStoreNames: { contains: () => false },
            },
          };
          fireOnSuccess(req);
          return req;
        },
        deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
      },
      writable: true, configurable: true,
    });
  }

  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
    if (contextId === "2d") {
      return {
        fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
        clearRect: () => {}, measureText: () => ({ width: 0 }),
      } as unknown as CanvasRenderingContext2D;
    }
    return originalGetContext.call(this, contextId);
  } as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

function childTypes(composer: Composer): string[] {
  const data = composer.exportProject() as ProjectData;
  const root = data.pages?.[0]?.root;
  return (root?.children ?? []).map((c) => c.type);
}

function rootId(composer: Composer): string {
  const page = composer.elements.getActivePage();
  if (!page) throw new Error("no active page");
  return page.root.id;
}

/** Add an element to the page root and flush the debounced history record. */
function addAndCommit(composer: Composer, type: string): void {
  const el = composer.elements.createElement(type as never);
  composer.elements.addElement(el, rootId(composer));
  // PROJECT_CHANGED schedules a setTimeout(0) then a coalesce setTimeout.
  // Advance both so the record commits as its own undo step.
  vi.advanceTimersByTime(COALESCE + 50);
}

describe("live undo/redo with real element tree (P0 QA 2026-06-09)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  function makeComposer(): Composer {
    // No autoLoad, no remote sync — pure in-memory composer.
    const composer = new Composer({ project: { autoLoad: false } } as never);
    composer.elements.createPage("Home");
    return composer;
  }

  it("single undo reverts ONLY the last add (not the whole session)", () => {
    const composer = makeComposer();
    composer.history.clear();
    composer.history.forceCheckpoint("baseline");

    addAndCommit(composer, "heading");
    expect(childTypes(composer)).toEqual(["heading"]);

    addAndCommit(composer, "paragraph");
    expect(childTypes(composer)).toEqual(["heading", "paragraph"]);

    // ONE undo must drop only the paragraph.
    composer.history.undo();
    expect(childTypes(composer)).toEqual(["heading"]);

    // A second undo drops the heading.
    composer.history.undo();
    expect(childTypes(composer)).toEqual([]);
  });

  it("undo within the coalesce window commits the pending edit, then reverts it", () => {
    const composer = makeComposer();
    composer.history.clear();
    composer.history.forceCheckpoint("baseline");

    addAndCommit(composer, "heading"); // committed (advances past coalesce)
    expect(childTypes(composer)).toEqual(["heading"]);

    // Add a second element but only advance PAST the setTimeout(0) macrotask,
    // staying INSIDE the 500ms coalesce window — the paragraph add is owed a
    // record but not yet committed. This is the real-keypress timing.
    const el = composer.elements.createElement("paragraph" as never);
    composer.elements.addElement(el, rootId(composer));
    vi.advanceTimersByTime(10);
    expect(childTypes(composer)).toEqual(["heading", "paragraph"]);

    // Undo must flush the owed record first, then revert only the paragraph.
    composer.history.undo();
    expect(childTypes(composer)).toEqual(["heading"]);

    // The flushed edit is on the redo stack and restorable.
    composer.history.redo();
    expect(childTypes(composer)).toEqual(["heading", "paragraph"]);
  });

  it("redo after undo restores the correct element", () => {
    const composer = makeComposer();
    composer.history.clear();
    composer.history.forceCheckpoint("baseline");

    addAndCommit(composer, "heading");
    addAndCommit(composer, "paragraph");
    expect(childTypes(composer)).toEqual(["heading", "paragraph"]);

    composer.history.undo();
    expect(childTypes(composer)).toEqual(["heading"]);

    composer.history.redo();
    expect(childTypes(composer)).toEqual(["heading", "paragraph"]);
  });
});
