/**
 * RecoveryManager — synthetic-event tests for the C2 expansion
 * (window.error + window.unhandledrejection listeners + crash sentinel).
 *
 * Tests use a stub Composer because the real Composer pulls 30+ managers
 * which is overkill for verifying RecoveryManager wiring.
 *
 * @license BSD-3-Clause
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import { RecoveryManager } from "../RecoveryManager";

const CRASH_SENTINEL_KEY = "buildrick:last-crash";

type StubElements = {
  getActivePage: () => unknown;
  getAllPages: () => unknown[];
  setActivePage: ReturnType<typeof vi.fn>;
  createPage: ReturnType<typeof vi.fn>;
  getPage: (id?: string) => unknown;
  getElement: (id?: string) => unknown;
  buildElementTree: ReturnType<typeof vi.fn>;
};

type StubSelection = {
  getSelected: () => { getId: () => string } | null;
  clear: ReturnType<typeof vi.fn>;
};

function createStubComposer(overrides?: {
  elements?: Partial<StubElements>;
  selection?: Partial<StubSelection>;
}) {
  const emitted: Array<{ event: string; payload?: unknown }> = [];
  const elements: StubElements = {
    getActivePage: () => ({ id: "p1", name: "Home", root: { id: "r1" } }),
    getAllPages: () => [{ id: "p1", name: "Home", root: { id: "r1" } }],
    setActivePage: vi.fn(),
    createPage: vi.fn(),
    getPage: () => null,
    getElement: () => ({}),
    buildElementTree: vi.fn(),
    ...overrides?.elements,
  };
  const selection: StubSelection = {
    getSelected: () => null,
    clear: vi.fn(),
    ...overrides?.selection,
  };
  return {
    emitted,
    elements,
    selection,
    composer: {
      emit: (event: string, payload?: unknown) => {
        emitted.push({ event, payload });
      },
      elements,
      selection,
    } as unknown as ConstructorParameters<typeof RecoveryManager>[0],
  };
}

/**
 * Force `document.visibilityState` and fire `visibilitychange`.
 * Returns a restore function that removes the instance override so the
 * jsdom prototype getter wins again.
 */
function setVisibility(state: DocumentVisibilityState): () => void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  return () => {
    delete (document as unknown as Record<string, unknown>).visibilityState;
  };
}

