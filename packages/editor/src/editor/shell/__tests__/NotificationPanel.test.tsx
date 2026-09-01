/**
 * The bell counts more than the panel can show.
 *
 * Walked live 2026-08-18: the bell read "Notifications, 25 unread" and the
 * panel rendered five rows. `getRecentNotifications` takes 5 by design, and
 * the panel had no footer — so twenty unread notifications were counted in
 * the badge and reachable from nowhere in the editor. The dashboard has
 * rendered the full grouped list at /dashboard/notifications the whole time.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchRecentNotifications = vi.fn();
const markNotificationRead = vi.fn();
const markAllNotificationsRead = vi.fn();
vi.mock("@/services/NotificationService", () => ({
  fetchRecentNotifications: () => fetchRecentNotifications(),
  markNotificationRead: (id: string) => markNotificationRead(id),
  markAllNotificationsRead: () => markAllNotificationsRead(),
}));

import { NotificationPanel } from "../NotificationPanel";

const row = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  type: "PUBLISH_STARTED",
  actorName: null,
  message: 'Site "Demo AI Site" publish started',
  actionUrl: "/dashboard/sites",
  read: false,
  createdAt: new Date().toISOString(),
  ...over,
});

afterEach(cleanup);

describe("NotificationPanel — loading holds the shape (board 165:51)", () => {
  /* The board's own note is the requirement: "Rows keep their 44h so the
     panel does not jump when they fill." A spinner satisfied no part of it.
     jsdom compiles no Tailwind, so height is pinned by the class that sets
     it — the same lever LayerTreeItem's indent test uses for its ladder. */
  it("draws four 44h rows under a day band instead of a spinner", () => {
    fetchRecentNotifications.mockReturnValue(new Promise(() => {}));
    const { container } = render(<NotificationPanel onClose={vi.fn()} />);

    const loading = screen.getByRole("status", { name: "Loading notifications" });
    const rows = loading.querySelectorAll(".tw\\:h-11");
    expect(rows).toHaveLength(4);

    // Two placeholders per row: the 8px status dot and the 220px message bar.
    expect(loading.querySelectorAll(".bk-skeleton")).toHaveLength(8);

    // The band is real, not a placeholder — it is what the loaded list shows
    // in the same slot, so the swap moves nothing.
    expect(loading.textContent).toContain("TODAY");

    // The centred spinner and the rule that positioned it are both gone.
    expect(container.querySelector(".bk-notifications__center")).toBeNull();
  });
});

describe("NotificationPanel — the way to the rest of them", () => {
  it("offers the full list once rows are on screen", async () => {
    fetchRecentNotifications.mockResolvedValue([row()]);
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<NotificationPanel onClose={onClose} onNavigate={onNavigate} />);

    const link = await screen.findByText("See all notifications");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith("/dashboard/notifications");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not offer it over an empty list — there is nothing more to see", async () => {
    fetchRecentNotifications.mockResolvedValue([]);
    render(<NotificationPanel onClose={vi.fn()} />);

    await screen.findByText("You're all caught up");
    expect(screen.queryByText("See all notifications")).not.toBeInTheDocument();
  });

  it("keeps a notification whose target is gone as information, not a button", async () => {
    fetchRecentNotifications.mockResolvedValue([row({ actionUrl: null })]);
    const onNavigate = vi.fn();
    const { container } = render(<NotificationPanel onClose={vi.fn()} onNavigate={onNavigate} />);

    await waitFor(() => expect(container.querySelector('[data-jump-gone="true"]')).toBeTruthy());
    expect(screen.getByText(/The target is gone/)).toBeInTheDocument();
    fireEvent.click(container.querySelector('[data-jump-gone="true"]') as HTMLElement);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
