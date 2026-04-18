import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { safeGet, safeSet, safeRemove } from "../safeStorage";

describe("safeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage disabled");
      });
      expect(safeGet("any")).toBeNull();
    });
  });

  describe("safeSet", () => {
    it("writes value and returns true", () => {
      expect(safeSet("k", "v")).toBe(true);
      expect(localStorage.getItem("k")).toBe("v");
    });

    it("returns false on QuotaExceededError without throwing", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
      expect(() => safeSet("k", "v")).not.toThrow();
      expect(safeSet("k", "v")).toBe(false);
    });
  });

  describe("safeRemove", () => {
    it("removes key and returns true", () => {
      localStorage.setItem("k", "v");
      expect(safeRemove("k")).toBe(true);
      expect(localStorage.getItem("k")).toBeNull();
    });

    it("returns false on throw without bubbling", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("nope");
      });
      expect(() => safeRemove("k")).not.toThrow();
      expect(safeRemove("k")).toBe(false);
    });
  });
});
