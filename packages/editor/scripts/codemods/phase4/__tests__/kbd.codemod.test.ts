/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../kbd";

const FIXTURES = join(__dirname, "fixtures");

describe("kbd codemod", () => {
  it("renames <kbd> to <Kbd> and adds the Kbd import", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "kbd");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<kbd>X</kbd>`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <kbd>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT touch <Kbd> (PascalCase) usage", () => {
    const input = `import { Kbd } from "@/shared/ui/Kbd";\nexport function X() { return <Kbd>X</Kbd>; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
