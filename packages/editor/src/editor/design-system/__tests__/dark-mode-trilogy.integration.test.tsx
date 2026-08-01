/**
 * Phase B.3a — end-to-end integration test for the dark-mode trilogy.
 *
 * Validates A.2 + B.0 + B.1 + B.2 wired together with a REAL Composer
 * (not mocks): real EventEmitter, real ColorMode store, real DarkResolver,
 * real TokenRegistryProvider effect.
 *
 * What this catches that the per-phase mocked tests miss:
 *   - EventEmitter coupling between ColorMode.set → on/off → handler
 *   - Composer init order (ColorMode created before TokenRegistryProvider mounts)
 *   - DarkResolver event emission propagating through Composer's EventEmitter
 */

import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import * as React from "react";
import { Composer } from "@/engine/Composer";
import { TokenRegistryProvider } from "@/editor/design-system";

describe("dark-mode trilogy · end-to-end", () => {
  let originalGetContext: any;
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req = {
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

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    setPropertySpy = vi.spyOn(document.documentElement.style, "setProperty");
    setPropertySpy.mockClear();
  });

  it("real Composer + real TokenRegistryProvider: colorMode.set('dark') triggers darkValue setProperty across the full chain", () => {
    // Seed a single color token with a darkValue.
    localStorage.setItem(
      "buildrick-design-tokens-int-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    const composer = new Composer({} as any);

    render(
      <TokenRegistryProvider projectId="int-test" composer={composer}>
        <div />
      </TokenRegistryProvider>
    );

    // Initial mode is "system" → matchMedia.matches=false → resolved="light"
    // Effect runs once: applies token.value (light).
    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#fff");

    setPropertySpy.mockClear();

    // Real chain: ColorMode.set("dark") → emits "colorMode:changed" via Composer's
    // EventEmitter → TokenRegistryProvider's handler fires → walks tokens through
    // composer.darkResolver.resolve(token, "dark") → darkValue ("#000") returned →
    // document.documentElement.style.setProperty called with darkValue.
    act(() => {
      composer.colorMode.set("dark");
    });

    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#000");
  });

  it("real chain: token without darkValue under dark mode falls back to value AND emits tokens:dark-missing on the real EventEmitter", () => {
    localStorage.setItem(
      "buildrick-design-tokens-int-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-secondary", name: "Secondary", value: "#aaa",
            category: "colors", cssVar: "--bd-color-secondary", type: "color",
          },
        ],
      })
    );

    const composer = new Composer({} as any);

    const missingHandler = vi.fn();
    composer.on("tokens:dark-missing", missingHandler);

    render(
      <TokenRegistryProvider projectId="int-test" composer={composer}>
        <div />
      </TokenRegistryProvider>
    );

    setPropertySpy.mockClear();

    act(() => {
      composer.colorMode.set("dark");
    });

    // Fell back to value (no darkValue present).
    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-secondary", "#aaa");
    // Emitted via real Composer EventEmitter — proves the resolver event hook
    // propagates through the same EventEmitter the test subscribed to.
    expect(missingHandler).toHaveBeenCalledWith({ tokenId: "color-secondary" });
  });

  it("real chain: composer.aliasResolver coexists with darkResolver wiring (A.2 + B.0 + B.1 + B.2 don't conflict)", () => {
    // Smoke: all four pieces exist on the real composer.
    const composer = new Composer({} as any);
    expect(composer.aliasResolver).toBeDefined();
    expect(composer.darkResolver).toBeDefined();
    expect(composer.colorMode).toBeDefined();
    expect(composer.migration).toBeDefined();
  });
});
