/**
 * StyleBindingResolver tests — covers extract semantics + Composer integration.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { StyleBindingResolver } from "../StyleBindingResolver";
import { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";

/**
 * Test stand-in for Element. The resolver only reads `getId()` and
 * `getStyles()`, so a minimal duck-typed object is sufficient — avoids the
 * cost of constructing real Element instances with a Composer. Mirrors the
 * stub pattern in TokenUsageTracker.test.ts.
 */
function makeStub(id: string, styles: Record<string, string>): Element {
  return {
    getId: () => id,
    getStyles: () => styles,
  } as unknown as Element;
}

describe("StyleBindingResolver", () => {
  const resolver = new StyleBindingResolver();

  it("returns empty map when no elements", () => {
    expect(resolver.resolveForElements([], [])).toEqual(new Map());
  });

  it("extracts single binding", () => {
    const els = [
      makeStub("el-1", { color: "{{token.color.brand.primary}}" }),
    ];
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.get("el-1:color")).toBe("color.brand.primary");
  });

  it("extracts multiple bindings across elements", () => {
    const els = [
      makeStub("el-1", {
        color: "{{token.color.brand.primary}}",
        background: "{{token.color.surface.bg}}",
      }),
      makeStub("el-2", { fontSize: "{{token.type.body}}" }),
    ];
    const result = resolver.resolveForElements(["el-1", "el-2"], els);
    expect(result.size).toBe(3);
    expect(result.get("el-1:color")).toBe("color.brand.primary");
    expect(result.get("el-1:background")).toBe("color.surface.bg");
    expect(result.get("el-2:fontSize")).toBe("type.body");
  });

  it("ignores non-token style values", () => {
    const els = [
      makeStub("el-1", { color: "#3B82F6", padding: "8px" }),
    ];
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.size).toBe(0);
  });

  it("excludes elements not in id list", () => {
    const els = [
      makeStub("el-1", { color: "{{token.color.brand.primary}}" }),
      makeStub("el-2", { color: "{{token.color.text.body}}" }),
    ];
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.size).toBe(1);
    expect(result.has("el-2:color")).toBe(false);
  });
});

describe("StyleBindingResolver via Composer", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeAll(() => {
    // Polyfill indexedDB for jsdom (Composer constructor opens MediaStorage).
    // Mirrors the stub in TokenUsageTracker.test.ts — `any` is the same
    // compromise that file makes since the mock surface is wider than the
    // IDBFactory subset we exercise.
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
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
    ) {
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

  it("is accessible on composer.designSystem.styleBindings", () => {
    const composer = new Composer({} as never);
    expect(composer.designSystem.styleBindings).toBeDefined();
    expect(typeof composer.designSystem.styleBindings.resolveForElements).toBe(
      "function",
    );
  });

  it("resolves bindings on real ElementManager elements", async () => {
    const composer = new Composer({} as never);
    await composer.whenReady();

    composer.elements.createPage("Home");
    const activePage = composer.elements.getActivePage();
    if (!activePage) throw new Error("No active page after createPage");
    const rootId = activePage.root.id;

    const el = composer.elements.createElement("text", {
      content: "Hello",
      styles: {
        color: "{{token.color.brand.primary}}",
        padding: "8px",
      },
    });
    composer.elements.addElement(el, rootId);

    const result = composer.designSystem.styleBindings.resolveForElements(
      [el.getId()],
      composer.elements.getAllElements(),
    );
    expect(result.size).toBe(1);
    expect(result.get(`${el.getId()}:color`)).toBe("color.brand.primary");
  });
});
