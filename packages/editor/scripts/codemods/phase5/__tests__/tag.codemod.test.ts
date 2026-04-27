/**
 * Phase 5 codemod tests — Tag shim deletion canary.
 *
 * Tests the import-path rewrite: @/shared/ui/Tag → @/editor/shared/vibcoder/Tag.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../tag";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/tag codemod — rewrite Tag import path", () => {
  it("rewrites @/shared/ui/Tag → @/editor/shared/vibcoder/Tag", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    const after = `import { Tag } from "@/editor/shared/vibcoder/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Tag → @/editor/shared/vibcoder/Tag", () => {
    const before = `import { Tag } from "../shared/ui/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    const after = `import { Tag } from "@/editor/shared/vibcoder/Tag";\nexport const X = () => <Tag>x</Tag>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Tag, type TagProps } from "@/shared/ui/Tag";\nconst x: TagProps = {};`;
    const after = `import { Tag, type TagProps } from "@/editor/shared/vibcoder/Tag";\nconst x: TagProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Tag } from "@/shared/ui/Tag";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Tag } from "@/editor/shared/vibcoder/Tag";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Tag (collision guard)", () => {
    const before = `export const Tag = () => null;\nimport { Tag as VTag } from "@/shared/ui/Tag";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";\n<Tag>x</Tag>;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";\n<Tag>x</Tag>;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
