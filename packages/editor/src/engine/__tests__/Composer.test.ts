import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";

describe("Composer listener hygiene", () => {
  let originalGetContext: any;

  beforeAll(() => {
    // Polyfill indexedDB for jsdom (Composer.initialize opens MediaStorage)
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
                createObjectStore: () => ({
                  createIndex: () => {},
                }),
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
                objectStoreNames: {
                  contains: () => false,
                },
              },
            };
            fireOnSuccess(req);
            return req;
          },
          deleteDatabase: () => ({
            onsuccess: () => {},
            onerror: () => {},
          }),
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

  it("removes individually tracked handlers on destroy", async () => {
    const composer = new Composer({} as any);
    const offSpy = vi.spyOn(composer, "off");
    const collabOffSpy = vi.spyOn((composer as any).collab.manager, "off");
    await composer.destroy();
    expect(offSpy).toHaveBeenCalledWith("element:selected", expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith("selection:multiple", expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith("selection:cleared", expect.any(Function));
    expect(collabOffSpy).toHaveBeenCalledWith("operation:apply", expect.any(Function));
  });

  it("whenReady resolves after init completes", async () => {
    const composer = new Composer({} as any);
    await expect(composer.whenReady()).resolves.toBeUndefined();
    expect(composer.isReady()).toBe(true);
  });

  // Regression for E-004 (audit): setDevice previously emitted
  // BREAKPOINT_CHANGED twice — once from Viewport.setDevice and again
  // from Composer.setDevice. Viewport is the single source of truth,
  // so exactly one emission per setDevice call is the contract.
  it("setDevice emits BREAKPOINT_CHANGED exactly once", () => {
    const composer = new Composer({} as any);
    const handler = vi.fn();
    composer.on("breakpoint:changed", handler);

    composer.setDevice("mobile");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("mobile");

    // Same device is a no-op (early exit in setDevice).
    composer.setDevice("mobile");
    expect(handler).toHaveBeenCalledTimes(1);

    // Different device fires once more.
    composer.setDevice("tablet");
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("setDevice keeps state.device in sync with viewport", () => {
    const composer = new Composer({} as any);
    composer.setDevice("tablet");
    expect(composer.getState().device).toBe("tablet");
    expect((composer as any).viewport.getDevice()).toBe("tablet");
  });
});

/* A loaded project always has a page, and one of them is active. importPage
   adopts the first when there is no active one, createPage sets it, and
   RecoveryManager repairs it — on an INACTIVITY timer, minutes later.
   importProject was the one entry point that could leave the invariant broken:
   a snapshot with no pages cleared the editor and set nothing back.

   That is reachable in the real product, not a synthetic case: auto-checkpoints
   fire on project:loaded, so a version captured before pages existed sits in
   the user's version list. Restoring one left zero pages, no active page, and
   every insert path dying at `if (!page)` — the sidebar looked fine and did
   nothing (found live 2026-08-14). */
describe("Composer.importProject — the editor always has a page to insert into", () => {
  /* `new Composer()` builds a MediaOptimizer, which throws without a 2d
     context. The first describe stubs it in its own beforeAll; that scope does
     not reach here, so this block installs the same stub. */
  let restoreGetContext: (() => void) | null = null;
  beforeAll(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
          clearRect: () => {}, save: () => {}, restore: () => {},
          beginPath: () => {}, closePath: () => {}, stroke: () => {}, fill: () => {},
          translate: () => {}, scale: () => {}, rotate: () => {},
          measureText: () => ({ width: 0 }), fillText: () => {},
        } as unknown as CanvasRenderingContext2D;
      }
      return (original as never as (id: string) => never).call(this, contextId);
    } as typeof HTMLCanvasElement.prototype.getContext;
    restoreGetContext = () => { HTMLCanvasElement.prototype.getContext = original; };
  });
  afterAll(() => restoreGetContext?.());

  it("adopts the first imported page as active", () => {
    const composer = new Composer({} as any);
    const page = composer.elements.createPage("Home");
    const exported = composer.exportProject();
    (composer.elements as any).setActivePage?.(page.id);

    composer.importProject(exported);

    expect(composer.elements.getAllPages().length).toBeGreaterThan(0);
    expect(composer.elements.getActivePage()).toBeTruthy();
  });

  it("a page-less snapshot leaves a usable editor, not a dead one", () => {
    const composer = new Composer({} as any);
    composer.elements.createPage("Home");

    composer.importProject({ version: "1.0.0", pages: [], styles: [], assets: [] } as any);

    // The invariant, stated the way the insert path reads it.
    expect(composer.elements.getAllPages().length).toBe(1);
    const active = composer.elements.getActivePage();
    expect(active).toBeTruthy();
    expect(composer.elements.getElement(active!.root.id)).toBeTruthy();
  });

  it("holds when the snapshot omits `pages` entirely", () => {
    const composer = new Composer({} as any);

    composer.importProject({ version: "1.0.0" } as any);

    expect(composer.elements.getActivePage()).toBeTruthy();
  });

  /* The page-repair runs inside importProject, and importProject is also how
     undo/redo restore a snapshot (HistoryManager.restoreSnapshot). A repair
     that recorded itself would push an entry onto the stack DURING an undo —
     the classic way an undo stack eats itself. restoreSnapshot sets
     isRecording=false around the import; this pins that the repair stays
     inside that window. */
  it("repairing a page-less snapshot during undo does not grow the history stack", () => {
    const composer = new Composer({} as any);
    composer.elements.createPage("Home");
    const before = composer.history.getHistoryStack().length;

    (composer as any).history.restoreSnapshot({ version: "1.0.0", pages: [] });

    expect(composer.elements.getActivePage()).toBeTruthy();
    expect(composer.history.getHistoryStack().length).toBe(before);
  });
});
