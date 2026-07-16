/**
 * Async helper tests — wait, retry backoff, timeout race, bounded parallel,
 * series ordering, and debounceAsync supersession.
 *
 * Uses real timers with millisecond delays: fake timers interleave badly with
 * promise chains inside retry/parallel.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { wait, retry, timeout, parallel, series, debounceAsync } from "../async";

describe("wait", () => {
  it("resolves after roughly the requested time", async () => {
    const start = Date.now();
    await wait(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });
});

describe("retry", () => {
  it("returns the first successful result without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(retry(fn, { delay: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries failures and succeeds on a later attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockRejectedValueOnce(new Error("fail-2"))
      .mockResolvedValue("ok");

    const onRetry = vi.fn();
    await expect(retry(fn, { attempts: 3, delay: 1, onRetry })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
  });

  it("throws the LAST error after exhausting attempts", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("last"));

    await expect(retry(fn, { attempts: 2, delay: 1 })).rejects.toThrow("last");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("wraps non-Error rejections in Error", async () => {
    const fn = vi.fn().mockRejectedValue("string-reason");
    await expect(retry(fn, { attempts: 1, delay: 1 })).rejects.toBeInstanceOf(Error);
  });
});

describe("timeout", () => {
  it("resolves when the promise settles before the deadline", async () => {
    await expect(timeout(Promise.resolve("fast"), 50)).resolves.toBe("fast");
  });

  it("rejects with the default message when the deadline passes", async () => {
    const never = new Promise<never>(() => {});
    await expect(timeout(never, 10)).rejects.toThrow("Operation timed out");
  });

  it("rejects with a custom message", async () => {
    const never = new Promise<never>(() => {});
    await expect(timeout(never, 10, "too slow")).rejects.toThrow("too slow");
  });
});

describe("parallel", () => {
  it("preserves input order in the results regardless of completion order", async () => {
    const tasks = [
      () => wait(15).then(() => "slow"),
      () => Promise.resolve("fast"),
      () => wait(5).then(() => "mid"),
    ];
    await expect(parallel(tasks)).resolves.toEqual(["slow", "fast", "mid"]);
  });

  // BUG (audit): the concurrency limiter splices the MOST RECENTLY PUSHED
  // promise out of `executing` after Promise.race, not the promise that
  // settled. The pool fills with already-settled promises, race resolves
  // immediately, and new tasks start unbounded (observed peak 4 with limit 2).
  // The final `Promise.all(executing)` can also resolve before late tasks
  // settle, leaving holes in `results`. Pin the fix with:
  //   peak concurrent tasks <= limit, and results complete for slow tasks.
  it.todo("BUG: parallel(tasks, n) does not enforce the concurrency limit (wrong promise spliced after race)");
});

describe("series", () => {
  it("runs tasks one at a time in order", async () => {
    const order: string[] = [];
    const mk = (name: string, ms: number) => async () => {
      order.push(`start-${name}`);
      await wait(ms);
      order.push(`end-${name}`);
      return name;
    };

    const results = await series([mk("a", 10), mk("b", 1)]);
    expect(results).toEqual(["a", "b"]);
    // b never starts before a finishes.
    expect(order).toEqual(["start-a", "end-a", "start-b", "end-b"]);
  });
});

describe("debounceAsync", () => {
  it("rejects superseded calls with 'Debounced' and resolves the last", async () => {
    const fn = vi.fn(async (n: number) => n * 2);
    const d = debounceAsync(fn, 10);

    const p1 = d(1);
    const p1Rejection = p1.catch((e: Error) => e.message);
    const p2 = d(2);

    await expect(p2).resolves.toBe(4);
    await expect(p1Rejection).resolves.toBe("Debounced");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it("propagates the wrapped function's rejection", async () => {
    const d = debounceAsync(async () => {
      throw new Error("inner");
    }, 5);
    await expect(d()).rejects.toThrow("inner");
  });
});
