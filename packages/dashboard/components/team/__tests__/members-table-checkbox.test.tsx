/**
 * B-16 (A13-7): the row-selection checkbox was `readOnly` with
 * `pointer-events-none` — real for screen readers (Tab reaches it, Space does
 * nothing) but fake as a control. Selection only happened via the row's own
 * onClick. Made it a real checkbox (onChange, no pointer-events-none), with
 * onClick stopPropagation so a direct click doesn't also fire the row's
 * handler and net-cancel the toggle.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembersTable, type Member } from "../members-table";

const member: Member = {
  id: "m1",
  userId: "u1",
  fullName: "Jamie Rivera",
  email: "jamie@example.com",
  avatar: null,
  role: "EDITOR",
  status: "ACTIVE",
  lastActiveAt: null,
  joinedAt: new Date("2026-01-01"),
  sitesAccess: "All sites",
};

describe("MembersTable selection checkbox", () => {
  it("Space on the focused checkbox toggles selection exactly once", async () => {
    const user = userEvent.setup();
    render(
      <MembersTable
        members={[member]}
        currentUserId="someone-else"
        onAction={vi.fn()}
        selectMode
        onExitSelectMode={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Select Jamie Rivera" });
    expect(checkbox).not.toBeChecked();

    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();

    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
  });

  it("clicking the checkbox directly doesn't double-toggle with the row's own handler", async () => {
    const user = userEvent.setup();
    render(
      <MembersTable
        members={[member]}
        currentUserId="someone-else"
        onAction={vi.fn()}
        selectMode
        onExitSelectMode={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Select Jamie Rivera" });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
