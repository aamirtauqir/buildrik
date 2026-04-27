/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../form-field";

const FIXTURES = join(__dirname, "fixtures");

describe("form-field codemod", () => {
  it("adds FormField import for unbound <FormField> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "form-field");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<FormField label="x"><input /></FormField>`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <FormField>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when FormField is already imported from elsewhere", () => {
    const input = `import { FormField } from "../legacy/FormField";\nexport function X() { return <FormField label="x"><input /></FormField>; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
