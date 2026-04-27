// packages/editor/scripts/codemods/_lib/__tests__/test-helpers.ts
/**
 * Shared test helpers for Phase 4 codemod tests. Eliminates the
 * api-stub + fixture-load duplication across per-codemod test files.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jscodeshift, { type Transform } from "jscodeshift";

const API_STUB = {
  jscodeshift: jscodeshift.withParser("tsx"),
  j: jscodeshift.withParser("tsx"),
  stats: () => undefined,
  report: () => undefined,
};

/** Run codemod against a source string with a fake file path. */
export function runCodemod(
  transform: Transform,
  filePath: string,
  source: string,
): string {
  const result = transform({ path: filePath, source }, API_STUB, {});
  return typeof result === "string" ? result : source;
}

/** Run codemod against a fixture pair, return [actual, expected] (both trimmed). */
export function runCodemodFixture(
  transform: Transform,
  fixturesDir: string,
  name: string,
): { actual: string; expected: string } {
  const input = readFileSync(join(fixturesDir, `${name}.input.tsx`), "utf-8");
  const expected = readFileSync(join(fixturesDir, `${name}.output.tsx`), "utf-8").trim();
  const actual = runCodemod(transform, "/fake/src/editor/Demo.tsx", input).trim();
  return { actual, expected };
}
