/**
 * Gap walk 93 #9: Sites ⋯ "Transfer Site" was offered to every role. Transfer
 * is the site owner's act on the server (sites.transfer: site role OWNER, and
 * the service refuses anyone but the creator), and team.list is ADMIN-gated,
 * so a non-owner got a Transfer modal with an empty member list. The row is
 * offered only where the server would accept it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextMenu } from "../context-menu";
import { SiteGrid } from "../site-grid";

describe("site context menu — Transfer Site is the owner's", () => {
  it("is not offered unless the caller says the viewer can transfer", async () => {
    render(<ContextMenu siteStatus="DRAFT" siteName="Pulse" onAction={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "More options for Pulse" }));
    expect(screen.queryByRole("button", { name: "Transfer Site" })).toBeNull();
  });

  it("is offered to the owner", async () => {
    render(<ContextMenu siteStatus="DRAFT" siteName="Pulse" canTransfer onAction={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "More options for Pulse" }));
    expect(screen.getByRole("button", { name: "Transfer Site" })).toBeTruthy();
  });

  it("the grid offers it only on sites the workspace owner created", async () => {
    const base = { slug: "s", status: "DRAFT", thumbnail: null, pages: 1, lastEditedAt: new Date(), publishedUrl: null, visitors30d: 0, domain: null };
    render(
      <SiteGrid
        sites={[
          { ...base, id: "a", name: "Mine", createdBy: "u-owner" },
          { ...base, id: "b", name: "Theirs", createdBy: "u-other" },
        ]}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onAction={vi.fn()}
        transferOwnerId="u-owner"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "More options for Mine" }));
    expect(screen.getByRole("button", { name: "Transfer Site" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "More options for Theirs" }));
    expect(screen.queryAllByRole("button", { name: "Transfer Site" })).toHaveLength(0);
  });
});
