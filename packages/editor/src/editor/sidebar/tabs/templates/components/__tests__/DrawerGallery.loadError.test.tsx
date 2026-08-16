/**
 * DrawerGallery — the hydrate load-error block, board 781:4372.
 *
 * The hydrate path (server → editor "My Templates") used to catch, console.warn
 * and return, so a workspace whose saved templates failed to load was
 * indistinguishable from one that has none. These tests pin the two halves of
 * the fix: the panel says so, and the built-ins are still listed underneath —
 * which is what makes the board's "You can keep building from Insert." true
 * rather than a slogan.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const listQuery = vi.fn();

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({ userTemplates: { list: { query: listQuery } } }),
}));
vi.mock("@/services/ReviewService", () => ({ currentSiteId: () => "site-1" }));

import { DrawerGallery } from "../DrawerGallery";
import { hydrateUserTemplatesFromServer } from "@/services/templateSync";

const renderGallery = () =>
  render(
    <DrawerGallery searchQ="" onSearchChange={vi.fn()} onOpenTemplate={vi.fn()} />,
  );

beforeEach(() => {
  listQuery.mockReset();
  localStorage.clear();
});

describe("DrawerGallery — hydrate load error (board 781:4372)", () => {
  it("says nothing while the hydrate is healthy", async () => {
    listQuery.mockResolvedValue([]);
    await act(async () => {
      await hydrateUserTemplatesFromServer();
    });
    renderGallery();
    expect(screen.queryByTestId("tpl-load-error")).toBeNull();
  });

  it("surfaces the board's copy when the server pull fails", async () => {
    listQuery.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await hydrateUserTemplatesFromServer();
    });
    renderGallery();

    expect(screen.getByText("Couldn't load templates.")).toBeInTheDocument();
    expect(screen.getByText("You can keep building from Insert.")).toBeInTheDocument();
    expect(screen.getByTestId("tpl-load-retry")).toBeInTheDocument();
  });

  it("still lists the built-in catalog underneath the error", async () => {
    // The load-bearing half. A full-panel error would hide twelve templates
    // that are a static module array and cannot have failed, which would make
    // "You can keep building from Insert." a false statement about this panel.
    listQuery.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await hydrateUserTemplatesFromServer();
    });
    renderGallery();

    expect(screen.getByTestId("tpl-load-error")).toBeInTheDocument();
    expect(screen.getByText("PAGE TEMPLATES")).toBeInTheDocument();
    expect(screen.getByText("SaaS Landing")).toBeInTheDocument();
  });

  it("Try again re-runs the hydrate and clears the block on success", async () => {
    listQuery.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await hydrateUserTemplatesFromServer();
    });
    renderGallery();
    expect(screen.getByTestId("tpl-load-error")).toBeInTheDocument();

    listQuery.mockResolvedValue([]);
    await act(async () => {
      fireEvent.click(screen.getByTestId("tpl-load-retry"));
    });
    expect(screen.queryByTestId("tpl-load-error")).toBeNull();
  });
});
