/**
 * B-16 (A13-8): the sites context menu and the team member-actions menu had
 * no Escape handling and no focus-return — closing either by keyboard left
 * focus wherever the browser default landed it (often document.body), so a
 * keyboard user lost their place on the row entirely.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextMenu } from "../context-menu";
import { MemberActions } from "@/components/team/member-actions";

describe("Escape closes the menu and returns focus to its trigger", () => {
  it("site context menu", async () => {
    const user = userEvent.setup();
    render(<ContextMenu siteStatus="PUBLISHED" siteName="Pulse" onAction={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "More options for Pulse" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("team member actions menu", async () => {
    const user = userEvent.setup();
    render(<MemberActions memberId="m1" onAction={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Member actions" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Remove Member" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Remove Member" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
