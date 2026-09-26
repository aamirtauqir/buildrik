/**
 * Unification spec §550 — EditPage auth/permission gates.
 * - no session → redirect /auth/login?next=/edit/<id>
 * - no access (non-member, out of scope, or no such site) → the no-access
 *   screen with a way back, not the generic 404 (gap walk 93 #10)
 * - EDITOR+ → renders EditorClient with siteId
 * - VIEWER → redirected into read-only view mode, then renders (2026-09-24)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const authMock = vi.fn();
const canEditMock = vi.fn();
const redirectMock = vi.fn();
const notFoundMock = vi.fn();

// Next's real redirect()/notFound() throw to bail out of server components.
// Mirror that here so EditPage execution halts when these are called.
class RedirectError extends Error {
  constructor(public url: string) { super(`NEXT_REDIRECT:${url}`); this.name = "RedirectError"; }
}
class NotFoundError extends Error {
  constructor() { super("NEXT_NOT_FOUND"); this.name = "NotFoundError"; }
}

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new RedirectError(url);
  },
  notFound: () => {
    notFoundMock();
    throw new NotFoundError();
  },
}));

vi.mock("@server/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@server/services/sites.service", () => ({
  getEditorAccess: (...args: unknown[]) => canEditMock(...args),
}));

vi.mock("@/components/editor-route/EditorClient", () => ({
  EditorClient: ({ siteId }: { siteId: string }) => <div data-testid={`editor-${siteId}`} />,
}));

import EditPage from "../page";

describe("EditPage", () => {
  beforeEach(() => {
    authMock.mockReset();
    canEditMock.mockReset();
    redirectMock.mockReset();
    notFoundMock.mockReset();
  });

  it("redirects to login with next=/edit/<id> when no session", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(
      EditPage({ params: Promise.resolve({ siteId: "abc" }) }),
    ).rejects.toMatchObject({ name: "RedirectError" });
    expect(redirectMock).toHaveBeenCalledWith("/auth/login?next=/edit/abc");
    expect(canEditMock).not.toHaveBeenCalled();
  });

  it("preserves query params (el/page) in the login redirect", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(
      EditPage({
        params: Promise.resolve({ siteId: "abc" }),
        searchParams: Promise.resolve({ el: "node-1", page: "home" }),
      }),
    ).rejects.toMatchObject({ name: "RedirectError" });
    expect(redirectMock).toHaveBeenCalledWith(
      `/auth/login?next=/edit/abc${encodeURIComponent("?el=node-1&page=home")}`,
    );
  });

  it("URL-encodes siteId in the login redirect", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(
      EditPage({ params: Promise.resolve({ siteId: "abc def" }) }),
    ).rejects.toMatchObject({ name: "RedirectError" });
    expect(redirectMock).toHaveBeenCalledWith("/auth/login?next=/edit/abc%20def");
  });

  it("shows the no-access screen with a way back when the user has no access", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce(null);
    const node = await EditPage({ params: Promise.resolve({ siteId: "abc" }) });
    expect(canEditMock).toHaveBeenCalledWith("user-1", "abc");
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    render(node);
    expect(screen.getByRole("heading", { name: "You don't have access to this site" })).toBeTruthy();
    expect(screen.getByText(/may have been deleted, or you don't have access to it/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sites" })).toHaveAttribute("href", "/dashboard/projects");
    expect(screen.queryByTestId("editor-abc")).toBeNull();
  });

  it("renders EditorClient with siteId when authorized", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce("edit");
    const node: any = await EditPage({
      params: Promise.resolve({ siteId: "abc" }),
    });
    // Server component returns a React element; we just verify its props
    // without rendering — siteId should flow through to EditorClient.
    expect(node?.props?.siteId).toBe("abc");
    expect(redirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("sends a VIEWER into read-only view mode, keeping other params", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce("view");
    await expect(
      EditPage({
        params: Promise.resolve({ siteId: "abc" }),
        searchParams: Promise.resolve({ page: "home" }),
      }),
    ).rejects.toMatchObject({ name: "RedirectError" });
    expect(redirectMock).toHaveBeenCalledWith("/edit/abc?page=home&view=readonly");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders the editor for a VIEWER already in read-only view mode", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce("view");
    const node: any = await EditPage({
      params: Promise.resolve({ siteId: "abc" }),
      searchParams: Promise.resolve({ view: "readonly" }),
    });
    expect(node?.props?.siteId).toBe("abc");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
