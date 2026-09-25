/**
 * A-16 — the dashboard's own publish flow can never deploy (the worker
 * refuses a job with no page-HTML payload, which only the editor renders).
 * The page now redirects straight to the editor's Publish flow instead of
 * running a client flow that creates a job doomed to fail.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn();

class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.name = "RedirectError";
  }
}

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new RedirectError(url);
  },
}));

import PublishPage from "../page";

describe("dashboard sites/[id]/publish page", () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it("redirects to /edit/<id> — never creates a publish job", async () => {
    await expect(
      PublishPage({ params: Promise.resolve({ id: "site_123" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/edit/site_123");
  });

  it("URL-encodes the site id", async () => {
    await expect(
      PublishPage({ params: Promise.resolve({ id: "site with space" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/edit/site%20with%20space");
  });
});
