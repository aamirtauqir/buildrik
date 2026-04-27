/**
 * Phase 5 codemod tests — Slider shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/Slider → @/editor/shared/vibcoder/Slider.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../slider";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/slider codemod — rewrite Slider import path", () => {
  it("rewrites @/shared/ui/Slider → @/editor/shared/vibcoder/Slider", () => {
    const before = `import { Slider } from "@/shared/ui/Slider";\nexport const X = () => <Slider value={50} onChange={() => {}} />;`;
    const after = `import { Slider } from "@/editor/shared/vibcoder/Slider";\nexport const X = () => <Slider value={50} onChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/Slider → @/editor/shared/vibcoder/Slider", () => {
    const before = `import { Slider } from "../shared/ui/Slider";\nexport const X = () => <Slider value={0} onChange={() => {}} />;`;
    const after = `import { Slider } from "@/editor/shared/vibcoder/Slider";\nexport const X = () => <Slider value={0} onChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { Slider, type SliderProps } from "@/shared/ui/Slider";\nconst x: SliderProps = {};`;
    const after = `import { Slider, type SliderProps } from "@/editor/shared/vibcoder/Slider";\nconst x: SliderProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { Slider } from "@/shared/ui/Slider";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { Slider } from "@/editor/shared/vibcoder/Slider";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local Slider (collision guard)", () => {
    const before = `export const Slider = () => null;\nimport { Slider as VSlider } from "@/shared/ui/Slider";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Slider } from "@/shared/ui/Slider";\n<Slider value={50} onChange={() => {}} />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { Slider } from "@/shared/ui/Slider";\n<Slider value={50} onChange={() => {}} />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