describe("RecoveryManager — runtime fault listeners", () => {
  let mgr: RecoveryManager | null = null;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    mgr?.destroy();
    mgr = null;
    sessionStorage.clear();
  });

  it("catches window.error and writes a crash sentinel + emits RUNTIME_FAULT_CAUGHT", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    const err = new Error("boom");
    window.dispatchEvent(new ErrorEvent("error", { error: err, message: err.message }));

    const raw = sessionStorage.getItem(CRASH_SENTINEL_KEY);
    expect(raw).toBeTruthy();
    const record = JSON.parse(raw!);
    expect(record.source).toBe("error");
    expect(record.reason).toBe("boom");
    expect(typeof record.at).toBe("number");

    const emitted = stub.emitted.find((e) => e.event === EVENTS.RUNTIME_FAULT_CAUGHT);
    expect(emitted).toBeTruthy();
    expect(emitted?.payload).toEqual({ source: "error", reason: "boom" });
  });

  it("catches unhandledrejection and writes a crash sentinel", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    const event = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(event, "reason", {
      value: new Error("rejected"),
      configurable: true,
    });
    window.dispatchEvent(event);

    const raw = sessionStorage.getItem(CRASH_SENTINEL_KEY);
    expect(raw).toBeTruthy();
    const record = JSON.parse(raw!);
    expect(record.source).toBe("unhandledrejection");
    expect(record.reason).toBe("rejected");
  });

  it("destroy() removes window listeners — subsequent errors do NOT write a sentinel", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);
    mgr.destroy();
    mgr = null; // afterEach won't double-destroy

    // Swallow the synthetic error so vitest doesn't flag it as uncaught.
    const swallow = (e: Event) => e.preventDefault();
    window.addEventListener("error", swallow);
    try {
      const err = new Error("after destroy");
      window.dispatchEvent(
        new ErrorEvent("error", { error: err, message: err.message, cancelable: true })
      );
    } finally {
      window.removeEventListener("error", swallow);
    }

    expect(sessionStorage.getItem(CRASH_SENTINEL_KEY)).toBeNull();
  });

  it("consumeLastCrash returns and clears the sentinel; wasLastSessionCrashed is non-mutating", () => {
    sessionStorage.setItem(
      CRASH_SENTINEL_KEY,
      JSON.stringify({ at: 123, source: "error", reason: "x" }),
    );

    expect(RecoveryManager.wasLastSessionCrashed()).toBe(true);
    // Read should not clear:
    expect(sessionStorage.getItem(CRASH_SENTINEL_KEY)).not.toBeNull();

    const consumed = RecoveryManager.consumeLastCrash();
    expect(consumed).toEqual({ at: 123, source: "error", reason: "x" });
    expect(sessionStorage.getItem(CRASH_SENTINEL_KEY)).toBeNull();
    expect(RecoveryManager.wasLastSessionCrashed()).toBe(false);
  });

  it("consumeLastCrash returns null when no sentinel exists", () => {
    expect(RecoveryManager.consumeLastCrash()).toBeNull();
  });

  it("consumeLastCrash returns null on a corrupt sentinel (and still removes it)", () => {
    sessionStorage.setItem(CRASH_SENTINEL_KEY, "{not json!!");
    expect(RecoveryManager.consumeLastCrash()).toBeNull();
    // removeItem runs before JSON.parse throws — sentinel is consumed either way.
    expect(sessionStorage.getItem(CRASH_SENTINEL_KEY)).toBeNull();
  });

  it("still emits RUNTIME_FAULT_CAUGHT when sessionStorage.setItem throws (quota / private mode)", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    try {
      const err = new Error("boom-no-storage");
      window.dispatchEvent(new ErrorEvent("error", { error: err, message: err.message }));
    } finally {
      spy.mockRestore();
    }

    const emitted = stub.emitted.find((e) => e.event === EVENTS.RUNTIME_FAULT_CAUGHT);
    expect(emitted?.payload).toEqual({ source: "error", reason: "boom-no-storage" });
    // Recovery still ran to completion after the swallowed storage failure:
    expect(stub.emitted.some((e) => e.event === EVENTS.CANVAS_FORCE_SYNC)).toBe(true);
  });

  it("window.error with no Error object falls back to event.message", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    window.dispatchEvent(new ErrorEvent("error", { message: "bare message" }));

    const record = JSON.parse(sessionStorage.getItem(CRASH_SENTINEL_KEY)!);
    expect(record.reason).toBe("bare message");
  });

  it("unhandledrejection with a non-Error reason stringifies it; null reason becomes 'unknown rejection'", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    const ev1 = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(ev1, "reason", { value: "plain string", configurable: true });
    window.dispatchEvent(ev1);
    expect(JSON.parse(sessionStorage.getItem(CRASH_SENTINEL_KEY)!).reason).toBe("plain string");

    sessionStorage.clear();
    const ev2 = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(ev2, "reason", { value: null, configurable: true });
    window.dispatchEvent(ev2);
    expect(JSON.parse(sessionStorage.getItem(CRASH_SENTINEL_KEY)!).reason).toBe(
      "unknown rejection",
    );
  });
});

describe("RecoveryManager — visibilitychange recovery", () => {
  let mgr: RecoveryManager | null = null;
  let restoreVisibility: (() => void) | null = null;

  afterEach(() => {
    mgr?.destroy();
    mgr = null;
    restoreVisibility?.();
    restoreVisibility = null;
    sessionStorage.clear();
  });

  it("runs recovery (CANVAS_FORCE_SYNC) when the tab becomes visible", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    restoreVisibility = setVisibility("visible");

    expect(stub.emitted.some((e) => e.event === EVENTS.CANVAS_FORCE_SYNC)).toBe(true);
  });

  it("does nothing while the tab is hidden", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    restoreVisibility = setVisibility("hidden");

    expect(stub.emitted).toEqual([]);
  });

  it("destroy() removes the visibilitychange listener; double destroy is safe", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);
    mgr.destroy();
    expect(() => mgr!.destroy()).not.toThrow();
    mgr = null;

    restoreVisibility = setVisibility("visible");

    expect(stub.emitted).toEqual([]);
  });
});

