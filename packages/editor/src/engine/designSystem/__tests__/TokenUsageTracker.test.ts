/**
 * TokenUsageTracker tests — covers usage counting + Composer integration.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { TokenUsageTracker } from "../TokenUsageTracker";
import { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";

/**
 * Test stand-in for Element. The tracker only reads `getStyles()`, so a
 * minimal duck-typed object is sufficient — avoids the cost of constructing
 * real Element instances with a Composer.
 */
function makeStub(styles: Record<string, string>): Element {
  return { getStyles: () => styles } as unknown as Element;
}

describe("TokenUsageTracker", () => {
  let tracker: TokenUsageTracker;

  beforeEach(() => {
    tracker = new TokenUsageTracker();
  });

  it("returns 0 for unused token", () => {
    tracker.recompute([]);
    expect(tracker.getUsage("color.brand.primary")).toBe(0);
  });

  it("counts single binding", () => {
    tracker.recompute([makeStub({ color: "{{token.color.brand.primary}}" })]);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
  });

  it("counts multiple bindings across elements", () => {
    tracker.recompute([
      makeStub({ color: "{{token.color.brand.primary}}" }),
      makeStub({ background: "{{token.color.brand.primary}}" }),
      makeStub({ borderColor: "{{token.color.brand.primary}}" }),
    ]);
    expect(tracker.getUsage("color.brand.primary")).toBe(3);
  });

  it("ignores non-token values", () => {
    tracker.recompute([
      makeStub({
        color: "#3B82F6",
        background: "{{token.color.brand.primary}}",
      }),
    ]);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
  });

  it("counts multiple distinct tokens independently", () => {
    tracker.recompute([
      makeStub({
        color: "{{token.color.brand.primary}}",
        padding: "{{token.space.md}}",
      }),
    ]);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
    expect(tracker.getUsage("space.md")).toBe(1);
  });

  it("counts multiple refs in same value string", () => {
    tracker.recompute([
      makeStub({
        background: "linear-gradient({{token.color.brand.primary}}, {{token.color.brand.primary}})",
      }),
    ]);
    expect(tracker.getUsage("color.brand.primary")).toBe(2);
  });

  it("clears previous counts on recompute", () => {
    tracker.recompute([makeStub({ color: "{{token.color.brand.primary}}" })]);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
    tracker.recompute([]);
    expect(tracker.getUsage("color.brand.primary")).toBe(0);
  });
});

describe("TokenUsageTracker via Composer", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeAll(() => {
    // Polyfill indexedDB for jsdom (Composer.initialize opens MediaStorage).
    // Mirrors the stub in engine/__tests__/Composer.test.ts — `any` is the
    // same compromise that file makes since the mock surface is wider than
    // the IDBFactory subset we exercise.
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req: any = {
              onsuccess: () => {},
              onerror: () => {},
              onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => {
                      const r = { result: undefined };
                      fireOnSuccess(r);
                      return r;
                    },
                    put: () => {
                      const r = {};
                      fireOnSuccess(r);
                      return r;
                    },
                    getAll: () => {
                      const r = { result: [] };
                      fireOnSuccess(r);
                      return r;
                    },
                    index: () => ({
                      getAll: () => {
                        const r = { result: [] };
                        fireOnSuccess(r);
                        return r;
                      },
                    }),
                  }),
                }),
                close: () => {},
                objectStoreNames: { contains: () => false },
              },
            };
            fireOnSuccess(req);
            return req;
          },
          deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
        },
        writable: true,
        configurable: true,
      });
    }

    // jsdom doesn't implement canvas; MediaOptimizer constructor needs a 2d ctx.
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {},
          drawImage: () => {},
          fillRect: () => {},
          clearRect: () => {},
          measureText: () => ({ width: 0 }),
        } as unknown as CanvasRenderingContext2D;
      }
      return originalGetContext.call(this, contextId);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("auto-recomputes on element style changes", async () => {
    const composer = new Composer({} as never);
    await composer.whenReady();

    composer.elements.createPage("Home");
    const activePage = composer.elements.getActivePage();
    if (!activePage) throw new Error("No active page after createPage");
    const rootId = activePage.root.id;

    const el = composer.elements.createElement("text", {
      content: "Hello",
      styles: { color: "{{token.color.brand.primary}}" },
    });
    composer.elements.addElement(el, rootId);
    await Promise.resolve(); // flush coalesced recompute

    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(1);

    // Remove the binding via setStyle — ELEMENT_UPDATED fires, tracker recomputes.
    el.setStyle("color", "#3B82F6");
    await Promise.resolve();
    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(0);

    // Delete the element — ELEMENT_DELETED fires, tracker recomputes.
    el.setStyle("color", "{{token.color.brand.primary}}");
    await Promise.resolve();
    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(1);
    composer.elements.removeElement(el.getId());
    await Promise.resolve();
    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(0);
  });

  it("coalesces multiple element events into one recompute", async () => {
    const composer = new Composer({} as never);
    await composer.whenReady();

    composer.elements.createPage("Home");
    const activePage = composer.elements.getActivePage();
    if (!activePage) throw new Error("No active page after createPage");
    const rootId = activePage.root.id;

    const el = composer.elements.createElement("text", {
      content: "Hello",
      styles: { color: "{{token.color.brand.primary}}" },
    });
    composer.elements.addElement(el, rootId);
    await Promise.resolve(); // flush addElement's scheduled recompute

    // Spy on the tracker — count calls from this point forward.
    const tracker = composer.designSystem.tokenUsage;
    let calls = 0;
    const origRecompute = tracker.recompute.bind(tracker);
    tracker.recompute = (els) => {
      calls++;
      origRecompute(els);
    };

    // Five rapid style updates within the same tick.
    el.setStyle("color", "{{token.color.brand.primary}}");
    el.setStyle("color", "{{token.color.brand.secondary}}");
    el.setStyle("color", "{{token.color.brand.tertiary}}");
    el.setStyle("color", "{{token.color.brand.quaternary}}");
    el.setStyle("color", "{{token.color.brand.primary}}");

    expect(calls).toBe(0); // all five coalesced, none flushed yet
    await Promise.resolve();
    expect(calls).toBe(1); // single recompute for the burst
  });
});
