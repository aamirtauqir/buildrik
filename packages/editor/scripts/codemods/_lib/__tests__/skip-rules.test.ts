/**
 * Unit tests for shouldSkipPath — covers each skip-rule branch.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { shouldSkipPath } from "../skip-rules";

describe("shouldSkipPath", () => {
  it("skips paths inside __tests__/ directories", () => {
    expect(shouldSkipPath("/repo/src/editor/__tests__/Foo.tsx")).toBe(true);
  });

  it("skips paths inside scripts/ directories", () => {
    expect(shouldSkipPath("/repo/packages/editor/scripts/codemods/foo.ts")).toBe(true);
  });

  it("skips paths inside preview/ directories", () => {
    expect(shouldSkipPath("/repo/src/preview/gallery/Foo.tsx")).toBe(true);
  });

  it("skips paths inside shared/vibcoder/ directories", () => {
    expect(shouldSkipPath("/repo/src/shared/vibcoder/Button.tsx")).toBe(true);
  });

  it("skips co-located *.test.tsx files", () => {
    expect(shouldSkipPath("/repo/src/editor/canvas/Foo.test.tsx")).toBe(true);
  });

  it("skips co-located *.spec.tsx files", () => {
    expect(shouldSkipPath("/repo/src/editor/canvas/Foo.spec.tsx")).toBe(true);
  });

  it("does NOT skip a normal src/editor/ file", () => {
    expect(shouldSkipPath("/repo/src/editor/canvas/Foo.tsx")).toBe(false);
  });
});
