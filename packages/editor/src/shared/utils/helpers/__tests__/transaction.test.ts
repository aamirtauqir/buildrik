/**
 * helpers/transaction — runTransaction wrapper.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { runTransaction } from "../transaction";

describe("runTransaction", () => {
  it("runs the fn directly when no composer is given", () => {
    const fn = vi.fn();
    runTransaction(null, "label", fn);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("brackets the fn with begin/endTransaction", () => {
    const order: string[] = [];
    const composer = {
      beginTransaction: (l: string) => order.push(`begin:${l}`),
      endTransaction: () => order.push("end"),
    };
    runTransaction(composer, "move", () => order.push("work"));
    expect(order).toEqual(["begin:move", "work", "end"]);
  });

  it("still calls endTransaction if the fn throws", () => {
    const end = vi.fn();
    const composer = { beginTransaction: vi.fn(), endTransaction: end };
    expect(() =>
      runTransaction(composer, "x", () => {
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(end).toHaveBeenCalledOnce();
  });

  it("tolerates a composer missing the transaction methods", () => {
    const fn = vi.fn();
    expect(() => runTransaction({}, "x", fn)).not.toThrow();
    expect(fn).toHaveBeenCalledOnce();
  });
});
