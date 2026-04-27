/**
 * Phase 5 codemod tests — Switch shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Switch → @/editor/shared/vibcoder/Switch.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../switch";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/switch codemod — rewrite Switch import path", () => {
  it("rewrites @/shared/ui/Switch → @/editor/shared/vibcoder/Switch", () => {
    const before = `import { Switch } from "@/shared/ui/Switch";\nexport const X = () => <Switch checked={true} onCheckedChange={() => {}} />;`;
    const after = `import { Switch } from "@/editor/shared/vibcoder/Switch";\nexport const X = () => <Switch checked={true} onCheckedChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Switch → @/editor/shared/vibcoder/Switch", () => {
    const before = `import { Switch } from "../shared/ui/Switch";\nexport const X = () => <Switch checked={false} onCheckedChange={() => {}} />;`;
    const after = `import { Switch } from "@/editor/shared/vibcoder/Switch";\nexport const X = () => <Switch checked={false} onCheckedChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Switch, type SwitchProps } from "@/shared/ui/Switch";\nconst x: SwitchProps = {};`;
    const after = `import { Switch, type SwitchProps } from "@/editor/shared/vibcoder/Switch";\nconst x: SwitchProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Switch } from "@/shared/ui/Switch";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Switch } from "@/editor/shared/vibcoder/Switch";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Switch (collision guard)", () => {
    const before = `export const Switch = () => null;\nimport { Switch as VSwitch } from "@/shared/ui/Switch";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Switch } from "@/shared/ui/Switch";\n<Switch checked={true} onCheckedChange={() => {}} />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Switch } from "@/shared/ui/Switch";\n<Switch checked={true} onCheckedChange={() => {}} />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
