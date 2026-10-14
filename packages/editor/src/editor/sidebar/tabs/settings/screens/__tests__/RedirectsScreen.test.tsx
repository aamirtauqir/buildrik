/**
 * RedirectsScreen tests — 8136:214826 csv-actions: the header's Import CSV ·
 * Export CSV · Add redirect, the Redirect rules table FROM · TO · TYPE with
 * `Edit · Delete` per row (Delete asks first — owner 2026-10-04 — then the toast's Undo, 8136:215838),
 * Import → RedirectCsvDialog → `import_csv` → "Created N" (8136:215568), a
 * refused file inline (8136:215307), Export → `export_csv`; the empty card,
 * the 404 suggester (the switch applies at once through
 * `siteDetail.projectSettings.update`; Accept → a 301 at once), the load
 * states, the banner a refused action leaves, and the Pages door's URL repair
 * draft → saved (3519:19920 → 3519:20096).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup, within } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { EVENTS } from "@/shared/constants/events";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      redirects: {
        list: { query: vi.fn() },
        suggestions: { query: vi.fn() },
        create: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        delete: { mutate: vi.fn() },
        import_csv: { mutate: vi.fn() },
        export_csv: { query: vi.fn() },
      },
    },
  },
}));

const { addToast, removeToast, updateProjectSettings } = vi.hoisted(() => ({
  addToast: vi.fn((_input: { action: { onClick(): void } }) => "toast-1"),
  removeToast: vi.fn(),
  updateProjectSettings: vi.fn(),
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ updateProjectSettings }));
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast, removeToast }),
}));

import { RedirectsScreen, renamedDay, type RedirectRow } from "../RedirectsScreen";
import { SAVE_ERROR_MESSAGES } from "@/editor/sidebar/tabs/settings/constants";
import type { RedirectSuggestion } from "@buildrik/shared/schemas/site-detail";

const r = api.siteDetail.redirects;

function row(id: string, fromPath: string, toUrl: string, over: Partial<RedirectRow> = {}): RedirectRow {
  return { id, fromPath, toUrl, type: "301", matchQuery: false, notes: null, ...over };
}

const SEEDED: RedirectRow[] = [
  row("r1", "/menu-old", "/menu", { matchQuery: true, notes: "Old menu page retired in March — keep printed QR links working." }),
  row("r2", "/book", "/reservations"),
  row("r3", "/promo-eid", "https://bellacucina.com/offers", { type: "302" }),
];

const SUGGESTED: RedirectSuggestion[] = [
  { fromPath: "/pizza-menu", toUrl: "/menu", pageId: "p-menu", pageName: "Menu", changedAt: "2026-09-12T10:00:00.000Z" },
  { fromPath: "/contact-us", toUrl: "/contact", pageId: "p-contact", pageName: "Contact", changedAt: "2026-08-03T10:00:00.000Z" },
];

beforeEach(() => {
  r.list.query.mockReset().mockResolvedValue(SEEDED);
  r.suggestions.query.mockReset().mockResolvedValue(SUGGESTED);
  r.create.mutate.mockReset().mockImplementation(async (input: Omit<RedirectRow, "id" | "createdAt">) => row("r9", input.fromPath, input.toUrl, input));
  r.update.mutate.mockReset().mockResolvedValue(SEEDED[0]);
  r.delete.mutate.mockReset().mockResolvedValue({ ok: true });
  r.import_csv.mutate.mockReset().mockResolvedValue({ created: 12 });
  r.export_csv.query.mockReset().mockResolvedValue({ csv: "from,to,type\n/a,/b,301" });
  addToast.mockReset();
  addToast.mockImplementation((_input: { action: { onClick(): void } }) => "toast-1");
  removeToast.mockReset();
  updateProjectSettings.mockReset().mockResolvedValue({ saved: { redirects: { suggestFrom404s: false } }, warnings: {} });
});

afterEach(() => cleanup());

interface SetupOpts {
  projectId?: string | null;
  projectSettings?: Record<string, unknown>;
  onDirtyChange?: (d: boolean) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  registerHeaderAction?: (node: React.ReactNode | null) => void;
  saveError?: string | null;
  repair?: { pageId: string; pageName: string; from: string; to: string } | null;
  onRepairDone?: () => void;
}

function setup(opts: SetupOpts = {}) {
  const composer = createMockComposer({
    projectMetadata: { domain: null, name: "Bella Cucina" },
    projectSettings: opts.projectSettings ?? {},
  });
  const props = {
    composer,
    projectId: opts.projectId === undefined ? "s1" : opts.projectId,
    onDirtyChange: opts.onDirtyChange,
    onLoadStateChange: opts.onLoadStateChange,
    registerHeaderAction: opts.registerHeaderAction,
    saveError: opts.saveError,
    repair: opts.repair,
    onRepairDone: opts.onRepairDone,
  };
  const utils = render(<RedirectsScreen {...props} />);
  return { composer, props, ...utils };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-redirect-rules")).toBeInTheDocument());
const cell = (id: string) => within(screen.getByTestId(`set-rd-row-${id}`)).getAllByRole("cell").map((c) => c.textContent);
const dialog = () => screen.getByTestId("set-rd-dialog");

/** The node the screen hands the shell's header slot, mounted where a test can click it. */
function mountHeader(register: ReturnType<typeof vi.fn>) {
  const node: React.ReactNode = register.mock.calls.at(-1)?.[0];
  return render(<div data-testid="header-slot">{node}</div>);
}

