/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../checkbox";

const FIXTURES = join(__dirname, "fixtures");

describe("checkbox codemod", () => {
  it("swaps <input type='checkbox'> → <Checkbox> + adds import; preserves other <input> + <Checkbox>", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "checkbox");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<input type="checkbox" />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no checkbox element", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Checkbox is already imported from elsewhere", () => {
    const input = `import { Checkbox } from "../legacy/Checkbox";\nexport function X() { return <input type="checkbox" />; }`;
    const result = runCodemod(transform, "/fake/src/editor/Foo.tsx", input);
    // Cross-path collision guard: existing Checkbox import preserved, JSX rewritten.
    expect(result).toContain('from "../legacy/Checkbox"');
    expect(result).toContain("<Checkbox");
    expect(result).not.toContain('type="checkbox"');
  });
});
