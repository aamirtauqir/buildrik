/**
 * useTokenUsageMap — guard regression test.
 *
 * Locks the 2026-05-23 fix for the "Something went wrong" crash on
 * Design / Settings / Publish / History tabs. Root cause was
 * `extractElementIdFromSelector(undefined)` throwing inside useMemo,
 * which the InspectorErrorBoundary above DesignSystemTab caught and
 * rendered as the fallback for every panel sharing the boundary.
 *
 * The contract says StyleData.selector is `string`, but project
 * payloads from older clients have landed with selector=undefined.
 * Consumer-side guard keeps the panel alive.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { extractElementIdFromSelector } from "../useTokenUsageMap";

describe("extractElementIdFromSelector — undefined-safe", () => {
  it("returns null for undefined input (regression — the crash source)", () => {
    expect(extractElementIdFromSelector(undefined)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(extractElementIdFromSelector(null)).toBeNull();
  });

  it("returns null for non-string input (number, object)", () => {
    expect(extractElementIdFromSelector(42)).toBeNull();
    expect(extractElementIdFromSelector({})).toBeNull();
    expect(extractElementIdFromSelector([])).toBeNull();
  });

  it("returns id for valid selector", () => {
    expect(extractElementIdFromSelector('[data-buildrick-id="abc"]')).toBe("abc");
  });

  it("returns id for selector with pseudo-state", () => {
    expect(extractElementIdFromSelector('[data-buildrick-id="foo"]:hover')).toBe("foo");
  });

  it("returns null for selector without data-buildrick-id", () => {
    expect(extractElementIdFromSelector(".bd-some-class")).toBeNull();
    expect(extractElementIdFromSelector("")).toBeNull();
  });
});