describe("RedirectsScreen — gating + the load states (3397:33479 / 3397:33573)", () => {
  it("shows the demo line when there is no projectId and never reads", () => {
    setup({ projectId: null });
    expect(screen.getByText("The demo project has no redirects.")).toBeInTheDocument();
    expect(r.list.query).not.toHaveBeenCalled();
    expect(r.suggestions.query).not.toHaveBeenCalled();
  });

  it("draws the load card while both reads are in flight, then the cards, reporting loading → ready", async () => {
    let releaseList!: (rows: RedirectRow[]) => void;
    r.list.query.mockReturnValue(new Promise<RedirectRow[]>((res) => (releaseList = res)));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });

    const card = screen.getByTestId("set-load-card");
    expect(card).toHaveAttribute("data-state", "loading");
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Redirects");
    expect(screen.getByTestId("set-load-line")).toHaveTextContent("Old URLs sent to new ones, and the 404 suggester.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");

    await act(async () => releaseList(SEEDED));
    await loaded();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
    expect(r.list.query).toHaveBeenCalledWith({ siteId: "s1" });
    expect(r.suggestions.query).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("a failed list read is the load-error card with the frame's line and a Try again that re-reads", async () => {
    r.list.query.mockRejectedValueOnce(new Error("boom"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-card")).toHaveAttribute("data-state", "error"));
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Couldn't load your redirects. Check your connection, then try again.");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");
    expect(screen.queryByTestId("set-rd-table")).toBeNull();

    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(r.list.query).toHaveBeenCalledTimes(2);
  });

  it("one load state over BOTH reads — a failed suggestions read is the same load-error card", async () => {
    r.suggestions.query.mockRejectedValueOnce(new Error("no suggester"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-card")).toHaveAttribute("data-state", "error"));
  });
});

describe("8136:214826 — the Redirect rules card and the 404 suggester", () => {
  it("draws the table FROM · TO · TYPE with Edit · Delete per row, and the suggester", async () => {
    setup();
    await loaded();
    expect(screen.queryByTestId("set-rd-restore")).toBeNull();
    expect(screen.getByTestId("set-card-title-redirect-rules")).toHaveTextContent("Redirect rules");
    const table = screen.getByTestId("set-rd-table");
    expect(table).toHaveAttribute("id", "rd-rules");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["From", "To", "Type", "Actions"]);
    expect(cell("r1")).toEqual(["/menu-old", "/menu", "301", "Edit·Delete"]);
    expect(cell("r3")).toEqual(["/promo-eid", "https://bellacucina.com/offers", "302", "Edit·Delete"]);
    expect(screen.queryByTestId("set-rd-empty")).toBeNull();

    expect(screen.getByTestId("set-card-title-404-suggester")).toHaveTextContent("404 suggester");
    const toggle = screen.getByTestId("set-rd-suggest-toggle");
    expect(screen.getByRole("switch", { name: "Suggest redirects from 404s" })).toBe(toggle);
    expect(toggle).toHaveAttribute("id", "rd-suggest-from-404s");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("set-rd-suggestion-0")).toHaveTextContent("/pizza-menu → /menu renamed 12 Sep");
    expect(screen.getByTestId("set-rd-suggestion-1")).toHaveTextContent("/contact-us → /contact renamed 3 Aug");
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("no redirects → the card's own line and Add redirect; the header keeps Import, Export is off", async () => {
    r.list.query.mockResolvedValue([]);
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    const empty = screen.getByTestId("set-rd-empty");
    expect(empty).toHaveTextContent("No redirects yet. Add one to send an old URL to a new one, or import a CSV.");
    expect(screen.queryByTestId("set-rd-table")).toBeNull();
    fireEvent.click(within(empty).getByTestId("set-rd-add"));
    expect(dialog()).toHaveAttribute("data-mode", "add");
    cleanup();
    r.list.query.mockResolvedValue([]);
    setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    const slot = screen.getByTestId("header-slot");
    expect(within(slot).getByTestId("set-rd-import")).toBeEnabled();
    expect(within(slot).getByTestId("set-rd-export")).toBeDisabled();
    expect(within(slot).queryByTestId("set-rd-add")).toBeNull();
  });

  it("no suggestions → the empty line", async () => {
    r.suggestions.query.mockResolvedValue([]);
    setup();
    await loaded();
    expect(screen.getByTestId("set-rd-suggest-empty")).toHaveTextContent("No suggestions — every renamed page already has a redirect.");
  });

  it("renamedDay is `d MMM`, locale-free, and null for junk", () => {
    expect(renamedDay("2026-09-12T10:00:00.000Z")).toBe("12 Sep");
    expect(renamedDay("2026-01-01T12:00:00.000Z")).toBe("1 Jan");
    expect(renamedDay("not a date")).toBeNull();
  });

  it("the shell's saveError is the banner above the cards", async () => {
    setup({ saveError: SAVE_ERROR_MESSAGES.redirects! });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(SAVE_ERROR_MESSAGES.redirects!);
  });
});

describe("the suggester switch — applies at once (SA-16)", () => {
  it("is never dirty; flipping writes projectSettings.redirects through the settings mutation and the composer adopts it", async () => {
    const onDirtyChange = vi.fn();
    const { composer } = setup({ onDirtyChange, projectSettings: { seo: { metaTitle: "Bella" } } });
    const adopt = vi.fn();
    Object.assign(composer, { adoptSavedProjectSettings: adopt });
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-suggest-toggle"));
    expect(screen.getByTestId("set-rd-suggest-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByTestId("set-rd-suggestion-0")).toBeNull();
    await waitFor(() => expect(updateProjectSettings).toHaveBeenCalledWith("s1", { redirects: { suggestFrom404s: false } }));
    await waitFor(() =>
      expect(adopt).toHaveBeenCalledWith({ seo: { metaTitle: "Bella" }, redirects: { suggestFrom404s: false } }),
    );
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it("a refused write flips the switch back and shows the banner", async () => {
    updateProjectSettings.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-suggest-toggle"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toHaveTextContent(SAVE_ERROR_MESSAGES.redirects!));
    expect(screen.getByTestId("set-rd-suggest-toggle")).toHaveAttribute("aria-checked", "true");
  });

  it("starts off when the composer says off", async () => {
    setup({ projectSettings: { redirects: { suggestFrom404s: false } } });
    await loaded();
    expect(screen.getByTestId("set-rd-suggest-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByTestId("set-rd-suggestion-0")).toBeNull();
  });
});

describe("Delete → confirm → the undo toast (8136:215838)", () => {
  it("owner 2026-10-04: a row's Delete asks first, and Cancel deletes nothing", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-delete-r1"));
    expect(screen.getByTestId("set-rd-confirm")).toHaveTextContent("Delete redirect /menu-old → /menu?");
    fireEvent.click(within(screen.getByTestId("modal-foot-set-rd-confirm")).getByText("Cancel"));
    await waitFor(() => expect(screen.queryByTestId("set-rd-confirm")).toBeNull());
    expect(r.delete.mutate).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-rd-row-r1")).toBeInTheDocument();
  });

  it("once confirmed, deletes, the row leaves, and the toast names the rule with Undo", async () => {
    setup();
    await loaded();
    r.list.query.mockResolvedValue(SEEDED.filter((x) => x.id !== "r1"));
    fireEvent.click(screen.getByTestId("set-rd-delete-r1"));
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(r.delete.mutate).toHaveBeenCalledWith({ id: "r1" }));
    await waitFor(() => expect(screen.queryByTestId("set-rd-row-r1")).toBeNull());
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Redirect /menu-old → /menu deleted",
        description: "You can undo this deletion.",
        action: expect.objectContaining({ label: "Undo" }),
      }),
    );
  });

  it("Undo creates the same rule again and re-lists", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-delete-r1"));
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(addToast).toHaveBeenCalled());
    r.list.query.mockResolvedValue(SEEDED);
    await act(async () => addToast.mock.calls[0][0].action.onClick());
    await waitFor(() =>
      expect(r.create.mutate).toHaveBeenCalledWith({
        siteId: "s1",
        fromPath: "/menu-old",
        toUrl: "/menu",
        type: "301",
        matchQuery: true,
        notes: "Old menu page retired in March — keep printed QR links working.",
      }),
    );
    await waitFor(() => expect(screen.getByTestId("set-rd-row-r1")).toBeInTheDocument());
  });

  /* QA 2026-10-05: the toast stayed up after Undo (a focused toast never times
     out), and a second Undo posted the rule again — a 409 and the "not saved"
     banner over a rule that was back. Undo runs once and takes its toast down. */
  it("Undo runs once and dismisses its toast", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-delete-r1"));
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(addToast).toHaveBeenCalled());
    const undo = addToast.mock.calls[0][0].action.onClick;
    await act(async () => undo());
    await act(async () => undo());
    expect(removeToast).toHaveBeenCalledWith("toast-1");
    await waitFor(() => expect(r.create.mutate).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("a refused delete shows the banner and keeps the row, with no toast", async () => {
    r.delete.mutate.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-delete-r2"));
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    expect(screen.getByTestId("set-rd-row-r2")).toBeInTheDocument();
    expect(addToast).not.toHaveBeenCalled();
  });
});

describe("CSV — Import (8136:215047 / 215307 / 215568) and Export", () => {
  const file = (text: string, name = "redirects.csv") => new File([text], name, { type: "text/csv" });

  async function openImport() {
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    fireEvent.click(within(screen.getByTestId("header-slot")).getByTestId("set-rd-import"));
    expect(screen.getByTestId("set-rd-csv")).toBeInTheDocument();
  }

  it("the dialog asks for a file; Import stays off until one is chosen", async () => {
    await openImport();
    expect(screen.getByTestId("set-rd-csv")).toHaveTextContent("Choose a CSV file with up to 1000 rows.");
    expect(screen.getByTestId("set-rd-csv")).toHaveTextContent("Format: /from,to[,301|302]");
    expect(screen.getByTestId("set-rd-csv-choose")).toHaveTextContent("Choose CSV file");
    expect(screen.getByTestId("set-rd-csv-import")).toBeDisabled();
  });

  it("imports the file (header added when the file has none), closes, toasts Created N and re-lists", async () => {
    await openImport();
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("/a,/b\n/c,/d,302")] } });
    expect(screen.getByTestId("set-rd-csv-choose")).toHaveTextContent("redirects.csv");
    fireEvent.click(screen.getByTestId("set-rd-csv-import"));
    await waitFor(() => expect(r.import_csv.mutate).toHaveBeenCalledWith({ siteId: "s1", csv: "from,to,type\n/a,/b\n/c,/d,302" }));
    await waitFor(() => expect(screen.queryByTestId("set-rd-csv")).toBeNull());
    expect(addToast).toHaveBeenCalledWith({ title: "Created 12", description: "12 redirect rules were imported." });
    expect(r.list.query).toHaveBeenCalledTimes(2);
  });

  /** A tRPC refusal as the client sees it: the server's sentence and its 4xx. */
  const refusal = (message: string) => Object.assign(new Error(message), { data: { code: "BAD_REQUEST", httpStatus: 400 } });

  it("a refused file stays open with the server's line and reason in red, and nothing re-lists (8136:215307)", async () => {
    r.import_csv.mutate.mockRejectedValue(refusal("Line 4: Destination is required — nothing imported"));
    await openImport();
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("from,to\n/a,/b\n/c,/d\n/x,")] } });
    fireEvent.click(screen.getByTestId("set-rd-csv-import"));
    await waitFor(() => expect(screen.getByTestId("set-rd-csv-error")).toHaveTextContent("Line 4: Destination is required — nothing imported"));
    expect(screen.getByTestId("set-rd-csv")).toBeInTheDocument();
    expect(r.list.query).toHaveBeenCalledTimes(1);
  });

  it("after a refusal Import CSV stays off until another file is chosen", async () => {
    r.import_csv.mutate.mockRejectedValue(refusal("Line 2: Destination is required — nothing imported"));
    await openImport();
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("from,to\n/x,")] } });
    fireEvent.click(screen.getByTestId("set-rd-csv-import"));
    await waitFor(() => expect(screen.getByTestId("set-rd-csv-error")).toBeInTheDocument());
    expect((screen.getByTestId("set-rd-csv-import") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("from,to\n/x,/y")] } });
    expect(screen.queryByTestId("set-rd-csv-error")).toBeNull();
    expect((screen.getByTestId("set-rd-csv-import") as HTMLButtonElement).disabled).toBe(false);
  });

  it("a failure that is not a refusal (no answer) leaves Import CSV on to retry", async () => {
    r.import_csv.mutate.mockRejectedValue(new Error("Failed to fetch"));
    await openImport();
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("from,to\n/x,/y")] } });
    fireEvent.click(screen.getByTestId("set-rd-csv-import"));
    await waitFor(() => expect(screen.getByTestId("set-rd-csv-error")).toBeInTheDocument());
    expect((screen.getByTestId("set-rd-csv-import") as HTMLButtonElement).disabled).toBe(false);
  });

  it("a headerless file's refusal names the line in the person's file, not the line after the added header", async () => {
    // QA walk 2026-10-03: the dialog puts `from,to,type` in front of a file that starts with a rule,
    // so the server's "line 3" is line 2 of what the person chose.
    r.import_csv.mutate.mockRejectedValue(refusal("Line 3: Destination must be a path or an http(s) URL — nothing imported"));
    await openImport();
    fireEvent.change(screen.getByTestId("set-rd-csv-input"), { target: { files: [file("/a,/b\n/c,javascript:alert(1)")] } });
    fireEvent.click(screen.getByTestId("set-rd-csv-import"));
    await waitFor(() => expect(screen.getByTestId("set-rd-csv-error")).toHaveTextContent("Line 2: Destination must be a path or an http(s) URL — nothing imported"));
    expect(r.import_csv.mutate.mock.calls[0][0].csv).toBe("from,to,type\n/a,/b\n/c,javascript:alert(1)");
  });

  it("Export downloads export_csv as redirects.csv", async () => {
    const createObjectURL = vi.fn(() => "blob:x");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    fireEvent.click(within(screen.getByTestId("header-slot")).getByTestId("set-rd-export"));
    await waitFor(() => expect(r.export_csv.query).toHaveBeenCalledWith({ siteId: "s1" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });
});

describe("the header's Add redirect → 4254:75736 → redirects.create → re-list", () => {
  it("registers Import CSV · Export CSV · Add redirect once loaded with rows, and clears them on unmount", async () => {
    const registerHeaderAction = vi.fn();
    const { unmount } = setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    const slot = screen.getByTestId("header-slot");
    expect(within(slot).getAllByRole("button").map((b) => b.textContent)).toEqual(["Import CSV", "Export CSV", "Add redirect"]);
    expect(within(slot).getByTestId("set-rd-import")).toHaveAttribute("id", "rd-import-csv");
    expect(within(slot).getByTestId("set-rd-export")).toHaveAttribute("id", "rd-export-csv");
    unmount();
    expect(registerHeaderAction).toHaveBeenLastCalledWith(null);
  });

  it("opens the Add dialog scoped to the site, creates, closes and re-lists", async () => {
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    fireEvent.click(screen.getByTestId("set-rd-add"));
    expect(dialog()).toHaveAttribute("data-mode", "add");
    expect(within(dialog()).getByTestId("set-rd-dialog-scope")).toHaveTextContent("Bella Cucina · Redirects");

    fireEvent.change(screen.getByTestId("set-rd-from"), { target: { value: "/old" } });
    fireEvent.change(screen.getByTestId("set-rd-to"), { target: { value: "/new" } });
    fireEvent.click(screen.getByTestId("set-rd-type-302"));
    fireEvent.change(screen.getByTestId("set-rd-notes"), { target: { value: "moved" } });
    r.list.query.mockResolvedValue([...SEEDED, row("r9", "/old", "/new", { type: "302", notes: "moved" })]);
    fireEvent.click(screen.getByTestId("set-rd-submit"));

    await waitFor(() =>
      expect(r.create.mutate).toHaveBeenCalledWith({ siteId: "s1", fromPath: "/old", toUrl: "/new", type: "302", matchQuery: false, notes: "moved" }),
    );
    await waitFor(() => expect(screen.queryByTestId("set-rd-dialog")).toBeNull());
    await waitFor(() => expect(screen.getByTestId("set-rd-row-r9")).toBeInTheDocument());
    expect(r.list.query).toHaveBeenCalledTimes(2);
    expect(r.suggestions.query).toHaveBeenCalledTimes(2);
  });

  it("a refused create stays inline in the dialog — no banner on the screen", async () => {
    r.create.mutate.mockRejectedValue(new Error("A redirect from /menu-old already exists."));
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    mountHeader(registerHeaderAction);
    fireEvent.click(screen.getByTestId("set-rd-add"));
    fireEvent.change(screen.getByTestId("set-rd-from"), { target: { value: "/menu-old" } });
    fireEvent.change(screen.getByTestId("set-rd-to"), { target: { value: "/menu" } });
    fireEvent.click(screen.getByTestId("set-rd-submit"));
    await waitFor(() => expect(screen.getByTestId("set-rd-error")).toHaveTextContent("A redirect from /menu-old already exists."));
    expect(screen.getByTestId("set-rd-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("set-save-error")).toBeNull();
    expect(r.list.query).toHaveBeenCalledTimes(1);
  });
});

describe("a row's Edit → 4254:75747 → redirects.update / delete → re-list", () => {
  it("opens the Edit dialog prefilled from the row, saves through update with the id, closes and re-lists", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-edit-r1"));
    expect(dialog()).toHaveAttribute("data-mode", "edit");
    expect((screen.getByTestId("set-rd-from") as HTMLInputElement).value).toBe("/menu-old");
    expect((screen.getByTestId("set-rd-to") as HTMLInputElement).value).toBe("/menu");
    expect(screen.getByTestId("set-rd-match-query")).toHaveAttribute("aria-checked", "true");
    expect((screen.getByTestId("set-rd-notes") as HTMLInputElement).value).toBe("Old menu page retired in March — keep printed QR links working.");

    fireEvent.change(screen.getByTestId("set-rd-to"), { target: { value: "/menu-2026" } });
    fireEvent.click(screen.getByTestId("set-rd-submit"));
    await waitFor(() =>
      expect(r.update.mutate).toHaveBeenCalledWith({
        id: "r1",
        fromPath: "/menu-old",
        toUrl: "/menu-2026",
        type: "301",
        matchQuery: true,
        notes: "Old menu page retired in March — keep printed QR links working.",
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("set-rd-dialog")).toBeNull());
    expect(r.list.query).toHaveBeenCalledTimes(2);
  });

  it("Delete redirect asks first, then deletes with the id, closes, the row leaves on re-list, and the Undo toast shows", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-edit-r2"));
    r.list.query.mockResolvedValue(SEEDED.filter((x) => x.id !== "r2"));
    fireEvent.click(screen.getByTestId("set-rd-delete"));
    expect(r.delete.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(r.delete.mutate).toHaveBeenCalledWith({ id: "r2" }));
    await waitFor(() => expect(screen.queryByTestId("set-rd-dialog")).toBeNull());
    await waitFor(() => expect(screen.queryByTestId("set-rd-row-r2")).toBeNull());
    expect(screen.getByTestId("set-rd-row-r1")).toBeInTheDocument();
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/^Redirect .* deleted$/), action: expect.objectContaining({ label: "Undo" }) }),
    );
  });

  it("a refused delete stays inline in the dialog and the row stays", async () => {
    r.delete.mutate.mockRejectedValue(new Error("Only an editor can delete a redirect."));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-edit-r2"));
    fireEvent.click(screen.getByTestId("set-rd-delete"));
    fireEvent.click(screen.getByTestId("set-rd-confirm-confirm"));
    await waitFor(() => expect(screen.getByTestId("set-rd-error")).toHaveTextContent("Only an editor can delete a redirect."));
    expect(screen.getByTestId("set-rd-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("set-rd-row-r2")).toBeInTheDocument();
  });

  it("Cancel closes the dialog without a write", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-edit-r1"));
    fireEvent.click(screen.getByTestId("set-rd-cancel"));
    await waitFor(() => expect(screen.queryByTestId("set-rd-dialog")).toBeNull());
    expect(r.update.mutate).not.toHaveBeenCalled();
    expect(r.delete.mutate).not.toHaveBeenCalled();
  });
});

