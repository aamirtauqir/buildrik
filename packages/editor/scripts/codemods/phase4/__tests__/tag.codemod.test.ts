/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../tag";

const FIXTURES = join(__dirname, "fixtures");

describe("tag codemod", () => {
  it("adds Tag import for unbound <Tag> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "tag");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Tag variant="accent">x</Tag>`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Tag>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Tag is already imported from elsewhere", () => {
    const input = `import { Tag } from "../legacy/Tag";\nexport function X() { return <Tag>x</Tag>; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
