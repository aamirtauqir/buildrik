/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../slider";

const FIXTURES = join(__dirname, "fixtures");

describe("slider codemod", () => {
  it("adds SliderInput import for unbound <SliderInput> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "slider");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<SliderInput value={0} onChange={() => undefined} />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <SliderInput>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
