/**
 * helpers/result — Result constructors, try-catch wrappers, unwrappers.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { ok, err, tryCatch, tryCatchAsync, unwrap, unwrapOr } from "../result";

describe("ok / err", () => {
  it("builds success and error results", () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 });
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });
});

describe("tryCatch", () => {
  it("captures a return value as ok", () => {
    expect(tryCatch(() => 42)).toEqual({ ok: true, value: 42 });
  });
  it("captures a thrown error as err", () => {
    const r = tryCatch(() => {
      throw new Error("fail");
    });
    expect(r.ok).toBe(false);
    expect((r as { error: Error }).error.message).toBe("fail");
  });
});

describe("tryCatchAsync", () => {
  it("captures a resolved value as ok", async () => {
    await expect(tryCatchAsync(async () => 7)).resolves.toEqual({ ok: true, value: 7 });
  });
  it("captures a rejection as err", async () => {
    const r = await tryCatchAsync(async () => {
      throw new Error("nope");
    });
    expect(r.ok).toBe(false);
    expect((r as { error: Error }).error.message).toBe("nope");
  });
});

describe("unwrap / unwrapOr", () => {
  it("unwrap returns the value on success", () => {
    expect(unwrap(ok(9))).toBe(9);
  });
  it("unwrap throws the error on failure", () => {
    expect(() => unwrap(err(new Error("x")))).toThrow("x");
  });
  it("unwrapOr returns value or the default", () => {
    expect(unwrapOr(ok(1), 99)).toBe(1);
    expect(unwrapOr(err("e"), 99)).toBe(99);
  });
});
