/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift from "jscodeshift";
import transform from "../button";

const FIXTURES = join(__dirname, "fixtures");

describe("button codemod", () => {
  it("swaps inline <button> → <Button> + adds import", () => {
    const input = readFileSync(join(FIXTURES, "button.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "button.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });

  it("skips files in __tests__/", () => {
    const input = `<button>Test</button>`;
    const result = transform(
      { path: "/fake/src/editor/__tests__/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files with no <button>", () => {
    const input = `export const x = 1;`;
    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips files in shared/vibcoder/ (wrapper layer would self-recurse)", () => {
    const input = `<button>Vibcoder</button>`;
    const result = transform(
      { path: "/fake/src/editor/shared/vibcoder/Button.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("skips co-located .test.tsx files (tests own their JSX)", () => {
    const input = `<button>Test</button>`;
    const result = transform(
      { path: "/fake/src/editor/canvas/Foo.test.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );
    expect(result).toBe(input);
  });

  it("does NOT add duplicate import when Button is already imported from a different path", () => {
    const input = readFileSync(join(FIXTURES, "button.dup-import.input.tsx"), "utf-8");
    const expected = readFileSync(join(FIXTURES, "button.dup-import.output.tsx"), "utf-8").trim();

    const result = transform(
      { path: "/fake/src/editor/Foo.tsx", source: input },
      { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift.withParser("tsx"), stats: () => undefined, report: () => undefined },
      {},
    );

    expect((result as string).trim()).toBe(expected);
  });
});
