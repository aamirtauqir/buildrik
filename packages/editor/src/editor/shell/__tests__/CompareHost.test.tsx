/**
 * CompareHost — B8 (G1-061): every Compare door opens this one component,
 * with a picker on each side.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchApprovedSnapshot = vi.fn();
const fetchPublishHistory = vi.fn();
const fetchPublishDiff = vi.fn();
const exportPublishPages = vi.fn();

vi.mock("@/services/ReviewService", () => ({
  fetchApprovedSnapshot: (...a: unknown[]) => fetchApprovedSnapshot(...a),
}));
vi.mock("@/services/PublishService", () => ({
  fetchPublishHistory: (...a: unknown[]) => fetchPublishHistory(...a),
  fetchPublishDiff: (...a: unknown[]) => fetchPublishDiff(...a),
}));
vi.mock("../exportPublishPages", () => ({
  exportPublishPages: (...a: unknown[]) => exportPublishPages(...a),
}));

import { CompareHost } from "../CompareHost";
import { EVENTS } from "@/shared/constants/events";
import type { CompareRequest } from "@/shared/types/compare";

function makeComposer() {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  return {
    on: (e: string, h: (p: unknown) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (p: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p: unknown) => handlers.get(e)?.forEach((h) => h(p)),
    versions: { getVersions: () => [] },
  };
}

const page = (html: string) => [{ path: "index.html", html }];

beforeEach(() => {
  vi.clearAllMocks();
  fetchApprovedSnapshot.mockResolvedValue(page("<h1>approved</h1>"));
  fetchPublishHistory.mockResolvedValue([
    { id: "j6", version: 6 },
    { id: "j5", version: 5 },
  ]);
  fetchPublishDiff.mockResolvedValue({ retained: true, pages: [], added: 0, removed: 0, changed: 0 });
  exportPublishPages.mockResolvedValue(page("<h1>current</h1>"));
});
afterEach(cleanup);

function openOn(req: CompareRequest) {
  const composer = makeComposer();
  render(<CompareHost composer={composer as never} siteId="s1" />);
  act(() => composer.emit(EVENTS.UI_COMPARE_OPEN, req));
  return composer;
}

describe("CompareHost", () => {
  it("renders nothing until a door opens it", () => {
    render(<CompareHost composer={makeComposer() as never} siteId="s1" />);
    expect(screen.queryByTestId("compare-overlay")).toBeNull();
  });

  it("a Review door opens approved → current draft, with both pickers and where it came from", async () => {
    openOn({ left: { kind: "approved" }, right: { kind: "current" }, from: "Review" });
    const overlay = await screen.findByTestId("compare-overlay");
    await within(overlay).findByTestId("compare-pane-approved");
    expect(within(overlay).getByTestId("compare-opened-from")).toHaveTextContent("Opened from Review");
    expect((screen.getByLabelText("Compare from") as HTMLSelectElement).value).toBe("approved");
    expect((screen.getByLabelText("Compare to") as HTMLSelectElement).value).toBe("current");
    expect(screen.getByTestId("compare-pane-current-label")).toHaveTextContent("Current draft");
  });

  it("the picker lists the board's sources — published newest as live, and current draft", async () => {
    openOn({ left: { kind: "approved" }, right: { kind: "current" }, from: "History" });
    await waitFor(() => expect(fetchPublishHistory).toHaveBeenCalledWith("s1"));
    const labels = await waitFor(() => {
      const opts = [...(screen.getByLabelText("Compare from") as HTMLSelectElement).options].map((o) => o.textContent);
      expect(opts).toContain("v6 · live");
      return opts;
    });
    expect(labels).toEqual(["Approved", "v6 · live", "v5 · published", "Saved — no saved versions yet", "Current draft"]);
  });

  it("two published versions show the server's page diff for exactly those jobs", async () => {
    openOn({
      left: { kind: "published", jobId: "j5", version: 5 },
      right: { kind: "published", jobId: "j6", version: 6 },
      from: "History",
    });
    await waitFor(() => expect(fetchPublishDiff).toHaveBeenCalledWith("s1", "j5", "j6"));
    expect(await screen.findByTestId("publish-diff")).toBeInTheDocument();
    expect(exportPublishPages).not.toHaveBeenCalled();
  });

  it("leaving published on one side moves the other back to a page source", async () => {
    openOn({
      left: { kind: "published", jobId: "j5", version: 5 },
      right: { kind: "published", jobId: "j6", version: 6 },
      from: "History",
    });
    await screen.findByTestId("publish-diff");
    fireEvent.change(screen.getByLabelText("Compare to"), { target: { value: "current" } });
    await waitFor(() => expect((screen.getByLabelText("Compare from") as HTMLSelectElement).value).toBe("approved"));
    expect(await screen.findByTestId("compare-pane-approved")).toBeInTheDocument();
  });

  it("identical sides say there are no differences (#31)", async () => {
    exportPublishPages.mockResolvedValue(page("<h1>same</h1>"));
    openOn({ left: { kind: "current" }, right: { kind: "current" }, from: "History" });
    expect(await screen.findByText("No differences")).toBeInTheDocument();
  });

  it("a failed side shows a retryable error, not an empty diff", async () => {
    fetchApprovedSnapshot.mockRejectedValue(new Error("offline"));
    openOn({ left: { kind: "approved" }, right: { kind: "current" }, from: "Review" });
    expect(await screen.findByText("Couldn't load this comparison")).toBeInTheDocument();
    fetchApprovedSnapshot.mockResolvedValue(page("<h1>approved</h1>"));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("compare-pane-approved")).toBeInTheDocument();
  });

  it("closes", async () => {
    openOn({ left: { kind: "approved" }, right: { kind: "current" }, from: "Review" });
    await screen.findByTestId("compare-pane-approved");
    fireEvent.click(screen.getByTestId("compare-close"));
    await waitFor(() => expect(screen.queryByTestId("compare-overlay")).toBeNull());
  });
});
