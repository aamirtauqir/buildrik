/**
 * `SyncRetryQueue` — the two behaviours the stranded-mirror notices depend on:
 * the queue tells subscribers when it DRAINS (not only when it fails), and the
 * total across every domain is readable from one place.
 *
 * Both were missing. A retry that succeeded fired nothing, so the permanent
 * "not on the server" toast stood over work that had already synced; and the
 * exit guards had no number to consult, so a clean project with a full queue
 * left silently and took the queue — a Map of closures — with it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { SyncRetryQueue, totalPendingMirrors, registerPendingSource } from "../syncRetryQueue";

describe("SyncRetryQueue — draining is an event, not just a state", () => {
  it("notifies when a queued op finally succeeds", async () => {
    const q = new SyncRetryQueue();
    const seen: number[] = [];
    q.onError(({ pending }) => seen.push(pending));

    const task = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(undefined);
    expect(await q.run("a", task, () => {})).toBe(false);
    expect(seen).toEqual([1]);

    await q.retry();
    expect(q.pendingCount()).toBe(0);
    /* The second entry is the drain. Without it nothing on screen could learn
       the failure had been fixed. */
    expect(seen).toEqual([1, 0]);
  });

  it("stays quiet when a first-time mirror succeeds — nothing was pending", async () => {
    const q = new SyncRetryQueue();
    const seen: number[] = [];
    q.onError(({ pending }) => seen.push(pending));
    expect(await q.run("a", async () => undefined, () => {})).toBe(true);
    expect(seen).toEqual([]);
  });

  it("a repeated failure re-queues the same target once, and says so each time", async () => {
    const q = new SyncRetryQueue();
    const seen: number[] = [];
    q.onError(({ pending }) => seen.push(pending));
    const task = vi.fn().mockRejectedValue(new Error("down"));
    await q.run("a", task, () => {});
    await q.retry();
    expect(q.pendingCount()).toBe(1);
    expect(seen).toEqual([1, 1]);
  });

  it("drop() forgets an op without replaying it", async () => {
    const q = new SyncRetryQueue();
    await q.run("a", async () => { throw new Error("down"); }, () => {});
    expect(q.pendingCount()).toBe(1);
    q.drop("a");
    expect(q.pendingCount()).toBe(0);
  });

  /* A supersession changes the pending count too. The delete paths call
     `drop()` on the matching upsert and then `run()` a delete that usually
     succeeds first try — which cannot notify, because nothing was ever queued
     under the delete's own key. Without this the queue reached zero in silence
     and the permanent notice stood over an empty queue. */
  it("notifies when drop() supersedes a queued op", async () => {
    const q = new SyncRetryQueue();
    const seen: number[] = [];
    await q.run("upsert:1", async () => { throw new Error("down"); }, () => {});
    q.onError(({ pending }) => seen.push(pending));
    q.drop("upsert:1");
    expect(seen).toEqual([0]);
  });

  it("drop() of a key that was never queued says nothing", () => {
    const q = new SyncRetryQueue();
    const seen: number[] = [];
    q.onError(({ pending }) => seen.push(pending));
    q.drop("never-queued");
    expect(seen).toEqual([]);
  });
});

describe("totalPendingMirrors", () => {
  /* Keyed by domain, NOT a set of queue instances. Registering instances has no
     removal path, so a dev hot-reload of a sync module leaves the abandoned
     queue counted forever — the exit guard then warns about work no live queue
     is carrying. Re-registering the same domain replaces the stale reader. */
  it("sums one reader per domain", () => {
    let a = 0;
    let b = 0;
    registerPendingSource("test-a", () => a);
    registerPendingSource("test-b", () => b);
    const base = totalPendingMirrors();
    a = 2;
    b = 3;
    expect(totalPendingMirrors()).toBe(base + 5);
    a = 0;
    b = 0;
    expect(totalPendingMirrors()).toBe(base);
  });

  it("a re-registered domain REPLACES its reader rather than adding one", () => {
    registerPendingSource("test-hmr", () => 4);
    const withStale = totalPendingMirrors();
    registerPendingSource("test-hmr", () => 1);
    expect(totalPendingMirrors()).toBe(withStale - 3);
    registerPendingSource("test-hmr", () => 0);
  });

  it("an ad-hoc queue that registers nothing cannot contaminate the total", async () => {
    const before = totalPendingMirrors();
    const q = new SyncRetryQueue();
    await q.run("x", async () => { throw new Error("down"); }, () => {});
    expect(q.pendingCount()).toBe(1);
    expect(totalPendingMirrors()).toBe(before);
  });
});
