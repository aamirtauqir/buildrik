/**
 * S-12 / A16-6: patches arrive from other collaborators. A path through
 * `__proto__`, `constructor` or `prototype` wrote onto Object.prototype in
 * every connected browser; a value carrying a `__proto__` key re-parented the
 * cloned object. Both are refused.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, it, expect } from "vitest";
import { applyPatch, type Patch } from "../JsonPatch";

afterEach(() => {
  delete (Object.prototype as Record<string, unknown>).polluted;
});

describe("applyPatch refuses prototype keys", () => {
  it.each(["/__proto__/polluted", "/constructor/prototype/polluted", "/a/prototype"])(
    "throws on %s and leaves Object.prototype alone",
    (path) => {
      const patch: Patch = [{ op: "add", path, value: "yes" }];
      expect(() => applyPatch({ a: {} }, patch)).toThrow(/prototype key/);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    }
  );

  it("drops a __proto__ key inside an added value", () => {
    const value = JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}');
    const out = applyPatch({ a: {} } as Record<string, unknown>, [{ op: "add", path: "/b", value }]);
    const b = out.b as Record<string, unknown>;
    expect(b.ok).toBe(1);
    expect(b.polluted).toBeUndefined();
    expect(Object.getPrototypeOf(b)).toBe(Object.prototype);
  });

  it("still applies an ordinary patch", () => {
    expect(applyPatch({ a: { x: 1 } }, [{ op: "replace", path: "/a/x", value: 2 }])).toEqual({ a: { x: 2 } });
  });
});
