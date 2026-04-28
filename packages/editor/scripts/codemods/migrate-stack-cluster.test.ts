import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { transform } from "./migrate-stack-cluster";

const fix = (name: string) => readFileSync(resolve(__dirname, "__fixtures__", name), "utf8");

describe("migrate-stack-cluster codemod", () => {
  it("converts clean stack flex column to <Stack gap='sm'>", () => {
    expect(transform(fix("stack-clean.input.tsx"))).toBe(fix("stack-clean.output.tsx"));
  });

  it("omits gap prop when value maps to default md (12px)", () => {
    expect(transform(fix("stack-default-gap.input.tsx"))).toBe(fix("stack-default-gap.output.tsx"));
  });

  it("converts flex-wrap row to <Cluster>", () => {
    expect(transform(fix("cluster.input.tsx"))).toBe(fix("cluster.output.tsx"));
  });

  it("leaves multi-prop sites untouched (preserves padding/background)", () => {
    const input = fix("non-target.input.tsx");
    const result = transform(input);
    expect(result).toContain("padding: 16");
    expect(result).toContain('background: "white"');
    expect(result).not.toContain("<Stack");
  });

  it("leaves off-grid gap (10px) untouched", () => {
    const result = transform(fix("non-target.input.tsx"));
    expect(result).toContain("gap: 10");
    expect(result).not.toContain('gap="sm"');
  });

  it("leaves computed gap (ternary) untouched", () => {
    const result = transform(fix("non-target.input.tsx"));
    expect(result).toContain("dense ? 4 : 8");
  });

  // Regression: T3 sidebar batch surfaced two ts-morph bugs the original
  // 6 fixtures missed. Nested stacks need bottom-up iteration (parent rename
  // forgets child refs in pre-order) AND closing-tag-first rename (else
  // ts-morph re-validates the AST mid-op against transient <Stack>...</div>
  // mismatch). Fixed in c44ba2c. This fixture pins the contract.
  it("converts nested stacks (bottom-up iteration + closing-tag-first rename)", () => {
    expect(transform(fix("nested-stack.input.tsx"))).toBe(fix("nested-stack.output.tsx"));
  });
});
