/**
 * ComparePicker (B8) — four baselines, one picker.
 *
 * Chip styling matches the History filter row (and the ActivityLog chips) so a
 * chip reads the same wherever the picker appears. `current` is the working
 * draft and is always present; the other three are disabled with a reason
 * when the baseline does not exist (Decision 31, board 4418:115592).
 *
 * Gate 24: chips route through chrome-ui Button — zero raw HTML controls.
 *
 * @license BSD-3-Clause
 */

import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { CompareBaseline, ComparePickerProps } from "../../types";
import { ComparePicker } from "../ComparePicker";

const ALL_ENABLED: ComparePickerProps["availability"] = {
  approved: { available: true },
  published: { available: true },
  saved: { available: true },
  current: { available: true },
};

const REASON_APPROVED = "No review round is open — nothing has been approved yet.";
const REASON_PUBLISHED = "Publish the site once to start a publish history.";
const REASON_SAVED = "No saved milestones yet — save once to start a history.";

const renderPicker = (overrides: Partial<ComparePickerProps> = {}) => {
  const onChange = vi.fn();
  const props: ComparePickerProps = {
    availability: ALL_ENABLED,
    value: "current",
    onChange,
    ...overrides,
  };
  render(<ComparePicker {...props} />);
  return { onChange };
};

afterEach(cleanup);

describe("ComparePicker — four baselines", () => {
  it("renders one chip per baseline, in order approved → published → saved → current", () => {
    renderPicker();
    const order: CompareBaseline[] = ["approved", "published", "saved", "current"];
    for (let i = 0; i < order.length; i++) {
      const chip = screen.getByTestId(`compare-picker-${order[i]}`);
      expect(chip).toBeInTheDocument();
      // Order assertion: each chip sits AFTER the previous one in the DOM.
      const prev = i === 0 ? null : screen.getByTestId(`compare-picker-${order[i - 1]}`);
      if (prev) {
        expect(
          prev.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
    }
  });

  it("marks the active baseline with aria-pressed and the others with aria-pressed=false", () => {
    renderPicker({ value: "saved" });
    expect(screen.getByTestId("compare-picker-saved")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("compare-picker-approved")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("compare-picker-published")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("compare-picker-current")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked baseline when it's available", () => {
    const { onChange } = renderPicker({ value: "current" });
    screen.getByTestId("compare-picker-saved").click();
    expect(onChange).toHaveBeenCalledWith("saved");
  });

  it("does not call onChange when the clicked baseline is disabled", () => {
    const { onChange } = renderPicker({
      value: "current",
      availability: {
        ...ALL_ENABLED,
        approved: { available: false, reason: REASON_APPROVED },
      },
    });
    const chip = screen.getByTestId("compare-picker-approved");
    expect(chip).toBeDisabled();
    chip.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("carries the reason in the disabled chip's title so hover explains why", () => {
    renderPicker({
      value: "current",
      availability: {
        ...ALL_ENABLED,
        approved: { available: false, reason: REASON_APPROVED },
        published: { available: false, reason: REASON_PUBLISHED },
        saved: { available: false, reason: REASON_SAVED },
      },
    });
    expect(screen.getByTestId("compare-picker-approved")).toHaveAttribute("title", REASON_APPROVED);
    expect(screen.getByTestId("compare-picker-published")).toHaveAttribute("title", REASON_PUBLISHED);
    expect(screen.getByTestId("compare-picker-saved")).toHaveAttribute("title", REASON_SAVED);
  });

  it("omits the title when the baseline is available (no reason needed)", () => {
    renderPicker();
    expect(screen.getByTestId("compare-picker-approved")).not.toHaveAttribute("title");
    expect(screen.getByTestId("compare-picker-current")).not.toHaveAttribute("title");
  });

  it("treats current as the always-on constant peer", () => {
    renderPicker({
      value: "approved",
      availability: {
        approved: { available: false, reason: REASON_APPROVED },
        published: { available: false, reason: REASON_PUBLISHED },
        saved: { available: false, reason: REASON_SAVED },
        current: { available: true },
      },
    });
    const chip = screen.getByTestId("compare-picker-current");
    expect(chip).not.toBeDisabled();
    /* chrome-ui Button only renders aria-disabled when truthy; the omitted
       attribute itself is the contract. */
    expect(chip).not.toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the group label so AT announces the picker", () => {
    renderPicker();
    expect(screen.getByRole("group", { name: "Compare baseline" })).toBeInTheDocument();
  });
});
