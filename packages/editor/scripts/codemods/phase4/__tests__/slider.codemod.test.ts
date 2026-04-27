/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../slider";

const FIXTURES = join(__dirname, "fixtures");

describe("slider codemod", () => {
  it("adds SliderInput import for unbound <SliderInput> JSX", () => {
    const input = readFileSync(join(FIXTURES, "slider.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "slider.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<SliderInput value={0} onChange={() => undefined} />`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no <SliderInput>", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });
});
