/**
 * Phase 5 codemod tests — Select shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Select → @/editor/shared/vibcoder/Select.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../select";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/select codemod — rewrite Select import path", () => {
  it("rewrites @/shared/ui/Select → @/editor/shared/vibcoder/Select", () => {
    const before = `import { Select } from "@/shared/ui/Select";\nexport const X = () => <Select />;`;
    const after = `import { Select } from "@/editor/shared/vibcoder/Select";\nexport const X = () => <Select />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Select → @/editor/shared/vibcoder/Select", () => {
    const before = `import { Select } from "../shared/ui/Select";\nexport const X = () => <Select />;`;
    const after = `import { Select } from "@/editor/shared/vibcoder/Select";\nexport const X = () => <Select />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Select, type SelectProps } from "@/shared/ui/Select";\nconst x: SelectProps = {};`;
    const after = `import { Select, type SelectProps } from "@/editor/shared/vibcoder/Select";\nconst x: SelectProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Select } from "@/shared/ui/Select";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Select } from "@/editor/shared/vibcoder/Select";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Select (collision guard)", () => {
    const before = `export const Select = () => null;\nimport { Select as VSelect } from "@/shared/ui/Select";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Select } from "@/shared/ui/Select";\n<Select />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Select } from "@/shared/ui/Select";\n<Select />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
