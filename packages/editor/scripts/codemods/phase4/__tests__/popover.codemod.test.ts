/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../popover";

const FIXTURES = join(__dirname, "fixtures");

describe("popover codemod", () => {
  it("adds Popover import for unbound <Popover> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "popover");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Popover trigger={<button>x</button>} content={<p>y</p>} />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Popover>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Popover is already imported from elsewhere", () => {
    const input = `import { Popover } from "../legacy/Popover";\nexport function X() { return <Popover trigger={<button>x</button>} content={<p>y</p>} />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
