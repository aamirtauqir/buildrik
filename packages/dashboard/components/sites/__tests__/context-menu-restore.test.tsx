/**
 * The way back out of the archive.
 *
 * Archiving a site was one-way from the UI. This menu offered "Archive", the
 * bulk bar offered "Archive selected", and the filter row offered
 * "Archived · N" so you could go and look at the result — but nothing anywhere
 * brought a site back. `sites.unarchive` existed the whole time with zero
 * callers, and `sites.bulkAction` already accepted "unarchive" with a branch in
 * the page waiting for it.
 *
 * The rule these lock in: an ARCHIVED site is offered Restore instead of
 * Archive, and the action it dispatches is the one the router actually has.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextMenu } from "../context-menu";
import { BulkActionBar } from "../bulk-action-bar";

async function openMenu(status: string) {
  const onAction = vi.fn();
  render(<ContextMenu siteStatus={status} siteName="Pulse" onAction={onAction} />);
  await userEvent.click(screen.getByRole("button", { name: "More options for Pulse" }));
  return onAction;
}

describe("site context menu — archive is not a one-way door", () => {
  it("offers Archive on a live site, and not Restore", async () => {
    await openMenu("PUBLISHED");
    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
  });

  it("offers Restore on an archived site, and not Archive", async () => {
    await openMenu("ARCHIVED");
    expect(screen.getByRole("button", { name: "Restore" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("dispatches the action name the router exposes", async () => {
    const onAction = await openMenu("ARCHIVED");
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onAction).toHaveBeenCalledWith("unarchive");
  });

  // Everything else on the menu must survive the swap — the archived branch
  // maps over the same list rather than replacing it.
  it("keeps the rest of the menu on an archived site", async () => {
    await openMenu("ARCHIVED");
    for (const label of ["Edit", "Manage", "Rename", "Duplicate", "Delete"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });
});

describe("bulk action bar — the same door, for a selection", () => {
  it("offers Archive selected outside the archived view", () => {
    render(<BulkActionBar selectedCount={2} onAction={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Archive selected/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Restore selected/ })).toBeNull();
  });

  it("offers Restore selected inside it, dispatching unarchive", async () => {
    const onAction = vi.fn();
    render(<BulkActionBar selectedCount={2} archivedView onAction={onAction} onClear={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Archive selected/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Restore selected/ }));
    expect(onAction).toHaveBeenCalledWith("unarchive");
  });
});
