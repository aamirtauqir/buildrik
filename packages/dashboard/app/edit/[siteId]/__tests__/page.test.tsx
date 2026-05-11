/**
 * Unification spec §550 — EditPage auth/permission gates.
 * - no session → redirect /auth/login?next=/edit/<id>
 * - non-member → notFound()
 * - member → renders EditorClient with siteId
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  userCanEditSite: (...args: unknown[]) => canEditMock(...args),
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

  it("URL-encodes siteId in the login redirect", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(
      EditPage({ params: Promise.resolve({ siteId: "abc def" }) }),
    ).rejects.toMatchObject({ name: "RedirectError" });
    expect(redirectMock).toHaveBeenCalledWith("/auth/login?next=/edit/abc%20def");
  });

  it("calls notFound() when user is not a workspace member", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce(false);
    await expect(
      EditPage({ params: Promise.resolve({ siteId: "abc" }) }),
    ).rejects.toMatchObject({ name: "NotFoundError" });
    expect(canEditMock).toHaveBeenCalledWith("user-1", "abc");
    expect(notFoundMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders EditorClient with siteId when authorized", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canEditMock.mockResolvedValueOnce(true);
    const node: any = await EditPage({
      params: Promise.resolve({ siteId: "abc" }),
    });
    // Server component returns a React element; we just verify its props
    // without rendering — siteId should flow through to EditorClient.
    expect(node?.props?.siteId).toBe("abc");
    expect(redirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
