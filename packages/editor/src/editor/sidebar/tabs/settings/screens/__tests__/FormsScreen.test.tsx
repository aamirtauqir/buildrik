/**
 * FormsScreen tests — inbox form selection, filter tabs, pagination bounds.
 *
 * Note on the "dead Go-to-page button" KNOWN item: FormsScreen paginates with
 * Prev / Next only (no page-number jump control), and both buttons correctly
 * disable at the bounds — so that KNOWN item does not apply to this screen.
 * The bound-disable behavior is pinned below.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

const { api } = vi.hoisted(() => ({
  api: {
    forms: {
      listBlocks: { query: vi.fn() },
      listSubmissions: { query: vi.fn() },
      updateSubmission: { mutate: vi.fn() },
      deleteSubmission: { mutate: vi.fn() },
      exportSubmissions: { query: vi.fn() },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => api,
}));

import { FormsScreen } from "../FormsScreen";

const listBlocks = api.forms.listBlocks.query;
const listSubs = api.forms.listSubmissions.query;

function block(id: string, name: string, count = 0) {
  return { id, name, isActive: true, _count: { submissions: count } };
}
function sub(id: string, data: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    id,
    formBlockId: "f1",
    siteId: "s1",
    data,
    sourceUrl: null,
    isRead: false,
    isSpam: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}
function pageOf(rows: ReturnType<typeof sub>[], total: number, page = 1) {
  return { data: rows, total, page, perPage: 20 };
}

beforeEach(() => {
  listBlocks.mockReset().mockResolvedValue([]);
  listSubs.mockReset().mockResolvedValue(pageOf([], 0));
  api.forms.updateSubmission.mutate.mockReset().mockResolvedValue({});
  api.forms.deleteSubmission.mutate.mockReset().mockResolvedValue({});
});

afterEach(() => cleanup());

function setup(projectId: string | null = "s1") {
  return render(<FormsScreen projectId={projectId} />);
}

describe("FormsScreen — gating + empty states", () => {
  it("shows the dashboard-only message with no projectId", () => {
    setup(null);
    expect(screen.getByText(/Open this site from the dashboard to manage forms/i)).toBeInTheDocument();
    expect(listBlocks).not.toHaveBeenCalled();
  });

  it("shows 'No forms yet.' when the site has no form blocks", async () => {
    setup();
    expect(await screen.findByText(/No forms yet\./i)).toBeInTheDocument();
    expect(listBlocks).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("surfaces a form-blocks load error", async () => {
    listBlocks.mockRejectedValue(new Error("blocks down"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("blocks down");
  });
});

describe("FormsScreen — selection + submissions", () => {
  it("auto-selects the first form and loads its inbox submissions", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 2)]);
    listSubs.mockResolvedValue(pageOf([sub("s1", { email: "a@b.com" })], 1));
    setup();
    expect(await screen.findByText("a@b.com")).toBeInTheDocument();
    // The inbox filter is default → query carries isArchived/isSpam=false.
    await waitFor(() =>
      expect(listSubs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          siteId: "s1",
          formBlockId: "f1",
          page: 1,
          isArchived: false,
          isSpam: false,
        })
      )
    );
  });

  it("renders an empty-inbox message per active filter", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    listSubs.mockResolvedValue(pageOf([], 0));
    setup();
    expect(await screen.findByText(/No submissions in inbox\./i)).toBeInTheDocument();
  });
});

describe("FormsScreen — filter tabs", () => {
  it("switching to Spam re-queries with isSpam:true", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    setup();
    await screen.findByText(/No submissions in inbox\./i);

    fireEvent.click(screen.getByRole("tab", { name: /spam/i }));
    await waitFor(() =>
      expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ isSpam: true, page: 1 }))
    );
    expect(screen.getByRole("tab", { name: /spam/i }).getAttribute("aria-selected")).toBe("true");
  });

  it("switching to Unread re-queries with isRead:false + isArchived:false + isSpam:false", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    setup();
    await screen.findByText(/No submissions in inbox\./i);
    fireEvent.click(screen.getByRole("tab", { name: /unread/i }));
    await waitFor(() =>
      expect(listSubs).toHaveBeenLastCalledWith(
        expect.objectContaining({ isRead: false, isArchived: false, isSpam: false })
      )
    );
  });
});

describe("FormsScreen — pagination", () => {
  it("hides pagination when total fits on one page", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    listSubs.mockResolvedValue(pageOf([sub("s1", { email: "a@b.com" })], 5));
    setup();
    await screen.findByText("a@b.com");
    expect(screen.queryByRole("button", { name: /prev/i })).toBeNull();
  });

  it("Prev is disabled on page 1; Next advances the page and re-queries (bound pin)", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    // 45 total across perPage=20 → 3 pages.
    listSubs.mockResolvedValue(pageOf([sub("s1", { email: "a@b.com" })], 45));
    setup();
    await screen.findByText("a@b.com");

    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    );
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prev/i })).toBeEnabled();
  });

  it("Next is disabled on the last page (bound pin)", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    listSubs.mockResolvedValue(pageOf([sub("s1", { email: "a@b.com" })], 25)); // 2 pages
    setup();
    await screen.findByText("a@b.com");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
