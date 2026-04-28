/**
 * Bucket B3 codemod tests — Toast shim deletion + prop translation.
 *
 * Inline-string source pattern (no fixture files — Gate 25 compliance).
 * Mirrors the shape used by phase5/icon.codemod.test.ts.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../toast";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("bucket-b3/toast codemod — import rewrite + prop translation", () => {
  it("rewrites @/shared/ui/Toast → @/editor/shared/vibcoder for useToast", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nexport const X = () => { const { addToast } = useToast(); return null; };`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nexport const X = () => { const { addToast } = useToast(); return null; };`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites @shared/ui/Toast (no leading slash) → @/editor/shared/vibcoder", () => {
    const before = `import { useToast } from "@shared/ui/Toast";\nexport const X = () => null;`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nexport const X = () => null;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites relative ../shared/ui/Toast → @/editor/shared/vibcoder", () => {
    const before = `import { useToast } from "../shared/ui/Toast";\nexport const X = () => null;`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nexport const X = () => null;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("rewrites deep relative ../../shared/ui/Toast (depth >1) → @/editor/shared/vibcoder", () => {
    const before = `import { useToast } from "../../shared/ui/Toast";\nexport const X = () => null;`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nexport const X = () => null;`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("renames addToast({ message, variant }) → addToast({ description, tone })", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ message: "Saved", variant: "success" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\naddToast({ description: "Saved", tone: "success" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves unrelated properties (duration, action) — only renames message", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ message: "x", duration: 1000, action: { label: "U", onClick: () => null } });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\naddToast({ description: "x", duration: 1000, action: { label: "U", onClick: () => null } });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("preserves title (already correct in both APIs); renames message alongside", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ title: "T", message: "M" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\naddToast({ title: "T", description: "M" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("renames type-only ToastVariant specifier → ToastTone (preserves alias semantics)", () => {
    // No `as` alias in the consumer — codemod renames imported AND local
    // so consumer body identifiers still resolve at the new location.
    // (Body-identifier rename remains for T4 manual sweep per documented
    // scope.)
    const before = `import type { ToastVariant } from "@/shared/ui/Toast";\nexport const v: ToastVariant = "info";`;
    const after = `import type { ToastTone } from "@/editor/shared/vibcoder";\nexport const v: ToastVariant = "info";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("is idempotent — running twice produces same result as one pass", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ message: "x", variant: "info" });`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("respects shouldSkipPath — does not rewrite imports in __tests__/ paths", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ message: "x" });`;
    const result = runCodemod(
      transform,
      "/fake/src/editor/__tests__/Foo.test.tsx",
      before,
    );
    expect(result).toBe(before);
  });

  it("does NOT touch unrelated imports — only Toast import flips", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { useToast } from "@/shared/ui/Toast";`;
    const after = `import { Button } from "@/shared/ui/Button";\nimport { useToast } from "@/editor/shared/vibcoder";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("renames addToast({}) prop syntactically — no scope analysis (T4 manual sweep verifies)", () => {
    // Codemod is purely syntactic: any addToast(...) call with object arg
    // gets the prop rename. If the file does NOT import the shim's
    // useToast (e.g., addToast comes from a different module), the rename
    // still happens. Trade-off accepted — T4 manual sweep flags genuine
    // collisions.
    const before = `import { addToast } from "./other-module";\naddToast({ message: "x", variant: "info" });`;
    const after = `import { addToast } from "./other-module";\naddToast({ description: "x", tone: "info" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("renames literal-key message in spread call — { ...defaults, message }", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ ...defaults, message: "x" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\naddToast({ ...defaults, description: "x" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("leaves computed keys alone — [k]: 'x' is not renamed, literal message still flips", () => {
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\nconst k = "message";\naddToast({ [k]: "ignored", message: "y" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\nconst k = "message";\naddToast({ [k]: "ignored", description: "y" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("collision guard — file that exports its own useToast keeps import unchanged", () => {
    const before = `export const useToast = () => ({ addToast: () => null });\nimport { useToast as VibToast } from "@/shared/ui/Toast";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(before);
  });

  it("skips shorthand addToast({ message, variant }) — rename would break the value identifier", () => {
    // Renaming a shorthand Property's key.name flips BOTH key + value text in
    // the printed source (Property { shorthand: true, key: Identifier "message",
    // value: Identifier "message" }). That would produce `{ description }`
    // referencing a nonexistent local. Codemod skips with warn instead.
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\nconst message = "x";\nconst variant = "info" as const;\naddToast({ message, variant });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\nconst message = "x";\nconst variant = "info" as const;\naddToast({ message, variant });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("leaves string-literal keys alone — only Identifier keys are renamed", () => {
    // Documented intentional limitation: codemod only touches Identifier
    // keys. StringLiteral keys ("message", "variant") stay as-is. Pinned
    // here so future contributors don't "fix" it without realizing it's
    // deliberate.
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast } = useToast();\naddToast({ "message": "x", "variant": "info" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast } = useToast();\naddToast({ "message": "x", "variant": "info" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("leaves aliased-addToast call alone — only literal addToast Identifier matches", () => {
    // Codemod matches CallExpression callee === Identifier "addToast" exactly.
    // Destructure-aliased `addToast: addT` invocations slip through. Pinned
    // here so the limitation is visible.
    const before = `import { useToast } from "@/shared/ui/Toast";\nconst { addToast: addT } = useToast();\naddT({ message: "x", variant: "info" });`;
    const after = `import { useToast } from "@/editor/shared/vibcoder";\nconst { addToast: addT } = useToast();\naddT({ message: "x", variant: "info" });`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });

  it("renames `ToastVariant as TV` imported name only — local alias and body usage preserved", () => {
    // Verifies the aliased-rename code path the docstring promises: only
    // `imported` name flips (ToastVariant → ToastTone), the local alias
    // `TV` and any body usage of `TV` are preserved.
    const before = `import type { ToastVariant as TV } from "@/shared/ui/Toast";\nconst x: TV = "info";`;
    const after = `import type { ToastTone as TV } from "@/editor/shared/vibcoder";\nconst x: TV = "info";`;
    expect(runCodemod(transform, FAKE_PATH, before)).toBe(after);
  });
});
