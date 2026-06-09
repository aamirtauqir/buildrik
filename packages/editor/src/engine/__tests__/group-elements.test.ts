/**
 * Group / ungroup engine behavior (PRD gap A4 — Module 1 core editor).
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { Composer } from "../Composer";

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  if (typeof globalThis.indexedDB === "undefined") {
    const fire = (req: Record<string, unknown>) =>
      Promise.resolve().then(() => (req.onsuccess as (() => void) | undefined)?.());
    Object.defineProperty(globalThis, "indexedDB", {
      value: {
        open: () => {
          const req: Record<string, unknown> = {
            onsuccess: () => {}, onerror: () => {}, onupgradeneeded: () => {},
            result: {
              createObjectStore: () => ({ createIndex: () => {} }),
              transaction: () => ({
                objectStore: () => ({
                  get: () => { const r = { result: undefined }; fire(r); return r; },
                  put: () => { const r = {}; fire(r); return r; },
                  getAll: () => { const r = { result: [] }; fire(r); return r; },
                  index: () => ({ getAll: () => { const r = { result: [] }; fire(r); return r; } }),
                }),
              }),
              close: () => {}, objectStoreNames: { contains: () => false },
            },
          };
          fire(req);
          return req;
        },
        deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
      },
      writable: true, configurable: true,
    });
  }
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string) {
    if (id === "2d") {
      return {
        fillStyle: "", clearRect: () => {}, fillRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      } as unknown as CanvasRenderingContext2D;
    }
    return originalGetContext.call(this, id);
  } as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("groupElements / ungroupElement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  function setup() {
    const composer = new Composer({ project: { autoLoad: false } } as never);
    const page = composer.elements.createPage("Home");
    const rootId = page.root.id;
    const a = composer.elements.createElement("heading" as never);
    const b = composer.elements.createElement("paragraph" as never);
    const c = composer.elements.createElement("paragraph" as never);
    composer.elements.addElement(a, rootId);
    composer.elements.addElement(b, rootId);
    composer.elements.addElement(c, rootId);
    return { composer, rootId, a, b, c };
  }

  function childTypes(composer: Composer): string[] {
    const root = composer.exportProject().pages?.[0]?.root;
    return (root?.children ?? []).map((c) => c.type);
  }

  it("wraps two siblings in a container at the earliest index", () => {
    const { composer, a, b } = setup();
    const group = composer.elements.groupElements([a.getId(), b.getId()]);
    expect(group).not.toBeNull();
    // root now: [container, paragraph(c)]
    expect(childTypes(composer)).toEqual(["container", "paragraph"]);
    // container holds the two grouped elements in order
    const gChildren = group!.getChildren().map((e) => e.getType());
    expect(gChildren).toEqual(["heading", "paragraph"]);
  });

  it("refuses to group fewer than 2 elements", () => {
    const { composer, a } = setup();
    expect(composer.elements.groupElements([a.getId()])).toBeNull();
  });

  it("ungroup dissolves the container back into the parent in place", () => {
    const { composer, a, b } = setup();
    const group = composer.elements.groupElements([a.getId(), b.getId()])!;
    const ok = composer.elements.ungroupElement(group.getId());
    expect(ok).toBe(true);
    // back to [heading, paragraph, paragraph]
    expect(childTypes(composer)).toEqual(["heading", "paragraph", "paragraph"]);
  });
});
