/**
 * ReviewService — editor → dashboard "Send for review". Verifies the submit
 * carries the reviewer note + change-summary (the §16 "no input fields" fix) and
 * that it resolves the current site from the /edit/<id> URL, erroring when absent.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mutate = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ reviews: { submit: { mutate } } }),
}));

import { submitForReview, currentSiteId } from "../ReviewService";

beforeEach(() => {
  mutate.mockReset().mockResolvedValue(undefined);
  window.history.pushState({}, "", "/edit/site-123");
});

describe("submitForReview", () => {
  it("sends note + changeSummary for the current site", async () => {
    await submitForReview("please check the hero", "hero copy, 2 images");
    expect(mutate).toHaveBeenCalledWith({
      siteId: "site-123",
      note: "please check the hero",
      changeSummary: "hero copy, 2 images",
    });
  });

  it("omits the optional fields when not provided", async () => {
    await submitForReview();
    expect(mutate).toHaveBeenCalledWith({ siteId: "site-123", note: undefined, changeSummary: undefined });
  });

  it("throws when the URL has no site", async () => {
    window.history.pushState({}, "", "/edit/");
    await expect(submitForReview("x")).rejects.toThrow(/No site/);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("also resolves the site from the legacy ?siteId= URL", async () => {
    window.history.pushState({}, "", "/?siteId=legacy-9");
    await submitForReview("note");
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: "legacy-9", note: "note" })
    );
  });
});

describe("currentSiteId (URL parsing SSOT for the sync services)", () => {
  it("reads the unified-editor /edit/<id> path", () => {
    window.history.pushState({}, "", "/edit/site-abc");
    expect(currentSiteId()).toBe("site-abc");
  });

  it("decodes a percent-encoded path id", () => {
    window.history.pushState({}, "", "/edit/site%20one");
    expect(currentSiteId()).toBe("site one");
  });

  it("stops the path id at / ? and # boundaries", () => {
    window.history.pushState({}, "", "/edit/site-abc/settings?tab=seo#top");
    expect(currentSiteId()).toBe("site-abc");
  });

  it("falls back to the legacy ?siteId= query param", () => {
    window.history.pushState({}, "", "/?siteId=qs-1");
    expect(currentSiteId()).toBe("qs-1");
  });

  it("prefers the /edit/ path over a conflicting ?siteId=", () => {
    window.history.pushState({}, "", "/edit/path-wins?siteId=query-loses");
    expect(currentSiteId()).toBe("path-wins");
  });

  it("returns null outside the editor (no path id, no query param)", () => {
    window.history.pushState({}, "", "/dashboard");
    expect(currentSiteId()).toBeNull();
  });

  it("matches /edit/ anywhere in the path (nested prefixes still resolve)", () => {
    // Current behavior: the regex is unanchored, so a prefixed route still matches.
    window.history.pushState({}, "", "/app/edit/nested-1");
    expect(currentSiteId()).toBe("nested-1");
  });
});
