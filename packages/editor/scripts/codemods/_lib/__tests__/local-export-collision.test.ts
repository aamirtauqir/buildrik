// packages/editor/scripts/codemods/_lib/__tests__/local-export-collision.test.ts
/**
 * Tests for ensureNamedImport local-export collision detection.
 * Phase 5 / T1.A hardening: prevent self-recursion when target file already
 * exports or declares the import-name locally.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import { ensureNamedImport } from "../import-swap";

const j = jscodeshift.withParser("tsx");

describe("ensureNamedImport — local-export collision", () => {
  it("bails when target file declares `export const <name> = ...`", () => {
    const source = `
export const Select = () => null;
const x = 1;
`;
    const root = j(source);
    const result = ensureNamedImport(j, root, "Select", "@/shared/ui/Select");
    expect(result.skipped).toBe(true);
    expect(result.reason).toMatch(/local export/i);
    expect(root.toSource()).not.toContain("@/shared/ui/Select");
  });

  it("bails when target file declares `export function <name>`", () => {
    const source = `
export function Modal() { return null; }
`;
    const root = j(source);
    const result = ensureNamedImport(j, root, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
  });

  it("bails when target file has `export { <name> }` re-export", () => {
    const source = `
const X = () => null;
export { X as Modal };
`;
    const root = j(source);
    const result = ensureNamedImport(j, root, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
  });

  it("does NOT bail when local declaration is unrelated", () => {
    const source = `
const helper = 1;
const Modal = "string-not-component";
`;
    const root = j(source);
    const result = ensureNamedImport(j, root, "Button", "@/shared/ui/Button");
    expect(result.skipped).toBe(false);
    expect(root.toSource()).toContain("@/shared/ui/Button");
  });

  it("does NOT bail when local var is named same but not exported", () => {
    const source = `
const Modal = () => null;
`;
    const root = j(source);
    const result = ensureNamedImport(j, root, "Modal", "@/shared/ui/Modal");
    expect(result.skipped).toBe(true);
    expect(result.reason).toMatch(/local declaration/i);
  });
});
