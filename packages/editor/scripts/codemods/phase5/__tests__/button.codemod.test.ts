/**
 * Phase 5 codemod tests — Button shim deletion.
 *
 * Covers:
 *  - import path rewrite (@/shared/ui/Button → @/editor/shared/vibcoder/Button)
 *  - relative path rewrite
 *  - ButtonProps type import rewrite
 *  - loading prop → busy rename
 *  - fullWidth prop → style={{ width: "100%" }} (no existing style)
 *  - fullWidth + existing inline style object → merged style
 *  - icon/iconPosition props dropped
 *  - unrelated imports untouched
 *  - idempotency
 *  - shouldSkipPath respected
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../button";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/button codemod — Button shim deletion", () => {
  it("rewrites import path @/shared/ui/Button → @/editor/shared/vibcoder/Button", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button>Click</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('from "@/editor/shared/vibcoder/Button"');
    expect(result).not.toContain('from "@/shared/ui/Button"');
  });

  it("rewrites relative path ../../../shared/ui/Button → @/editor/shared/vibcoder/Button", () => {
    const before = `import { Button } from "../../../shared/ui/Button";\nexport const X = () => <Button>Click</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('from "@/editor/shared/vibcoder/Button"');
    expect(result).not.toContain("shared/ui/Button");
  });

  it("preserves type-only imports — ButtonProps rewritten to vibcoder path", () => {
    const before = `import { Button, type ButtonProps } from "@/shared/ui/Button";\nconst x: ButtonProps = {};`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('from "@/editor/shared/vibcoder/Button"');
    expect(result).toContain("ButtonProps");
  });

  it("renames loading prop → busy", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button loading={isBusy}>Save</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain("busy={isBusy}");
    expect(result).not.toContain("loading=");
  });

  it("renames boolean shorthand loading → busy", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button loading>Save</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain("busy");
    expect(result).not.toContain("loading");
  });

  it("replaces fullWidth with style={{ width: '100%' }} when no existing style", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button fullWidth>Wide</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("fullWidth");
    expect(result).toContain('width: "100%"');
    expect(result).toContain("style=");
  });

  it("merges fullWidth + existing inline style object — width first", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button fullWidth style={{ color: "red" }}>Wide</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("fullWidth");
    expect(result).toContain('width: "100%"');
    expect(result).toContain('color: "red"');
  });

  it("drops icon and iconPosition props (no real consumers use them)", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button icon={<span/>} iconPosition="left">Save</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("icon=");
    expect(result).not.toContain("iconPosition=");
  });

  it("preserves passthrough props — variant, size, disabled, onClick, className", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button variant="ghost" size="lg" disabled onClick={fn} className="x">Click</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('variant="ghost"');
    expect(result).toContain('size="lg"');
    expect(result).toContain("disabled");
    expect(result).toContain("onClick={fn}");
    expect(result).toContain('className="x"');
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Input } from "@/editor/shared/vibcoder/Input";\nimport { Button } from "@/shared/ui/Button";`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('from "@/editor/shared/vibcoder/Input"');
    expect(result).toContain('from "@/editor/shared/vibcoder/Button"');
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button loading fullWidth>Save</Button>;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button>Click</Button>;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });

  it("merges fullWidth + style={varName} (identifier) via Object.assign — width first", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nconst s = { color: "red" };\nexport const X = () => <Button fullWidth style={s}>Wide</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("fullWidth");
    expect(result).toContain("Object.assign(");
    expect(result).toContain('width: "100%"');
    expect(result).toContain("s)");
  });

  it("merges fullWidth + style={fn()} (call expression) via Object.assign — width first", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nexport const X = () => <Button fullWidth style={getStyles()}>Wide</Button>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("fullWidth");
    expect(result).toContain("Object.assign(");
    expect(result).toContain('width: "100%"');
    expect(result).toContain("getStyles()");
  });
});
