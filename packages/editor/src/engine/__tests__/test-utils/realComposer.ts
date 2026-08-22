/**
 * Boot a REAL Composer inside jsdom.
 *
 * The engine reaches for two browser APIs jsdom does not carry: MediaManager
 * builds a MediaOptimizer in its constructor and throws "Failed to create
 * canvas context" without a 2d context, and the storage layer opens an
 * IndexedDB database. Neither has anything to do with what the tests using
 * this are about, so both get the smallest stub that lets construction finish.
 *
 * This prelude was written three times (group-elements, the AI move-element
 * integration test, the context-menu shortcut test) before it was extracted.
 * Every copy stubbed the same two APIs the same way.
 *
 * @license BSD-3-Clause
 */
import { Composer } from "../../Composer";
import type { ComposerConfig } from "../../../shared/types";

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext | undefined;

/** Install the stubs. Call from `beforeAll`. */
export function installEngineBrowserStubs(): void {
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
    return originalGetContext!.call(this, id);
  } as typeof HTMLCanvasElement.prototype.getContext;
}

/** Undo the canvas stub. Call from `afterAll`. */
export function removeEngineBrowserStubs(): void {
  if (originalGetContext) HTMLCanvasElement.prototype.getContext = originalGetContext;
}

/**
 * A real Composer with autoLoad off, so it starts from an empty project
 * instead of whatever the stubbed storage would hand back.
 */
export function createTestComposer(overrides: Partial<ComposerConfig> = {}): Composer {
  return new Composer({
    container: document.createElement("div"),
    project: { autoLoad: false },
    ...overrides,
  });
}
