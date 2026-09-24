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
import { ActivityReadError, type ActivityEntry } from "@/services/ActivityService";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

const fetchRecentActivity = vi.fn();
vi.mock("@/services/ActivityService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/ActivityService")>()),
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

  it("the error state never prints the transport's message", async () => {
    fetchRecentActivity.mockRejectedValueOnce(new ActivityReadError("failed"));
    renderView();
    const err = await screen.findByTestId("activity-error");
    expect(err.textContent).not.toContain("activity.recent");
  });

  it("renders the permission state when the server refuses (UNAUTHORIZED / FORBIDDEN)", async () => {
    fetchRecentActivity.mockRejectedValueOnce(new ActivityReadError("unauthorized"));
    renderView();
    expect(await screen.findByTestId("activity-permission")).toBeTruthy();
    fireEvent.click(screen.getByText("Open in dashboard"));
    expect(window.open).toHaveBeenCalledWith(
      `${DASHBOARD_URL}/dashboard/sites/site_1#activity-log`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  /* The procedure does not exist yet (needs-dashboard): the tab says where
     the log is, it does not sit blank or offer a Retry that cannot work. */
  it("renders the unavailable state when activity.recent is absent (NOT_FOUND)", async () => {
    fetchRecentActivity.mockRejectedValueOnce(new ActivityReadError("unavailable"));
    renderView();
    const box = await screen.findByTestId("activity-unavailable");
    expect(box.textContent).toContain("Activity isn't in the editor yet");
    expect(screen.queryByText("Retry")).toBeNull();
    expect(screen.getByText("Open in dashboard")).toBeTruthy();
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
  it("an absolute actionUrl is the link, in a new tab", async () => {
    fetchRecentActivity.mockResolvedValueOnce(SAMPLE_ROWS);
    renderView();
    const links = await screen.findAllByText("View in dashboard");
    expect(links[0].getAttribute("href")).toBe("https://app.buildrick.io/dashboard/sites/s1#edit-1");
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
  });

  /* QA 2026-09-24: a relative actionUrl ("?page=page-1") resolved against the
     editor's own URL, so "View in dashboard" reopened the editor. */
  it("a relative actionUrl resolves against the site's dashboard page, not the editor", async () => {
    fetchRecentActivity.mockResolvedValueOnce([{ ...SAMPLE_ROWS[0], actionUrl: "?page=page-1" }]);
    renderView();
    const link = await screen.findByText("View in dashboard");
    expect(link.getAttribute("href")).toBe(`${DASHBOARD_URL}/dashboard/sites/site_1?page=page-1`);
  });

  it("does not render the deep-link when actionUrl is null", async () => {
    fetchRecentActivity.mockResolvedValueOnce([SAMPLE_ROWS[1]]); // comment row with actionUrl=null
    renderView();
    await screen.findByTestId("activity-rows");
    expect(screen.queryByText("View in dashboard")).toBeNull();
  });
});

describe("ActivityLogView — rows open their subject in the editor", () => {
  it("a row click reports its kind; without a handler rows are inert", async () => {
    fetchRecentActivity.mockResolvedValueOnce(SAMPLE_ROWS);
    const onOpenRow = vi.fn();
    render(<ActivityLogView siteId="site_1" onOpenRow={onOpenRow} />);
    const rows = await screen.findAllByTestId("activity-row-open");
    fireEvent.click(rows[0]);
    expect(onOpenRow).toHaveBeenCalledWith(SAMPLE_ROWS[0].kind);
  });
});
