/**
 * TextField — contract tests.
 *
 * Regression coverage for the flowbite-bigbang T13 defect: the deleted
 * `editor/ui/ui.css` `.bk-input` block was never ported, so every
 * TextField rendered as an unstyled browser-default `<input>`. These
 * assert the component carries real `tw:*` styling (not just the
 * vestigial `bk-input` marker className) and that a caller-supplied
 * className survives the merge instead of being dropped or fought.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("carries real tw: styling classes, not just the vestigial bk-input marker", () => {
    render(<TextField aria-label="Domain" />);
    const input = screen.getByLabelText("Domain");
    // The marker className survives (kept as a semantic hook, same
    // precedent Skeleton.tsx documents for `bk-skeleton`)...
    expect(input.className).toMatch(/\bbk-input\b/);
    // ...but the actual box now comes from real tw: utilities recreating
    // the deleted `.bk-input` CSS block.
    expect(input.className).toMatch(/tw:border-\[var\(--bk-gray-300\)\]/);
    expect(input.className).toMatch(/tw:bg-white/);
    expect(input.className).toMatch(/tw:rounded-lg/);
    expect(input.className).toMatch(/tw:focus:border-primary-700/);
  });

  it("shows a visible focus ring via the ported --bk-shadow-focus box-shadow", () => {
    render(<TextField aria-label="Domain" />);
    expect(screen.getByLabelText("Domain").className).toMatch(
      /tw:focus:\[box-shadow:var\(--bk-shadow-focus\)\]/,
    );
  });

  it("marks the error state for assistive tech and reproduces the invalid border", () => {
    render(<TextField aria-label="Domain" error />);
    const input = screen.getByLabelText("Domain");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toMatch(/aria-invalid:border-\[var\(--bk-error\)\]/);
  });

  it("has no aria-invalid when healthy", () => {
    render(<TextField aria-label="Domain" />);
    expect(screen.getByLabelText("Domain").getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps a caller-supplied className on the real <input> — the caller's own box-owning class wins the merge via CSS layers, not string position", () => {
    render(<TextField aria-label="Rename page" className="bd-pg-row-rename" />);
    const input = screen.getByLabelText("Rename page");
    // Caller class survives the merge...
    expect(input.className).toMatch(/\bbd-pg-row-rename\b/);
    // ...and wins the cascade against BASE's tw:* utilities for any
    // property a caller stylesheet chooses to re-declare (same contract
    // call sites like `.tt-slider` / `.exp-folder-item__rename-input`
    // depend on) — but NOT because it happens to be last in the joined
    // className string. Position within a `class="a b c"` attribute has no
    // effect on the cascade; browsers don't consult DOM attribute order
    // when resolving conflicting declarations. The real reason: BASE's
    // `tw:*` utilities compile into the named `tw-utilities` CSS layer
    // (packages/editor/src/themes/tw.css's `@layer tw-theme, tw-utilities;`
    // + default.css's `@layer reset, components, overrides;` chain), while
    // a caller's own class like `bd-pg-row-rename` is defined in that
    // caller's own plain CSS file, imported directly (not routed through
    // the `@layer` system) and therefore genuinely UNLAYERED. Per the CSS
    // cascade-layers spec, ANY unlayered declaration beats EVERY layered
    // one, regardless of specificity or source order — this is why the
    // merge order in TextField.tsx's
    // `["bk-input", BASE, className].filter(Boolean).join(" ")` array
    // could be written in any order with the same visual result. A future
    // caller passing a `tw:*` override instead of their own unlayered class
    // would NOT get this same guarantee — that override would land in the
    // `tw-utilities` layer too, and resolve by Tailwind's own internal
    // utility order, not by "comes after BASE in the array."
    const classes = input.className.trim().split(/\s+/);
    expect(classes).toContain("bd-pg-row-rename");
  });

  it("forwards ref to the real <input> element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextField ref={ref} aria-label="Domain" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("INPUT");
  });
});
