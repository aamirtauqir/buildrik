/**
 * Snapshot test: codemod input/output fixture pair.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runCodemod, runCodemodFixture } from "../../_lib/__tests__/test-helpers";
import transform from "../modal";

const FIXTURES = join(__dirname, "fixtures");

describe("modal codemod", () => {
  it("adds Modal import for unbound <Modal> JSX", () => {
    const { actual, expected } = runCodemodFixture(transform, FIXTURES, "modal");
    expect(actual).toBe(expected);
  });

  it("honors shouldSkipPath (smoke: __tests__/ path)", () => {
    const input = `<Modal isOpen={true} onClose={() => {}}>x</Modal>`;
    expect(runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", input)).toBe(input);
  });

  it("skips files with no <Modal>", () => {
    const input = `export const x = 1;`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });

  it("does NOT add duplicate import when Modal is already imported from elsewhere", () => {
    const input = `import { Modal } from "../legacy/Modal";\nexport function X() { return <Modal>x</Modal>; }`;
    expect(runCodemod(transform, "/fake/src/editor/Foo.tsx", input)).toBe(input);
  });
});
