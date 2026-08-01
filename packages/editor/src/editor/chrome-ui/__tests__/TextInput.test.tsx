/**
 * TextInput wrapper — contract tests (chrome-ui-single-surface spec §2(b), B1).
 *
 * flowbiteStore is configured globally via src/test-setup.ts (tw: prefix) —
 * no explicit import needed here, matching tw-setup.test.tsx.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextInput } from "../TextInput";

describe("TextInput wrapper", () => {
  it("applies BK_TEXT_INPUT_THEME by default with no consumer theme prop", () => {
    render(<TextInput aria-label="Domain" />);
    const input = screen.getByLabelText("Domain");
    // BK_TEXT_INPUT_THEME's field.input.colors.gray override — proves the
    // default theme was applied without the caller passing `theme` at all.
    expect(input.className).toMatch(/tw:bg-white/);
    expect(input.className).toMatch(/tw:focus:border-primary-700/);
  });

  it("deep-merges a caller theme on top — caller key wins, a default key survives", () => {
    render(
      <TextInput
        aria-label="Domain"
        theme={{ field: { input: { base: "probe-caller-base" } } }}
      />,
    );
    const input = screen.getByLabelText("Domain");
    // Caller-only key (field.input.base) is present — proves the caller's
    // theme was actually applied, not discarded.
    expect(input.className).toMatch(/probe-caller-base/);
    // Default key the caller never touched (field.input.colors.gray) still
    // survives — this is the assertion that would FAIL if the merge were a
    // shallow override (caller theme replacing the default outright instead
    // of composing with it).
    expect(input.className).toMatch(/tw:bg-white/);
  });

  it("a caller value at the SAME leaf as a default replaces it, not concatenates", () => {
    render(
      <TextInput
        aria-label="Domain"
        theme={{ field: { input: { colors: { gray: "probe-caller-gray" } } } }}
      />,
    );
    const input = screen.getByLabelText("Domain");
    expect(input.className).toMatch(/probe-caller-gray/);
    expect(input.className).not.toMatch(/tw:bg-white/);
  });

  it("forwards ref to the real <input> element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextInput ref={ref} aria-label="Domain" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("INPUT");
  });
});
