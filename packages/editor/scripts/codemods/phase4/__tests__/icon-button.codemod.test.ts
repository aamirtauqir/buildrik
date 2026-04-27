/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../icon-button";

const FIXTURES = join(__dirname, "fixtures");

describe("icon-button codemod", () => {
  it("adds IconButton import for unbound <IconButton> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "icon-button");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<IconButton icon={<i />} ariaLabel="x" />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <IconButton>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when IconButton is already imported from elsewhere", () => {
    const input = `import { IconButton } from "../legacy/IconButton";\nexport function X() { return <IconButton icon={<i />} ariaLabel="x" />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
