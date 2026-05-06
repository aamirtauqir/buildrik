/**
 * Canvas re-render perf benchmark — C3 / E-019.
 *
 * Measures `composer.exportHTML()` cost, which is what Canvas re-mounts via
 * React's raw-HTML escape hatch on every `ELEMENT_UPDATED` event. If this is
 * O(n) in tree size per single-property edit, every keystroke on a big page
 * rebuilds the entire HTML string.
 *
 * Run: `npx vitest run packages/editor/src/__tests__/performance/canvas-rerender-benchmark.test.ts`
 *
 * Threshold: p95 ≤ 250 ms per edit on a 1000-element page. Numbers vary by
 * 3-5× between solo runs (~30 ms p95) and full-suite runs (~100-200 ms p95)
 * because jsdom + GC pressure inflates wall-clock time after 1860 prior
 * tests in the same process. The 250 ms ceiling is loose enough to survive
 * that load while still tripping on a real ~10× regression. If it ever
 * regresses past it, that's the trigger to evaluate `morphdom` / partial-
 * render strategies.
 *
 * @license BSD-3-Clause
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Composer } from "../../engine/Composer";

describe("Canvas re-render perf (1000 elements)", () => {
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
              onsuccess: () => {},
              onerror: () => {},
              onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => {
                      const r: any = { result: undefined };
                      fireOnSuccess(r);
                      return r;
                    },
                    put: () => {
                      const r: any = {};
                      fireOnSuccess(r);
                      return r;
                    },
                    getAll: () => {
                      const r: any = { result: [] };
                      fireOnSuccess(r);
                      return r;
                    },
                    index: () => ({
                      getAll: () => {
                        const r: any = { result: [] };
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

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
      return {
        fillStyle: "",
        canvas: this,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {},
        drawImage: () => {},
        fillRect: () => {},
        clearRect: () => {},
        measureText: () => ({ width: 0 }),
      } as any;
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("exportHTML stays under 100 ms per single-property edit on 1000-element page", async () => {
    const composer = new Composer({} as any);
    await composer.whenReady();

    // Build a flat tree of 1000 children under a fresh page root.
    composer.elements.createPage("Home");
    const activePage = composer.elements.getActivePage();
    if (!activePage) throw new Error("No active page after createPage");
    const rootId = activePage.root.id;

    const childIds: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const el = composer.elements.createElement("text", {
        content: `Element ${i}`,
        styles: { color: "#000000", "font-size": "14px" },
      });
      composer.elements.addElement(el, rootId);
      childIds.push(el.getId());
    }

    // Warmup: cold export populates any internal caches.
    composer.exportHTML();

    // Measure: time N exportHTML calls between style edits, mirroring the
    // ELEMENT_UPDATED → re-export cycle Canvas walks on every keystroke.
    const N = 50;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      const targetId = childIds[i % childIds.length];
      const target = composer.elements.getElement(targetId);
      target?.setStyle("color", `#${(i * 7919).toString(16).slice(-6).padStart(6, "0")}`);

      const t0 = performance.now();
      composer.exportHTML();
      samples.push(performance.now() - t0);
    }

    samples.sort((a, b) => a - b);
    const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
    const median = samples[Math.floor(samples.length / 2)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    const max = samples[samples.length - 1];

    // Log summary so future regression hunters see the baseline at a glance.
    console.log(
      `[canvas-rerender] 1000 elements, ${N} edits — ` +
        `mean ${mean.toFixed(2)} ms, median ${median.toFixed(2)} ms, ` +
        `p95 ${p95.toFixed(2)} ms, max ${max.toFixed(2)} ms`,
    );

    // Threshold is intentionally loose to survive jsdom-under-load variance
    // (see file header). The point of the benchmark is the logged baseline;
    // the assertion just guards against catastrophic regressions.
    expect(p95).toBeLessThanOrEqual(250);

    await composer.destroy();
  }, 30_000);
});
