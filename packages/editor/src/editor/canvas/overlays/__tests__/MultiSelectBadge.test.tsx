/**
 * MultiSelectBadge — the label-formatting logic (primary vs count, plural "s",
 * and the <=1 render-nothing guard). Visual styling is not asserted.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { MultiSelectBadge } from "../MultiSelectBadge";

describe("MultiSelectBadge — render guard", () => {
  it("renders nothing when a single element is selected", () => {
    const { container } = render(
      <MultiSelectBadge selectedIds={["a"]} onClear={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the selection is empty", () => {
    const { container } = render(<MultiSelectBadge selectedIds={[]} onClear={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("MultiSelectBadge — label formatting", () => {
  it("shows a plain count when there is no primary id", () => {
    render(<MultiSelectBadge selectedIds={["a", "b", "c"]} onClear={vi.fn()} />);
    expect(screen.getByText("3 elements selected")).toBeInTheDocument();
  });

  it("shows 'Primary + N others' (plural) when a primary id is set", () => {
    render(<MultiSelectBadge selectedIds={["a", "b", "c"]} primaryId="a" onClear={vi.fn()} />);
    // othersCount = 3 - 1 = 2 → plural
    expect(screen.getByText("Primary + 2 others")).toBeInTheDocument();
  });

  it("uses the singular 'other' when exactly one non-primary is selected", () => {
    render(<MultiSelectBadge selectedIds={["a", "b"]} primaryId="a" onClear={vi.fn()} />);
    expect(screen.getByText("Primary + 1 other")).toBeInTheDocument();
  });
});

describe("MultiSelectBadge — clear action", () => {
  it("invokes onClear when the clear button is pressed", () => {
    const onClear = vi.fn();
    render(<MultiSelectBadge selectedIds={["a", "b"]} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
