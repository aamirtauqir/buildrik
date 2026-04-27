/**
 * Phase 5 codemod tests — Icon shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Icon → @/editor/shared/vibcoder/Icon.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * NOTE: This tests Icon.tsx (Lucide-react atom), NOT Icons.tsx (domain glyph palette).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../icon";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/icon codemod — rewrite Icon import path", () => {
  it("rewrites @/shared/ui/Icon → @/editor/shared/vibcoder/Icon", () => {
    const before = `import { Icon } from "@/shared/ui/Icon";\nexport const X = () => <Icon name="Settings" size="md" />;`;
    const after = `import { Icon } from "@/editor/shared/vibcoder/Icon";\nexport const X = () => <Icon name="Settings" size="md" />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Icon → @/editor/shared/vibcoder/Icon", () => {
    const before = `import { Icon } from "../shared/ui/Icon";\nexport const X = () => <Icon name="Trash" />;`;
    const after = `import { Icon } from "@/editor/shared/vibcoder/Icon";\nexport const X = () => <Icon name="Trash" />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Icon, type IconProps, type IconName } from "@/shared/ui/Icon";\nconst x: IconProps = {};`;
    const after = `import { Icon, type IconProps, type IconName } from "@/editor/shared/vibcoder/Icon";\nconst x: IconProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Icon } from "@/shared/ui/Icon";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Icon } from "@/editor/shared/vibcoder/Icon";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Icon (collision guard)", () => {
    const before = `export const Icon = () => null;\nimport { Icon as VIcon } from "@/shared/ui/Icon";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Icon } from "@/shared/ui/Icon";\n<Icon name="Settings" />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Icon } from "@/shared/ui/Icon";\n<Icon name="Settings" />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
