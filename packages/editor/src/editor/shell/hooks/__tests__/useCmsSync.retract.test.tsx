/**
 * The stranded-mirror notice has to come DOWN, not just stop repeating.
 *
 * It is `duration: Infinity` and asserts the change is not on the server. Two
 * paths left that assertion standing after it stopped being true: a retry that
 * SUCCEEDED (nothing fired — `SyncRetryQueue.run` cleared the key silently),
 * and the queue draining on its own `online` replay. A retry that failed again
 * was worse: the click reset the latch, the subscriber fired, and a second
 * identical permanent toast stacked beside the first.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let errCb: ((info: { pending: number }) => void) | null = null;
let pending = 0;
const retrySpy = vi.fn(() => Promise.resolve());
let conflictCb: ((c: { kind: string; id: string; keepMine: () => Promise<void>; useTheirs: () => Promise<void> }) => void) | null = null;
let goneCb: ((g: { kind: string; id: string; message: string }) => void) | null = null;
const flushSpy = vi.fn(() => Promise.resolve());

vi.mock("../../../../services/cmsSync", () => ({
  bindCmsEngine: () => () => {},
  hydrateCmsFromServer: () => Promise.resolve(),
  flushCmsOutbox: () => flushSpy(),
  onCmsGone: (cb: typeof goneCb) => {
    goneCb = cb;
    return () => {
      goneCb = null;
    };
  },
  onCmsSyncError: (cb: (info: { pending: number }) => void) => {
    errCb = cb;
    return () => {
      errCb = null;
    };
  },
  onCmsConflict: (cb: typeof conflictCb) => {
    conflictCb = cb;
    return () => {
      conflictCb = null;
    };
  },
  getCmsSyncPendingCount: () => pending,
  retryCmsSync: () => retrySpy(),
  syncCollectionUpsert: vi.fn(),
  syncCollectionDelete: vi.fn(),
  syncEntryUpsert: vi.fn(),
  syncEntryDelete: vi.fn(),
}));

const dismissed: string[] = [];
vi.mock("@/editor/chrome-ui", () => ({
  dismissToast: (id: string) => dismissed.push(id),
}));

import { useCmsSync } from "../useCmsSync";
import type { Composer } from "@/engine/Composer";

function stubComposer() {
  return {
    cms: { collections: { on: vi.fn(), off: vi.fn(), refreshFromStorage: vi.fn() } },
  } as unknown as Composer;
}

describe("useCmsSync — the failure notice retracts", () => {
  type Btn = { onClick: () => void };
  let added: Array<{ id: string; action?: Btn; secondaryAction?: Btn; description?: string; tone?: string }>;
  let addToast: (input: { action?: Btn; secondaryAction?: Btn; description?: string; tone?: string }) => string;

  beforeEach(() => {
    errCb = null;
    pending = 0;
    dismissed.length = 0;
    retrySpy.mockClear();
    added = [];
    let seq = 0;
    addToast = (input) => {
      const id = `t${++seq}`;
      added.push({ id, ...input });
      return id;
    };
  });

  it("raises exactly one notice for a burst of failures", () => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    errCb?.({ pending: 1 });
    errCb?.({ pending: 2 });
    expect(added).toHaveLength(1);
  });

  it("takes the notice down when the queue drains on its own", () => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    errCb?.({ pending: 1 });
    expect(added).toHaveLength(1);
    /* The `online` replay clears the queue with no UI involved; before the
       drain notification existed, this toast simply stayed. */
    errCb?.({ pending: 0 });
    expect(dismissed).toEqual(["t1"]);
  });

  it("Retry takes the current notice down first, so a second failure cannot stack", () => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    errCb?.({ pending: 1 });
    added[0].action?.onClick();
    expect(dismissed).toEqual(["t1"]);
    expect(retrySpy).toHaveBeenCalled();

    // Still failing: one fresh notice, not two on screen.
    errCb?.({ pending: 1 });
    expect(added).toHaveLength(2);
    expect(dismissed).toEqual(["t1"]);
  });

  it("a successful Retry leaves nothing behind", () => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    errCb?.({ pending: 1 });
    added[0].action?.onClick();
    errCb?.({ pending: 0 });
    expect(dismissed).toEqual(["t1"]);
    expect(added).toHaveLength(1);
  });

  it("replays the outbox on open (C0.5)", () => {
    flushSpy.mockClear();
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Keep mine", "secondaryAction", "keepMine"],
    ["Use theirs", "action", "useTheirs"],
  ] as const)("the conflict toast comes down when %s is pressed", (_label, button, choice) => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    const c = { kind: "entry", id: "e1", keepMine: vi.fn(() => Promise.resolve()), useTheirs: vi.fn(() => Promise.resolve()) };
    conflictCb?.(c);
    expect(added).toHaveLength(1);
    added[0][button]?.onClick();
    expect(dismissed).toEqual([added[0].id]);
    expect(c[choice]).toHaveBeenCalledTimes(1);
  });

  it("an edit to a row deleted elsewhere is announced in the server's words", () => {
    renderHook(() => useCmsSync(stubComposer(), addToast as never));
    goneCb?.({ kind: "entry", id: "e1", message: "This record was deleted." });
    expect(added).toEqual([expect.objectContaining({ tone: "warning", description: "This record was deleted." })]);
  });
});
