/**
 * Unit tests for makeRenameJsxCodemod higher-order codemod.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { makeRenameJsxCodemod } from "../codemod-factory";
import { runCodemod } from "./test-helpers";

describe("makeRenameJsxCodemod", () => {
  it("swaps the tag and adds a named import", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "button",
      toName: "Button",
      toImport: "@/shared/ui/Button",
    });
    const source = `export function X() { return <button>Hi</button>; }`;
    const out = runCodemod(t, "/fake/src/editor/Foo.tsx", source);
    expect(out).toContain('import { Button } from "@/shared/ui/Button"');
    expect(out).toContain("<Button>");
    expect(out).not.toMatch(/<button[\s>]/);
  });

  it("honors shouldSkipPath (no-op on test paths)", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "button",
      toName: "Button",
      toImport: "@/shared/ui/Button",
    });
    const source = `<button>Test</button>`;
    expect(runCodemod(t, "/fake/src/editor/__tests__/Foo.test.tsx", source)).toBe(source);
  });

  it("respects shouldSkipElement per-element gate", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "input",
      toName: "TextInput",
      toImport: "@/shared/ui/TextInput",
      shouldSkipElement: (_, el) => {
        // Skip <input type="checkbox">.
        const attrs = el.openingElement.attributes ?? [];
        for (const a of attrs) {
          if (a.type !== "JSXAttribute") continue;
          if (!a.name || (a.name as { name?: string }).name !== "type") continue;
          const v = a.value as { type?: string; value?: unknown } | null | undefined;
          if (v && (v.type === "Literal" || v.type === "StringLiteral") && v.value === "checkbox") {
            return true;
          }
        }
        return false;
      },
    });
    const source = `export function X() { return (<><input type="text" /><input type="checkbox" /></>); }`;
    const out = runCodemod(t, "/fake/src/editor/Foo.tsx", source);
    expect(out).toContain("<TextInput");
    // Checkbox stays untouched.
    expect(out).toContain('<input type="checkbox"');
  });

  it("is idempotent — does not double-import on rerun", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "button",
      toName: "Button",
      toImport: "@/shared/ui/Button",
    });
    const source = `export function X() { return <button>Hi</button>; }`;
    const first = runCodemod(t, "/fake/src/editor/Foo.tsx", source);
    const second = runCodemod(t, "/fake/src/editor/Foo.tsx", first);
    expect(second).toBe(first);
    // Only one import line.
    const matches = second.match(/from "@\/shared\/ui\/Button"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("bails (returns input unchanged) when zero matching elements", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "button",
      toName: "Button",
      toImport: "@/shared/ui/Button",
    });
    const source = `export const x = 1;`;
    expect(runCodemod(t, "/fake/src/editor/Foo.tsx", source)).toBe(source);
  });

  it("does not rename when the JSX tag already matches toName (no-op rename)", () => {
    const t = makeRenameJsxCodemod({
      fromTag: "Switch",
      toName: "Switch",
      toImport: "@/shared/ui/Switch",
    });
    const source = `export function X() { return <Switch checked={false} />; }`;
    const out = runCodemod(t, "/fake/src/editor/Foo.tsx", source);
    // Tag preserved + import added.
    expect(out).toContain("<Switch");
    expect(out).toContain('import { Switch } from "@/shared/ui/Switch"');
  });
});
