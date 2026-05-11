import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";

describe("Composer.aiClient wiring (Phase C.1)", () => {
  let originalGetContext: any;

  beforeAll(() => {
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req: any = {
              onsuccess: () => {}, onerror: () => {}, onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => { const r: any = { result: undefined }; fireOnSuccess(r); return r; },
                    put: () => { const r: any = {}; fireOnSuccess(r); return r; },
                    getAll: () => { const r: any = { result: [] }; fireOnSuccess(r); return r; },
                    index: () => ({ getAll: () => { const r: any = { result: [] }; fireOnSuccess(r); return r; } }),
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
    HTMLCanvasElement.prototype.getContext = function (contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
          clearRect: () => {}, strokeRect: () => {}, beginPath: () => {},
          closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
          fill: () => {}, arc: () => {}, rect: () => {}, clip: () => {},
          save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
          rotate: () => {}, transform: () => {}, setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => null, measureText: () => ({ width: 0 }),
          font: "", textAlign: "start", textBaseline: "alphabetic",
        } as any;
      }
      return originalGetContext.call(this, contextId);
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("threads config.aiClient into AIAssistService", async () => {
    const stubClient = {
      generate: async () =>
        '{"componentTypeId":"x","variants":[],"bindings":{}}',
    };
    const c = new Composer({ aiClient: stubClient } as any);
    const result = await c.aiAssistService.generateComponentSchema("hello");
    expect(result.componentTypeId).toBe("x");
  });

  it("defaults to null client when aiClient omitted (legacy behavior)", async () => {
    const c = new Composer({} as any);
    await expect(c.aiAssistService.generateComponentSchema("hi")).rejects.toThrow(
      /no AIClient configured/,
    );
  });
});
