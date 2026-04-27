/**
 * Phase 5 codemod tests — Kbd shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Kbd → @/editor/shared/vibcoder/Kbd.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../kbd";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/kbd codemod — rewrite Kbd import path", () => {
  it("rewrites @/shared/ui/Kbd → @/editor/shared/vibcoder/Kbd", () => {
    const before = `import { Kbd } from "@/shared/ui/Kbd";\nexport const X = () => <Kbd>⌘K</Kbd>;`;
    const after = `import { Kbd } from "@/editor/shared/vibcoder/Kbd";\nexport const X = () => <Kbd>⌘K</Kbd>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Kbd → @/editor/shared/vibcoder/Kbd", () => {
    const before = `import { Kbd } from "../shared/ui/Kbd";\nexport const X = () => <Kbd>K</Kbd>;`;
    const after = `import { Kbd } from "@/editor/shared/vibcoder/Kbd";\nexport const X = () => <Kbd>K</Kbd>;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Kbd, type KbdProps } from "@/shared/ui/Kbd";\nconst x: KbdProps = {};`;
    const after = `import { Kbd, type KbdProps } from "@/editor/shared/vibcoder/Kbd";\nconst x: KbdProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Kbd } from "@/shared/ui/Kbd";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Kbd } from "@/editor/shared/vibcoder/Kbd";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Kbd (collision guard)", () => {
    const before = `export const Kbd = () => null;\nimport { Kbd as VKbd } from "@/shared/ui/Kbd";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Kbd } from "@/shared/ui/Kbd";\n<Kbd>K</Kbd>;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Kbd } from "@/shared/ui/Kbd";\n<Kbd>K</Kbd>;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
