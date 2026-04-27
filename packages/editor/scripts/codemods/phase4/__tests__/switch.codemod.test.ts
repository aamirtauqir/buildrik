/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../switch";

const FIXTURES = join(__dirname, "fixtures");

describe("switch codemod", () => {
  it("adds Switch import for unbound <Switch> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "switch");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Switch checked={false} />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Switch>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Switch is already imported from elsewhere", () => {
    const input = `import { Switch } from "../legacy/Switch";\nexport function X() { return <Switch checked={false} />; }`;
    // Original Switch import preserved (cross-path collision guard).
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
