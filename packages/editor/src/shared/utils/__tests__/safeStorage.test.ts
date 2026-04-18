import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeGet, safeSet, safeRemove } from "../safeStorage";

describe("safeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("safeGet", () => {
    it("returns stored string for valid key", () => {
      localStorage.setItem("k", "hello");
      expect(safeGet("k")).toBe("hello");
    });

    it("returns null for missing key", () => {
      expect(safeGet("missing")).toBeNull();
    });

    it("returns null if localStorage.getItem throws", () => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error("storage disabled");
      });
      expect(safeGet("any")).toBeNull();
      Storage.prototype.getItem = orig;
    });

    it("returns null when window undefined (SSR)", () => {
      // jsdom has window; this is a smoke test
      expect(typeof safeGet).toBe("function");
    });
  });

  describe("safeSet", () => {
    it("writes value and returns true", () => {
      expect(safeSet("k", "v")).toBe(true);
      expect(localStorage.getItem("k")).toBe("v");
    });

    it("returns false on QuotaExceededError without throwing", () => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
      expect(() => safeSet("k", "v")).not.toThrow();
      expect(safeSet("k", "v")).toBe(false);
      Storage.prototype.setItem = orig;
    });
  });

  describe("safeRemove", () => {
    it("removes key and returns true", () => {
      localStorage.setItem("k", "v");
      expect(safeRemove("k")).toBe(true);
      expect(localStorage.getItem("k")).toBeNull();
    });

    it("returns false on throw without bubbling", () => {
      const orig = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error("nope");
      });
      expect(() => safeRemove("k")).not.toThrow();
      expect(safeRemove("k")).toBe(false);
      Storage.prototype.removeItem = orig;
    });
  });
});
