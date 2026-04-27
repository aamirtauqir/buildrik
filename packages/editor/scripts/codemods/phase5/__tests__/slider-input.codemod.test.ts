/**
 * Phase 5 codemod tests — SliderInput shim deletion.
 *
 * Tests the import-path rewrite: @/shared/ui/SliderInput → @/editor/shared/vibcoder/Slider.
 * Uses runCodemod (inline source) rather than fixture files because the
 * transform is a path rewrite with no JSX mutation — inline strings are
 * more readable for this class of test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../slider-input";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/slider-input codemod — rewrite SliderInput import path", () => {
  it("rewrites @/shared/ui/SliderInput → @/editor/shared/vibcoder/Slider", () => {
    const before = `import { SliderInput } from "@/shared/ui/SliderInput";\nexport const X = () => <SliderInput value={50} onChange={() => {}} />;`;
    const after = `import { SliderInput } from "@/editor/shared/vibcoder/Slider";\nexport const X = () => <SliderInput value={50} onChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative path ../shared/ui/SliderInput → @/editor/shared/vibcoder/Slider", () => {
    const before = `import { SliderInput } from "../shared/ui/SliderInput";\nexport const X = () => <SliderInput value={0} onChange={() => {}} />;`;
    const after = `import { SliderInput } from "@/editor/shared/vibcoder/Slider";\nexport const X = () => <SliderInput value={0} onChange={() => {}} />;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves type-only imports", () => {
    const before = `import { SliderInput, type SliderInputProps } from "@/shared/ui/SliderInput";\nconst x: SliderInputProps = {};`;
    const after = `import { SliderInput, type SliderInputProps } from "@/editor/shared/vibcoder/Slider";\nconst x: SliderInputProps = {};`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { SliderInput } from "@/shared/ui/SliderInput";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { SliderInput } from "@/editor/shared/vibcoder/Slider";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("skips files that themselves export a local SliderInput (collision guard)", () => {
    const before = `export const SliderInput = () => null;\nimport { SliderInput as VSlider } from "@/shared/ui/SliderInput";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { SliderInput } from "@/shared/ui/SliderInput";\n<SliderInput value={50} onChange={() => {}} />;`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { SliderInput } from "@/shared/ui/SliderInput";\n<SliderInput value={50} onChange={() => {}} />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result).toBe(before);
  });
});
