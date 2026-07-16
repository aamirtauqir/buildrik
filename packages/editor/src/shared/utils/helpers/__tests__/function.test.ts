/**
 * Function helper tests — debounce/throttle timing contracts, memoize cache
 * semantics, once, and composition utilities.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce, throttle, memoize, once, pipe, compose, curry, partial, negate } from "../function";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("trailing (default): fires once with the LAST args after the delay", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);

    d("a");
    d("b");
    d("c");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("leading: fires immediately on the first call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true });

    d("first");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("first");
  });

  it("leading + trailing: a second call within the window fires trailing with its args", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true });

    d("first"); // leading fire
    d("second"); // schedules trailing
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, "second");
  });

  it("cancel() drops the pending invocation", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);

    d("x");
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    expect(d.pending()).toBe(false);
  });

  it("flush() invokes the pending call immediately", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);

    d("x");
    d.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("x");

    // Nothing left to fire.
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("pending() reflects whether a timer is armed", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);

    expect(d.pending()).toBe(false);
    d("x");
    expect(d.pending()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(d.pending()).toBe(false);
  });

  it("trailing: false suppresses the delayed invocation", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { trailing: false });

    d("x");
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("leading (default): first call fires immediately, burst collapses to trailing", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);

    t("a");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    t("b");
    t("c");
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, "c");
  });

  it("leading: false defers the first call to the trailing edge", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100, { leading: false });

    t("a");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("trailing: false drops calls made inside the window", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100, { trailing: false });

    t("a");
    t("b");
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("cancel() clears window state and the pending trailing call", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);

    t("a");
    t("b");
    t.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1); // only the leading fire

    // Window reset — next call is a fresh leading fire.
    t("c");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, "c");
  });
});

describe("memoize", () => {
  it("caches by JSON-stringified args", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const m = memoize(fn);

    expect(m(1, 2)).toBe(3);
    expect(m(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(m(2, 2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("supports a custom resolver", () => {
    const fn = vi.fn((obj: { id: string; noise: number }) => obj.id);
    const m = memoize(fn, { resolver: (obj) => obj.id });

    m({ id: "a", noise: 1 });
    m({ id: "a", noise: 2 }); // same resolver key → cache hit
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("evicts the oldest entry at maxSize (FIFO)", () => {
    const fn = vi.fn((n: number) => n * 2);
    const m = memoize(fn, { maxSize: 2 });

    m(1);
    m(2);
    m(3); // evicts key for 1
    expect(fn).toHaveBeenCalledTimes(3);

    m(3); // still cached
    expect(fn).toHaveBeenCalledTimes(3);

    m(1); // was evicted → recompute
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("exposes cache and clear()", () => {
    const m = memoize((n: number) => n);
    m(1);
    expect(m.cache.size).toBe(1);
    m.clear();
    expect(m.cache.size).toBe(0);
  });
});

describe("once", () => {
  it("runs the function a single time and replays the first result", () => {
    const fn = vi.fn((n: number) => n * 10);
    const o = once(fn);

    expect(o(1)).toBe(10);
    expect(o(2)).toBe(10); // later args ignored
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("composition", () => {
  const inc = (n: number) => n + 1;
  const dbl = (n: number) => n * 2;

  it("pipe applies left to right", () => {
    expect(pipe(inc, dbl)(3)).toBe(8); // (3+1)*2
  });

  it("compose applies right to left", () => {
    expect(compose(inc, dbl)(3)).toBe(7); // (3*2)+1
  });

  it("curry accepts arguments incrementally or all at once", () => {
    const add3 = (a: number, b: number, c: number) => a + b + c;
    const curried = curry(add3) as unknown as (
      ...args: number[]
    ) => number | ((...rest: number[]) => unknown);

    expect(curry(add3)(1, 2, 3)).toBe(6);

    const step1 = curried(1) as (...rest: number[]) => unknown;
    const step2 = step1(2) as (...rest: number[]) => unknown;
    expect(step2(3)).toBe(6);
    expect(step1(2, 3)).toBe(6);
  });

  it("partial pre-applies leading arguments", () => {
    const join = (a: string, b: string, c: string) => `${a}-${b}-${c}`;
    const p = partial(join, "x", "y");
    expect(p("z")).toBe("x-y-z");
  });

  it("negate inverts a predicate", () => {
    const isEven = (n: number) => n % 2 === 0;
    const isOdd = negate(isEven);
    expect(isOdd(3)).toBe(true);
    expect(isOdd(4)).toBe(false);
  });
});