describe("RecoveryManager — recoverFromInactivity state checks", () => {
  let mgr: RecoveryManager | null = null;
  let restoreVisibility: (() => void) | null = null;

  afterEach(() => {
    mgr?.destroy();
    mgr = null;
    restoreVisibility?.();
    restoreVisibility = null;
    sessionStorage.clear();
  });

  /** Trigger the private recoverFromInactivity via visibilitychange. */
  function triggerRecovery() {
    restoreVisibility = setVisibility("visible");
  }

  it("re-activates the first page when the active page is missing but pages exist", () => {
    const stub = createStubComposer({
      elements: {
        getActivePage: () => null,
        getAllPages: () => [
          { id: "pA", name: "A", root: { id: "rA" } },
          { id: "pB", name: "B", root: { id: "rB" } },
        ],
      },
    });
    mgr = new RecoveryManager(stub.composer);

    triggerRecovery();

    expect(stub.elements.setActivePage).toHaveBeenCalledWith("pA");
    expect(stub.elements.createPage).not.toHaveBeenCalled();
    expect(stub.emitted.some((e) => e.event === EVENTS.CANVAS_FORCE_SYNC)).toBe(true);
  });

  it("creates a Home page when no active page AND no pages exist", () => {
    const stub = createStubComposer({
      elements: {
        getActivePage: () => null,
        getAllPages: () => [],
      },
    });
    mgr = new RecoveryManager(stub.composer);

    triggerRecovery();

    expect(stub.elements.createPage).toHaveBeenCalledWith("Home");
    expect(stub.elements.setActivePage).not.toHaveBeenCalled();
  });

  it("clears an invalid selection (selected element no longer exists)", () => {
    const stub = createStubComposer({
      elements: {
        // Root element "r1" resolves; the ghost selection does not.
        getElement: (id?: string) => (id === "r1" ? { id: "r1" } : null),
        getPage: () => ({ id: "p1", name: "Home", root: { id: "r1" } }),
      },
      selection: {
        getSelected: () => ({ getId: () => "ghost-element" }),
      },
    });
    mgr = new RecoveryManager(stub.composer);

    triggerRecovery();

    expect(stub.selection.clear).toHaveBeenCalledTimes(1);
  });

  it("keeps a valid selection", () => {
    const stub = createStubComposer({
      selection: {
        getSelected: () => ({ getId: () => "r1" }),
      },
    });
    mgr = new RecoveryManager(stub.composer);

    triggerRecovery();

    expect(stub.selection.clear).not.toHaveBeenCalled();
    expect(stub.emitted.some((e) => e.event === EVENTS.CANVAS_FORCE_SYNC)).toBe(true);
  });

  it("repairs a missing page root during recovery (Check 2 path)", () => {
    const page = { id: "p1", name: "Home", root: { id: "r-gone" } };
    const stub = createStubComposer({
      elements: {
        getActivePage: () => page,
        getAllPages: () => [page],
        getPage: (id?: string) => (id === "p1" ? page : null),
        getElement: () => null, // root lookup fails
      },
    });
    mgr = new RecoveryManager(stub.composer);

    triggerRecovery();

    expect(stub.elements.buildElementTree).toHaveBeenCalledTimes(1);
    expect(stub.emitted.some((e) => e.event === EVENTS.PAGE_RECOVERED)).toBe(true);
  });

  it("swallows internal errors — a throwing manager never propagates out of recovery", () => {
    const stub = createStubComposer({
      elements: {
        getActivePage: () => {
          throw new Error("state exploded");
        },
      },
    });
    mgr = new RecoveryManager(stub.composer);

    expect(() => triggerRecovery()).not.toThrow();
    // The catch fires before Check 4, so no force-sync is emitted.
    expect(stub.emitted.some((e) => e.event === EVENTS.CANVAS_FORCE_SYNC)).toBe(false);
  });
});

