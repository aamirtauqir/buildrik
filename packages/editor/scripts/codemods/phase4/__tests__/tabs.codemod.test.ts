/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../tabs";

const FIXTURES = join(__dirname, "fixtures");

describe("tabs codemod", () => {
  it("adds Tabs import for unbound <Tabs> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "tabs");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Tabs tabs={[]} />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Tabs>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Tabs is already imported from elsewhere", () => {
    const input = `import { Tabs } from "../legacy/Tabs";\nexport function X() { return <Tabs tabs={[]} />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
