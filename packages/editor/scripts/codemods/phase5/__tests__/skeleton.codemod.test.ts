/**
 * Phase 5 codemod tests — Skeleton shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Skeleton → @/editor/shared/vibcoder/Skeleton.
 * Covers compound named exports (SkeletonListItem, StudioSkeleton) as well
 * as the primary Skeleton export.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../skeleton";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/skeleton codemod — rewrite Skeleton import path", () => {
  it("rewrites @/shared/ui/Skeleton → @/editor/shared/vibcoder/Skeleton", () => {
    const before = `import { Skeleton } from "@/shared/ui/Skeleton";\nexport const X = () => <Skeleton />;`;
    const after = `import { Skeleton } from "@/editor/shared/vibcoder/Skeleton";\nexport const X = () => <Skeleton />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../../shared/ui/Skeleton → @/editor/shared/vibcoder/Skeleton", () => {
    const before = `import { SkeletonListItem } from "../../shared/ui/Skeleton";\nexport const X = () => <SkeletonListItem />;`;
    const after = `import { SkeletonListItem } from "@/editor/shared/vibcoder/Skeleton";\nexport const X = () => <SkeletonListItem />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves compound named imports (SkeletonListItem, StudioSkeleton)", () => {
    const before = `import { SkeletonListItem, StudioSkeleton } from "@/shared/ui/Skeleton";`;
    const after = `import { SkeletonListItem, StudioSkeleton } from "@/editor/shared/vibcoder/Skeleton";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Skeleton } from "@/shared/ui/Skeleton";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Skeleton } from "@/editor/shared/vibcoder/Skeleton";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Skeleton (collision guard)", () => {
    const before = `export const Skeleton = () => null;\nimport { Skeleton as VSkeleton } from "@/shared/ui/Skeleton";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Skeleton } from "@/shared/ui/Skeleton";\n<Skeleton />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Skeleton } from "@/shared/ui/Skeleton";\n<Skeleton />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
