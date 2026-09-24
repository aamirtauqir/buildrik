/**
 * ActivityService — B6. A failed read becomes an ActivityReadError whose
 * reason picks the view's state; the transport's text never reaches the UI.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ activity: { recent: { query: (...a: unknown[]) => query(...a) } } }),
}));

import { ActivityReadError, fetchRecentActivity } from "../ActivityService";

const failWith = (code: string) => query.mockRejectedValueOnce(Object.assign(new Error("x"), { data: { code } }));

describe("fetchRecentActivity", () => {
  it("asks for the site and filter, and maps rows", async () => {
    query.mockResolvedValueOnce([
      { id: "a", kind: "edit", actorName: undefined, summary: "s", actionUrl: undefined, createdAt: "2026-09-01" },
    ]);
    const rows = await fetchRecentActivity("s1", "edits");
    expect(query).toHaveBeenLastCalledWith({ siteId: "s1", filter: "edits" });
    expect(rows[0]).toMatchObject({ id: "a", actorName: null, actionUrl: null });
  });

  it.each([
    ["NOT_FOUND", "unavailable"],
    ["UNAUTHORIZED", "unauthorized"],
    ["FORBIDDEN", "unauthorized"],
    ["INTERNAL_SERVER_ERROR", "failed"],
  ])("a %s answer is reason %s", async (code, reason) => {
    failWith(code);
    await expect(fetchRecentActivity("s1", "all")).rejects.toMatchObject({ reason });
    failWith(code);
    await expect(fetchRecentActivity("s1", "all")).rejects.toBeInstanceOf(ActivityReadError);
  });

  it("no site, no request", async () => {
    query.mockClear();
    expect(await fetchRecentActivity(null, "all")).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
