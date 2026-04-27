/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../button";

const FIXTURES = join(__dirname, "fixtures");

describe("button codemod", () => {
  it("swaps inline <button> → <Button> + adds import", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "button");
    expect(actual).toBe(expected);
  });

  // Integration smoke test: confirms the codemod wires shouldSkipPath through
  // (per-rule branch coverage lives in _lib/__tests__/skip-rules.test.ts).
  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<button>Test</button>`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <button>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Button is already imported from a different path", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "button.dup-import");
    expect(actual).toBe(expected);
  });
});
