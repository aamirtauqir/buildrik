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
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

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
    const composer = new Composer({} as any);
    // D-4: ProjectTokensHydrator merges `projectSettings.designTokens` into the
    // registries on mount (not the localStorage cache), so the token to
    // exercise must be seeded on the composer's project settings. A non-default
    // id ("test-color-primary") goes through mergeProjectTokens' `added` path
    // and keeps its own cssVar/darkValue verbatim, instead of colliding with a
    // DEFAULT_TOKENS id and inheriting that default's `--buildrick-design-*` cssVar.
    composer.setProjectSettingsRaw({
      designTokens: [
        v6Token({ id: "test-color-primary", name: "Primary", value: "#fff", cssVar: "--bd-color-primary", dark: "#000" }),
      ],
    });

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

  it("real chain: token without darkValue under dark mode falls back to value", () => {
    const composer = new Composer({} as any);
    composer.setProjectSettingsRaw({
      designTokens: [
        v6Token({ id: "test-color-secondary", name: "Secondary", value: "#aaa", cssVar: "--bd-color-secondary", layer: "semantic" }),
      ],
    });

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
