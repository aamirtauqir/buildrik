/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../input";

const FIXTURES = join(__dirname, "fixtures");

describe("input codemod", () => {
  it("swaps inline <input> → <TextInput> + adds import; leaves <input type='checkbox'> alone", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "input");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<input type="text" />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <input>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add TextInput import when only <input type='checkbox'> exists", () => {
    const input = `export function X() { return <input type="checkbox" />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
