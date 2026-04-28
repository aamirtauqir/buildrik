import { describe, it, expect, vi } from "vitest";
import { Composer } from "../../engine/Composer";
import { BoundsCalculator } from "../../engine/canvas/indicators/BoundsCalculator";
import { SnapCalculator } from "../../engine/canvas/indicators/SnapCalculator";

/**
 * Performance harness: assert drag frame time ≤ 16 ms on 500-element page.
 * Run: npx vitest run packages/editor/src/__tests__/performance/drag-benchmark.test.ts
 */
describe("Drag frame performance (500 elements)", () => {
  it("calculates smart guides within 16 ms", async () => {
    // Mock canvas APIs so MediaOptimizer doesn't blow up in jsdom
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type !== "2d") return null;
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        drawImage: vi.fn(),
        canvas: { width: 0, height: 0 },
      } as any;
    }) as any;
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,") as any;

    // Mock indexedDB so Composer.initialize doesn't throw
    const mockIDBRequest = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ result: undefined, onsuccess: null, onerror: null })),
            put: vi.fn(() => ({ onsuccess: null, onerror: null })),
            delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          })),
        })),
        close: vi.fn(),
      },
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === "success") setTimeout(() => cb(), 0);
      }),
    };
    (globalThis as any).indexedDB = {
      open: vi.fn(() => mockIDBRequest),
      deleteDatabase: vi.fn(),
    };

    // Build a composer with 500 elements
    const composer = new Composer({} as any);
    const boundsCalc = new BoundsCalculator(composer);
    const snapCalc = new SnapCalculator(composer, boundsCalc);

    // Give async Composer.initialize a tick to settle
    await new Promise((r) => setTimeout(r, 10));

    // Mock DOM
    const mockRect = { left: 0, top: 0, width: 10, height: 10 };
    const mockContainerRect = { left: 0, top: 0 };
    const mockStyle = { marginTop: "0", marginRight: "0", marginBottom: "0", marginLeft: "0", paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0" };

    const mockElements: HTMLElement[] = [];
    for (let i = 0; i < 500; i++) {
      const el = document.createElement("div");
      el.setAttribute("data-buildrick-id", `el-${i}`);
      el.getBoundingClientRect = () => ({ ...mockRect, left: i * 20, top: i * 10 }) as DOMRect;
      document.body.appendChild(el);
      mockElements.push(el);
    }

    // Mock container
    const container = document.createElement("div");
    container.className = "buildrick-canvas";
    container.getBoundingClientRect = () => mockContainerRect as DOMRect;
    document.body.appendChild(container);

    // Warm cache
    const startWarm = performance.now();
    snapCalc.calculateSnapPoints("el-250", new Map());
    const warmTime = performance.now() - startWarm;

    // Cached run
    const start = performance.now();
    snapCalc.calculateSnapPoints("el-250", new Map());
    const elapsed = performance.now() - start;

    // Cleanup
    mockElements.forEach((el) => el.remove());
    container.remove();

    // Restore prototypes
    HTMLCanvasElement.prototype.getContext = origGetContext;
    HTMLCanvasElement.prototype.toDataURL = origToDataURL;

    expect(elapsed).toBeLessThanOrEqual(16);
    console.log(`500-element snap time: ${elapsed.toFixed(2)} ms (warm: ${warmTime.toFixed(2)} ms)`);
  });
});
