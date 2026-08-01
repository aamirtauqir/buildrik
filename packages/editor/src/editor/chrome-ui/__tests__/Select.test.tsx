/**
 * Select wrapper — contract tests (chrome-ui-single-surface spec §2(b), B1).
 *
 * flowbiteStore is configured globally via src/test-setup.ts (tw: prefix) —
 * no explicit import needed here, matching tw-setup.test.tsx.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "../Select";

describe("Select wrapper", () => {
  it("applies BK_SELECT_BASE_THEME by default with no consumer theme prop", () => {
    render(
      <Select aria-label="Unit">
        <option value="px">px</option>
      </Select>,
    );
    const select = screen.getByLabelText("Unit");
    // BK_SELECT_BASE_THEME's field.select.colors.gray override — proves the
    // default theme was applied without the caller passing `theme` at all.
    expect(select.className).toMatch(/tw:bg-white/);
    expect(select.className).toMatch(/tw:focus:border-primary-700/);
  });

  it("deep-merges a caller theme on top — caller key wins, a default key survives", () => {
    render(
      <Select aria-label="Unit" theme={{ field: { select: { base: "probe-caller-base" } } }}>
        <option value="px">px</option>
      </Select>,
    );
    const select = screen.getByLabelText("Unit");
    // Caller-only key (field.select.base) is present — proves the caller's
    // theme was actually applied, not discarded.
    expect(select.className).toMatch(/probe-caller-base/);
    // Default key the caller never touched (field.select.colors.gray) still
    // survives — this is the assertion that would FAIL if the merge were a
    // shallow override (caller theme replacing the default outright instead
    // of composing with it).
    expect(select.className).toMatch(/tw:bg-white/);
  });

  it("a caller value at the SAME leaf as a default replaces it, not concatenates", () => {
    render(
      <Select aria-label="Unit" theme={{ field: { select: { colors: { gray: "probe-caller-gray" } } } }}>
        <option value="px">px</option>
      </Select>,
    );
    const select = screen.getByLabelText("Unit");
    expect(select.className).toMatch(/probe-caller-gray/);
    expect(select.className).not.toMatch(/tw:bg-white/);
  });

  it("forwards ref to the real <select> element", () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(
      <Select ref={ref} aria-label="Unit">
        <option value="px">px</option>
      </Select>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("SELECT");
  });
});
