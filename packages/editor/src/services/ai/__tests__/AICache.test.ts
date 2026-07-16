/**
 * AICache tests — TTL expiry, FIFO eviction at capacity, key generation,
 * pattern invalidation. Encodes the FIFO-not-LRU eviction bug as current
 * behavior + it.todo.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { AICache, aiCache } from "../AICache";

describe("AICache key generation", () => {
  it("builds the key as endpoint:JSON(body)", () => {
    const cache = new AICache();
    expect(cache.generateKey("ai.content", { prompt: "hi", type: "content" })).toBe(
      'ai.content:{"prompt":"hi","type":"content"}'
    );
  });

  it("different bodies produce different keys", () => {
    const cache = new AICache();
    expect(cache.generateKey("ep", { a: 1 })).not.toBe(cache.generateKey("ep", { a: 2 }));
    expect(cache.generateKey("ep1", { a: 1 })).not.toBe(cache.generateKey("ep2", { a: 1 }));
  });

  it("is property-order sensitive (JSON.stringify semantics)", () => {
    const cache = new AICache();
    // Same logical body, different insertion order = different cache slots.
    expect(cache.generateKey("ep", { a: 1, b: 2 })).not.toBe(
      cache.generateKey("ep", { b: 2, a: 1 })
    );
  });
});

describe("AICache get/set", () => {
  it("round-trips a value and reports size", () => {
    const cache = new AICache();
    cache.set("ep", { q: 1 }, { answer: 42 });
    expect(cache.get("ep", { q: 1 })).toEqual({ answer: 42 });
    expect(cache.getStats()).toEqual({ size: 1, maxSize: 100 });
  });

  it("returns null on miss", () => {
    const cache = new AICache();
    expect(cache.get("ep", { q: "nope" })).toBeNull();
  });

  it("the shared aiCache singleton defaults to 100 entries", () => {
    expect(aiCache.getStats().maxSize).toBe(100);
  });
});

describe("AICache TTL expiry (default 5 min)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("serves the entry up to the 5-minute default TTL, then expires it", () => {
    vi.useFakeTimers();
    const cache = new AICache();
    cache.set("ep", { q: 1 }, "fresh");

    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    expect(cache.get("ep", { q: 1 })).toBe("fresh");

    // Expiry check is strict (> ttl), so one ms past the boundary kills it.
    vi.advanceTimersByTime(2);
    expect(cache.get("ep", { q: 1 })).toBeNull();
  });

  it("deletes the expired entry on read (size shrinks)", () => {
    vi.useFakeTimers();
    const cache = new AICache();
    cache.set("ep", { q: 1 }, "fresh");
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    cache.get("ep", { q: 1 });
    expect(cache.getStats().size).toBe(0);
  });

  it("honors a per-entry TTL override on set()", () => {
    vi.useFakeTimers();
    const cache = new AICache();
    cache.set("ep", { q: 1 }, "short-lived", 1000);
    vi.advanceTimersByTime(999);
    expect(cache.get("ep", { q: 1 })).toBe("short-lived");
    vi.advanceTimersByTime(2);
    expect(cache.get("ep", { q: 1 })).toBeNull();
  });

  it("honors a custom defaultTTL from the constructor", () => {
    vi.useFakeTimers();
    const cache = new AICache(100, 2000);
    cache.set("ep", { q: 1 }, "v");
    vi.advanceTimersByTime(2001);
    expect(cache.get("ep", { q: 1 })).toBeNull();
  });
});

describe("AICache FIFO eviction at capacity", () => {
  it("evicts the oldest-inserted entry when full", () => {
    const cache = new AICache(3);
    cache.set("ep", { i: 1 }, "one");
    cache.set("ep", { i: 2 }, "two");
    cache.set("ep", { i: 3 }, "three");
    cache.set("ep", { i: 4 }, "four"); // evicts {i:1}

    expect(cache.get("ep", { i: 1 })).toBeNull();
    expect(cache.get("ep", { i: 2 })).toBe("two");
    expect(cache.get("ep", { i: 4 })).toBe("four");
    expect(cache.getStats().size).toBe(3);
  });

  it("evicts by insertion age at the default 100-entry cap", () => {
    const cache = new AICache();
    for (let i = 0; i < 100; i++) cache.set("ep", { i }, i);
    expect(cache.getStats().size).toBe(100);

    cache.set("ep", { i: 100 }, 100);
    expect(cache.getStats().size).toBe(100);
    expect(cache.get("ep", { i: 0 })).toBeNull(); // first-in got evicted
    expect(cache.get("ep", { i: 1 })).toBe(1);
    expect(cache.get("ep", { i: 100 })).toBe(100);
  });

  it("CURRENT BEHAVIOR: a hot (recently read) entry is still evicted first", () => {
    const cache = new AICache(2);
    cache.set("ep", { i: "A" }, "a");
    cache.set("ep", { i: "B" }, "b");
    expect(cache.get("ep", { i: "A" })).toBe("a"); // A is hot
    cache.set("ep", { i: "C" }, "c"); // evicts A anyway — pure FIFO

    expect(cache.get("ep", { i: "A" })).toBeNull();
    expect(cache.get("ep", { i: "B" })).toBe("b");
    expect(cache.get("ep", { i: "C" })).toBe("c");
  });

  it.todo("BUG: FIFO not LRU — hot entries evicted by age; get() should refresh recency");
});

describe("AICache invalidate", () => {
  it("clears everything when called without a pattern", () => {
    const cache = new AICache();
    cache.set("ai.content", { q: 1 }, "a");
    cache.set("ai.layout", { q: 1 }, "b");
    cache.invalidate();
    expect(cache.getStats().size).toBe(0);
  });

  it("removes only keys containing the pattern", () => {
    const cache = new AICache();
    cache.set("ai.content", { q: 1 }, "a");
    cache.set("ai.layout", { q: 1 }, "b");
    cache.invalidate("ai.content");
    expect(cache.get("ai.content", { q: 1 })).toBeNull();
    expect(cache.get("ai.layout", { q: 1 })).toBe("b");
  });
});
