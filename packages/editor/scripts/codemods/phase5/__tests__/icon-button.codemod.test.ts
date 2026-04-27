/**
 * Phase 5 codemod tests — IconButton shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/IconButton → @/editor/shared/vibcoder/IconButton.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../icon-button";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/icon-button codemod — rewrite IconButton import path", () => {
  it("rewrites @/shared/ui/IconButton → @/editor/shared/vibcoder/IconButton", () => {
    const before = `import { IconButton } from "@/shared/ui/IconButton";\nexport const X = () => <IconButton />;`;
    const after = `import { IconButton } from "@/editor/shared/vibcoder/IconButton";\nexport const X = () => <IconButton />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../../../shared/ui/IconButton → @/editor/shared/vibcoder/IconButton", () => {
    const before = `import { IconButton } from "../../../shared/ui/IconButton";\nexport const X = () => <IconButton />;`;
    const after = `import { IconButton } from "@/editor/shared/vibcoder/IconButton";\nexport const X = () => <IconButton />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { IconButton, type IconButtonProps } from "@/shared/ui/IconButton";\nconst x: IconButtonProps = {};`;
    const after = `import { IconButton, type IconButtonProps } from "@/editor/shared/vibcoder/IconButton";\nconst x: IconButtonProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { IconButton } from "@/shared/ui/IconButton";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { IconButton } from "@/editor/shared/vibcoder/IconButton";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local IconButton (collision guard)", () => {
    const before = `export const IconButton = () => null;\nimport { IconButton as VIconButton } from "@/shared/ui/IconButton";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { IconButton } from "@/shared/ui/IconButton";\n<IconButton />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { IconButton } from "@/shared/ui/IconButton";\n<IconButton />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
