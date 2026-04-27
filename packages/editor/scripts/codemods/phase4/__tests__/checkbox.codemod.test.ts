/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../checkbox";

const FIXTURES = join(__dirname, "fixtures");

describe("checkbox codemod", () => {
  it("swaps <input type='checkbox'> → <Checkbox> + adds import; preserves other <input> + <Checkbox>", () => {
    const input = readFileSync(join(FIXTURES, "checkbox.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "checkbox.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<input type="checkbox" />`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no checkbox element", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("does NOT add duplicate import when Checkbox is already imported from elsewhere", () => {
    const input = `import { Checkbox } from "../legacy/Checkbox";\nexport function X() { return <input type="checkbox" />; }`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    // Cross-path collision guard: existing Checkbox import preserved, JSX rewritten.
    expect(result).toContain('from "../legacy/Checkbox"');
    expect(result).toContain("<Checkbox");
    expect(result).not.toContain('type="checkbox"');
  });
});