describe("RecoveryManager — ensurePageRootExists", () => {
  let mgr: RecoveryManager | null = null;

  afterEach(() => {
    mgr?.destroy();
    mgr = null;
    sessionStorage.clear();
  });

  it("returns early for an unknown page id", () => {
    const stub = createStubComposer({ elements: { getPage: () => null } });
    mgr = new RecoveryManager(stub.composer);

    mgr.ensurePageRootExists("nope");

    expect(stub.elements.buildElementTree).not.toHaveBeenCalled();
    expect(stub.emitted).toEqual([]);
  });

  it("does nothing when the page root element resolves", () => {
    const page = { id: "p1", name: "Home", root: { id: "r1" } };
    const stub = createStubComposer({
      elements: {
        getPage: () => page,
        getElement: (id?: string) => (id === "r1" ? { id: "r1" } : null),
      },
    });
    mgr = new RecoveryManager(stub.composer);

    mgr.ensurePageRootExists("p1");

    expect(stub.elements.buildElementTree).not.toHaveBeenCalled();
    expect(page.root.id).toBe("r1");
    expect(stub.emitted).toEqual([]);
  });

  it("recreates a missing root: builds the tree, swaps page.root, emits PAGE_RECOVERED", () => {
    const page: { id: string; name: string; root: { id: string } } = {
      id: "p1",
      name: "Home",
      root: { id: "r-gone" },
    };
    const stub = createStubComposer({
      elements: {
        getPage: (id?: string) => (id === "p1" ? page : null),
        getElement: () => null,
      },
    });
    mgr = new RecoveryManager(stub.composer);

    mgr.ensurePageRootExists("p1");

    expect(stub.elements.buildElementTree).toHaveBeenCalledTimes(1);
    const newRoot = stub.elements.buildElementTree.mock.calls[0][0];
    expect(newRoot.id).toMatch(/^root/);
    expect(newRoot.type).toBe("container");
    expect(newRoot.tagName).toBe("div");
    expect(newRoot.classes).toEqual(["buildrick-page-root"]);
    expect(newRoot.children).toEqual([]);

    // page.root is swapped to the freshly built root data.
    expect(page.root).toBe(newRoot);

    const recovered = stub.emitted.find((e) => e.event === EVENTS.PAGE_RECOVERED);
    expect(recovered?.payload).toEqual({ page });
  });
});

describe("RecoveryManager — validateAllPages / validateSelection", () => {
  let mgr: RecoveryManager | null = null;

  afterEach(() => {
    mgr?.destroy();
    mgr = null;
    sessionStorage.clear();
  });

  it("validateAllPages returns true when every page root resolves", () => {
    const pages = [
      { id: "p1", name: "A", root: { id: "r1" } },
      { id: "p2", name: "B", root: { id: "r2" } },
    ];
    const stub = createStubComposer({
      elements: {
        getAllPages: () => pages,
        getElement: (id?: string) => (id === "r1" || id === "r2" ? { id } : null),
      },
    });
    mgr = new RecoveryManager(stub.composer);

    expect(mgr.validateAllPages()).toBe(true);
    expect(stub.elements.buildElementTree).not.toHaveBeenCalled();
  });

  it("validateAllPages returns false AND repairs the broken page", () => {
    const good = { id: "p1", name: "A", root: { id: "r1" } };
    const broken = { id: "p2", name: "B", root: { id: "r-gone" } };
    const stub = createStubComposer({
      elements: {
        getAllPages: () => [good, broken],
        getPage: (id?: string) => (id === "p1" ? good : id === "p2" ? broken : null),
        getElement: (id?: string) => (id === "r1" ? { id } : null),
      },
    });
    mgr = new RecoveryManager(stub.composer);

    expect(mgr.validateAllPages()).toBe(false);
    expect(stub.elements.buildElementTree).toHaveBeenCalledTimes(1);
    expect(broken.root.id).toMatch(/^root/);
    expect(stub.emitted.some((e) => e.event === EVENTS.PAGE_RECOVERED)).toBe(true);
  });

  it("validateSelection returns true when nothing is selected", () => {
    const stub = createStubComposer();
    mgr = new RecoveryManager(stub.composer);

    expect(mgr.validateSelection()).toBe(true);
    expect(stub.selection.clear).not.toHaveBeenCalled();
  });

  it("validateSelection returns true for a resolvable selection", () => {
    const stub = createStubComposer({
      elements: { getElement: (id?: string) => (id === "el-1" ? { id } : null) },
      selection: { getSelected: () => ({ getId: () => "el-1" }) },
    });
    mgr = new RecoveryManager(stub.composer);

    expect(mgr.validateSelection()).toBe(true);
    expect(stub.selection.clear).not.toHaveBeenCalled();
  });

  it("validateSelection clears and returns false for a dangling selection", () => {
    const stub = createStubComposer({
      elements: { getElement: () => null },
      selection: { getSelected: () => ({ getId: () => "ghost" }) },
    });
    mgr = new RecoveryManager(stub.composer);

    expect(mgr.validateSelection()).toBe(false);
    expect(stub.selection.clear).toHaveBeenCalledTimes(1);
  });
});
