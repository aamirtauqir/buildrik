/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../select";

const FIXTURES = join(__dirname, "fixtures");

describe("select codemod", () => {
  it("swaps inline <select> → <Select> + adds import", () => {
    const input = readFileSync(join(FIXTURES, "select.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "select.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<select><option /></select>`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no <select>", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });
});
