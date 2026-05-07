import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";
import { MigrationManager } from "../migration/MigrationManager";

describe("Composer · migration manager wiring", () => {
  let originalGetContext: any;

  beforeAll(() => {
    // Polyfill indexedDB for jsdom (Composer constructor opens MediaStorage)
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req = {
              onsuccess: () => {},
              onerror: () => {},
              onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => { const r = { result: undefined }; fireOnSuccess(r); return r; },
                    put: () => { const r = {}; fireOnSuccess(r); return r; },
                    getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                    index: () => ({
                      getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
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

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string) {
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
          strokeRect: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          rect: () => {},
          clip: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          transform: () => {},
          setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => null,
          measureText: () => ({ width: 0 }),
          font: "",
          textAlign: "start",
          textBaseline: "alphabetic",
        } as any;
      }
      return originalGetContext.call(this, contextId);
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("exposes composer.migration as a MigrationManager instance", () => {
    const c = new Composer({} as any);
    expect(c.migration).toBeInstanceOf(MigrationManager);
  });
});