describe("Accept — a 301 at once, the row leaves; a refusal is the banner (3951:26730)", () => {
  it("creates the 301 from the suggestion and re-lists, so the accepted row is gone and the rule is in the table", async () => {
    setup();
    await loaded();
    r.list.query.mockResolvedValue([...SEEDED, row("r9", "/pizza-menu", "/menu")]);
    r.suggestions.query.mockResolvedValue([SUGGESTED[1]]);
    fireEvent.click(screen.getByTestId("set-rd-accept-0"));
    await waitFor(() => expect(r.create.mutate).toHaveBeenCalledWith({ siteId: "s1", fromPath: "/pizza-menu", toUrl: "/menu", type: "301" }));
    await waitFor(() => expect(screen.getByTestId("set-rd-row-r9")).toBeInTheDocument());
    expect(screen.getByTestId("set-rd-suggestion-0")).toHaveTextContent("/contact-us → /contact");
    expect(screen.queryByTestId("set-rd-suggestion-1")).toBeNull();
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("a refused Accept shows the screen's banner and the suggestion stays", async () => {
    r.create.mutate.mockRejectedValue(new Error("Redirect limit reached."));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-accept-1"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toHaveTextContent(SAVE_ERROR_MESSAGES.redirects!));
    expect(screen.getByTestId("set-rd-suggestion-1")).toBeInTheDocument();
    expect(r.list.query).toHaveBeenCalledTimes(1);
  });
});

describe("the Pages door — URL repair draft (3519:19920) → saved (3519:20096)", () => {
  const door = { pageId: "p-about", pageName: "About", from: "about", to: "about-us" };

  it("draws the draft above the Redirect rules card with the slugs as paths, and nothing when there is no door", async () => {
    setup();
    await loaded();
    expect(screen.queryByTestId("set-rd-repair")).toBeNull();
    cleanup();

    setup({ repair: door });
    await loaded();
    const draft = screen.getByTestId("set-rd-repair");
    expect(screen.getByRole("heading", { name: "Redirect for About" })).toBeInTheDocument();
    expect(screen.getByTestId("set-rd-repair-line")).toHaveTextContent("Bella Cucina · URL change /about → /about-us");
    expect((screen.getByTestId("set-rd-repair-from") as HTMLInputElement).value).toBe("/about");
    expect((screen.getByTestId("set-rd-repair-to") as HTMLInputElement).value).toBe("/about-us");
    const card = screen.getByTestId("set-card-redirect-rules");
    expect(draft.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Save redirect creates the 301, the draft becomes the saved card, the rule joins the table, and the shell is told", async () => {
    const onRepairDone = vi.fn();
    setup({ repair: door, onRepairDone });
    await loaded();
    r.list.query.mockResolvedValue([...SEEDED, row("r9", "/about", "/about-us")]);
    fireEvent.click(screen.getByTestId("set-rd-repair-save"));
    await waitFor(() => expect(r.create.mutate).toHaveBeenCalledWith({ siteId: "s1", fromPath: "/about", toUrl: "/about-us", type: "301" }));
    await waitFor(() => expect(screen.getByTestId("set-rd-repair-saved")).toBeInTheDocument());
    expect(screen.getByTestId("set-rd-repair-saved-line")).toHaveTextContent("/about → /about-us · 301");
    expect(screen.getByTestId("set-rd-repair-back")).toHaveTextContent("Back to About SEO");
    expect(screen.queryByTestId("set-rd-repair")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("set-rd-row-r9")).toBeInTheDocument());
    expect(onRepairDone).toHaveBeenCalledTimes(1);
  });

  it("the saved card survives the shell dropping `repair` after onRepairDone", async () => {
    const onRepairDone = vi.fn();
    const { rerender, props } = setup({ repair: door, onRepairDone });
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-repair-save"));
    await waitFor(() => expect(screen.getByTestId("set-rd-repair-saved")).toBeInTheDocument());
    rerender(<RedirectsScreen {...props} repair={null} />);
    expect(screen.getByTestId("set-rd-repair-saved")).toBeInTheDocument();
  });

  it("Back to <Page> SEO asks for that page's settings on the SEO tab — one event, StudioPanels does the tab switch — and the card goes", async () => {
    const { composer } = setup({ repair: door });
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-repair-save"));
    await waitFor(() => expect(screen.getByTestId("set-rd-repair-saved")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-rd-repair-back"));
    const emits = (composer.emit as ReturnType<typeof vi.fn>).mock.calls.filter(([e]) => String(e).startsWith("ui:"));
    expect(emits).toEqual([[EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId: "p-about", tab: "seo" }]]);
    expect(screen.queryByTestId("set-rd-repair-saved")).toBeNull();
  });

  it("a refused create stays inline in the draft — no banner, no saved card", async () => {
    r.create.mutate.mockRejectedValue(new Error("A redirect from /about already exists."));
    const onRepairDone = vi.fn();
    setup({ repair: door, onRepairDone });
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-repair-save"));
    await waitFor(() => expect(screen.getByTestId("set-rd-repair-error")).toHaveTextContent("A redirect from /about already exists."));
    expect(screen.queryByTestId("set-rd-repair-saved")).toBeNull();
    expect(screen.queryByTestId("set-save-error")).toBeNull();
    expect(onRepairDone).not.toHaveBeenCalled();
  });

  it("Cancel drops the draft and tells the shell", async () => {
    const onRepairDone = vi.fn();
    setup({ repair: door, onRepairDone });
    await loaded();
    fireEvent.click(screen.getByTestId("set-rd-repair-cancel"));
    expect(screen.queryByTestId("set-rd-repair")).toBeNull();
    expect(onRepairDone).toHaveBeenCalledTimes(1);
    expect(r.create.mutate).not.toHaveBeenCalled();
  });

  it("a shell that rebuilds the same door each render does not reset a half-edited draft; a new door does", async () => {
    const { rerender, props } = setup({ repair: door });
    await loaded();
    fireEvent.change(screen.getByTestId("set-rd-repair-to"), { target: { value: "/about-team" } });
    rerender(<RedirectsScreen {...props} repair={{ ...door }} />);
    expect((screen.getByTestId("set-rd-repair-to") as HTMLInputElement).value).toBe("/about-team");
    rerender(<RedirectsScreen {...props} repair={{ pageId: "p-story", pageName: "Our story", from: "/our-story", to: "/story" }} />);
    expect(screen.getByRole("heading", { name: "Redirect for Our story" })).toBeInTheDocument();
    expect((screen.getByTestId("set-rd-repair-to") as HTMLInputElement).value).toBe("/story");
  });
});
