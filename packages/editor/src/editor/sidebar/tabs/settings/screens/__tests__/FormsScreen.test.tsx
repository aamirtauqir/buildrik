/**
 * FormsScreen tests — 2L9 page 06: B8-S13 238:13598 (views, form filter,
 * count line, selectable rows, "Delete n", Showing … · sorted newest first,
 * retention line), GAP-FM01/02 (Spam / Archived + Unspam / Unarchive),
 * GAP-FM04 (All forms: Choose a form to configure), GAP-FM07–10 (delete
 * confirm, pending, acknowledged, failed with the selection kept), the row
 * name opening the fields (marking read), the load / empty states and
 * pagination bounds.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within, act } from "@testing-library/react";
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

/* GAP-FMC 277:345909: the filter is a small dialog — Cancel · All forms · each form. */
function pickForm(id: string) {
  fireEvent.click(screen.getByTestId("set-forms-filter"));
  fireEvent.click(screen.getByTestId(`set-forms-filter-${id}`));
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

describe("FormsScreen — 238:13598 views, filter and rows", () => {
  it("opens on the Inbox for all forms: views, filter, count line, rows, showing line, retention", async () => {
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1), block("f2", "Catering", 1)]);
    listSubs.mockResolvedValue(
      pageOf(
        [
          sub("a", { name: "Hina Raza", email: "hina.raza@gmail.com", message: "Table for 4 on Friday" }),
          sub("b", { email: "events@zeeshan.co", message: "Catering for 40" }, { formBlockId: "f2", isRead: true }),
        ],
        2,
      ),
    );
    setup();
    await screen.findByTestId("set-forms-table");
    expect(listSubs).toHaveBeenCalledWith({ siteId: "s1", page: 1, perPage: 20, isArchived: false, isSpam: false });
    expect(within(screen.getByTestId("set-forms-views")).getAllByRole("button").map((b) => b.textContent)).toEqual(["Inbox", "Spam", "Archived"]);
    expect(screen.getByTestId("set-forms-view-inbox")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-forms-filter").textContent).toBe("Form: All forms");
    expect(screen.getByTestId("set-forms-count")).toHaveTextContent("Inbox · 2 submissions");
    expect(screen.getByText("Submissions · All forms")).toBeInTheDocument();
    const a = screen.getByTestId("set-forms-row-a");
    expect(a).toHaveTextContent("Select Hina Raza");
    expect(a).toHaveTextContent("Hina Raza · Reservation");
    expect(a).toHaveTextContent("Table for 4 on Friday");
    expect(screen.getByTestId("set-forms-status-a")).toHaveTextContent("2 Jul · Inbox · New");
    expect(screen.getByTestId("set-forms-status-b")).toHaveTextContent("2 Jul · Inbox");
    expect(screen.getByTestId("set-forms-row-b")).toHaveTextContent("events@zeeshan.co · Catering");
    expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("0 selected");
    expect(screen.getByTestId("set-forms-delete")).toHaveTextContent("Delete 0");
    expect(screen.getByTestId("set-forms-delete")).toBeDisabled();
    expect(screen.getByTestId("set-forms-showing")).toHaveTextContent("Showing 2 of 2 · sorted newest first");
    expect(screen.getByTestId("set-forms-retention")).toHaveTextContent("Submissions are kept 365 days, then permanently deleted.");
    expect(screen.queryByTestId("set-forms-move")).toBeNull();
    expect(screen.queryByRole("button", { name: /add form/i })).toBeNull();
  });

  it("All forms cannot be configured (GAP-FM04); one form can, and Configure selects its element and leaves Settings", async () => {
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    const { composer } = setup();
    const configure = await screen.findByTestId("set-forms-configure");
    expect(configure).toHaveTextContent("Choose a form to configure");
    expect(configure).toBeDisabled();
    expect(screen.getByTestId("set-forms-configure-hint")).toHaveTextContent("Select a single form before configuring it in Inspector.");
    pickForm("f1");
    await waitFor(() => expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ formBlockId: "f1", page: 1 })));
    expect(screen.getByText("Submissions · Reservation")).toBeInTheDocument();
    expect(screen.queryByTestId("set-forms-configure-hint")).toBeNull();
    fireEvent.click(screen.getByTestId("set-forms-configure"));
    expect(locate).toHaveBeenCalledWith(composer, { pageId: "p-home", targetSelector: "el-f1" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "layers" });
  });

  it("a form no longer on its page says so and stays", async () => {
    locate.mockReturnValue("gone");
    listBlocks.mockResolvedValue([block("f1", "Reservation", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    const { composer } = setup();
    fireEvent.click(await screen.findByTestId("set-forms-filter"));
    fireEvent.click(screen.getByTestId("set-forms-filter-f1"));
    fireEvent.click(await screen.findByText("Configure in Inspector"));
    expect(screen.getByTestId("set-save-error")).toHaveTextContent("Reservation is no longer on its page.");
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, expect.anything());
  });

  it("Spam and Archived (GAP-FM01/02) query their view and offer Unspam / Unarchive", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { name: "Taylor", message: "Buy now" }, { isSpam: true })], 1));
    setup();
    await screen.findByTestId("set-forms-table");
    fireEvent.click(screen.getByTestId("set-forms-view-spam"));
    await waitFor(() => expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ isSpam: true, isArchived: false })));
    expect(await screen.findByTestId("set-forms-move")).toHaveTextContent("Unspam");
    expect(screen.getByTestId("set-forms-count")).toHaveTextContent("Spam · 1 submission");
    expect(screen.getByTestId("set-forms-status-a")).toHaveTextContent("2 Jul · Spam");
    fireEvent.click(screen.getByTestId("set-forms-view-archived"));
    await waitFor(() => expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ isSpam: false, isArchived: true })));
    expect(await screen.findByTestId("set-forms-move")).toHaveTextContent("Unarchive");
  });

  it("Unspam moves the selection back to the Inbox and says so; a failure keeps the selection (272:27718)", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { name: "Taylor" }, { isSpam: true }), sub("b", { name: "Jordan" }, { isSpam: true })], 2));
    setup();
    await screen.findByTestId("set-forms-table");
    fireEvent.click(screen.getByTestId("set-forms-view-spam"));
    fireEvent.click(await screen.findByTestId("set-forms-select-a"));
    expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("1 selected");
    fireEvent.click(screen.getByTestId("set-forms-move"));
    await waitFor(() => expect(api.forms.updateSubmission.mutate).toHaveBeenCalledWith({ id: "a", isSpam: false }));
    expect(await screen.findByTestId("set-forms-ack")).toHaveTextContent("1 submission moved from Spam to Inbox.");
    expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("0 selected");

    api.forms.updateSubmission.mutate.mockRejectedValueOnce(new Error("503"));
    fireEvent.click(screen.getByTestId("set-forms-select-b"));
    fireEvent.click(screen.getByTestId("set-forms-move"));
    expect(await screen.findByText("Couldn’t move the submission")).toBeInTheDocument();
    expect(screen.getByText("The submission is still in Spam. Your selection is kept.")).toBeInTheDocument();
    expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("1 selected");
  });

  it("the row name opens the fields and marks a new submission read", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co", message: "Table for 4" })], 1));
    setup();
    fireEvent.click(await screen.findByTestId("set-forms-open-a"));
    expect(screen.getByTestId("set-forms-detail-a")).toHaveTextContent("Table for 4");
    await waitFor(() => expect(api.forms.updateSubmission.mutate).toHaveBeenCalledWith({ id: "a", isRead: true }));
  });

  it("the form filter asks in a dialog, keeps the view, and a form change keeps the selection", async () => {
    listBlocks.mockResolvedValue([block("f1", "Contact", 2)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { name: "Mara" }), sub("b", { name: "Jonas" })], 2));
    setup();
    fireEvent.click(await screen.findByTestId("set-forms-select-a"));
    fireEvent.click(screen.getByTestId("set-forms-filter"));
    expect(screen.getByText("Filter submissions")).toBeInTheDocument();
    expect(screen.getByText("Inbox view is kept. Change the form to update counts and CSV scope.")).toBeInTheDocument();
    const foot = screen.getByTestId("modal-foot-set-forms-filter-dialog");
    expect(Array.from(foot.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["Cancel", "All forms", "Contact"]);
    fireEvent.click(screen.getByTestId("set-forms-filter-f1"));
    await waitFor(() => expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ formBlockId: "f1" })));
    await waitFor(() => expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("1 selected"));
    expect(screen.getByTestId("set-forms-filter").textContent).toBe("Form: Contact");
  });

  it("Export CSV exports the current view and form, then says what it held (GAP-FM-Export)", async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    setup();
    await screen.findByTestId("set-forms-table");
    pickForm("f1");
    fireEvent.click(screen.getByTestId("set-forms-view-spam"));
    await waitFor(() => expect(listSubs).toHaveBeenLastCalledWith(expect.objectContaining({ formBlockId: "f1", isSpam: true })));
    await waitFor(() => expect(screen.getByTestId("set-forms-export")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("set-forms-export"));
    await waitFor(() =>
      expect(api.forms.exportSubmissions.query).toHaveBeenLastCalledWith({
        siteId: "s1",
        formBlockId: "f1",
        isSpam: true,
        isArchived: false,
        format: "csv",
      }),
    );
    expect(await screen.findByText("CSV ready")).toBeInTheDocument();
    expect(screen.getByTestId("set-forms-export-line")).toHaveTextContent(
      "1 submission · Contact · Spam. Your selection and filters are unchanged.",
    );
    expect(click).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back to submissions" }));
    await waitFor(() => expect(screen.queryByText("CSV ready")).toBeNull());
    click.mockRestore();
  });

  it("a failed export creates nothing and offers Try again", async () => {
    api.forms.exportSubmissions.query.mockRejectedValueOnce(new Error("503"));
    listBlocks.mockResolvedValue([block("f1", "Contact", 1)]);
    listSubs.mockResolvedValue(pageOf([sub("a", { email: "x@y.co" })], 1));
    setup();
    await screen.findByTestId("set-forms-table");
    fireEvent.click(screen.getByTestId("set-forms-export"));
    expect(await screen.findByText("Couldn’t export submissions")).toBeInTheDocument();
    expect(screen.getByText("No CSV was created. Your filters and selection are kept.")).toBeInTheDocument();
    expect(api.forms.exportSubmissions.query).toHaveBeenCalledWith({ siteId: "s1", isSpam: false, isArchived: false, format: "csv" });
  });

  it("fromOf prefers a name, then an email, then the first value; receivedAt is `d Mon`", () => {
    expect(fromOf({ name: "Kamal", contact: "k.mahmood@outlook.com" })).toBe("Kamal");
    expect(fromOf({ phone: "123", contact: "k.mahmood@outlook.com" })).toBe("k.mahmood@outlook.com");
    expect(fromOf({ phone: "123" })).toBe("123");
    expect(receivedAt(new Date(2026, 6, 1, 16, 55))).toBe("1 Jul");
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

describe("FormsScreen — bulk delete asks first (GAP-FM07–10)", () => {
  async function ready() {
    listBlocks.mockResolvedValue([block("f1", "Contact")]);
    listSubs.mockResolvedValue(
      pageOf([sub("s-1", { name: "Mara Lenz" }, { isRead: true }), sub("s-2", { name: "Jonas Peters" }, { isRead: true })], 2),
    );
    setup();
    fireEvent.click(await screen.findByTestId("set-forms-select-s-1"));
    fireEvent.click(screen.getByTestId("set-forms-select-s-2"));
    expect(screen.getByTestId("set-forms-delete")).toHaveTextContent("Delete 2");
    fireEvent.click(screen.getByTestId("set-forms-delete"));
  }

  it("does NOT reach the server on the first click; asks with B8-S14's copy, Cancel first", async () => {
    await ready();
    expect(api.forms.deleteSubmission.mutate).not.toHaveBeenCalled();
    expect(screen.getByText("Delete 2 submissions permanently?")).toBeInTheDocument();
    expect(screen.getByText("Submissions can’t be restored after they’re deleted.")).toBeInTheDocument();
    const foot = screen.getByTestId("modal-foot-set-forms-delete-confirm");
    expect(Array.from(foot.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["Cancel", "Delete"]);
  });

  it("Cancel leaves them; confirming deletes both and acknowledges (FM09)", async () => {
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByText("Delete 2 submissions permanently?")).toBeNull());
    expect(api.forms.deleteSubmission.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-forms-delete"));
    fireEvent.click(screen.getByTestId("set-forms-delete-ok"));
    await waitFor(() => expect(api.forms.deleteSubmission.mutate).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("set-forms-ack")).toHaveTextContent("2 submissions permanently deleted.");
  });

  it("while deleting, the dialog says the rows stay listed until confirmed (FM08)", async () => {
    let release!: () => void;
    api.forms.deleteSubmission.mutate.mockImplementation(() => new Promise((r) => (release = () => r({}))));
    await ready();
    fireEvent.click(screen.getByTestId("set-forms-delete-ok"));
    expect(await screen.findByText("Deleting 2 submissions…")).toBeInTheDocument();
    expect(screen.getByText(/remain listed until deletion is confirmed/)).toBeInTheDocument();
    await act(async () => release());
  });

  it("a failed delete keeps the selection and offers Try again (FM10)", async () => {
    api.forms.deleteSubmission.mutate.mockRejectedValue(new Error("503"));
    await ready();
    fireEvent.click(screen.getByTestId("set-forms-delete-ok"));
    expect(await screen.findByText("Couldn’t delete the submissions")).toBeInTheDocument();
    expect(screen.getByText("Both submissions are still in All forms · Inbox. Your selection is kept.")).toBeInTheDocument();
    expect(screen.getByTestId("set-forms-selected")).toHaveTextContent("2 selected");
    api.forms.deleteSubmission.mutate.mockResolvedValue({});
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("set-forms-ack")).toHaveTextContent("2 submissions permanently deleted.");
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
    expect(await screen.findByText("Select a@b.com")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load submissions.")).toBeNull();
  });
});
