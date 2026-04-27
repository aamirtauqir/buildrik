/**
 * Phase 5 codemod tests — Badge shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Badge → @/editor/shared/vibcoder/Badge.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../badge";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/badge codemod — rewrite Badge import path", () => {
  it("rewrites @/shared/ui/Badge → @/editor/shared/vibcoder/Badge", () => {
    const before = `import { Badge } from "@/shared/ui/Badge";\nexport const X = () => <Badge variant="success">ok</Badge>;`;
    const after = `import { Badge } from "@/editor/shared/vibcoder/Badge";\nexport const X = () => <Badge variant="success">ok</Badge>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Badge → @/editor/shared/vibcoder/Badge", () => {
    const before = `import { Badge } from "../shared/ui/Badge";\nexport const X = () => <Badge>x</Badge>;`;
    const after = `import { Badge } from "@/editor/shared/vibcoder/Badge";\nexport const X = () => <Badge>x</Badge>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Badge, type BadgeProps } from "@/shared/ui/Badge";\nconst x: BadgeProps = {};`;
    const after = `import { Badge, type BadgeProps } from "@/editor/shared/vibcoder/Badge";\nconst x: BadgeProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Badge } from "@/shared/ui/Badge";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Badge } from "@/editor/shared/vibcoder/Badge";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Badge (collision guard)", () => {
    const before = `export const Badge = () => null;\nimport { Badge as VBadge } from "@/shared/ui/Badge";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Badge } from "@/shared/ui/Badge";\n<Badge>x</Badge>;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Badge } from "@/shared/ui/Badge";\n<Badge>x</Badge>;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
