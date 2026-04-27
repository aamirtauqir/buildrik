/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../switch";

const FIXTURES = join(__dirname, "fixtures");

describe("switch codemod", () => {
  it("adds Switch import for unbound <Switch> JSX", () => {
    const input = readFileSync(join(FIXTURES, "switch.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "switch.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Switch checked={false} />`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no <Switch>", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("does NOT add duplicate import when Switch is already imported from elsewhere", () => {
    const input = `import { Switch } from "../legacy/Switch";\nexport function X() { return <Switch checked={false} />; }`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    // Original Switch import preserved (cross-path collision guard).
    expect(result).toBe(input);
  });
});
