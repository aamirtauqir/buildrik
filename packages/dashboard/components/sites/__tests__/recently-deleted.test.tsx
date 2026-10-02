/**
 * Sites › Recently deleted (PD-6, plan row #54): rows from `sites.listDeleted`
 * with the purge day, Restore for the owner only, and the empty state.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentlyDeleted, purgeIn } from "../recently-deleted";

const NOW = Date.UTC(2026, 9, 3);
const row = { id: "s1", name: "Bella Cucina", slug: "bella-cucina", deletedAt: new Date(NOW - 86_400_000), purgeAt: new Date(NOW + 29 * 86_400_000) };

describe("RecentlyDeleted", () => {
  it("lists the site with Restore; the owner's click restores it", () => {
    const onRestore = vi.fn();
    render(<RecentlyDeleted rows={[row]} canRestore restoringId={null} onRestore={onRestore} />);
    expect(screen.getByText("Bella Cucina")).toBeInTheDocument();
    expect(screen.getByText("bella-cucina")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("restore-site-s1"));
    expect(onRestore).toHaveBeenCalledWith(row);
  });

  it("Restore is off below owner, and says why", () => {
    render(<RecentlyDeleted rows={[row]} canRestore={false} restoringId={null} onRestore={vi.fn()} />);
    expect(screen.getByTestId("restore-site-s1")).toBeDisabled();
    expect(screen.getByTestId("restore-site-s1")).toHaveAttribute("title", "Only the workspace owner can restore a site");
  });

  it("says when nothing was deleted", () => {
    render(<RecentlyDeleted rows={[]} canRestore restoringId={null} onRestore={vi.fn()} />);
    expect(screen.getByTestId("recently-deleted-empty")).toHaveTextContent("No sites deleted in the last 30 days.");
  });

  it("purgeIn counts whole days left", () => {
    expect(purgeIn(new Date(NOW + 29 * 86_400_000), NOW)).toBe("in 29 days");
    expect(purgeIn(new Date(NOW + 86_400_000), NOW)).toBe("tomorrow");
    expect(purgeIn(new Date(NOW - 1), NOW)).toBe("today");
  });
});
