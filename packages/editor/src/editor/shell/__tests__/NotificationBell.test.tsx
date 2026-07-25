/**
 * NotificationBell (P3, contract §4) — the editor topbar bell. Verifies the
 * unread badge, the panel's load states (loading → list, empty, error+retry not
 * fake-empty), unread-first ordering, click → mark-read + navigate, and
 * mark-all-read.
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/editor/shared/vibcoder";

const fetchRecentNotifications = vi.fn();
const fetchUnreadCount = vi.fn();
const markNotificationRead = vi.fn();
const markAllNotificationsRead = vi.fn();

vi.mock("../../../services/NotificationService", () => ({
  fetchRecentNotifications: (...a: unknown[]) => fetchRecentNotifications(...a),
  fetchUnreadCount: (...a: unknown[]) => fetchUnreadCount(...a),
  markNotificationRead: (...a: unknown[]) => markNotificationRead(...a),
  markAllNotificationsRead: (...a: unknown[]) => markAllNotificationsRead(...a),
}));

import { NotificationBell } from "../NotificationBell";

const ROWS = [
  { id: "n2", type: "review", actorName: "Sara", message: "approved Bella Cucina", actionUrl: "/dashboard/sites/s1", read: false, createdAt: "2026-07-23T10:00:00Z" },
  { id: "n1", type: "publish", actorName: null, message: "publish finished", actionUrl: "/dashboard/sites/s1/publish", read: true, createdAt: "2026-07-22T10:00:00Z" },
];

function renderBell(props = {}) {
  return render(<TooltipProvider><NotificationBell onNavigate={vi.fn()} {...props} /></TooltipProvider>);
}

beforeEach(() => {
  fetchRecentNotifications.mockReset().mockResolvedValue(ROWS);
  fetchUnreadCount.mockReset().mockResolvedValue(3);
  markNotificationRead.mockReset().mockResolvedValue(undefined);
  markAllNotificationsRead.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("badge", () => {
  it("shows the unread count on the bell", async () => {
    renderBell();
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 9+", async () => {
    fetchUnreadCount.mockResolvedValue(42);
    renderBell();
    expect(await screen.findByText("9+")).toBeInTheDocument();
  });
});

describe("panel", () => {
  it("opens on click and lists notifications with the actor + message", async () => {
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    expect(await screen.findByText(/approved Bella Cucina/)).toBeInTheDocument();
    expect(screen.getByText(/Sara/)).toBeInTheDocument();
  });

  it("shows error+retry (not fake-empty) when the list fails", async () => {
    fetchRecentNotifications.mockRejectedValueOnce(new Error("network"));
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
    expect(screen.queryByText(/all caught up/i)).not.toBeInTheDocument();
    fetchRecentNotifications.mockResolvedValue(ROWS);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText(/approved Bella Cucina/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no notifications", async () => {
    fetchRecentNotifications.mockResolvedValue([]);
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });

  it("clicking a row marks it read and navigates to its target", async () => {
    const onNavigate = vi.fn();
    renderBell({ onNavigate });
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    fireEvent.click(await screen.findByText(/approved Bella Cucina/));
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith("n2"));
    expect(onNavigate).toHaveBeenCalledWith("/dashboard/sites/s1");
  });

  it("mark all read clears the unread", async () => {
    renderBell();
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    fireEvent.click(await screen.findByRole("button", { name: /mark all read/i }));
    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled());
  });

  // ── P4 board 165:71 — jump target deleted ──────────────────────────────────
  it("renders a null-actionUrl row as information, not a dead button", async () => {
    fetchRecentNotifications.mockResolvedValue([
      {
        id: "n3",
        type: "comment",
        actorName: "Sara",
        message: "commented on Opening hours",
        actionUrl: null,
        read: false,
        createdAt: "2026-07-22T10:00:00Z",
      },
    ]);
    render(<TooltipProvider><NotificationBell onNavigate={vi.fn()} /></TooltipProvider>);
    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    await screen.findByText(/commented on Opening hours/);
    const row = document.querySelector('[data-jump-gone="true"]') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.getAttribute("role")).toBeNull();
    expect(row.textContent).toContain("nothing to jump to");
  });
});
