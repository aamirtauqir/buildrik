/**
 * Phase 5 codemod tests — Checkbox shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Checkbox → @/editor/shared/vibcoder/Checkbox.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../checkbox";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/checkbox codemod — rewrite Checkbox import path", () => {
  it("rewrites @/shared/ui/Checkbox → @/editor/shared/vibcoder/Checkbox", () => {
    const before = `import { Checkbox } from "@/shared/ui/Checkbox";\nexport const X = () => <Checkbox />;`;
    const after = `import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";\nexport const X = () => <Checkbox />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Checkbox → @/editor/shared/vibcoder/Checkbox", () => {
    const before = `import { Checkbox } from "../shared/ui/Checkbox";\nexport const X = () => <Checkbox />;`;
    const after = `import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";\nexport const X = () => <Checkbox />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Checkbox, type CheckboxProps } from "@/shared/ui/Checkbox";\nconst x: CheckboxProps = {};`;
    const after = `import { Checkbox, type CheckboxProps } from "@/editor/shared/vibcoder/Checkbox";\nconst x: CheckboxProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Checkbox } from "@/shared/ui/Checkbox";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Checkbox } from "@/editor/shared/vibcoder/Checkbox";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Checkbox (collision guard)", () => {
    const before = `export const Checkbox = () => null;\nimport { Checkbox as VCheckbox } from "@/shared/ui/Checkbox";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Checkbox } from "@/shared/ui/Checkbox";\n<Checkbox />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Checkbox } from "@/shared/ui/Checkbox";\n<Checkbox />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
