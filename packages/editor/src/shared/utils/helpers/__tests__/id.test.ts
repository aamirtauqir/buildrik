/**
 * ID helper tests — generateId/uuid/nanoId formats, sequential generator,
 * and deterministic string hashing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { generateId, uuid, nanoId, createSequentialId, hashString } from "../id";

describe("generateId", () => {
  it("uses the default 'aqb' prefix with timestamp + random segments", () => {
    expect(generateId()).toMatch(/^aqb-[0-9a-z]+-[0-9a-z]+$/);
  });

  it("accepts a custom prefix", () => {
    expect(generateId("el")).toMatch(/^el-[0-9a-z]+-[0-9a-z]+$/);
  });

  it("produces unique ids across calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("uuid", () => {
  it("emits RFC-4122 v4 format (version nibble 4, variant 8-b)", () => {
    for (let i = 0; i < 20; i++) {
      expect(uuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it("produces unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
  });
});

describe("nanoId", () => {
  it("defaults to 21 URL-safe characters", () => {
    const id = nanoId();
    expect(id).toHaveLength(21);
    expect(id).toMatch(/^[0-9A-Za-z_-]+$/);
  });

  it("respects a custom size", () => {
    expect(nanoId(8)).toHaveLength(8);
    expect(nanoId(64)).toHaveLength(64);
  });
});

describe("createSequentialId", () => {
  it("increments from 1 with the given prefix", () => {
    const next = createSequentialId("item-");
    expect(next()).toBe("item-1");
    expect(next()).toBe("item-2");
  });

  it("supports a custom start and independent counters", () => {
    const a = createSequentialId("a", 5);
    const b = createSequentialId("b");
    expect(a()).toBe("a5");
    expect(a()).toBe("a6");
    expect(b()).toBe("b1"); // counters do not share state
  });
});

describe("hashString", () => {
  it("is deterministic for the same input", () => {
    expect(hashString("hello world")).toBe(hashString("hello world"));
  });

  it("differs for different inputs and is base36", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
    expect(hashString("some string")).toMatch(/^[0-9a-z]+$/);
  });

  it("hashes the empty string to '0'", () => {
    expect(hashString("")).toBe("0");
  });
});
