// @vitest-environment jsdom
/**
 * The page trash view (A-21): list copy (142:53229), restore as a real server
 * call that adds the page back to the document, the new-slug ask (142:53954),
 * the plan-limit refusal (owner decision 2026-10-30), the typed permanent
 * delete (142:55781 → 142:56347) and the empty state (142:56910).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer, pg } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import type { Composer } from "@/engine";
import type { TrashedPage } from "@buildrik/shared/schemas/pages";

const remote = vi.hoisted(() => ({ list: vi.fn(), restore: vi.fn(), purge: vi.fn() }));
vi.mock("@/services/PageTrashService", () => ({ pageTrashRemote: remote }));

import { RecentlyDeletedView, trashRowMeta } from "../components/RecentlyDeletedView";

const about: TrashedPage = {
  id: "p_about",
  name: "About",
  slug: "about",
  deletedAt: new Date(),
  deletedBy: { id: "u1", name: "Ana", isYou: true },
  folderName: null,
};

const onRestored = vi.fn();
const onBack = vi.fn();
function mount(canPurge = true) {
  const composer = createMockComposer({ pages: [pg("p1", "Home", { isHome: true })] });
  render(
    <ToastProvider>
      <RecentlyDeletedView composer={composer as unknown as Composer} siteId="s1" canPurge={canPurge} onBack={onBack} onRestored={onRestored} />
    </ToastProvider>,
  );
  return composer;
}

beforeEach(() => {
  vi.clearAllMocks();
  remote.list.mockResolvedValue({ ok: true, value: [about] });
});
afterEach(cleanup);

describe("RecentlyDeletedView", () => {
  it("lists the server's trash with the board's copy", async () => {
    mount();
    expect(screen.getByText("Loading deleted pages…")).toBeInTheDocument();
    await screen.findByText("Recently deleted · 1");
    expect(screen.getByText("Deleted pages stay here for 30 days.")).toBeInTheDocument();
    expect(screen.getByText("/about · Top level")).toBeInTheDocument();
    expect(screen.getByText("Deleted by you · Today")).toBeInTheDocument();
    expect(screen.getByText("Restoring keeps the page’s URL and settings.")).toBeInTheDocument();
    expect(remote.list).toHaveBeenCalledWith("s1");
  });

  it("restores through the server, then adds the page to the document", async () => {
    remote.restore.mockResolvedValue({ ok: true, value: { id: "p_about", name: "About", slug: "about", root: { id: "r" } } });
    const composer = mount();
    fireEvent.click(await screen.findByTestId("pages-trash-restore"));
    await waitFor(() => expect(composer.elements.createPage).toHaveBeenCalledWith("About", expect.objectContaining({ id: "p_about", slug: "about" })));
    expect(remote.restore).toHaveBeenCalledWith("s1", "p_about", undefined);
    // The folders re-read: the server kept the page in its folder (142:68730).
    expect(onRestored).toHaveBeenCalledTimes(1);
    // 142:59972: back on the Pages list, with the receipt naming the URL.
    expect(await screen.findByText("About restored · /about")).toBeInTheDocument();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("asks for a new slug when the URL is taken, and restores with it", async () => {
    remote.restore
      .mockResolvedValueOnce({ ok: false, reason: "slug-taken", suggestedSlug: "about-2" })
      .mockResolvedValueOnce({ ok: true, value: { id: "p_about", name: "About", slug: "about-2", root: { id: "r" } } });
    mount();
    fireEvent.click(await screen.findByTestId("pages-trash-restore"));
    expect(await screen.findByText("Restore About with a new slug")).toBeInTheDocument();
    expect(screen.getByDisplayValue("about-2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore page" }));
    await waitFor(() => expect(remote.restore).toHaveBeenLastCalledWith("s1", "p_about", "about-2"));
    // 142:54521
    expect(await screen.findByText("About restored at /about-2 · Top level")).toBeInTheDocument();
  });

  it("shows the plan-limit refusal on the row and keeps it", async () => {
    remote.restore.mockResolvedValue({ ok: false, reason: "page-limit", message: "Delete a page or upgrade to restore." });
    const composer = mount();
    fireEvent.click(await screen.findByTestId("pages-trash-restore"));
    expect(await screen.findByTestId("pages-trash-row-error")).toHaveTextContent("Delete a page or upgrade to restore.");
    expect(composer.elements.createPage).not.toHaveBeenCalled();
    expect(screen.getByTestId("pages-trash-restore")).toHaveTextContent("Retry");
  });

  it("permanent delete needs the typed name", async () => {
    remote.purge.mockResolvedValue({ ok: true, value: { success: true } });
    mount();
    fireEvent.click(await screen.findByTestId("pages-trash-more"));
    fireEvent.click(screen.getByTestId("pages-trash-purge"));
    const confirm = screen.getByTestId("pages-trash-purge-confirm-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "About" } });
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(remote.purge).toHaveBeenCalledWith("s1", "p_about", "About"));
    expect(await screen.findByText("About permanently deleted")).toBeInTheDocument();
  });

  it("hides permanent delete below ADMIN", async () => {
    mount(false);
    await screen.findByText("Recently deleted · 1");
    expect(screen.queryByTestId("pages-trash-more")).toBeNull();
  });

  it("names another deleter and the caller's former folder (144:64795)", () => {
    expect(trashRowMeta({ ...about, folderName: "Client projects", deletedBy: { id: "u2", name: "Sam", isYou: false } })).toEqual({
      where: "/about · Client projects",
      who: "Deleted by Sam · Today",
    });
  });
});
