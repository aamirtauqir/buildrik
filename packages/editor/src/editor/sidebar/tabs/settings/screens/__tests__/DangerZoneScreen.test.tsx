/**
 * DangerZoneScreen tests — 8137:216600 (three cards), 8137:217085 archive
 * confirm → `sites.archive` (→ Unarchive), 8137:217348 transfer dialog →
 * `sites.transfer` → 8137:217625 toast, 8137:217905 → 8137:218168 delete →
 * `sites.delete` → the dashboard's Recently deleted.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api, addToast, deleteSite } = vi.hoisted(() => ({
  api: {
    sites: {
      get: { query: vi.fn() },
      archive: { mutate: vi.fn() },
      unarchive: { mutate: vi.fn() },
      transfer: { mutate: vi.fn() },
    },
    siteDetail: { domains: { list: { query: vi.fn() } } },
    team: { list: { query: vi.fn() } },
  },
  addToast: vi.fn(),
  deleteSite: vi.fn(),
}));

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ deleteSite }));
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast, removeToast: vi.fn() }),
}));

import { DangerZoneScreen, RECENTLY_DELETED_PATH } from "../DangerZoneScreen";

const assign = vi.fn();

beforeEach(() => {
  api.sites.get.query.mockReset().mockResolvedValue({ status: "PUBLISHED", publishedUrl: "https://bella.vercel.app" });
  api.siteDetail.domains.list.query.mockReset().mockResolvedValue([{ domain: "bellacucina.com", isPrimary: true, status: "VERIFIED" }]);
  api.sites.archive.mutate.mockReset().mockResolvedValue({});
  api.sites.unarchive.mutate.mockReset().mockResolvedValue({});
  api.sites.transfer.mutate.mockReset().mockResolvedValue({});
  api.team.list.query.mockReset().mockResolvedValue({
    data: [
      { userId: "u-own", fullName: "Owner Person", role: "OWNER" },
      { userId: "u-maria", fullName: "Maria Chen", role: "EDITOR" },
      { userId: "u-sam", fullName: "Sam Lee", role: "ADMIN" },
      { userId: "u-v", fullName: "Viewer", role: "VIEWER" },
    ],
  });
  addToast.mockReset();
  deleteSite.mockReset().mockResolvedValue(undefined);
  assign.mockReset();
  Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, assign } });
});
afterEach(() => cleanup());

function setup() {
  const composer = createMockComposer({ projectMetadata: { domain: null, name: "Bella Cucina" } });
  render(<DangerZoneScreen composer={composer} projectId="s1" />);
}
const loaded = () => waitFor(() => expect(screen.getByTestId("set-danger-archive")).toBeInTheDocument());

describe("DangerZoneScreen — 8137:216600", () => {
  it("draws Archive, Transfer and Delete with their lines; Delete names the live address", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-danger-archive")).toHaveTextContent("Hide this site from the Sites list. The live site stays up.");
    expect(screen.getByTestId("set-danger-transfer")).toHaveTextContent(
      "Transfer this site to another workspace member. The workspace owner or site creator can do this.",
    );
    expect(screen.getByTestId("set-danger-delete")).toHaveTextContent(
      "Unpublish bellacucina.com now. You can restore it from Recently deleted for 30 days.",
    );
    expect(screen.getByTestId("set-danger-archive-btn").id).toBe("danger-archive");
    expect(screen.getByTestId("set-danger-transfer-btn").id).toBe("danger-transfer");
    expect(screen.getByTestId("set-danger-delete-btn").id).toBe("danger-delete");
  });

  it("a site with nothing live does not claim to unpublish anything", async () => {
    api.sites.get.query.mockResolvedValue({ status: "DRAFT", publishedUrl: null });
    setup();
    await loaded();
    expect(screen.getByTestId("set-danger-delete")).toHaveTextContent("Delete this site. You can restore it from Recently deleted for 30 days.");
  });
});

describe("Archive — 8137:217085", () => {
  it("confirms, archives, toasts, and the card then offers Unarchive", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-danger-archive-btn"));
    expect(screen.getByRole("heading", { name: "Archive Bella Cucina?" })).toBeInTheDocument();
    expect(screen.getByTestId("set-danger-archive-dialog")).toHaveTextContent(
      "Bella Cucina will be hidden from the Sites list. The live site stays up. You can unarchive it later.",
    );
    fireEvent.click(screen.getByTestId("set-danger-archive-confirm"));
    await waitFor(() => expect(api.sites.archive.mutate).toHaveBeenCalledWith({ id: "s1" }));
    await waitFor(() => expect(screen.getByTestId("set-danger-unarchive-btn")).toBeInTheDocument());
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Site archived" }));
    fireEvent.click(screen.getByTestId("set-danger-unarchive-btn"));
    await waitFor(() => expect(api.sites.unarchive.mutate).toHaveBeenCalledWith({ id: "s1" }));
    await waitFor(() => expect(screen.getByTestId("set-danger-archive-btn")).toBeInTheDocument());
  });

  it("an archived site loads with Unarchive", async () => {
    api.sites.get.query.mockResolvedValue({ status: "ARCHIVED", publishedUrl: null });
    setup();
    await loaded();
    expect(screen.getByTestId("set-danger-unarchive-btn")).toBeInTheDocument();
  });
});

describe("Transfer — 8137:217348 → 8137:217625", () => {
  it("lists admins and editors, arms on the typed name, transfers and toasts the new owner", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-danger-transfer-btn"));
    await waitFor(() => expect(screen.getByTestId("set-danger-transfer-member")).toHaveValue("u-maria"));
    const options = Array.from(screen.getByTestId("set-danger-transfer-member").querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Maria Chen · Editor", "Sam Lee · Admin"]);
    const confirm = screen.getByTestId("set-danger-transfer-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type Bella Cucina to confirm"), { target: { value: "Bella Cucina" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(api.sites.transfer.mutate).toHaveBeenCalledWith({ siteId: "s1", newOwnerId: "u-maria" }));
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({ title: "Site transferred", description: "Bella Cucina now belongs to Maria Chen." }),
    );
    expect(screen.queryByTestId("set-danger-transfer-dialog")).toBeNull();
  });

  it("a refusal stays in the dialog with the server's sentence", async () => {
    api.sites.transfer.mutate.mockRejectedValue(new Error("Only the site owner can transfer."));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-danger-transfer-btn"));
    await waitFor(() => expect(screen.getByTestId("set-danger-transfer-member")).toHaveValue("u-maria"));
    fireEvent.change(screen.getByLabelText("Type Bella Cucina to confirm"), { target: { value: "Bella Cucina" } });
    fireEvent.click(screen.getByTestId("set-danger-transfer-confirm"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Only the site owner can transfer.");
    expect(screen.getByTestId("set-danger-transfer-dialog")).toBeInTheDocument();
  });
});

describe("Delete — 8137:217905 → 8137:218168", () => {
  it("names the live address, asks for DELETE, deletes with the site's name and leaves for Recently deleted", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-danger-delete-btn"));
    expect(screen.getByTestId("delete-site-line")).toHaveTextContent(
      "This unpublishes bellacucina.com now. You can restore it from Recently deleted for 30 days.",
    );
    fireEvent.click(screen.getByTestId("delete-site-confirm"));
    expect(deleteSite).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByTestId("delete-site-confirm"));
    await waitFor(() => expect(deleteSite).toHaveBeenCalledWith("s1", "Bella Cucina"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${RECENTLY_DELETED_PATH.replace("?", "\\?")}$`))));
  });
});
