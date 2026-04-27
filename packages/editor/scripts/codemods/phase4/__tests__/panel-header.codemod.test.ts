/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../panel-header";

const FIXTURES = join(__dirname, "fixtures");

describe("panel-header codemod", () => {
  it("adds PanelHeader import for unbound <PanelHeader> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "panel-header");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<PanelHeader title="x" />`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <PanelHeader>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when PanelHeader is already imported from elsewhere", () => {
    const input = `import { PanelHeader } from "../legacy/PanelHeader";\nexport function X() { return <PanelHeader title="x" />; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
