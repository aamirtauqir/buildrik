/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../skeleton";

const FIXTURES = join(__dirname, "fixtures");

describe("skeleton codemod", () => {
  it("adds Skeleton import for unbound <Skeleton> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "skeleton");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Skeleton width="60%" height={20} />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Skeleton>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Skeleton is already imported from elsewhere", () => {
    const input = `import { Skeleton } from "../legacy/Skeleton";\nexport function X() { return <Skeleton width={20} height={20} />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT touch compound names like SkeletonText", () => {
    const input = `import { SkeletonText } from "../shared/ui/Skeleton";\nexport function X() { return <SkeletonText lines={3} />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
