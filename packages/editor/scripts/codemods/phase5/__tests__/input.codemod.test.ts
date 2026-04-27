/**
 * Phase 5 codemod tests — Input shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Input → @/editor/shared/vibcoder/Input.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../input";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/input codemod — rewrite Input import path", () => {
  it("rewrites @/shared/ui/Input → @/editor/shared/vibcoder/Input", () => {
    const before = `import { Input } from "@/shared/ui/Input";\nexport const X = () => <Input placeholder="Name" />;`;
    const after = `import { Input } from "@/editor/shared/vibcoder/Input";\nexport const X = () => <Input placeholder="Name" />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Input → @/editor/shared/vibcoder/Input", () => {
    const before = `import { Input } from "../shared/ui/Input";\nexport const X = () => <Input placeholder="Name" />;`;
    const after = `import { Input } from "@/editor/shared/vibcoder/Input";\nexport const X = () => <Input placeholder="Name" />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Input, type InputProps } from "@/shared/ui/Input";\nconst x: InputProps = {};`;
    const after = `import { Input, type InputProps } from "@/editor/shared/vibcoder/Input";\nconst x: InputProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Input } from "@/shared/ui/Input";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Input } from "@/editor/shared/vibcoder/Input";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Input (collision guard)", () => {
    const before = `export const Input = () => null;\nimport { Input as VInput } from "@/shared/ui/Input";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Input } from "@/shared/ui/Input";\n<Input placeholder="Name" />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Input } from "@/shared/ui/Input";\n<Input placeholder="Name" />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
