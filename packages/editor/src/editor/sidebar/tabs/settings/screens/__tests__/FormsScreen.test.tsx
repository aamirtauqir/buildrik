/**
 * FormsScreen tests — 8136:216977: one inbox for every form (FORM · FROM ·
 * RECEIVED · STATUS · Delete · Configure in Inspector ›), Export CSV above
 * the notice, the FROM cell opening the fields (marking read), delete that
 * asks first, the load / empty states, and pagination bounds.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { EVENTS } from "@/shared/constants/events";

const { api, locate } = vi.hoisted(() => ({
  api: {
    forms: {
      listBlocks: { query: vi.fn() },
      listSubmissions: { query: vi.fn() },
      updateSubmission: { mutate: vi.fn() },
      deleteSubmission: { mutate: vi.fn() },
      exportSubmissions: { query: vi.fn() },
    },
  },
  locate: vi.fn(),
}));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => api,
}));
vi.mock("@/editor/sidebar/tabs/review/locate", () => ({ locateComment: locate }));

import { FormsScreen, fromOf, receivedAt } from "../FormsScreen";

const listBlocks = api.forms.listBlocks.query;
const listSubs = api.forms.listSubmissions.query;

function block(id: string, name: string, count = 0) {
  return { id, blockId: `el-${id}`, pageId: "p-home", name, isActive: true, _count: { submissions: count } };
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
    createdAt: new Date(2026, 6, 2, 19, 41).toISOString(),
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
  api.forms.exportSubmissions.query.mockReset().mockResolvedValue("a,b");
  locate.mockReset().mockReturnValue("located");
});

afterEach(() => cleanup());

function setup(projectId: string | null = "s1") {
  const composer = createMockComposer({ projectMetadata: { domain: null, name: "Bella Cucina" } });
  const utils = render(<FormsScreen composer={composer} projectId={projectId} />);
  return { composer, ...utils };
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
    expect(screen.getByText("Publish a page with a Form block and its submissions arrive here.")).toBeInTheDocument();
    expect(listBlocks).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("a failed forms read is the load-error card, and Try again re-reads", async () => {
    listBlocks.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    expect(await screen.findByText(/No forms yet\./i)).toBeInTheDocument();
    expect(listBlocks).toHaveBeenCalledTimes(2);
  });

  it("an empty inbox says so", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    setup();
    expect(await screen.findByTestId("set-forms-inbox-empty")).toBeInTheDocument();
  });
});

describe("FormsScreen — 8136:216977 the inbox", () => {
  it("lists every form's inbox in one table with the board's columns", async () => {
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1), block("f2", "Catering", 1)]);
    listSubs.mockResolvedValue(
      pageOf(
        [
          sub("a", { name: "Hina", email: "hina.raza@gmail.com" }),
          sub("b", { email: "events@zeeshan.co" }, { formBlockId: "f2", isRead: true }),
        ],
        2,
      ),
    );
    setup();
    await screen.findByTestId("set-forms-table");
    expect(listSubs).toHaveBeenCalledWith({ siteId: "s1", page: 1, perPage: 20, isArchived: false, isSpam: false });
    expect(screen.getByText("Submissions · All Forms")).toBeInTheDocument();
    expect(screen.getByTestId("set-forms-notice")).toHaveTextContent(
      "Submissions are live records. Restoring a draft does not change this inbox.",
    );
    expect(within(screen.getByTestId("set-forms-table")).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Form",
      "From",
      "Received",
      "Status",
      "Actions",
      "Configuration",
    ]);
    const a = screen.getByTestId("set-forms-row-a");
    expect(a).toHaveTextContent("Reservation");
    expect(a).toHaveTextContent("hina.raza@gmail.com");
    expect(a).toHaveTextContent("2 Jul, 19:41");
    expect(screen.getByTestId("set-forms-status-a")).toHaveTextContent("New");
    expect(screen.getByTestId("set-forms-status-b")).toHaveTextContent("Read");
    expect(screen.getByTestId("set-forms-row-b")).toHaveTextContent("Catering");
    expect(screen.getByTestId("set-forms-configure-a")).toHaveTextContent("Configure in Inspector ›");
    expect(screen.queryByRole("button", { name: /add form/i })).toBeNull();
  });

  it("Configure in Inspector selects the form element on its page and leaves Settings", async () => {
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    const { composer } = setup();
    fireEvent.click(await screen.findByTestId("set-forms-configure-a"));
    expect(locate).toHaveBeenCalledWith(composer, { pageId: "p-home", targetSelector: "el-f1" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "layers" });
  });

  it("a form no longer on its page says so and stays", async () => {
    locate.mockReturnValue("gone");
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    const { composer } = setup();
    fireEvent.click(await screen.findByTestId("set-forms-configure-a"));
    expect(screen.getByTestId("set-save-error")).toHaveTextContent("Reservation is no longer on its page.");
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, expect.anything());
  });

  it("the FROM cell opens the fields and marks a new submission read", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co", message: "Table for 4" })], 1));
    setup();
    fireEvent.click(await screen.findByTestId("set-forms-open-a"));
    expect(screen.getByTestId("set-forms-detail-a")).toHaveTextContent("Table for 4");
    await waitFor(() => expect(api.forms.updateSubmission.mutate).toHaveBeenCalledWith({ id: "a", isRead: true }));
  });

  it("Export CSV downloads every form's submissions", async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    setup();
    await screen.findByTestId("set-forms-table");
    fireEvent.click(screen.getByTestId("set-forms-export"));
    await waitFor(() => expect(api.forms.exportSubmissions.query).toHaveBeenCalledWith({ siteId: "s1", format: "csv" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    click.mockRestore();
  });

  it("fromOf takes the first email-looking field; receivedAt is `d Mon, HH:MM`", () => {
    expect(fromOf({ name: "K", contact: "k.mahmood@outlook.com" })).toBe("k.mahmood@outlook.com");
    expect(fromOf({ name: "Kamal" })).toBe("Kamal");
    expect(receivedAt(new Date(2026, 6, 1, 16, 55))).toBe("1 Jul, 16:55");
    expect(receivedAt("junk")).toBe("—");
  });
});

describe("FormsScreen — pagination bounds", () => {
  it("hides pagination when total fits on one page", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "a@b.co" })], 1));
    setup();
    await screen.findByTestId("set-forms-table");
    expect(screen.queryByText(/Page 1 of/)).toBeNull();
  });

  it("Prev is disabled on page 1; Next advances and re-queries; Next is disabled on the last page", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 25)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "a@b.co" })], 25));
    setup();
    await screen.findByText("Page 1 of 2");
    expect(screen.getByRole("button", { name: "← Prev" })).toBeDisabled();
    listSubs.mockResolvedValue(pageOf([sub("z", { email: "z@b.co" })], 25, 2));
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    await screen.findByText("Page 2 of 2");
    expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.getByRole("button", { name: "Next →" })).toBeDisabled();
  });
});

describe("FormsScreen — delete submission asks first", () => {
  async function ready() {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    listSubs.mockResolvedValue(pageOf([sub("sub-1", { email: "visitor@example.com" }, { isRead: true })], 1));
    setup();
    fireEvent.click(await screen.findByTestId("set-forms-delete-sub-1"));
  }

  it("does NOT reach the server on the first click, and names the submission", async () => {
    await ready();
    expect(api.forms.deleteSubmission.mutate).not.toHaveBeenCalled();
    expect(screen.getByText("Delete this submission?")).toBeInTheDocument();
    expect(screen.getByText(/can't be recovered/i)).toHaveTextContent("visitor@example.com");
  });

  it("cancelling leaves it; confirming deletes it", async () => {
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByText("Delete this submission?")).toBeNull());
    expect(api.forms.deleteSubmission.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-forms-delete-sub-1"));
    fireEvent.click(screen.getByRole("button", { name: "Delete submission" }));
    await waitFor(() => expect(api.forms.deleteSubmission.mutate).toHaveBeenCalledWith({ id: "sub-1" }));
  });
});

describe("FormsScreen — submissions error is recoverable (F11)", () => {
  it("offers Retry on a failed load and re-issues the same query", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 2)]);
    listSubs.mockRejectedValueOnce(new Error("Failed to load submissions."));
    setup();
    expect(await screen.findByText("Failed to load submissions.")).toBeInTheDocument();
    listSubs.mockResolvedValue(pageOf([sub("s1", { email: "a@b.com" })], 1));
    fireEvent.click(screen.getByTestId("subs-error-retry"));
    expect(await screen.findByText("a@b.com")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load submissions.")).toBeNull();
  });
});
