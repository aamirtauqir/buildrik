/**
 * Phase 5 codemod tests — Spinner shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Spinner → @/editor/shared/vibcoder/Spinner.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../spinner";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/spinner codemod — rewrite Spinner import path", () => {
  it("rewrites @/shared/ui/Spinner → @/editor/shared/vibcoder/Spinner", () => {
    const before = `import { Spinner } from "@/shared/ui/Spinner";\nexport const X = () => <Spinner />;`;
    const after = `import { Spinner } from "@/editor/shared/vibcoder/Spinner";\nexport const X = () => <Spinner />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Spinner → @/editor/shared/vibcoder/Spinner", () => {
    const before = `import { Spinner } from "../shared/ui/Spinner";\nexport const X = () => <Spinner />;`;
    const after = `import { Spinner } from "@/editor/shared/vibcoder/Spinner";\nexport const X = () => <Spinner />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Spinner, type SpinnerProps } from "@/shared/ui/Spinner";\nconst x: SpinnerProps = {};`;
    const after = `import { Spinner, type SpinnerProps } from "@/editor/shared/vibcoder/Spinner";\nconst x: SpinnerProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Spinner } from "@/shared/ui/Spinner";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Spinner } from "@/editor/shared/vibcoder/Spinner";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Spinner (collision guard)", () => {
    const before = `export const Spinner = () => null;\nimport { Spinner as VSpinner } from "@/shared/ui/Spinner";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Spinner } from "@/shared/ui/Spinner";\n<Spinner />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Spinner } from "@/shared/ui/Spinner";\n<Spinner />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
