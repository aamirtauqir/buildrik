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

import { submitForReview } from "../ReviewService";

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
      clientEmail: undefined,
    });
  });

  // The wedge lives on this argument: with it, `submitReview` mints a token and
  // emails the client a signable link; without it the request never leaves the
  // internal queue. It was typed, validated and handled downstream for months
  // while this call dropped it — so the test asserts the address specifically.
  it("passes clientEmail through, which is what issues the review link", async () => {
    await submitForReview("have a look", "hero copy", "sara@bellacucina.com");
    expect(mutate).toHaveBeenCalledWith({
      siteId: "site-123",
      note: "have a look",
      changeSummary: "hero copy",
      clientEmail: "sara@bellacucina.com",
    });
  });

  it("omits the optional fields when not provided", async () => {
    await submitForReview();
    expect(mutate).toHaveBeenCalledWith({
      siteId: "site-123",
      note: undefined,
      changeSummary: undefined,
      clientEmail: undefined,
    });
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

/* A-22: currentSiteId was a byte-for-byte duplicate of
   BuildrikSyncProvider.getSiteIdFromUrl (minus its decode try/catch) — same
   intent, same rules, so per SSOT it's deleted and every importer (including
   this file's own submitForReview) repoints to the one helper. Its URL-
   parsing coverage already lives in
   buildrik-sync-provider.test.ts ("getSiteIdFromUrl" describes). */
