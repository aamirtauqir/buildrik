/**
 * PublishDiffView — the body of the one Compare when both sides are published
 * versions (B8). The server diffs the retained payloads; HTML never leaves it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPublishDiff = vi.fn();
vi.mock("../../../services/PublishService", () => ({
  fetchPublishDiff: (...a: unknown[]) => fetchPublishDiff(...a),
}));

import { PublishDiffView } from "../PublishDiffView";

const mount = () =>
  render(<PublishDiffView siteId="s1" from={{ id: "j2", version: 2 }} to={{ id: "j3", version: 3 }} />);

beforeEach(() => {
  fetchPublishDiff.mockReset().mockResolvedValue({
    retained: true,
    pages: [
      { path: "about.html", change: "changed", fromBytes: 1024, toBytes: 2048 },
      { path: "index.html", change: "same", fromBytes: 512, toBytes: 512 },
      { path: "new.html", change: "added", fromBytes: null, toBytes: 300 },
    ],
    added: 1,
    removed: 0,
    changed: 1,
  });
});
afterEach(cleanup);

describe("PublishDiffView", () => {
  it("asks the server for exactly those two jobs and names what changed", async () => {
    mount();
    await waitFor(() => expect(fetchPublishDiff).toHaveBeenCalledWith("s1", "j2", "j3"));
    expect(await screen.findByTestId("publish-diff-summary")).toHaveTextContent(
      "1 changed · 1 added · 0 removed · 1 unchanged",
    );
    expect(screen.getByText("about.html").closest("li")).toHaveAttribute("data-change", "changed");
    expect(screen.getByText("new.html").closest("li")).toHaveAttribute("data-change", "added");
    expect(screen.getByText("1.0 KB → 2.0 KB")).toBeInTheDocument();
  });

  it("says a pruned version cannot be compared, rather than showing an empty diff", async () => {
    fetchPublishDiff.mockResolvedValue({ retained: false, pages: [], added: 0, removed: 0, changed: 0 });
    mount();
    expect(await screen.findByText(/no longer stored/)).toBeInTheDocument();
    expect(screen.queryByTestId("publish-diff-summary")).toBeNull();
  });
});
