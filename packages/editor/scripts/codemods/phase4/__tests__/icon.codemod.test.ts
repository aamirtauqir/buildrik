/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../icon";

const FIXTURES = join(__dirname, "fixtures");

describe("icon codemod", () => {
  it("adds Icon import for <Icon name=\"...\"> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "icon");
    expect(actual).toBe(expected);
  });

  it("does NOT touch <Icon> JSX without a name attribute (parameterized lucide variables)", () => {
    const input = `export function X() { const Icon = () => null; return <Icon size={20} />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Icon name="search" />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Icon>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
