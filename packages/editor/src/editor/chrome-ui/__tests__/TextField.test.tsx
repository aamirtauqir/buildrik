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
    expect(input.className).toMatch(/tw:border-gray-300/);
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

  it("keeps a caller-supplied className on the real <input> — base classes first so the caller's own box-owning class wins the merge", () => {
    render(<TextField aria-label="Rename page" className="bd-pg-row-rename" />);
    const input = screen.getByLabelText("Rename page");
    // Caller class survives the merge...
    expect(input.className).toMatch(/\bbd-pg-row-rename\b/);
    // ...and is the LAST class in the merged string, so it wins the
    // cascade against the base tw:* utilities for any property a caller
    // stylesheet chooses to re-declare (same contract call sites like
    // `.tt-slider` / `.exp-folder-item__rename-input` depend on).
    const classes = input.className.trim().split(/\s+/);
    expect(classes[classes.length - 1]).toBe("bd-pg-row-rename");
  });

  it("forwards ref to the real <input> element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextField ref={ref} aria-label="Domain" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("INPUT");
  });
});
