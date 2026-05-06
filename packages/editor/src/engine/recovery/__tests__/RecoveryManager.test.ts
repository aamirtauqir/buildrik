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

function createStubComposer() {
  const emitted: Array<{ event: string; payload?: unknown }> = [];
  return {
    emitted,
    composer: {
      emit: (event: string, payload?: unknown) => {
        emitted.push({ event, payload });
      },
      elements: {
        getActivePage: () => ({ id: "p1", name: "Home", root: { id: "r1" } }),
        getAllPages: () => [{ id: "p1", name: "Home", root: { id: "r1" } }],
        setActivePage: vi.fn(),
        createPage: vi.fn(),
        getPage: () => null,
        getElement: () => ({}),
      },
      selection: {
        getSelected: () => null,
        clear: vi.fn(),
      },
    } as unknown as ConstructorParameters<typeof RecoveryManager>[0],
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
});
