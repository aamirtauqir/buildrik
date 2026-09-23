/**
 * PreviewShareModal — B1 / G1-022 (SH-43, SH-87), boards 4418:165739 (share
 * link) → 6930:82841 ("Link copied" toast).
 *
 * The link is a real draft share link: `siteDetail.sharing.list` is reused
 * when it holds an open link, otherwise `siteDetail.sharing.create` mints one.
 * The URL is `/share/<token>` — never `/share/<siteId>`, which is not a route.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";

const list = vi.fn();
const create = vi.fn();
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    siteDetail: { sharing: { list: { query: list }, create: { mutate: create } } },
  }),
}));

import { PreviewShareModal } from "../PreviewShareModal";

const link = (token: string, over: Record<string, unknown> = {}) => ({
  id: `id-${token}`,
  token,
  name: "Draft preview",
  passwordHash: null,
  expiresAt: null,
  ...over,
});

beforeEach(() => {
  list.mockReset();
  create.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderModal = (onOpenChange = vi.fn()) =>
  render(
    <ToastProvider>
      <PreviewShareModal open onOpenChange={onOpenChange} siteId="site-abc" />
    </ToastProvider>,
  );

describe("PreviewShareModal", () => {
  it("reuses an open share link and shows /share/<token>", async () => {
    list.mockResolvedValue([link("tok-open")]);
    renderModal();
    const row = await screen.findByTestId("preview-share-link");
    expect(row.textContent).toMatch(/\/share\/tok-open$/);
    expect(row.textContent).not.toContain("site-abc");
    expect(create).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledWith({ siteId: "site-abc" });
  });

  it("mints a link when every existing one is expired or password-locked", async () => {
    list.mockResolvedValue([
      link("tok-old", { expiresAt: new Date(Date.now() - 1000) }),
      link("tok-locked", { passwordHash: "x" }),
    ]);
    create.mockResolvedValue(link("tok-new"));
    renderModal();
    const row = await screen.findByTestId("preview-share-link");
    expect(row.textContent).toMatch(/\/share\/tok-new$/);
    expect(create).toHaveBeenCalledWith({ siteId: "site-abc", name: "Draft preview" });
  });

  it("a failed load says so and Try again reloads", async () => {
    list.mockRejectedValueOnce(new Error("Editors cannot create share links"));
    renderModal();
    expect(await screen.findByText(/couldn.t get a preview link/i)).toBeInTheDocument();
    expect(screen.getByText("Editors cannot create share links")).toBeInTheDocument();
    list.mockResolvedValueOnce([link("tok-retry")]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect((await screen.findByTestId("preview-share-link")).textContent).toMatch(/tok-retry$/);
  });

  it("Copy link puts the URL on the clipboard and toasts 'Link copied'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    list.mockResolvedValue([link("tok-copy")]);
    renderModal();
    await screen.findByTestId("preview-share-link");
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/share\/tok-copy$/)));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("Open ↗ opens the link in a new tab", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    list.mockResolvedValue([link("tok-open")]);
    renderModal();
    await screen.findByTestId("preview-share-link");
    fireEvent.click(screen.getByRole("button", { name: /open preview link in a new tab/i }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/share\/tok-open$/), "_blank", "noopener,noreferrer");
  });

  it("renders no raw form controls (Gate 24) — the link row is a <code>", async () => {
    list.mockResolvedValue([link("tok")]);
    renderModal();
    const row = await screen.findByTestId("preview-share-link");
    expect(row.tagName).toBe("CODE");
    expect(document.querySelectorAll("input, select, textarea").length).toBe(0);
  });
});
