/**
 * §14 MultiSelectBanner tests — Phase 5 Tasks 26-27.
 *
 * Asserts the multi-select banner renders count + Move / Delete / Cancel
 * actions per prototype-v3 §14.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelectBanner } from "../MultiSelectBanner";

describe("§14 MultiSelectBanner", () => {
  it("shows count of selected assets (singular)", () => {
    render(
      <MultiSelectBanner
        count={1}
        onMove={() => {}}
        onDelete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
  });

  it("shows count of selected assets (plural)", () => {
    render(
      <MultiSelectBanner
        count={3}
        onMove={() => {}}
        onDelete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it("fires onMove / onDelete / onCancel on the respective buttons", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();
    render(
      <MultiSelectBanner
        count={2}
        onMove={onMove}
        onDelete={onDelete}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /move to folder/i }));
    expect(onMove).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /delete selected/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /cancel selection/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders region with aria-label", () => {
    render(
      <MultiSelectBanner
        count={1}
        onMove={() => {}}
        onDelete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(
      screen.getByRole("region", { name: /multi-select actions/i }),
    ).toBeInTheDocument();
  });
});
