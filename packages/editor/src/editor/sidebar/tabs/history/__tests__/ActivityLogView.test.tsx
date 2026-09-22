// @vitest-environment jsdom
/**
 * ActivityLogView — B6 (code-gap plan).
 *
 * State machine + filter chips + deep-link smoke. The view fetches via
 * ActivityService; tests mock the service, not the network. The list
 * region carries `role="status"` + `aria-live="polite"` per the plan.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ActivityLogView } from "../components/ActivityLogView";
import type { ActivityEntry } from "@/services/ActivityService";

const fetchRecentActivity = vi.fn();
vi.mock("@/services/ActivityService", () => ({
  fetchRecentActivity: (siteId: string, filter: string) => fetchRecentActivity(siteId, filter),
}));

const SAMPLE_ROWS: ActivityEntry[] = [
  {
    id: "r1",
    kind: "edit",
    actorName: "Sara",
    summary: "Edited the hero headline.",
    actionUrl: "https://app.buildrick.io/dashboard/sites/s1#edit-1",
    createdAt: "2026-09-15T10:24:00.000Z",
  },
  {
    id: "r2",
    kind: "comment",
    actorName: "Tom",
    summary: "Asked about the menu layout.",
    actionUrl: null,
    createdAt: "2026-09-15T11:00:00.000Z",
  },
  {
    id: "r3",
    kind: "publish",
    actorName: "Sara",
    summary: "Published v7 to production.",
    actionUrl: "https://buildrick.io",
    createdAt: "2026-09-16T08:00:00.000Z",
  },
];

beforeEach(() => {
  fetchRecentActivity.mockReset();
  // Silence window.open — chips are testable without it firing.
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderView(siteId: string | null = "site_1") {
  return render(<ActivityLogView siteId={siteId} />);
}

describe("ActivityLogView — state machine", () => {
  it("renders loading skeletons on mount, then rows once the fetch resolves", async () => {
    let resolveFetch: (rows: ActivityEntry[]) => void = () => {};
    fetchRecentActivity.mockReturnValueOnce(new Promise((res) => (resolveFetch = res)));

    renderView();
    expect(screen.getByTestId("activity-loading")).toBeTruthy();

    resolveFetch(SAMPLE_ROWS);
    const region = await screen.findByTestId("activity-list");
    expect(region.getAttribute("data-state")).toBe("ready");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.getAttribute("role")).toBe("status");
    expect(screen.getAllByTestId("activity-kind").length).toBe(3);
  });

  it("renders the empty state when the service returns no rows", async () => {
    fetchRecentActivity.mockResolvedValueOnce([]);
    renderView();
    const empty = await screen.findByTestId("activity-empty");
    expect(empty).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
  });

  it("renders the error state with a Retry button when the service throws", async () => {
    fetchRecentActivity.mockRejectedValueOnce(new Error("network down"));
    renderView();
    const err = await screen.findByTestId("activity-error");
    expect(err.textContent).toContain("Couldn't load activity");
    const retry = screen.getByText("Retry") as HTMLButtonElement;
    fetchRecentActivity.mockResolvedValueOnce(SAMPLE_ROWS);
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByTestId("activity-rows")).toBeTruthy());
  });

  it("renders the permission state when the service throws 401/403 (procedure absent / signed-out)", async () => {
    fetchRecentActivity.mockRejectedValueOnce(new Error("401 unauthorized: activity.recent not found"));
    renderView();
    const perm = await screen.findByTestId("activity-permission");
    expect(perm).toBeTruthy();
    const open = screen.getByText("Open in dashboard") as HTMLButtonElement;
    fireEvent.click(open);
    expect(window.open).toHaveBeenCalledWith(
      "/dashboard/sites/site_1#activity-log",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("renders the no-site banner when siteId is null and skips the fetch entirely", () => {
    renderView(null);
    expect(screen.getByTestId("activity-no-site")).toBeTruthy();
    expect(fetchRecentActivity).not.toHaveBeenCalled();
  });
});

describe("ActivityLogView — filter behaviour", () => {
  it("passes the active filter through to the service on every change", async () => {
    fetchRecentActivity.mockResolvedValue([]);
    renderView();
    await screen.findByTestId("activity-empty"); // initial load settled

    fetchRecentActivity.mockClear();
    fetchRecentActivity.mockResolvedValueOnce([SAMPLE_ROWS[1]]);

    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    await waitFor(() => expect(fetchRecentActivity).toHaveBeenLastCalledWith("site_1", "comments"));

    fetchRecentActivity.mockResolvedValueOnce([SAMPLE_ROWS[2]]);
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(fetchRecentActivity).toHaveBeenLastCalledWith("site_1", "publish"));

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    await waitFor(() => expect(fetchRecentActivity).toHaveBeenLastCalledWith("site_1", "all"));
  });

  it("reflects the active filter via aria-pressed + chip class", async () => {
    fetchRecentActivity.mockResolvedValueOnce([]);
    renderView();
    await screen.findByTestId("activity-empty");

    const all = screen.getByRole("button", { name: "All" });
    const edits = screen.getByRole("button", { name: "Edits" });

    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(edits.getAttribute("aria-pressed")).toBe("false");

    fetchRecentActivity.mockResolvedValueOnce([]);
    fireEvent.click(edits);

    await waitFor(() => expect(edits.getAttribute("aria-pressed")).toBe("true"));
    expect(all.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("ActivityLogView — deep-link", () => {
  it("opens row.actionUrl in a new tab via window.open when the link is clicked", async () => {
    fetchRecentActivity.mockResolvedValueOnce(SAMPLE_ROWS);
    renderView();
    const links = await screen.findAllByText("View in dashboard");
    fireEvent.click(links[0]);
    expect(window.open).toHaveBeenCalledWith(
      "https://app.buildrick.io/dashboard/sites/s1#edit-1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("does not render the deep-link when actionUrl is null", async () => {
    fetchRecentActivity.mockResolvedValueOnce([SAMPLE_ROWS[1]]); // comment row with actionUrl=null
    renderView();
    await screen.findByTestId("activity-rows");
    expect(screen.queryByText("View in dashboard")).toBeNull();
  });
});
